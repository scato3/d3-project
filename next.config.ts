import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.upbit.com"], // 외부 이미지 도메인 추가
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://api.upbit.com/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
