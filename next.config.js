/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  // @clerk/nextjs@6's ClerkProvider uses a Server Action internally (its
  // "keyless" dev-mode fallback). Server Actions are stable by default in
  // Next 14+, but on this still-Next-13.5 version they're experimental and
  // must be opted into explicitly, or the build fails to compile
  // node_modules/@clerk/nextjs's "use server" module. Remove this flag
  // once the Next 14+ upgrade lands, where it becomes the default.
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
