import { supabase, supabaseAdmin } from '../../../../lib/supabase-client'
import { removeLink } from '../../../../lib/internal-linking-utils'

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
  try {
    await verifyAdminAccess(req)

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { ruleId } = req.body

    if (!ruleId) {
      return res.status(400).json({ error: 'Rule ID is required' })
    }

    const client = supabaseAdmin || supabase

    // Get the rule
    const { data: rule, error: ruleError } = await client
      .from('internal_link_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (ruleError || !rule) {
      return res.status(404).json({ error: 'Rule not found' })
    }

    // Get all inserts from this rule that haven't been rolled back
    const { data: inserts, error: insertsError } = await client
      .from('internal_link_inserts')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('rolled_back', false)

    if (insertsError) {
      return res.status(400).json({ error: insertsError.message })
    }

    if (inserts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active inserts to rollback',
        rolledBackCount: 0,
      })
    }

    // Rollback each post
    let rolledBackCount = 0
    const rolledBackPosts = []

    for (const insert of inserts) {
      // Get the post content
      const { data: post, error: postError } = await client
        .from('blog_posts')
        .select('id, title, slug, content')
        .eq('id', insert.post_id)
        .single()

      if (postError || !post) {
        console.error(`Failed to fetch post ${insert.post_id}:`, postError)
        continue
      }

      // Remove links inserted by this rule
      const modifiedContent = removeLink(post.content, insert.phrase, insert.target_url)

      // Only update if content actually changed
      if (modifiedContent !== post.content) {
        const { error: updateError } = await client
          .from('blog_posts')
          .update({
            content: modifiedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Failed to rollback post ${post.id}:`, updateError)
          continue
        }

        // Mark insert as rolled back
        await client
          .from('internal_link_inserts')
          .update({ rolled_back: true, updated_at: new Date().toISOString() })
          .eq('id', insert.id)

        rolledBackCount++
        rolledBackPosts.push({
          postId: post.id,
          title: post.title,
          slug: post.slug,
        })
      }
    }

    return res.status(200).json({
      success: true,
      rolledBackCount,
      rolledBackPosts,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
