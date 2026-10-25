"use client";

/**
 * A flowchart: start and end pills, boxes, decision diamonds, gray stores and
 * a red failure box on a dotted grid, joined by right-angled arrows. Each walk
 * is one example taken through the chart; the walk lights the boxes it
 * reaches, draws the arrows it takes and stamps the answer on each question.
 */

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";

type Side = "t" | "r" | "b" | "l";
type Pt = [number, number];
type Box = { x: number; y: number; w: number; h: number };

export type FNode = {
  id: string;
  /** grid cell, 1-based: [row, column] */
  at: [number, number];
  kind?: "start" | "box" | "ask" | "store" | "fail" | "end";
  label: ReactNode;
  /** a mono line under the label */
  sub?: ReactNode;
  /** columns it spans */
  span?: number;
};

export type FEdge = {
  from: string;
  to: string;
  label?: string;
  /** which side it leaves from and arrives at; guessed from the layout if left out */
  out?: Side;
  in?: Side;
  /** dashed, for a loop back */
  dashed?: boolean;
  /** how far out a loop swings, in px */
  swing?: number;
  /** run a loop along the chart's outer edge, clear of every box */
  outer?: boolean;
};

export type FWalk = {
  name: string;
  path: string[];
  note?: ReactNode;
  /** side inputs, [from, to]: lit along with `to` when the walk reaches it */
  also?: [string, string][];
};

function sidePt(b: Box, s: Side): Pt {
  if (s === "t") return [b.x + b.w / 2, b.y];
  if (s === "b") return [b.x + b.w / 2, b.y + b.h];
  if (s === "l") return [b.x, b.y + b.h / 2];
  return [b.x + b.w, b.y + b.h / 2];
}

function guessSides(a: Box, b: Box): [Side, Side] {
  const dy = b.y - (a.y + a.h);
  if (dy > -4) return ["b", "t"];
  if (b.x >= a.x + a.w) return ["r", "l"];
  if (b.x + b.w <= a.x) return ["l", "r"];
  return ["t", "b"];
}

/** Corner points from one side of a box to a side of another, right angles only. */
function route(a: Box, b: Box, out: Side, inn: Side, swing: number, outer: number | null): Pt[] {
  const p = sidePt(a, out);
  const q = sidePt(b, inn);
  const vert = (s: Side) => s === "t" || s === "b";
  if (out === inn) {
    // a loop round the outside
    if (out === "r") {
      const x = outer ?? Math.max(a.x + a.w, b.x + b.w) + swing;
      return [p, [x, p[1]], [x, q[1]], q];
    }
    if (out === "l") {
      const x = outer ?? Math.min(a.x, b.x) - swing;
      return [p, [x, p[1]], [x, q[1]], q];
    }
    if (out === "b") {
      const y = Math.max(a.y + a.h, b.y + b.h) + swing;
      return [p, [p[0], y], [q[0], y], q];
    }
    const y = Math.min(a.y, b.y) - swing;
    return [p, [p[0], y], [q[0], y], q];
  }
  if (vert(out) && vert(inn)) {
    if (Math.abs(p[0] - q[0]) < 1) return [p, q];
    const y = (p[1] + q[1]) / 2;
    return [p, [p[0], y], [q[0], y], q];
  }
  if (!vert(out) && !vert(inn)) {
    if (Math.abs(p[1] - q[1]) < 1) return [p, q];
    const x = (p[0] + q[0]) / 2;
    return [p, [x, p[1]], [x, q[1]], q];
  }
  // one turn
  return vert(out) ? [p, [p[0], q[1]], q] : [p, [q[0], p[1]], q];
}

function pathOf(pts: Pt[], r = 9): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i === pts.length - 1) {
      d += ` L${x},${y}`;
      break;
    }
    const [px, py] = pts[i - 1];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(x - px, y - py);
    const l2 = Math.hypot(nx - x, ny - y);
    const k = Math.min(r, l1 / 2, l2 / 2);
    const ax = x - ((x - px) / (l1 || 1)) * k;
    const ay = y - ((y - py) / (l1 || 1)) * k;
    const bx = x + ((nx - x) / (l2 || 1)) * k;
    const by = y + ((ny - y) / (l2 || 1)) * k;
    d += ` L${ax},${ay} Q${x},${y} ${bx},${by}`;
  }
  return d;
}

function headOf(pts: Pt[]): string {
  const [x, y] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const a = Math.atan2(y - py, x - px);
  const s = 6;
  const l = [x - s * Math.cos(a - 0.45), y - s * Math.sin(a - 0.45)];
  const r = [x - s * Math.cos(a + 0.45), y - s * Math.sin(a + 0.45)];
  return `M${l[0]},${l[1]} L${x},${y} L${r[0]},${r[1]}`;
}

