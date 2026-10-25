"use client";

/**
 * Stepping like DrRacket. Dr. Rocket's stepper runs DrRacket's own stepper
 * model in a Racket process (racket/stepper.rkt) and streams each reduction
 * as JSON. By default it shows DrRacket's steps one for one. The "Functional
 * step trace" setting (config.rs:100-102) folds everything between two calls
 * of a user function into one step, keeping the surrounding expression, and
 * then shows the last call's reductions in full (trace-step, stepper.rkt:183-205).
 *
 * The program and the shown trace are from the test
 * functional_stepper_matches_recursive_trace_and_keeps_final_cond_steps
 * (tests.rs:1121-1163): four call steps, then the final call's own steps,
 * ending at 5. The full trace is worked out from Beginning Student's
 * reduction rules; the test doesn't pin its length.
 *
 * The strip at the bottom is from stepper_matches_drracket_on_list_construction
 * (tests.rs:351-381): DrRacket prints built lists as `list` even in Beginning
 * Student, and Dr. Rocket forces the same printing (stepper.rkt:142-154).
 */

import { useRef } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Stepper.css";

/** A run of text; `hl` marks the part being reduced (before) or its result (after). */
type Seg = { t: string; hl?: boolean };
type Lines = Seg[][];
type Kind = "app" | "prim" | "cond";
type Step = { kind: Kind; before: Lines; after: Lines; call: number };

const X = 5;
const T = 3;
const YS = [17, 14, 11, 8, 5];

const s = (t: string, hl = false): Seg => ({ t, hl });
const hlAll = (l: Lines): Lines => l.map((line) => line.map((g) => (g.t.trim() ? { ...g, hl: true } : g)));

/** `inner` inside k pending (add1 …) calls. A one-line inner stays on one line. */
function wrap(k: number, inner: Lines): Lines {
  if (k === 0) return inner;
  const close = s(")".repeat(k));
  if (inner.length === 1) return [[s("(add1 ".repeat(k)), ...inner[0], close]];
  return [
    [s("(add1 ".repeat(k).trimEnd())],
    ...inner.map((line, i) => [s(" "), ...line, ...(i === inner.length - 1 ? [close] : [])]),
  ];
}

const call = (y: number, hl = false): Lines => [[s(`(f ${X} ${y} ${T})`, hl)]];
const elseBody = (y: number) => `(add1 (f ${X} (- ${y} ${T}) ${T}))`;

/** A cond, one clause per line. `hlTest` marks one clause's test. */
function cond(clauses: { test: string; res: string }[], els: string | null, hlTest = -1): Lines {
  const all = [...clauses.map((c) => ({ ...c, isElse: false })), ...(els ? [{ test: "else", res: els, isElse: true }] : [])];
  return all.map((c, i) => {
    const lead = i === 0 ? s("(cond ") : s("      ");
    const tail = i === all.length - 1 ? s("))") : s(")");
    return [lead, s("("), s(c.test, i === hlTest), s(` ${c.res}`), tail];
  });
}

/** The raw reductions of one call, as Beginning Student takes them. */
function callSteps(i: number): Step[] {
  const y = YS[i];
  const k = i;
  const lt = `(< ${y} ${X})`;
  const eq = `(= ${y} ${X})`;
  const last = i === YS.length - 1;
  const full = cond([{ test: lt, res: "0" }, { test: eq, res: "1" }], elseBody(y));
  const steps: Step[] = [
    { kind: "app", call: i, before: wrap(k, call(y, true)), after: wrap(k, hlAll(full)) },
    {
      kind: "prim",
      call: i,
      before: wrap(k, cond([{ test: lt, res: "0" }, { test: eq, res: "1" }], elseBody(y), 0)),
      after: wrap(k, cond([{ test: "#false", res: "0" }, { test: eq, res: "1" }], elseBody(y), 0)),
    },
    {
      kind: "cond",
      call: i,
      before: wrap(k, hlAll(cond([{ test: "#false", res: "0" }, { test: eq, res: "1" }], elseBody(y)))),
      after: wrap(k, hlAll(cond([{ test: eq, res: "1" }], elseBody(y)))),
    },
    {
      kind: "prim",
      call: i,
      before: wrap(k, cond([{ test: eq, res: "1" }], elseBody(y), 0)),
      after: wrap(k, cond([{ test: last ? "#true" : "#false", res: "1" }], elseBody(y), 0)),
    },
  ];
  if (last) {
    steps.push({
      kind: "cond",
      call: i,
      before: wrap(k, hlAll(cond([{ test: "#true", res: "1" }], elseBody(y)))),
      after: wrap(k, [[s("1", true)]]),
    });
    // unwinding: (add1 1) -> 2 ... -> 5
    for (let n = 1; n <= YS.length - 1; n++) {
      const d = YS.length - 1 - n;
      steps.push({ kind: "prim", call: YS.length, before: wrap(d, [[s(`(add1 ${n})`, true)]]), after: wrap(d, [[s(String(n + 1), true)]]) });
    }
    return steps;
  }
  const y2 = y - T;
  steps.push(
    {
      kind: "cond",
      call: i,
      before: wrap(k, hlAll(cond([{ test: "#false", res: "1" }], elseBody(y)))),
      after: wrap(k, hlAll(cond([], elseBody(y)))),
    },
    {
      kind: "cond",
      call: i,
      before: wrap(k, hlAll(cond([], elseBody(y)))),
      after: wrap(k + 1, [[s(`(f ${X} (- ${y} ${T}) ${T})`, true)]]).map((l) => l.map((g) => ({ ...g, hl: g.t.trim() !== "" && g.t !== ")".repeat(k) }))),
    },
    {
      kind: "prim",
      call: i,
      before: wrap(k + 1, [[s(`(f ${X} `), s(`(- ${y} ${T})`, true), s(` ${T})`)]]),
      after: wrap(k + 1, [[s(`(f ${X} `), s(String(y2), true), s(` ${T})`)]]),
    },
  );
  return steps;
}

