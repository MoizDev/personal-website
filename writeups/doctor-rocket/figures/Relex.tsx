"use client";

/**
 * Relexing one edit, as `relex` in Dr. Rocket's lexer does it. The tokens of
 * a two-line file sit on a ribbon with their offsets under them. An edit is
 * typed; the lexer backs up one token, lexes forward, and stops where a new
 * token lines up with an old one moved by the edit's length. Everything after
 * that is reused: only its offsets change.
 */

import { Fragment, useMemo, useRef, type CSSProperties } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Relex.css";

type Kind = "open" | "close" | "kw" | "fn" | "sym" | "num" | "com";
type Tok = { s: number; e: number; kind: Kind; text: string };

const KEYWORDS = new Set(["define"]);

/** A tiny lexer for the two lines in this figure: comments, brackets, atoms. */
function lex(text: string): Tok[] {
  const out: Tok[] = [];
  const re = /;[^\n]*|[()[\]]|[^\s()[\];]+/g;
  let prev: Tok | undefined;
  for (const m of text.matchAll(re)) {
    const t = m[0];
    const s = m.index ?? 0;
    let kind: Kind;
    if (t.startsWith(";")) kind = "com";
    else if (t === "(" || t === "[") kind = "open";
    else if (t === ")" || t === "]") kind = "close";
    else if (/^-?\d+(\.\d+)?$/.test(t)) kind = "num";
    else if (KEYWORDS.has(t)) kind = "kw";
    else if (prev?.kind === "open") kind = "fn";
    else kind = "sym";
    const tok = { s, e: s + t.length, kind, text: t };
    out.push(tok);
    prev = tok;
  }
  return out;
}

type Walk = {
  name: string;
  text: string;
  at: number;
  ins: string;
  say: [string, string, string, string, string, string];
};

const SOURCE = "(define (area r) (* 3.14 r r))\n(area 2)";

const WALKS: Walk[] = [
  {
    name: "Type 16",
    text: SOURCE,
    at: 24,
    ins: "16",
    say: [
      "Seventeen tokens, each with its offset in the file.",
      "Type 16 after 3.14. Every offset after the edit is now 2 too small.",
      "Back up one token before the edit, to a safe place to start lexing.",
      "Lex forward from there.",
      "r would sit at old 25 + 2 = 27, and it does, as the same kind of token. Stop.",
      "The rest is reused: add 2 to each offset. Two tokens lexed, fifteen reused.",
    ],
  },
  {
    name: "Comment out line 1",
    text: SOURCE,
    at: 0,
    ins: ";",
    say: [
      "The same file, before a different edit.",
      "Type ; at the start of line 1. The whole line becomes a comment.",
      "Back up one token: here, the start of the file.",
      "Lex forward: one comment token replaces sixteen.",
      "( would sit at old 31 + 1 = 32, and it does. Stop.",
      "Line 2 is reused, shifted by 1. One token lexed, four reused.",
    ],
  },
];

const STEPS_PER_WALK = 6;

type Plan = {
  old: Tok[];
  next: string;
  fresh: Tok[]; // tokens the lexer produced, in new coordinates
  i0: number; // first old token thrown away
  j: number; // first old token reused (old.length when none)
  restart: number;
  lo: number;
  hi: number;
  delta: number;
};

/** What relex does for one edit (the inserted text replaces nothing here). */
function plan(w: Walk): Plan {
  const old = lex(w.text);
  const next = w.text.slice(0, w.at) + w.ins + w.text.slice(w.at);
  const lo = w.at;
  const hi = w.at + w.ins.length;
  const delta = w.ins.length;
  // restart one token before the first token touching the edit
  const first = old.findIndex((t) => t.e >= lo);
  const i0 = Math.max(0, (first < 0 ? old.length : first) - 1);
  const restart = Math.min(old[i0]?.s ?? lo, lo);
  const all = lex(next);
  const fresh: Tok[] = [];
  let j = old.length;
  for (const nt of all) {
    if (nt.s < restart) continue;
    if (nt.s >= hi) {
      const k = old.findIndex((ot) => ot.s + delta === nt.s && ot.e + delta === nt.e && ot.kind === nt.kind);
      if (k >= 0) {
        j = k;
        break;
      }
    }
    fresh.push(nt);
  }
  return { old, next, fresh, i0, j, restart, lo, hi, delta };
}

const GAP = 0.5; // extra columns between tokens that touch, like "r)"
const BRACKET = /[()[\]]/;

/** Is there a token boundary with no space just before offset b? */
function glued(text: string, b: number, lexed: boolean): boolean {
  const a = text[b - 1];
  const c = text[b];
  if (!a || !c || /\s/.test(a) || /\s/.test(c)) return false;
  // inside a comment, once the lexer has seen it
  if (lexed && text.lastIndexOf(";", b - 1) > text.lastIndexOf("\n", b - 1)) return false;
  return BRACKET.test(a) || BRACKET.test(c);
}

/** Line and drawn column of an offset, with a little room between touching tokens. */
function where(text: string, at: number, lexed = true): { line: number; col: number } {
  const before = text.slice(0, at);
  const line = before.split("\n").length - 1;
  const start = before.lastIndexOf("\n") + 1;
  let gaps = 0;
  for (let b = start + 1; b <= at; b++) if (glued(text, b, lexed)) gaps++;
  return { line, col: at - start + gaps * GAP };
}

/** Drawn width of the text from s to e. */
function span(text: string, s: number, e: number, lexed = true): number {
  return where(text, e, lexed).col - where(text, s, lexed).col - (glued(text, e, lexed) ? GAP : 0);
}

