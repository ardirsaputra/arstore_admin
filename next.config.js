/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any host (for QRIS etc.)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
