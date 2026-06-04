import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["framer-motion", "motion-dom", "motion-utils"],
  turbopack: {
    resolveAlias: {
      "motion-utils": "motion-utils/dist/es/index.mjs",
      "motion-dom": "motion-dom/dist/es/index.mjs",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "motion-utils": path.resolve(__dirname, "node_modules/motion-utils/dist/es/index.mjs"),
      "motion-dom": path.resolve(__dirname, "node_modules/motion-dom/dist/es/index.mjs"),
    };
    return config;
  },
};

export default nextConfig;
