import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from headers if provided (for authenticated requests)
    const token = req.headers.authorization?.split('Bearer ')[1]

    // Create Supabase client - authenticated if token provided
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      },
    })

    // Fetch SEO settings
    // Public read access allowed for page rendering
    // If authenticated, RLS policies will allow updates
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('SEO settings error:', error)
      // Return empty object on error - allows page to render with defaults
      return res.status(200).json({})
    }

    // For public requests, only return non-sensitive fields
    if (!token) {
      // Filter out sensitive fields for public access (if any needed in future)
      // For now, return all since SEO settings are public
    }

    res.status(200).json(seoSettings || {})
  } catch (err) {
    console.error('Error fetching SEO settings:', err)
    res.status(200).json({})
  }
}
