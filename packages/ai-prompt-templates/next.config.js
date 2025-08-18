/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    return config;
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

module.exports = nextConfig;
