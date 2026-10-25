"use client";

/**
 * A flow: nodes on a grid joined by arrows. Nodes are cards by default, or
 * flowchart shapes (decisions, terminals, stores, documents, actors...). The
 * highlight walks the `play` order and a token runs along each arrow it takes.
 * Loop arrows (~>) route around the nodes, or around the whole chart with
 * @left / @right. Groups shade a few nodes; lanes are full-width bands. Click
 * a node to stop on it; if the figure has a pane for it, the pane opens below.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import type { FlowEdge, FlowSpec, Shape } from "./parse";
import { useSequence } from "./usePlayback";

/** A node's box in the grid, plus where side arrows meet it (l, r at height cy). */
type Box = { x: number; y: number; w: number; h: number; l: number; r: number; cy: number; shape: Shape };
type Pt = [number, number];

const MIN_CARD = 128; // narrowest a card gets before the grid drops a column
const COL_GAP = 40;
// on a phone, a chart keeps its layout with tighter cards rather than reflowing
const COMPACT_BELOW = 560;
const MIN_CARD_COMPACT = 84;
const COL_GAP_COMPACT = 14;
const AROUND = 24; // how far outside the chart an @left / @right arrow runs

const overlapY = (a: Box, b: Box) => a.y < b.y + b.h && b.y < a.y + a.h;

/** The height a side arrow between two boxes should run at, if one line can join them. */
function sideY(a: Box, b: Box): number | null {
  // a diamond is joined at its corner and an actor at its disc, so their height is fixed
  const fixed = (q: Box) => q.shape === "decide" || q.shape === "round";
  if (fixed(a) && fixed(b)) return Math.abs(a.cy - b.cy) < 3 ? a.cy : null;
  const pick = fixed(b) ? b.cy : a.cy;
  const inside = (q: Box) => pick > q.y + 4 && pick < q.y + q.h - 4;
  return inside(a) && inside(b) ? pick : null;
}

/** An arrow around the outside of the chart, on one side. */
function around(a: Box, b: Box, side: "left" | "right", all: Box[]): Pt[] {
  const right = side === "right";
  const X = right ? Math.max(...all.map((q) => q.x + q.w)) + AROUND : Math.min(...all.map((q) => q.x)) - AROUND;
  // a node with others beside it on that side is left from its bottom, or entered from its top
  const blocked = (q: Box) => all.some((o) => o !== q && overlapY(o, q) && (right ? o.x > q.x : o.x < q.x));
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  const out: Pt[] = blocked(a)
    ? [[acx, a.y + a.h], [acx, a.y + a.h + 18], [X, a.y + a.h + 18]]
    : [[right ? a.r : a.l, a.cy], [X, a.cy]];
  const into: Pt[] = blocked(b)
    ? [[X, b.y - 18], [bcx, b.y - 18], [bcx, b.y]]
    : [[X, b.cy], [right ? b.r : b.l, b.cy]];
  return [...out, ...into];
}

