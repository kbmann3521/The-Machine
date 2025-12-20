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
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'PUT') {
    return handlePut(req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(req, res) {
  try {
    const { data, error } = await supabase
      .from('blog_custom_css')
      .select('css_content')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(200).json({ css: data?.css_content || '' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function handlePut(req, res) {
  try {
    await verifyAdminAccess(req)

    const { css } = req.body

    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('blog_custom_css')
      .update({
        css_content: css || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select('css_content')
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(200).json({ css: data?.css_content || '' })
  } catch (err) {
    console.error('Error in handlePut:', err)
    res.status(401).json({ error: err.message })
  }
}
