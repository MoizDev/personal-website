"use client";

/**
 * The contents, fixed on the left on wide screens: "Overview" for the top of
 * the page, then every heading, with steps indented under their chapter. The
 * one you're reading is marked, and a thin bar along the top shows how far
 * through the whole piece you are.
 */

import { useEffect, useState } from "react";
import type { Section } from "@/lib/writeups";

export function Toc({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => e !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      // the current section is the last heading above a line a third of the way down
      const line = window.innerHeight * 0.33;
      let current: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top < line) current = el.id;
      setActive(current);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="wu-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      <nav className="wu-toc" aria-label="Contents">
        <ol>
          <li className="wu-toc-item wu-toc-l2" data-state={active === null ? "active" : "ahead"}>
            <a href="#top" onClick={toTop}>
              Overview
            </a>
          </li>
          {sections.map((s) => (
            <li key={s.id} className={`wu-toc-item wu-toc-l${s.level}`} data-state={s.id === active ? "active" : "ahead"}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
