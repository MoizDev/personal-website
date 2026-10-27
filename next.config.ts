import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // keep the dev badge clear of the navbar's menu button
  devIndicators: { position: "bottom-left" },
  // 92 is for app screenshots, where text and UI edges blur at the default 75
  images: { qualities: [75, 92] },
  // pages from the old site, sent somewhere sensible rather than a 404
  async redirects() {
    return [
      { source: "/bookshelf", destination: "/", permanent: true },
      { source: "/feed.xml", destination: "/thoughts", permanent: true },
    ];
  },
};

export default nextConfig;
