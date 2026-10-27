import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { thoughts } from "@/lib/thoughts";
import { WRITEUPS } from "@/lib/writeups";

/** Every page Google should know about, served at /sitemap.xml. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, lastModified?: string) => ({
    url: `${SITE.url}${path}`,
    priority,
    ...(lastModified && { lastModified }),
  });
  return [
    page("", 1),
    page("/writeups", 0.8),
    ...WRITEUPS.map((w) => page(`/writeups/${w.meta.slug}`, 0.8)),
    page("/thoughts", 0.4),
    ...thoughts.map((t) => page(`/thoughts/${t.slug}`, 0.4, t.published)),
  ];
}
