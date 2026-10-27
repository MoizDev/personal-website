import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** robots.txt: crawl everything, and here's the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
