/**
 * Every writeup on the site, in the order /writeups lists them (newest first).
 * Each lives in writeups/<slug>/ and exports its meta and its Article. Add one
 * here and it gets a page at /writeups/<slug>, a card on /writeups, and a line
 * in the other writeups' "More writeups" footer.
 */

import type { Writeup } from "@/writeup";
import * as example from "./example";

export const WRITEUPS: Writeup[] = [example];

export function getWriteup(slug: string): Writeup | undefined {
  return WRITEUPS.find((w) => w.meta.slug === slug);
}
