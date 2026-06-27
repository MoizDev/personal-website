// Server-only helpers. The API key lives in .env.local (PEXELS_API_KEY) and
// never reaches the client. Everything returns [] on failure so the UI
// degrades gracefully.
const ENDPOINT = "https://api.pexels.com/v1/search";

type Orientation = "square" | "landscape" | "portrait";

async function fetchPexels(
  query: string,
  count: number,
  orientation: Orientation
): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  try {
    const url = `${ENDPOINT}?query=${encodeURIComponent(
      query
    )}&per_page=${count}&orientation=${orientation}`;
    const res = await fetch(url, {
      headers: { Authorization: key },
      next: { revalidate: 86400 }, // cache for a day
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      photos?: {
        src?: {
          medium?: string;
          large?: string;
          landscape?: string;
        };
      }[];
    };
    return (data.photos ?? [])
      .map((p) =>
        orientation === "landscape"
          ? p.src?.landscape ?? p.src?.large
          : p.src?.medium ?? p.src?.large
      )
      .filter((s): s is string => Boolean(s));
  } catch {
    return [];
  }
}

export function getArcImages(
  query = "moody foggy landscape nature mountains forest minimal",
  count = 18
) {
  return fetchPexels(query, count, "square");
}

export function getProjectImages(
  query = "technology software gradient abstract minimal dark",
  count = 8
) {
  return fetchPexels(query, count, "landscape");
}
