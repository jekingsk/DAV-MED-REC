/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["davuniversity.org"],
    unoptimized: true,
  },
};

export default nextConfig;
