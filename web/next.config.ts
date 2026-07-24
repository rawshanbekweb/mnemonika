import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rasmlarni Vercel Blob'dan ko'rsatish uchun (admin panel media).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
