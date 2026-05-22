import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are served from the Supabase Storage public bucket.
    // All five fields are set explicitly (per the Next.js docs example) so
    // the Vercel build's config step never sees an undefined field.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rnaoozvrdhhoedxdasip.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
