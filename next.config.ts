import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable automatic static optimization for dynamic routes
  experimental: {
    // Optimize page loading
    optimizePackageImports: ['lucide-react'],
    // Reduce bundle size
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
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
  
  // Disable unnecessary features in development
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce logging in development
    logging: {
      fetches: false,
    },
  }),
};

export default nextConfig;
