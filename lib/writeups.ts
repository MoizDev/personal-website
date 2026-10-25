/**
 * Every writeup on the site. Each one lives in writeups/<slug>/ and exports its
 * meta (title, team, links, the table of contents) and its Article. Add one
 * here and it gets a page at /writeups/<slug> and a spot on /writeups.
 */

import type { ComponentType } from "react";
import type { StaticImageData } from "next/image";
import * as bricked from "@/writeups/bricked";

/** A heading in the article: chapters number themselves, "hood" ones nest under them in the contents. */
export type Section = { id: string; title: string; level: 2 | 3 };

export type WriteupMeta = {
  slug: string;
  /** the project's name, shown above the title */
  project: string;
  /** a small mark beside the project's name */
  mark?: StaticImageData;
  /** the headline */
  title: string;
  /** one sentence under the headline */
  dek: string;
  /** when it happened, as you'd say it: "September 2026" */
  date: string;
  /** a short line beside the date: "Hack the North 2026 · Winner" */
  occasion?: string;
  hero: { src: StaticImageData; alt: string };
  /** the project's colour, for accents */
  tone: string;
  team: { name: string; role: string; href?: string }[];
  overview: string;
  /** tools, shown as chips: [label, icon name] */
  stack?: [string, string][];
  links: { label: string; href: string; icon?: string }[];
  sections: Section[];
};

export type Writeup = { meta: WriteupMeta; Article: ComponentType };

export const WRITEUPS: Writeup[] = [bricked];

export function getWriteup(slug: string): Writeup | undefined {
  return WRITEUPS.find((w) => w.meta.slug === slug);
}
