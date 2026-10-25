"use client";

/**
 * An image in the code is one character. Dr. Rocket stores a pasted image as
 * a single character from Supplementary Private Use Area-A (U+F0000 on) and
 * keeps a table from that character to the PNG. The editor draws it as one
 * space, widened by letter spacing to the thumbnail's width, and paints the
 * thumbnail over it. Carets, selections and undo then work on it unchanged.
 * Pasting into a file where the character already means another image
 * renumbers it.
 */

import { useRef } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";
import "./ImageChar.css";

const THUMB_W = 34; // px, the thumbnail
const CHAR_W = 9; // px, one character at 15px
const SLOT = THUMB_W + 4; // the widened space
const BEFORE = "(define ship ";
const AFTER = ")";
const IMG_AT = BEFORE.length; // offset 13

function Rocket() {
  return (
    <svg className="drf-img-pic drf-img-rocket" viewBox="0 0 34 22" aria-hidden>
      <rect className="drf-img-sky" width="34" height="22" rx="3" />
      <circle className="drf-img-dot" cx="6" cy="5" r="0.9" />
      <circle className="drf-img-dot" cx="27" cy="17" r="0.9" />
      <circle className="drf-img-dot" cx="29" cy="4" r="0.7" />
      <g transform="rotate(45 17 11)">
        <path className="drf-img-hull" d="M17 2.5c3 2.4 4 5.4 4 8.6v4.4h-8v-4.4c0-3.2 1-6.2 4-8.6z" />
        <circle className="drf-img-port" cx="17" cy="9" r="1.6" />
        <path className="drf-img-fin" d="M13 12.5l-2.6 3.3h2.6zM21 12.5l2.6 3.3H21z" />
        <path className="drf-img-flame" d="M15 15.5h4l-0.8 3h-2.4z" />
      </g>
    </svg>
  );
}

function Star() {
  return (
    <svg className="drf-img-pic drf-img-star" viewBox="0 0 34 22" aria-hidden>
      <rect className="drf-img-sky" width="34" height="22" rx="3" />
      <path className="drf-img-points" d="M17 3.2l2.3 4.8 5.2.6-3.9 3.6 1.1 5.2L17 14.8l-4.7 2.6 1.1-5.2-3.9-3.6 5.2-.6z" />
    </svg>
  );
}

// Steps
const SAY = [
  "A pasted image sits in the code like any other value.",
  "In the buffer it is one character, U+F0000, from a Private Use Area. A table maps it to the PNG.",
  "It is drawn as one space, widened by letter spacing, with the thumbnail painted on top.",
  "So the right arrow steps over it in one press: offset 13 to 14.",
  "Selecting it selects one character.",
  "Deleting it deletes one character. The table keeps the image.",
  "Undo puts the character back, and the image with it. No special case.",
  "Paste into a file where U+F0000 is already a star: the rocket becomes U+F0001.",
];

