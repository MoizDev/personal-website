"use client";

/**
 * A small Visualizer: tree-sum over a binary search tree, the program from
 * Dr. Rocket's own demo. Call cards stack on the left with the question each
 * call asked; a waiting call shows what it will do with a hole for the
 * answer. Returned values ride up into those holes. The tree sits on the
 * right, and anything the running call can't reach is faded. The bars under
 * it are the recursion graph: one bar per step, as deep as the stack.
 */

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";

type NodeId = "n5" | "n3" | "n8" | "n1" | "n4" | "n9";
const TREE: Record<NodeId, { key: number; l: NodeId | null; r: NodeId | null; at: [number, number] }> = {
  n5: { key: 5, l: "n3", r: "n8", at: [215, 0] },
  n3: { key: 3, l: "n1", r: "n4", at: [110, 80] },
  n8: { key: 8, l: null, r: "n9", at: [320, 80] },
  n1: { key: 1, l: null, r: null, at: [55, 160] },
  n4: { key: 4, l: null, r: null, at: [165, 160] },
  n9: { key: 9, l: null, r: null, at: [375, 160] },
};
const NODE_W = 40;
const NODE_H = 28;

type Hole = { hole: true; value?: number; fresh?: boolean };
type Seg = string | Hole;
type Frame = {
  id: number;
  node: NodeId | null;
  top?: boolean;
  status: "running" | "waiting";
  ask?: "Yes" | "No";
  foot?: Seg[];
};
type Step = { frames: Frame[]; say: ReactNode; ret?: { from: number; to: number; value: number } };

const C = ({ children }: { children: ReactNode }) => <code>{children}</code>;
const name = (n: NodeId | null) => (n ? `node ${TREE[n].key}` : "empty");

function build(): Step[] {
  const steps: Step[] = [];
  const top: Frame = { id: 0, node: "n5", top: true, status: "running" };
  const stack: Frame[] = [top];
  let uid = 1;
  const snap = (say: ReactNode, ret?: Step["ret"]) => {
    steps.push({ frames: stack.map((f) => ({ ...f, foot: f.foot?.map((s) => (typeof s === "string" ? s : { ...s })) })), say, ret });
    for (const f of stack) f.foot = f.foot?.map((s) => (typeof s === "string" ? s : { ...s, fresh: false }));
  };

  function call(n: NodeId | null, from: Frame, foot: Seg[], side: "left" | "right" | null): number {
    from.status = "waiting";
    from.ask = undefined;
    from.foot = foot;
    const f: Frame = { id: uid++, node: n, status: "running", ask: n ? "No" : "Yes" };
    stack.push(f);
    snap(
      side === null ? (
        <>
          <C>(tree-sum tree)</C> starts at node 5. <C>(empty? t)</C> says No.
        </>
      ) : n ? (
        <>
          tree-sum calls itself on t&apos;s {side}: {name(n)}. Not empty, so it keeps going.
        </>
      ) : (
        <>
          t&apos;s {side} is empty, so <C>(empty? t)</C> says Yes and the answer is 0.
        </>
      ),
    );
    let v = 0;
    if (n) {
      const k = TREE[n].key;
      const a = call(TREE[n].l, f, [`(+ ${k} `, { hole: true }, " (tree-sum (node-right t)))"], "left");
      const b = call(TREE[n].r, f, [`(+ ${k} ${a} `, { hole: true }, ")"], "right");
      v = k + a + b;
    }
    stack.pop();
    from.status = "running";
    from.foot = from.foot?.map((s) => (typeof s === "string" ? s : { hole: true, value: v, fresh: true }));
    snap(
      from.top ? (
        <>
          The first call returns {v}: the sum of every key in the tree.
        </>
      ) : (
        <>
          {n ? `The call on ${name(n)}` : "It"} returns {v}, which fills the hole in {name(from.node)}&apos;s call.
        </>
      ),
      { from: f.id, to: from.id, value: v },
    );
    return v;
  }

  call("n5", top, ["→ ", { hole: true }], null);
  return steps;
}

/* ---------- layout ---------- */

