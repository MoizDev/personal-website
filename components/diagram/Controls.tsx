"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import type { Sequence } from "./usePlayback";

/** The small button in a figure's corner: pause, play, or play again. */
export function Controls({ seq, label }: { seq: Sequence; label?: string }) {
  if (seq.reduced) return null;
  const again = seq.finished && !seq.paused;
  return (
    <div className="dg-controls">
      {label && <span className="dg-controls-label">{label}</span>}
      <button
        type="button"
        className="dg-btn"
        onClick={again ? seq.replay : seq.toggle}
        aria-label={again ? "Play again" : seq.paused ? "Play" : "Pause"}
      >
        {again ? <RotateCcw size={13} /> : seq.paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </div>
  );
}
