import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "localhost"],
  experimental: {
    proxyClientMaxBodySize: "200mb",
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
