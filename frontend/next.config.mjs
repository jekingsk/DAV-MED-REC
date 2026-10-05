/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["davuniversity.org", "images.unsplash.com", "res.cloudinary.com"],
    unoptimized: true,
  },
  // Automatically proxies API requests to the Render backend service
  // This eliminates CORS issues and keeps all existing relative fetch('/api/...') calls working seamlessly!
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/medical-proofs/:path*",
        destination: `${backendUrl}/medical-proofs/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
