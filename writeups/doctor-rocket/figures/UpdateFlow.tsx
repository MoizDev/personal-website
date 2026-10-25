"use client";

/**
 * Updates (src/update.rs): a newer version must carry an Ed25519 signature
 * over a message that names the version, the platform, the archive's SHA-256
 * and its URL. The archive is checked against that hash, checked again on
 * quit, and swapped in by renaming the old app aside, which is renamed back
 * if anything fails.
 */

import { Flowchart, type FEdge, type FNode, type FWalk } from "./Flowchart";

const msg = (
  <>
    drrocket-update-v1
    <br />
    1.0.0-beta.5
    <br />
    mac
    <br />
    9f2c…e41a
    <br />
    https://…
  </>
);

const nodes: FNode[] = [
  { id: "feed", at: [1, 2], kind: "start", label: "A newer version", sub: "version.json" },
  { id: "msg", at: [2, 1], kind: "store", label: "The signed message", sub: msg },
  { id: "sig", at: [2, 2], kind: "ask", label: "Signed by the release key?" },
  { id: "link", at: [2, 3], kind: "fail", label: "Only link to the download" },
  { id: "self", at: [3, 2], kind: "ask", label: "Can it replace itself?" },
  { id: "get", at: [4, 2], label: "Download, check the hash", sub: "SHA-256 from the message" },
  { id: "quit", at: [5, 2], label: "On quit: check again, unpack", sub: "signature and hash" },
  { id: "aside", at: [6, 2], kind: "store", label: "Move the old app aside", sub: ".Dr. Rocket.app.old-4821" },
  { id: "placed", at: [7, 2], kind: "ask", label: "New app in place?" },
  { id: "back", at: [7, 1], label: "Rename the old one back", sub: "reported next launch" },
  { id: "go", at: [7, 3], kind: "end", label: "Relaunch" },
];

const edges: FEdge[] = [
  { from: "feed", to: "sig" },
  { from: "msg", to: "sig", out: "r", in: "l" },
  { from: "sig", to: "link", label: "No", out: "r", in: "l" },
  { from: "sig", to: "self", label: "Yes" },
  { from: "self", to: "link", label: "No", out: "r", in: "b" },
  { from: "self", to: "get", label: "Yes" },
  { from: "get", to: "quit" },
  { from: "quit", to: "aside" },
  { from: "aside", to: "placed" },
  { from: "placed", to: "go", label: "Yes", out: "r", in: "l" },
  { from: "placed", to: "back", label: "No", out: "l", in: "r" },
];

const walks: FWalk[] = [
  { name: "A good update", path: ["feed", "sig", "self", "get", "quit", "aside", "placed", "go"], note: "verified twice, swapped in on quit, relaunched", also: [["msg", "sig"]] },
  { name: "A changed URL", path: ["feed", "sig", "link"], note: "the URL is in the signed message, so changing it breaks the signature", also: [["msg", "sig"]] },
  { name: "Run from the disk image", path: ["feed", "sig", "self", "link"], note: "under /Volumes or translocated: drag it into Applications first", also: [["msg", "sig"]] },
  { name: "A failed swap", path: ["feed", "sig", "self", "get", "quit", "aside", "placed", "back"], note: "the old app goes back where it was", also: [["msg", "sig"]] },
];

export function UpdateFlow() {
  return <Flowchart nodes={nodes} edges={edges} walks={walks} cols={3} />;
}
