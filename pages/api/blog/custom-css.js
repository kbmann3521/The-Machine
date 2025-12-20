import { supabase } from '../../../lib/supabase-client'

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
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single()

    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { css } = req.body

    const { data, error } = await supabase
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
    res.status(500).json({ error: err.message })
  }
}
