"use client";

/**
 * Choreographing a step. When the Visualizer moves to a new step, what changed
 * inside the cards animates over one transition (FX_SECS, 0.6 s), and each part
 * runs in its own window of it, eased with a cubic ease-out (mod.rs:864-884).
 * On the step where (tree-sum node 1) returns 1, the old question band fades,
 * the value appears, rides up the connector into its caller's hole and lands,
 * while the caller lights up (mod.rs:1100-1312). The timeline on the right is
 * that schedule; drag it to scrub. While playing, the whole transition is
 * squeezed into 0.85 / speed seconds (mod.rs:1025).
 *
 * Below: positions glide for 0.35 s (ANIM_SECS), and when a new step arrives
 * mid-glide, every glide restarts from where things are drawn right now
 * (mod.rs:923-934). The left lane is the counterfactual: restarting from the
 * last layout makes the box jump to where it was headed first.
 */

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Choreo.css";

/* ---------- timing, from src/visualizer/mod.rs ---------- */

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const phase = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const TRAVEL: [number, number] = [0.2, 0.75];
const FX_SECS = 0.6;
const ANIM_SECS = 0.35;

/** Each animated part of the return step and its window of the transition. */
const PARTS: { key: string; label: string; a: number; b: number; tone: "gray" | "green"; out?: boolean }[] = [
  { key: "band", label: "Old question fades out", a: 0, b: 0.25, tone: "gray", out: true },
  { key: "chip", label: "Returned value appears", a: 0, b: TRAVEL[0] + 0.05, tone: "green" },
  { key: "row", label: "returns row fades in", a: 0.2, b: 0.55, tone: "green" },
  { key: "ride", label: "Value rides up the connector", a: TRAVEL[0], b: TRAVEL[1], tone: "green" },
  { key: "lit", label: "Caller lights up", a: TRAVEL[0], b: TRAVEL[1], tone: "green" },
  { key: "glow", label: "New row's glow fades", a: 0.3, b: 1, tone: "green", out: true },
  { key: "land", label: "Value lands in the hole", a: TRAVEL[1], b: 1, tone: "green" },
];

/** Playback speeds as the toolbar sets them (racket_ui.rs:2196-2201). */
const SPEEDS = [
  { label: "1×", v: 1 },
  { label: "2×", v: 2.5 },
  { label: "4×", v: 5 },
  { label: "8×", v: 10 },
];
const fxSecs = (speed: number) => Math.min(FX_SECS, 0.85 / speed);

/* the figure plays slowed down so the parts can be told apart */
const SLOW_A = 4;
const SLOW_B = 6;
const DUR_A = FX_SECS * 1000 * SLOW_A;
const CUT = 0.25; // the new step arrives a quarter of the way through the glide
const DUR_B = ANIM_SECS * (1 + CUT) * 1000 * SLOW_B;

/* ---------- the scene: two call cards ---------- */

const CW = 6.62;
const W = 296;
const HEAD = 30;
const ROW = 22;
const FOOT = 28;
const CODE_X = 48;
const X0 = 10;
const CALLER_Y = 8;
const CALLER_H = HEAD + ROW + FOOT;
const CALLEE_Y = CALLER_Y + CALLER_H + 64;
const CALLEE_H = HEAD + ROW + 24;
const PRE = "(+ 3 ";
const POST = " (tree-sum (node-right t)))";
const HOLE_W = 24;
const HOLE_X = X0 + CODE_X + PRE.length * CW;
const FROM = { x: HOLE_X + HOLE_W / 2, y: CALLER_Y + HEAD + ROW + 22 + 2 };
const TO = { x: X0 + W / 2, y: CALLEE_Y };

/** A point along the connector, a cubic with vertical handles (as in mod.rs:1069-1080). */
function curveAt(s: number) {
  const bend = (TO.y - FROM.y) * 0.5;
  const c1 = { x: FROM.x, y: FROM.y + bend };
  const c2 = { x: TO.x, y: TO.y - bend };
  const u = 1 - s;
  return {
    x: u * u * u * FROM.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * TO.x,
    y: u * u * u * FROM.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * TO.y,
  };
}
const CURVE = `M${FROM.x},${FROM.y} C${FROM.x},${(FROM.y + TO.y) / 2} ${TO.x},${(FROM.y + TO.y) / 2} ${TO.x},${TO.y}`;

