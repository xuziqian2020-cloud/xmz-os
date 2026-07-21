const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  /** XMZADD 20260720 在 HTTP 层将停用的经验库旧地址稳定跳转到知识库。 */
  async redirects() {
    return [
      {
        source: "/experiences",
        destination: "/knowledge",
        permanent: false,
      },
      {
        source: "/projects/:id/experiences",
        destination: "/projects/:id/knowledge",
        permanent: false,
      },
    ];
  },
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
