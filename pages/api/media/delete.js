import { supabase, supabaseAdmin } from '../../../lib/supabase-client'

async function verifyAdminAccess(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header')
  }

  const token = authHeader.substring(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new Error('Invalid token')
  }

  const client = supabaseAdmin || supabase
  const { data: adminUsers, error: adminError } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)

  if (adminError || !adminUsers || adminUsers.length === 0) {
    throw new Error('Not an admin user')
  }

  return data.user.id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdminAccess(req)

    const { id, path } = req.body

    if (!id || !path) {
      return res.status(400).json({ error: 'ID and path required' })
    }

    const client = supabaseAdmin || supabase

    // Delete from storage
    const { error: deleteError } = await client.storage
      .from('media')
      .remove([path])

    if (deleteError) {
      return res.status(400).json({ error: `Failed to delete file: ${deleteError.message}` })
    }

    // Delete from database
    const { error: dbError } = await client
      .from('media_files')
      .delete()
      .eq('id', id)

    if (dbError) {
      return res.status(400).json({ error: dbError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
}
