"use client";

/**
 * Dev-only sliders for the scene: the camera, the row, the spot and the feel
 * of scrolling. Values apply live as inline CSS variables on <html> (and to
 * MOTION), are kept per breakpoint in localStorage, and the changed ones are
 * listed at the bottom so they can be copied or screenshotted.
 *
 * Shown in development only (see app/page.tsx). Minimize it with the "–"
 * button, or toggle it with the backslash key.
 */

import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { MOTION, MOTION_DEFAULTS, type MotionKey } from "@/lib/motion";
import "./TunePanel.css";

type Field = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** "css" sets a variable on <html>; "motion" sets MOTION[key] */
  to: "css" | "motion";
};

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Camera",
    fields: [
      { key: "--pitch", label: "pitch", min: -40, max: 20, step: 0.5, unit: "deg", to: "css" },
      { key: "--yaw", label: "yaw", min: -90, max: 90, step: 0.5, unit: "deg", to: "css" },
      { key: "--depth-k", label: "perspective", min: 0.5, max: 10, step: 0.05, to: "css" },
      { key: "--po-x", label: "vanishing x", min: -100, max: 200, step: 1, unit: "%", to: "css" },
      { key: "--po-y", label: "vanishing y", min: -100, max: 200, step: 1, unit: "%", to: "css" },
    ],
  },
  {
    title: "Row",
    fields: [
      { key: "--card-w", label: "card size", min: 60, max: 600, step: 1, unit: "px", to: "css" },
      { key: "--gap", label: "gap (card w)", min: 0.05, max: 1.5, step: 0.01, to: "css" },
      { key: "--ox-k", label: "x (card w)", min: -4, max: 4, step: 0.01, to: "css" },
      { key: "--oy-k", label: "y (card w)", min: -4, max: 4, step: 0.01, to: "css" },
    ],
  },
  {
    title: "Spot",
    fields: [
      { key: "--spot-x", label: "x", min: 0, max: 900, step: 1, unit: "px", to: "css" },
      { key: "--spot-y", label: "y", min: 0, max: 900, step: 1, unit: "px", to: "css" },
      { key: "--spot-w", label: "size", min: 80, max: 900, step: 1, unit: "px", to: "css" },
    ],
  },
  {
    title: "Feel",
    fields: [
      { key: "glide", label: "glide", min: 1, max: 14, step: 0.1, to: "motion" },
      { key: "wheel", label: "wheel speed", min: 0.0005, max: 0.008, step: 0.0001, to: "motion" },
      { key: "drag", label: "drag speed", min: 0.002, max: 0.02, step: 0.0005, to: "motion" },
      { key: "pitchPerSpeed", label: "pitch per speed", min: 0, max: 3, step: 0.05, to: "motion" },
      { key: "maxPitch", label: "max pitch", min: 0, max: 20, step: 0.5, to: "motion" },
      { key: "pitchFreq", label: "pitch spring", min: 0.5, max: 14, step: 0.1, to: "motion" },
      { key: "pitchDamping", label: "pitch damping", min: 0.1, max: 1.5, step: 0.01, to: "motion" },
    ],
  },
];

const FIELDS = GROUPS.flatMap((g) => g.fields);

type Values = Record<string, number>;

const breakpoint = () => (matchMedia("(max-width: 640px)").matches ? "phone" : "desktop");
const storeKey = (bp: string) => `tune:${bp}`;
const OPEN_KEY = "tune:open";

function load(key: string): Values {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Values;
  } catch {
    return {};
  }
}

function save(key: string, v: Values | null) {
  try {
    if (v && Object.keys(v).length) localStorage.setItem(key, JSON.stringify(v));
    else localStorage.removeItem(key);
  } catch {
    // storage blocked; the tweaks just won't survive a reload
  }
}

/** The values the stylesheet and MOTION give, with no overrides applied. */
function readDefaults(): Values {
  const root = document.documentElement;
  for (const f of FIELDS) if (f.to === "css") root.style.removeProperty(f.key);
  const css = getComputedStyle(root);
  const out: Values = {};
  for (const f of FIELDS) {
    if (f.to === "motion") out[f.key] = MOTION_DEFAULTS[f.key as MotionKey];
    else if (f.key === "--card-w") out[f.key] = document.querySelector<HTMLElement>(".card")?.offsetWidth ?? 200;
    else if (f.key === "--spot-w") out[f.key] = document.querySelector<HTMLElement>(".spot")?.offsetWidth ?? 300;
    else if (f.key === "--spot-y") out[f.key] = document.querySelector<HTMLElement>(".spot")?.offsetTop ?? 200;
    else out[f.key] = parseFloat(css.getPropertyValue(f.key)) || 0;
  }
  return out;
}

