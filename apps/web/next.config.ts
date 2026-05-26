import type { NextConfig } from "next";

/**
 * Jarvis OS web app — Phase 0 configuration only.
 * API calls must target services/api-gateway (FastAPI), never agents or OpenClaw directly.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@jarvis/types",
    "@jarvis/logger",
    "@jarvis/config",
    "@jarvis/shared-utils",
  ],
};

export default nextConfig;
