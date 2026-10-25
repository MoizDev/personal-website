"use client";

/**
 * Filming the app on a virtual clock. A JSON script drives the real app; its
 * `record` step films it. The same ten frames, with the same uneven drawing
 * times, are shown twice. A recorder on the wall clock grabs whatever is on
 * screen every 1/30 s, so a slow frame is held for several slots and two quick
 * ones can share a slot (one is lost). Dr. Rocket instead tells the app that
 * frame k happens at start + k/30 and captures every frame, so the video gets
 * each one exactly once, evenly spaced, however long it took to draw.
 * (automation.rs: the virtual clock at 195-197, the encoder at 102-139.)
 */

import { useLayoutEffect, useRef, useState } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Clocks.css";

/** How long each frame took to draw, in ms. Frame 4 and frame 9 are slow; 6 and 7 are quick. */
const COST = [30, 31, 29, 96, 30, 12, 14, 30, 68, 30];
const P = 1000 / 30;
const END: number[] = [];
COST.reduce((t, c) => (END.push(t + c), t + c), 0);
const START = END.map((e, i) => e - COST[i]);
const SPAN = 380; // ms shown on the axis

/** What a wall-clock recorder gets: at each 1/30 s tick, the newest finished frame. */
const WALL = Array.from({ length: Math.floor(SPAN / P) }, (_, j) => {
  const t = (j + 1) * P;
  let f = -1;
  END.forEach((e, k) => {
    if (e <= t) f = k;
  });
  return { t, f };
}).filter((s) => s.f >= 0);
const SHOWN = new Set(WALL.map((s) => s.f));
const LOST = COST.map((_, k) => k).filter((k) => k < WALL[WALL.length - 1].f && !SHOWN.has(k));
const HELD = WALL.map((s, j) => j > 0 && WALL[j - 1].f === s.f);

/** The frames waiting in sync_channel(4) when frame k is sent, with an encoder that takes ~40 ms a frame. */
const QUEUE = (() => {
  const out: number[] = [];
  let free = 0; // when the encoder is next free
  const done: number[] = [];
  END.forEach((t) => {
    const startAt = Math.max(t, free);
    free = startAt + 40;
    done.push(free);
    out.push(done.filter((d) => d > t).length);
  });
  return out;
})();

const SCRIPT: { text: string; name: string }[] = [
  { text: `{"open": "tree.rkt"}`, name: "open" },
  { text: `{"key": "cmd+r"}`, name: "key" },
  { text: `{"wait_until": "run-finished"}`, name: "wait_until" },
  { text: `{"record": {"path": "viz.mp4", "seconds": 6}}`, name: "record" },
  { text: `{"quit": true}`, name: "quit" },
];
const REC = 3; // the record step
const FIRST = REC + 1; // step of frame 0
const N = FIRST + COST.length + 1;

