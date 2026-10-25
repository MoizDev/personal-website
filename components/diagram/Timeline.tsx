"use client";

/**
 * Moments on a line, lit up in order as a progress line runs through them.
 * Lies flat on wide screens and stands up on narrow ones.
 */

import { useRef, type CSSProperties } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import type { TimelineSpec } from "./parse";
import { useSequence } from "./usePlayback";

export function Timeline({ spec }: { spec: TimelineSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = spec.items.length;
  const seq = useSequence(ref, n, { delay: [400, ...spec.items.slice(1).map(() => 1150)] });
  const fill = n > 1 ? Math.max(0, seq.step) / (n - 1) : 1;

  return (
    <div ref={ref} className="dg-tl-wrap">
      <Controls seq={seq} />
      <ol className="dg-tl" style={{ "--n": n, "--fill": fill } as CSSProperties}>
        <span className="dg-tl-track" aria-hidden>
          <span className="dg-tl-fill" />
        </span>
        {spec.items.map((it, i) => (
          <li
            key={i}
            className="dg-tl-item"
            data-state={i === seq.step ? "active" : i < seq.step ? "done" : "idle"}
            data-tone={it.tone ?? "ink"}
          >
            <span className="dg-tl-dot">{it.icon ? <Icon name={it.icon} size={15} /> : null}</span>
            <span className="dg-tl-text">
              <span className="dg-tl-time">{it.time}</span>
              <span className="dg-tl-title">{it.label}</span>
              {it.note && <span className="dg-tl-note">{it.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
