"use client";
import * as React from "react";

export type ProjectTuple = [string, string, string, string, string];
// [imgURL, name, description, technologiesCSV, openInNewTab_URL]

type Props = {
  projects: ProjectTuple[]; // pass one or many
};

function Pill({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs md:text-sm bg-zinc-800/80 text-zinc-200 border border-zinc-700">
      {label}
    </span>
  );
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-5 h-5 md:w-6 md:h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7 17l10-10" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export default function ProjectsShowcase({ projects }: Props) {
  return (
    <section
      aria-label="Projects"
      className="w-full flex flex-col items-center"
    >
      {/* wrapper centers the stack of cards */}
      <div className="w-full max-w-[min(90vw,1000px)] px-4 md:px-6 lg:px-8 flex flex-col items-center gap-6 md:gap-8">
        {projects.map(([img, name, desc, techCSV, href], i) => {
          const techs = techCSV
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          return (
            <article
              key={name + i}
              className="w-full flex flex-col rounded-2xl border border-zinc-800 bg-[#0D0D0F] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              {/* Top media area */}
              <div className="w-full h-44 sm:h-56 md:h-64 bg-zinc-900 overflow-hidden flex flex-col rounded-t-2xl">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1"
                >
                  {/* Use plain <img> to keep it simple + flex only */}
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </a>
              </div>

              {/* Content */}
              <div className="p-5 md:p-6 flex flex-col gap-3 md:gap-4">
                {/* Title + action */}
                <div className="flex flex-row items-start justify-between gap-3">
                  <h3 className="text-clamp(18px,4vw,24px) tracking-tight text-zinc-50 font-baskerville">
                    {name}
                  </h3>

                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center justify-center rounded-lg border border-zinc-700/70 text-zinc-200/90 hover:text-white hover:border-zinc-500 transition-colors px-2 py-2"
                    aria-label={`Open ${name} in new tab`}
                  >
                    <ExternalIcon />
                  </a>
                </div>

                {/* Description */}
                <p className="font-sans text-clamp(14px,3vw,16px) leading-relaxed text-zinc-300/90 font-baskerville">
                  {desc}
                </p>

                {/* Pills */}
                <div className="font-sans flex flex-row flex-wrap gap-2 pt-1">
                  {techs.map((t, idx) => (
                    <Pill key={t + idx} label={t} />
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
