/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Client-side polyfills for node modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify'),
        fs: false,
        '@react-native-async-storage/async-storage': false,
        'web-worker': false,
      };
      
      // Add buffer to providePlugin
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Optimize for large bundles (ZK-SNARK libraries)
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            zk: {
              test: /[\\/]node_modules[\\/](snarkjs|circomlibjs|ffjavascript)[\\/]/,
              name: 'zk-libs',
              chunks: 'all',
              priority: 30,
            },
            crypto: {
              test: /[\\/]node_modules[\\/](crypto-browserify|stream-browserify|buffer)[\\/]/,
              name: 'crypto-polyfills',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }

    // Increase memory for webpack compilation
    if (!dev) {
      config.infrastructureLogging = { level: 'error' };
    }

    return config;
  },
  // Enable static optimization
  output: 'standalone',
  // Optimize images and other assets
  images: {
    unoptimized: true,
  },
  // Reduce bundle analyzer warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig; 