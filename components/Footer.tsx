"use client";

/**
 * The page's end: a row of flowers standing on a blue panel that fades into
 * the page, with the name set huge and cut off at the bottom.
 * The flowers grow up when the footer scrolls into view.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./Footer.css";

/* ---------- flowers ---------- */

type Stem = {
  /** where the stem leaves the ground, and where its head sits (viewBox units; the ground is y = 90) */
  x0: number;
  x1: number;
  y: number;
  head: "daisy" | "tulip";
  /** head size */
  s: number;
  /** leaves: how far up the stem (0-1), and which side (-1 left, 1 right) */
  leaves: [number, number][];
};

const GROUND = 90;

const CLUSTERS: Stem[][] = [
  [
    {
      x0: 22,
      x1: 19,
      y: 22,
      head: "daisy",
      s: 9,
      leaves: [
        [0.55, -1],
        [0.3, 1],
      ],
    },
    { x0: 32, x1: 39, y: 42, head: "daisy", s: 7, leaves: [[0.4, 1]] },
  ],
  [
    { x0: 24, x1: 21, y: 30, head: "tulip", s: 7, leaves: [[0.5, -1]] },
    {
      x0: 34,
      x1: 41,
      y: 46,
      head: "daisy",
      s: 6,
      leaves: [
        [0.4, 1],
        [0.2, -1],
      ],
    },
  ],
  [
    {
      x0: 30,
      x1: 32,
      y: 12,
      head: "daisy",
      s: 9,
      leaves: [
        [0.62, -1],
        [0.46, 1],
        [0.28, -1],
        [0.14, 1],
      ],
    },
  ],
  [
    { x0: 20, x1: 17, y: 50, head: "daisy", s: 6, leaves: [[0.3, -1]] },
    { x0: 30, x1: 30, y: 38, head: "daisy", s: 7, leaves: [[0.3, 1]] },
    { x0: 40, x1: 43, y: 52, head: "daisy", s: 6, leaves: [] },
  ],
  [
    {
      x0: 30,
      x1: 30,
      y: 30,
      head: "tulip",
      s: 8,
      leaves: [
        [0.42, -1],
        [0.24, 1],
      ],
    },
  ],
  [
    { x0: 22, x1: 21, y: 36, head: "daisy", s: 7, leaves: [[0.3, -1]] },
    {
      x0: 30,
      x1: 43,
      y: 30,
      head: "tulip",
      s: 7,
      leaves: [
        [0.36, 1],
        [0.16, -1],
      ],
    },
  ],
  [
    {
      x0: 30,
      x1: 30,
      y: 28,
      head: "daisy",
      s: 7,
      leaves: [
        [0.46, -1],
        [0.26, 1],
      ],
    },
  ],
];

function Daisy({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      {Array.from({ length: 6 }, (_, k) => {
        const a = (k * Math.PI) / 3;
        return (
          <circle
            key={k}
            cx={x + Math.cos(a) * s * 0.62}
            cy={y + Math.sin(a) * s * 0.62}
            r={s * 0.5}
          />
        );
      })}
      {/* the eye shows the page through it */}
      <circle className="flower-eye" cx={x} cy={y} r={s * 0.3} />
    </g>
  );
}

function Tulip({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s / 7})`}
      d="M-6 -9 L-3 -4 L0 -10 L3 -4 L6 -9 Q7.5 3 0 5 Q-7.5 3 -6 -9 Z"
    />
  );
}

function Flower({ stem: f }: { stem: Stem }) {
  return (
    <g>
      <path
        className="flower-stem"
        d={`M${f.x0} ${GROUND} Q${f.x0} ${(GROUND + f.y) / 2} ${f.x1} ${f.y}`}
      />
      {f.leaves.map(([t, side], i) => {
        const x = f.x0 + (f.x1 - f.x0) * t * t;
        const y = GROUND - (GROUND - f.y) * t;
        return (
          <path
            key={i}
            transform={`translate(${x} ${y}) scale(${side} 1) rotate(-24)`}
            d="M0 0 Q5 -5.5 11 -2 Q5.5 3.5 0 0 Z"
          />
        );
      })}
      {f.head === "daisy" ? (
        <Daisy x={f.x1} y={f.y} s={f.s} />
      ) : (
        <Tulip x={f.x1} y={f.y} s={f.s} />
      )}
    </g>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  // grow the flowers the first time the footer comes into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="footer" ref={ref} data-shown={shown}>
      <div className="footer-top">
        <div className="footer-flowers" aria-hidden>
          {CLUSTERS.map((c, i) => (
            <svg
              key={i}
              className="flower"
              viewBox={`0 0 60 ${GROUND}`}
              style={{ "--i": i } as CSSProperties}
            >
              {c.map((f, k) => (
                <Flower key={k} stem={f} />
              ))}
            </svg>
          ))}
        </div>
      </div>

      <div className="footer-panel">
        <p className="footer-name" aria-hidden>
          Moiz Hashmi
        </p>
      </div>
    </footer>
  );
}
