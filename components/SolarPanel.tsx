"use client";

/**
 * Dev-only sliders for the solar system in the background. Size and place are
 * shared by both themes; the look (colour, vividness, contrast, weight,
 * opacities, sky) is set for light and dark on their own. Picking a theme's
 * tab also switches the site to that theme, so you see what you're tuning.
 *
 * Values apply live to SOLAR (lib/solar.ts), are kept in localStorage, and the
 * changed ones are listed at the bottom to copy. Toggle it with the "]" key.
 *
 * Shown in development only (see app/page.tsx).
 */

import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { SOLAR, SOLAR_DEFAULTS, SOLAR_EVENT, type SolarTheme } from "@/lib/solar";
import "./TunePanel.css";
import "./SolarPanel.css";

type Group = "shared" | SolarTheme;

type Field = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** an on/off switch rather than a slider */
  toggle?: boolean;
};

const SHARED: Field[] = [
  { key: "size", label: "size", min: 0.3, max: 2.5, step: 0.01, unit: "x" },
  { key: "x", label: "sun x", min: 0, max: 1.2, step: 0.005 },
  { key: "y", label: "sun y", min: -0.3, max: 1, step: 0.005 },
  { key: "tilt", label: "tilt", min: 0.05, max: 1, step: 0.01 },
  { key: "sun", label: "sun size", min: 0.3, max: 2.5, step: 0.01, unit: "x" },
  { key: "planets", label: "planet size", min: 0.3, max: 3, step: 0.01, unit: "x" },
  { key: "cell", label: "character size", min: 4, max: 20, step: 0.5, unit: "px" },
  { key: "speed", label: "speed", min: 0, max: 10, step: 0.1, unit: "x" },
  { key: "fadeFrom", label: "fade from", min: 0, max: 100, step: 1, unit: "%" },
  { key: "fadeTo", label: "fade to", min: 0, max: 100, step: 1, unit: "%" },
];

const LOOK: { title: string; fields: Field[] }[] = [
  {
    title: "Colour",
    fields: [
      { key: "colour", label: "colour mix", min: 0, max: 1, step: 0.01 },
      { key: "vivid", label: "vividness", min: 0, max: 3, step: 0.01, unit: "x" },
      { key: "lightness", label: "lightness", min: -1, max: 1, step: 0.01 },
      { key: "contrast", label: "contrast", min: 0, max: 3, step: 0.01, unit: "x" },
      { key: "invert", label: "dense = dark", min: 0, max: 1, step: 1, toggle: true },
      { key: "weight", label: "boldness", min: 100, max: 900, step: 100 },
    ],
  },
  {
    title: "Opacity",
    fields: [
      { key: "bodies", label: "sun + planets", min: 0, max: 1, step: 0.01 },
      { key: "orbits", label: "orbits + belt", min: 0, max: 3, step: 0.01, unit: "x" },
      { key: "stars", label: "stars", min: 0, max: 3, step: 0.01, unit: "x" },
      { key: "glow", label: "sun glow", min: 0, max: 3, step: 0.01, unit: "x" },
    ],
  },
  {
    title: "Sky",
    fields: [
      { key: "sky", label: "sky", min: 0, max: 1, step: 0.01 },
      { key: "skyHue", label: "sky hue", min: 0, max: 360, step: 1, unit: "°" },
    ],
  },
];

type Overrides = Record<Group, Record<string, number>>;

const STORE = "solar-tune";
const OPEN_KEY = "solar-tune:open";
const empty = (): Overrides => ({ shared: {}, light: {}, dark: {} });

const defaultOf = (g: Group, key: string) => (SOLAR_DEFAULTS[g] as Record<string, number>)[key];

/** The saved values, minus any that match the defaults (e.g. after they were baked in). */
function load(): Overrides {
  let saved: Partial<Overrides> = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORE) ?? "{}") as Partial<Overrides>;
  } catch {}
  const out = empty();
  for (const g of ["shared", "light", "dark"] as const)
    for (const [k, v] of Object.entries(saved[g] ?? {}))
      if (typeof v === "number" && defaultOf(g, k) !== undefined && v !== defaultOf(g, k)) out[g][k] = v;
  return out;
}

function save(o: Overrides) {
  try {
    if (Object.values(o).some((g) => Object.keys(g).length)) localStorage.setItem(STORE, JSON.stringify(o));
    else localStorage.removeItem(STORE);
  } catch {
    // storage blocked; the tweaks just won't survive a reload
  }
}


function apply(o: Overrides) {
  for (const g of ["shared", "light", "dark"] as const) {
    const target = SOLAR[g] as Record<string, number>;
    for (const k of Object.keys(target)) target[k] = o[g][k] ?? defaultOf(g, k);
  }
  window.dispatchEvent(new Event(SOLAR_EVENT));
}

const fmt = (f: Field, v: number) => {
  if (f.toggle) return v >= 0.5 ? "on" : "off";
  const d = Math.max(0, -Math.floor(Math.log10(f.step)));
  return `${v.toFixed(d)}${f.unit ?? ""}`;
};