function Lane({ kind, w, shown }: { kind: "wall" | "virtual"; w: number; shown: number }) {
  const x0 = 6;
  const x1 = w - 6;
  const x = (t: number) => x0 + (t / SPAN) * (x1 - x0);
  const now = shown >= 0 ? END[Math.min(shown, END.length - 1)] : -1;
  const yB = 22; // app row
  const hB = 26;
  const yV = 86; // video row
  const hV = 26;
  const slots =
    kind === "wall"
      ? WALL.map((s, j) => ({ a: s.t - P, b: s.t, f: s.f, held: HELD[j], on: s.t <= now + 0.01 }))
      : COST.map((_, k) => ({ a: k * P, b: (k + 1) * P, f: k, held: false, on: k <= shown }));
  return (
    <svg className="drf-clk-svg" width={w} height={124} viewBox={`0 0 ${w} 124`} aria-hidden>
      <text className="drf-clk-row" x={x0} y={13}>
        the app draws · real time
      </text>
      <text className="drf-clk-row" x={x0} y={yV + hV + 13}>
        {kind === "wall" ? "the video · a grab every 1/30 s" : "the video · frame k at k/30 s"}
      </text>
      {/* links from each video slot to the frame it shows */}
      {slots.map((s, j) => {
        if (!s.on) return null;
        const f = s.f;
        const bx = x((START[f] + END[f]) / 2);
        const vx = x((s.a + s.b) / 2);
        const y0 = yB + hB;
        const y1 = yV;
        return (
          <path
            key={`l${j}`}
            className="drf-clk-link"
            data-held={s.held ? "" : undefined}
            d={`M${bx},${y0} C${bx},${(y0 + y1) / 2} ${vx},${(y0 + y1) / 2} ${vx},${y1}`}
          />
        );
      })}
      {COST.map((c, k) => {
        const on = k <= shown;
        const lost = kind === "wall" && LOST.includes(k) && on && now >= WALL.find((s) => s.f > k)!.t - 0.01;
        return (
          <g key={`b${k}`} className="drf-clk-block" data-on={on ? "" : undefined} data-slow={c > 50 ? "" : undefined} data-lost={lost ? "" : undefined}>
            <rect x={x(START[k]) + 0.75} y={yB} width={x(END[k]) - x(START[k]) - 1.5} height={hB} rx={4} />
            <text x={x((START[k] + END[k]) / 2)} y={yB + hB / 2 + 4}>
              {k + 1}
            </text>
            {lost && (
              <text className="drf-clk-tag" x={x((START[k] + END[k]) / 2)} y={yB - 4}>
                lost
              </text>
            )}
          </g>
        );
      })}
      {slots.map((s, j) => (
        <g key={`s${j}`} className="drf-clk-slot" data-on={s.on ? "" : undefined} data-held={s.held ? "" : undefined}>
          <rect x={x(s.a) + 1} y={yV} width={x(s.b) - x(s.a) - 2} height={hV} rx={3} />
          {s.on && (
            <text x={x((s.a + s.b) / 2)} y={yV + hV / 2 + 4}>
              {s.f + 1}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function Clocks() {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(560);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const delays = Array.from({ length: N }, (_, i) => (i === 0 ? 500 : i <= REC ? 750 : i < N - 1 ? 620 : 1100));
  const seq = useSequence(ref, N, { delay: delays, loop: true, hold: 3600 });
  const s = seq.step;
  const frame = s >= FIRST ? Math.min(s - FIRST, COST.length - 1) : -1;
  const done = s >= N - 1;
  const line = s < 0 ? -1 : s <= REC ? s : done ? SCRIPT.length - 1 : REC;
  const queue = frame >= 0 && !done ? QUEUE[frame] : 0;
  const label = s < 0 ? undefined : frame >= 0 && !done ? `frame ${frame + 1} of ${COST.length}` : SCRIPT[line].name;

  return (
    <div ref={ref} className="drf-clk" data-tone="blue">
      <Controls seq={seq} label={label} />
      <div className="drf-clk-top">
        <div className="drf-clk-script">
          <div className="drf-clk-head">
            <span>script.json</span>
            <span className="drf-clk-dim">DRROCKET_AUTOMATION</span>
          </div>
          {SCRIPT.map((l, i) => (
            <div key={l.name} className="drf-clk-step" data-on={i === line ? "" : undefined} data-past={i < line ? "" : undefined}>
              <span className="drf-clk-dot" />
              <span className="drf-clk-code">{l.text}</span>
            </div>
          ))}
        </div>
        <div className="drf-clk-pipe">
          <div className="drf-clk-node" data-on={s >= 0 ? "" : undefined}>
            <span className="drf-clk-label">Dr. Rocket, hidden</span>
            <span className="drf-clk-sub">raw.time = start + k/30</span>
          </div>
          <div className="drf-clk-wire" data-on={frame >= 0 && !done ? "" : undefined} />
          <div className="drf-clk-node" data-kind="store" data-full={queue >= 4 ? "" : undefined}>
            <span className="drf-clk-chan" aria-label={`${queue} of 4 frames queued`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} data-on={i < queue ? "" : undefined} />
              ))}
            </span>
            <span className="drf-clk-sub">sync_channel(4)</span>
          </div>
          <div className="drf-clk-wire" data-on={frame >= 0 && !done ? "" : undefined} />
          <div className="drf-clk-node" data-on={done ? "" : undefined}>
            <span className="drf-clk-label">ffmpeg</span>
            <span className="drf-clk-sub">libx264 · crf 18 · viz.mp4</span>
          </div>
        </div>
      </div>

      <div ref={box} className="drf-clk-lanes">
        <div className="drf-clk-lane" data-kind="wall">
          <div className="drf-clk-title">
            <span>A recorder on the wall clock</span>
            <span className="drf-clk-verdict" data-on={done ? "" : undefined}>
              {HELD.filter(Boolean).length} repeats, {LOST.length} lost
            </span>
          </div>
          <Lane kind="wall" w={w} shown={frame} />
        </div>
        <div className="drf-clk-lane" data-kind="virtual">
          <div className="drf-clk-title">
            <span>Dr. Rocket on a virtual clock</span>
            <span className="drf-clk-verdict" data-on={done ? "" : undefined}>
              every frame once, 1/30 s apart
            </span>
          </div>
          <Lane kind="virtual" w={w} shown={frame} />
        </div>
      </div>
    </div>
  );
}
