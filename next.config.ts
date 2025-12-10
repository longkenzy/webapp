import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* eslint: {
    // Skip ESLint during production builds on Vercel
    ignoreDuringBuilds: true,
  }, */
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Disable automatic static optimization for dynamic routes
  experimental: {
    // Optimize page loading
    optimizePackageImports: ['lucide-react'],
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Optimize images
  images: {
    domains: [],
    unoptimized: false,
  },

  // Reduce bundle size
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
