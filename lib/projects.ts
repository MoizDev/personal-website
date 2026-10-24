import type { StaticImageData } from "next/image";
import bricked from "@/assets/projects/bricked-logo.png";
import factful from "@/assets/projects/factful.webp";
import jazzba from "@/assets/projects/jazzba.webp";
import scire from "@/assets/projects/scire.webp";
import watwiki from "@/assets/projects/watwiki-logo.png";
import weekloom from "@/assets/projects/weekloom.webp";
import wmoj from "@/assets/projects/wmoj.webp";

export type Project = {
  name: string;
  year: string;
  blurb: string;
  href: string;
  /** a screenshot that fills the card, or a logo for a typeset card */
  art: { kind: "shot"; src: StaticImageData } | { kind: "logo"; src: StaticImageData; tagline: string };
  /** two glow colours for the card's background */
  glow: [string, string];
};

// Order is the order the cards come round in the stack.
export const PROJECTS: Project[] = [
  {
    name: "Factful",
    year: "2022",
    blurb: "Co-founded an AI startup that checks essay claims against real sources. Piloting with Seneca College.",
    href: "https://factful.io/",
    art: { kind: "shot", src: factful },
    glow: ["#1b6bff", "#16c47f"],
  },
  {
    name: "Bricked",
    year: "2026",
    blurb: "Won Hack the North 2026. Type an idea, get a LEGO model you can actually build.",
    href: "https://devpost.com/software/a-feuvb1",
    art: { kind: "logo", src: bricked, tagline: "Type an idea, get a LEGO model." },
    glow: ["#ff3b30", "#ffb020"],
  },
  {
    name: "Weekloom",
    year: "2025",
    blurb: "A to-do list laid out like a Gantt chart, so your whole week fits on one screen.",
    href: "https://weekloom.com/",
    art: { kind: "shot", src: weekloom },
    glow: ["#f5a623", "#2f6bff"],
  },
  {
    name: "WMOJ",
    year: "2025",
    blurb: "An online judge that grades C++ and Python in Docker sandboxes, 200+ students at once.",
    href: "https://wmoj.ca/",
    art: { kind: "shot", src: wmoj },
    glow: ["#16c47f", "#0b6e4f"],
  },
  {
    name: "WatWiki",
    year: "2026",
    blurb: "AI agents that turn lecture recordings into shared, linked class notes.",
    href: "https://github.com/MoizDev/wat-wiki",
    art: { kind: "logo", src: watwiki, tagline: "Lectures in, class wiki out." },
    glow: ["#e0245e", "#7b4dff"],
  },
  {
    name: "Scire",
    year: "2025",
    blurb: "A tutoring scheduler that grew from a school club into a tool for two school boards.",
    href: "https://app.tutoringapp.ca",
    art: { kind: "shot", src: scire },
    glow: ["#0fa3b1", "#3ddc84"],
  },
  {
    name: "Jazzba",
    year: "2025",
    blurb: "Modernized a legacy warehouse platform that moves thousands of SKUs a day.",
    href: "https://jazzba.io/",
    art: { kind: "shot", src: jazzba },
    glow: ["#c2185b", "#ff8a00"],
  },
];
