"use client";

/**
 * Binding arrows while the user types, as Dr. Rocket's editor keeps them. The
 * mouse rests on the parameter `lst`, so its arrows are drawn. Each edit maps
 * every stored arrow end through the edit, so the arrows ride with their
 * tokens; 0.45 s after the last key the background check replaces them. An
 * error the check finds in the form being typed is held back until the caret
 * leaves that form. Offsets are computed from the text shown; the timing is
 * slowed down to be watched.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./Arrows.css";

type Kind = "open" | "close" | "kw" | "fn" | "sym" | "num" | "com";
type Tok = { id: string; s: number; e: number; kind: Kind; text: string };
type Range = { s: number; e: number };
type Arrow = { from: Range; to: Range };
type Check = "ok" | "wait" | "held" | "shown" | "wait-held";

const KEYWORDS = new Set(["define", "cond", "else"]);

/** A tiny lexer for this program: comments, brackets, atoms. */
function lex(text: string): Omit<Tok, "id">[] {
  const out: Omit<Tok, "id">[] = [];
  const re = /;[^\n]*|[()[\]]|[^\s()[\];]+/g;
  let prev: Kind | undefined;
  for (const m of text.matchAll(re)) {
    const t = m[0];
    const s = m.index ?? 0;
    let kind: Kind;
    if (t.startsWith(";")) kind = "com";
    else if (t === "(" || t === "[") kind = "open";
    else if (t === ")" || t === "]") kind = "close";
    else if (/^-?\d+$/.test(t)) kind = "num";
    else if (KEYWORDS.has(t)) kind = "kw";
    else if (prev === "open") kind = "fn";
    else kind = "sym";
    out.push({ s, e: s + t.length, kind, text: t });
    prev = kind;
  }
  return out;
}

/** buffer::map_pos for an insertion of `len` at `at`: starts don't stick, ends do. */
function mapPos(pos: number, at: number, len: number, stickEnd: boolean) {
  if (pos < at) return pos;
  if (pos > at || stickEnd) return pos + len;
  return pos;
}
const mapRange = (r: Range, at: number, len: number): Range => {
  const s = mapPos(r.s, at, len, false);
  return { s, e: Math.max(s, mapPos(r.e, at, len, true)) };
};

/** What check syntax reports for the hovered `lst`: binder to each use in count-big. */
function checkArrows(text: string): Arrow[] {
  const toks = lex(text);
  const end = text.indexOf("\n\n");
  const lst = toks.filter((t) => t.text === "lst" && (end < 0 || t.s < end));
  const [binder, ...uses] = lst;
  return uses.map((u) => ({ from: { s: binder.s, e: binder.e }, to: { s: u.s, e: u.e } }));
}

const BASE = `(define (count-big lst limit)
  (cond [(empty? lst) 0]
        [(> (first lst) limit)
         (+ 1 (count-big (rest lst) limit))]
        [else (count-big (rest lst) limit)]))`;

const CONTRACT = ";; (listof Number) Number -> Natural\n";
const NEWFORM = "\n\n(define (count-big-10 lst) )";
const BODY = "\n  (count-big lst 10)";
const MESSAGE = "define: expected an expression for the function body";

type Script = {
  edit?: (text: string) => { at: number; ins: string };
  caret: (text: string) => number;
  check: Check;
  arrows: "keep" | "check" | "none";
  say: string;
};

