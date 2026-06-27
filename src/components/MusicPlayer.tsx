"use client";

import { useState } from "react";
import { Prev, Next } from "./Icons";

export function MusicPlayer() {
  const [playing, setPlaying] = useState(true);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous track"
          className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
        >
          <Prev width={14} height={14} />
        </button>

        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full ring-2 ring-[var(--accent)]"
        >
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--accent)] to-[#f0a35a] text-2xl font-bold text-white">
            ♪
          </div>
        </button>

        <button
          aria-label="Next track"
          className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
        >
          <Next width={14} height={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="flex h-3 items-end gap-[2px]">
          {[0, 0.15, 0.3, 0.1].map((d, i) => (
            <span
              key={i}
              className="eq-bar w-[2px] rounded-full bg-[var(--accent)]"
              style={{
                height: "100%",
                animationDelay: `${d}s`,
                animationPlayState: playing ? "running" : "paused",
              }}
            />
          ))}
        </span>
        <span className="max-w-[110px] truncate">Late Night Drives</span>
      </div>
    </div>
  );
}
