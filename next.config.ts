import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // keep the dev badge clear of the navbar's menu button
  devIndicators: { position: "bottom-left" },
  // 92 is for app screenshots, where text and UI edges blur at the default 75
  images: { qualities: [75, 92] },
};

export default nextConfig;
