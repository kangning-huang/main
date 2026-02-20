import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/main",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
