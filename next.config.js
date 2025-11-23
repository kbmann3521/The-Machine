/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark server-only packages as external to prevent bundling warnings
      config.externals = [
        ...(typeof config.externals === 'function' ? [] : config.externals || []),
        'marked',
        'turndown',
        'js-beautify',
        'html-minifier-terser',
      ]
    }
    return config
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
