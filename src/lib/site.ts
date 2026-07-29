// Central site config. IMPORTANT: set NEXT_PUBLIC_SITE_URL to your real domain
// (used for canonical URLs, Open Graph, sitemap). Defaults are a placeholder.

// One handle, three consumers: the profile link, the Twitter card's `creator`, and the
// webring manifest. They drifted apart once already (the card claimed @moizbuilds while
// the site linked moizhashmi0), so they read from here now.
const X_HANDLE = "moizhashmi0";

// Profile URLs, keyed by the platform names the webring manifest understands
// (github | x | linkedin | instagram | mastodon | bluesky | matrix), so the same
// object can be handed to <SocialLinks> and published in webring.json untouched.
export const SOCIALS = {
  x: `https://x.com/${X_HANDLE}`,
  linkedin: "https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/",
  github: "https://github.com/MoizDev",
} as const;

export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://moizhashmi.com").replace(
    /\/$/,
    ""
  ),
  name: "Moiz Hashmi",
  title: "Moiz Hashmi — software, systems, and the seam between them",
  description:
    "Moiz Hashmi — cs student building at the intersection of applied ml and the infrastructure it runs on. projects, writing, and a bookshelf.",
  twitter: `@${X_HANDLE}`,
  author: "Moiz Hashmi",
};

export const FEED_TITLE = `${SITE.name} - drawer of thoughts`;

/**
 * Page `alternates`, built here rather than inline.
 *
 * Next merges metadata shallowly per field, so a page that declares its own
 * `alternates: { canonical }` replaces the layout's wholesale and silently loses the
 * feed link. Routing every page through this keeps RSS autodiscovery on all of them.
 */
export function alternates(canonical: string) {
  return {
    canonical,
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: FEED_TITLE }],
    },
  };
}
