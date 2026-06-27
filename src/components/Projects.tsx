"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Reveal } from "./Reveal";

const TABS = ["everything", "projects", "communities"] as const;
type Tab = (typeof TABS)[number];

type Project = {
  title: string;
  label: string;
  group: "projects" | "communities";
  desc: string;
};

const projects: Project[] = [
  {
    title: "flux",
    label: "project",
    group: "projects",
    desc: "a tool that helps makers ship faster — 1m+ users and counting. built the editor, the sync engine, and most of the marketing site.",
  },
  {
    title: "@startup",
    label: "internship",
    group: "projects",
    desc: "incoming software engineer building developer tooling used by thousands of teams every day. shipping to production from week one.",
  },
  {
    title: "pixelkit",
    label: "project",
    group: "projects",
    desc: "a design-system generator that turns raw tokens into production-ready ui. one source of truth, every framework out the other end.",
  },
  {
    title: "builder collective",
    label: "community",
    group: "communities",
    desc: "growing a campus community of student builders shipping in public — weekly demos, late-night hack sessions, and a lot of cold brew.",
  },
  {
    title: "orbit",
    label: "project",
    group: "projects",
    desc: "a realtime collaboration canvas for distributed product teams. webrtc, rust, and a tiny bit of wasm holding it all together.",
  },
  {
    title: "drawer of thoughts",
    label: "writing",
    group: "communities",
    desc: "long-form essays on software craft, taste, and building in public. notes from the seam where applied ml meets real systems.",
  },
];

export function Projects({ images }: { images: string[] }) {
  const [tab, setTab] = useState<Tab>("everything");

  const withImages = projects.map((p, i) => ({
    ...p,
    img: images.length ? images[i % images.length] : null,
  }));
  const filtered = withImages.filter(
    (p) => tab === "everything" || p.group === tab
  );

  return (
    <section
      id="projects"
      className="mx-auto mb-28 mt-12 max-w-[760px] px-5 sm:px-8"
    >
      {/* filter tabs + search */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-5 py-2.5 text-base transition ${
                tab === t
                  ? "bg-black/[0.06] text-[var(--fg)] dark:bg-white/10"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          aria-label="Search"
          onClick={() => window.dispatchEvent(new CustomEvent("open-search"))}
          className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition hover:text-[var(--fg)]"
        >
          <Search size={20} />
        </button>
      </div>

      {/* card grid */}
      <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2">
        {filtered.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 90}>
          <article className="group">
            <div className="overflow-hidden bg-black/5 dark:bg-white/5">
              {p.img && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.img}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-medium">{p.title}</h3>
              <span className="shrink-0 text-sm text-[var(--muted)]">
                {p.label}
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {p.desc}
            </p>
          </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
