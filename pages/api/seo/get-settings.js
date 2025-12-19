import { supabase } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Fetch SEO settings
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch SEO settings' })
    }

    res.status(200).json(seoSettings || {})
  } catch (err) {
    console.error('Error fetching SEO settings:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
