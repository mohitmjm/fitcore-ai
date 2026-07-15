import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets automated verification use an isolated build folder without
  // interrupting a developer's running local preview.
  distDir: process.env.FITCORE_NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;
