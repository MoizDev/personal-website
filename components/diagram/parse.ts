/**
 * The diagram language: a few lines of plain text become an animated figure.
 * The first line names the kind of diagram; the rest is that kind's lines.
 * Blank lines and lines starting with # are ignored. See writeups/README.md
 * for the full reference.
 *
 *   flow                       a pipeline of steps with arrows and loops
 *   cycle                      steps on a ring, with a token going round
 *   chat                       a conversation, typed out line by line
 *   timeline                   moments on a line, lit up in order
 *   clock                      a timer that runs, with events as it passes them
 *   bars                       horizontal bars, or ranges on a time axis
 *   tune                       switches flipped one by one, then a number moves
 *   dots                       a field of dots with a few picked out
 *   bricks                     a side view of a body: cells become real bricks
 *
 * Shared bits of a line:
 *   "Label"      text in double quotes
 *   [Icon]       an icon by name (see icons.tsx)
 *   {tone}       a colour: orange, blue, yellow, green, purple, teal, red, gray
 *   : note       everything after a colon is a smaller note
 */

export type Tone = "ink" | "orange" | "blue" | "yellow" | "green" | "purple" | "teal" | "red" | "gray";

const TONES = new Set<Tone>(["ink", "orange", "blue", "yellow", "green", "purple", "teal", "red", "gray"]);

/** The parts every labelled item can carry. */
export type Bits = { label: string; icon?: string; tone?: Tone; note?: string };

/**
 * How a flow node is drawn. card is the default: an icon tile over a label.
 * The rest are flowchart shapes; see writeups/README.md.
 */
export type Shape = "card" | "step" | "decide" | "pill" | "store" | "doc" | "io" | "round" | "stack";
const SHAPES = new Set<Shape>(["card", "step", "decide", "pill", "store", "doc", "io", "round", "stack"]);

export type FlowNode = Bits & { id: string; shape?: Shape };
export type FlowEdge = {
  from: string;
  to: string;
  kind: "next" | "loop" | "cut";
  label?: string;
  /** an icon the token carries along this arrow */
  icon?: string;
  /** route around the outside of the chart, on this side */
  via?: "left" | "right";
};
/** A shaded region behind some nodes (group), or a full-width band (lane). */
export type FlowGroup = Bits & { kind: "group" | "lane"; ids: string[] };
export type FlowSpec = {
  type: "flow";
  cols: number;
  /** explicit rows of node ids ("." is an empty cell); when set, cols is the widest row */
  rows?: (string | null)[][];
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups?: FlowGroup[];
  /** the order the highlight walks; ids may repeat to go round a loop */
  play: string[];
  /** when the walk passes a loop edge, how many laps to show */
  laps?: number;
};

export type CycleSpec = {
  type: "cycle";
  nodes: FlowNode[];
  laps: number;
  center?: string;
  /** shown in the middle once the laps are done */
  end?: string;
};

export type ChatLine =
  | { kind: "say"; who: string; icon?: string; tone?: Tone; text: string; mine: boolean }
  | { kind: "aside"; text: string };
export type ChatSpec = { type: "chat"; call?: string; lines: ChatLine[] };

export type TimelineItem = Bits & { time: string };
export type TimelineSpec = { type: "timeline"; items: TimelineItem[] };

export type ClockEvent = Bits & { at: number };
export type ClockSpec = { type: "clock"; to: number; seconds: number; events: ClockEvent[]; done?: string };

export type BarSegment = { from: number; to: number; label?: string; tone?: Tone };
export type BarRow = Bits & { value?: number; segments?: BarSegment[] };
export type BarsSpec = {
  type: "bars";
  rows: BarRow[];
  max: number;
  unit: string;
  format: "number" | "clock";
  /** a dashed marker line across the rows */
  mark?: { at: number; label?: string };
};

export type TuneSpec = {
  type: "tune";
  from: string;
  to: string;
  label?: string;
  levers: Bits[];
  done?: string;
};

export type DotsSpec = {
  type: "dots";
  count: number;
  highlight: number;
  label?: string;
  pick?: string;
  cols: number;
};

