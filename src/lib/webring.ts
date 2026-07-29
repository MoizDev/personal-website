// UW CS webring membership. Spec and join flow: https://github.com/GuyOnWifi/webring
//
// The ring stores nothing about us except one line of consent — every member site is
// the source of truth for its own entry — so the whole membership lives here:
//
//   1. MANIFEST is served at /.well-known/webring.json. A "uwcs" block at that exact
//      path is the ONLY thing that proves this site is ours; the ring's bot fetches it
//      and merges on that alone. No manifest, no membership.
//   2. <Webring> carries the `data-webring="uwcs"` marker. Displaying it is a condition
//      of membership (the bot nags if it's gone) but it never proves ownership — any
//      page that renders someone else's text could be made to carry the marker.
//   3. `from` below must equal the site URL registered in the ring's
//      members/moizdev.json, minus scheme and trailing slash. hop.html matches it
//      against the live ring index to find our neighbours, and a mismatch fails quietly:
//      hops still work, they just always land on the first member instead of ours.
import { SITE, SOCIALS } from "./site";

const ID = "uwcs";
const HOME = "https://guyonwifi.github.io/webring";

const from = SITE.url
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")
  .toLowerCase();

export const RING = {
  id: ID,
  label: "uw cs webring",
  home: HOME,
  icon: `${HOME}/icon.svg`,
  /** The exact URL to put in the ring's members/moizdev.json. */
  site: `${SITE.url}/`,
  // Neighbours are resolved from the live ring at click time rather than baked in here,
  // which is what lets the ring re-stitch itself as sites join and die. These two URLs
  // never need editing.
  prev: `${HOME}/hop.html?from=${from}&nav=prev`,
  next: `${HOME}/hop.html?from=${from}&nav=next`,
} as const;

// Body of /.well-known/webring.json. Top-level keys are ring namespaces, so joining a
// second ring later means adding a sibling key (and, if it repeats fields, lifting the
// shared ones into a "$shared" block that every ring inherits).
//
// The ring sanitizes what it reads: strings are HTML-stripped and truncated (name 60,
// description 200, up to 8 tags of 24), every URL must be https, and `feed` must sit on
// this origin because the builder fetches it server-side and republishes the contents
// into the ring's planet feed. Relative paths below resolve against RING.site.
export const MANIFEST = {
  [ID]: {
    name: SITE.name,
    description: "i like building the abstractions most people just import.",
    avatar: "/me.webp",
    feed: "/feed.xml",
    program: "CS 2031",
    socials: SOCIALS,
    tags: ["ml", "systems", "cuda", "infra", "startups"],
  },
};
