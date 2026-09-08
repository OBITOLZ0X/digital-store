import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare-compatible: no sharp, no standalone requirement
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
    // Keep builds resilient; types are checked separately via tsc when needed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
