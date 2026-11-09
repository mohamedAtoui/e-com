import type { NextConfig } from "next";

// Allow Supabase Storage public URLs to be served through next/image.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // A parent lockfile exists in $HOME; pin the workspace root to this project.
  turbopack: { root: __dirname },
  images: {
    // Source objects have UUID names; keep optimized variants across visits.
    minimumCacheTTL: 2592000,
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
