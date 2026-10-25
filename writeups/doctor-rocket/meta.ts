import type { WriteupMeta } from "@/lib/writeups";
import poster from "@/assets/writeups/doctor-rocket/hero-poster.webp";

export const S = {
  what: { id: "what-it-is", title: "What Dr. Rocket is", level: 2 },
} as const;

export const meta: WriteupMeta = {
  slug: "doctor-rocket",
  project: "Dr. Rocket",
  title: "Racket Science",
  dek: "How a Rust IDE replaces DrRacket, and how its Visualizer draws a Racket program while it runs.",
  date: "October 2026",
  hero: {
    src: poster,
    alt: "The Dr. Rocket launch video: the editor, the stepper, and the Visualizer drawing a binary search tree.",
    video: { mp4: "/writeups/doctor-rocket/hero.mp4", webm: "/writeups/doctor-rocket/hero.webm" },
  },
  tone: "#1fa2ec",
  team: [{ name: "Moiz", role: "Everything" }],
  overview: "Placeholder.",
  links: [{ label: "Website", href: "https://doctorocket.com/" }],
  sections: Object.values(S),
};
