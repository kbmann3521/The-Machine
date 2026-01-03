/** @type {import('next').NextConfig} */

// Bundle analyzer - run with: npm run analyze
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.fly.dev', '*.builder.codes'],

  // Exclude test files from being built as pages
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Skip building test pages in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
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
  // Explicitly enable SWC minification for best performance
  swcMinify: true,

  // Compress responses with gzip/brotli
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  async headers() {
    return [
      // Cache static assets (JS, CSS) for 1 year (immutable)
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache Next.js static files (.next/static) for 1 year
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts and other assets for 1 year
      {
        source: '/:path*.(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images for 1 year
      {
        source: '/:path*.(png|jpg|jpeg|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // HTML pages: cache for 0 seconds (revalidate on every request)
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
      // API endpoints: cache based on content type
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      }
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
