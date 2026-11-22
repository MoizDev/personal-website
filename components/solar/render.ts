/**
 * The solar system in ASCII, drawn faintly in the empty space above the row of
 * cards: the Sun boiling at the middle, planets going round on tilted orbits,
 * each a little sphere shaded by the Sun (so you see their day and night
 * sides), Earth with its continents turning and the Moon in tow, Jupiter's
 * bands, Saturn's rings passing in front of and behind it, the asteroid belt,
 * and a few twinkling stars.
 *
 * It's a canvas on a grid of character cells. Every frame each body is
 * "ray traced" cell by cell: a cell inside a sphere gets the sphere's normal,
 * the normal and the Sun's direction give a brightness, and the brightness
 * picks a character from a ramp. A depth buffer lets nearer things hide
 * farther ones (a planet passing in front of the Sun, a ring in front of its
 * planet). Orbits, the belt and the stars only fill the cells left empty.
 *
 * This module has no DOM in it: it runs in a worker on an OffscreenCanvas
 * (./solar.worker.ts), so drawing it never takes time from the page, or on the
 * page itself where workers can't draw (./loop.ts).
 *
 * Kept cheap per frame: the cells live in flat typed arrays (no objects or
 * colour strings made per cell), the canvas's colour changes once per colour
 * rather than once per character, and the fade on the left, which keeps the
 * drawing clear of the text, is worked into each character's opacity, so the
 * hidden ones aren't drawn at all.
 */

import type { Solar, ThemeLook } from "@/lib/solar";
import { DESIGN_H, DESIGN_W } from "@/lib/scale";

export type Rgb = [number, number, number];

const FONT_FAMILY = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

/** Characters from empty to full, for shading. */
const RAMP = " .,:;-=+*#%@";

type Planet = {
  /** orbit radius and own radius, in units (a unit is a thousandth of the canvas width) */
  orbit: number;
  r: number;
  /** seconds per orbit, and where it starts (radians) */
  period: number;
  phase: number;
  /** how it's painted */
  look: "plain" | "earth" | "jupiter" | "saturn";
  /** its colour (when the theme paints in colour; see ThemeLook.colour) */
  tint: Rgb;
};

const PLANETS: Planet[] = [
  { orbit: 92, r: 9, period: 31, phase: 2.4, look: "plain", tint: [150, 140, 130] }, // Mercury
  { orbit: 132, r: 15, period: 64, phase: 5.75, look: "plain", tint: [222, 160, 70] }, // Venus
  { orbit: 184, r: 28, period: 105, phase: 3.55, look: "earth", tint: [59, 130, 246] }, // Earth
  { orbit: 236, r: 13, period: 168, phase: 3.2, look: "plain", tint: [214, 88, 48] }, // Mars
  { orbit: 340, r: 44, period: 420, phase: 5.05, look: "jupiter", tint: [196, 140, 90] }, // Jupiter
  { orbit: 450, r: 30, period: 728, phase: 3.62, look: "saturn", tint: [214, 178, 110] }, // Saturn
];

const SUN_R = 46;

const SUN: Rgb = [245, 150, 20];
const SUN_EDGE: Rgb = [234, 88, 12];
const LAND: Rgb = [34, 160, 80];
const CITY: Rgb = [250, 200, 80];
const JUPITER_LIGHT: Rgb = [236, 214, 180];
const MOON = { orbit: 40, r: 6, period: 9 };
const BELT = { from: 268, to: 298, count: 320, period: 280 };
const STARS = 260;

/* ---------- a little noise, for the Sun's surface and Earth's land ---------- */

function hash3(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fy = y - yi;
  const fz = z - zi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  return lerp(
    lerp(
      lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u),
      lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u),
      v,
    ),
    lerp(
      lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u),
      lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u),
      v,
    ),
    w,
  );
}

