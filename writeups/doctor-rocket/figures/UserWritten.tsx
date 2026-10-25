"use client";

/**
 * user-written? (runner.rkt): the debugger lists a variable only if the text
 * at its source position spells its name. Teaching languages introduce their
 * own identifiers (repl?, test1651) and lend them the location of the form
 * behind them, so the text there gives them away.
 */

import { Flowchart, type FEdge, type FNode, type FWalk } from "./Flowchart";

const nodes: FNode[] = [
  { id: "id", at: [1, 2], kind: "start", label: "An identifier in the program" },
  { id: "pos", at: [2, 2], kind: "ask", label: "Located in your text?" },
  { id: "read", at: [3, 2], label: "Read the text there", sub: "position, span" },
  { id: "hide", at: [3, 1], kind: "store", label: "Hidden", sub: "the language made it" },
  { id: "spell", at: [4, 2], kind: "ask", label: "Does it spell the name?" },
  { id: "show", at: [5, 2], kind: "end", label: "Shown in the debugger" },
];

const edges: FEdge[] = [
  { from: "id", to: "pos" },
  { from: "pos", to: "read", label: "Yes" },
  { from: "pos", to: "hide", label: "No", out: "l", in: "t" },
  { from: "read", to: "spell" },
  { from: "spell", to: "show", label: "Yes" },
  { from: "spell", to: "hide", label: "No", out: "l", in: "b" },
];

const walks: FWalk[] = [
  { name: "acc", path: ["id", "pos", "read", "spell", "show"], note: "the text at acc's position reads acc" },
  { name: "test1651", path: ["id", "pos", "read", "spell", "hide"], note: "it borrows its check-expect's position: the text there reads (check-expect …" },
  { name: "(no location)", path: ["id", "pos", "hide"], note: "code the language adds has no place in your text at all" },
];

export function UserWritten() {
  return <Flowchart nodes={nodes} edges={edges} walks={walks} cols={3} />;
}
