"use client";

/**
 * Code into words. The Visualizer explains every step of a run in a sentence
 * or two, and writes a short note beside the code it's about. The wording
 * here is what src/visualizer/explain.rs produces for one insert into a
 * binary search tree (most of it is asserted word for word in its tests).
 * The phrasebook lights the rules each step used; accessors, predicates and
 * constructors come from the program's own define-struct.
 */

import { useRef, type ReactNode } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import { tokenize, toLines, type Token } from "@/components/writeup/highlight";
import "./Explain.css";

const SOURCE = [
  "(define-struct node (key left right))",
  "",
  "(define (bst-insert k t)",
  "  (cond",
  "    [(empty? t) (make-node k empty empty)]",
  "    [(< k (node-key t))",
  "     (make-node (node-key t)",
  "                (bst-insert k (node-left t))",
  "                (node-right t))]",
  "    [else …]))",
];
const LINES: Token[][] = toLines(tokenize(SOURCE.join("\n"), "rkt"));

/** [line, from, to): columns on one line */
type Span = [number, number, number];

type Piece =
  | { t: "text"; s: string }
  | { t: "name"; s: string }
  | { t: "code"; s: string }
  | { t: "val"; s: string }
  | { t: "obj"; s: string; c: 1 | 2 }
  | { t: "ans"; yes: boolean };

const tx = (s: string): Piece => ({ t: "text", s });
const nm = (s: string): Piece => ({ t: "name", s });
const cd = (s: string): Piece => ({ t: "code", s });
const vl = (s: string): Piece => ({ t: "val", s });
const ob = (s: string, c: 1 | 2): Piece => ({ t: "obj", s, c });

type Rule = "acc" | "pred" | "cmp" | "make" | "sub1" | "first";

type Step = {
  kind: "question" | "call" | "return";
  code: string;
  own: Span[];
  work: Span[];
  note: { line: number; text: ReactNode };
  headline: Piece[];
  lines: Piece[][];
  rules: Rule[];
};

const STEPS: Step[] = [
  {
    kind: "question",
    code: "(empty? t)",
    own: [[4, 5, 15]],
    work: [],
    note: { line: 4, text: <>t is node 34 <b>→ No</b></> },
    headline: [tx("Is "), nm("t"), tx(" empty?"), { t: "ans", yes: false }],
    lines: [[tx("Here "), nm("t"), tx(" is "), ob("node 34", 1)], [tx("So cond moves on to the next clause")]],
    rules: ["pred"],
  },
  {
    kind: "question",
    code: "(< k (node-key t))",
    own: [[5, 5, 23]],
    work: [[5, 10, 22]],
    note: { line: 5, text: <>k is 12 and t&apos;s key is 34 <b>→ Yes</b></> },
    headline: [tx("Is "), nm("k"), tx(" less than "), nm("t"), tx("'s key?"), { t: "ans", yes: true }],
    lines: [
      [tx("Here "), nm("k"), tx(" is "), vl("12"), tx(" and "), nm("t"), tx("'s key is "), vl("34")],
      [tx("So cond uses this clause's answer")],
    ],
    rules: ["cmp", "acc"],
  },
  {
    kind: "call",
    code: "(bst-insert k (node-left t))",
    own: [[7, 16, 44]],
    work: [[7, 30, 43]],
    note: { line: 7, text: <>k = 12, t = node 18</> },
    headline: [nm("bst-insert"), tx(" calls itself")],
    lines: [
      [nm("k"), tx(" is "), vl("12")],
      [nm("t"), tx(" is "), ob("node 18", 1), tx(", which was "), nm("t"), tx("'s left in the previous call")],
      [tx("When it returns, "), nm("bst-insert"), tx(" goes on with "), cd("(make-node 34 ••• (node-right t))")],
    ],
    rules: ["acc"],
  },
  {
    kind: "return",
    code: "(make-node (node-key t) (bst-insert k (node-left t)) (node-right t))",
    own: [
      [6, 5, 28],
      [7, 16, 44],
      [8, 16, 31],
    ],
    work: [
      [6, 16, 28],
      [8, 16, 30],
    ],
    note: { line: 8, text: <>→ returns node 34</> },
    headline: [nm("bst-insert"), tx(" returns "), ob("node 34", 1)],
    lines: [
      [tx("It builds a new node with "), nm("key"), tx(" "), vl("34"), tx(", "), nm("left"), tx(" "), ob("node 18", 2), tx(" and "), nm("right"), tx(" "), vl("empty")],
      [tx("Back to the top level")],
    ],
    rules: ["make"],
  },
];

const RULES: { id: Rule; code: string; words: string; own?: boolean }[] = [
  { id: "acc", code: "(node-key t)", words: "t's key", own: true },
  { id: "make", code: "(make-node …)", words: "a new node", own: true },
  { id: "pred", code: "(empty? t)", words: "t is empty" },
  { id: "cmp", code: "(< k x)", words: "k less than x" },
  { id: "sub1", code: "(sub1 n)", words: "n - 1" },
  { id: "first", code: "(first l)", words: "the first item of l" },
];

