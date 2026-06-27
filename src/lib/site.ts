// Central site config. IMPORTANT: set NEXT_PUBLIC_SITE_URL to your real domain
// (used for canonical URLs, Open Graph, sitemap). Defaults are a placeholder.
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://moizhashmi.com").replace(
    /\/$/,
    ""
  ),
  name: "Moiz Hashmi",
  title: "Moiz Hashmi — software, systems, and the seam between them",
  description:
    "Moiz Hashmi — cs student building at the intersection of applied ml and the infrastructure it runs on. projects, writing, and a bookshelf.",
  twitter: "@moizbuilds",
  author: "Moiz Hashmi",
};
