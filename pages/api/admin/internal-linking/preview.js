import { supabase, supabaseAdmin } from '../../../../lib/supabase-client'
import { findValidMatches, getRiskWarnings } from '../../../../lib/internal-linking-utils'

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
    const { data: rules, error: ruleError } = await client
      .from('internal_link_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (ruleError || !rules) {
      return res.status(404).json({ error: 'Rule not found' })
    }

    const rule = rules

    // Get all posts that match the status filter
    const { data: posts, error: postsError } = await client
      .from('blog_posts')
      .select('id, title, slug, content, status')
      .in('status', rule.allowed_post_status || ['published'])

    if (postsError) {
      return res.status(400).json({ error: postsError.message })
    }

    // Analyze each post
    const affectedPosts = posts
      .map((post) => {
        const matches = findValidMatches(post.content, rule.phrase, {
          skipHeadings: rule.skip_headings,
          skipCodeBlocks: rule.skip_code_blocks,
          skipExistingLinks: rule.skip_existing_links,
          skipFirstParagraph: rule.skip_first_paragraph,
        })

        if (matches.length === 0) return null

        const linksToInsert = Math.min(matches.length, rule.max_links_per_post)

        // Extract context (1-2 lines around first match)
        let context = ''
        if (matches.length > 0) {
          const matchPos = matches[0].position
          const lineStart = post.content.lastIndexOf('\n', matchPos) + 1
          const lineEnd = post.content.indexOf('\n', matchPos + matches[0].length)
          context = post.content
            .substring(lineStart, lineEnd === -1 ? post.content.length : lineEnd)
            .trim()
            .substring(0, 100)
        }

        return {
          postId: post.id,
          title: post.title,
          slug: post.slug,
          matchCount: matches.length,
          insertCount: linksToInsert,
          context,
        }
      })
      .filter(Boolean)

    // Get risk warnings
    const riskWarnings = getRiskWarnings(rule.phrase, affectedPosts.length, posts.length)

    // Get total posts stat for risk calculation
    const { count: totalPosts } = await client
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    return res.status(200).json({
      rule,
      affectedPostsCount: affectedPosts.length,
      totalInserts: affectedPosts.reduce((sum, p) => sum + p.insertCount, 0),
      affectedPosts: affectedPosts.slice(0, 50), // Limit preview
      totalPreviewResults: affectedPosts.length,
      riskWarnings,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
