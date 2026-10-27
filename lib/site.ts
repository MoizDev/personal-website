import { LINKS } from "@/lib/links";

/**
 * Who the site is about and where it lives, for search engines and link previews:
 * the page metadata, the sitemap, robots.txt and the structured data all read from here.
 * The apex domain redirects to www, so www is the one address Google should index.
 */
export const SITE = {
  url: "https://www.moizhashmi.com",
  name: "Moiz Hashmi",
  title: "Moiz Hashmi · Software Engineer",
  description:
    "Moiz Hashmi is a computer science student at the University of Waterloo and an engineer at Arion, building AI-native products like Dr. Rocket, Bricked and Quartermaster.",
  x: "@moizhashmi0",
};

/**
 * The share image (app/opengraph-image.png). A page that sets its own openGraph
 * replaces the whole field and loses the image, so such pages name it again.
 */
export const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Moiz Hashmi" };

/** Profiles that are also Moiz, so Google can tie them to this site. */
export const SAME_AS = [LINKS.github.href, LINKS.linkedin.href, "https://x.com/moizhashmi0"];

/** Who Moiz is, as schema.org data. Google uses it for the name panel in search results. */
export const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE.url,
  image: `${SITE.url}${OG_IMAGE.url}`,
  jobTitle: "Software Engineer",
  worksFor: { "@type": "Organization", name: "Arion", url: "https://arion.nyc" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "University of Waterloo", url: "https://uwaterloo.ca" },
  sameAs: SAME_AS,
};

/** JSON for a <script type="application/ld+json">, with "<" escaped so text can't close the tag. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
