import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingRoot: process.env.VERCEL ? '/vercel/path0' : undefined,
  },
};

export default process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;
