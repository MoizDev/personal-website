"use client";

/**
 * A crowd as a field of dots, filling in like studs on a baseplate, then the
 * few that matter light up.
 */

import { useMemo, useRef, type CSSProperties } from "react";
import { Controls } from "./Controls";
import type { DotsSpec } from "./parse";
import { useSequence } from "./usePlayback";

export function Dots({ spec }: { spec: DotsSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, 3, { delay: [200, 2000, 700] });
  const rows = Math.ceil(spec.count / spec.cols);
  const picked = useMemo(() => {
    // a few dots near the middle, a little scattered, the same every time
    const mid = Math.floor(rows / 2) * spec.cols + Math.floor(spec.cols * 0.6);
    return new Set(Array.from({ length: spec.highlight }, (_, k) => mid + k * (spec.cols + 1) - spec.cols * (k === 2 ? 2 : 0)));
  }, [rows, spec.cols, spec.highlight]);
  const S = 10;

  return (
    <div ref={ref} className="dg-dots-wrap" data-step={seq.step}>
      <Controls seq={seq} />
      <svg className="dg-dots" viewBox={`0 0 ${spec.cols * S} ${rows * S}`} role="img" aria-label={`${spec.count} dots, ${spec.highlight} highlighted`}>
        {Array.from({ length: spec.count }, (_, i) => {
          const x = (i % spec.cols) * S + S / 2;
          const y = Math.floor(i / spec.cols) * S + S / 2;
          const hit = picked.has(i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={hit ? 3.6 : 2.6}
              className={hit ? "dg-dot dg-dot-hit" : "dg-dot"}
              style={{ "--d": `${((i % spec.cols) + Math.floor(i / spec.cols)) * 14}ms` } as CSSProperties}
            />
          );
        })}
      </svg>
      <div className="dg-dots-legend">
        {spec.label && <span className="dg-dots-all">{spec.label}</span>}
        {spec.pick && <span className="dg-dots-pick">{spec.pick}</span>}
      </div>
    </div>
  );
}
