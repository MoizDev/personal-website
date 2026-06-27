"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Spotlight } from "./Spotlight";

// Dynamic-island music player. Collapsed = a mini now-playing strip (album art
// + animated equalizer). Hover/focus expands it into a full player whose corner
// buttons are Search and theme toggle (in place of the usual star / airplay).
const RC = 10; // concave top-corner radius
const COLLAPSED = { w: 216, h: 36 };
const EXPANDED = { w: 400, h: 190 };

const ALBUM = "/tuscan_leather.png";
const TRACK = { title: "tuscan leather", artist: "drake" };

function Equalizer({
  color,
  playing,
  size = 16,
}: {
  color: string;
  playing: boolean;
  size?: number;
}) {
  const delays = [0, 0.18, 0.36, 0.12, 0.28];
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: size }}>
      {delays.map((d, i) => (
        <span
          key={i}
          className="eq-bar w-[2.5px] rounded-full"
          style={{
            height: "100%",
            background: color,
            animationDelay: `${d}s`,
            animationPlayState: playing ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

export function Notch() {
  const { theme, toggle } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // let any component open search via an "open-search" event
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener("open-search", open);
    return () => window.removeEventListener("open-search", open);
  }, []);

  const dims = expanded ? EXPANDED : COLLAPSED;

  // arrow-key navigation between the player's buttons
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const btns = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        "button[data-island-item]"
      ) ?? []
    );
    const idx = btns.findIndex((b) => b === document.activeElement);
    const next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
    btns[(next + btns.length) % btns.length]?.focus();
  };

  const corner =
    "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
  const control =
    "text-white/90 transition hover:text-white focus:outline-none focus-visible:text-white";

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-0 z-[10000] -translate-x-1/2">
        <div
          ref={rootRef}
          className="pointer-events-auto relative bg-black text-white transition-all duration-300 ease-out"
          style={{
            width: dims.w,
            height: dims.h,
            borderBottomLeftRadius: expanded ? 26 : 18,
            borderBottomRightRadius: expanded ? 26 : 18,
          }}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onFocusCapture={() => setExpanded(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node))
              setExpanded(false);
          }}
          onKeyDown={onKeyDown}
        >
          {/* concave fillets where the island meets the screen edge */}
          <span
            className="absolute top-0 z-10"
            style={{
              left: -RC,
              width: RC + 1,
              height: RC,
              background: `radial-gradient(circle at bottom left, transparent ${RC}px, #000 ${RC}px)`,
            }}
          />
          <span
            className="absolute top-0 z-10"
            style={{
              right: -RC,
              width: RC + 1,
              height: RC,
              background: `radial-gradient(circle at bottom right, transparent ${RC}px, #000 ${RC}px)`,
            }}
          />

          {/* collapsed: mini now-playing strip */}
          <div
            className={`absolute inset-0 flex items-center justify-between px-3 transition-opacity duration-200 ${
              expanded ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ALBUM}
              alt=""
              className="h-5 w-5 rounded-[5px] object-cover"
            />
            <Equalizer color="#ff7a1a" playing={playing} size={11} />
          </div>

          {/* expanded: full player */}
          <div
            className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-200 ${
              expanded ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* top row: art + title/artist + equalizer */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ALBUM}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {TRACK.title}
                </div>
                <div className="truncate text-xs text-white/50">
                  {TRACK.artist}
                </div>
              </div>
              <Equalizer color="#ff7a1a" playing={playing} size={16} />
            </div>

            {/* progress */}
            <div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white/85"
                  style={{ width: "62%" }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/45">
                <span>2:08</span>
                <span>-0:47</span>
              </div>
            </div>

            {/* controls: search (left) · transport (center) · theme (right) */}
            <div className="flex items-center justify-between">
              <button
                data-island-item
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className={corner}
              >
                <Search size={16} />
              </button>

              <div className="flex items-center gap-5">
                <button
                  disabled
                  aria-label="Previous"
                  className="cursor-not-allowed text-white/20"
                >
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button
                  data-island-item
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pause" : "Play"}
                  className={control}
                >
                  {playing ? (
                    <Pause size={22} fill="currentColor" />
                  ) : (
                    <Play size={22} fill="currentColor" />
                  )}
                </button>
                <button
                  disabled
                  aria-label="Next"
                  className="cursor-not-allowed text-white/20"
                >
                  <SkipForward size={18} fill="currentColor" />
                </button>
              </div>

              <button
                data-island-item
                onClick={toggle}
                aria-label={
                  theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
                }
                className={corner}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Spotlight open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
