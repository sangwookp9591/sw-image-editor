import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2uec4r3coj0v1.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "zivo-dev-apn2-uploads.s3.ap-northeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
