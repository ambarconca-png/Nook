import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone Output für minimales Docker-Image.
  output: "standalone",
};

export default nextConfig;
