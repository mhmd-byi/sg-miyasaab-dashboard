import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "xlsx", "bcryptjs"],
};

export default nextConfig;
