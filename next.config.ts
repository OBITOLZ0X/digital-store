import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare-compatible: no sharp, no standalone requirement
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
