/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora errori TypeScript durante il build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errori ESLint durante il build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig