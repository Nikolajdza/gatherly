import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gatherly/shared", "@gatherly/api-client"],
};

export default nextConfig;
