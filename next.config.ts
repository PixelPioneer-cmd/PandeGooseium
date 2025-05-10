import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WS_SERVER: process.env.NEXT_PUBLIC_WS_SERVER,
  },
};

export default nextConfig;
