"use client";

/**
 * A stopwatch that runs story time fast: fourteen minutes in a few seconds.
 * Each event lights up as the clock passes it.
 */

import { useRef, type CSSProperties } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import { clock, type ClockSpec } from "./parse";
import { useSequence } from "./usePlayback";

const TICKS = 140;

export function Clock({ spec }: { spec: ClockSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, TICKS, { delay: [300, ...Array(TICKS - 1).fill(Math.round((spec.seconds * 1000) / TICKS))] });
  const t = seq.step < 0 ? 0 : ((seq.step + 1) / TICKS) * spec.to;
  const lastHit = spec.events.reduce((k, e, i) => (e.at <= t + 0.001 ? i : k), -1);

  return (
    <div ref={ref} className="dg-clock-wrap">
      <Controls seq={seq} />
      <div className="dg-clock">
        <div className="dg-clock-face" data-done={seq.finished} style={{ "--p": t / spec.to } as CSSProperties}>
          <svg viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="44" className="dg-clock-bg" />
            <circle cx="50" cy="50" r="44" className="dg-clock-arc" pathLength={1} />
            {spec.events.map((e, i) => {
              // the whole face is turned a quarter back, so 0 here is twelve o'clock
              const a = (e.at / spec.to) * 2 * Math.PI;
              return <circle key={i} cx={50 + 44 * Math.cos(a)} cy={50 + 44 * Math.sin(a)} r="2.4" className="dg-clock-tick" data-hit={i <= lastHit} />;
            })}
          </svg>
          <span className="dg-clock-time">{clock(t)}</span>
          {spec.done && <span className="dg-clock-done">{seq.finished ? spec.done : "running"}</span>}
        </div>
        <ol className="dg-clock-events">
          {spec.events.map((e, i) => (
            <li key={i} data-state={i === lastHit ? "active" : i < lastHit ? "done" : "idle"} data-tone={e.tone ?? "ink"}>
              <span className="dg-clock-at">{clock(e.at)}</span>
              <span className="dg-clock-icon">{e.icon && <Icon name={e.icon} size={14} />}</span>
              <span className="dg-clock-label">
                {e.label}
                {e.note && <span className="dg-clock-note">{e.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
