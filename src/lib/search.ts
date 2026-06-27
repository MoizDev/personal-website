// Central registry of everything Spotlight can find. Extend this as pages and
// content get built. Each item is either an in-page anchor (scrolls to it) or a
// route (navigates). If both are set, an on-page anchor wins when present.
export type SearchKind = "page" | "section" | "project";

export type SearchItem = {
  id: string;
  title: string;
  /** small label shown on the right, e.g. a grouping like "writing" */
  section?: string;
  /** extra terms to match against */
  keywords?: string[];
  kind: SearchKind;
  /** CSS selector / #id on a page to scroll to */
  anchor?: string;
  /** route to navigate to (optionally with an #anchor) */
  href?: string;
};

export const searchItems: SearchItem[] = [
  {
    id: "home",
    title: "Home",
    kind: "page",
    anchor: "#me",
    keywords: ["main", "start", "moiz", "hashmi"],
  },
  {
    id: "projects",
    title: "Projects",
    kind: "section",
    anchor: "#projects",
    keywords: ["work", "experience", "history"],
  },
  {
    id: "thoughts",
    title: "Drawer of Thoughts",
    section: "writing",
    kind: "page",
    href: "/thoughts",
    keywords: ["blog", "essays", "notes", "writing"],
  },
  {
    id: "bookshelf",
    title: "Bookshelf",
    kind: "page",
    href: "/bookshelf",
    keywords: ["books", "reading"],
  },
  {
    id: "mind",
    title: "My Mind",
    kind: "page",
    href: "/mind",
    keywords: ["ideas", "concepts"],
  },
];
