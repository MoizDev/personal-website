import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // keep the dev badge clear of the navbar's menu button
  devIndicators: { position: "bottom-left" },
};

export default nextConfig;
