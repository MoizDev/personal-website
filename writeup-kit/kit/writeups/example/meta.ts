import type { WriteupMeta } from "@/writeup";
import hero from "./assets/hero.webp";

/**
 * The contents, in reading order. Ids are the anchors in the contents list;
 * level 3 sections nest under the level 2 before them.
 */
export const S = {
  what: { id: "what-it-does", title: "What Ferry does", level: 2 },
  lost: { id: "why-jobs-went-missing", title: "Why jobs went missing", level: 2 },
  map: { id: "how-the-pieces-fit", title: "How the pieces fit", level: 2 },
  loop: { id: "the-worker-loop", title: "The worker loop", level: 2 },
  claim: { id: "claim", title: "Claim: a lease, not a lock", level: 3 },
  retry: { id: "retry", title: "Retry: back off, then stop", level: 3 },
  schedule: { id: "checking-the-schedule", title: "Checking the schedule", level: 3 },
  life: { id: "one-jobs-life", title: "One job's life", level: 2 },
  speed: { id: "from-five-seconds-to-a-third", title: "From five seconds to a third", level: 2 },
  light: { id: "the-status-light", title: "The status light", level: 2 },
  limits: { id: "what-it-cant-do-yet", title: "What it can't do yet", level: 2 },
} as const;

export const meta: WriteupMeta = {
  slug: "example",
  project: "Ferry",
  title: "Nothing Falls Off the Boat",
  dek: "How Ferry, a small job queue on Postgres, stopped losing work: leases instead of locks, retries with a ceiling, and one table that tells the truth.",
  date: "October 2026",
  occasion: "Example writeup · fictional project",
  hero: {
    src: hero,
    alt: "Coloured crates riding a conveyor from a queue, past three workers, into a tray marked done.",
    video: { mp4: "/writeups/example/hero.mp4" },
  },
  tone: "#0f9d8a",
  team: [
    { name: "Ada", role: "Queue and workers" },
    { name: "Grace", role: "Dashboard" },
    { name: "Linus", role: "The status light" },
  ],
  overview:
    "Ferry runs background jobs for a web app: resizing uploads, sending email, calling webhooks. Jobs live in one Postgres table, workers lease them for a short time, and a job that fails waits longer before each retry until it gives up and says so.",
  links: [{ label: "GitHub", href: "https://github.com/example/ferry", icon: "GitHub" }],
  sections: Object.values(S),
};