export function Relex() {
  const wrap = useRef<HTMLDivElement>(null);
  const plans = useMemo(() => WALKS.map(plan), []);
  const seq = useSequence(wrap, WALKS.length * STEPS_PER_WALK, {
    delay: [700, 1500, 1700, 1600, 1900, 1800],
    loop: true,
    hold: 3400,
  });
  const started = seq.step >= 0;
  const at = Math.max(0, seq.step);
  const w = Math.floor(at / STEPS_PER_WALK);
  const s = started ? at % STEPS_PER_WALK : 0;
  const walk = WALKS[w];
  const p = plans[w];

  const text = s === 0 ? walk.text : p.next;
  const lexed = s >= 3;
  const pos = (off: number) => where(text, off, lexed);
  const shiftOld = (t: Tok) => (s === 0 || t.s < p.lo ? t.s : t.s + p.delta);

  type Shown = { key: string; tok: Tok; at: number; state: "plain" | "kept" | "stale" | "gone" | "fresh" | "sync" | "shifted"; label: number; bump?: boolean };
  const shown: Shown[] = [];
  p.old.forEach((t, k) => {
    let state: Shown["state"] = "plain";
    let label = t.s;
    if (s >= 1) {
      if (k < p.i0) state = "kept";
      else if (k < p.j) state = s >= 3 ? "gone" : "stale";
      else state = s >= 5 ? "shifted" : s === 4 && k === p.j ? "sync" : "stale";
      if (k >= p.j && s >= 5) label = t.s + p.delta;
    }
    shown.push({ key: `o${k}`, tok: t, at: shiftOld(t), state, label, bump: k >= p.j && s >= 5 });
  });
  if (s >= 3) p.fresh.forEach((t, k) => shown.push({ key: `n${w}-${k}`, tok: t, at: t.s, state: "fresh", label: t.s }));

  const lines = text.split("\n");
  const restartAt = pos(p.restart);
  const syncAt = p.j < p.old.length ? pos(p.old[p.j].s + p.delta) : pos(text.length);
  const cursor = s >= 3 ? syncAt : restartAt;
  const ins = pos(p.lo);

  const counts = [
    { k: "kept", n: p.i0, label: "untouched" },
    { k: "fresh", n: p.fresh.length, label: "lexed" },
    { k: "shifted", n: p.old.length - p.j, label: "shifted" },
  ];

  return (
    <div ref={wrap} className="drf-rx" data-tone="blue" data-step={s}>
      <Controls seq={seq} label={started ? walk.name : undefined} />

      <div className="drf-rx-head drf-mono">
        <span className="drf-rx-file">area.rkt</span>
        <span className="drf-rx-edit" data-on={s >= 1 ? "" : undefined}>
          insert <b>{JSON.stringify(walk.ins)}</b> at {p.lo} · delta +{p.delta}
        </span>
      </div>

      <div className="drf-rx-sheet">
        <div className="drf-rx-code drf-mono" style={{ "--rows": lines.length } as CSSProperties}>
          {lines.map((_, li) => (
            <span key={li} className="drf-rx-gutter" style={{ "--row": li } as CSSProperties}>
              {li + 1}
            </span>
          ))}

          {/* the typed text, until the lexer has turned it into tokens */}
          {s >= 1 && s < 3 && (
            <span className="drf-rx-ins" style={{ "--row": ins.line, "--col": ins.col, "--len": span(text, p.lo, p.hi, lexed) } as CSSProperties}>
              {walk.ins}
            </span>
          )}

          {shown.map(({ key, tok, at: off, state, label, bump }) => {
            const { line, col } = pos(off);
            return (
              <span
                key={key}
                className="drf-rx-tok"
                data-kind={tok.kind}
                data-state={state}
                style={{ "--row": line, "--col": col, "--len": span(text, off, off + tok.text.length, lexed) } as CSSProperties}
              >
                <span className="drf-rx-txt">{tok.text}</span>
                <span className="drf-rx-off" data-bump={bump ? "" : undefined}>
                  {label}
                </span>
              </span>
            );
          })}

          <span
            className="drf-rx-pin"
            data-on={s >= 2 ? "" : undefined}
            style={{ "--row": restartAt.line, "--col": restartAt.col } as CSSProperties}
          >
            <i>restart</i>
          </span>
          <span
            className="drf-rx-pin drf-rx-pin-sync"
            data-on={s >= 4 ? "" : undefined}
            style={{ "--row": syncAt.line, "--col": syncAt.col } as CSSProperties}
          >
            <i>resync</i>
          </span>
          <span
            className="drf-rx-cursor"
            data-on={s >= 2 && s < 5 ? "" : undefined}
            style={{ "--row": cursor.line, "--col": cursor.col } as CSSProperties}
          />
        </div>
      </div>

      <div className="drf-rx-say" aria-live="polite">
        {walk.say[s]}
      </div>

      <div className="drf-rx-foot">
        <div className="drf-rx-counts" data-on={s >= 5 ? "" : undefined}>
          {counts.map((c, k) => (
            <Fragment key={c.k}>
              {k > 0 && <span className="drf-rx-plus">+</span>}
              <span className="drf-rx-count" data-k={c.k}>
                <b className="drf-mono">{c.n}</b> {c.label}
              </span>
            </Fragment>
          ))}
          <span className="drf-rx-plus">=</span>
          <span className="drf-rx-count" data-k="total">
            <b className="drf-mono">{p.i0 + p.fresh.length + p.old.length - p.j}</b> tokens
          </span>
        </div>
        <div className="drf-rx-check" data-on={s >= 5 ? "" : undefined}>
          <span className="drf-rx-tick" aria-hidden>
            ✓
          </span>
          <span>
            Same tokens as lexing the whole file again
            <span className="drf-rx-check-sub drf-mono">checked after each of 100,000 random edits</span>
          </span>
        </div>
      </div>
    </div>
  );
}
