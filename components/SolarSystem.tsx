"use client";

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
 */

import { useEffect, useRef } from "react";

/** The character cell, in CSS px. */
const FONT = 8;
const FONT_FAMILY = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

/** How steeply we look down onto the plane of the orbits: the sine and cosine of that angle. */
const S = 0.36;
const C = Math.sqrt(1 - S * S);

/** Characters from empty to full, for shading. */
const RAMP = " .,:;-=+*#%@";

/** Frames per second; it's a slow background, so it needn't be more. */
const FPS = 30;

type Rgb = [number, number, number];

type Planet = {
  /** orbit radius and own radius, in units (a unit is a thousandth of the canvas width) */
  orbit: number;
  r: number;
  /** seconds per orbit, and where it starts (radians) */
  period: number;
  phase: number;
  /** how it's painted */
  look: "plain" | "earth" | "jupiter" | "saturn";
  /** its colour on the dark theme, and a deeper one that holds up on white */
  tint: { dark: Rgb; light: Rgb };
};

const PLANETS: Planet[] = [
  { orbit: 92, r: 9, period: 31, phase: 2.4, look: "plain", tint: { dark: [150, 140, 130], light: [87, 83, 78] } }, // Mercury
  { orbit: 132, r: 15, period: 64, phase: 5.75, look: "plain", tint: { dark: [222, 160, 70], light: [180, 83, 9] } }, // Venus
  { orbit: 184, r: 25, period: 105, phase: 3.55, look: "earth", tint: { dark: [59, 130, 246], light: [29, 78, 216] } }, // Earth
  { orbit: 236, r: 13, period: 168, phase: 3.2, look: "plain", tint: { dark: [214, 88, 48], light: [185, 28, 28] } }, // Mars
  { orbit: 340, r: 40, period: 420, phase: 5.05, look: "jupiter", tint: { dark: [196, 140, 90], light: [146, 64, 14] } }, // Jupiter
  { orbit: 450, r: 30, period: 728, phase: 3.62, look: "saturn", tint: { dark: [214, 178, 110], light: [161, 98, 7] } }, // Saturn
];

const SUN_R = 46;

/** The colours that aren't a planet's own, per theme. */
type Palette = { sun: Rgb; sunEdge: Rgb; land: Rgb; city: Rgb; jupiterLight: Rgb; alpha: number; weight: number };
const PALETTES: Record<"dark" | "light", Palette> = {
  dark: { sun: [245, 150, 20], sunEdge: [234, 88, 12], land: [34, 160, 80], city: [250, 200, 80], jupiterLight: [236, 214, 180], alpha: 1, weight: 400 },
  // on white, light tints and thin glyphs wash out, so: deeper colours, bolder type, more opacity
  light: { sun: [234, 88, 12], sunEdge: [194, 50, 12], land: [21, 128, 61], city: [202, 138, 4], jupiterLight: [217, 119, 6], alpha: 1.4, weight: 600 },
};
const MOON = { orbit: 40, r: 6, period: 9 };
const BELT = { from: 268, to: 298, count: 320, period: 280 };
const STARS = 170;

/* ---------- a little noise, for the Sun's surface and Earth's land ---------- */

