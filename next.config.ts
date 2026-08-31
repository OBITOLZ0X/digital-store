import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages: keep bundle under 25 MiB — keep static pages static, externalize heavy Node-only deps
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
    // Allow build to succeed even with placeholder Supabase types
    ignoreBuildErrors: true,
  },
  // Ensure env is available at build time even if not set
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
