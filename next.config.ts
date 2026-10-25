import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Trust exactly one image host, nothing broader.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // The front door: requests to / are answered with a redirect before any
  // HTML is rendered, because / itself has no product page.
  async redirects() {
    return [
      { source: "/", destination: "/restaurant/1", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
