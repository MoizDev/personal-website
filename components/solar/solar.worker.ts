/**
 * Draws the solar system off the page's thread, on a canvas handed over by
 * SolarSystem.tsx, so the drawing never costs the cards a frame. The first
 * message brings the canvas and the starting values; the rest are SolarMsg.
 */

import type { Solar } from "@/lib/solar";
import { makeLoop, type SolarMsg } from "./loop";

let onMessage: ((m: SolarMsg) => void) | null = null;

self.onmessage = (e: MessageEvent<SolarMsg | { type: "init"; canvas: OffscreenCanvas; solar: Solar }>) => {
  const m = e.data;
  if (m.type === "init") onMessage = makeLoop(m.canvas, m.solar);
  else onMessage?.(m);
};
