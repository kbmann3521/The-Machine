import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

Disallow: /api/
Disallow: /.next/

Sitemap: https://www.pioneerwebtools.com/api/sitemap`

function RobotsTxt() {
  return null
}

export async function getServerSideProps({ res }) {
  try {
    // Fetch SEO settings from database
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('index_site, robots_txt')
      .eq('id', 1)
      .single()

    let robotsContent

    if (error || !seoSettings) {
      robotsContent = DEFAULT_ROBOTS
    } else if (seoSettings.robots_txt?.trim()) {
      // Use custom robots.txt if user provided one
      robotsContent = seoSettings.robots_txt
    } else if (seoSettings.index_site === false) {
      // If global site indexing is disabled, disallow everything
      robotsContent = `User-agent: *
Disallow: /`
    } else {
      // Use default (Allow /, Disallow structural paths)
      robotsContent = DEFAULT_ROBOTS
    }

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.write(robotsContent)
    res.end()

    return {
      props: {},
    }
  } catch (err) {
    console.error('Error generating robots.txt:', err)
    res.setHeader('Content-Type', 'text/plain')
    res.write(DEFAULT_ROBOTS)
    res.end()

    return {
      props: {},
    }
  }
}

export default RobotsTxt
