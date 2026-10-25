"use client";

/**
 * A flow: cards on a grid joined by arrows. The highlight walks the `play`
 * order, a pulse runs along each arrow it takes, and loop arrows (~>) route
 * around the cards so a critique loop reads as a loop. Click a card to stop
 * on it; if the figure has a pane for that card, it opens below.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import type { FlowEdge, FlowSpec } from "./parse";
import { useSequence } from "./usePlayback";

type Box = { x: number; y: number; w: number; h: number };
type Pt = [number, number];

const MIN_CARD = 128; // narrowest a card gets before the grid drops a column
const COL_GAP = 40;

/** Where an arrow runs, as a list of corner points. */
function route(a: Box, b: Box, kind: FlowEdge["kind"]): Pt[] {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const sameRow = Math.abs(a.y - b.y) < 6;
  const sameCol = Math.abs(acx - bcx) < 6;
  const loop = kind === "loop";
  if (sameRow) {
    if (b.x > a.x && !loop) return [[a.x + a.w, acy], [b.x, bcy]];
    if (b.x + b.w < a.x && !loop) return [[a.x, acy], [b.x + b.w, bcy]];
    // round the back of the row, underneath
    const y = Math.max(a.y + a.h, b.y + b.h) + 24;
    return [[acx, a.y + a.h], [acx, y], [bcx, y], [bcx, b.y + b.h]];
  }
  if (sameCol) {
    if (b.y > a.y && !loop) return [[acx, a.y + a.h], [bcx, b.y]];
    // up the right-hand side
    const x = Math.max(a.x + a.w, b.x + b.w) + 22;
    return [[a.x + a.w, acy], [x, acy], [x, bcy], [b.x + b.w, bcy]];
  }
  if (b.y > a.y) {
    const gy = (a.y + a.h + b.y) / 2;
    return [[acx, a.y + a.h], [acx, gy], [bcx, gy], [bcx, b.y]];
  }
  // back up to an earlier row: through the gap just under it
  const gy = b.y + b.h + 20;
  return [[acx, a.y], [acx, gy], [bcx, gy], [bcx, b.y + b.h]];
}

/** Corner points to a path with rounded corners. */
function pathOf(pts: Pt[], r = 10): string {
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

/** A little arrowhead at the end of the last segment. */
function headOf(pts: Pt[]): string {
  const [x, y] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const a = Math.atan2(y - py, x - px);
  const s = 6;
  const p1 = [x - s * Math.cos(a - 0.5), y - s * Math.sin(a - 0.5)];
  const p2 = [x - s * Math.cos(a + 0.5), y - s * Math.sin(a + 0.5)];
  return `M${p1[0]},${p1[1]} L${x},${y} L${p2[0]},${p2[1]}`;
}

/** Midpoint of the longest segment, for the arrow's label. */
function labelAt(pts: Pt[]): Pt {
  let best = 0;
  let at: Pt = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (l > best) {
      best = l;
      at = [(pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2];
    }
  }
  return at;
}

/** A dot that runs along a path once. Drawn straight to the DOM, so it costs no renders. */
function Pulse({ d, ms = 560 }: { d: string; ms?: number }) {
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const p = path.current;
    const c = dot.current;
    if (!p || !c) return;
    const len = p.getTotalLength();
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const pt = p.getPointAtLength(e * len);
      c.setAttribute("cx", String(pt.x));
      c.setAttribute("cy", String(pt.y));
      c.setAttribute("opacity", t >= 1 ? "0" : "1");
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d, ms]);
  return (
    <g className="dg-pulse">
      <path ref={path} d={d} fill="none" stroke="none" />
      <circle ref={dot} r={4.5} opacity={0} />
    </g>
  );
}

