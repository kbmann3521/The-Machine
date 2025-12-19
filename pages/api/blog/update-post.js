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

    const { id, title, slug: customSlug, excerpt, content, status, published_at } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' })
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const baseSlug = customSlug || generateSlug(title)
    const slug = await getUniqueSlug(baseSlug, id)

    let publishedAt = published_at
    if (status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString()
    } else if (status === 'draft') {
      publishedAt = null
    }

    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('blog_posts')
      .update({
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        status,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    return res.status(200).json(data[0])
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
}
