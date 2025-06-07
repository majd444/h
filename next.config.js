/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  // Disable image optimization for backend-only deployment
  images: {
    unoptimized: true
  },
  // Disable static exports
  trailingSlash: false,
}

module.exports = nextConfig;
