import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
}

export default nextConfig