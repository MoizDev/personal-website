/**
 * Runs the solar system's drawing (./render.ts) from messages: its size, the
 * theme, the card colour, the dev panel's values, and whether it's showing.
 * The same loop runs in the worker (./solar.worker.ts) or, where a canvas
 * can't be handed to a worker, on the page; SolarSystem.tsx only sends
 * messages, so it doesn't care which.
 */

import type { Solar } from "@/lib/solar";
import { makeRenderer, type Rgb } from "./render";

export type SolarMsg =
  | { type: "size"; w: number; h: number; dpr: number }
  | { type: "theme"; ink: Rgb; dark: boolean }
  | { type: "accent"; rgb: Rgb | null; instant: boolean }
  | { type: "solar"; solar: Solar }
  /** `still`: reduced motion, one fixed drawing instead of the animation */
  | { type: "run"; visible: boolean; still: boolean };

/** Frames per second; it's a slow background, so it needn't be more. */
const FPS = 30;
/** a fixed moment, for reduced motion: the planets spread out nicely */
const STILL_T = 40;

type Frame = (cb: (now: number) => void) => number;

export function makeLoop(canvas: HTMLCanvasElement | OffscreenCanvas, solar: Solar) {
  const live: Solar = { shared: { ...solar.shared }, light: { ...solar.light }, dark: { ...solar.dark } };
  const r = makeRenderer(canvas, live);
  // a worker without requestAnimationFrame (older Safari) ticks on a timer
  const g = globalThis as unknown as { requestAnimationFrame?: Frame; cancelAnimationFrame?: (id: number) => void };
  const raf: Frame = g.requestAnimationFrame
    ? g.requestAnimationFrame.bind(globalThis)
    : (cb) => setTimeout(() => cb(performance.now()), 1000 / FPS) as unknown as number;
  const caf = g.cancelAnimationFrame ? g.cancelAnimationFrame.bind(globalThis) : (id: number) => clearTimeout(id);

  let sized = false;
  let visible = false;
  let still = false;
  // the scene's own clock, so changing the speed doesn't make it jump
  let t = 0;
  let id = 0;
  let last = 0;
  let prev = 0;

  const tick = (now: number) => {
    id = raf(tick);
    if (now - last < 1000 / FPS - 2) return;
    last = now;
    // a hidden tab pauses frames; don't leap ahead when it comes back
    t += Math.min(0.1, prev ? (now - prev) / 1000 : 0) * live.shared.speed;
    prev = now;
    r.frame(t);
  };

  /** The fixed drawing, tried again each frame until the painter can draw it (its shaders compiling). */
  const drawStill = () => {
    caf(id);
    id = r.frame(STILL_T) ? 0 : raf(drawStill);
  };

  function run() {
    caf(id);
    id = 0;
    prev = 0;
    if (!sized) return;
    if (still) drawStill();
    else if (visible) id = raf(tick);
  }

  /** A change while still: draw it again. (While animating, the next frame picks it up.) */
  const redraw = () => {
    if (sized && still) drawStill();
  };

  /**
   * A change that shows across the whole drawing at once (the theme): draw it
   * now, even while animating, so it lands with the page's own change rather
   * than up to a frame behind it.
   */
  const redrawNow = () => {
    if (!sized) return;
    if (still) drawStill();
    else if (visible) r.frame(t);
  };

  return function onMessage(m: SolarMsg) {
    switch (m.type) {
      case "size":
        r.resize(m.w, m.h, m.dpr);
        sized = m.w > 0 && m.h > 0;
        run();
        break;
      case "theme":
        r.setTheme(m.ink, m.dark);
        redrawNow();
        break;
      case "accent":
        r.setAccent(m.rgb, m.instant || still);
        redraw();
        break;
      case "solar":
        Object.assign(live.shared, m.solar.shared);
        Object.assign(live.light, m.solar.light);
        Object.assign(live.dark, m.solar.dark);
        redraw();
        break;
      case "run":
        visible = m.visible;
        still = m.still;
        run();
        break;
    }
  };
}