function hash3(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

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
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

function fbm(x: number, y: number, z: number) {
  return noise3(x, y, z) * 0.6 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.12;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = ([r, g, b]: Rgb) => `rgb(${r | 0},${g | 0},${b | 0})`;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ramp = (v: number) => RAMP[1 + Math.min(RAMP.length - 2, Math.floor(clamp01(v) * (RAMP.length - 1)))];

/* ---------- the renderer ---------- */

type Cell = { ch: string; color: string; alpha: number };

function makeRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let cw = 5;
  let chh = 9;
  let cols = 0;
  let rows = 0;
  let W = 0;
  let H = 0;
  let cells: (Cell | null)[] = [];
  let zbuf = new Float32Array(0);
  let ink: Rgb = [22, 22, 22];
  let theme: "dark" | "light" = "light";
  let pal = PALETTES.light;
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

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${pal.weight} ${FONT}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    cw = ctx.measureText("M").width || FONT * 0.6;
    chh = Math.round(FONT * 1.2);
    cols = Math.ceil(W / cw);
    rows = Math.ceil(H / chh);
    cells = new Array(cols * rows).fill(null);
    zbuf = new Float32Array(cols * rows);
  }

  function setTheme(rgb: Rgb, dark: boolean) {
    ink = rgb;
    theme = dark ? "dark" : "light";
    pal = PALETTES[theme];
    ctx.font = `${pal.weight} ${FONT}px ${FONT_FAMILY}`;
  }

  /** Put a character in a cell if it's empty (for orbits, the belt, stars and glow). */
  function fill(i: number, j: number, ch: string, color: string, alpha: number) {
    if (i < 0 || j < 0 || i >= cols || j >= rows) return;
    const k = j * cols + i;
    if (cells[k]) return;
    cells[k] = { ch, color, alpha };
  }

  /**
   * Shade a sphere at screen (px, py), depth d0, radius r. `paint` gets the
   * surface normal in the world (x right, y up, z toward the viewer's side of
   * the plane) and the light on it, and returns the cell.
   */
  function sphere(
    px: number,
    py: number,
    d0: number,
    r: number,
    light: [number, number, number] | null,
    paint: (wx: number, wy: number, wz: number, lit: number, nz: number) => Cell | null,
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
        const lit = light ? Math.max(0, dx * light[0] + dy * light[1] - nz * light[2]) : 1;
        const cell = paint(wx, wy, wz, lit, nz);
        if (!cell) continue;
        cells[k] = cell;
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
        if (d0 < zbuf[k]) {
          const cell = paint(0, 0, 1, 1, 1);
          if (cell) {
            cells[k] = { ...cell, ch: r > 2.5 ? "o" : "·" };
            zbuf[k] = d0;
          }
        }
      }
    }
  }

  function frame(t: number) {
    cells.fill(null);
    zbuf.fill(Infinity);
    const unit = W / 1000;
    const cx = W * 0.6;
    const cy = Math.min(Math.max(H * 0.17, 110), 170);
    const inkCss = css(ink);

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
    const sunR = SUN_R * unit;
    sphere(cx, cy, 0, sunR, null, (wx, wy, wz, _lit, nz) => {
      const boil = noise3(wx * 3.2 + t * 0.35, wy * 3.2 - t * 0.2, wz * 3.2);
      const v = 0.38 + nz * 0.42 + (boil - 0.5) * 0.5;
      return { ch: ramp(v), color: css(mix(pal.sunEdge, pal.sun, clamp01(nz * 1.2))), alpha: 0.55 + nz * 0.4 };
    });

    /* the planets */
    for (const p of PLANETS) {
      const a = p.phase + (t / p.period) * Math.PI * 2;
      const R = p.orbit * unit;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      const { sx, sy, d } = project(x, z);
      const r = p.r * unit;
      const L = sunLight(x, z);
      const spin = t * 0.5;
      const tint = p.tint[theme];

      if (p.look === "saturn") rings(sx, sy, d, r, L, tint);

      sphere(sx, sy, d, r, L, (wx, wy, wz, lit) => {
        const shade = 0.2 + lit * 0.8;
        if (p.look === "earth") {
          const c = Math.cos(spin);
          const s = Math.sin(spin);
          const rx = wx * c - wz * s;
          const rz = wx * s + wz * c;
          const ice = Math.abs(wy) > 0.84;
          const land = fbm(rx * 1.7 + 11, wy * 1.7 + 3, rz * 1.7 + 5) > 0.5;
          const col = ice ? ink : land ? pal.land : tint;
          // the night side shows a few city lights on the land
          if (lit < 0.03 && land && !ice && hash3(Math.floor(rx * 40), Math.floor(wy * 40), Math.floor(rz * 40)) > 0.8) {
            return { ch: ".", color: css(pal.city), alpha: 0.7 };
          }
          return { ch: ramp(shade), color: css(col), alpha: 0.45 + lit * 0.55 };
        }
        if (p.look === "jupiter") {
          const band = Math.sin(wy * 13 + noise3(wx * 3, wy * 3, wz * 3 + t * 0.05) * 2);
          const col = mix(tint, pal.jupiterLight, band * 0.5 + 0.5);
          return { ch: ramp(shade * (0.82 + band * 0.18)), color: css(col), alpha: 0.45 + lit * 0.55 };
        }
        return { ch: ramp(shade), color: css(tint), alpha: 0.45 + lit * 0.55 };
      });

      if (p.look === "earth") {
        const ma = (t / MOON.period) * Math.PI * 2;
        const mx = x + Math.cos(ma) * MOON.orbit * unit;
        const mz = z + Math.sin(ma) * MOON.orbit * unit;
        const m = project(mx, mz);
        sphere(m.sx, m.sy, m.d, MOON.r * unit, sunLight(mx, mz), (_x, _y, _z, lit) => ({
          ch: ramp(0.2 + lit * 0.8),
          color: inkCss,
          alpha: 0.4 + lit * 0.5,
        }));
      }
    }

    /* the Sun's glow: a steady halo of dots thinning outward, each one breathing slowly */
    const glow = sunR * 2;
    for (let j = Math.floor((cy - glow) / chh); j <= Math.floor((cy + glow) / chh); j++) {
      for (let i = Math.floor((cx - glow) / cw); i <= Math.floor((cx + glow) / cw); i++) {
        const dist = Math.hypot((i + 0.5) * cw - cx, (j + 0.5) * chh - cy) / sunR;
        if (dist <= 1 || dist > 2) continue;
        const k = 2 - dist;
        if (hash3(i, j, 3) > k * k * 0.9) continue;
        const breathe = 0.6 + 0.4 * Math.sin(t * 1.3 + hash3(i, j, 4) * 6.28);
        fill(i, j, k > 0.7 ? ":" : "·", css(pal.sun), (0.12 + k * 0.45) * breathe);
      }
    }

    /* orbits: dotted ellipses, each dot on the part of its cell nearest the line */
    for (const p of PLANETS) {
      const R = p.orbit * unit;
      const n = Math.ceil((Math.PI * 2 * R) / (cw * 1.15));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R * S;
        const fy = y / chh - Math.floor(y / chh);
        // the far half of each orbit is a little fainter than the near half
        const near = Math.sin(a) > 0 ? 1 : 0.7;
        fill(Math.floor(x / cw), Math.floor(y / chh), fy < 0.34 ? "'" : fy < 0.67 ? "·" : ".", inkCss, 0.22 * near);
      }
    }

    /* the asteroid belt */
    for (const rock of rocks) {
      const a = rock.a + (t / (BELT.period * rock.s)) * Math.PI * 2;
      const R = rock.r * unit;
      const x = cx + Math.cos(a) * R;
      const y = cy + Math.sin(a) * R * S;
      fill(Math.floor(x / cw), Math.floor(y / chh), rock.s > 1.05 ? "." : "·", inkCss, 0.26);
    }

    /* stars */
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.tw);
      const ch = tw > 0.96 ? "+" : tw > 0.75 ? "*" : "·";
      fill(Math.floor(s.u * cols), Math.floor(s.v * rows), ch, inkCss, 0.08 + tw * 0.28);
    }

    /* paint */
    ctx.clearRect(0, 0, W, H);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = cells[j * cols + i];
        if (!c || c.ch === " ") continue;
        ctx.globalAlpha = Math.min(1, c.alpha * pal.alpha);
        ctx.fillStyle = c.color;
        ctx.fillText(c.ch, i * cw, j * chh);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Saturn's rings: an annulus in a plane tipped toward us, with a gap in it. */
  function rings(px: number, py: number, d0: number, r: number, L: [number, number, number], tint: Rgb) {
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
        cells[kk] = { ch: band < 0.58 ? "=" : "-", color: css(tint), alpha: (0.35 + 0.35 * (1 - band)) * shadow };
        zbuf[kk] = depth;
      }
    }
  }

  return { resize, frame, setTheme };
}

export function SolarSystem() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const r = makeRenderer(canvas);

    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--ink-rgb");
      const parts = v.split(",").map((n) => parseFloat(n));
      const dark = document.documentElement.dataset.theme === "dark";
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) r.setTheme(parts as Rgb, dark);
    };
    readInk();
    r.resize();

    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    // a fixed moment, for reduced motion: the planets spread out nicely
    const STILL_T = 40;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS - 2) return;
      last = now;
      r.frame((now - start) / 1000);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (still.matches) r.frame(STILL_T);
      else raf = requestAnimationFrame(loop);
    };
    run();

    const ro = new ResizeObserver(() => {
      r.resize();
      if (still.matches) r.frame(STILL_T);
    });
    ro.observe(canvas);
    const mo = new MutationObserver(() => {
      readInk();
      if (still.matches) r.frame(STILL_T);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    still.addEventListener("change", run);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      still.removeEventListener("change", run);
    };
  }, []);

  return <canvas className="solar" ref={ref} aria-hidden />;
}
