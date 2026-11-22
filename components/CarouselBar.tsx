"use client";

import { useEffect, useRef, useState } from "react";
import { PHONE_QUERY } from "@/lib/scale";

/** The carousel's track: the bar's sibling. */
const trackOf = (bar: HTMLElement | null) => bar?.parentElement?.querySelector<HTMLElement>(".plist-track") ?? null;

/**
 * The phone carousel's controls (ProjectList): a card back, a dot per card,
 * and a card on. It watches which card sits in the middle of the track, and
 * the sky takes that card's colour (--project-tone on the root, which
 * SolarSystem fades to), as the desktop's does from the card in the spot.
 */
export function CarouselBar({ count }: { count: number }) {
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /** Centre card i in the track (the snap would land there anyway). */
  const go = (i: number) => {
    const t = trackOf(bar.current);
    const item = t?.children[i] as HTMLElement | undefined;
    if (!t || !item) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({
      left: item.offsetLeft - (t.clientWidth - item.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const t = trackOf(bar.current);
    if (!t) return;
    const mq = matchMedia(PHONE_QUERY);
    const root = document.documentElement.style;
    const items = Array.from(t.children) as HTMLElement[];
    let io: IntersectionObserver | null = null;

    const start = () => {
      io?.disconnect();
      io = null;
      if (!mq.matches) return;
      // a card is the current one once most of it is in the track's view
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const i = items.indexOf(e.target as HTMLElement);
            setActive(i);
            const tone = items[i].dataset.tone;
            if (tone) root.setProperty("--project-tone", tone);
            else root.removeProperty("--project-tone");
          }
        },
        { root: t, threshold: 0.6 },
      );
      for (const el of items) io.observe(el);
    };

    start();
    mq.addEventListener("change", start);
    return () => {
      io?.disconnect();
      mq.removeEventListener("change", start);
    };
  }, []);

  return (
    <div className="plist-bar" ref={bar}>
      <button
        type="button"
        className="plist-arrow"
        aria-label="Previous project"
        disabled={active <= 0}
        onClick={() => go(active - 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M14.5 5.5 8 12l6.5 6.5" />
        </svg>
      </button>

      <ol className="plist-dots" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} data-on={i === active} />
        ))}
      </ol>

      <button
        type="button"
        className="plist-arrow"
        aria-label="Next project"
        disabled={active >= count - 1}
        onClick={() => go(active + 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M9.5 5.5 16 12l-6.5 6.5" />
        </svg>
      </button>
    </div>
  );
}