const mix = (a: string, b: string, k: number) => `color-mix(in srgb, ${b} ${Math.round(k * 100)}%, ${a})`;

function Scene({ t }: { t: number }) {
  const returning = t > 0;
  const band = 1 - phase(t, 0, 0.25);
  const row = phase(t, 0.2, 0.55);
  const glow = returning ? 1 - phase(t, 0.3, 1) : 0;
  const lit = phase(t, TRAVEL[0], TRAVEL[1]);
  const chipA = phase(t, 0, TRAVEL[0] + 0.05);
  const k = phase(t, TRAVEL[0], TRAVEL[1]);
  const at = curveAt(1 - k);
  const landed = t >= TRAVEL[1] ? phase(t, TRAVEL[1], 1) : 0;
  const green = "var(--t-green)";
  const blue = "var(--tone)";
  const line = "rgba(var(--ink-rgb), 0.2)";

  return (
    <svg className="drf-mv-svg drf-ch-scene" viewBox={`0 0 ${W + 20} ${CALLEE_Y + CALLEE_H + 10}`} role="img" aria-label="(tree-sum node 1) returns 1, which rides up the connector into the hole in its caller, (tree-sum node 3).">
      {/* the connector: a call going down, then a value coming back up */}
      <path className="drf-ch-conn" d={CURVE} style={{ stroke: returning ? green : mix(line, blue, 0.6) }} />
      {returning ? (
        <path className="drf-ch-tip" d={`M${FROM.x},${FROM.y} l-3.6,6 h7.2 z`} style={{ fill: green }} />
      ) : (
        <path className="drf-ch-tip" d={`M${TO.x},${TO.y} l-3.6,-6 h7.2 z`} style={{ fill: mix(line, blue, 0.6) }} />
      )}

      {/* the caller, waiting on the hole in its footer */}
      <g transform={`translate(${X0}, ${CALLER_Y})`}>
        <rect
          className="drf-mv-card-bg"
          width={W}
          height={CALLER_H}
          rx={8}
          style={{ stroke: mix(line, green, lit), strokeWidth: 1 + 0.6 * lit }}
        />
        <text className="drf-mv-head drf-mono" x={12} y={19}>
          (tree-sum node 3)
        </text>
        <g transform={`translate(${W - 12}, 15)`}>
          <rect className="drf-mv-pill" x={-48} y={-8} width={48} height={16} rx={8} />
          <text className="drf-mv-pill-text" x={-24} y={3.5} textAnchor="middle">
            waiting
          </text>
        </g>
        <line className="drf-mv-rule" x1={0} x2={W} y1={HEAD} y2={HEAD} />
        <text className="drf-mv-var drf-mono" x={12} y={HEAD + 15}>
          t
        </text>
        <line className="drf-mv-dots" x1={26} x2={W - 74} y1={HEAD + 11} y2={HEAD + 11} />
        <text className="drf-mv-val drf-mono" x={W - 24} y={HEAD + 15} textAnchor="end">
          node 3
        </text>
        <circle className="drf-mv-dot" cx={W - 12} cy={HEAD + 11} r={3} />
        <g transform={`translate(0, ${HEAD + ROW})`}>
          <rect className="drf-mv-foot-bg" x={0.5} y={0} width={W - 1} height={FOOT - 0.5} />
          <line className="drf-mv-rule" x1={0} x2={W} y1={0} y2={0} />
          <text className="drf-mv-label" x={12} y={17.5}>
            THEN
          </text>
          <text className="drf-mv-code drf-mono" x={CODE_X} y={18}>
            {PRE}
          </text>
          <g className="drf-mv-hole" style={{ opacity: 1 - landed }}>
            <rect x={CODE_X + PRE.length * CW} y={6} width={HOLE_W} height={16} rx={5} />
            <text className="drf-mono" x={CODE_X + PRE.length * CW + HOLE_W / 2} y={18} textAnchor="middle">
              ···
            </text>
          </g>
          <g className="drf-mv-hole drf-ch-landed" data-filled="" style={{ opacity: landed }}>
            <rect x={CODE_X + PRE.length * CW} y={6} width={HOLE_W} height={16} rx={5} />
            <text className="drf-mono" x={CODE_X + PRE.length * CW + HOLE_W / 2} y={18} textAnchor="middle">
              1
            </text>
          </g>
          <text className="drf-mv-code drf-mono" x={CODE_X + PRE.length * CW + HOLE_W} y={18}>
            {POST}
          </text>
        </g>
      </g>

      {/* the call that returns */}
      <g transform={`translate(${X0}, ${CALLEE_Y})`}>
        <rect className="drf-mv-card-bg" width={W} height={CALLEE_H} rx={8} style={{ stroke: returning ? green : blue, strokeWidth: 1.6 }} />
        <text className="drf-mv-head drf-mono" x={12} y={19}>
          (tree-sum node 1)
        </text>
        <g transform={`translate(${W - 12}, 15)`}>
          <rect x={returning ? -66 : -54} y={-8} width={returning ? 66 : 54} height={16} rx={8} style={{ fill: returning ? green : blue }} />
          <text className="drf-mv-pill-text drf-ch-pill-on" x={returning ? -33 : -27} y={3.5} textAnchor="middle">
            {returning ? "RETURNING" : "RUNNING"}
          </text>
        </g>
        <line className="drf-mv-rule" x1={0} x2={W} y1={HEAD} y2={HEAD} />
        <text className="drf-mv-var drf-mono" x={12} y={HEAD + 15}>
          t
        </text>
        <line className="drf-mv-dots" x1={26} x2={W - 74} y1={HEAD + 11} y2={HEAD + 11} />
        <text className="drf-mv-val drf-mono" x={W - 24} y={HEAD + 15} textAnchor="end">
          node 1
        </text>
        <circle className="drf-mv-dot" cx={W - 12} cy={HEAD + 11} r={3} />

        {/* the question from the step before, going */}
        <g style={{ opacity: band }}>
          <line className="drf-mv-rule" x1={0} x2={W} y1={HEAD + ROW} y2={HEAD + ROW} />
          <text className="drf-mv-label" x={12} y={HEAD + ROW + 15.5}>
            ASKS
          </text>
          <text className="drf-mv-code drf-mono" x={CODE_X} y={HEAD + ROW + 16}>
            (empty? t)
          </text>
          <g transform={`translate(${CODE_X + 10 * CW + 22}, ${HEAD + ROW + 12})`}>
            <rect className="drf-ch-stamp" x={-15} y={-8} width={30} height={16} rx={8} />
            <text className="drf-ch-stamp-text" y={3.5} textAnchor="middle">
              No
            </text>
          </g>
        </g>

        {/* the new row, coming */}
        <rect className="drf-ch-glow" x={6} y={HEAD + ROW + 1} width={W - 12} height={ROW} rx={6} style={{ opacity: glow }} />
        <g style={{ opacity: row }}>
          <text className="drf-ch-returns" x={12} y={HEAD + ROW + 15.5}>
            returns
          </text>
          <line className="drf-mv-dots" x1={64} x2={W - 30} y1={HEAD + ROW + 11} y2={HEAD + ROW + 11} />
          <text className="drf-mv-val drf-mono drf-ch-ret-val" x={W - 14} y={HEAD + ROW + 15} textAnchor="end">
            1
          </text>
        </g>
      </g>

      {/* the value on its way up */}
      {returning && t < TRAVEL[1] && (
        <g className="drf-ch-chip" transform={`translate(${at.x}, ${at.y})`} style={{ opacity: chipA }}>
          <rect x={-13} y={-10} width={26} height={20} rx={10} />
          <text className="drf-mono" y={4} textAnchor="middle">
            1
          </text>
        </g>
      )}
    </svg>
  );
}

