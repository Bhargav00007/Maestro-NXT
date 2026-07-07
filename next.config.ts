import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

module.exports = {
  allowedDevOrigins: ['172.24.12.129'],
}

export default nextConfig;
