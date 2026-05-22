import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are served from the Supabase Storage public bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rnaoozvrdhhoedxdasip.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
