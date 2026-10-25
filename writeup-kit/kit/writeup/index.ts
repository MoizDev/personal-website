/**
 * Everything a writeup is written with, from one import:
 *
 *   import { Chapter, Code, Diagram, Figure } from "@/writeup";
 *
 * Inside the kit, files import each other by relative path, so the folder can
 * live anywhere; only this barrel is reached through your alias.
 */

export type { Section, Writeup, WriteupMeta } from "./types";

// the page around an article
export { WriteupPage } from "./page/WriteupPage";
export { THEME_SCRIPT, toggleTheme } from "./page/theme";
export { ThemeButton } from "./page/ThemeButton";

// the parts of an article
export { Beat, Chapter, Chip, Code, Figure, Hood, Pair, Pane, Point, Points, Polaroids, Quote, Shot, Stats, Sub } from "./page/parts";
export { Mosaic, type MosaicItem } from "./page/Mosaic";
export { Turntable } from "./page/Turntable";
export { HeroVideo } from "./page/HeroVideo";
export type { Lang } from "./page/highlight";

// the diagram language, and the pieces to build a new kind of figure
export { Diagram } from "./diagram/Diagram";
export { DiagramError, parse, type DiagramSpec, type Tone } from "./diagram/parse";
export { Icon, hasIcon } from "./diagram/icons";
export { Controls } from "./diagram/Controls";
export { useInView, useReducedMotion, useSequence, type Sequence } from "./diagram/usePlayback";
