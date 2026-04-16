import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // Force single Three.js instance to prevent "Multiple instances" crash
      three: "three",
    },
  },
};

export default nextConfig;
