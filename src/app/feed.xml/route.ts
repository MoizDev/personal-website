import { SITE, FEED_TITLE } from "@/lib/site";
import { thoughts } from "@/lib/thoughts";

// RSS for the drawer of thoughts. Feed readers are the obvious audience, but this is
// also what the UW CS webring's planet aggregator pulls (webring.json points `feed`
// here), so it has to stay on this origin and over https — the ring refuses a feed
// hosted anywhere else, since its builder republishes whatever comes back.
export const dynamic = "force-static";

// Only five characters are ever special in XML character data; escaping them by hand
// beats a dependency for a file this small. Ampersand first, or it double-escapes the
// entities the later rules introduce.
function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const description =
    "short essays on software craft, learning, taste, and building at the seam between applied ml and the systems it runs on.";

  // Newest first. Aggregators that sample a feed (the ring reads only the first few
  // items per source) take them in document order, so the order here is what decides
  // which posts reach the planet.
  const items = [...thoughts].sort(
    (a, b) =>
      Date.parse(b.published ?? b.date) - Date.parse(a.published ?? a.date)
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(FEED_TITLE)}</title>
    <link>${xml(SITE.url)}/thoughts</link>
    <description>${xml(description)}</description>
    <language>en</language>
    <atom:link href="${xml(SITE.url)}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map((t) => {
    const url = `${SITE.url}/thoughts/${t.slug}`;
    return `    <item>
      <title>${xml(t.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${new Date(t.published ?? t.date).toUTCString()}</pubDate>
      <description>${xml(t.blurb)}</description>
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
