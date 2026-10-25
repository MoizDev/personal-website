"use client";

/**
 * The memory limit (runner.rkt, start-memory-monitor! and pause-for-memory!):
 * a watcher thread checks every 25 ms, collects garbage before it believes a
 * reading, then suspends exactly the program's running threads until the user
 * raises the limit. DrRacket's limit ends the run instead.
 */

import { Flowchart, type FEdge, type FNode, type FWalk } from "./Flowchart";

const nodes: FNode[] = [
  { id: "run", at: [1, 2], kind: "start", label: "The program runs" },
  { id: "over", at: [2, 2], kind: "ask", label: "Over the limit?", sub: "every 25 ms" },
  { id: "gc", at: [3, 2], label: "Collect garbage", sub: "(collect-garbage)" },
  { id: "still", at: [4, 2], kind: "ask", label: "Still over?" },
  { id: "kill", at: [4, 1], kind: "fail", label: "DrRacket stops it", sub: "its state is gone" },
  { id: "pause", at: [5, 2], kind: "store", label: "Suspend its threads", sub: "and remember which" },
  { id: "ask", at: [6, 2], kind: "ask", label: "Raise the limit?", sub: "the IDE asks you" },
  { id: "stop", at: [6, 3], label: "Stop the program" },
  { id: "resume", at: [7, 2], kind: "end", label: "Resume those threads" },
];

const edges: FEdge[] = [
  { from: "run", to: "over" },
  { from: "over", to: "run", label: "No", dashed: true, out: "l", in: "l", swing: 30 },
  { from: "over", to: "gc", label: "Yes" },
  { from: "gc", to: "still" },
  { from: "still", to: "run", label: "No", dashed: true, out: "r", in: "r", outer: true },
  { from: "still", to: "kill", out: "l", in: "r" },
  { from: "still", to: "pause", label: "Yes" },
  { from: "pause", to: "ask" },
  { from: "ask", to: "resume", label: "Yes" },
  { from: "ask", to: "stop", label: "No", out: "r", in: "l" },
];

const walks: FWalk[] = [
  { name: "Under the limit", path: ["run", "over", "run"], note: "41 MB of 64: look again in 25 ms" },
  { name: "Mostly garbage", path: ["run", "over", "gc", "still", "run"], note: "70 MB, but most of it garbage: after a collection it's under" },
  { name: "Over the limit", path: ["run", "over", "gc", "still", "pause", "ask", "resume"], note: "paused at 100 MB of 64; raised to 512, it carries on and prints 100" },
  { name: "In DrRacket", path: ["run", "over", "gc", "still", "kill"], note: "DrRacket's limit shuts the program's custodian down" },
];

export function MemoryFlow() {
  return <Flowchart nodes={nodes} edges={edges} walks={walks} cols={3} />;
}
