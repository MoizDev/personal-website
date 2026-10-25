"use client";

/**
 * The terminal, drawn by an immediate-mode UI. egui redraws everything every
 * frame, so the terminal keeps a cache of laid-out rows keyed by a hash of
 * each row's cells (and the font): a row that hasn't changed is reused, and
 * only changed rows are laid out again. When egui rebuilds its glyph atlas
 * the cached layouts point at stale glyphs, so the whole cache is dropped
 * (terminal/mod.rs:471-476). On the right, box-drawing characters: font
 * glyphs rarely fill a cell once line spacing is added, so lines break
 * between rows; Dr. Rocket draws them as rectangles from each character's
 * four arms instead (terminal/render.rs:99-222).
 */

import { useRef, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Terminal.css";

const BEFORE = ["~/cs135 $ racket", "Welcome to Racket v8.14.", "> (tree-sum t)", "30", "> ", "", ""];
const AFTER = ["~/cs135 $ racket", "Welcome to Racket v8.14.", "> (tree-sum t)", "30", "> (+ 1 2)", "3", "> "];

/** A short stand-in for row_hash: the same text always gives the same hash. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  return (h >>> 0).toString(16).slice(0, 4).padStart(4, "0");
}

type Frame = { rows: string[]; laid: boolean[]; name: string; note: string; bytes?: boolean; flush?: boolean };
const FRAMES: Frame[] = [
  { rows: BEFORE, laid: BEFORE.map(() => true), name: "frame 1", note: "An empty cache: every row is laid out." },
  { rows: BEFORE, laid: BEFORE.map(() => false), name: "frame 2", note: "Nothing changed: every row comes from the cache." },
  {
    rows: AFTER,
    laid: AFTER.map((r, i) => r !== BEFORE[i]),
    name: "frame 3",
    note: "Output arrived: only the three changed rows are laid out.",
    bytes: true,
  },
  { rows: AFTER, laid: AFTER.map(() => true), name: "frame 4", note: "egui rebuilt its glyph atlas: the cache is dropped.", flush: true },
  { rows: AFTER, laid: AFTER.map(() => false), name: "frame 5", note: "Back to reusing every row." },
];
const BOX = FRAMES.length; // steps from here on are about box characters
const N = BOX + 2;

/* ---------- box drawing ---------- */

const GRID = ["┌─┬─┐", "│ │ │", "└─┴─┘"];
type W = 0 | 1; // none or light; the figure only needs light lines
const ARMS: Record<string, [W, W, W, W]> = {
  "─": [0, 1, 0, 1],
  "│": [1, 0, 1, 0],
  "┌": [0, 1, 1, 0],
  "┐": [0, 0, 1, 1],
  "└": [1, 1, 0, 0],
  "┘": [1, 0, 0, 1],
  "┬": [0, 1, 1, 1],
  "┴": [1, 1, 0, 1],
};
const CW = 22;
const CH = 34;
const T = Math.max(CW / 9, 1); // light = max(cell.width / 9, 1px)
const GLYPH = 8; // how far short of the cell's top and bottom a font's line stops

function BoxGrid({ x0, y0, glyph }: { x0: number; y0: number; glyph: boolean }) {
  const out: ReactNode[] = [];
  GRID.forEach((row, r) =>
    [...row].forEach((c, k) => {
      const arms = ARMS[c];
      if (!arms) return;
      const x = x0 + k * CW;
      const y = y0 + r * CH;
      const cx = x + CW / 2;
      const cy = y + CH / 2;
      const [up, right, down, left] = arms;
      // a font draws the vertical stroke only as tall as its glyphs
      const top = glyph ? y + GLYPH : y;
      const bot = glyph ? y + CH - GLYPH : y + CH;
      const key = `${r}-${k}`;
      if (up) out.push(<rect key={`${key}u`} x={cx - T / 2} y={top} width={T} height={cy - top + T / 2} />);
      if (down) out.push(<rect key={`${key}d`} x={cx - T / 2} y={cy - T / 2} width={T} height={bot - cy + T / 2} />);
      if (left) out.push(<rect key={`${key}l`} x={x} y={cy - T / 2} width={cx - x + T / 2} height={T} />);
      if (right) out.push(<rect key={`${key}r`} x={cx - T / 2} y={cy - T / 2} width={x + CW - cx + T / 2} height={T} />);
    }),
  );
  return <g className="drf-term-strokes">{out}</g>;
}

function Cells({ x0, y0 }: { x0: number; y0: number }) {
  const lines: ReactNode[] = [];
  for (let r = 0; r <= GRID.length; r++) lines.push(<line key={`h${r}`} x1={x0} x2={x0 + 5 * CW} y1={y0 + r * CH} y2={y0 + r * CH} />);
  for (let k = 0; k <= 5; k++) lines.push(<line key={`v${k}`} x1={x0 + k * CW} x2={x0 + k * CW} y1={y0} y2={y0 + GRID.length * CH} />);
  return <g className="drf-term-cells">{lines}</g>;
}

/** The gaps a font leaves where vertical lines meet between rows. */
function Gaps({ x0, y0 }: { x0: number; y0: number }) {
  const cols = [0, 2, 4];
  return (
    <g className="drf-term-gaps">
      {[1, 2].flatMap((r) =>
        cols.map((k) => <ellipse key={`${r}-${k}`} cx={x0 + k * CW + CW / 2} cy={y0 + r * CH} rx={6} ry={GLYPH + 3} />),
      )}
    </g>
  );
}

function BoxPanel({ step }: { step: number }) {
  const glyphOn = step >= BOX;
  const rectOn = step >= BOX + 1;
  const W = 250;
  const gx = 6;
  const rx = 134;
  const y0 = 26;
  // the zoomed cell: ┬
  const zx = 98;
  const zy = 162;
  const zw = 54;
  const zh = 84;
  const zt = Math.max(zw / 9, 1);
  return (
    <svg className="drf-term-box" viewBox={`0 0 ${W} 274`} aria-hidden data-glyph={glyphOn ? "" : undefined} data-rect={rectOn ? "" : undefined}>
      <text className="drf-term-cap" x={gx + 55} y={14}>
        font glyphs
      </text>
      <text className="drf-term-cap" x={rx + 55} y={14}>
        drawn as rects
      </text>
      <g className="drf-term-side" data-on={glyphOn ? "" : undefined}>
        <Cells x0={gx} y0={y0} />
        <BoxGrid x0={gx} y0={y0} glyph />
        {glyphOn && <Gaps x0={gx} y0={y0} />}
      </g>
      <g className="drf-term-side" data-on={rectOn ? "" : undefined} data-rects="">
        <Cells x0={rx} y0={y0} />
        <BoxGrid x0={rx} y0={y0} glyph={false} />
      </g>
      <g className="drf-term-zoom" data-on={rectOn ? "" : undefined}>
        <rect className="drf-term-zcell" x={zx} y={zy} width={zw} height={zh} />
        <rect className="drf-term-arm" x={zx} y={zy + zh / 2 - zt / 2} width={zw / 2 + zt / 2} height={zt} />
        <rect className="drf-term-arm" x={zx + zw / 2 - zt / 2} y={zy + zh / 2 - zt / 2} width={zw / 2 + zt / 2} height={zt} />
        <rect className="drf-term-arm" x={zx + zw / 2 - zt / 2} y={zy + zh / 2 - zt / 2} width={zt} height={zh / 2 + zt / 2} />
        <text className="drf-term-armlabel" x={zx + zw / 2} y={zy - 5}>
          up: none
        </text>
        <text className="drf-term-armlabel" x={zx - 6} y={zy + zh / 2 + 3} style={{ textAnchor: "end" }}>
          left: light
        </text>
        <text className="drf-term-armlabel" x={zx + zw + 6} y={zy + zh / 2 + 3} style={{ textAnchor: "start" }}>
          right: light
        </text>
        <text className="drf-term-armlabel" x={zx + zw / 2} y={zy + zh + 13}>
          down: light
        </text>
        <text className="drf-term-zchar" x={zx + 10} y={zy + 18}>
          ┬
        </text>
      </g>
    </svg>
  );
}

export function Terminal() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, N, { delay: [500, 1700, 1700, 1900, 1700, 1700, 1800], loop: true, hold: 3600 });
  const s = seq.step;
  const fi = s < 0 ? -1 : Math.min(s, FRAMES.length - 1);
  const f = fi >= 0 ? FRAMES[fi] : null;
  const rows = f ? f.rows : BEFORE;
  const laidCount = f ? f.laid.filter(Boolean).length : 0;
  const label = s < 0 ? undefined : s < BOX ? f!.name : "box characters";
  const frameActive = s >= 0 && s < BOX;

  return (
    <div ref={ref} className="drf-term" data-tone="blue">
      <Controls seq={seq} label={label} />
      <div className="drf-term-grid">
        <div className="drf-term-frames" data-active={frameActive ? "" : undefined}>
          <div className="drf-term-pipe">
            <span className="drf-term-node" data-kind="store">
              PTY
            </span>
            <span className="drf-term-bytes" data-on={f?.bytes && frameActive ? "" : undefined}>
              {f?.bytes && frameActive ? "(+ 1 2)↵3↵> " : "bytes"}
            </span>
            <span className="drf-term-node" title="alacritty_terminal">VT parser</span>
            <span className="drf-term-arrow" />
            <span className="drf-term-node">grid</span>
          </div>

          <div className="drf-term-screen" data-flush={f?.flush && frameActive ? "" : undefined}>
            <div className="drf-term-screenhead">
              <span>rows</span>
              <span>row_hash</span>
              <span>this frame</span>
            </div>
            {rows.map((r, i) => {
              const laid = f ? f.laid[i] : false;
              return (
                <div key={i} className="drf-term-row" data-laid={f && laid ? "" : undefined} data-hit={f && !laid ? "" : undefined}>
                  <span className="drf-term-text">{r || " "}</span>
                  <span className="drf-term-hash">{hash(r)}</span>
                  <span className="drf-term-status">{!f ? "" : laid ? "laid out" : "cached"}</span>
                </div>
              );
            })}
            {f?.flush && frameActive && <div className="drf-term-flush">atlas rebuilt · cache cleared</div>}
          </div>
          <div className="drf-term-note">
            <span className="drf-term-count">{f ? `${laidCount} of ${rows.length} rows laid out` : " "}</span>
            <span>{f ? f.note : " "}</span>
          </div>
        </div>

        <div className="drf-term-boxes" data-active={s >= BOX ? "" : undefined}>
          <BoxPanel step={s} />
          <div className="drf-term-note drf-term-boxnote">
            <span className="drf-term-count">line = max(cell width / 9, 1 px)</span>
            <span>Each character is four arms that reach the cell&apos;s edges, so neighbours always join.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
