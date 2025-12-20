import { supabase, supabaseAdmin } from '../../../../lib/supabase-client'

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

    if (req.method === 'GET') {
      return handleGet(req, res)
    } else if (req.method === 'POST') {
      return handlePost(req, res)
    } else if (req.method === 'PUT') {
      return handlePut(req, res)
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res)
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
}

async function handleGet(req, res) {
  try {
    const client = supabaseAdmin || supabase
    
    const { data: rules, error } = await client
      .from('internal_link_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Get stats for each rule
    const rulesWithStats = await Promise.all(
      rules.map(async (rule) => {
        const { count: insertCount } = await client
          .from('internal_link_inserts')
          .select('*', { count: 'exact', head: true })
          .eq('rule_id', rule.id)
          .eq('rolled_back', false)

        const { count: postCount } = await client
          .from('internal_link_inserts')
          .select('post_id', { count: 'exact', head: true })
          .eq('rule_id', rule.id)
          .eq('rolled_back', false)
          .distinct()

        return {
          ...rule,
          stats: {
            totalInserts: insertCount || 0,
            affectedPosts: postCount || 0,
          },
        }
      })
    )

    return res.status(200).json(rulesWithStats)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function handlePost(req, res) {
  try {
    const { phrase, target_url, max_links_per_post, skip_headings, skip_code_blocks, skip_existing_links, skip_first_paragraph, notes } = req.body

    if (!phrase || !phrase.trim()) {
      return res.status(400).json({ error: 'Phrase is required' })
    }

    if (!target_url || !target_url.trim()) {
      return res.status(400).json({ error: 'Target URL is required' })
    }

    const trimmedPhrase = phrase.trim().replace(/\s+/g, ' ')

    if (trimmedPhrase.length < 2 || trimmedPhrase.length > 60) {
      return res.status(400).json({ error: 'Phrase must be between 2 and 60 characters' })
    }

    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('internal_link_rules')
      .insert([
        {
          phrase: trimmedPhrase,
          target_url: target_url.trim(),
          max_links_per_post: max_links_per_post || 1,
          skip_headings: skip_headings !== false,
          skip_code_blocks: skip_code_blocks !== false,
          skip_existing_links: skip_existing_links !== false,
          skip_first_paragraph: skip_first_paragraph === true,
          notes: notes?.trim() || null,
        },
      ])
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json(data[0])
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function handlePut(req, res) {
  try {
    const { id, phrase, target_url, max_links_per_post, skip_headings, skip_code_blocks, skip_existing_links, skip_first_paragraph, is_enabled, notes } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Rule ID is required' })
    }

    const trimmedPhrase = phrase?.trim().replace(/\s+/g, ' ')

    if (trimmedPhrase && (trimmedPhrase.length < 2 || trimmedPhrase.length > 60)) {
      return res.status(400).json({ error: 'Phrase must be between 2 and 60 characters' })
    }

    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('internal_link_rules')
      .update({
        phrase: trimmedPhrase || undefined,
        target_url: target_url?.trim() || undefined,
        max_links_per_post: max_links_per_post || undefined,
        skip_headings: skip_headings !== undefined ? skip_headings : undefined,
        skip_code_blocks: skip_code_blocks !== undefined ? skip_code_blocks : undefined,
        skip_existing_links: skip_existing_links !== undefined ? skip_existing_links : undefined,
        skip_first_paragraph: skip_first_paragraph !== undefined ? skip_first_paragraph : undefined,
        is_enabled: is_enabled !== undefined ? is_enabled : undefined,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Rule not found' })
    }

    return res.status(200).json(data[0])
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Rule ID is required' })
    }

    const client = supabaseAdmin || supabase

    // Check if rule has any non-rolled-back inserts
    const { count: insertCount } = await client
      .from('internal_link_inserts')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', id)
      .eq('rolled_back', false)

    if (insertCount > 0) {
      return res.status(400).json({ error: 'Cannot delete rule with active insertions. Please rollback first.' })
    }

    const { error } = await client
      .from('internal_link_rules')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
