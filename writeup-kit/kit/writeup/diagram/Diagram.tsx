/**
 * <Diagram src={`flow ...`} title="..." caption="..." />
 *
 * Parses the diagram on the server (a typo fails the build, not the reader)
 * and hands the result to the matching animated renderer, inside a numbered
 * figure. The language is described in parse.ts and the kit's README.md.
 */

import type { ReactNode } from "react";
import { Figure } from "../page/parts";
import { Bars } from "./Bars";
import { Chat } from "./Chat";
import { Clock } from "./Clock";
import { Cycle } from "./Cycle";
import { Dots } from "./Dots";
import { Flow } from "./Flow";
import { parse } from "./parse";
import { Timeline } from "./Timeline";
import { Tune } from "./Tune";

export function Diagram({
  src,
  title,
  caption,
  wide,
  bare,
  panes,
}: {
  src: string;
  title?: string;
  caption?: ReactNode;
  wide?: boolean;
  /** no frame around it; chats are frameless unless this is false */
  bare?: boolean;
  /** for flows: extra detail shown under the figure when the walk reaches a card */
  panes?: Record<string, ReactNode>;
}) {
  const spec = parse(src);
  let body: ReactNode;
  switch (spec.type) {
    case "flow":
      body = <Flow spec={spec} panes={panes} />;
      break;
    case "cycle":
      body = <Cycle spec={spec} />;
      break;
    case "chat":
      body = <Chat spec={spec} />;
      break;
    case "timeline":
      body = <Timeline spec={spec} />;
      break;
    case "clock":
      body = <Clock spec={spec} />;
      break;
    case "bars":
      body = <Bars spec={spec} />;
      break;
    case "tune":
      body = <Tune spec={spec} />;
      break;
    case "dots":
      body = <Dots spec={spec} />;
      break;
  }
  return (
    <Figure title={title} caption={caption} wide={wide} bare={bare ?? spec.type === "chat"} tools>
      <div className={`dg dg-${spec.type}-fig`}>{body}</div>
    </Figure>
  );
}
