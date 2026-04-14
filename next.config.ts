import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["https://preview-chat-a2ce6c38-0f36-44a2-a783-81549334b7f3.space.z.ai"],
};

export default nextConfig;
