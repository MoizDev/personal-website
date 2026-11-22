/**
 * Puts the solar system's grid of characters (./render.ts works out which
 * character, colour and opacity goes in each cell) on its canvas.
 *
 * On the GPU where it can (WebGL2): the characters are drawn once into a
 * small atlas, and each frame the grid goes up as two small textures, one
 * byte per cell for the character and four for its colour and opacity, and a
 * single draw over the canvas looks up every pixel's cell and stamps its
 * character from the atlas. So a frame costs the same however many characters
 * are showing. Drawn with the 2D canvas instead, each character was its own
 * fillText, thousands a frame, and the GPU had to work through every one.
 *
 * Where WebGL2 isn't there, the 2D canvas still draws it, one colour at a
 * time, skipping the cells the fade hides.
 */

/** Every character the drawing uses. A cell holds its index here plus one; 0 is an empty cell. */
export const GLYPHS = " .,:;-=+*#%@'·o";

/** A character's code for a grid cell. */
export const glyph = (ch: string) => GLYPHS.indexOf(ch) + 1;

/** The grid for one frame: per cell, a glyph code, a packed 0xRRGGBB colour, and an opacity. */
export type Grid = {
  cols: number;
  rows: number;
  glyphs: Uint8Array;
  colors: Int32Array;
  alphas: Float32Array;
  /** how much of each column the fade on the left lets through */
  colFade: Float32Array;
};

export type Painter = {
  /** The canvas's size in CSS px and the screen's pixel ratio. */
  resize(w: number, h: number, dpr: number): void;
  /** The font's character width at this font, in CSS px. */
  measure(font: string): number;
  /** Lay out for a font, with cells cw by ch CSS px. */
  setFont(font: string, cw: number, ch: number): void;
  draw(g: Grid): void;
};

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** A 2D context for measuring and for drawing the atlas, kept apart from the canvas the sky goes on. */
function scratch2d(w = 1, h = 1): { canvas: Canvas; ctx: Ctx2D } {
  const canvas: Canvas =
    typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
  return { canvas, ctx: canvas.getContext("2d") as Ctx2D };
}

export function makePainter(canvas: Canvas): Painter {
  return makeGlPainter(canvas) ?? make2dPainter(canvas);
}

/* ---------- the GPU painter ---------- */

const VERT = `#version 300 es
void main() {
  // one triangle that covers the canvas
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;
uniform highp usampler2D uGlyphs; // per cell: its glyph code
uniform sampler2D uCells;         // per cell: colour and opacity
uniform sampler2D uAtlas;         // the glyphs, side by side; coverage in alpha
uniform vec2 uCell;               // a cell in device px
uniform float uCanvasH;           // the canvas's height in device px
uniform vec2 uSlot;               // a glyph's slot in the atlas, in device px
uniform vec2 uPad;                // the room around a glyph in its slot, in device px
uniform ivec2 uGrid;              // the grid's columns and rows
out vec4 outColor;

// this pixel's share of the glyph in cell n, coloured and premultiplied
vec4 stamp(ivec2 n, vec2 px) {
  if (n.x < 0 || n.y < 0 || n.x >= uGrid.x || n.y >= uGrid.y) return vec4(0.0);
  uint g = texelFetch(uGlyphs, n, 0).r;
  if (g == 0u) return vec4(0.0);
  vec2 local = px - vec2(n) * uCell + uPad;
  if (local.x < 0.0 || local.y < 0.0 || local.x >= uSlot.x || local.y >= uSlot.y) return vec4(0.0);
  vec4 c = texelFetch(uCells, n, 0);
  float a = texelFetch(uAtlas, ivec2(float(g - 1u) * uSlot.x + local.x, local.y), 0).a * c.a;
  return vec4(c.rgb * a, a);
}

void main() {
  // device px from the top left, as the 2D canvas counts them
  vec2 px = vec2(gl_FragCoord.x, uCanvasH - gl_FragCoord.y);
  ivec2 cell = ivec2(floor(px / uCell));
  // a glyph's ink can reach past its cell into the next one, as it does on
  // the 2D canvas, so the cells around are stamped too, this cell's on top
  vec4 o = vec4(0.0);
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      vec4 s = stamp(cell + ivec2(dx, dy), px);
      o = s + o * (1.0 - s.a);
    }
  }
  vec4 s = stamp(cell, px);
  o = s + o * (1.0 - s.a);
  if (o.a <= 0.0) discard;
  outColor = o;
}`;

