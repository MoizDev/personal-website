"use client";

/**
 * A body seen from the side. Every filled cell drops in as a single 1x1, then
 * neighbours of one colour merge into real bricks with their seams staggered.
 * With a centre of mass, a plumb line then drops to the ground: inside the
 * base it stands, outside it tips.
 */

import { useRef, type CSSProperties } from "react";
import { Controls } from "./Controls";
import type { BricksSpec } from "./parse";
import { useSequence } from "./usePlayback";

const FILL: Record<string, string> = {
  white: "#f4f4f2",
  black: "#2a2b2e",
  red: "#c91a09",
  blue: "#0055bf",
  yellow: "#f2cd37",
  green: "#237841",
  grey: "#6c6e68",
  lightgrey: "#a0a5a9",
  trans: "#aee9ef",
  orange: "#fe8a18",
  tan: "#e4cd9e",
  brown: "#583927",
  pink: "#fc97ac",
};

const S = 24; // one cell
const GAP = 1.5; // the hairline between bricks

export function Bricks({ spec }: { spec: BricksSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const steps = spec.mass !== undefined ? 3 : 2;
  const seq = useSequence(ref, steps, { delay: [300, 1900, 1700] });
  const filled = new Set(spec.cells.map((c) => `${c.x},${c.y}`));
  const top = (x: number, y: number) => !filled.has(`${x},${y + 1}`);
  const R = spec.plates ? S * 0.4 : S; // one layer: a plate is 8 LDU to a stud's 20
  const W = spec.width * S;
  const H = spec.height * R + S * 0.3;
  const yOf = (y: number) => H - (y + 1) * R;

  const ground = spec.cells.filter((c) => c.y === 0).map((c) => c.x);
  const base = ground.length ? [Math.min(...ground), Math.max(...ground) + 1] : [0, 0];
  const stands = spec.mass !== undefined && spec.mass > base[0] - 0.25 && spec.mass < base[1] + 0.25;
  // the dot sits at the average height of the cells: the weight's height, near enough
  const comY = spec.cells.reduce((t, c) => t + c.y + 0.5, 0) / Math.max(1, spec.cells.length);
  const say = spec.says[Math.max(0, seq.step)] ?? "";

  const studs = (x: number, y: number, colour: string, key: string) =>
    top(x, y) && colour !== "trans" ? (
      <rect key={key} className="dg-bk-stud" x={x * S + S * 0.22} y={yOf(y) - S * 0.17} width={S * 0.56} height={S * 0.19} rx={1.5} fill={FILL[colour]} />
    ) : null;

  return (
    <div
      ref={ref}
      className="dg-bk-wrap"
      data-cells={seq.step >= 0}
      data-bricks={seq.step >= 1}
      data-mass={seq.step >= 2}
      data-stands={stands}
    >
      <Controls seq={seq} />
      <svg className="dg-bk" viewBox={`${-S * 0.5} ${-S * 0.6} ${W + S} ${H + S * 1.6}`} role="img" aria-label={spec.says.join(" ")}>
        <line className="dg-bk-ground" x1={-S * 0.5} x2={W + S * 0.5} y1={H} y2={H} />
        <g className="dg-bk-cells">
          {spec.cells.map((c, i) => (
            <g key={i} style={{ "--d": `${c.y * 90 + c.x * 18}ms` } as CSSProperties}>
              {studs(c.x, c.y, c.colour, "s")}
              <rect x={c.x * S + GAP / 2} y={yOf(c.y) + GAP / 2} width={S - GAP} height={R - GAP} rx={spec.plates ? 1.5 : 2.5} fill={FILL[c.colour]} data-c={c.colour} />
            </g>
          ))}
        </g>
        <g className="dg-bk-bricks">
          {spec.bricks.map((b, i) => (
            <g key={i} style={{ "--d": `${b.y * 110 + b.x * 22}ms`, transformOrigin: `${b.x * S}px ${yOf(b.y) + R / 2}px` } as CSSProperties}>
              {Array.from({ length: b.w }, (_, k) => studs(b.x + k, b.y, b.colour, `s${k}`))}
              <rect x={b.x * S + GAP / 2} y={yOf(b.y) + GAP / 2} width={b.w * S - GAP} height={R - GAP} rx={spec.plates ? 2 : 3} fill={FILL[b.colour]} data-c={b.colour} />
              <rect className="dg-bk-shine" x={b.x * S + 3} y={yOf(b.y) + 2.5} width={b.w * S - 6} height={spec.plates ? 1.6 : 3} rx={1} />
            </g>
          ))}
        </g>
        {spec.mass !== undefined && (
          <g className="dg-bk-mass">
            <rect className="dg-bk-base" x={base[0] * S} y={H + 4} width={(base[1] - base[0]) * S} height={5} rx={2.5} />
            <line className="dg-bk-plumb" x1={spec.mass * S} x2={spec.mass * S} y1={H - comY * R} y2={H + 12} pathLength={1} />
            <circle className="dg-bk-com" cx={spec.mass * S} cy={H - comY * R} r={6} />
          </g>
        )}
      </svg>
      <p className="dg-bk-say" key={seq.step}>
        {spec.mass !== undefined && seq.step >= 2 && <span className="dg-bk-verdict">{stands ? "Stands" : "Tips over"}</span>}
        {say}
      </p>
    </div>
  );
}
