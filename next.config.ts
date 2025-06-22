import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json", // ← tsconfig 경로 명시!
  },
};

export default nextConfig;
