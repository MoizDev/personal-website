"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import type { Sequence } from "./usePlayback";

/**
 * Pause, play, or play again, with an optional badge ("Round 1"). They sit in
 * a row above the figure's frame, on the right, out of the drawing; outside a
 * Figure they fall back to the diagram's top corner.
 */
export function Controls({ seq, label }: { seq: Sequence; label?: string }) {
  // undefined until mounted: then the figure's tools row, or null when there is none
  const [slot, setSlot] = useState<HTMLElement | null | undefined>(undefined);
  const anchor = useCallback((el: HTMLSpanElement | null) => {
    if (el) setSlot(el.closest("figure")?.querySelector<HTMLElement>(".wu-fig-tools") ?? null);
  }, []);

  const again = seq.finished && !seq.paused;
  const ui = seq.reduced ? null : (
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

  return (
    <>
      <span ref={anchor} hidden />
      {slot ? createPortal(ui, slot) : slot === null ? ui : null}
    </>
  );
}
