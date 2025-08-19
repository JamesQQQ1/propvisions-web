import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Allow production builds even if ESLint finds issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ Allow production builds even if TypeScript has type errors
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;