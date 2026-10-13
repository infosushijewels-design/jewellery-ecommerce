import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      // Supabase Storage — product photos, gallery images, logos, avatars uploaded via Admin.
      { protocol: 'https', hostname: 'frlyjqyqbjxgorglvbdl.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Some product rows still carry Unsplash placeholder URLs (see ProductCard's getOptimizedImageUrl).
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
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
