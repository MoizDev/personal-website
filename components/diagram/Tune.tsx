"use client";

/**
 * A number and the switches that move it: each switch flips on in turn, then
 * the number rolls from where it was to where it ended up.
 */

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import { clock, toNumber, type TuneSpec } from "./parse";
import { useSequence } from "./usePlayback";

function useRoll(from: number, to: number, go: boolean, ms = 1500) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = go ? Math.min(1, (now - t0) / ms) : 0;
      const e = 1 - (1 - t) ** 3;
      setV(from + (to - from) * e);
      if (go && t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, go, ms]);
  return v;
}

export function Tune({ spec }: { spec: TuneSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = spec.levers.length;
  const seq = useSequence(ref, n + 2, { delay: [600, ...Array(n - 1).fill(950), 900, 1700] });
  const isClock = spec.from.includes(":");
  const from = toNumber(spec.from);
  const to = toNumber(spec.to);
  const rolling = seq.step >= n || seq.reduced;
  const v = useRoll(from, to, rolling);
  const shown = seq.reduced ? to : v;
  // keep as many decimals as from: and to: were written with
  const places = Math.max(...[spec.from, spec.to].map((x) => x.match(/\.(\d+)/)?.[1].length ?? 0));

  return (
    <div ref={ref} className="dg-tune-wrap">
      <Controls seq={seq} />
      <div className="dg-tune">
        <div className="dg-tune-dial" data-done={seq.step >= n}>
          {spec.label && <span className="dg-tune-label">{spec.label}</span>}
          <span className="dg-tune-value">{isClock ? clock(shown) : shown.toFixed(places)}</span>
          <span className="dg-tune-from" data-show={seq.step >= n}>
            was {spec.from}
          </span>
          {spec.done && (
            <span className="dg-tune-done" data-show={seq.finished}>
              <Icon name="Check" size={13} /> {spec.done}
            </span>
          )}
        </div>
        <ol className="dg-levers">
          {spec.levers.map((l, i) => (
            <li key={i} data-on={i <= seq.step} data-tone={l.tone ?? "orange"}>
              <span className="dg-lever-icon">{l.icon && <Icon name={l.icon} size={15} />}</span>
              <span className="dg-lever-text">
                {l.label}
                {l.note && <span className="dg-lever-note">{l.note}</span>}
              </span>
              <span className="dg-switch" aria-hidden>
                <span />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
