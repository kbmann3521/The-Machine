import { supabase, supabaseAdmin } from '../../../lib/supabase-client'
import { getUniqueSlug, generateSlug } from '../../../lib/slug-utils'

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

  // Use service role key to bypass RLS when checking admin status
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

    const { title, slug: customSlug, excerpt, content, status, thumbnail_url } = req.body

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const baseSlug = customSlug || generateSlug(title)
    const slug = await getUniqueSlug(baseSlug)

    const publishedAt = status === 'published' ? new Date().toISOString() : null

    // Use service role key to bypass RLS for server-side operations
    const client = supabaseAdmin || supabase
    const { data, error } = await client.from('blog_posts').insert([
      {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        status: status || 'draft',
        published_at: publishedAt,
        thumbnail_url: thumbnail_url || null,
      },
    ]).select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json(data[0])
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
}