/** One source line, coloured, with the step's own code and its work marked. */
function Line({ tokens, n, step }: { tokens: Token[]; n: number; step: Step }) {
  const at = (spans: Span[], col: number) => spans.some(([l, a, b]) => l === n && col >= a && col < b);
  // split tokens into runs that share colour and marks
  const runs: { text: string; kind?: string; own: boolean; work: boolean }[] = [];
  let col = 0;
  for (const t of tokens) {
    for (const ch of t.text) {
      const own = at(step.own, col);
      const work = at(step.work, col);
      const last = runs[runs.length - 1];
      if (last && last.kind === t.kind && last.own === own && last.work === work) last.text += ch;
      else runs.push({ text: ch, kind: t.kind, own, work });
      col++;
    }
  }
  return (
    <>
      {runs.map((r, k) => (
        <span
          key={k}
          className={r.kind ? `tk-${r.kind}` : undefined}
          data-own={r.own || undefined}
          data-work={r.work || undefined}
        >
          {r.text}
        </span>
      ))}
    </>
  );
}

function Pieces({ items }: { items: Piece[] }) {
  return (
    <>
      {items.map((p, k) => {
        switch (p.t) {
          case "text":
            return <span key={k}>{p.s}</span>;
          case "name":
            return (
              <span key={k} className="drf-ex-name">
                {p.s}
              </span>
            );
          case "code":
            return (
              <span key={k} className="drf-ex-code-chip">
                {p.s}
              </span>
            );
          case "val":
            return (
              <span key={k} className="drf-ex-val">
                {p.s}
              </span>
            );
          case "obj":
            return (
              <span key={k} className="drf-ex-obj" data-c={p.c}>
                {p.s}
              </span>
            );
          case "ans":
            return (
              <span key={k} className="drf-ex-ans" data-yes={p.yes || undefined}>
                {p.yes ? "Yes" : "No"}
              </span>
            );
        }
      })}
    </>
  );
}

export function Explain() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, STEPS.length, { delay: [600, 3400, 3400, 3600], loop: true, hold: 4200 });
  const i = Math.max(seq.step, 0);
  const step = STEPS[i];

  return (
    <div className="drf-ex" ref={ref}>
      <Controls seq={seq} label={`Step ${i + 1} of ${STEPS.length}`} />

      <div className="drf-ex-editor">
        <div className="drf-ex-tab drf-mono">
          <span>bst.rkt</span>
          <span className="drf-ex-tab-run">(bst-insert 12 tree)</span>
        </div>
        <pre className="drf-ex-code drf-mono">
          {LINES.map((tokens, n) => (
            <div className="drf-ex-line" key={n} data-on={step.own.some(([l]) => l === n) || undefined}>
              <span className="drf-ex-gutter">{n + 1}</span>
              <span className="drf-ex-text">
                <Line tokens={tokens} n={n} step={step} />
              </span>
              {step.note.line === n && (
                <span className="drf-ex-note" key={`${i}-note`}>
                  <span className="drf-ex-note-chip">{step.note.text}</span>
                </span>
              )}
            </div>
          ))}
        </pre>
      </div>

      <div className="drf-ex-below">
        <div className="drf-ex-card" key={i} aria-live="polite">
          <div className="drf-ex-steps" role="tablist" aria-label="Steps">
            {STEPS.map((s, k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === i}
                className="drf-ex-step drf-mono"
                data-on={k === i || undefined}
                onClick={() => seq.goto(k)}
              >
                {s.kind}
              </button>
            ))}
          </div>
          <div className="drf-ex-kind drf-mono">
            <span className="drf-ex-pill" data-kind={step.kind}>
              {step.kind}
            </span>
            <span className="drf-ex-stepcode">{step.code}</span>
          </div>
          <p className="drf-ex-head">
            <Pieces items={step.headline} />
          </p>
          <ul className="drf-ex-lines">
            {step.lines.map((l, k) => (
              <li key={k} style={{ animationDelay: `${0.25 + k * 0.18}s` }}>
                <Pieces items={l} />
              </li>
            ))}
          </ul>
        </div>

        <div className="drf-ex-book">
          <span className="drf-ex-book-head drf-mono">phrasebook</span>
          <ul>
            {RULES.map((r) => (
              <li key={r.id} data-on={step.rules.includes(r.id) || undefined}>
                <span className="drf-ex-rule-code drf-mono">{r.code}</span>
                <span className="drf-ex-rule-arrow">→</span>
                <span className="drf-ex-rule-words">{r.words}</span>
                {r.own && <span className="drf-ex-rule-own drf-mono">struct</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
