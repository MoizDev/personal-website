"use client";

/**
 * The process model: the Rust app on the left draws, three Racket processes on
 * the right decide. Each lane is a pipe: commands go down stdin, events come
 * back up stdout, one JSON object per line. A chip rides the lane for each
 * message and the full line lands in the log underneath. The messages follow
 * the protocol in DESIGN.md and src/racket/protocol.rs, shortened with "…".
 */

import { useRef, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Wire.css";

type Proc = "server" | "runner" | "stepper";

const PROCS: { id: Proc; file: string; life: string; tone: string }[] = [
  { id: "server", file: "server.rkt", life: "one per app", tone: "purple" },
  { id: "runner", file: "runner.rkt", life: "one per Run", tone: "teal" },
  { id: "stepper", file: "stepper.rkt", life: "one per session", tone: "orange" },
];

type Msg = {
  to: Proc;
  /** out: app → Racket on stdin; in: Racket → app on stdout */
  dir: "out" | "in";
  chip: string;
  line: string;
  say: ReactNode;
  status: Partial<Record<Proc, string>>;
};

const C = ({ children }: { children: ReactNode }) => <code>{children}</code>;

const MSGS: Msg[] = [
  {
    to: "server",
    dir: "out",
    chip: "check-syntax",
    line: '{"id":7,"cmd":"check-syntax","path":"bst.rkt","source":"(define (tree-sum t) …","offset":0}',
    say: <>You type, and the app asks the server to check the syntax. A newer check of the same file cancels the older one.</>,
    status: { server: "checking" },
  },
  {
    to: "server",
    dir: "in",
    chip: "id 7 ok",
    line: '{"id":7,"ok":true,"result":{"arrows":[…],"colors":[…],"tooltips":[…],"errors":[]}}',
    say: <>The answer echoes the id. Binding arrows and colours come from Racket&apos;s own expander, not from a guess in Rust.</>,
    status: { server: "idle" },
  },
  {
    to: "runner",
    dir: "out",
    chip: "run",
    line: '{"cmd":"run","path":"bst.rkt","source":"…","offset":0,"options":{"instrument":"visualize",…}}',
    say: <>Run hands the program to a runner that was started ahead of time, and a fresh one starts warming up for the next Run.</>,
    status: { runner: "running" },
  },
  {
    to: "runner",
    dir: "in",
    chip: "viz-start",
    line: '{"ev":"viz-start","max_steps":1500,"as_ids":false}',
    say: <>The Visualizer starts recording, for at most 1,500 steps.</>,
    status: { runner: "running" },
  },
  {
    to: "runner",
    dir: "in",
    chip: "viz-step",
    line: '{"ev":"viz-step","index":1,"kind":"call","name":"tree-sum","frames":[…],"objects":[…]}',
    say: <>Every call, question and return comes back as one line: the stack, plus any objects that changed.</>,
    status: { runner: "running" },
  },
  {
    to: "runner",
    dir: "in",
    chip: "viz-step",
    line: '{"ev":"viz-step","index":2,"kind":"question","value":{"v":"#false","k":"bool"},…}',
    say: <>A question step carries its answer. The app turns it into words; Racket never has to.</>,
    status: { runner: "running" },
  },
  {
    to: "runner",
    dir: "in",
    chip: "value",
    line: '{"ev":"value","text":"30","segments":[{"text":"30"}]}',
    say: <>The result arrives already printed the way DrRacket prints it.</>,
    status: { runner: "running" },
  },
  {
    to: "runner",
    dir: "in",
    chip: "ready",
    line: '{"ev":"ready","id":null}',
    say: <>The definitions are done. The same process stays up to answer the REPL in the program&apos;s namespace.</>,
    status: { runner: "REPL" },
  },
  {
    to: "stepper",
    dir: "out",
    chip: "step",
    line: '{"cmd":"step","level":"beginner","source":"…","settings":{…},"width":72}',
    say: <>The stepper is a third process. It runs DrRacket&apos;s own stepper model with no window.</>,
    status: { stepper: "stepping" },
  },
  {
    to: "stepper",
    dir: "in",
    chip: "step",
    line: '{"ev":"step","index":0,"kind":"normal","before":[{"text":"…","highlights":[[0,12]]}],"after":[…]}',
    say: (
      <>
        Each reduction comes back as text with the ranges to highlight. The app draws it and decides nothing about <C>(tree-sum t)</C>.
      </>
    ),
    status: { stepper: "stepping" },
  },
];

const START: Record<Proc, string> = { server: "idle", runner: "warmed up", stepper: "not started" };
const LOG_ROWS = 5;

export function Wire() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, MSGS.length, { delay: [700, ...MSGS.slice(1).map(() => 2300)], loop: true, hold: 3600 });
  const i = seq.step;
  const msg = i >= 0 ? MSGS[i] : null;

  const status: Record<Proc, string> = { ...START };
  for (let k = 0; k <= i; k++) Object.assign(status, MSGS[k].status);
  const spare = i >= 2; // a new idle runner, spawned at Run
  const stepperOn = i >= 8;

  const shown = MSGS.slice(0, i + 1);
  const log = seq.reduced ? shown : shown.slice(-LOG_ROWS);
  const first = shown.length - log.length;

  return (
    <div className="drf-wire-fig" ref={ref}>
      <Controls seq={seq} label={msg ? `${i + 1} / ${MSGS.length}` : undefined} />

      <div className="drf-wire-map">
        <span className="drf-wire-head drf-mono" style={{ gridColumn: 1 }}>
          Rust draws
        </span>
        <span className="drf-wire-head drf-mono" style={{ gridColumn: 3 }}>
          Racket decides
        </span>
        <div className="drf-wire-app">
          <span className="drf-wire-name">Dr. Rocket</span>
          <span className="drf-wire-sub drf-mono">Rust · egui</span>
          <ul className="drf-wire-jobs drf-mono">
            <li>editor</li>
            <li>panels</li>
            <li>Visualizer</li>
          </ul>
        </div>

        {PROCS.map((p, row) => {
          const active = msg?.to === p.id;
          const off = p.id === "stepper" && !stepperOn;
          return (
            <div className="drf-wire-row" key={p.id} style={{ gridRow: row + 2 }} data-tone={p.tone}>
              <div className="drf-wire-lane" data-active={active || undefined} data-off={off || undefined}>
                <span className="drf-wire-line" data-dir="out" data-lit={(active && msg?.dir === "out") || undefined} />
                <span className="drf-wire-line" data-dir="in" data-lit={(active && msg?.dir === "in") || undefined} />
                {row === 0 && (
                  <>
                    <span className="drf-wire-pipe drf-mono" data-dir="out">stdin</span>
                    <span className="drf-wire-pipe drf-mono" data-dir="in">stdout</span>
                  </>
                )}
                {active && !seq.reduced && (
                  <span key={i} className="drf-wire-chip drf-mono" data-dir={msg.dir}>
                    {msg.chip}
                  </span>
                )}
              </div>
              <div
                className="drf-wire-proc"
                data-active={active || undefined}
                data-off={off || undefined}
                data-spare={(p.id === "runner" && spare) || undefined}
              >
                <span className="drf-wire-file drf-mono">{p.file}</span>
                <span className="drf-wire-sub drf-mono">{p.life}</span>
                <span className="drf-wire-status drf-mono" key={status[p.id]}>
                  {status[p.id]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="drf-wire-say" aria-live="polite">
        {msg ? msg.say : <>One app, three Racket processes, and nothing between them but lines of JSON.</>}
      </p>

      <div className="drf-wire-log drf-mono" aria-label="Messages on the wire">
        <div className="drf-wire-log-head">
          <span>the wire</span>
          <span>one JSON object per line</span>
        </div>
        <ol className="drf-wire-log-rows" style={{ minHeight: seq.reduced ? undefined : LOG_ROWS * 19 }}>
          {log.map((m, k) => {
            const p = PROCS.find((q) => q.id === m.to)!;
            const n = first + k;
            return (
              <li key={n} data-tone={p.tone} data-new={(n === i && !seq.reduced) || undefined}>
                <span className="drf-wire-dir">{m.dir === "out" ? "→" : "←"}</span>
                <span className="drf-wire-who">{p.id}</span>
                <span className="drf-wire-json">{m.line}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