const currentTheme = (): SolarTheme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Switch the site's theme, the same way the navbar's toggle does. */
function setSiteTheme(t: SolarTheme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
}

/** Keep the panel's own input away from the row's window listeners. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

const FIELD_SETS: Record<Group, Field[]> = {
  shared: SHARED,
  light: LOOK.flatMap((s) => s.fields),
  dark: LOOK.flatMap((s) => s.fields),
};

export function SolarPanel() {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>(empty);
  const [theme, setTheme] = useState<SolarTheme>("light");
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // load the saved values once the page is up (the stored theme is on <html> by then)
    const raf = requestAnimationFrame(() => {
      const o = load();
      apply(o);
      setOverrides(o);
      setTheme(currentTheme());
      try {
        setOpen(localStorage.getItem(OPEN_KEY) !== "0");
      } catch {}
      setReady(true);
    });
    // follow the navbar's theme toggle too
    const mo = new MutationObserver(() => setTheme(currentTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, []);

  const update = useCallback((next: Overrides) => {
    setOverrides(next);
    apply(next);
    save(next);
  }, []);

  const set = (g: Group, key: string, v: number) => update({ ...overrides, [g]: { ...overrides[g], [key]: v } });
  const unset = (g: Group, key: string) => {
    const next = { ...overrides, [g]: { ...overrides[g] } };
    delete next[g][key];
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

  // "]" shows and hides the panel from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "]" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      toggle();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [toggle]);

  const changedIn = (g: Group) => FIELD_SETS[g].filter((f) => f.key in overrides[g]);
  const count = (["shared", "light", "dark"] as const).reduce((n, g) => n + changedIn(g).length, 0);

  const summary = (["shared", "light", "dark"] as const)
    .map((g) => {
      const c = changedIn(g);
      if (!c.length) return null;
      return [`${g}:`, ...c.map((f) => `  ${f.key}: ${overrides[g][f.key]}  (was ${defaultOf(g, f.key)})`)].join("\n");
    })
    .filter(Boolean)
    .join("\n") || "no changes";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Solar system values\n${summary}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const row = (g: Group, f: Field) => {
    const v = overrides[g][f.key] ?? defaultOf(g, f.key);
    const on = f.key in overrides[g];
    return (
      <label key={`${g}-${f.key}`} className="tune-row" data-changed={on}>
        <span className="tune-label">{f.label}</span>
        {f.toggle ? (
          <input
            type="checkbox"
            className="solar-check"
            checked={v >= 0.5}
            onChange={(e) => {
              const next = e.target.checked ? 1 : 0;
              if (next === defaultOf(g, f.key)) unset(g, f.key);
              else set(g, f.key, next);
            }}
          />
        ) : (
          <input
            type="range"
            min={f.min}
            max={f.max}
            step={f.step}
            value={v}
            onChange={(e) => set(g, f.key, parseFloat(e.target.value))}
            onDoubleClick={() => unset(g, f.key)}
          />
        )}
        <span className="tune-value" title={on ? "Double-click the slider to reset" : undefined}>
          {fmt(f, v)}
        </span>
      </label>
    );
  };

  if (!ready) return null;

  const resetGroup = (g: Group) => update({ ...overrides, [g]: {} });

  return (
    <aside className="tune solar-panel" data-open={open} onPointerDown={stop} onWheel={stop} onKeyDown={stop}>
      <div className="tune-bar">
        <button type="button" className="tune-title" onClick={toggle} title="Show or hide (])">
          Solar <span>{count ? `${count} changed` : open ? "" : "show"}</span>
        </button>
        {open && (
          <span className="tune-actions">
            <button type="button" onClick={() => update(empty())} disabled={!count}>
              Reset all
            </button>
            <button type="button" className="tune-min" onClick={toggle} title="Minimize (])" aria-label="Minimize">
              –
            </button>
          </span>
        )}
      </div>

      {open && (
        <div className="tune-body">
          <section>
            <h2 className="solar-head">
              Both themes
              <button type="button" onClick={() => resetGroup("shared")} disabled={!changedIn("shared").length}>
                reset
              </button>
            </h2>
            {SHARED.map((f) => row("shared", f))}
          </section>

          <div className="solar-tabs" role="tablist" aria-label="Theme">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={theme === t}
                onClick={() => setSiteTheme(t)}
              >
                {t === "light" ? "Light" : "Dark"}
                {changedIn(t).length ? <span> {changedIn(t).length}</span> : null}
              </button>
            ))}
          </div>

          {LOOK.map((s, i) => (
            <section key={s.title}>
              <h2 className="solar-head">
                {s.title}
                {i === 0 && (
                  <button type="button" onClick={() => resetGroup(theme)} disabled={!changedIn(theme).length}>
                    reset {theme}
                  </button>
                )}
              </h2>
              {s.fields.map((f) => row(theme, f))}
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
