import type { WriteupMeta } from "@/lib/writeups";
import poster from "@/assets/writeups/doctor-rocket/hero-poster.webp";

/** The contents, in reading order. */
export const S = {
  what: { id: "what-dr-rocket-is", title: "What Dr. Rocket is", level: 2 },
  shape: { id: "rust-draws-racket-decides", title: "Rust draws, Racket decides", level: 2 },
  viz: { id: "the-visualizer", title: "The Visualizer", level: 2 },
  instrument: { id: "instrumenting-a-run", title: "Instrumenting a run", level: 3 },
  drawing: { id: "drawing-a-step", title: "Drawing a step", level: 3 },
  words: { id: "code-into-words", title: "Code into words", level: 3 },
  choreo: { id: "choreographing-a-step", title: "Choreographing a step", level: 3 },
  editor: { id: "the-editor-core", title: "The editor core", level: 2 },
  relex: { id: "relexing-one-keystroke", title: "Relexing one keystroke", level: 3 },
  format: { id: "a-formatter-that-searches", title: "A formatter that searches", level: 3 },
  images: { id: "an-image-is-one-character", title: "An image is one character", level: 3 },
  arrows: { id: "arrows-that-survive-typing", title: "Arrows that survive typing", level: 3 },
  running: { id: "running-student-code", title: "Running student code", level: 2 },
  memory: { id: "pause-dont-kill", title: "Pause, don't kill", level: 3 },
  debugger: { id: "debugging-unsaved-files", title: "Debugging unsaved files", level: 3 },
  headers: { id: "files-graders-can-read", title: "Files graders can read", level: 3 },
  userWritten: { id: "only-what-you-wrote", title: "Only what you wrote", level: 3 },
  stepper: { id: "stepping-like-drracket", title: "Stepping like DrRacket", level: 2 },
  robot: { id: "a-robot-that-films-the-app", title: "A robot that films the app", level: 2 },
  terminal: { id: "a-real-terminal", title: "A real terminal", level: 2 },
  shipping: { id: "shipping-it", title: "Shipping it", level: 2 },
  limits: { id: "what-it-cant-do-yet", title: "What it can't do yet", level: 2 },
} as const;

export const meta: WriteupMeta = {
  slug: "doctor-rocket",
  project: "Dr. Rocket",
  title: "Racket Science",
  dek: "How a Rust IDE replaces DrRacket for students learning Racket, and how its Visualizer draws a program while it runs.",
  date: "October 2026",
  hero: {
    src: poster,
    alt: "The Dr. Rocket launch video: the editor, the stepper, and the Visualizer drawing a binary search tree.",
    video: { mp4: "/writeups/doctor-rocket/hero.mp4", webm: "/writeups/doctor-rocket/hero.webm" },
  },
  tone: "#1fa2ec",
  team: [{ name: "Moiz" }, { name: "John" }],
  overview:
    "Dr. Rocket is a modern IDE for the teaching languages of Racket, written in Rust. It opens and saves the same files as DrRacket, runs them on the real Racket, and adds what DrRacket never had: a Visualizer that draws every call and value as the program runs, a formatter, a debugger, a terminal and fast editing on large files.",
  stack: [
    ["Rust", "Cpu"],
    ["egui", "Monitor"],
    ["Racket", "Server"],
    ["JSON lines", "Link"],
    ["alacritty_terminal", "Tv"],
    ["ffmpeg", "Camera"],
  ],
  links: [{ label: "Website", href: "https://doctorocket.com/" }],
  sections: Object.values(S),
};
