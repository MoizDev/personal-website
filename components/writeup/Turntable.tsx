"use client";

/**
 * A build shown from its four rendered sides, turning slowly like a model on a
 * display stand. Pauses off screen and for reduced motion; tap to step.
 */

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/components/diagram/usePlayback";

const SIDES = ["Front", "Right", "Back", "Left"];

export function Turntable({ frames, alt, label }: { frames: StaticImageData[]; alt: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { inView, reduced } = useInView(ref);
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!inView || reduced || held) return;
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 1400);
    return () => clearInterval(t);
  }, [inView, reduced, held, frames.length]);

  return (
    <div ref={ref} className="wu-turn">
      <button
        type="button"
        className="wu-turn-stage"
        onClick={() => {
          setHeld(true);
          setI((n) => (n + 1) % frames.length);
        }}
        aria-label={`${alt}. Showing the ${SIDES[i % 4].toLowerCase()} view; press for the next side.`}
      >
        {frames.map((f, k) => (
          <Image key={k} src={f} alt="" sizes="(max-width: 700px) 100vw, 640px" data-on={k === i} />
        ))}
      </button>
      <div className="wu-turn-bar">
        {label && <span className="wu-turn-label">{label}</span>}
        <span className="wu-turn-sides">
          {frames.map((_, k) => (
            <button
              key={k}
              type="button"
              data-on={k === i}
              onClick={() => {
                setHeld(true);
                setI(k);
              }}
            >
              {SIDES[k % 4]}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
