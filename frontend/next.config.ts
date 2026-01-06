import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone for Docker, default for Render Node runtime
  // output: "standalone", // Uncomment for Docker deployment
  
  // Allow images from external domains if needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
