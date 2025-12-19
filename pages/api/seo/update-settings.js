import { supabase } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check authentication
    const token = req.headers.authorization?.split('Bearer ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return res.status(403).json({ error: 'Not an admin' })
    }

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

    // Update SEO settings
    const { error } = await supabase
      .from('seo_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to update SEO settings' })
    }

    res.status(200).json({ success: true, message: 'SEO settings updated successfully' })
  } catch (err) {
    console.error('Error updating SEO settings:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
