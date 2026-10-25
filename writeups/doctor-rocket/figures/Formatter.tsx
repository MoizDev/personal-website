"use client";

/**
 * The formatter's search, for one form that is too wide for the wrap guide.
 * Each candidate layout is scored as (columns past the guide, lines) and the
 * scores are compared in that order, so fitting beats being short. Then the
 * winner is lexed again and must give back the same tokens: only whitespace
 * may change. The layouts and scores here are what format.rs produces at a
 * guide of 40 columns.
 */

import { useRef, type CSSProperties } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Formatter.css";

const GUIDE = 40;

type Cand = {
  id: string;
  name: string;
  sub: string;
  lines: string[];
};

const FLAT: Cand = {
  id: "flat",
  name: "One line",
  sub: "65 columns wide",
  lines: ['(above/align "left" (text "Launch window open" 24 "navy") rocket)'],
};
const FIRST: Cand = {
  id: "first",
  name: "Under the first argument",
  sub: "the rest lined up under it",
  lines: [
    '(above/align "left"',
    '             (text "Launch window open"',
    "                   24",
    '                   "navy")',
    "             rocket)",
  ],
};
const HEAD: Cand = {
  id: "head",
  name: "Under the head",
  sub: "each argument on its own line",
  lines: ["(above/align", ' "left"', ' (text "Launch window open" 24 "navy")', " rocket)"],
};
const CANDS = [FLAT, FIRST, HEAD];

function score(c: Cand): [number, number] {
  return [c.lines.reduce((n, l) => n + Math.max(0, l.length - GUIDE), 0), c.lines.length];
}

/** Colour one line of Racket for the figure. */
function Line({ text }: { text: string }) {
  const parts = text.match(/"[^"]*"|[()]|\s+|[^\s()"]+/g) ?? [];
  const classes: string[] = [];
  let afterOpen = false;
  for (const p of parts) {
    let cls = "";
    if (p.startsWith('"')) cls = "s";
    else if (p === "(" || p === ")") cls = "p";
    else if (/^\d+$/.test(p)) cls = "n";
    else if (afterOpen && p.trim()) cls = "f";
    if (p.trim()) afterOpen = p === "(";
    classes.push(cls);
  }
  return (
    <>
      {parts.map((p, k) => (
        <span key={k} className={classes[k] ? `drf-fmt-${classes[k]}` : undefined}>
          {p}
        </span>
      ))}
    </>
  );
}

/** A layout with the guide drawn over it, and columns past the guide marked. */
function Layout({ c, step, lit }: { c: Cand; step: number; lit: boolean }) {
  return (
    <pre className="drf-fmt-code drf-mono" style={{ "--guide": GUIDE, "--cols": c.id === "flat" ? 66 : 42 } as CSSProperties}>
      <span className="drf-fmt-guide" aria-hidden />
      {c.lines.map((l, k) => (
        <span key={k} className="drf-fmt-line" style={{ "--k": k } as CSSProperties} data-in={step >= 0 ? "" : undefined}>
          <Line text={l} />
          {lit && l.length > GUIDE && (
            <span className="drf-fmt-over" style={{ "--from": GUIDE, "--len": l.length - GUIDE } as CSSProperties} aria-hidden />
          )}
        </span>
      ))}
    </pre>
  );
}

// Steps: 0 one line · 1 under the first argument · 2 under the head ·
// 3 compare overflow · 4 compare lines · 5 lex again
const SAY = [
  "One line would be 65 columns: 25 past the guide.",
  "Break after the first argument and line the rest up under it. The inner call breaks too.",
  "Or put every argument on its own line, one column in.",
  "Compare overflow first. Only one line fails it.",
  "Both others fit, so compare lines: 4 beats 5.",
  "Lex the result: the same eleven tokens, in order. Only whitespace changed.",
];

const TOKENS = ["(", "above/align", '"left"', "(", "text", '"Launch window open"', "24", '"navy"', ")", "rocket", ")"];

export function Formatter() {
  const wrap = useRef<HTMLDivElement>(null);
  const seq = useSequence(wrap, SAY.length, { delay: [600, 1700, 1900, 1900, 1700, 1800], loop: true, hold: 3800 });
  const started = seq.step >= 0;
  const s = Math.max(0, seq.step);

  const state = (c: Cand): "idle" | "out" | "lose" | "win" => {
    if (s >= 3 && c.id === "flat") return "out";
    if (s >= 4 && c.id === "first") return "lose";
    if (s >= 4 && c.id === "head") return "win";
    return "idle";
  };
  const shown = (k: number) => started && s >= k;

  return (
    <div ref={wrap} className="drf-fmt" data-tone="blue" data-step={started ? s : -1}>
      <Controls seq={seq} label={started ? "Guide at 40" : undefined} />

      <div className="drf-fmt-grid">
        {CANDS.map((c, k) => {
          const [over, lines] = score(c);
          const st = state(c);
          return (
            <section
              key={c.id}
              className={`drf-fmt-card drf-fmt-c-${c.id}`}
              data-on={shown(k) ? "" : undefined}
              data-state={st}
              aria-label={`${c.name}: ${over} columns past the guide, ${lines} lines`}
            >
              <header className="drf-fmt-card-head">
                <span className="drf-fmt-name">{c.name}</span>
                <span className="drf-fmt-sub drf-mono">{c.sub}</span>
                {st === "win" && <span className="drf-fmt-stamp drf-mono">chosen</span>}
              </header>
              <Layout c={c} step={shown(k) ? s : -1} lit={shown(k)} />
              <footer className="drf-fmt-score drf-mono">
                <span className="drf-fmt-cost" data-hot={s === 3 ? "" : undefined} data-bad={over > 0 ? "" : undefined}>
                  <i>over</i> {over}
                </span>
                <span className="drf-fmt-cost" data-hot={s === 4 && over === 0 ? "" : undefined}>
                  <i>lines</i> {lines}
                </span>
                <span className="drf-fmt-tuple">
                  ({over}, {lines})
                </span>
              </footer>
            </section>
          );
        })}
      </div>

      <div className="drf-fmt-say" aria-live="polite">
        {started ? SAY[s] : <>&nbsp;</>}
      </div>

      <div className="drf-fmt-check" data-on={started && s >= 5 ? "" : undefined}>
        <span className="drf-fmt-check-label drf-mono">tokens before · after</span>
        <div className="drf-fmt-toks drf-mono">
          {TOKENS.map((t, k) => (
            <span key={k} className="drf-fmt-tok" style={{ "--k": k } as CSSProperties}>
              {t}
            </span>
          ))}
        </div>
        <span className="drf-fmt-ok">
          <span className="drf-fmt-tick" aria-hidden>
            ✓
          </span>
          same kinds, same text
        </span>
      </div>
    </div>
  );
}