/** Where a label sits: a little way along the first segment. */
function labelAt(pts: Pt[]): Pt {
  const [a, b] = pts;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  // a short hop (phones) gets its label in the middle, between the two boxes
  const t = len < 56 ? 0.5 : Math.min(1, 22 / (len || 1));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const key = (a: string, b: string) => `${a}>${b}`;

export function Flowchart({
  nodes,
  edges,
  walks,
  cols,
  minWidth = 560,
  tone = "blue",
}: {
  nodes: FNode[];
  edges: FEdge[];
  walks: FWalk[];
  cols: number;
  /** below this the chart scrolls sideways instead of squashing */
  minWidth?: number;
  tone?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map());
  const [size, setSize] = useState({ w: 0, h: 0 });
  // narrower than minWidth (phones): tighten the grid instead of scrolling sideways
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const check = () => setCompact(el.clientWidth < minWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minWidth]);

  // one step per box along each walk, and a breath between walks
  const steps = useMemo(() => walks.flatMap((w, wi) => w.path.map((_, i) => ({ wi, i }))), [walks]);
  const delays = useMemo(() => steps.map((s) => (s.i === 0 ? (s.wi === 0 ? 500 : 1500) : 720)), [steps]);
  const seq = useSequence(wrap, steps.length, { delay: delays, loop: true, hold: 2400 });

  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return;
    const measure = () => {
      const m = new Map<string, Box>();
      for (const [id, el] of els.current) m.set(id, { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
      setBoxes(m);
      setSize({ w: g.offsetWidth, h: g.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(g);
    return () => ro.disconnect();
  }, [nodes, compact]);

  // what the current walk has reached
  const cur = seq.reduced || seq.step < 0 ? null : steps[seq.step];
  const walk = cur ? walks[cur.wi] : null;
  const reached = new Set(walk ? walk.path.slice(0, cur!.i + 1) : []);
  const taken = new Set<string>();
  if (walk) for (let i = 1; i <= cur!.i; i++) taken.add(key(walk.path[i - 1], walk.path[i]));
  for (const [a, b] of walk?.also ?? []) {
    if (!reached.has(b)) continue;
    reached.add(a);
    taken.add(key(a, b));
  }
  const head = walk ? walk.path[cur!.i] : null;
  const lastEdge = walk && cur!.i > 0 ? key(walk.path[cur!.i - 1], walk.path[cur!.i]) : null;

  const routed = edges.flatMap((e) => {
    const a = boxes.get(e.from);
    const b = boxes.get(e.to);
    if (!a || !b) return [];
    const [o, i] = guessSides(a, b);
    const out = e.out ?? o;
    const rim = compact ? 6 : 14;
    const edge = !e.outer ? null : out === "l" ? rim : size.w - rim;
    const pts = route(a, b, out, e.in ?? i, e.swing ?? (compact ? 14 : 26), edge);
    return [{ e, pts, d: pathOf(pts), k: key(e.from, e.to) }];
  });

  return (
    <div ref={wrap} className="drf-flow" data-tone={tone}>
      <Controls seq={seq} label={walk?.name} />
      <div className="drf-flow-scroll">
        <div
          ref={grid}
          className="drf-flow-grid"
          data-walking={walk ? "" : undefined}
          data-compact={compact ? "" : undefined}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, minWidth: compact ? 0 : minWidth }}
        >
          <svg className="drf-flow-wires" width={size.w} height={size.h} aria-hidden>
            {routed.map(({ e, pts, d, k }) => {
              const on = taken.has(k);
              return (
                <g key={k} className="drf-wire" data-on={on ? "" : undefined} data-dashed={e.dashed ? "" : undefined}>
                  <path className="drf-wire-base" d={d} />
                  <path className="drf-wire-head" d={headOf(pts)} />
                  <path className="drf-wire-lit" d={d} pathLength={1} />
                  <path className="drf-wire-lit-head" d={headOf(pts)} />
                </g>
              );
            })}
          </svg>
          {routed
            .filter(({ e }) => e.label)
            .map(({ e, pts, k }) => {
              const [x, y] = labelAt(pts);
              return (
                <span key={k} className="drf-flow-label" data-on={taken.has(k) ? "" : undefined} style={{ left: x, top: y }}>
                  {e.label}
                </span>
              );
            })}
          {nodes.map((n) => {
            const kind = n.kind ?? "box";
            return (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) els.current.set(n.id, el);
                  else els.current.delete(n.id);
                }}
                className="drf-node"
                data-kind={kind}
                data-on={reached.has(n.id) ? "" : undefined}
                data-head={head === n.id ? "" : undefined}
                style={{ gridRow: n.at[0], gridColumn: `${n.at[1]} / span ${n.span ?? 1}` }}
              >
                {kind === "ask" && (
                  <svg className="drf-diamond" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <polygon points="50,1 99,50 50,99 1,50" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
                <span className="drf-node-label">{n.label}</span>
                {n.sub && <span className="drf-node-sub">{n.sub}</span>}
              </div>
            );
          })}
          {walk &&
            routed
              .filter(({ k }) => k === lastEdge)
              .map(({ d, k }) => <span key={`${k}-${seq.step}`} className="drf-flow-pulse" style={{ offsetPath: `path("${d}")` }} />)}
        </div>
      </div>
      <div className="drf-flow-note" aria-live="polite">
        {walk ? walk.note ?? walk.name : <>&nbsp;</>}
      </div>
    </div>
  );
}
