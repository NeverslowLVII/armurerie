/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    outputFileTracingRoot: process.env.VERCEL ? '/vercel/path0' : undefined
  }
}

module.exports = nextConfig 