const CW = 6.62; // advance of an 11px monospace character
const W_CARD = 272;
const HEAD = 30;
const ROW = 22;
const ASK = 24;
const FOOT = 28;
const GAP = 26;
const CODE_X = 48;

function cardH(f: Frame) {
  return HEAD + ROW + (f.ask ? ASK : 0) + (f.foot ? FOOT : 0);
}

type Lay = { W: number; H: number; stack: [number, number]; tree: [number, number]; s: number; narrow: boolean };
const WIDE: Lay = { W: 920, H: 520, stack: [16, 14], tree: [430, 70], s: 1.05, narrow: false };
const NARROW: Lay = { W: 304, H: 720, stack: [16, 214], tree: [10, 18], s: 0.66, narrow: true };

function stackPos(frames: Frame[], lay: Lay) {
  const pos = new Map<number, { x: number; y: number; h: number }>();
  let y = lay.stack[1];
  for (const f of frames) {
    const h = cardH(f);
    pos.set(f.id, { x: lay.stack[0], y, h });
    y += h + GAP;
  }
  return pos;
}

function nodeAt(id: NodeId, lay: Lay) {
  const [x, y] = TREE[id].at;
  return { cx: lay.tree[0] + (x + NODE_W / 2) * lay.s, cy: lay.tree[1] + (y + NODE_H / 2) * lay.s, w: NODE_W * lay.s, h: NODE_H * lay.s };
}

function holeX(foot: Seg[]): number {
  let x = CODE_X;
  for (const s of foot) {
    if (typeof s === "string") x += s.length * CW;
    else return x;
  }
  return x;
}

function segWidth(s: Seg) {
  if (typeof s === "string") return s.length * CW;
  return s.value === undefined ? 24 : String(s.value).length * CW + 12;
}

function reach(n: NodeId | null, out = new Set<NodeId>()) {
  if (!n) return out;
  out.add(n);
  reach(TREE[n].l, out);
  reach(TREE[n].r, out);
  return out;
}

/* ---------- drawing ---------- */

