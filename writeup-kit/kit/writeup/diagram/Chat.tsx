"use client";

/**
 * A conversation that types itself out, one line at a time, with a typing
 * indicator between lines. With `call:` it opens as a ringing phone first.
 */

import { useRef } from "react";
import { Icon } from "./icons";
import { Controls } from "./Controls";
import type { ChatSpec } from "./parse";
import { useSequence } from "./usePlayback";

const TONES = ["orange", "blue", "teal", "purple", "green", "yellow"] as const;

/** a steady colour per name, unless the line names one */
function toneFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export function Chat({ spec }: { spec: ChatSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const delays = spec.lines.map((l, i) => {
    const base = l.kind === "aside" ? 900 : Math.min(2400, 650 + l.text.length * 24);
    return i === 0 ? (spec.call ? 2200 : 500) : base;
  });
  const seq = useSequence(ref, spec.lines.length, { delay: delays, loop: false });
  const next = spec.lines[seq.step + 1];
  const typing = !seq.finished && !seq.paused && seq.step >= (spec.call ? 0 : -1) && next?.kind === "say";
  const ringing = !!spec.call && seq.step < 0 && !seq.reduced;

  return (
    <div ref={ref} className="dg-chat-wrap">
      <Controls seq={seq} />
      {spec.call && (
        <div className="dg-call" data-ringing={ringing}>
          <span className="dg-call-icon">
            <Icon name={ringing ? "PhoneIncoming" : "Phone"} size={18} />
          </span>
          <span className="dg-call-text">
            <span className="dg-call-who">{spec.call}</span>
            <span className="dg-call-state">{ringing ? "Incoming call…" : "Connected"}</span>
          </span>
        </div>
      )}
      <ol className="dg-chat">
        {spec.lines.map((l, i) => {
          const shown = i <= seq.step;
          if (l.kind === "aside")
            return (
              <li key={i} className="dg-aside" data-shown={shown}>
                {l.text}
              </li>
            );
          const tone = l.tone ?? toneFor(l.who);
          return (
            <li key={i} className="dg-msg" data-mine={l.mine} data-shown={shown} data-tone={tone}>
              <span className="dg-avatar" aria-hidden>
                {l.icon ? <Icon name={l.icon} size={15} /> : l.who.slice(0, 1)}
              </span>
              <span className="dg-bubble">
                <span className="dg-who">{l.who}</span>
                <span className="dg-said">{l.text}</span>
              </span>
            </li>
          );
        })}
        {typing && next.kind === "say" && (
          <li className="dg-msg dg-typing" data-mine={next.mine} data-shown data-tone={next.tone ?? toneFor(next.who)} aria-hidden>
            <span className="dg-avatar">{next.icon ? <Icon name={next.icon} size={15} /> : next.who.slice(0, 1)}</span>
            <span className="dg-bubble">
              <span className="dg-dots">
                <i />
                <i />
                <i />
              </span>
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}
