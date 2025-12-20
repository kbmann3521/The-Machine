/**
 * Fetch SEO settings server-side
 * Use in getServerSideProps to ensure metadata is available at render time
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function fetchSeoSettings() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !seoSettings) {
      console.warn('Failed to fetch SEO settings:', error?.message)
      return {}
    }

    return seoSettings
  } catch (err) {
    console.error('Error fetching SEO settings:', err)
    return {}
  }
}

/**
 * Get default server-side props with SEO settings
 * Use this in pages that need SEO metadata
 *
 * Example:
 * export async function getServerSideProps() {
 *   return withSeoSettings()
 * }
 */
export async function withSeoSettings(customProps = {}) {
  const seoSettings = await fetchSeoSettings()

  return {
    props: {
      seoSettings,
      ...customProps,
    },
  }
}
