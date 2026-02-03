import { TOOLS } from '../../lib/tools'

export default function handler(req, res) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // Add main page
  xml += '  <url>\n'
  xml += `    <loc>${siteUrl}/</loc>\n`
  xml += `    <lastmod>${today}</lastmod>\n`
  xml += '    <changefreq>weekly</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'

  // Add all tools
  Object.entries(TOOLS).forEach(([toolId, tool]) => {
    xml += '  <url>\n'
    xml += `    <loc>${siteUrl}/?tool=${toolId}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
  })

  // Add standalone tool pages
  const standalonePages = [
    'base-converter',
    'base64-converter',
    'color-converter',
    'css-formatter',
    'email-validator',
    'http-header-parser',
    'js-formatter',
    'json-formatter',
    'jwt-decoder',
    'regex-tester',
    'sql-formatter',
    'svg-optimizer',
    'text-toolkit',
    'time-normalizer',
    'unit-converter',
    'url-toolkit',
    'uuid-validator',
    'web-playground',
    'xml-formatter',
    'yaml-formatter'
  ]
  standalonePages.forEach(page => {
    xml += '  <url>\n'
    xml += `    <loc>${siteUrl}/${page}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.9</priority>\n'
    xml += '  </url>\n'
  })

  xml += '</urlset>'

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800')
  res.write(xml)
  res.end()
}