/* ---------- the schedule ---------- */

/** The ease-out curve as an area, in a 100 × 20 box. */
const EASE_AREA = (() => {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const u = i / 24;
    return `${(u * 100).toFixed(1)},${(20 - ease(u) * 18).toFixed(2)}`;
  });
  return { area: `M0,20 L${pts.join(" L")} L100,20 Z`, line: `M${pts.join(" L")}` };
})();
const EASE_OUT_AREA = (() => {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const u = i / 24;
    return `${(u * 100).toFixed(1)},${(2 + ease(u) * 18).toFixed(2)}`;
  });
  return { area: `M0,20 L${pts.join(" L")} L100,20 Z`, line: `M${pts.join(" L")}` };
})();

function Schedule({ t, speed, onSpeed, onScrub }: { t: number; speed: number; onSpeed: (v: number) => void; onScrub: (t: number) => void }) {
  const secs = fxSecs(speed);
  const ms = (f: number) => Math.round(f * secs * 1000);
  const tracks = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const at = (e: PointerEvent) => {
    const r = tracks.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const key = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 0.05 : e.key === "ArrowLeft" ? -0.05 : 0;
    if (d) {
      e.preventDefault();
      onScrub(Math.min(1, Math.max(0, t + d)));
    }
  };

  return (
    <div className="drf-ch-sched">
      <div className="drf-ch-sched-head">
        <span>
          One step, <b>{ms(1)} ms</b>
        </span>
        <span className="drf-ch-speeds" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button key={s.label} type="button" data-on={s.v === speed ? "" : undefined} onClick={() => onSpeed(s.v)}>
              {s.label}
            </button>
          ))}
        </span>
      </div>
      <div className="drf-ch-gantt">
        <div className="drf-ch-labels">
          {PARTS.map((p) => (
            <span key={p.key} className="drf-ch-label" data-on={t > p.a && t < p.b ? "" : undefined} data-done={t >= p.b ? "" : undefined}>
              {p.label}
            </span>
          ))}
        </div>
        <div
          ref={tracks}
          className="drf-ch-tracks"
          role="slider"
          tabIndex={0}
          aria-label="Scrub through the step"
          aria-valuemin={0}
          aria-valuemax={ms(1)}
          aria-valuenow={ms(t)}
          aria-valuetext={`${ms(t)} ms`}
          onKeyDown={key}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag(true);
            onScrub(at(e));
          }}
          onPointerMove={(e) => drag && onScrub(at(e))}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
        >
          {[0.25, 0.5, 0.75].map((g) => (
            <span key={g} className="drf-ch-grid" style={{ left: `${g * 100}%` }} />
          ))}
          {PARTS.map((p) => {
            const prog = Math.min(1, Math.max(0, (t - p.a) / (p.b - p.a)));
            const shape = p.out ? EASE_OUT_AREA : EASE_AREA;
            return (
              <div key={p.key} className="drf-ch-track">
                <div
                  className="drf-ch-bar"
                  data-tone={p.tone}
                  data-on={t > p.a && t < p.b ? "" : undefined}
                  style={{ left: `${p.a * 100}%`, width: `${(p.b - p.a) * 100}%` } as CSSProperties}
                >
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
                    <path className="drf-ch-area" d={shape.area} />
                    <g style={{ clipPath: `inset(0 ${100 - prog * 100}% 0 0)` }}>
                      <path className="drf-ch-area drf-ch-area-lit" d={shape.area} />
                      <path className="drf-ch-curve" d={shape.line} vectorEffect="non-scaling-stroke" />
                    </g>
                  </svg>
                </div>
              </div>
            );
          })}
          <span className="drf-ch-head" style={{ left: `${t * 100}%` }}>
            <span className="drf-ch-head-label" style={{ transform: `translateX(${-Math.min(100, Math.max(0, (t - 0.1) / 0.8) * 100)}%)` }}>
              {ms(t)} ms
            </span>
          </span>
        </div>
        <div />
        <div className="drf-ch-axis">
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <span key={g} style={{ left: `${g * 100}%` }}>
              {ms(g)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- interrupted mid-glide ---------- */

const A = { x: 34, y: 30 };
const B = { x: 226, y: 30 };
const C = { x: 150, y: 84 };
const lerp = (p: { x: number; y: number }, q: { x: number; y: number }, k: number) => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
const P = lerp(A, B, ease(CUT));

/** Where the box is drawn at time s (in units of ANIM_SECS), restarting from `from` when the new step arrives. */
function glide(s: number, naive: boolean) {
  if (s < CUT) return lerp(A, B, ease(s));
  return lerp(naive ? B : P, C, ease(s - CUT));
}

function Lane({ s, naive }: { s: number; naive: boolean }) {
  const end = 1 + CUT;
  const cut = s >= CUT;
  const now = glide(s, naive);
  const sample = (s0: number, s1: number) =>
    Array.from({ length: 33 }, (_, i) => glide(s0 + ((s1 - s0) * i) / 32, naive))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  return (
    <div className="drf-ch-lane" data-naive={naive ? "" : undefined}>
      <div className="drf-ch-lane-title">{naive ? "Restart from the last layout" : "Dr. Rocket: restart from where it's drawn"}</div>
      <svg viewBox="0 0 260 112" className="drf-ch-lane-svg" role="img" aria-label={naive ? "The box jumps ahead to its first target, then turns toward the new one." : "The box bends from where it is toward the new target, with no jump."}>
        <rect className="drf-ch-ghost" x={B.x - 24} y={B.y - 11} width={48} height={22} rx={6} />
        <text className="drf-ch-mark" x={B.x} y={B.y - 17} textAnchor="middle">
          first target
        </text>
        <rect className="drf-ch-ghost" data-new="" x={C.x - 24} y={C.y - 11} width={48} height={22} rx={6} style={{ opacity: cut ? 1 : 0 }} />
        <text className="drf-ch-mark" data-new="" x={C.x + 32} y={C.y + 4} style={{ opacity: cut ? 1 : 0 }}>
          new target
        </text>
        <circle className="drf-ch-from" cx={A.x} cy={A.y} r={3} />
        <polyline className="drf-ch-trail" points={sample(0, Math.min(s, CUT))} />
        {cut && naive && <line className="drf-ch-jump" x1={P.x} y1={P.y} x2={B.x} y2={B.y} />}
        {cut && naive && (
          <text className="drf-ch-jump-text" x={(P.x + B.x) / 2} y={P.y - 7} textAnchor="middle">
            jump
          </text>
        )}
        {cut && <polyline className="drf-ch-trail" points={sample(CUT, Math.min(s, end))} />}
        {cut && <circle key={naive ? "n" : "d"} className="drf-ch-ping" cx={P.x} cy={P.y} r={5} />}
        <g transform={`translate(${now.x}, ${now.y})`}>
          <rect className="drf-ch-box" x={-24} y={-11} width={48} height={22} rx={6} />
          <text className="drf-mono drf-ch-box-text" y={4} textAnchor="middle">
            node 8
          </text>
        </g>
      </svg>
      <div className="drf-ch-lane-note">{naive ? "jumps to where it was headed, then turns" : "bends toward the new target, no jump"}</div>
    </div>
  );
}

/* ---------- the figure ---------- */

export function Choreo() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, 2, { delay: [700, DUR_A + 1400], loop: true, hold: DUR_B + 2600 });
  const [speed, setSpeed] = useState(1);
  const [clock, setClock] = useState({ step: -2, e: 0 });
  const [scrub, setScrub] = useState<number | null>(null);
  const { step, paused, reduced } = seq;

  useEffect(() => {
    if (reduced || paused || (step !== 0 && step !== 1)) return;
    const dur = step === 0 ? DUR_A : DUR_B;
    const start = performance.now();
    let raf = 0;
    const tick = (n: number) => {
      const e = Math.min(dur, n - start);
      setScrub(null);
      setClock({ step, e });
      if (e < dur) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, paused, reduced]);

  const e = clock.step === step ? clock.e : 0;
  const t = scrub !== null && paused ? scrub : reduced || step >= 1 ? 1 : step === 0 ? e / DUR_A : 0;
  const s = reduced ? 1 + CUT : step === 1 ? (e / DUR_B) * (1 + CUT) : step > 1 ? 1 + CUT : 0;
  const label = step === 0 ? `a return, slowed ${SLOW_A}×` : step === 1 ? `a new step mid-glide, slowed ${SLOW_B}×` : undefined;

  return (
    <div ref={ref} className="drf-ch" data-tone="blue">
      <Controls seq={seq} label={label} />
      <div className="drf-ch-top">
        <Scene t={t} />
        <Schedule
          t={t}
          speed={speed}
          onSpeed={setSpeed}
          onScrub={(v) => {
            if (!paused || step !== 0) seq.goto(0);
            setScrub(v);
          }}
        />
      </div>
      <div className="drf-ch-strip">
        <div className="drf-ch-strip-head">
          <span>A new step mid-glide</span>
          <span className="drf-ch-dim">positions glide for {ANIM_SECS * 1000} ms</span>
        </div>
        <div className="drf-ch-lanes">
          <Lane s={s} naive />
          <Lane s={s} naive={false} />
        </div>
      </div>
    </div>
  );
}
