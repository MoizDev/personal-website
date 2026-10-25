"use client";

/**
 * A cycle: steps around a ring, with a token that goes round and a lap
 * counter in the middle. After the last lap it stops and shows the ending.
 */

import { useRef, type CSSProperties } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import type { CycleSpec } from "./parse";
import { useSequence } from "./usePlayback";

export function Cycle({ spec }: { spec: CycleSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = spec.nodes.length;
  const total = spec.laps * n;
  const seq = useSequence(ref, total, { delay: 760, loop: true, hold: 3800 });
  const lap = seq.step < 0 ? 0 : Math.floor(seq.step / n) + 1;
  const at = seq.step < 0 ? -1 : seq.step % n;
  const over = seq.finished;

  return (
    <div ref={ref} className="dg-cycle-wrap">
      <Controls seq={seq} />
      <div className="dg-cycle" style={{ "--n": n } as CSSProperties}>
        <svg className="dg-ring" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="38" />
        </svg>
        <div
          className="dg-token"
          data-resetting={seq.step <= 0}
          style={{ transform: `rotate(${Math.max(0, seq.step) * (360 / n)}deg)` }}
          aria-hidden
        >
          <span />
        </div>
        <div className="dg-cycle-center" data-over={over}>
          {over && spec.end ? (
            <span className="dg-cycle-end">{spec.end}</span>
          ) : (
            <>
              <span className="dg-cycle-lap">{lap || "–"}</span>
              <span className="dg-cycle-caption">{spec.center ?? "lap"}</span>
            </>
          )}
        </div>
        {spec.nodes.map((node, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const state = i === at ? "active" : seq.step >= 0 || seq.reduced ? "done" : "idle";
          return (
            <div
              key={node.id}
              className="dg-node dg-cycle-node"
              data-state={state}
              data-tone={node.tone ?? "ink"}
              style={{ left: `${50 + 38 * Math.cos(angle)}%`, top: `${50 + 38 * Math.sin(angle)}%` }}
            >
              {node.icon && (
                <span className="dg-node-icon">
                  <Icon name={node.icon} size={17} />
                </span>
              )}
              <span className="dg-node-label">{node.label}</span>
              {node.note && <span className="dg-node-note">{node.note}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
