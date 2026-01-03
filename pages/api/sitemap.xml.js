import { TOOLS } from '../../lib/tools'

export default function handler(req, res) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // Add main page
  xml += '  <url>\n'
  xml += `    <loc>${siteUrl}/</loc>\n`
  xml += '    <lastmod>2024-01-01</lastmod>\n'
  xml += '    <changefreq>weekly</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'

  // Add all tools
  Object.entries(TOOLS).forEach(([toolId, tool]) => {
    xml += '  <url>\n'
    xml += `    <loc>${siteUrl}/?tool=${toolId}</loc>\n`
    xml += '    <lastmod>2024-01-01</lastmod>\n'
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
  })

  xml += '</urlset>'

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800')
  res.write(xml)
  res.end()
}
