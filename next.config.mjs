/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Headers để fix Google OAuth CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ],
      },
    ]
  },
  // Tối ưu cho SSR/hydration
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
    // Enable faster navigation
    optimisticClientCache: true,
  },
  // Đảm bảo client/server consistency
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"]
    } : false,
  }
}

export default nextConfig
