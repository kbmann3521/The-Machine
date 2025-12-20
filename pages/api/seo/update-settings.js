import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const settings = req.body

    // Validate canonical_base_url
    if (settings.canonical_base_url) {
      if (!settings.canonical_base_url.startsWith('https://')) {
        return res.status(400).json({ error: 'Canonical base URL must start with https://' })
      }
      if (settings.canonical_base_url.endsWith('/')) {
        return res.status(400).json({ error: 'Canonical base URL should not end with /' })
      }
    }

    // Validate meta description length (warn at 160 chars)
    if (settings.default_description && settings.default_description.length > 160) {
      console.warn(`Meta description is ${settings.default_description.length} chars (recommended: ~160)`)
    }

    // Update SEO settings - RLS will enforce admin access
    const { error } = await supabase
      .from('seo_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(403).json({ error: 'Not authorized to update SEO settings' })
    }

    res.status(200).json({ success: true, message: 'SEO settings updated successfully' })
  } catch (err) {
    console.error('Error updating SEO settings:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
