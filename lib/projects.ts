import type { PieceId } from "./tangram";

export type Project = {
  /** which tangram piece stands for this project */
  piece: PieceId;
  /** colour + pattern key, see globals.css and PiecePatterns */
  tone: "blue" | "orange" | "yellow" | "green" | "purple" | "pink" | "red";
  pattern: "lines" | "gantt" | "studs" | "code" | "ruled" | "calendar" | "barcode";
  name: string;
  year: string;
  blurb: string;
  href: string;
};

// The biggest pieces go to the biggest things.
export const PROJECTS: Project[] = [
  {
    piece: "L1",
    tone: "blue",
    pattern: "lines",
    name: "Factful",
    year: "2022",
    blurb: "Co-founded an AI startup that checks essay claims against real sources. Piloting with Seneca College.",
    href: "https://factful.io/",
  },
  {
    piece: "L2",
    tone: "orange",
    pattern: "gantt",
    name: "Weekloom",
    year: "2025",
    blurb: "A to-do list laid out like a Gantt chart, so your whole week fits on one screen.",
    href: "https://weekloom.com/",
  },
  {
    piece: "M",
    tone: "yellow",
    pattern: "studs",
    name: "Bricked",
    year: "2026",
    blurb: "Won Hack the North 2026. Type an idea, get a LEGO model you can actually build.",
    href: "https://devpost.com/software/a-feuvb1",
  },
  {
    piece: "Q",
    tone: "green",
    pattern: "code",
    name: "WMOJ",
    year: "2025",
    blurb: "An online judge that grades C++ and Python in Docker sandboxes, 200+ students at once.",
    href: "https://wmoj.ca/",
  },
  {
    piece: "P",
    tone: "purple",
    pattern: "ruled",
    name: "WatWiki",
    year: "2026",
    blurb: "AI agents that turn lecture recordings into shared, linked class notes.",
    href: "https://github.com/MoizDev/wat-wiki",
  },
  {
    piece: "S1",
    tone: "pink",
    pattern: "calendar",
    name: "Scire",
    year: "2025",
    blurb: "A tutoring scheduler that grew from a school club into a tool for two school boards.",
    href: "https://app.tutoringapp.ca",
  },
  {
    piece: "S2",
    tone: "red",
    pattern: "barcode",
    name: "Jazzba",
    year: "2025",
    blurb: "Modernized a legacy warehouse platform that moves thousands of SKUs a day.",
    href: "https://jazzba.io/",
  },
];