const SCRIPT: Script[] = [
  {
    caret: (t) => t.length,
    check: "ok",
    arrows: "check",
    say: "Check syntax has run. The mouse rests on lst, so its four arrows are drawn.",
  },
  {
    edit: () => ({ at: 0, ins: CONTRACT }),
    caret: () => CONTRACT.length,
    check: "wait",
    arrows: "keep",
    say: `Type a contract line above. Every stored end moves by its ${CONTRACT.length} characters, so the arrows ride along.`,
  },
  {
    caret: () => CONTRACT.length,
    check: "ok",
    arrows: "check",
    say: "0.45 s after the last key, the check runs again. Its arrows land where the shifted ones already were.",
  },
  {
    edit: (t) => ({ at: t.indexOf("(> ") + 2, ins: "=" }),
    caret: (t) => t.indexOf("(>= ") + 3,
    check: "wait",
    arrows: "keep",
    say: "Type = after >. Every end after it moves by one; on screen, the arrow to that lst stretches by a column.",
  },
  {
    caret: (t) => t.indexOf("(>= ") + 3,
    check: "ok",
    arrows: "check",
    say: "The next check agrees again.",
  },
  {
    edit: (t) => ({ at: t.length, ins: NEWFORM }),
    caret: (t) => t.length - 1,
    check: "wait",
    arrows: "keep",
    say: "Start a definition at the end. The ( closes itself; the edit is after every arrow, so none moves.",
  },
  {
    caret: (t) => t.length - 1,
    check: "held",
    arrows: "none",
    say: "The check finds the unfinished define. The caret is inside it, so the error is held back. A program that does not expand has no arrows.",
  },
  {
    caret: (t) => t.lastIndexOf("\n\n") + 1,
    check: "shown",
    arrows: "none",
    say: "Move the caret off the form. Now the error is shown.",
  },
  {
    edit: (t) => ({ at: t.length - 1, ins: BODY }),
    caret: (t) => t.length - 1,
    check: "wait-held",
    arrows: "none",
    say: "Go back and type the body. Editing inside the form holds the error again.",
  },
  {
    caret: (t) => t.length - 1,
    check: "ok",
    arrows: "check",
    say: "The next check expands the program: no error, and the arrows are back.",
  },
];

type Frame = {
  text: string;
  toks: Tok[];
  fresh: Set<string>;
  caret: number;
  check: Check;
  arrows: Arrow[];
  /** arrow ends as token ids, or the last ones drawn when there are none (to fade out) */
  drawn: [string, string][];
  moved: boolean;
  error?: Range;
  edit?: { at: number; len: number };
  say: string;
};

/** Run the script: texts, token identities through each edit, stored arrows, the error. */
function build(): Frame[] {
  const frames: Frame[] = [];
  let text = BASE;
  let toks: Tok[] = lex(BASE).map((t) => ({ ...t, id: `t${t.s}` }));
  let arrows: Arrow[] = [];
  let error: Range | undefined;
  let drawn: [string, string][] = [];
  SCRIPT.forEach((step, k) => {
    let fresh = new Set<string>();
    let edit: Frame["edit"];
    let moved = false;
    if (step.edit) {
      const { at, ins } = step.edit(text);
      const len = ins.length;
      edit = { at, len };
      text = text.slice(0, at) + ins + text.slice(at);
      const old = new Map(toks.map((t) => [`${t.s >= at ? t.s + len : t.s}:${t.text}`, t.id]));
      toks = lex(text).map((t) => {
        const id = old.get(`${t.s}:${t.text}`);
        if (id) return { ...t, id };
        const nid = `n${k}-${t.s}`;
        fresh.add(nid);
        return { ...t, id: nid };
      });
      const next = arrows.map((a) => ({ from: mapRange(a.from, at, len), to: mapRange(a.to, at, len) }));
      moved = next.some((a, i) => a.to.s !== arrows[i].to.s || a.from.s !== arrows[i].from.s);
      arrows = next;
      if (error) error = mapRange(error, at, len);
    } else {
      fresh = new Set();
    }
    if (step.arrows === "check") arrows = checkArrows(text);
    if (step.arrows === "none") arrows = [];
    if (step.check === "held") error = { s: text.lastIndexOf("(define"), e: text.length };
    if (step.check === "ok") error = undefined;
    const at = new Map(toks.map((t) => [t.s, t.id]));
    if (arrows.length) drawn = arrows.map((a) => [at.get(a.from.s) ?? "", at.get(a.to.s) ?? ""]);
    frames.push({ text, toks, fresh, caret: step.caret(text), check: step.check, arrows, drawn, moved, error, edit, say: step.say });
  });
  return frames;
}

const FRAMES = build();
const N = FRAMES.length;
const BINDER = FRAMES[0].toks.find((t) => t.text === "lst")!.id;

type P = { row: number; col: number };

function rowCol(text: string, pos: number): P {
  const before = text.slice(0, pos);
  const row = before.split("\n").length - 1;
  return { row, col: pos - (before.lastIndexOf("\n") + 1) };
}

/** Tween token positions so the tokens and the arrows drawn between them move together. */
function useTween(target: Record<string, P>, ms: number, instant: boolean) {
  const [shown, setShown] = useState(target);
  const last = useRef(target);
  useEffect(() => {
    if (instant) {
      last.current = target;
      return;
    }
    const from = last.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - x, 3);
      const next: Record<string, P> = {};
      for (const id in target) {
        const a = from[id] ?? target[id];
        const b = target[id];
        next[id] = { row: a.row + (b.row - a.row) * e, col: a.col + (b.col - a.col) * e };
      }
      last.current = next;
      setShown(next);
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, instant]);
  return instant ? target : shown;
}

