import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  // Uncomment and set basePath when deploying to a sub-path repo (e.g. /portfolio)
  output: "export",
  // basePath: "/portfolio",
  // images: { unoptimized: true },
};

export default nextConfig;