export function ImageChar() {
  const wrap = useRef<HTMLDivElement>(null);
  const seq = useSequence(wrap, SAY.length, { delay: [600, 1700, 2100, 2100, 1500, 1500, 1700, 1900], loop: true, hold: 3800 });
  const started = seq.step >= 0;
  const s = Math.max(0, seq.step);

  const gone = started && s === 5;
  const selected = started && s === 4;
  // caret offset per step: before the image, past it, past it, where it was, past it again
  const caret = started && s >= 2 && s <= 6 ? [13, 14, 14, 13, 14][s - 2] : null;
  const caretLeft = (k: number) => (k <= IMG_AT || gone ? `${k}ch` : `calc(${k - 1}ch + ${SLOT}px)`);
  const cellLeft = (k: number) => (k <= IMG_AT || gone ? `calc(${k} * var(--cell))` : `calc(${k - 1} * var(--cell) + var(--icell))`);
  const cells = [...BEFORE, "img", ...AFTER];

  return (
    <div ref={wrap} className="drf-img" data-tone="blue" data-step={started ? s : -1}>
      <Controls seq={seq} label={started ? `Step ${s + 1} of ${SAY.length}` : undefined} />

      <div className="drf-img-top">
        {/* the editor and the buffer under it */}
        <section className="drf-img-card" aria-label="rocket.rkt">
          <header className="drf-img-tab drf-mono">rocket.rkt</header>

          <div className="drf-img-editor">
            <div className="drf-img-line drf-mono">
              <span className="drf-img-p">(</span>
              <span className="drf-img-kw">define</span> ship{" "}
              <span className="drf-img-slot" data-gone={gone ? "" : undefined} data-sel={selected ? "" : undefined}>
                <span className="drf-img-space" data-show={started && s === 2 ? "" : undefined}>
                  {" "}
                </span>
                <span className="drf-img-thumb">
                  <Rocket />
                </span>
                <span className="drf-img-dim" data-on={started && s === 2 ? "" : undefined}>
                  <span className="drf-img-dim-bar" />
                  <span className="drf-img-dim-label">
                    <span>{CHAR_W} px space</span> <span>+ {SLOT - CHAR_W} px spacing</span>{" "}
                    <span>
                      = {THUMB_W} + 4 = {SLOT} px
                    </span>
                  </span>
                </span>
              </span>
              <span className="drf-img-p">)</span>
              <span className="drf-img-caret" data-on={caret !== null ? "" : undefined} style={{ left: caretLeft(caret ?? IMG_AT) }} />
            </div>
          </div>

          <div className="drf-img-buf" data-on={started && s >= 1 ? "" : undefined} aria-label="The buffer, one character per cell">
            <span className="drf-img-buf-label drf-mono">buffer</span>
            <div className="drf-img-cells drf-mono">
              {cells.map((c, k) => {
                const img = c === "img";
                return (
                  <span
                    key={k}
                    className="drf-img-cell"
                    data-img={img ? "" : undefined}
                    data-gone={img && gone ? "" : undefined}
                    data-sel={img && selected ? "" : undefined}
                  >
                    <span className="drf-img-ch">{img ? <Rocket /> : c === " " ? "␣" : c}</span>
                    <span className="drf-img-off">{img && gone ? "" : k > IMG_AT && gone ? k - 1 : k}</span>
                    {img && <span className="drf-img-code">U+F0000</span>}
                  </span>
                );
              })}
              <span className="drf-img-bcaret" data-on={caret !== null ? "" : undefined} style={{ left: cellLeft(caret ?? IMG_AT) }} />
            </div>
          </div>
        </section>

        {/* the table from character to image */}
        <section className="drf-img-store" data-on={started && s >= 1 ? "" : undefined} aria-label="Image table">
          <header className="drf-img-store-head">
            Image table
            <span className="drf-mono">char → PNG</span>
          </header>
          <div className="drf-img-row drf-mono" data-kept={gone ? "" : undefined}>
            <span>U+F0000</span>
            <span className="drf-img-arrow">→</span>
            <span className="drf-img-mini">
              <Rocket />
            </span>
            <span className="drf-img-size">34×22</span>
          </div>
        </section>
      </div>

      {/* pasting into another file */}
      <div className="drf-img-paste" data-on={started && s >= 7 ? "" : undefined}>
        <section className="drf-img-card drf-img-other" aria-label="other.rkt">
          <header className="drf-img-tab drf-mono">other.rkt</header>
          <div className="drf-img-editor">
            <div className="drf-img-line drf-mono">
              <span className="drf-img-p">(</span>
              <span className="drf-img-kw">define</span> star{" "}
              <span className="drf-img-slot">
                <span className="drf-img-space"> </span>
                <span className="drf-img-thumb">
                  <Star />
                </span>
              </span>
              <span className="drf-img-p">)</span>
            </div>
            <div className="drf-img-line drf-mono drf-img-pasted">
              <span className="drf-img-p">(</span>
              <span className="drf-img-kw">define</span> ship{" "}
              <span className="drf-img-slot">
                <span className="drf-img-space"> </span>
                <span className="drf-img-thumb">
                  <Rocket />
                </span>
              </span>
              <span className="drf-img-p">)</span>
              <span className="drf-img-renum drf-mono">
                <s>U+F0000</s> → U+F0001
              </span>
            </div>
          </div>
        </section>
        <section className="drf-img-store drf-img-store-other" aria-label="Image table of other.rkt">
          <header className="drf-img-store-head">
            Its table
            <span className="drf-mono">char → PNG</span>
          </header>
          <div className="drf-img-row drf-mono">
            <span>U+F0000</span>
            <span className="drf-img-arrow">→</span>
            <span className="drf-img-mini">
              <Star />
            </span>
            <span className="drf-img-size">taken</span>
          </div>
          <div className="drf-img-row drf-mono drf-img-row-new">
            <span>U+F0001</span>
            <span className="drf-img-arrow">→</span>
            <span className="drf-img-mini">
              <Rocket />
            </span>
            <span className="drf-img-size">next free</span>
          </div>
        </section>
      </div>

      <div className="drf-img-say" aria-live="polite">
        {started ? SAY[s] : <>&nbsp;</>}
      </div>
    </div>
  );
}
