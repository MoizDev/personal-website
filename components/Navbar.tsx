"use client";

/**
 * A floating bar with the mark and name, and a menu button that opens the bar
 * into a panel: big links on the left, the mark on a card on the right, and
 * the small links along the bottom.
 *
 * While the menu is open it owns the keyboard, wheel and pointer, so the row
 * of cards behind it stays put.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import "./Navbar.css";
import { EMAIL, LINKS, newTab } from "@/lib/links";

/** Send the row back to its first card (CardStack listens for Home). */
const toRow = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));

/** The menu's big items: a link, or a button that does something on the page. */
type BigItem = { label: string; href: string } | { label: string; onClick: () => void };

const BIG: BigItem[] = [
  { label: "Work", onClick: toRow },
  { label: "Resume", href: LINKS.resume.href },
  { label: "Contact", href: LINKS.email.href },
];

const SMALL = [
  LINKS.github,
  LINKS.linkedin,
  { label: EMAIL, href: LINKS.email.href },
];

const stop = (e: SyntheticEvent) => e.stopPropagation();

/** Flip between light and dark, and remember the choice. */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage blocked; the choice lasts until reload
  }
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Escape closes; every other key stays with the menu while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        button.current?.focus();
      }
    };
    // capture on window runs before the row's own key handler
    window.addEventListener("keydown", onKey, true);
    // focus moves into the menu so Tab walks its links, without ringing the first one
    panel.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div
        className="nav-scrim"
        data-open={open}
        onClick={close}
        onPointerDown={stop}
        onWheel={stop}
        aria-hidden
      />

      <nav
        className="nav"
        data-open={open}
        aria-label="Site"
        onPointerDown={stop}
        onWheel={stop}
      >
        <div className="nav-bar">
          <div className="nav-left">
            <Link
              className="nav-home"
              href="/"
              aria-label="Moiz Hashmi, home"
              onClick={(e) => {
                e.preventDefault();
                close();
                toRow();
              }}
            >
              <Logo className="nav-logo" />
            </Link>

            <button
              type="button"
              className="nav-theme"
              onClick={toggleTheme}
              aria-label="Switch light or dark mode"
            >
              {/* a circle, half filled: light and dark */}
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <button
            ref={button}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>

        <div
          className="nav-panel"
          id={panelId}
          ref={panel}
          tabIndex={-1}
          inert={!open}
        >
          <div className="nav-inner">
            <div className="nav-body">
              <ul className="nav-big">
                {BIG.map((l, i) => (
                  <li key={l.label} style={{ "--i": i } as CSSProperties}>
                    {"href" in l ? (
                      <a href={l.href} {...newTab(l.href)} onClick={close}>
                        {l.label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          l.onClick();
                        }}
                      >
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <ul className="nav-small">
                {SMALL.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} {...newTab(l.href)} onClick={close}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav-card" aria-hidden>
              <Logo className="nav-card-logo" spin />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
