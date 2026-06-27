import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { thoughts } from "@/lib/thoughts";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/thoughts", "/bookshelf"].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const articleRoutes = thoughts.map((t) => ({
    url: `${SITE.url}/thoughts/${t.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
