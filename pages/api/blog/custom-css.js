import { createServerClient } from '@supabase/ssr'

export default async function handler(req, res) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value,
          }))
        },
      },
    }
  )

  if (req.method === 'GET') {
    return handleGet(supabase, req, res)
  } else if (req.method === 'PUT') {
    return handlePut(supabase, req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(supabase, req, res) {
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

async function handlePut(supabase, req, res) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - no session' })
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single()

    if (adminError || !adminUser) {
      return res.status(403).json({ error: 'Forbidden - not an admin' })
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
    console.error('Error in handlePut:', err)
    res.status(500).json({ error: err.message })
  }
}
