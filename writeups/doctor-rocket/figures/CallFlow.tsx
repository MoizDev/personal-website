"use client";

import { Flowchart, type FEdge, type FNode, type FWalk } from "./Flowchart";

const nodes: FNode[] = [
  { id: "run", at: [1, 2], kind: "start", label: "(f a b) runs" },
  { id: "eval", at: [2, 2], label: "Evaluate f, a, b", sub: "into temporaries" },
  { id: "site", at: [3, 2], kind: "store", label: "viz-site!", sub: "position · span · tail?" },
  { id: "prim", at: [4, 2], kind: "ask", label: "Is f a primitive?" },
  { id: "compute", at: [4, 3], label: "viz-compute", sub: "args → result" },
  { id: "value", at: [5, 3], kind: "end", label: "A result step" },
  { id: "call", at: [5, 2], label: "Call f itself", sub: "nothing wrapped around it" },
  { id: "tail", at: [6, 2], kind: "ask", label: "In tail position?" },
  { id: "replace", at: [6, 1], label: "Caller is replaced", sub: "no return step" },
  { id: "wait", at: [6, 3], label: "Caller waits", sub: "(* n ▢)" },
  { id: "frame", at: [7, 2], kind: "end", label: "viz-call pushes a frame" },
];

const edges: FEdge[] = [
  { from: "run", to: "eval" },
  { from: "eval", to: "site" },
  { from: "site", to: "prim" },
  { from: "prim", to: "compute", label: "Yes", out: "r", in: "l" },
  { from: "compute", to: "value" },
  { from: "prim", to: "call", label: "No" },
  { from: "call", to: "tail" },
  { from: "tail", to: "replace", label: "Yes", out: "l", in: "r" },
  { from: "tail", to: "wait", label: "No", out: "r", in: "l" },
  { from: "replace", to: "frame", out: "b", in: "l" },
  { from: "wait", to: "frame", out: "b", in: "r" },
  { from: "frame", to: "run", dashed: true, out: "l", in: "l", outer: true, label: "its body" },
];

const walks: FWalk[] = [
  { name: "(- n 1)", path: ["run", "eval", "site", "prim", "compute", "value"], note: "(- n 1) is a primitive: recorded as 5 − 1 = 4" },
  { name: "(fact (- n 1))", path: ["run", "eval", "site", "prim", "call", "tail", "wait", "frame"], note: "inside (* n …): the caller waits for the answer" },
  { name: "(go (- n 1) (* n acc))", path: ["run", "eval", "site", "prim", "call", "tail", "replace", "frame"], note: "a tail call: the new frame takes the caller's place" },
];

export function CallFlow() {
  return <Flowchart nodes={nodes} edges={edges} walks={walks} cols={3} />;
}
