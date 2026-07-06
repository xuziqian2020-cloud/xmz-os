const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    if (isServer) {
      config.externals = [...config.externals, 'utf-8-validate', 'bufferutil'];
    }
    return config;
  },
};

module.exports = nextConfig;
