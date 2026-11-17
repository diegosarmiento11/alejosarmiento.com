import type { NextConfig } from "next";
import { retiredPillars } from "./src/lib/site";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    // Keeps Next.js security upgrades flowing through `next upgrade --agent`.
    agentUpgrade: "security",
  },
  async redirects() {
    return Object.entries(retiredPillars).map(([from, to]) => ({
      source: `/pilares/${from}`,
      destination: `/pilares/${to}`,
      permanent: true,
    }));
  },
  partialPrefetching: true,
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
