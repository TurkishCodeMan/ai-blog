import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/ai-blog",
  images: { unoptimized: true },
};

export default nextConfig;
