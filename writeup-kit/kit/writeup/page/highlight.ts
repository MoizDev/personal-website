/**
 * A small syntax highlighter for the short, simplified snippets in writeups.
 * It knows just enough of each language to colour keywords, strings, numbers,
 * comments, calls and keys. It runs on the server, so it ships no code.
 */

export type Lang = "ts" | "js" | "tsx" | "py" | "json" | "sh" | "rkt" | "text";

/** What a piece of code is, for its colour. */
export type Kind = "kw" | "str" | "num" | "com" | "fn" | "prop" | "key" | "lit" | "punct" | "deco";

export type Token = { text: string; kind?: Kind };

type Rule = [Kind | null, RegExp];

const JS_WORDS =
  "const let var function return if else for of in while do await async new class extends import from export default type interface as switch case break continue throw try catch finally yield typeof instanceof void delete";
const PY_WORDS =
  "def return if elif else for in while not and or is class import from as with try except finally raise lambda yield async await pass break continue global nonlocal del assert";

const RKT_WORDS =
  /(?:define-struct|define|lambda|λ|local|cond|else|if|let\*?|letrec|and|or|when|unless|begin|set!|require|provide|module|check-expect)(?=[\s()[\]{}]|$)/y;

const words = (s: string) => new RegExp(`\\b(?:${s.split(" ").join("|")})\\b`, "y");

const IDENT: Rule = [null, /[A-Za-z_$][\w$]*/y];
const NUM: Rule = ["num", /\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b/y];
const PUNCT: Rule = ["punct", /[{}()[\];,.:]|=>|[=!<>]=?=?|&&|\|\||[+\-*/%&|^~?]=?/y];

const RULES: Record<Exclude<Lang, "text">, Rule[]> = {
  ts: [
    ["com", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ["str", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y],
    ["kw", words(JS_WORDS)],
    ["lit", /\b(?:true|false|null|undefined|this)\b/y],
    NUM,
    IDENT,
    PUNCT,
  ],
  js: [],
  tsx: [],
  py: [
    ["com", /#[^\n]*/y],
    ["str", /[rbfRBF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y],
    ["deco", /@[A-Za-z_][\w.]*/y],
    ["kw", words(PY_WORDS)],
    ["lit", /\b(?:True|False|None|self)\b/y],
    NUM,
    IDENT,
    PUNCT,
  ],
  json: [
    ["str", /"(?:\\.|[^"\\\n])*"/y],
    ["lit", /\b(?:true|false|null)\b/y],
    ["num", /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/y],
    ["com", /\/\/[^\n]*/y],
    PUNCT,
  ],
  sh: [
    ["com", /#[^\n]*/y],
    ["str", /"(?:\\.|[^"\\])*"|'[^']*'/y],
    ["kw", /\$\{?\w+\}?/y],
    ["key", /(?<=\s)--?[\w-]+/y],
    IDENT,
    ["punct", /[|&;<>]+/y],
  ],
  // Racket: names run until a delimiter, the word after "(" is the call
  rkt: [
    ["com", /;[^\n]*|#\|[\s\S]*?\|#|#;/y],
    ["str", /"(?:\\.|[^"\\])*"/y],
    ["key", /#:[^\s()[\]{}"]+/y],
    ["lit", /#(?:true|false|t|f)(?=[\s()[\]{}]|$)/y],
    ["kw", RKT_WORDS],
    ["num", /[+-]?\d+(?:\.\d+)?(?:\/\d+)?(?=[\s()[\]{}]|$)/y],
    ["lit", /(?:true|false|empty|null)(?=[\s()[\]{}]|$)/y],
    ["fn", /(?<=\()[^\s()[\]{}"';`,]+/y],
    [null, /[^\s()[\]{}"';`,]+/y],
    ["punct", /[()[\]{}'`,]/y],
  ],
};
RULES.js = RULES.ts;
RULES.tsx = RULES.ts;

/** Code to tokens. Plain text between tokens is kept as unmarked tokens. */
export function tokenize(code: string, lang: Lang): Token[] {
  if (lang === "text") return [{ text: code }];
  const rules = RULES[lang];
  const out: Token[] = [];
  let plain = "";
  let i = 0;
  const flush = () => {
    if (plain) out.push({ text: plain });
    plain = "";
  };
  outer: while (i < code.length) {
    for (const [kind, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length) {
        flush();
        out.push({ text: m[0], kind: kind ?? undefined });
        i += m[0].length;
        continue outer;
      }
    }
    plain += code[i++];
  }
  flush();

  // a second pass for what only context can tell: calls, keys and properties
  const next = (k: number) => {
    for (let j = k + 1; j < out.length; j++) if (out[j].text.trim()) return out[j];
  };
  const prev = (k: number) => {
    for (let j = k - 1; j >= 0; j--) if (out[j].text.trim()) return out[j];
  };
  out.forEach((t, k) => {
    if (lang === "rkt") return; // its rules already know calls from names
    const n = next(k)?.text;
    if (t.kind === "str" && (lang === "json" || lang === "py") && n === ":") t.kind = "key";
    // a keyword used as a name: spec.type, { type: "flow" }
    if (t.kind === "kw" && lang !== "sh") {
      const p = prev(k)?.text;
      if (p === ".") t.kind = "prop";
      else if (n === ":" && (p === "{" || p === ",")) t.kind = "key";
    }
    if (t.kind !== undefined || !/^[A-Za-z_$]/.test(t.text) || lang === "sh") return;
    if (n === "(") t.kind = "fn";
    else if (prev(k)?.text === ".") t.kind = "prop";
    else if ((lang === "ts" || lang === "js" || lang === "tsx") && n === ":" && prev(k)?.text.match(/^[{,]$/)) t.kind = "key";
    else if (lang === "py" && n === "=" && prev(k)?.text.match(/^[(,]$/)) t.kind = "key";
  });
  return out;
}

/** Tokens to lines, splitting any token that spans a line break. */
export function toLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const t of tokens) {
    const parts = t.text.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ text: p, kind: t.kind });
    });
  }
  return lines;
}

/** Trim blank lines at either end and the indent every line shares. */
export function dedent(src: string): string {
  const lines = src.replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

/** "2-4, 7" to the set {2, 3, 4, 7}. Lines count from 1. */
export function lineSet(spec: string | number[] | undefined): Set<number> {
  if (!spec) return new Set();
  if (Array.isArray(spec)) return new Set(spec);
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.split("-").map((s) => Number(s.trim()));
    if (!Number.isFinite(a)) continue;
    for (let n = a; n <= (Number.isFinite(b) ? b : a); n++) out.add(n);
  }
  return out;
}