/** Where an arrow runs, as a list of corner points. */
function route(a: Box, b: Box, e: FlowEdge, all: Box[]): Pt[] {
  if (e.via) return around(a, b, e.via, all);
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  const loop = e.kind === "loop";
  const sameCol = Math.abs(acx - bcx) < 6;
  if (overlapY(a, b) && !sameCol) {
    const y = sideY(a, b);
    if (!loop && y !== null) return b.x > a.x ? [[a.r, y], [b.l, y]] : [[a.l, y], [b.r, y]];
    if (!loop) {
      // same row, different heights: a step in the gap between them
      const fwd = b.x > a.x;
      const mx = fwd ? (a.r + b.l) / 2 : (a.l + b.r) / 2;
      return [[fwd ? a.r : a.l, a.cy], [mx, a.cy], [mx, b.cy], [fwd ? b.l : b.r, b.cy]];
    }
    // round the back of the row, underneath
    const y2 = Math.max(a.y + a.h, b.y + b.h) + 24;
    return [[acx, a.y + a.h], [acx, y2], [bcx, y2], [bcx, b.y + b.h]];
  }
  if (sameCol) {
    if (b.y > a.y && !loop) return [[acx, a.y + a.h], [bcx, b.y]];
    if (b.y < a.y && !loop) return [[acx, a.y], [bcx, b.y + b.h]];
    // a loop runs up the right-hand side, inside the gap if a column sits there
    const right = Math.max(a.x + a.w, b.x + b.w);
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y + a.h, b.y + b.h);
    const next = all.filter((q) => q.x >= right && q.y < bottom && q.y + q.h > top).map((q) => q.x);
    const x = next.length ? (right + Math.min(...next)) / 2 : right + 22;
    return [[a.r, a.cy], [x, a.cy], [x, b.cy], [b.r, b.cy]];
  }
  if (b.y > a.y) {
    // a decision leaves by the corner facing its branch, then drops into it
    if (a.shape === "decide") return [[bcx > acx ? a.r : a.l, a.cy], [bcx, a.cy], [bcx, b.y]];
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
function labelAt(pts: Pt[]): { at: Pt; len: number; flat: boolean } {
  let len = 0;
  let at: Pt = pts[0];
  let flat = false;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (l > len) {
      len = l;
      at = [(pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2];
      flat = Math.abs(pts[i][1] - pts[i - 1][1]) < 1;
    }
  }
  return { at, len, flat };
}

/** The middle of the last segment: a second place for a label when the first is taken. */
function lastAt(pts: Pt[]): Pt {
  const [x1, y1] = pts[pts.length - 1];
  const [x0, y0] = pts[pts.length - 2];
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

/** A rough box for a label, to keep two labels from landing on each other. */
function labelBox(at: Pt, text: string, tight: boolean) {
  const w = text.length * (tight ? 6 : 6.8) + (tight ? 4 : 20);
  const h = tight ? 16 : 24;
  return tight ? { l: at[0] - w / 2, r: at[0] + w / 2, t: at[1] - h - 3, b: at[1] - 3 } : { l: at[0] - w / 2, r: at[0] + w / 2, t: at[1] - h / 2, b: at[1] + h / 2 };
}

/** A decision's branch label ("yes", "no") sits just past where the branch leaves. */
function branchAt(pts: Pt[]): { at: Pt; vertical: boolean; left: boolean } {
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  const vertical = Math.abs(x1 - x0) < 1;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const k = Math.min(16, len / 2);
  return { at: [x0 + ((x1 - x0) / len) * k, y0 + ((y1 - y0) / len) * k], vertical, left: x1 < x0 };
}

/**
 * The token that runs along an arrow once: a dot, or a small disc carrying an
 * icon. Drawn straight to the DOM, so it costs no renders.
 */
function Token({ d, icon }: { d: string; icon?: string }) {
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);
  const ms = icon ? 860 : 560;
  useEffect(() => {
    const p = path.current;
    const g = dot.current;
    if (!p || !g) return;
    const len = p.getTotalLength();
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const pt = p.getPointAtLength(e * len);
      g.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      g.setAttribute("opacity", t >= 1 ? "0" : "1");
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d, ms]);
  return (
    <g className="dg-pulse">
      <path ref={path} d={d} fill="none" stroke="none" />
      <g ref={dot} opacity={0}>
        {icon ? (
          <g className="dg-token-icon">
            <circle r={11} />
            <g transform="translate(-6.5 -6.5)">
              <Icon name={icon} size={13} />
            </g>
          </g>
        ) : (
          <circle r={4.5} />
        )}
      </g>
    </g>
  );
}

/** Outlines for the shapes CSS can't draw, in a 100 × 100 box stretched to the node. */
const OUTLINE: Partial<Record<Shape, string>> = {
  decide: "M50,1 L99,50 L50,99 L1,50 Z",
  io: "M11,1 L99,1 L89,99 L1,99 Z",
  doc: "M1,1 L99,1 L99,86 C80,74 64,100 40,92 C26,87 12,86 1,92 Z",
};

/** Text with `code` in backticks shown as small code chips. */
function rich(text: string): ReactNode {
  if (!text.includes("`")) return text;
  return text.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>));
}

