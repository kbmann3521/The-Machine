import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from headers
    const token = req.headers.authorization?.split('Bearer ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Create Supabase client with auth context from token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // RLS policies will check auth.uid() automatically
    // Fetch SEO settings - RLS will enforce admin access
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('SEO settings error:', error)
      return res.status(403).json({ error: 'Not authorized to access SEO settings' })
    }

    res.status(200).json(seoSettings || {})
  } catch (err) {
    console.error('Error fetching SEO settings:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
