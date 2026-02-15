import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for better-sqlite3 native module
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