const RAW: Step[] = YS.flatMap((_, i) => callSteps(i));
/** Where each call's steps start in RAW, plus the unwinding at the end. */
const GROUPS = [...YS.map((y, i) => ({ y, from: RAW.findIndex((r) => r.call === i) })), { y: 0, from: RAW.findIndex((r) => r.call === YS.length) }];
const FINAL_FROM = GROUPS[YS.length - 1].from;

/** The functional trace: one step per call up to the last call, then the last call's raw steps. */
const SHOWN: (Step & { span: number })[] = [
  ...YS.slice(0, -1).map((y, i) => ({
    kind: "app" as Kind,
    call: i,
    span: GROUPS[i + 1].from - GROUPS[i].from,
    before: wrap(i, call(y, true)),
    after: wrap(i + 1, call(YS[i + 1], true)),
  })),
  ...RAW.slice(FINAL_FROM).map((r) => ({ ...r, span: 1 })),
];

/** The first column (in raw steps) each shown step sits under. */
const SHOWN_COLS = SHOWN.map((_, i) => SHOWN.slice(0, i).reduce((n, x) => n + x.span, 0));

const FOLD = RAW.length; // the step where the trace folds
const N = RAW.length + 1 + SHOWN.length;
const PROGRAM = [
  "(define (f x y t)",
  "  (cond [(< y x) 0]",
  "        [(= y x) 1]",
  "        [else (add1 (f x (- y t) t))]))",
  `(f ${X} ${YS[0]} ${T})`,
];

function Expr({ lines, side }: { lines: Lines; side: "before" | "after" }) {
  return (
    <pre className="drf-st-expr" data-side={side}>
      {lines.map((line, i) => (
        <span key={i} className="drf-st-line">
          {line.map((g, j) =>
            g.hl ? (
              <mark key={j} className="drf-st-hl">
                {g.t}
              </mark>
            ) : (
              <span key={j}>{g.t}</span>
            ),
          )}
        </span>
      ))}
    </pre>
  );
}

const KIND_NAME: Record<Kind, string> = { app: "a call to f", prim: "arithmetic", cond: "cond" };