function fbm(x: number, y: number, z: number) {
  return noise3(x, y, z) * 0.6 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.12;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
/** Greys run from near black to white. */
const DAY: Rgb = [255, 255, 255];
const NIGHT: Rgb = [14, 16, 20];
const BLACK: Rgb = [0, 0, 0];

/** A colour after the theme's vividness (saturation) and lightness. */
function shadeOf([r, g, b]: Rgb, look: ThemeLook): Rgb {
  const y = r * 0.299 + g * 0.587 + b * 0.114;
  const c: Rgb = [y + (r - y) * look.vivid, y + (g - y) * look.vivid, y + (b - y) * look.vivid];
  if (look.lightness > 0) return mix(c, DAY, Math.min(1, look.lightness));
  if (look.lightness < 0) return mix(c, BLACK, Math.min(1, -look.lightness));
  return c;
}

/**
 * A colour packed into one number, each channel rounded to a multiple of 4 (a
 * step too small to see at these opacities), so neighbouring cells share a
 * colour and the canvas changes colour less often.
 */
const pack = (c: Rgb) => ((clamp255(c[0]) & 0xfc) << 16) | ((clamp255(c[1]) & 0xfc) << 8) | (clamp255(c[2]) & 0xfc);

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

/** How fast the bodies fade to a new card's colour (seconds to get most of the way). */
const ACCENT_EASE = 0.3;

const ramp = (v: number) => RAMP[1 + Math.min(RAMP.length - 2, Math.floor(clamp01(v) * (RAMP.length - 1)))];

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function makeRenderer(canvas: Canvas, solar: Solar) {
  const ctx = canvas.getContext("2d") as Ctx;
  let cw = 5;
  let chh = 9;
  let cols = 0;
  let rows = 0;
  let W = 0;
  let H = 0;
  // the grid: a character, colour and opacity per cell, and a depth buffer;
  // an empty cell has no character
  let chs: (string | null)[] = [];
  let colors = new Int32Array(0);
  let alphas = new Float32Array(0);
  let zbuf = new Float32Array(0);
  /** how much of each column the fade on the left lets through */
  let colFade = new Float32Array(0);
  /** the cells drawn this frame, by colour; the lists are kept between frames */
  const byColor = new Map<number, number[]>();
  let ink: Rgb = [22, 22, 22];
  let dark = false;
  /**
   * The light theme paints the bodies in the colour of the card in the spot:
   * `accent` is that colour (null back at the row), and the drawing eases
   * `accentNow` toward it and `accentK` (how much of it shows) toward 1 or 0.
   */
  let accent: Rgb | null = null;
  let accentNow: Rgb = [0, 0, 0];
  let accentK = 0;
  let lastFrame = 0;
  /** the font and fade the grid was laid out with; when the panel changes them, lay it out again */
  let font = "";
  let fadeKey = "";
  /** the view's tilt: the sine and cosine of how steeply we look down onto the orbits */
  let S = 0.36;
  let C = Math.sqrt(1 - S * S);
  // stars and belt rocks, placed once
  const stars = Array.from({ length: STARS }, (_, i) => ({
    u: hash3(i, 1, 7),
    v: hash3(i, 2, 7),
    tw: hash3(i, 3, 7) * Math.PI * 2,
    sp: 0.4 + hash3(i, 4, 7) * 1.4,
  }));
  const rocks = Array.from({ length: BELT.count }, (_, i) => ({
    r: BELT.from + (BELT.to - BELT.from) * hash3(i, 5, 9),
    a: hash3(i, 6, 9) * Math.PI * 2,
    s: 0.85 + hash3(i, 7, 9) * 0.3,
  }));

  const look = () => (dark ? solar.dark : solar.light);
  /** the design frame's scale: SOLAR's sizes are in design pixels, so the drawing scales with the page */
  const frameK = () => Math.min(W / DESIGN_W, H / DESIGN_H);
  /** the character cell in CSS px */
  const cellPx = () => Math.max(1, solar.shared.cell * frameK());
  const fontFor = () => `${look().weight} ${cellPx().toFixed(2)}px ${FONT_FAMILY}`;
  const fadeFor = () => `${solar.shared.fadeFrom},${solar.shared.fadeTo},${W}`;

  /** The fade from the left: clear at fadeFrom (% of the design frame's width), full at fadeTo. */
  function layoutFade() {
    fadeKey = fadeFor();
    const fw = DESIGN_W * frameK();
    const fx = (W - fw) / 2;
    const from = fx + (fw * solar.shared.fadeFrom) / 100;
    const to = fx + (fw * solar.shared.fadeTo) / 100;
    colFade = new Float32Array(cols);
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * cw;
      colFade[i] = to > from ? clamp01((x - from) / (to - from)) : x >= to ? 1 : 0;
    }
  }

  /** Lay out the grid of cells for the canvas's size and the current font. */
  function layout() {
    const size = cellPx();
    font = fontFor();
    ctx.font = font;
    ctx.textBaseline = "top";
    cw = ctx.measureText("M").width || size * 0.6;
    chh = size * 1.2;
    // hidden or not laid out yet: an empty grid
    cols = W > 0 ? Math.ceil(W / cw) : 0;
    rows = H > 0 ? Math.ceil(H / chh) : 0;
    const n = cols * rows;
    chs = new Array(n).fill(null);
    colors = new Int32Array(n);
    alphas = new Float32Array(n);
    zbuf = new Float32Array(n);
    layoutFade();
  }

  /** The canvas's size in CSS px, and the screen's pixel ratio. */
  function resize(w: number, h: number, dpr: number) {
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // resizing a canvas resets its state
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function setTheme(rgb: Rgb, isDark: boolean) {
    ink = rgb;
    dark = isDark;
  }

  /** The card colour for the bodies; `instant` skips the fade (for a still drawing). */
  function setAccent(rgb: Rgb | null, instant: boolean) {
    if (rgb && accentK === 0) accentNow = rgb;
    accent = rgb;
    if (instant) {
      if (rgb) accentNow = rgb;
      accentK = rgb ? 1 : 0;
    }
  }

  /** Ease the card colour along by the time since the last frame. */
  function easeAccent() {
    const now = performance.now();
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    const e = 1 - Math.exp(-dt / ACCENT_EASE);
    if (accent) accentNow = mix(accentNow, accent, e);
    accentK += ((accent ? 1 : 0) - accentK) * e;
    if (Math.abs(accentK - (accent ? 1 : 0)) < 0.002) accentK = accent ? 1 : 0;
  }

  /** Set cell k. */
  function put(k: number, ch: string, color: number, alpha: number) {
    chs[k] = ch;
    colors[k] = color;
    alphas[k] = alpha;
  }

  /** Put a character in a cell if it's empty (for orbits, the belt, stars and glow). */
  function fill(i: number, j: number, ch: string, color: number, alpha: number) {
    if (i < 0 || j < 0 || i >= cols || j >= rows) return;
    const k = j * cols + i;
    if (chs[k] !== null) return;
    put(k, ch, color, alpha);
  }

  /** What a body's paint function gives for a cell: written into these, or false for nothing. */
  const out = { ch: "", color: 0, alpha: 0 };

  /**
   * Shade a sphere at screen (px, py), depth d0, radius r. `paint` gets the
   * surface normal in the world (x right, y up, z toward the viewer's side of
   * the plane) and the light on it, fills `out` and returns true, or returns
   * false to leave the cell.
   */
  function sphere(
    px: number,
    py: number,
    d0: number,
    r: number,
    sun: [number, number, number] | null,
    paint: (wx: number, wy: number, wz: number, lit: number, nz: number) => boolean,
  ) {
    let drew = false;
    const j0 = Math.max(0, Math.floor((py - r) / chh));
    const j1 = Math.min(rows - 1, Math.floor((py + r) / chh));
    const i0 = Math.max(0, Math.floor((px - r) / cw));
    const i1 = Math.min(cols - 1, Math.floor((px + r) / cw));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = ((i + 0.5) * cw - px) / r;
        const dy = ((j + 0.5) * chh - py) / r;
        const q = dx * dx + dy * dy;
        if (q > 1) continue;
        const nz = Math.sqrt(1 - q);
        const depth = d0 - nz * r;
        const k = j * cols + i;
        if (depth >= zbuf[k]) continue;
        // camera space normal is (dx, dy, -nz); back to the world
        const wx = dx;
        const wy = -dy * C + nz * S;
        const wz = dy * S + nz * C;
        const lit = sun ? Math.max(0, dx * sun[0] + dy * sun[1] - nz * sun[2]) : 1;
        if (!paint(wx, wy, wz, lit, nz)) continue;
        put(k, out.ch, out.color, out.alpha);
        zbuf[k] = depth;
        drew = true;
      }
    }
    // too small to cover a cell centre: still show it as a dot
    if (!drew) {
      const i = Math.floor(px / cw);
      const j = Math.floor(py / chh);
      if (i >= 0 && j >= 0 && i < cols && j < rows) {
        const k = j * cols + i;
        if (d0 < zbuf[k] && paint(0, 0, 1, 1, 1)) {
          put(k, r > 2.5 ? "o" : "·", out.color, out.alpha);
          zbuf[k] = d0;
        }
      }
    }
  }

  function frame(t: number) {
    const L0 = look();
    easeAccent();
    // light theme only: how much of the card's colour the bodies take
    const tintK = dark ? 0 : accentK;
    /** Write a body's cell into `out`, with the card's colour over it, at full opacity. */
    const tinted = (ch: string, color: Rgb, alpha: number) => {
      out.ch = ch;
      if (tintK > 0) {
        out.color = pack(mix(color, accentNow, tintK));
        out.alpha = alpha + (1 - alpha) * tintK;
      } else {
        out.color = pack(color);
        out.alpha = alpha;
      }
      return true;
    };
    const sh = solar.shared;
    if (fontFor() !== font) layout();
    else if (fadeFor() !== fadeKey) layoutFade();
    S = Math.max(0.02, Math.min(1, sh.tilt));
    C = Math.sqrt(1 - S * S);
    chs.fill(null);
    zbuf.fill(Infinity);
    // big: Saturn's orbit is nearly the width of the page. The Sun sits in the
    // open band above the row of cards, and the outer orbits sweep down behind it.
    // placed in the design frame (see lib/scale.ts), centred in the window like the rest of the page
    const k = frameK();
    const unit = Math.min(W / 1000, H / 560) * sh.size;
    const cx = (W - DESIGN_W * k) / 2 + DESIGN_W * k * sh.x;
    const cy = (H - DESIGN_H * k) / 2 + DESIGN_H * k * sh.y;
    const inkC = pack(shadeOf(ink, L0));
    const colour = clamp01(L0.colour);
    const contrast = (v: number) => clamp01(0.5 + (v - 0.5) * L0.contrast);
    /** A grey for a glyph of density d (0 to 1): with `invert` dense is dark, else dense is light. */
    const greyOf = (d: number): Rgb => mix(NIGHT, DAY, clamp01(L0.invert >= 0.5 ? 1 - d : d));
    /**
     * A cell on a body, from how bright that spot is (0 to 1), its colour and
     * opacity. In greys the shade agrees with the glyph's density (`tone`
     * scales it, so Earth's oceans sit lighter than its land); `colour` blends
     * from those greys to the body's own colour.
     */
    const body = (v: number, c: Rgb, alpha: number, tone = 1) => {
      const cv = contrast(v);
      return tinted(ramp(cv), shadeOf(mix(greyOf(cv * tone), c, colour), L0), (1 + (alpha - 1) * colour) * L0.bodies);
    };

    // world (x, z) on the plane of the orbits -> screen and depth
    const project = (x: number, z: number) => ({ sx: cx + x, sy: cy + z * S, d: -z * C });
    const sunLight = (x: number, z: number): [number, number, number] => {
      const lx = -x;
      const ly = -z * S;
      const lz = z * C;
      const l = Math.hypot(lx, ly, lz) || 1;
      return [lx / l, ly / l, lz / l];
    };

    /* the Sun: a boiling surface, brighter in the middle, and a glow around it */
    const sunR = SUN_R * unit * sh.sun;
    sphere(cx, cy, 0, sunR, null, (wx, wy, wz, _lit, nz) => {
      const boil = noise3(wx * 3.2 + t * 0.35, wy * 3.2 - t * 0.2, wz * 3.2);
      const v = 0.38 + nz * 0.42 + (boil - 0.5) * 0.5;
      return body(v, mix(SUN_EDGE, SUN, clamp01(nz * 1.2)), 0.55 + nz * 0.4);
    });

    /* the planets */
    const cityC = pack(shadeOf(CITY, L0));
    for (const p of PLANETS) {
      const a = p.phase + (t / p.period) * Math.PI * 2;
      const R = p.orbit * unit;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      const { sx, sy, d } = project(x, z);
      const r = p.r * unit * sh.planets;
      const L = sunLight(x, z);
      const spin = t * 0.5;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      const tint = p.tint;

      if (p.look === "saturn") rings(sx, sy, d, r, L, tint, L0, tinted);

      sphere(sx, sy, d, r, L, (wx, wy, wz, lit) => {
        const shade = 0.2 + lit * 0.8;
        if (p.look === "earth") {
          const rx = wx * cs - wz * sn;
          const rz = wx * sn + wz * cs;
          const ice = Math.abs(wy) > 0.84;
          const land = fbm(rx * 1.7 + 11, wy * 1.7 + 3, rz * 1.7 + 5) > 0.5;
          const col = ice ? ink : land ? LAND : tint;
          // the night side shows a few city lights on the land
          if (colour > 0.5 && lit < 0.03 && land && !ice && hash3(Math.floor(rx * 40), Math.floor(wy * 40), Math.floor(rz * 40)) > 0.8) {
            out.ch = ".";
            out.color = cityC;
            out.alpha = 0.7 * L0.bodies;
            return true;
          }
          return body(shade, col, 0.45 + lit * 0.55, ice ? 1.2 : land ? 1 : 0.62);
        }
        if (p.look === "jupiter") {
          const band = Math.sin(wy * 13 + noise3(wx * 3, wy * 3, wz * 3 + t * 0.05) * 2);
          const col = mix(tint, JUPITER_LIGHT, band * 0.5 + 0.5);
          return body(shade * (0.82 + band * 0.18), col, 0.45 + lit * 0.55);
        }
        return body(shade, tint, 0.45 + lit * 0.55);
      });

      if (p.look === "earth") {
        const ma = (t / MOON.period) * Math.PI * 2;
        const mx = x + Math.cos(ma) * MOON.orbit * unit;
        const mz = z + Math.sin(ma) * MOON.orbit * unit;
        const m = project(mx, mz);
        sphere(m.sx, m.sy, m.d, MOON.r * unit * sh.planets, sunLight(mx, mz), (_x, _y, _z, lit) =>
          body(0.2 + lit * 0.8, ink, 0.4 + lit * 0.5),
        );
      }
    }

    /* the Sun's glow: a steady halo of dots thinning outward, each one breathing slowly.
       Light, whatever the theme: the light theme's darkening is left off it so it shines white. */
    const glowC = dark ? pack(shadeOf(mix(DAY, SUN, colour), L0)) : pack(mix(DAY, SUN, colour));
    const glow = sunR * 2;
    for (let j = Math.floor((cy - glow) / chh); j <= Math.floor((cy + glow) / chh); j++) {
      for (let i = Math.floor((cx - glow) / cw); i <= Math.floor((cx + glow) / cw); i++) {
        const dist = Math.hypot((i + 0.5) * cw - cx, (j + 0.5) * chh - cy) / sunR;
        if (dist <= 1 || dist > 2) continue;
        const g = 2 - dist;
        if (hash3(i, j, 3) > g * g * 0.9) continue;
        const breathe = 0.6 + 0.4 * Math.sin(t * 1.3 + hash3(i, j, 4) * 6.28);
        fill(i, j, g > 0.7 ? ":" : "·", glowC, (0.12 + g * 0.45) * breathe * L0.glow);
      }
    }

    /* orbits: dotted ellipses, each dot on the part of its cell nearest the line */
    for (const p of PLANETS) {
      const R = p.orbit * unit;
      const n = Math.ceil((Math.PI * 2 * R) / (cw * 1.15));
      for (let q = 0; q < n; q++) {
        const a = (q / n) * Math.PI * 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R * S;
        const fy = y / chh - Math.floor(y / chh);
        // the far half of each orbit is a little fainter than the near half
        const near = Math.sin(a) > 0 ? 1 : 0.7;
        fill(Math.floor(x / cw), Math.floor(y / chh), fy < 0.34 ? "'" : fy < 0.67 ? "·" : ".", inkC, 0.22 * near * L0.orbits);
      }
    }

    /* the asteroid belt */
    for (const rock of rocks) {
      const a = rock.a + (t / (BELT.period * rock.s)) * Math.PI * 2;
      const R = rock.r * unit;
      const x = cx + Math.cos(a) * R;
      const y = cy + Math.sin(a) * R * S;
      fill(Math.floor(x / cw), Math.floor(y / chh), rock.s > 1.05 ? "." : "·", inkC, 0.26 * L0.orbits);
    }

    /* stars */
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.tw);
      const ch = tw > 0.96 ? "+" : tw > 0.75 ? "*" : "·";
      fill(Math.floor(s.u * cols), Math.floor(s.v * rows), ch, inkC, (0.08 + tw * 0.28) * L0.stars);
    }

    /* paint: one colour at a time, skipping what the fade hides */
    for (const list of byColor.values()) list.length = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const q = j * cols + i;
        const ch = chs[q];
        if (ch === null || ch === " ") continue;
        const a = alphas[q] * colFade[i];
        if (a < 0.004) continue;
        alphas[q] = a;
        let list = byColor.get(colors[q]);
        if (!list) byColor.set(colors[q], (list = []));
        list.push(q);
      }
    }
    ctx.clearRect(0, 0, W, H);
    for (const [color, list] of byColor) {
      if (!list.length) continue;
      ctx.fillStyle = cssOf(color);
      for (const q of list) {
        ctx.globalAlpha = alphas[q] > 1 ? 1 : alphas[q];
        ctx.fillText(chs[q]!, (q % cols) * cw, Math.floor(q / cols) * chh);
      }
    }
    ctx.globalAlpha = 1;
    // forget colours that have gone, so a long fade between cards doesn't pile them up
    if (byColor.size > 512) byColor.clear();
  }

  /** Saturn's rings: an annulus in a plane tipped toward us, with a gap in it. */
  function rings(
    px: number,
    py: number,
    d0: number,
    r: number,
    L: [number, number, number],
    tint: Rgb,
    look: ThemeLook,
    tinted: (ch: string, color: Rgb, alpha: number) => boolean,
  ) {
    const colour = clamp01(look.colour);
    const outer = r * 2.25;
    const inner = r * 1.3;
    const k = 0.36; // how open the rings look
    const tiltRing = -0.12; // a slight roll
    const cr = Math.cos(tiltRing);
    const sr = Math.sin(tiltRing);
    for (let j = Math.floor((py - outer * k - chh) / chh); j <= Math.floor((py + outer * k + chh) / chh); j++) {
      for (let i = Math.floor((px - outer) / cw); i <= Math.floor((px + outer) / cw); i++) {
        if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
        const x = (i + 0.5) * cw - px;
        const y = (j + 0.5) * chh - py;
        const ux = x * cr + y * sr;
        const uy = (-x * sr + y * cr) / k;
        const rho = Math.hypot(ux, uy);
        if (rho < inner || rho > outer) continue;
        const band = (rho - inner) / (outer - inner);
        if (band > 0.58 && band < 0.66) continue; // the Cassini division
        // the rings' near half sits in front of the planet, the far half behind
        const depth = d0 - (uy / outer) * r * 1.5;
        const kk = j * cols + i;
        if (depth >= zbuf[kk]) continue;
        // in the planet's shadow? (the side facing away from the Sun, behind the ball)
        const shadow = ux * L[0] + uy * L[1] < 0 && Math.abs(ux * L[1] - uy * L[0]) < r ? 0.35 : 1;
        // in greys, density: the lit ring dense near the planet, the shadow faint
        const density = shadow < 1 ? 0.15 : 0.9 - band * 0.4;
        const g = mix(NIGHT, DAY, look.invert >= 0.5 ? 1 - density : density);
        const alpha = (0.35 + 0.35 * (1 - band)) * shadow;
        tinted(band < 0.58 ? "=" : "-", shadeOf(mix(g, tint, colour), look), (1 + (alpha - 1) * colour) * look.bodies);
        put(kk, out.ch, out.color, out.alpha);
        zbuf[kk] = depth;
      }
    }
  }

  return { resize, frame, setTheme, setAccent };
}
