// next.config.mjs
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
  // ✅ Redirect old /favicon.ico requests to the new app/icon.png
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
