"use client";

/**
 * Bars that grow in when they come on screen. A row is one value, or a set of
 * ranges on a shared axis (a Gantt chart) when written as from..to.
 */

import { useRef, type CSSProperties } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import { clock, type BarsSpec } from "./parse";
import { useSequence } from "./usePlayback";

function niceStep(max: number, clockFormat: boolean) {
  const options = clockFormat ? [10, 15, 30, 60, 120, 300, 600] : [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  return options.find((s) => max / s <= 6) ?? options[options.length - 1];
}

export function Bars({ spec }: { spec: BarsSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, 1, { delay: 250 });
  const grown = seq.step >= 0;
  const fmt = (v: number) => (spec.format === "clock" ? clock(v) : `${v}${spec.unit}`);
  const pct = (v: number) => `${(v / spec.max) * 100}%`;
  const step = niceStep(spec.max, spec.format === "clock");
  const ticks: number[] = [];
  for (let v = 0; v <= spec.max + 0.001; v += step) ticks.push(v);

  return (
    <div ref={ref} className="dg-bars-wrap" data-grown={grown}>
      <Controls seq={seq} />
      <div className="dg-bars">
        {spec.rows.map((r, i) => (
          <div key={i} className="dg-bar-row" data-tone={r.tone ?? "ink"} style={{ "--i": i } as CSSProperties}>
            <span className="dg-bar-label">
              {r.icon && <Icon name={r.icon} size={14} />}
              <span>{r.label}</span>
            </span>
            <span className="dg-bar-track">
              {r.value !== undefined && (
                <span className="dg-bar" style={{ "--w": pct(r.value) } as CSSProperties}>
                  <span className="dg-bar-value">{fmt(r.value)}</span>
                </span>
              )}
              {r.segments?.map((s, k) => (
                <span
                  key={k}
                  className="dg-seg"
                  data-tone={s.tone ?? r.tone ?? "ink"}
                  style={{ "--l": pct(s.from), "--w": pct(s.to - s.from), "--k": k } as CSSProperties}
                >
                  {s.label && <span className="dg-seg-label">{s.label}</span>}
                </span>
              ))}
              {spec.mark && <span className="dg-bar-mark" style={{ left: pct(spec.mark.at) }} aria-hidden />}
            </span>
            {r.note && <span className="dg-bar-note">{r.note}</span>}
          </div>
        ))}
        <div className="dg-axis" aria-hidden>
          <span />
          <span className="dg-axis-track">
            {ticks.map((v) => (
              <span key={v} className="dg-tick" style={{ left: pct(v) }}>
                {fmt(v)}
              </span>
            ))}
            {spec.mark?.label && (
              <span className="dg-mark-label" style={{ left: pct(spec.mark.at) }}>
                {spec.mark.label}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
