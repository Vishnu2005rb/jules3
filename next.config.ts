import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  // Tell Next.js not to bundle these server-side packages
  serverExternalPackages: ['tesseract.js', 'canvas'],
  // Hide the Next.js dev indicator (the "N" badge in the corner)
  devIndicators: false,
  // To handle the secure proxy Host header
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
