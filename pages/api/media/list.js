import { supabase, supabaseAdmin } from '../../../lib/supabase-client'

async function verifyAdminAccess(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header')
  }

  const token = authHeader.substring(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    console.error('Token validation error:', error)
    throw new Error('Invalid token')
  }

  const client = supabaseAdmin || supabase
  const { data: adminUsers, error: adminError } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)

  if (adminError) {
    console.error('Admin check query error:', adminError)
    throw new Error(`Admin check failed: ${adminError.message}`)
  }

  if (!adminUsers || adminUsers.length === 0) {
    console.error('User is not an admin:', data.user.id)
    throw new Error('Not an admin user')
  }

  return data.user.id
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = await verifyAdminAccess(req)

    const client = supabaseAdmin || supabase

    const { data, error } = await client
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Media list query error:', error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json(data || [])
  } catch (err) {
    console.error('Media list endpoint error:', err)
    return res.status(401).json({ error: err.message })
  }
}
