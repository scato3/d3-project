import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.upbit.com"], // 외부 이미지 도메인 추가
  },
};

export default nextConfig;
