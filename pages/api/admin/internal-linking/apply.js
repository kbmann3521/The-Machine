import { supabase, supabaseAdmin } from '../../../../lib/supabase-client'
import { applyRuleToContent, findValidMatches } from '../../../../lib/internal-linking-utils'

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

    // Get all posts that match the status filter
    const { data: posts, error: postsError } = await client
      .from('blog_posts')
      .select('id, title, slug, content, status')
      .in('status', rule.allowed_post_status || ['published'])

    if (postsError) {
      return res.status(400).json({ error: postsError.message })
    }

    // Hard cap: 200 posts per apply action
    if (posts.length > 200) {
      return res.status(400).json({
        error: 'Too many posts affected (>200). Please narrow your phrase.',
        affectedCount: posts.length,
      })
    }

    // Apply rule to each post and track inserts
    let totalInserts = 0
    const appliedPosts = []

    for (const post of posts) {
      const { modifiedContent, insertCount } = applyRuleToContent(post.content, rule)

      if (insertCount > 0) {
        // Update post content
        const { error: updateError } = await client
          .from('blog_posts')
          .update({
            content: modifiedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Failed to update post ${post.id}:`, updateError)
          continue
        }

        // Record insert in audit table
        await client.from('internal_link_inserts').insert([
          {
            rule_id: ruleId,
            post_id: post.id,
            phrase: rule.phrase,
            target_url: rule.target_url,
            inserted_count: insertCount,
          },
        ])

        totalInserts += insertCount
        appliedPosts.push({
          postId: post.id,
          title: post.title,
          slug: post.slug,
          insertCount,
        })
      }
    }

    // Update rule's last_applied_at
    await client
      .from('internal_link_rules')
      .update({ last_applied_at: new Date().toISOString() })
      .eq('id', ruleId)

    return res.status(200).json({
      success: true,
      totalInserts,
      appliedPosts: appliedPosts.length,
      details: appliedPosts,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
