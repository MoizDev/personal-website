import type { StaticImageData } from "next/image";
import {
  brickedLines,
  drrocketLines,
  factfulLines,
  jazzbaLines,
  watwikiLines,
  weekloomLines,
  wmojLines,
  type LineArt,
} from "@/components/CardLines";
import brickedLogo from "@/assets/logos/bricked.png";
import drrocketLogo from "@/assets/logos/drrocket.svg";
import factfulLogo from "@/assets/logos/factful.png";
import jazzbaLogo from "@/assets/logos/jazzba.png";
import watwikiLogo from "@/assets/logos/watwiki.png";
import weekloomLogo from "@/assets/logos/weekloom.svg";
import wmojLogo from "@/assets/logos/wmoj.png";
import bricked from "@/assets/projects/bricked.webp";
import drrocket from "@/assets/projects/drrocket.webp";
import factful from "@/assets/projects/factful.webp";
import jazzba from "@/assets/projects/jazzba.webp";
import watwiki from "@/assets/projects/watwiki.webp";
import weekloom from "@/assets/projects/weekloom.webp";
import wmoj from "@/assets/projects/wmoj.webp";

export type Project = {
  name: string;
  year: string;
  /** what it was: Startup, Project, Hackathon, Work */
  kind: string;
  /** one line, read out by screen readers on the card */
  blurb: string;
  /** a few sentences, for when the card is pulled out of the row */
  about: string;
  href: string;
  /** optional looping clip (a path under /public) that plays on the pulled-out card */
  video?: string;
  /** a screenshot that fills the card, or a logo for a typeset card */
  art: { kind: "shot"; src: StaticImageData } | { kind: "logo"; src: StaticImageData; tagline: string };
  /** the project's mark, all white, shown beside the name on the card */
  logo: StaticImageData;
  /** a badge sticking out of the card's right side while it's in the spot, like an award */
  badge?: { title: string; detail: string };
  /** the card's colour */
  tone: string;
  /** the faint line drawing behind the card, its own for every project (see components/CardLines) */
  lines: LineArt;
};

// Order is the order the cards come round in the stack.
export const PROJECTS: Project[] = [
  {
    name: "Bricked",
    year: "2026",
    kind: "Hackathon",
    blurb: "Won Hack the North 2026. Type an idea, get a LEGO model you can actually build.",
    about:
      "Type an idea and get a LEGO model you can actually build, brick by brick. Won Hack the North 2026.",
    href: "https://devpost.com/software/a-feuvb1",
    art: { kind: "shot", src: bricked },
    logo: brickedLogo,
    badge: { title: "Winner", detail: "Hack the North 2026" },
    tone: "#ff4d2e",
    lines: brickedLines,
  },
  {
    name: "Dr. Rocket",
    year: "2026",
    kind: "Project",
    blurb: "A Racket IDE written in Rust, with a Visualizer that draws your program as it runs.",
    about:
      "Everything DrRacket does, at native speed: a Racket IDE written in Rust, with a stepper, a debugger and a Visualizer that draws your program as it runs. Free for macOS, Windows and Linux.",
    href: "https://doctorocket.com/",
    art: { kind: "shot", src: drrocket },
    logo: drrocketLogo,
    tone: "#1fa2ec",
    lines: drrocketLines,
  },
  {
    name: "Factful",
    year: "2022",
    kind: "Startup",
    blurb: "Co-founded an AI startup that checks essay claims against real sources. Piloting with Seneca College.",
    about:
      "An AI edtech startup that checks the claims in an essay against real sources. Turned down a $750k VC offer; now piloting with Seneca College's 70,000 students.",
    href: "https://factful.io/",
    art: { kind: "shot", src: factful },
    logo: factfulLogo,
    tone: "#2f6bff",
    lines: factfulLines,
  },
  {
    name: "Weekloom",
    year: "2025",
    kind: "Startup",
    blurb: "A to-do list laid out like a Gantt chart, so your whole week fits on one screen.",
    about:
      "A to-do list laid out like a Gantt chart, so your whole week fits on one screen. Grew to 30,000 users with zero marketing spend.",
    href: "https://weekloom.com/",
    art: { kind: "shot", src: weekloom },
    logo: weekloomLogo,
    tone: "#ffc021",
    lines: weekloomLines,
  },
  {
    name: "WMOJ",
    year: "2025",
    kind: "Project",
    blurb: "An online judge that grades C++ and Python in Docker sandboxes, 200+ students at once.",
    about:
      "An online judge that compiles and grades C++ and Python submissions in Docker sandboxes, for 200+ students at once.",
    href: "https://wmoj.ca/",
    art: { kind: "shot", src: wmoj },
    logo: wmojLogo,
    tone: "#22c55e",
    lines: wmojLines,
  },
  {
    name: "WatWiki",
    year: "2026",
    kind: "Project",
    blurb: "AI agents that turn lecture recordings into shared, linked class notes.",
    about:
      "AI agents that turn lecture recordings into a shared, linked wiki for each class.",
    href: "https://github.com/MoizDev/wat-wiki",
    art: { kind: "shot", src: watwiki },
    logo: watwikiLogo,
    tone: "#8b5cf6",
    lines: watwikiLines,
  },
  {
    name: "Jazzba",
    year: "2025",
    kind: "Work",
    blurb: "Modernized a legacy warehouse platform that moves thousands of SKUs a day.",
    about:
      "Rewrote the backend services and API layer of a legacy warehouse platform that moves thousands of SKUs a day.",
    href: "https://jazzba.io/",
    art: { kind: "shot", src: jazzba },
    logo: jazzbaLogo,
    tone: "#ff8a1f",
    lines: jazzbaLines,
  },
];