export function Flow({ spec, panes }: { spec: FlowSpec; panes?: Record<string, ReactNode> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLDivElement>());
  const [width, setWidth] = useState(0);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [gridW, setGridW] = useState(0);

  const seq = useSequence(wrap, spec.play.length, { loop: true, delay: [500, ...spec.play.slice(1).map(() => 1050)], hold: 3200 });

  const shapeOf = useMemo(() => new Map(spec.nodes.map((n) => [n.id, n.shape ?? "card"] as const)), [spec]);
  const hasLanes = !!spec.groups?.some((g) => g.kind === "lane");
  const hasGroups = !!spec.groups?.some((g) => g.kind === "group");
  const viaLeft = spec.edges.some((e) => e.via === "left");
  const viaRight = spec.edges.some((e) => e.via === "right");

  // how many columns fit
  const compact = width > 0 && width < COMPACT_BELOW;
  const minCard = compact ? MIN_CARD_COMPACT : MIN_CARD;
  const gap = compact ? COL_GAP_COMPACT : COL_GAP;
  const inner = width - (hasLanes ? (compact ? 28 : 36) : hasGroups ? 28 : 0);
  const cols = width ? Math.max(1, Math.min(spec.cols, Math.floor((inner + gap) / (minCard + gap)))) : spec.cols;
  const useRows = !!spec.rows && cols === spec.cols;
  // regions only make sense in the layout they were drawn for
  const showGroups = !!spec.groups && (useRows || !spec.rows);

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
      const x = el.offsetLeft;
      const y = el.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const shape = shapeOf.get(id) ?? "card";
      // an actor is joined at its disc, not at its label
      const disc = shape === "round" ? el.querySelector<HTMLElement>(".dg-node-icon") : null;
      next[id] = disc
        ? { x, y, w, h, shape, l: x + disc.offsetLeft, r: x + disc.offsetLeft + disc.offsetWidth, cy: y + disc.offsetTop + disc.offsetHeight / 2 }
        : { x, y, w, h, shape, l: x, r: x + w, cy: y + h / 2 };
    });
    setBoxes(next);
    setGridW(g.clientWidth);
  }, [shapeOf]);

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
  }, [cols, useRows, compact, measure]);

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
  const all = Object.values(boxes);
  const edges = ready
    ? spec.edges.map((e, i) => {
        const a = boxes[e.from];
        const b = boxes[e.to];
        if (!a || !b) return null;
        const pts = route(a, b, e, all);
        const branch = a.shape === "decide" && !e.via ? branchAt(pts) : null;
        const { at: label, len, flat } = labelAt(pts);
        // a label on a vertical run beside the chart turns to run along it
        const along = e.via ?? (label[0] > Math.max(a.r, b.r) + 1 ? "right" : undefined);
        // a label too wide for its line sits above it instead of across it
        const tight = flat && len < 56;
        // on a phone, a label much wider than its short line is left out; the token still runs
        const words = (e.label?.length ?? 0) * 6 + 4;
        const dropped = compact && tight && !branch && words > len + 8;
        // a branch on a short flat line sits on the line, over it, so it can't touch the next box
        const onLine = compact && branch && !branch.vertical && Math.abs(pts[1][0] - pts[0][0]) < 44;
        return { e, i, pts, d: pathOf(pts), head: headOf(pts), label, branch, along, tight, dropped, onLine };
      })
    : [];

  // a label that would land on an earlier one moves to its arrow's last stretch
  const taken: ReturnType<typeof labelBox>[] = [];
  const hits = (q: ReturnType<typeof labelBox>) => taken.some((o) => q.l < o.r && o.l < q.r && q.t < o.b && o.t < q.b);
  for (const x of edges) {
    if (!x?.e.label || x.branch || x.along || x.dropped) continue;
    let box = labelBox(x.label, x.e.label, x.tight);
    if (hits(box) && x.pts.length > 2) {
      const alt = lastAt(x.pts);
      const altBox = labelBox(alt, x.e.label, false);
      if (!hits(altBox)) {
        x.label = alt;
        x.tight = false;
        box = altBox;
      }
    }
    taken.push(box);
  }

  const regions =
    ready && showGroups
      ? spec.groups!.map((g, i) => {
          const bs = g.ids.map((id) => boxes[id]).filter(Boolean);
          const top = Math.min(...bs.map((b) => b.y));
          const bottom = Math.max(...bs.map((b) => b.y + b.h));
          const lit = g.ids.includes(activeId ?? "") || seq.reduced || g.ids.some((id) => reached.has(id));
          if (g.kind === "lane") return { g, i, lit, left: 0, top: top - 12, width: gridW, height: bottom - top + 24 };
          const left = Math.min(...bs.map((b) => b.x));
          const right = Math.max(...bs.map((b) => b.x + b.w));
          return { g, i, lit, left: left - 14, top: top - 30, width: right - left + 28, height: bottom - top + 44 };
        })
      : [];

  const hasLoop = spec.edges.some((e) => e.kind === "loop");
  // the pane stays on the latest card that has one, so the figure doesn't jump
  let paneId: string | null = null;
  for (let k = 0; k <= seq.step; k++) if (panes?.[spec.play[k]]) paneId = spec.play[k];
  if (seq.reduced && !paneId && panes) paneId = spec.play.find((id) => panes[id]) ?? null;
  const pane = paneId && panes?.[paneId];
  const firstIndex = (id: string) => spec.play.indexOf(id);
  const walking = current >= 0 && edges[current] && !seq.reduced ? edges[current] : null;

  return (
    <div
      ref={wrap}
      className="dg-flow-wrap"
      data-loop={hasLoop}
      data-compact={compact || undefined}
      data-via-left={viaLeft || undefined}
      data-via-right={viaRight || undefined}
    >
      <Controls seq={seq} label={spec.laps && seq.step >= 0 ? `Round ${Math.min(laps, spec.laps)}` : undefined} />
      <div
        ref={grid}
        className="dg-flow"
        data-lanes={(showGroups && hasLanes) || undefined}
        data-groups={(showGroups && hasGroups) || undefined}
        style={{ gridTemplateColumns: `repeat(${useRows ? spec.cols : cols}, minmax(0, 1fr))`, columnGap: gap }}
      >
        {regions.map((x) => (
          <div
            key={`g${x.i}`}
            className="dg-group"
            data-kind={x.g.kind}
            data-tone={x.g.tone ?? "gray"}
            data-lit={x.lit}
            style={{ left: x.left, top: x.top, width: x.width, height: x.height }}
          >
            <span className="dg-group-label">
              {x.g.icon && <Icon name={x.g.icon} size={12} />}
              {x.g.label}
            </span>
          </div>
        ))}
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
          {walking && <Token key={seq.step} d={walking.d} icon={walking.e.icon} />}
        </svg>
        {edges.map((x) => {
          if (!x?.e.label || x.dropped) return null;
          const lit = walked.has(x.i) || seq.reduced;
          if (x.branch) {
            const [bx, by] = x.branch.at;
            return (
              <span
                key={`l${x.i}`}
                className="dg-edge-label"
                data-branch={x.onLine ? "line" : ""}
                data-lit={lit}
                style={
                  x.onLine
                    ? { left: (x.pts[0][0] + x.pts[1][0]) / 2, top: x.pts[0][1] }
                    : x.branch.vertical
                    ? { left: bx + 7, top: by, transform: "translate(0, -50%)" }
                    : { left: bx, top: by - 4, transform: x.branch.left ? "translate(-100%, -100%)" : "translate(0, -100%)" }
                }
              >
                {x.e.label}
              </span>
            );
          }
          return (
            <span
              key={`l${x.i}`}
              className="dg-edge-label"
              data-kind={x.e.kind}
              data-via={x.along}
              data-tight={x.tight || undefined}
              data-lit={lit}
              style={{ left: x.label[0], top: x.label[1] }}
            >
              {x.e.label}
            </span>
          );
        })}
        {spec.nodes.map((n) => {
          const p = place.get(n.id)!;
          const shape = n.shape ?? "card";
          const state = n.id === activeId ? "active" : reached.has(n.id) || seq.reduced ? "done" : "idle";
          return (
            <div
              key={n.id}
              ref={(el) => {
                if (el) cards.current.set(n.id, el);
                else cards.current.delete(n.id);
              }}
              className="dg-node"
              data-shape={shape}
              data-state={state}
              data-tone={n.tone ?? "ink"}
              data-pane={!!panes?.[n.id]}
              style={{ gridRow: p.row, gridColumn: p.col }}
              onClick={() => firstIndex(n.id) >= 0 && seq.goto(firstIndex(n.id))}
            >
              {OUTLINE[shape] && (
                <svg className="dg-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                  <path d={OUTLINE[shape]} vectorEffect="non-scaling-stroke" />
                </svg>
              )}
              {n.icon && (
                <span className="dg-node-icon">
                  <Icon name={n.icon} size={shape === "round" ? 20 : shape === "card" ? 17 : 14} />
                </span>
              )}
              <span className="dg-node-text">
                <span className="dg-node-label">{rich(n.label)}</span>
                {n.note && <span className="dg-node-note">{rich(n.note)}</span>}
              </span>
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
