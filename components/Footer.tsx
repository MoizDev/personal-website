"use client";

/**
 * The page's end: a row of flowers standing on a blue panel that fades into
 * the page, the links, and the name set huge and cut off at the bottom.
 * The flowers grow up when the footer scrolls into view.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import "./Footer.css";
import { EMAIL, LINKS } from "@/lib/links";

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

/* ---------- icons ---------- */

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className="footer-icon" viewBox="0 0 16 16" aria-hidden>
    {children}
  </svg>
);

const GITHUB =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x" */
const short = (href: string) => {
  const u = new URL(href);
  return (u.host.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
};

const toTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

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
        <nav className="footer-links" aria-label="Elsewhere">
          <a href={LINKS.linkedin.href}>
            <Icon>
              <rect
                x="0.5"
                y="0.5"
                width="15"
                height="15"
                rx="2.5"
                fill="currentColor"
              />
              <g className="footer-icon-cut">
                <rect x="3.3" y="6.2" width="2" height="6.5" />
                <circle cx="4.3" cy="4.3" r="1.15" />
                <path d="M7 6.2h1.9v.9c.3-.6 1.1-1.05 2-1.05 1.5 0 2.1.95 2.1 2.5v4.15h-2V9c0-.8-.3-1.3-1-1.3s-1 .55-1 1.3v3.7H7Z" />
              </g>
            </Icon>
            {short(LINKS.linkedin.href)}
          </a>
          <a href={LINKS.github.href}>
            <Icon>
              <path d={GITHUB} fill="currentColor" />
            </Icon>
            {short(LINKS.github.href)}
          </a>
          <a href={LINKS.email.href}>
            <Icon>
              <rect
                x="1"
                y="3"
                width="14"
                height="10"
                rx="1.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M1.8 4.2 8 8.8l6.2-4.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </Icon>
            {EMAIL}
          </a>
          <button type="button" onClick={toTop}>
            <Icon>
              <path
                d="M8 13.5V3M3.5 7.5 8 3l4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Icon>
            Back to top
          </button>
        </nav>

        <p className="footer-name" aria-hidden>
          Moiz Hashmi
        </p>
      </div>
    </footer>
  );
}
