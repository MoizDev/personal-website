import type { WriteupMeta } from "@/lib/writeups";
import hero from "@/assets/projects/bricked.webp";
import mark from "@/assets/writeups/bricked/bricked-mark.webp";

/**
 * The contents, in reading order. Level 2 sections are numbered like the
 * steps of a Lego manual; level 3 are the steps inside the harness.
 */
export const S = {
  what: { id: "what-it-does", title: "What Bricked does", level: 2 },
  blobs: { id: "why-the-first-version-built-blobs", title: "Why the first version built blobs", level: 2 },
  map: { id: "how-the-pieces-fit", title: "How the pieces fit", level: 2 },
  harness: { id: "the-harness", title: "The harness", level: 2 },
  distill: { id: "distill", title: "Distill: make the idea buildable", level: 3 },
  imagine: { id: "imagine", title: "Imagine: a picture to build against", level: 3 },
  plan: { id: "plan", title: "Plan: a brief, not coordinates", level: 3 },
  kernel: { id: "build", title: "Build: the geometry kernel", level: 3 },
  judge: { id: "judge", title: "Judge: render, critique, choose", level: 3 },
  live: { id: "watching-it-work", title: "Watching it work", level: 2 },
  speed: { id: "fourteen-minutes-to-four", title: "Fourteen minutes to four", level: 2 },
  cache: { id: "runs-are-the-cache", title: "Runs are the cache", level: 2 },
  order: { id: "from-model-to-real-bricks", title: "From a model to real bricks", level: 2 },
  limits: { id: "what-it-cant-build-yet", title: "What it can't build yet", level: 2 },
} as const;

export const meta: WriteupMeta = {
  slug: "bricked",
  project: "Bricked",
  mark,
  title: "How Bricked Turns a Sentence Into a Lego Set",
  dek: "Inside the harness behind our Hack the North win: an image model that imagines the set, Claude agents that plan it, and a geometry kernel that places every brick.",
  date: "September 2026",
  occasion: "Hack the North 2026 · Winner",
  hero: { src: hero, alt: "Bricked on a laptop: a Lego model generated from a typed idea, in a light-blue instruction-manual interface." },
  tone: "#ff4d2e",
  team: [
    { name: "Eason", role: "Generation engine" },
    { name: "James", role: "Computer vision" },
    { name: "Moiz", role: "Design, interface and the harness" },
  ],
  overview:
    "Bricked turns anything you type into a Lego model you can actually build. An image model imagines the finished set, a team of AI agents plans it, a geometry kernel places every brick, and a critique loop keeps fixing the build until it matches the picture.",
  stack: [
    ["Claude agents", "Bot"],
    ["Image models", "Image"],
    ["Geometry kernel", "Cpu"],
    ["LDraw parts", "brick"],
    ["Next.js", "Layers"],
    ["BrickLink", "ShoppingCart"],
  ],
  links: [
    { label: "Devpost", href: "https://devpost.com/software/a-feuvb1", icon: "Trophy" },
    { label: "GitHub", href: "https://github.com/GuyOnWifi/hack-the-north", icon: "GitHub" },
  ],
  sections: Object.values(S),
};