/** One real brick in a bricks diagram: a run of cells in one layer. */
export type Brick = { x: number; y: number; w: number; colour: string };
export type BricksSpec = {
  type: "bricks";
  width: number;
  height: number;
  /** filled cells, bottom layer is y = 0 */
  cells: { x: number; y: number; colour: string }[];
  bricks: Brick[];
  /** what each step says: cells, bricks, then (with mass) the balance check */
  says: string[];
  /** centre of mass along x, in cells; shows a plumb line over the base */
  mass?: number;
  /** rows are plates (a third of a brick tall) rather than bricks */
  plates: boolean;
};

export type DiagramSpec = FlowSpec | CycleSpec | ChatSpec | TimelineSpec | ClockSpec | BarsSpec | TuneSpec | DotsSpec | BricksSpec;

export class DiagramError extends Error {}

/** "3:20" or "200" to seconds (or a plain number) */
export function toNumber(s: string): number {
  const t = s.trim();
  if (/^\d+:\d{1,2}(\.\d+)?$/.test(t)) {
    const [m, sec] = t.split(":");
    return Number(m) * 60 + Number(sec);
  }
  const n = parseFloat(t.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** seconds to "m:ss" */
export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Pull "Label", [Icon], {tone} and ": note" out of a fragment. With withNote
 * false, colons are left alone, for fragments that hold times like 1:30.
 */
export function bits(src: string, withNote = true): Bits & { rest: string } {
  let s = src;
  let note: string | undefined;
  // the note is whatever follows the first colon that sits outside quotes
  let inQuote = false;
  for (let i = 0; withNote && i < s.length; i++) {
    if (s[i] === '"') inQuote = !inQuote;
    else if (s[i] === ":" && !inQuote) {
      note = s.slice(i + 1).trim() || undefined;
      s = s.slice(0, i);
      break;
    }
  }
  const label = s.match(/"([^"]*)"/)?.[1];
  const icon = s.match(/\[([\w-]+)\]/)?.[1];
  const tone = s.match(/\{(\w+)\}/)?.[1] as Tone | undefined;
  if (tone && !TONES.has(tone)) throw new DiagramError(`unknown tone {${tone}}`);
  const rest = s
    .replace(/"[^"]*"/, "")
    .replace(/\[[\w-]+\]/, "")
    .replace(/\{\w+\}/, "")
    .trim();
  return { label: label ?? rest, icon, tone, note, rest };
}

type Line = { text: string; n: number };

/** A header line like "cols: 4". */
function header(line: string): [string, string] | null {
  const m = line.match(/^([a-z]+):\s*(.*)$/);
  return m ? [m[1], m[2].trim()] : null;
}

function headers(lines: Line[], keys: string[]): { head: Record<string, string>; body: Line[] } {
  const head: Record<string, string> = {};
  const body: Line[] = [];
  for (const l of lines) {
    const h = header(l.text);
    if (h && keys.includes(h[0])) head[h[0]] = h[1];
    else body.push(l);
  }
  return { head, body };
}

const unquote = (s: string | undefined) => s?.replace(/^"(.*)"$/, "$1");

/** "node id ..." or "id "Label" ...", with an optional <shape> after the id */
function nodeLine(text: string): FlowNode | null {
  const m = text.match(/^(?:node\s+)?([A-Za-z]\w*)\s+(?:<(\w+)>\s*)?(?=["[{])(.*)$/);
  if (!m) return null;
  const shape = m[2] as Shape | undefined;
  if (shape && !SHAPES.has(shape)) throw new DiagramError(`unknown shape <${shape}>: use ${[...SHAPES].join(", ")}`);
  const b = bits(m[3]);
  return { id: m[1], label: b.label, icon: b.icon, tone: b.tone, note: b.note, ...(shape && shape !== "card" ? { shape } : {}) };
}

/** group "Label" {tone} : a b c, or lane ... : when every word after the colon is a node */
function groupLine(text: string, ids: Set<string>): FlowGroup | null {
  const m = text.match(/^(group|lane)\s+(?=["[{])(.*)$/);
  if (!m) return null;
  const b = bits(m[2]);
  const members = (b.note ?? "").split(/\s+/).filter(Boolean);
  if (!members.length || !members.every((id) => ids.has(id))) return null;
  return { kind: m[1] as FlowGroup["kind"], label: b.label, icon: b.icon, tone: b.tone, ids: members };
}

const EDGE_OP = /\s*(->|~>|-x)\s*/;

function edgeLine(text: string, ids: Set<string>, n: number): FlowEdge[] | null {
  if (!EDGE_OP.test(text)) return null;
  // @left or @right sends the last hop around the outside; [Icon] is what its token carries
  let t = text;
  const via = t.match(/\s@(left|right)\b/)?.[1] as FlowEdge["via"];
  t = t.replace(/\s@(left|right)\b/, "");
  const icon = t.match(/\s\[([\w-]+)\]/)?.[1];
  t = t.replace(/\s\[([\w-]+)\]/, "").trim();
  // a trailing "label" names the last hop
  const lm = t.match(/"([^"]*)"\s*$/);
  const body = lm ? t.slice(0, lm.index).trim() : t;
  const parts = body.split(EDGE_OP).map((p) => p.trim());
  const out: FlowEdge[] = [];
  for (let i = 0; i + 2 < parts.length; i += 2) {
    const [from, op, to] = [parts[i], parts[i + 1], parts[i + 2]];
    for (const id of [from, to]) {
      if (!ids.has(id)) throw new DiagramError(`line ${n}: no node called "${id}"`);
    }
    out.push({ from, to, kind: op === "~>" ? "loop" : op === "-x" ? "cut" : "next" });
  }
  const last = out[out.length - 1];
  if (last) {
    if (lm) last.label = lm[1];
    if (icon) last.icon = icon;
    if (via) last.via = via;
  }
  return out;
}

function parseFlow(lines: Line[]): FlowSpec {
  const { head, body } = headers(lines, ["cols", "play", "laps"]);
  const nodes: FlowNode[] = [];
  const rows: (string | null)[][] = [];
  const edgeLines: Line[] = [];
  // a line starting "group" or "lane" is a region if what follows its colon is
  // all node ids, and otherwise a node that happens to have that id
  const ids = new Set(body.map((l) => (/^(group|lane)\s/.test(l.text) ? null : nodeLine(l.text)?.id)).filter(Boolean) as string[]);
  const groups: FlowGroup[] = [];
  for (const l of body) {
    if (l.text.startsWith("row:")) {
      rows.push(l.text.slice(4).trim().split(/\s+/).map((id) => (id === "." ? null : id)));
      continue;
    }
    const g = groupLine(l.text, ids);
    if (g) {
      groups.push(g);
      continue;
    }
    const node = nodeLine(l.text);
    if (node) nodes.push(node);
    else edgeLines.push(l);
  }
  for (const n of nodes) ids.add(n.id);
  const edges: FlowEdge[] = [];
  for (const l of edgeLines) {
    const e = edgeLine(l.text, ids, l.n);
    if (!e) throw new DiagramError(`line ${l.n}: can't read "${l.text}"`);
    edges.push(...e);
  }
  for (const r of rows) for (const id of r) if (id && !ids.has(id)) throw new DiagramError(`row: no node "${id}"`);
  const play = head.play ? head.play.split(/\s+/).filter((id) => ids.has(id)) : nodes.map((n) => n.id);
  const cols = rows.length ? Math.max(...rows.map((r) => r.length)) : Number(head.cols) || Math.min(nodes.length, 4);
  return {
    type: "flow",
    cols,
    rows: rows.length ? rows : undefined,
    nodes,
    edges,
    groups: groups.length ? groups : undefined,
    play,
    laps: head.laps ? Number(head.laps) : undefined,
  };
}

function parseCycle(lines: Line[]): CycleSpec {
  const { head, body } = headers(lines, ["laps", "center", "end"]);
  const nodes = body.map((l) => {
    const n = nodeLine(l.text);
    if (!n) throw new DiagramError(`line ${l.n}: expected a step like: prompt "Prompt" [Bot]`);
    return n;
  });
  return { type: "cycle", nodes, laps: Number(head.laps) || 3, center: unquote(head.center), end: unquote(head.end) };
}

function parseChat(lines: Line[]): ChatSpec {
  const { head, body } = headers(lines, ["call"]);
  const out: ChatLine[] = body.map((l) => {
    const t = l.text;
    if (t.startsWith("(") && t.endsWith(")")) return { kind: "aside", text: t.slice(1, -1).trim() };
    const mine = t.startsWith(">");
    const s = mine ? t.slice(1).trim() : t;
    const i = s.indexOf(":");
    if (i < 0) throw new DiagramError(`line ${l.n}: expected Name: what they said`);
    const who = s.slice(0, i);
    const b = bits(who);
    return { kind: "say", who: b.rest || b.label, icon: b.icon, tone: b.tone, text: s.slice(i + 1).trim(), mine };
  });
  return { type: "chat", call: unquote(head.call), lines: out };
}

function parseTimeline(body: Line[]): TimelineSpec {
  const items = body.map((l) => {
    const [time, title, ...rest] = l.text.split("|").map((p) => p.trim());
    if (title === undefined) throw new DiagramError(`line ${l.n}: expected time | title | note`);
    const b = bits(title);
    return { time, label: b.label, icon: b.icon, tone: b.tone, note: rest.join(" | ") || undefined };
  });
  return { type: "timeline", items };
}

function parseClock(lines: Line[]): ClockSpec {
  const { head, body } = headers(lines, ["to", "seconds", "done"]);
  const events = body.map((l) => {
    const m = l.text.match(/^at\s+([\d:.]+)\s+(.*)$/);
    if (!m) throw new DiagramError(`line ${l.n}: expected at 10:00 "What happened"`);
    const b = bits(m[2]);
    return { at: toNumber(m[1]), label: b.label, icon: b.icon, tone: b.tone, note: b.note };
  });
  const to = head.to ? toNumber(head.to) : Math.max(...events.map((e) => e.at));
  return { type: "clock", to, seconds: Number(head.seconds) || 7, events, done: unquote(head.done) };
}

function parseBars(lines: Line[]): BarsSpec {
  const { head, body } = headers(lines, ["max", "unit", "format", "mark"]);
  const rows: BarRow[] = body.map((l) => {
    const [label, value, ...rest] = l.text.split("|").map((p) => p.trim());
    if (value === undefined) throw new DiagramError(`line ${l.n}: expected label | value | note`);
    const lb = bits(label);
    const nb = rest.length ? bits(rest.join(" ")) : undefined;
    const row: BarRow = { label: lb.label, icon: lb.icon, tone: lb.tone ?? nb?.tone, note: nb ? nb.rest || nb.note : undefined };
    if (value.includes("..")) {
      row.segments = value.split(",").map((seg) => {
        const sb = bits(seg, false);
        const [a, b] = sb.rest.split("..").map(toNumber);
        return { from: a, to: b, label: seg.includes('"') ? sb.label : undefined, tone: sb.tone };
      });
    } else row.value = toNumber(value);
    return row;
  });
  const top = Math.max(...rows.map((r) => r.value ?? Math.max(...(r.segments ?? []).map((s) => s.to))));
  let mark: BarsSpec["mark"];
  if (head.mark) {
    const mb = bits(head.mark, false);
    mark = { at: toNumber(mb.rest), label: head.mark.includes('"') ? mb.label : undefined };
  }
  return {
    type: "bars",
    rows,
    // without max:, the axis reaches the last bar or the mark, whichever is later
    max: head.max ? toNumber(head.max) : Math.max(top, mark?.at ?? 0),
    unit: head.unit ?? "",
    format: head.format === "clock" ? "clock" : "number",
    mark,
  };
}

function parseTune(lines: Line[]): TuneSpec {
  const { head, body } = headers(lines, ["from", "to", "label", "done"]);
  const levers = body.map((l) => {
    const t = l.text.replace(/^lever\s+/, "");
    const b = bits(t);
    return { label: b.label, icon: b.icon, tone: b.tone, note: b.note };
  });
  if (!head.from || !head.to) throw new DiagramError("tune needs from: and to:");
  return { type: "tune", from: head.from, to: head.to, label: unquote(head.label), levers, done: unquote(head.done) };
}

function parseDots(lines: Line[]): DotsSpec {
  const { head } = headers(lines, ["count", "highlight", "label", "pick", "cols"]);
  return {
    type: "dots",
    count: Number(head.count) || 100,
    highlight: Number(head.highlight) || 1,
    label: unquote(head.label),
    pick: unquote(head.pick),
    cols: Number(head.cols) || 40,
  };
}

export const BRICK_COLOURS = ["white", "black", "red", "blue", "yellow", "green", "grey", "lightgrey", "trans", "orange", "tan", "brown", "pink"];

/** A run of cells split the way a builder would: long bricks, with the seams
 * of every other layer shifted so they never line up. */
function split(len: number, odd: boolean): number[] {
  const out: number[] = [];
  let rem = len;
  if (odd && len >= 3) {
    out.push(2);
    rem -= 2;
  }
  while (rem > 0) {
    const p = rem >= 4 ? (rem === 5 ? 3 : 4) : rem;
    out.push(p);
    rem -= p;
  }
  return out;
}

function parseBricks(lines: Line[]): BricksSpec {
  const { head, body } = headers(lines, ["mass", "layers"]);
  const palette: Record<string, string> = {};
  const rows: string[] = [];
  const says: string[] = [];
  for (const l of body) {
    const pal = l.text.match(/^(\S)\s*=\s*(\w+)$/);
    if (pal) {
      if (!BRICK_COLOURS.includes(pal[2])) throw new DiagramError(`line ${l.n}: unknown brick colour "${pal[2]}"`);
      palette[pal[1]] = pal[2];
    } else if (l.text.startsWith("row:")) rows.push(l.text.slice(4).trim());
    else if (l.text.startsWith("say:")) says.push(unquote(l.text.slice(4).trim()) ?? "");
    else throw new DiagramError(`line ${l.n}: can't read "${l.text}"`);
  }
  if (!rows.length) throw new DiagramError("bricks needs at least one row:");
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const cells: BricksSpec["cells"] = [];
  const bricks: Brick[] = [];
  // rows are written top first, like a picture; y counts up from the ground
  rows.forEach((row, i) => {
    const y = height - 1 - i;
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      const colour = palette[ch];
      if (!colour) throw new DiagramError(`row ${i + 1}: no colour for "${ch}" (add a line like ${ch} = red)`);
      let end = x;
      while (end < row.length && row[end] === ch) end++;
      for (let c = x; c < end; c++) cells.push({ x: c, y, colour });
      let at = x;
      for (const w of split(end - x, y % 2 === 1)) {
        bricks.push({ x: at, y, w, colour });
        at += w;
      }
      x = end;
    }
  });
  return { type: "bricks", width, height, cells, bricks, says, mass: head.mass ? toNumber(head.mass) : undefined, plates: head.layers === "plates" };
}

export function parse(src: string): DiagramSpec {
  const all = src
    .split("\n")
    .map((text, i) => ({ text: text.trim(), n: i + 1 }))
    .filter((l) => l.text && !l.text.startsWith("#"));
  if (!all.length) throw new DiagramError("empty diagram");
  const [first, ...lines] = all;
  switch (first.text) {
    case "flow":
      return parseFlow(lines);
    case "cycle":
      return parseCycle(lines);
    case "chat":
      return parseChat(lines);
    case "timeline":
      return parseTimeline(lines);
    case "clock":
      return parseClock(lines);
    case "bars":
      return parseBars(lines);
    case "tune":
      return parseTune(lines);
    case "dots":
      return parseDots(lines);
    case "bricks":
      return parseBricks(lines);
    default:
      throw new DiagramError(`unknown diagram type "${first.text}"`);
  }
}
