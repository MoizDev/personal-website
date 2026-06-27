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
  /** custom thumbnail; falls back to the generic image pool if omitted */
  image?: string;
  /** if set, the whole card links out (new tab) */
  href?: string;
};

const projects: Project[] = [
  {
    title: "weekloom",
    label: "startup",
    group: "projects",
    desc: "a 2d to-do list that works like a gantt chart. scaled to 30k users with zero marketing spend.",
    image: "/projects/weekloom.png",
    href: "https://weekloom.com/",
  },
  {
    title: "scire",
    label: "project",
    group: "projects",
    desc: "a full-stack scheduling app — grown from a school club into a tool now serving two school boards.",
    image: "/projects/scire.png",
    href: "https://app.tutoringapp.ca",
  },
  {
    title: "jazzba",
    label: "swe",
    group: "projects",
    desc: "rewrote backend services and the api layer of a legacy enterprise warehouse platform moving 1000s of skus a day.",
    image: "/projects/jazzba.png",
    href: "https://jazzba.io/",
  },
  {
    title: "factful",
    label: "startup",
    group: "projects",
    desc: "an ai edtech startup. turned down a $750k vc offer; now piloting with 70k seneca students.",
    image: "/projects/factful.png",
    href: "https://factful.io/",
  },
  {
    title: "wmoj",
    label: "project",
    group: "projects",
    desc: "an online judge that compiles and grades c++/python submissions for 200+ concurrent users.",
    image: "/projects/wmoj.png",
    href: "https://wmoj.ca/",
  },
  {
    title: "woss weekly",
    label: "community",
    group: "communities",
    desc: "the school newspaper club — writing, editing, and shipping a student paper on a deadline.",
    image: "/projects/woss-weekly.png",
    href: "https://www.youtube.com/@wossweekly1716",
  },
  {
    title: "computer science club",
    label: "community",
    group: "communities",
    desc: "vice president — running workshops, contests, and talks to get more students building.",
    image: "/projects/cs-club.webp",
  },
  {
    title: "plantdex",
    label: "project",
    group: "projects",
    desc: "a pokédex for plants — identify, catalog, and learn about the flora around you.",
  },
];

export function Projects({ images }: { images: string[] }) {
  const [tab, setTab] = useState<Tab>("everything");

  const withImages = projects.map((p, i) => ({
    ...p,
    img: p.image ?? (images.length ? images[i % images.length] : null),
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
        {filtered.map((p, i) => {
          const inner = (
            <>
              <div className="overflow-hidden bg-black/5 dark:bg-white/5">
                {p.img && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.img}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
            </>
          );
          return (
            <Reveal key={p.title} delay={(i % 2) * 90}>
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  {inner}
                </a>
              ) : (
                <article className="group">{inner}</article>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