export function Stepper() {
  const ref = useRef<HTMLDivElement>(null);
  const delays = Array.from({ length: N }, (_, i) => {
    if (i === 0) return 600;
    if (i < GROUPS[1].from) return 950; // the first call, slowly enough to read
    if (i < FINAL_FROM) return 230;
    if (i < FOLD) return 520;
    if (i === FOLD) return 900;
    if (i === FOLD + 1) return 1500; // after the fold
    if (i < FOLD + 1 + YS.length - 1) return 1050;
    return 520;
  });
  const seq = useSequence(ref, N, { delay: delays, loop: true, hold: 3800 });
  const st = seq.step;
  const phase = st < 0 ? "idle" : st < FOLD ? "raw" : st === FOLD ? "fold" : "shown";
  const rawAt = phase === "raw" ? st : -1;
  const shownAt = phase === "shown" ? st - FOLD - 1 : -1;
  const folded = phase === "fold" || phase === "shown";

  const cur = rawAt >= 0 ? RAW[rawAt] : shownAt >= 0 ? SHOWN[shownAt] : null;
  const before = cur ? cur.before : [[s(PROGRAM[PROGRAM.length - 1])]];
  const after = cur ? cur.after : [];

  const label =
    phase === "raw"
      ? `DrRacket's steps · ${rawAt + 1} of ${RAW.length}`
      : phase === "fold"
        ? "each call folds into one step"
        : phase === "shown"
          ? `functional trace · ${shownAt + 1} of ${SHOWN.length}`
          : undefined;

  return (
    <div ref={ref} className="drf-st" data-phase={phase}>
      <Controls seq={seq} label={label} />

      <div className="drf-st-top">
        <div className="drf-st-prog">
          <div className="drf-st-head">
            <span>tri.rkt</span>
            <span className="drf-st-dim">Beginning Student</span>
          </div>
          <pre className="drf-st-code">
            {PROGRAM.map((l, i) => (
              <span key={i} className="drf-st-line" data-run={i === PROGRAM.length - 1 ? "" : undefined}>
                {l}
              </span>
            ))}
          </pre>
        </div>

        <div className="drf-st-win" aria-live="off">
          <div className="drf-st-pane">
            <div className="drf-st-pane-head">
              <span>Before</span>
              <span className="drf-st-kind" data-kind={cur?.kind} data-on={cur ? "" : undefined}>
                {cur ? (phase === "shown" && shownAt < YS.length - 1 ? "one call, folded" : KIND_NAME[cur.kind]) : ""}
              </span>
            </div>
            <Expr key={`b${st}`} lines={before} side="before" />
          </div>
          <div className="drf-st-pane">
            <div className="drf-st-pane-head">
              <span>After</span>
            </div>
            <Expr key={`a${st}`} lines={after} side="after" />
          </div>
        </div>
      </div>

      <div className="drf-st-tapes">
        <div className="drf-st-tape-head">
          <span>
            DrRacket&rsquo;s steps <span className="drf-st-dim">· the default</span>
          </span>
          <b className="drf-st-count" data-on={phase !== "idle" ? "" : undefined}>
            {phase === "raw" ? rawAt + 1 : phase === "idle" ? 0 : RAW.length}
          </b>
        </div>
        <div className="drf-st-tape" data-dim={phase === "shown" ? "" : undefined} style={{ gridTemplateColumns: `repeat(${RAW.length}, minmax(0, 1fr))` }}>
          {RAW.map((r, i) => (
            <span
              key={i}
              className="drf-st-tile"
              data-kind={r.kind}
              data-gap={GROUPS.some((g) => g.from === i && i > 0) ? "" : undefined}
              data-past={phase !== "idle" && (folded || i < rawAt) ? "" : undefined}
              data-on={i === rawAt ? "" : undefined}
              data-final={folded && i >= FINAL_FROM ? "" : undefined}
            />
          ))}
        </div>
        <div className="drf-st-groups" style={{ gridTemplateColumns: `repeat(${RAW.length}, minmax(0, 1fr))` }}>
          {GROUPS.map((g, i) => {
            const to = i + 1 < GROUPS.length ? GROUPS[i + 1].from : RAW.length;
            return (
              <span key={i} className="drf-st-group" style={{ gridColumn: `${g.from + 1} / ${to + 1}` }}>
                {i < YS.length ? (
                  <>
                    <span className="drf-st-wide">(f 5 {g.y} 3)</span>
                    <span className="drf-st-narrow">y={g.y}</span>
                  </>
                ) : (
                  <>
                    <span className="drf-st-wide">add1 ×4</span>
                    <span className="drf-st-narrow">add1</span>
                  </>
                )}
              </span>
            );
          })}
        </div>

        <div className="drf-st-tape-head" data-second="">
          <span>
            Functional step trace <span className="drf-st-dim">· a setting</span>
          </span>
          <b className="drf-st-count" data-on={folded ? "" : undefined}>
            {phase === "shown" ? shownAt + 1 : folded ? SHOWN.length : 0}
          </b>
        </div>
        <div className="drf-st-tape" data-trace="" data-folded={folded ? "" : undefined} style={{ gridTemplateColumns: `repeat(${RAW.length}, minmax(0, 1fr))` }}>
          {SHOWN.map((x, i) => (
            <span
              key={i}
              className="drf-st-tile"
              data-kind={x.kind}
              data-wide={x.span > 1 ? "" : undefined}
              data-gap={i > 0 && (x.span > 1 || i === YS.length - 1 || SHOWN_COLS[i] === GROUPS[YS.length].from) ? "" : undefined}
              data-past={folded && (phase === "fold" || i < shownAt) ? "" : undefined}
              data-on={i === shownAt ? "" : undefined}
              style={{ gridColumn: `${SHOWN_COLS[i] + 1} / span ${x.span}`, ["--d" as string]: `${i * 40}ms` }}
            >
              {x.span > 1 && <span className="drf-st-tile-n">{x.span}→1</span>}
            </span>
          ))}
        </div>

        <div className="drf-st-legend">
          <span data-kind="app">a call to f</span>
          <span data-kind="prim">arithmetic</span>
          <span data-kind="cond">cond</span>
        </div>
      </div>

      <div className="drf-st-print">
        <div className="drf-st-print-head">
          <span>Printing, as DrRacket prints it</span>
          <span className="drf-st-dim">abbreviate-cons-as-list, forced on</span>
        </div>
        <div className="drf-st-print-row">
          <code>
            (cons &apos;a <mark className="drf-st-hl">(cons &apos;b &apos;())</mark>)
          </code>
          <span className="drf-st-arrow">→</span>
          <code>
            <mark className="drf-st-hl" data-side="after">
              (cons &apos;a (list &apos;b))
            </mark>
          </code>
          <span className="drf-st-arrow">→</span>
          <code>
            <mark className="drf-st-hl" data-side="after">
              (list &apos;a &apos;b)
            </mark>
          </code>
        </div>
      </div>
    </div>
  );
}
