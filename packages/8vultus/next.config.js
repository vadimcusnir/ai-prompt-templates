/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    BRAND_ID: '8vultus',
    NEXT_PUBLIC_BRAND_NAME: '8Vultus',
    NEXT_PUBLIC_BRAND_DOMAIN: '8vultus.com'
  }
}

module.exports = nextConfig