function apply(values: Values, overrides: Values) {
  const root = document.documentElement;
  for (const f of FIELDS) {
    const v = overrides[f.key] ?? values[f.key];
    if (f.to === "motion") MOTION[f.key as MotionKey] = v;
    else if (f.key in overrides) root.style.setProperty(f.key, `${v}${f.unit ?? ""}`);
    else root.style.removeProperty(f.key);
  }
  // CardStack re-measures the spot and repaints on resize
  window.dispatchEvent(new Event("resize"));
}

const fmt = (f: Field, v: number) => {
  const d = Math.max(0, -Math.floor(Math.log10(f.step)));
  return `${v.toFixed(d)}${f.unit ?? ""}`;
};

/** Keep the panel's own input away from the row's window listeners. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

export function TunePanel() {
  const [bp, setBp] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<Values>({});
  const [overrides, setOverrides] = useState<Values>({});
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState("");

  useEffect(() => {
    const read = () => setSize(`${innerWidth}x${innerHeight}`);
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);

  // Load the overrides for the current breakpoint, and again whenever it changes.
  useEffect(() => {
    const mq = matchMedia("(max-width: 640px)");
    const sync = () => {
      const b = breakpoint();
      const d = readDefaults();
      const o = load(storeKey(b));
      apply(d, o);
      setBp(b);
      setDefaults(d);
      setOverrides(o);
      setSize(`${innerWidth}x${innerHeight}`);
      try {
        setOpen(localStorage.getItem(OPEN_KEY) !== "0");
      } catch {}
    };
    // wait a frame so the cards have laid out
    const raf = requestAnimationFrame(sync);
    mq.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const update = useCallback(
    (next: Values) => {
      if (!bp) return;
      setOverrides(next);
      apply(defaults, next);
      save(storeKey(bp), next);
    },
    [bp, defaults],
  );

  const set = (key: string, v: number) => update({ ...overrides, [key]: v });
  const unset = (key: string) => {
    const next = { ...overrides };
    delete next[key];
    update(next);
  };

  const toggle = useCallback(() => {
    setOpen((o) => {
      try {
        localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {}
      return !o;
    });
  }, []);

  // backslash shows and hides the panel from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "\\" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      toggle();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [toggle]);

  const changed = FIELDS.filter((f) => f.key in overrides);
  const summary = [
    `${bp} ${size}`,
    ...(changed.length
      ? changed.map((f) => `${f.key.replace(/^--/, "")}: ${fmt(f, overrides[f.key])}  (was ${fmt(f, defaults[f.key])})`)
      : ["no changes"]),
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const key = (k: string) => () => window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));

  if (!bp) return null;

  return (
    <aside
      className="tune"
      data-open={open}
      onPointerDown={stop}
      onWheel={stop}
      onKeyDown={stop}
    >
      <div className="tune-bar">
        <button type="button" className="tune-title" onClick={toggle} title="Show or hide (\)">
          Tune <span>{open ? bp : changed.length ? `${changed.length} changed` : "show"}</span>
        </button>
        {open && (
          <span className="tune-actions">
            <button type="button" onClick={key("Home")} title="Back to the opening view">
              Row
            </button>
            <button type="button" onClick={key("ArrowDown")} title="Pull the next card out">
              Next
            </button>
            <button type="button" onClick={() => update({})} disabled={!changed.length}>
              Reset
            </button>
            <button type="button" className="tune-min" onClick={toggle} title="Minimize (\)" aria-label="Minimize">
              –
            </button>
          </span>
        )}
      </div>

      {open && (
        <div className="tune-body">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h2>{g.title}</h2>
              {g.fields.map((f) => {
                const v = overrides[f.key] ?? defaults[f.key] ?? 0;
                const on = f.key in overrides;
                return (
                  <label key={f.key} className="tune-row" data-changed={on}>
                    <span className="tune-label">{f.label}</span>
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={v}
                      onChange={(e) => set(f.key, parseFloat(e.target.value))}
                      onDoubleClick={() => unset(f.key)}
                    />
                    <span className="tune-value" title={on ? "Double-click the slider to reset" : undefined}>
                      {fmt(f, v)}
                    </span>
                  </label>
                );
              })}
            </section>
          ))}

          <pre className="tune-out">{summary}</pre>
          <button type="button" className="tune-copy" onClick={copy}>
            {copied ? "Copied" : "Copy values"}
          </button>
        </div>
      )}
    </aside>
  );
}