export function Flow({ spec, panes }: { spec: FlowSpec; panes?: Record<string, ReactNode> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLDivElement>());
  const [width, setWidth] = useState(0);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});

  const seq = useSequence(wrap, spec.play.length, { loop: true, delay: [500, ...spec.play.slice(1).map(() => 1050)], hold: 3200 });

  // how many columns fit
  const cols = width ? Math.max(1, Math.min(spec.cols, Math.floor((width + COL_GAP) / (MIN_CARD + COL_GAP)))) : spec.cols;
  const useRows = !!spec.rows && cols === spec.cols;

  const place = useMemo(() => {
    const at = new Map<string, { row: number; col: number }>();
    if (useRows && spec.rows) {
      spec.rows.forEach((r, ri) => r.forEach((id, ci) => id && at.set(id, { row: ri + 1, col: ci + 1 })));
    } else {
      spec.nodes.forEach((n, i) => at.set(n.id, { row: Math.floor(i / cols) + 1, col: (i % cols) + 1 }));
    }
    return at;
  }, [spec, cols, useRows]);

  const measure = useCallback(() => {
    const g = grid.current;
    if (!g) return;
    const next: Record<string, Box> = {};
    cards.current.forEach((el, id) => {
      next[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    });
    setBoxes(next);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
      measure();
    });
    ro.observe(el);
    if (grid.current) ro.observe(grid.current);
    return () => ro.disconnect();
  }, [measure]);

  // re-measure once the new grid has laid out
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [cols, useRows, measure]);

  const activeId = seq.step >= 0 ? spec.play[seq.step] : null;
  const reached = new Set(spec.play.slice(0, Math.max(0, seq.step + 1)));

  // the arrows walked so far, and the one being walked now
  const walked = new Set<number>();
  let current = -1;
  let laps = 1;
  for (let k = 1; k <= seq.step; k++) {
    const i = spec.edges.findIndex((e) => e.from === spec.play[k - 1] && e.to === spec.play[k]);
    if (i >= 0) {
      walked.add(i);
      if (spec.edges[i].kind === "loop") laps++;
      if (k === seq.step) current = i;
    }
  }

  const ready = Object.keys(boxes).length === spec.nodes.length;
  const edges = ready
    ? spec.edges.map((e, i) => {
        const a = boxes[e.from];
        const b = boxes[e.to];
        if (!a || !b) return null;
        const pts = route(a, b, e.kind);
        return { e, i, d: pathOf(pts), head: headOf(pts), label: labelAt(pts) };
      })
    : [];

  const hasLoop = spec.edges.some((e) => e.kind === "loop");
  // the pane stays on the latest card that has one, so the figure doesn't jump
  let paneId: string | null = null;
  for (let k = 0; k <= seq.step; k++) if (panes?.[spec.play[k]]) paneId = spec.play[k];
  if (seq.reduced && !paneId && panes) paneId = spec.play.find((id) => panes[id]) ?? null;
  const pane = paneId && panes?.[paneId];
  const firstIndex = (id: string) => spec.play.indexOf(id);

  return (
    <div ref={wrap} className="dg-flow-wrap" data-loop={hasLoop}>
      <Controls seq={seq} label={spec.laps && seq.step >= 0 ? `Round ${Math.min(laps, spec.laps)}` : undefined} />
      <div
        ref={grid}
        className="dg-flow"
        style={{ gridTemplateColumns: `repeat(${useRows ? spec.cols : cols}, minmax(0, 1fr))` }}
      >
        <svg className="dg-edges" aria-hidden>
          {edges.map(
            (x) =>
              x && (
                <g key={x.i} className="dg-edge" data-kind={x.e.kind} data-lit={walked.has(x.i) || seq.reduced}>
                  <path d={x.d} className="dg-edge-line" />
                  <path d={x.head} className="dg-edge-head" />
                  {x.e.kind === "cut" && (
                    <g transform={`translate(${x.label[0]} ${x.label[1]})`} className="dg-edge-cut">
                      <circle r="9" />
                      <path d="M-3.5,-3.5 L3.5,3.5 M3.5,-3.5 L-3.5,3.5" />
                    </g>
                  )}
                </g>
              ),
          )}
          {current >= 0 && edges[current] && !seq.reduced && <Pulse key={seq.step} d={edges[current]!.d} />}
        </svg>
        {edges.map(
          (x) =>
            x?.e.label && (
              <span
                key={`l${x.i}`}
                className="dg-edge-label"
                data-kind={x.e.kind}
                data-lit={walked.has(x.i) || seq.reduced}
                style={{ left: x.label[0], top: x.label[1] }}
              >
                {x.e.label}
              </span>
            ),
        )}
        {spec.nodes.map((n) => {
          const p = place.get(n.id)!;
          const state = n.id === activeId ? "active" : reached.has(n.id) || seq.reduced ? "done" : "idle";
          return (
            <div
              key={n.id}
              ref={(el) => {
                if (el) cards.current.set(n.id, el);
                else cards.current.delete(n.id);
              }}
              className="dg-node"
              data-state={state}
              data-tone={n.tone ?? "ink"}
              data-pane={!!panes?.[n.id]}
              style={{ gridRow: p.row, gridColumn: p.col }}
              onClick={() => firstIndex(n.id) >= 0 && seq.goto(firstIndex(n.id))}
            >
              {n.icon && (
                <span className="dg-node-icon">
                  <Icon name={n.icon} size={17} />
                </span>
              )}
              <span className="dg-node-label">{n.label}</span>
              {n.note && <span className="dg-node-note">{n.note}</span>}
            </div>
          );
        })}
      </div>
      {panes && (
        <div className="dg-pane" data-open={!!pane}>
          {pane && (
            <div key={paneId} className="dg-pane-inner">
              {pane}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
