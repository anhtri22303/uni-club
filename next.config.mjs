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
  // Tối ưu cho SSR/hydration
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
  // Đảm bảo client/server consistency
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"]
    } : false,
  }
}

export default nextConfig
