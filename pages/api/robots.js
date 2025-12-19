import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

Disallow: /api/
Disallow: /.next/

Sitemap: https://www.pioneerwebtools.com/api/sitemap`

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed')
  }

  try {
    // Fetch SEO settings from database
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('index_site, robots_txt')
      .eq('id', 1)
      .single()

    if (error || !seoSettings) {
      // Fallback to default robots.txt
      res.setHeader('Content-Type', 'text/plain')
      return res.status(200).send(DEFAULT_ROBOTS)
    }

    let robotsContent

    // If site is not indexed, return noindex/nofollow
    if (seoSettings.index_site === false) {
      robotsContent = `User-agent: *
Disallow: /`
    } else if (seoSettings.robots_txt?.trim()) {
      // Use custom robots.txt if provided
      robotsContent = seoSettings.robots_txt
    } else {
      // Use default
      robotsContent = DEFAULT_ROBOTS
    }

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).send(robotsContent)
  } catch (err) {
    console.error('Error generating robots.txt:', err)
    // Fallback to default
    res.setHeader('Content-Type', 'text/plain')
    res.status(200).send(DEFAULT_ROBOTS)
  }
}
