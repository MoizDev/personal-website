"use client";

import { useEffect } from "react";
import { PHONE_QUERY } from "@/lib/scale";

/**
 * Phones: the sky takes the colour of the project card filling the middle of
 * the screen, as the desktop's does from the card in the spot. It sets
 * --project-tone on the root, which SolarSystem fades the sky to; above the
 * first card (the intro) there's none, and the sky is its own blue.
 */
export function ToneOnScroll() {
  useEffect(() => {
    const mq = matchMedia(PHONE_QUERY);
    const root = document.documentElement.style;
    let io: IntersectionObserver | null = null;

    const start = () => {
      io?.disconnect();
      io = null;
      if (!mq.matches) return;
      const items = Array.from(document.querySelectorAll<HTMLElement>(".plist-item[data-tone]"));
      const showing = new Set<HTMLElement>();
      // a card counts once it crosses a band across the middle of the screen
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) showing.add(e.target as HTMLElement);
            else showing.delete(e.target as HTMLElement);
          }
          const first = items.find((el) => showing.has(el));
          if (first) root.setProperty("--project-tone", first.dataset.tone!);
          else if (!items.some((el) => el.getBoundingClientRect().bottom < 0)) root.removeProperty("--project-tone");
        },
        { rootMargin: "-45% 0px -45% 0px" },
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
  return null;
}
