"use client";

/**
 * Timing shared by every animated figure: play while on screen, pause when
 * scrolled away, and skip straight to the finished state for people who ask
 * for reduced motion.
 */

import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

/** Whether the element is on screen (a good part of it), and whether motion is reduced. */
export function useInView(ref: RefObject<Element | null>, threshold = 0.3) {
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return { inView, reduced };
}

export type Sequence = {
  /** -1 before the first step; length - 1 when finished */
  step: number;
  length: number;
  paused: boolean;
  finished: boolean;
  reduced: boolean;
  toggle: () => void;
  replay: () => void;
  /** jump to a step and hold there */
  goto: (i: number) => void;
};

/**
 * Walk through `length` steps while the element is on screen.
 * delay is ms before each step: one number, or one per step.
 * With loop, it holds on the last step for `hold` ms and starts again.
 */
export function useSequence(
  ref: RefObject<Element | null>,
  length: number,
  { delay = 900, loop = false, hold = 2600 }: { delay?: number | number[]; loop?: boolean; hold?: number } = {},
): Sequence {
  const { inView, reduced } = useInView(ref);
  const [step, setStep] = useState(-1);
  const [paused, setPaused] = useState(false);
  // a string key, so a fresh array with the same numbers doesn't restart the timer
  const delayKey = Array.isArray(delay) ? delay.join(",") : String(delay);

  useEffect(() => {
    if (!inView || paused || reduced) return;
    const delays = delayKey.split(",").map(Number);
    const wait = (i: number) => delays[Math.min(i, delays.length - 1)] ?? 900;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (step < length - 1) t = setTimeout(() => setStep(step + 1), wait(step + 1));
    else if (loop) t = setTimeout(() => setStep(-1), hold);
    return () => clearTimeout(t);
  }, [step, inView, paused, reduced, length, loop, hold, delayKey]);

  const toggle = useCallback(() => {
    setPaused((p) => !p);
  }, []);
  const replay = useCallback(() => {
    setPaused(false);
    setStep(-1);
  }, []);
  const goto = useCallback((i: number) => {
    setPaused(true);
    setStep(i);
  }, []);

  const shown = reduced && step === -1 ? length - 1 : step;
  return { step: shown, length, paused, finished: shown >= length - 1, reduced, toggle, replay, goto };
}
