"use client";

/**
 * Debugging a file you haven't saved. main.rkt requires helper.rkt, which is
 * open in another tab with unsaved edits. When the program asks for
 * helper.rkt, the debugger's load handler serves the editor's text instead of
 * the file on disk, annotates it for breakpoints, and evaluates that. The
 * program pauses inside helper.rkt with y = 21 and finishes with 42; the copy
 * on disk would have returned 0. This is the case runner.rkt's
 * make-debug-loader exists for, and the one its test checks.
 */

import { useRef, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./DebugTabs.css";

const STAGES: { label: string; sub: string; name: string }[] = [
  { label: "open-input-string", sub: "the tab's text", name: "Reading the tab" },
  { label: "read-syntax", sub: "counts lines", name: "Reading" },
  { label: "expand", sub: "to core forms", name: "Expanding" },
  { label: "debug-annotate", sub: "adds break checks", name: "Annotating" },
  { label: "eval", sub: "declares it", name: "Evaluating" },
];

// step: 0 require · 1 ask · 2..6 stages · 7 paused · 8 result
const N = 2 + STAGES.length + 2;
const PAUSED = 2 + STAGES.length;
const DONE = PAUSED + 1;

function Line({ n, on, mark, children }: { n: number; on?: boolean; mark?: ReactNode; children: ReactNode }) {
  return (
    <div className="drf-dbg-line" data-on={on ? "" : undefined}>
      <span className="drf-dbg-ln">{n}</span>
      <span className="drf-dbg-src">{children}</span>
      {mark}
    </div>
  );
}

export function DebugTabs() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, N, { delay: [500, 1000, 1100, 850, 850, 850, 850, 1100, 1300], loop: true, hold: 3400 });
  const s = seq.step;
  const at = (i: number) => s >= i;
  const label = s < 0 ? undefined : s === 0 ? "require" : s === 1 ? "Open in a tab?" : s < PAUSED ? STAGES[s - 2].name : s === PAUSED ? "Paused" : "Continued";

  return (
    <div ref={ref} className="drf-dbg" data-tone="blue">
      <Controls seq={seq} label={label} />
      <div className="drf-dbg-grid">
        {/* the editor: two tabs, and the file on disk */}
        <div className="drf-dbg-files">
          <div className="drf-dbg-card">
            <div className="drf-dbg-tab">
              <span>main.rkt</span>
              <span className="drf-dbg-tag">running</span>
            </div>
            <Line n={1}>
              <span className="drf-dbg-kw">#lang</span> racket
            </Line>
            <Line n={2} on={at(0) && !at(PAUSED)}>
              (<span className="drf-dbg-kw">require</span> <span className="drf-dbg-str">&quot;helper.rkt&quot;</span>)
            </Line>
            <Line n={3} on={at(PAUSED)}>
              (double <span className="drf-dbg-num">21</span>)
              {at(DONE) && <span className="drf-dbg-out">→ 42</span>}
            </Line>
          </div>

          <div className="drf-dbg-card" data-lit={at(2) && !at(PAUSED) ? "" : undefined}>
            <div className="drf-dbg-tab">
              <span>
                helper.rkt <span className="drf-dbg-dirty" title="unsaved" />
              </span>
              <span className="drf-dbg-tag">in another tab · unsaved</span>
            </div>
            <Line n={1}>
              <span className="drf-dbg-kw">#lang</span> racket
            </Line>
            <Line n={2}>
              (<span className="drf-dbg-kw">provide</span> double)
            </Line>
            <Line n={3}>
              (<span className="drf-dbg-kw">define</span> (double y)
            </Line>
            <Line
              n={4}
              on={at(PAUSED) && !at(DONE)}
              mark={
                <>
                  <span className="drf-dbg-bp" data-armed={at(5) ? "" : undefined} aria-label="breakpoint" />
                  {at(PAUSED) && !at(DONE) && <span className="drf-dbg-local">y = 21</span>}
                </>
              }
            >
              {"  "}(* y <span className="drf-dbg-num">2</span>))
            </Line>
          </div>

          <div className="drf-dbg-card" data-kind="disk" data-skipped={at(2) ? "" : undefined}>
            <div className="drf-dbg-tab">
              <span>helper.rkt</span>
              <span className="drf-dbg-tag">on disk{at(2) ? " · not read" : ""}</span>
            </div>
            <Line n={3}>
              (<span className="drf-dbg-kw">define</span> (double y) <span className="drf-dbg-num">0</span>)
            </Line>
          </div>
        </div>

        {/* the load handler */}
        <div className="drf-dbg-flow">
          <div className="drf-dbg-node" data-kind="start" data-on={at(0) ? "" : undefined} data-head={s === 0 ? "" : undefined}>
            <span className="drf-dbg-node-label">(require &quot;helper.rkt&quot;)</span>
            <span className="drf-dbg-node-sub">current-load/use-compiled</span>
          </div>
          <div className="drf-dbg-wire" data-on={at(1) ? "" : undefined} />
          <div className="drf-dbg-node" data-kind="ask" data-on={at(1) ? "" : undefined} data-head={s === 1 ? "" : undefined}>
              <svg className="drf-dbg-diamond" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <polygon points="50,1 99,50 50,99 1,50" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="drf-dbg-node-label">Open in another tab?</span>
          </div>
          <div className="drf-dbg-no">
            <span className="drf-dbg-stamp">No</span>
            <div className="drf-dbg-node" data-kind="store">
              <span className="drf-dbg-node-label">Usual loader</span>
              <span className="drf-dbg-node-sub">from disk</span>
            </div>
          </div>
          <div className="drf-dbg-wire" data-on={at(2) ? "" : undefined}>
            <span className="drf-dbg-stamp" data-on={at(2) ? "" : undefined}>
              Yes
            </span>
          </div>
          <div className="drf-dbg-stages">
            {STAGES.map((st, i) => (
              <div key={st.label} className="drf-dbg-stage" data-on={at(2 + i) ? "" : undefined} data-head={s === 2 + i ? "" : undefined}>
                <span className="drf-dbg-node-label">{st.label}</span>
                <span className="drf-dbg-node-sub">{st.sub}</span>
              </div>
            ))}
          </div>
          <div className="drf-dbg-wire" data-on={at(PAUSED) ? "" : undefined} />
          <div className="drf-dbg-node" data-kind="end" data-on={at(PAUSED) ? "" : undefined} data-head={s >= PAUSED ? "" : undefined}>
            {at(DONE) ? (
              <>
                <span className="drf-dbg-node-label">
                  Result: <b>42</b>
                </span>
                <span className="drf-dbg-node-sub">
                  the disk copy would say <s>0</s>
                </span>
              </>
            ) : (
              <>
                <span className="drf-dbg-node-label">Paused at helper.rkt:4</span>
                <span className="drf-dbg-node-sub">y = 21</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
