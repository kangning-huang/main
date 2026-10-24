import type { NextConfig } from "next";

/**
 * Static export to GitHub Pages (via Cloudflare proxy).
 *
 * trailingSlash: false keeps clean URLs as /research (emits research.html).
 * Trailing-slash and .html aliases are handled by:
 *   1. scripts/seo-static-aliases.mjs (postbuild HTML stubs for /path/ → /path)
 *   2. Cloudflare Redirect Rules (real 301s) — see docs/ops/cloudflare-seo.md
 *
 * next.config redirects/rewrites are not emitted for `output: "export"`.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
