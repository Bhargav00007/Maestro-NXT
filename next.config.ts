import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

// next.config.js
module.exports = {
  allowedDevOrigins: ['172.24.12.129'],
}

export default nextConfig;