const DELAYS = [600, 2600, 2400, 2700, 2000, 2700, 3000, 2600, 2700, 2600];

export function Arrows() {
  const ref = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [m, setM] = useState({ cw: 8.4, fs: 14 });
  useLayoutEffect(() => {
    const el = code.current;
    const pr = probe.current;
    if (!el || !pr) return;
    const measure = () => {
      const cw = pr.getBoundingClientRect().width / 20;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 14;
      if (cw > 0) setM((o) => (Math.abs(o.cw - cw) < 0.01 && o.fs === fs ? o : { cw, fs }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seq = useSequence(ref, N, { delay: DELAYS, loop: true, hold: 3200 });
  const k = Math.max(0, seq.step);
  const f = FRAMES[k];
  const prev = k > 0 ? FRAMES[k - 1] : undefined;

  const target = useMemo(() => {
    const out: Record<string, P> = {};
    for (const t of FRAMES[k].toks) out[t.id] = rowCol(FRAMES[k].text, t.s);
    return out;
  }, [k]);
  const pos = useTween(target, 700, seq.reduced);

  const { cw, fs } = m;
  const lh = fs * 2;
  const padL = cw * 4;
  const padT = lh * 1.5;
  const rows = f.text.split("\n").length;
  const x = (col: number) => padL + col * cw;
  const y = (row: number) => padT + row * lh;
  const scale = fs / 14;

  const tokById = new Map(f.toks.map((t) => [t.id, t]));
  const arrowOn = f.arrows.length > 0;
  const uses = new Set(arrowOn ? f.drawn.map((d) => d[1]) : []);

  const end = (id: string) => {
    const t = tokById.get(id);
    const p = pos[id];
    if (!t || !p) return undefined;
    return { x: x(p.col + t.text.length / 2), y: y(p.row) + lh * 0.5 - fs * 0.62 };
  };

  const caret = rowCol(f.text, f.caret);
  const errSegs: { row: number; c0: number; c1: number }[] = [];
  if (f.error) {
    const a = rowCol(f.text, f.error.s);
    const b = rowCol(f.text, f.error.e);
    const lines = f.text.split("\n");
    for (let r = a.row; r <= b.row; r++) {
      const c0 = r === a.row ? a.col : (lines[r].match(/^ */)?.[0].length ?? 0);
      const c1 = r === b.row ? b.col : lines[r].length;
      errSegs.push({ row: r, c0, c1 });
    }
  }
  const errState = f.check === "shown" ? "shown" : f.error ? "held" : undefined;

  const pill =
    f.check === "ok"
      ? "checked"
      : f.check === "wait" || f.check === "wait-held"
        ? "typing · check in 0.45 s"
        : f.check === "held"
          ? "1 error · held"
          : "1 error";

  const label = seq.step < 0 ? undefined : `step ${k + 1} of ${N}`;

  return (
    <div ref={ref} className="drf-ar" data-tone="blue">
      <Controls seq={seq} label={label} />
      <div className="drf-ar-head">
        <span className="drf-ar-file drf-mono">count-big.rkt · BSL</span>
        <span className="drf-ar-pill" data-k={f.check} key={`p${k}`}>
          <i />
          {pill}
        </span>
      </div>
      <div className="drf-ar-main">
        <div className="drf-ar-sheet">
          <div
            ref={code}
            className="drf-ar-code drf-mono"
            style={{ height: y(rows) + lh * (f.check === "shown" ? 1.2 : 0.4) }}
          >
            <span ref={probe} className="drf-ar-probe" aria-hidden>
              00000000000000000000
            </span>
            {Array.from({ length: rows }, (_, r) => (
              <span key={r} className="drf-ar-ln" style={{ top: y(r), height: lh, lineHeight: `${lh}px`, width: padL - cw * 1.4 }}>
                {r + 1}
              </span>
            ))}
            {errSegs.map((s) => (
              <span
                key={`e${s.row}`}
                className="drf-ar-err"
                data-k={errState}
                style={{ left: x(s.c0) - 2, top: y(s.row) + lh * 0.14, width: (s.c1 - s.c0) * cw + 4, height: lh * 0.72 }}
              />
            ))}
            {f.toks.map((t) => {
              const p = pos[t.id] ?? target[t.id];
              const order = f.fresh.has(t.id) ? [...f.fresh].indexOf(t.id) : -1;
              return (
                <span
                  key={t.id}
                  className="drf-ar-tok"
                  data-kind={t.kind}
                  data-binder={t.id === BINDER ? "" : undefined}
                  data-use={uses.has(t.id) ? "" : undefined}
                  data-fresh={order >= 0 ? "" : undefined}
                  style={
                    {
                      left: x(p.col),
                      top: y(p.row),
                      height: lh,
                      lineHeight: `${lh}px`,
                      "--d": `${order * 45}ms`,
                    } as CSSProperties
                  }
                >
                  {t.text}
                </span>
              );
            })}
            <span
              className="drf-ar-caret"
              data-typing={f.check === "wait" || f.check === "wait-held" ? "" : undefined}
              style={{ left: x(caret.col) - 1, top: y(caret.row) + lh * 0.2, height: lh * 0.6 }}
            />
            <svg className="drf-ar-svg" aria-hidden>
              <g className="drf-ar-arrows" data-on={arrowOn ? "" : undefined} data-pulse={arrowOn && SCRIPT[k].arrows === "check" && k > 0 ? "" : undefined} key={`g${k}`}>
                {f.drawn.map(([a, b]) => {
                  const p = end(a);
                  const q = end(b);
                  if (!p || !q) return null;
                  const dist = Math.hypot(q.x - p.x, q.y - p.y);
                  const bend = Math.min(60 * scale, Math.max(12 * scale, dist * 0.25));
                  const head = 7 * scale;
                  const wing = 3.5 * scale;
                  return (
                    <g key={`${a}-${b}`}>
                      <path className="drf-ar-curve" d={`M${p.x},${p.y} C${p.x},${p.y - bend} ${q.x},${q.y - bend} ${q.x},${q.y}`} />
                      <circle className="drf-ar-fill" cx={p.x} cy={p.y} r={3 * scale} />
                      <path className="drf-ar-fill" d={`M${q.x},${q.y} L${q.x - wing},${q.y - head} L${q.x + wing},${q.y - head} Z`} />
                    </g>
                  );
                })}
              </g>
            </svg>
            {f.check === "shown" && errSegs[0] && (
              <span className="drf-ar-msg" style={{ left: x(errSegs[0].c0), top: y(errSegs[0].row + 1) - lh * 0.1 }}>
                {MESSAGE}
              </span>
            )}
            {errState === "held" && errSegs.length > 0 && (
              <span className="drf-ar-hold" style={{ left: x(errSegs[0].c1) + cw, top: y(errSegs[0].row) + lh * 0.22 }}>
                held · caret inside
              </span>
            )}
          </div>
        </div>
        <div className="drf-ar-side">
          <div className="drf-ar-side-head">stored arrows · lst</div>
          {f.arrows.length === 0 ? (
            <div className="drf-ar-none" key={`n${k}`}>
              none: the last check could not expand the program
            </div>
          ) : (
            <div className="drf-ar-rows">
              {f.arrows.map((a, i) => {
                const was = prev?.arrows[i];
                const delta = f.edit && was && f.moved ? a.to.s - was.to.s : 0;
                const fromCheck = !f.edit && SCRIPT[k].arrows === "check" && k > 0;
                const tag = delta ? `+${delta}` : fromCheck ? (was ? "same" : "back") : "";
                return (
                  <div key={`${k}-${i}`} className="drf-ar-row drf-mono" data-bump={delta ? "" : undefined} data-same={fromCheck ? "" : undefined}>
                    <span className="drf-ar-r">
                      {a.from.s}–{a.from.e}
                    </span>
                    <span className="drf-ar-to">→</span>
                    <span className="drf-ar-r">
                      {a.to.s}–{a.to.e}
                    </span>
                    <span className="drf-ar-tag">{tag}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="drf-ar-side-foot">
            {f.edit ? (
              <>
                edit at {f.edit.at}, +{f.edit.len}: {f.arrows.length === 0 ? "nothing stored to move" : f.moved ? "ends after it move" : "no end after it"}
              </>
            ) : SCRIPT[k].arrows === "check" ? (
              "replaced by the check"
            ) : (
              "kept"
            )}
          </div>
        </div>
      </div>
      <p className="drf-ar-say" aria-live="polite">
        {seq.step < 0 ? " " : f.say}
      </p>
    </div>
  );
}
