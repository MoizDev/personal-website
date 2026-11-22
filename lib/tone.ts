/**
 * The colour of the project being looked at (the card in the spot on desktops,
 * the middle card of the carousel on phones), which the sky and the corner
 * glow fade to (SolarSystem).
 *
 * It's passed along here rather than as a CSS variable on the root: a variable
 * set there restyles every element on the page, and the change lands while the
 * row is still settling.
 */

const EVENT = "project-tone";
let current = "";

export function setProjectTone(tone: string | null) {
  const next = tone ?? "";
  if (next === current) return;
  current = next;
  window.dispatchEvent(new Event(EVENT));
}

/** The colour now, or "" for none. */
export const projectTone = () => current;

/** Call `fn` whenever the colour changes; returns how to stop. */
export function onProjectTone(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
