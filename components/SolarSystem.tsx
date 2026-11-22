"use client";

/**
 * The ASCII solar system in the background (drawn by ./solar/render.ts), with
 * the sky wash and the dark theme's corner glow, all in the colour of the card
 * in the spot.
 *
 * The drawing runs in a worker on an OffscreenCanvas, so it never takes time
 * from the cards; where a canvas can't go to a worker it runs here instead.
 * It only starts once it's on screen, so phones, which hide it, never run it.
 */

import { useEffect, useRef } from "react";
import { SOLAR, SOLAR_EVENT } from "@/lib/solar";
import { makeLoop, type SolarMsg } from "@/components/solar/loop";
import type { Rgb } from "@/components/solar/render";
import { onProjectTone, projectTone } from "@/lib/tone";

/** "#rrggbb" to rgb, or null. */
function hexRgb(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

/**
 * Start the drawing on `canvas`: in a worker if the browser can hand a canvas
 * to one, else here. Returns how to send it messages and how to stop it.
 */
function startDrawing(canvas: HTMLCanvasElement): { send: (m: SolarMsg) => void; stop: () => void } {
  const solar = JSON.parse(JSON.stringify(SOLAR));
  if (typeof canvas.transferControlToOffscreen === "function" && typeof Worker !== "undefined") {
    try {
      const offscreen = canvas.transferControlToOffscreen();
      const worker = new Worker(new URL("./solar/solar.worker.ts", import.meta.url), { type: "module" });
      worker.postMessage({ type: "init", canvas: offscreen, solar }, [offscreen]);
      return { send: (m) => worker.postMessage(m), stop: () => worker.terminate() };
    } catch {
      // fall through: draw here
    }
  }
  const onMessage = makeLoop(canvas, solar);
  return { send: onMessage, stop: () => onMessage({ type: "run", visible: false, still: false }) };
}

/** How long the sky and corner glow take to fade to a new colour (the CSS transition on their layers). */
const TONE_FADE_MS = 900;

/**
 * Fades a box of two colour layers (the sky, the corner glow) to new colours
 * by crossfading them: the hidden layer takes the new colour and fades in over
 * the other, so each colour is painted once rather than on every frame of the
 * fade. A colour asked for mid-fade waits for the fade to end, and only the
 * last one asked for is shown. `fallback` is the colour with no card in the spot.
 */
function makeToneFade(box: HTMLElement, fallback: string) {
  const layers = Array.from(box.children) as HTMLElement[];
  let front = 0;
  let shown = "";
  let pending = "";
  let timer = 0;
  const show = (tone: string, instant = false) => {
    const c = tone || fallback;
    if (instant) {
      clearTimeout(timer);
      timer = 0;
      pending = "";
      for (const l of layers) l.style.setProperty("--tone", c);
      shown = c;
      return;
    }
    if (timer) {
      pending = c;
      return;
    }
    if (c === shown) return;
    front = 1 - front;
    layers[front].style.setProperty("--tone", c);
    box.dataset.front = String(front);
    shown = c;
    timer = window.setTimeout(() => {
      timer = 0;
      const next = pending;
      pending = "";
      if (next) show(next);
    }, TONE_FADE_MS);
  };
  return { show, stop: () => clearTimeout(timer) };
}

/**
 * `tone` fixes the colour (a writeup, in its project's colour); without it the
 * drawing follows the card in the spot on the home page.
 */
export function SolarSystem({ tone }: { tone?: string } = {}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const sky = skyRef.current;
    const glow = glowRef.current;
    if (!box || !sky || !glow) return;
    const root = document.documentElement;
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    // the canvas is made here, not rendered, because it can be handed to a
    // worker only once and an effect may run more than once on the same element
    let drawing: ReturnType<typeof startDrawing> | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let visible = false;
    const send = (m: SolarMsg) => drawing?.send(m);

    /** The theme's ink, and the sky, which live in CSS. */
    const readTheme = () => {
      const parts = getComputedStyle(root).getPropertyValue("--ink-rgb").split(",").map((n) => parseFloat(n));
      const dark = root.dataset.theme === "dark";
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) send({ type: "theme", ink: parts as Rgb, dark });
      const look = dark ? SOLAR.dark : SOLAR.light;
      sky.style.opacity = String(look.sky);
      sky.style.visibility = look.sky > 0 ? "" : "hidden";
      sky.style.setProperty("--sky-hue", String(look.skyHue));
    };

    /** The colour of the card in the spot (lib/tone). */
    const skyFade = makeToneFade(sky, "hsl(calc(var(--sky-hue) + 1) 90% 59%)");
    const glowFade = makeToneFade(glow, "transparent");
    const accentNow = () => tone ?? projectTone();
    const readAccent = (instant = false) => {
      const accent = accentNow();
      send({ type: "accent", rgb: hexRgb(accent), instant });
      skyFade.show(accent, instant);
      glowFade.show(accent, instant);
    };
    // the sky and glow start on the colour they were first painted in (see globals.css)
    skyFade.show(accentNow(), true);
    glowFade.show(accentNow(), true);
    readTheme();

    const size = () => {
      const r = box.getBoundingClientRect();
      send({ type: "size", w: r.width, h: r.height, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    };
    const run = () => send({ type: "run", visible: visible && !document.hidden, still: still.matches });

    // off screen (scrolled past on a writeup, or hidden on phones) it stops drawing
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !drawing) {
        canvas = document.createElement("canvas");
        box.appendChild(canvas);
        drawing = startDrawing(canvas);
        size();
        readTheme();
        // a fixed tone is there from the first frame
        send({ type: "accent", rgb: hexRgb(accentNow()), instant: true });
      }
      run();
    });
    io.observe(box);
    const ro = new ResizeObserver(() => drawing && size());
    ro.observe(box);

    const onTheme = () => {
      readTheme();
      readAccent();
    };
    const mo = new MutationObserver(onTheme);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    // a fixed tone never changes
    const stopTone = tone ? () => {} : onProjectTone(() => readAccent());
    const onSolar = () => {
      send({ type: "solar", solar: JSON.parse(JSON.stringify(SOLAR)) });
      onTheme();
    };
    still.addEventListener("change", run);
    document.addEventListener("visibilitychange", run);
    addEventListener(SOLAR_EVENT, onSolar);

    return () => {
      drawing?.stop();
      canvas?.remove();
      skyFade.stop();
      glowFade.stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      stopTone();
      still.removeEventListener("change", run);
      document.removeEventListener("visibilitychange", run);
      removeEventListener(SOLAR_EVENT, onSolar);
    };
  }, [tone]);

  return (
    <>
      <div className="corner-glow" ref={glowRef} aria-hidden>
        <i />
        <i />
      </div>
      <div className="sky" ref={skyRef} aria-hidden>
        <i />
        <i />
      </div>
      <div className="solar" ref={boxRef} aria-hidden />
    </>
  );
}
