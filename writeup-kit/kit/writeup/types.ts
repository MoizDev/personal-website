/**
 * The shapes a writeup is made of. Each writeup lives in writeups/<slug>/ and
 * exports its meta (title, team, links, the contents) and its Article; the
 * registry in writeups/registry.ts lists them.
 */

import type { ComponentType } from "react";
import type { StaticImageData } from "next/image";

/** A heading in the article. Level 2 is a chapter; level 3 nests under it in the contents. */
export type Section = { id: string; title: string; level: 2 | 3 };

export type WriteupMeta = {
  slug: string;
  /** the project's name, shown in the line under the title */
  project: string;
  /** the headline, the page's big heading; a bit of character is welcome */
  title: string;
  /** one sentence under the headline */
  dek: string;
  /** when it happened, as you'd say it: "September 2026" */
  date: string;
  /** a short line beside the date: "Spring hackathon · Finalist" */
  occasion?: string;
  /**
   * The picture under the title. With video, the clip plays there instead (muted,
   * looping, inline) and src is its poster: the first thing shown, the still for
   * reduced motion, and the share image. Videos live under /public.
   */
  hero: { src: StaticImageData; alt: string; video?: { mp4: string; webm?: string } };
  /** the project's accent colour, as CSS: the progress bar, lit code lines, the glow at the top */
  tone: string;
  team: { name: string; role?: string; href?: string }[];
  overview: string;
  links: { label: string; href: string; icon?: string }[];
  sections: Section[];
};

export type Writeup = { meta: WriteupMeta; Article: ComponentType };
