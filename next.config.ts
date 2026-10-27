import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The read-only course catalog is opened with node:sqlite at request time; ship it with the functions.
  outputFileTracingIncludes: { "/api/**": ["./data/catalog.db"] },
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
