/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `domains` still works but is deprecated in favor of the more
    // specific `remotePatterns` (restricts protocol/path, not just host).
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

module.exports = nextConfig;