function Card({ f, x, y }: { f: Frame; x: number; y: number }) {
  const h = cardH(f);
  const running = f.status === "running";
  const head = f.top ? "Top level" : `(tree-sum ${name(f.node)})`;
  let fy = HEAD + ROW;
  return (
    <g className="drf-mv-card" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className="drf-mv-pop" data-running={running ? "" : undefined}>
        <rect className="drf-mv-card-bg" width={W_CARD} height={h} rx={8} />
        <text className="drf-mv-head drf-mono" x={12} y={19}>
          {head}
        </text>
        <g transform={`translate(${W_CARD - 12}, 15)`}>
          <rect className="drf-mv-pill" x={running ? -54 : -48} y={-8} width={running ? 54 : 48} height={16} rx={8} />
          <text className="drf-mv-pill-text" x={running ? -27 : -24} y={3.5} textAnchor="middle">
            {running ? "RUNNING" : "waiting"}
          </text>
        </g>
        <line className="drf-mv-rule" x1={0} x2={W_CARD} y1={HEAD} y2={HEAD} />
        <text className="drf-mv-var drf-mono" x={12} y={HEAD + 15}>
          {f.top ? "tree" : "t"}
        </text>
        <line className="drf-mv-dots" x1={f.top ? 44 : 26} x2={W_CARD - 74} y1={HEAD + 11} y2={HEAD + 11} />
        <text className="drf-mv-val drf-mono" x={W_CARD - 24} y={HEAD + 15} textAnchor="end">
          {name(f.node)}
        </text>
        {f.node && <circle className="drf-mv-dot" cx={W_CARD - 12} cy={HEAD + 11} r={3} />}
        {f.ask && (
          <g transform={`translate(0, ${HEAD + ROW})`}>
            <line className="drf-mv-rule" x1={0} x2={W_CARD} y1={0} y2={0} />
            <text className="drf-mv-label" x={12} y={15.5}>
              ASKS
            </text>
            <text className="drf-mv-code drf-mono" x={CODE_X} y={16}>
              (empty? t)
            </text>
            <g className="drf-mv-stamp" data-yes={f.ask === "Yes" ? "" : undefined} transform={`translate(${CODE_X + 10 * CW + 22}, 12)`}>
              <rect x={-15} y={-8} width={30} height={16} rx={8} />
              <text y={3.5} textAnchor="middle">
                {f.ask}
              </text>
            </g>
          </g>
        )}
        {f.foot && (
          <g transform={`translate(0, ${(fy += f.ask ? ASK : 0)})`}>
            <rect className="drf-mv-foot-bg" x={0.5} y={0} width={W_CARD - 1} height={FOOT - 0.5} rx={0} />
            <line className="drf-mv-rule" x1={0} x2={W_CARD} y1={0} y2={0} />
            <text className="drf-mv-label" x={12} y={17.5}>
              THEN
            </text>
            {(() => {
              let sx = CODE_X;
              return f.foot.map((s, i) => {
                const x0 = sx;
                sx += segWidth(s);
                if (typeof s === "string")
                  return (
                    <text key={i} className="drf-mv-code drf-mono" x={x0} y={18} style={{ whiteSpace: "pre" }}>
                      {s}
                    </text>
                  );
                const w = segWidth(s);
                return (
                  <g key={i} className="drf-mv-hole" data-filled={s.value !== undefined ? "" : undefined} data-fresh={s.fresh ? "" : undefined}>
                    <rect x={x0} y={6} width={w} height={16} rx={5} />
                    <text className="drf-mono" x={x0 + w / 2} y={18} textAnchor="middle">
                      {s.value === undefined ? "···" : s.value}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        )}
      </g>
    </g>
  );
}

export function MiniViz() {
  const wrap = useRef<HTMLDivElement>(null);
  const steps = useMemo(build, []);
  const seq = useSequence(wrap, steps.length, { delay: [700, ...steps.slice(1).map((s) => (s.ret ? 1250 : 1050))], loop: true, hold: 3200 });
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lay = narrow ? NARROW : WIDE;
  const i = Math.max(0, seq.step);
  const started = seq.step >= 0;
  const step = started ? steps[i] : { frames: [{ id: 0, node: "n5" as NodeId, top: true, status: "running" as const }], say: null };
  const pos = stackPos(step.frames, lay);
  const running = step.frames[step.frames.length - 1];
  const lit = started ? reach(running.node) : new Set<NodeId>(Object.keys(TREE) as NodeId[]);
  const held = new Set(step.frames.map((f) => f.node).filter(Boolean) as NodeId[]);

  // where a returned value starts (the card it came from, a step ago) and lands (the hole)
  let travel: { fx: number; fy: number; tx: number; ty: number; v: number } | null = null;
  if (started && "ret" in step && step.ret && i > 0) {
    const before = stackPos(steps[i - 1].frames, lay).get(step.ret.from);
    const to = pos.get(step.ret.to);
    const parent = step.frames.find((f) => f.id === step.ret!.to);
    if (before && to && parent?.foot) {
      travel = {
        fx: before.x + W_CARD / 2,
        fy: before.y + 15,
        tx: to.x + holeX(parent.foot) + segWidth({ hole: true, value: step.ret.value }) / 2,
        ty: to.y + to.h - FOOT / 2,
        v: step.ret.value,
      };
    }
  }

  const depth = (s: Step) => s.frames.length - 1;
  const maxDepth = Math.max(...steps.map(depth));

  return (
    <div ref={wrap} className="drf-mv" data-tone="blue">
      <Controls seq={seq} label={started ? `Step ${i + 1} of ${steps.length}` : undefined} />
      <svg className="drf-mv-svg" viewBox={`0 0 ${lay.W} ${lay.H}`} role="img" aria-label="tree-sum running over a binary search tree, one call at a time">
        {/* tree */}
        <g className="drf-mv-tree">
          {(Object.keys(TREE) as NodeId[]).map((id) => {
            const a = nodeAt(id, lay);
            return (["l", "r"] as const).map((side) => {
              const c = TREE[id][side];
              if (c) {
                const b = nodeAt(c, lay);
                return (
                  <path
                    key={id + side}
                    className="drf-mv-edge"
                    data-dim={!lit.has(c) ? "" : undefined}
                    d={`M${a.cx},${a.cy + a.h / 2} C${a.cx},${(a.cy + b.cy) / 2} ${b.cx},${(a.cy + b.cy) / 2} ${b.cx},${b.cy - b.h / 2}`}
                  />
                );
              }
              const sx = a.cx + (side === "l" ? -1 : 1) * 14 * lay.s;
              const sy = a.cy + a.h / 2 + 18 * lay.s;
              return <line key={id + side} className="drf-mv-stub" data-dim={!lit.has(id) ? "" : undefined} x1={a.cx + (side === "l" ? -6 : 6) * lay.s} y1={a.cy + a.h / 2} x2={sx} y2={sy} />;
            });
          })}
          {(Object.keys(TREE) as NodeId[]).map((id) => {
            const a = nodeAt(id, lay);
            return (
              <g
                key={id}
                className="drf-mv-node"
                data-dim={!lit.has(id) ? "" : undefined}
                data-held={held.has(id) ? "" : undefined}
                data-running={started && running.node === id ? "" : undefined}
              >
                <rect x={a.cx - a.w / 2} y={a.cy - a.h / 2} width={a.w} height={a.h} rx={8 * lay.s} />
                <text className="drf-mono" x={a.cx} y={a.cy + 4} textAnchor="middle" style={{ fontSize: 13 * lay.s }}>
                  {TREE[id].key}
                </text>
              </g>
            );
          })}
        </g>

        {/* call stack connectors */}
        {step.frames.slice(1).map((f, k) => {
          const a = pos.get(step.frames[k].id)!;
          const b = pos.get(f.id)!;
          return <path key={`s${f.id}`} className="drf-mv-link" d={`M${a.x + W_CARD / 2},${a.y + a.h} L${b.x + W_CARD / 2},${b.y - 3}`} />;
        })}

        {/* frames to the nodes they hold */}
        {step.frames.map((f) => {
          if (!f.node) return null;
          const p = pos.get(f.id)!;
          const n = nodeAt(f.node, lay);
          const x1 = p.x + W_CARD - 12;
          const y1 = p.y + HEAD + 11;
          const d = lay.narrow
            ? `M${x1},${y1} C${x1 + 14},${y1 - 40} ${n.cx},${n.cy + 70} ${n.cx},${n.cy + n.h / 2}`
            : `M${x1},${y1} C${x1 + 70},${y1} ${n.cx - n.w / 2 - 70},${n.cy} ${n.cx - n.w / 2},${n.cy}`;
          return <path key={`r${f.id}-${f.node}`} className="drf-mv-ref" data-running={f === running && started ? "" : undefined} d={d} />;
        })}

        {step.frames.map((f) => {
          const p = pos.get(f.id)!;
          return <Card key={f.id} f={f} x={p.x} y={p.y} />;
        })}

        {travel && (
          <g
            key={`t${i}`}
            className="drf-mv-travel"
            style={
              {
                "--fx": `${travel.fx}px`,
                "--fy": `${travel.fy}px`,
                "--tx": `${travel.tx}px`,
                "--ty": `${travel.ty}px`,
              } as React.CSSProperties
            }
          >
            <rect x={-14} y={-10} width={28} height={20} rx={10} />
            <text className="drf-mono" y={4} textAnchor="middle">
              {travel.v}
            </text>
          </g>
        )}
      </svg>

      <div className="drf-mv-say" aria-live="polite">
        {step.say ?? <>&nbsp;</>}
      </div>

      <div className="drf-mv-graph" role="group" aria-label="Recursion graph: pick a step">
        {steps.map((s, k) => (
          <button
            key={k}
            type="button"
            className="drf-mv-bar"
            data-past={started && k <= i ? "" : undefined}
            data-now={started && k === i ? "" : undefined}
            style={{ height: 6 + (depth(s) / maxDepth) * 30 }}
            onClick={() => seq.goto(k)}
            aria-label={`Step ${k + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