function makeGlPainter(canvas: Canvas): Painter | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;

  const { ctx: measureCtx } = scratch2d();
  let dpr = 1;
  let font = "";
  let cw = 0;
  let ch = 0;
  let atlasFont = "";
  let cols = 0;
  let rows = 0;
  let glyphBuf = new Uint8Array(0);
  let cellBuf = new Uint8Array(0);
  let lost = false;

  let prog: WebGLProgram | null = null;
  let uCell: WebGLUniformLocation | null = null;
  let uCanvasH: WebGLUniformLocation | null = null;
  let uSlot: WebGLUniformLocation | null = null;
  let uPad: WebGLUniformLocation | null = null;
  let uGrid: WebGLUniformLocation | null = null;
  let glyphTex: WebGLTexture | null = null;
  let cellTex: WebGLTexture | null = null;
  let atlasTex: WebGLTexture | null = null;

  function shader(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    return s;
  }

  function texture(unit: number) {
    const t = gl!.createTexture();
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return t;
  }

  /** Make the program and textures; again after the GPU drops the context. Returns false if the shaders failed. */
  function setup() {
    const p = gl!.createProgram()!;
    gl!.attachShader(p, shader(gl!.VERTEX_SHADER, VERT));
    gl!.attachShader(p, shader(gl!.FRAGMENT_SHADER, FRAG));
    gl!.linkProgram(p);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) return false;
    prog = p;
    gl!.useProgram(p);
    gl!.bindVertexArray(gl!.createVertexArray());
    gl!.uniform1i(gl!.getUniformLocation(p, "uGlyphs"), 0);
    gl!.uniform1i(gl!.getUniformLocation(p, "uCells"), 1);
    gl!.uniform1i(gl!.getUniformLocation(p, "uAtlas"), 2);
    uCell = gl!.getUniformLocation(p, "uCell");
    uCanvasH = gl!.getUniformLocation(p, "uCanvasH");
    uSlot = gl!.getUniformLocation(p, "uSlot");
    uPad = gl!.getUniformLocation(p, "uPad");
    uGrid = gl!.getUniformLocation(p, "uGrid");
    glyphTex = texture(0);
    cellTex = texture(1);
    atlasTex = texture(2);
    gl!.pixelStorei(gl!.UNPACK_ALIGNMENT, 1);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.clearColor(0, 0, 0, 0);
    atlasFont = "";
    cols = rows = 0;
    return true;
  }

  if (!setup()) return null;

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = !setup();
  });

  /**
   * Draw each glyph white into its slot, at the screen's pixel size, as the 2D
   * canvas would draw it in a cell. A slot has half a cell of room on each
   * side, for ink that reaches past the cell (the shader stamps the cells
   * around each pixel, so up to half a cell of it shows).
   */
  function buildAtlas() {
    atlasFont = `${font}@${dpr}`;
    const px = Math.ceil((cw * dpr) / 2);
    const py = Math.ceil((ch * dpr) / 2);
    const sw = Math.ceil(cw * dpr) + px * 2;
    const sh = Math.ceil(ch * dpr) + py * 2;
    const { canvas: a, ctx } = scratch2d(sw * GLYPHS.length, sh);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = font;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    for (let i = 0; i < GLYPHS.length; i++) {
      // each glyph in its own slot, clipped to it, so a wide one can't bleed into the next
      ctx.save();
      ctx.beginPath();
      ctx.rect((i * sw) / dpr, 0, sw / dpr, sh / dpr);
      ctx.clip();
      ctx.fillText(GLYPHS[i], (i * sw + px) / dpr, py / dpr);
      ctx.restore();
    }
    gl!.activeTexture(gl!.TEXTURE2);
    gl!.bindTexture(gl!.TEXTURE_2D, atlasTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, gl!.RGBA, gl!.UNSIGNED_BYTE, a as TexImageSource);
    gl!.uniform2f(uSlot, sw, sh);
    gl!.uniform2f(uPad, px, py);
  }

  return {
    resize(w, h, d) {
      dpr = d;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    measure(f) {
      measureCtx.font = f;
      return measureCtx.measureText("M").width;
    },
    setFont(f, w, h) {
      font = f;
      cw = w;
      ch = h;
    },
    draw(g) {
      if (lost || !prog) return;
      if (`${font}@${dpr}` !== atlasFont) buildAtlas();
      if (g.cols !== cols || g.rows !== rows) {
        cols = g.cols;
        rows = g.rows;
        glyphBuf = new Uint8Array(cols * rows);
        cellBuf = new Uint8Array(cols * rows * 4);
        // the sizes change: allocate, then the frame fills them
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glyphTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, cols, rows, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, cellTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      // the grid as bytes; a cell the fade all but hides is left empty
      for (let j = 0, q = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++, q++) {
          const code = g.glyphs[q];
          const a = code > 1 ? g.alphas[q] * g.colFade[i] : 0;
          if (a < 0.004) {
            glyphBuf[q] = 0;
            continue;
          }
          glyphBuf[q] = code;
          const c = g.colors[q];
          const o = q * 4;
          cellBuf[o] = c >> 16;
          cellBuf[o + 1] = (c >> 8) & 255;
          cellBuf[o + 2] = c & 255;
          cellBuf[o + 3] = a >= 1 ? 255 : (a * 255 + 0.5) | 0;
        }
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, glyphTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED_INTEGER, gl.UNSIGNED_BYTE, glyphBuf);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, cellTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, cellBuf);
      gl.uniform2f(uCell, cw * dpr, ch * dpr);
      gl.uniform1f(uCanvasH, canvas.height);
      gl.uniform2i(uGrid, cols, rows);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

/* ---------- the 2D canvas painter, where WebGL2 isn't there ---------- */

/** The CSS for a packed colour, made once per colour rather than once per cell. */
const cssCache = new Map<number, string>();
function cssOf(c: number) {
  let s = cssCache.get(c);
  if (!s) {
    s = `rgb(${c >> 16},${(c >> 8) & 255},${c & 255})`;
    cssCache.set(c, s);
  }
  return s;
}

function make2dPainter(canvas: Canvas): Painter {
  const ctx = canvas.getContext("2d") as Ctx2D;
  let W = 0;
  let H = 0;
  let cw = 0;
  let ch = 0;
  /** the cells drawn this frame, by colour; the lists are kept between frames */
  const byColor = new Map<number, number[]>();
  return {
    resize(w, h, dpr) {
      W = w;
      H = h;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      // resizing a canvas resets its state
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    measure(f) {
      ctx.font = f;
      return ctx.measureText("M").width;
    },
    setFont(f, w, h) {
      ctx.font = f;
      ctx.textBaseline = "top";
      cw = w;
      ch = h;
    },
    draw(g) {
      for (const list of byColor.values()) list.length = 0;
      for (let j = 0, q = 0; j < g.rows; j++) {
        for (let i = 0; i < g.cols; i++, q++) {
          if (g.glyphs[q] <= 1) continue;
          const a = g.alphas[q] * g.colFade[i];
          if (a < 0.004) continue;
          g.alphas[q] = a;
          let list = byColor.get(g.colors[q]);
          if (!list) byColor.set(g.colors[q], (list = []));
          list.push(q);
        }
      }
      ctx.clearRect(0, 0, W, H);
      for (const [color, list] of byColor) {
        if (!list.length) continue;
        ctx.fillStyle = cssOf(color);
        for (const q of list) {
          ctx.globalAlpha = g.alphas[q] > 1 ? 1 : g.alphas[q];
          ctx.fillText(GLYPHS[g.glyphs[q] - 1], (q % g.cols) * cw, Math.floor(q / g.cols) * ch);
        }
      }
      ctx.globalAlpha = 1;
      // forget colours that have gone, so a long fade between cards doesn't pile them up
      if (byColor.size > 512) byColor.clear();
    },
  };
}
