import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/stores',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/new-arrivals',
        destination: '/collections',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
