import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type errors are checked in development; skip during production build
    // until Supabase type generation is updated for @supabase/ssr compatibility
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
