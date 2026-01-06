import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  
  // Allow images from external domains if needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
