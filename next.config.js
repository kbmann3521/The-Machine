/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      'localhost:3001',
      '*.projects.builder.codes',
      '*.fly.dev',
      '*.builder.codes',
      '*.builder.io'
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ],
      },
      {
        source: '/api/sitemap',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8'
          }
        ],
      }
    ]
  },
}

module.exports = nextConfig
