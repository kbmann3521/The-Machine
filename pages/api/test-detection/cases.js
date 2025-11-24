import { createClient } from '@supabase/supabase-js'

let supabase = null

try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
} catch (err) {
  console.warn('Supabase client initialization failed')
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!supabase) {
        return res.status(200).json({ cases: [] })
      }

      // Add timeout to prevent hanging
      const fetchPromise = supabase
        .from('test_detection_cases')
        .select('*')
        .order('created_at', { ascending: true })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      )

      let data, error
      try {
        ({ data, error } = await Promise.race([fetchPromise, timeoutPromise]))
      } catch (timeoutErr) {
        error = timeoutErr
      }

      if (error) {
        console.debug('Supabase GET error:', error.message)
        // Return empty array as fallback
        return res.status(200).json({ cases: [] })
      }

      return res.status(200).json({ cases: data || [] })
    }

    if (req.method === 'POST') {
      const { input, expected } = req.body

      if (!input || !expected) {
        return res
          .status(400)
          .json({ error: 'Input and expected fields are required' })
      }

      const { data, error } = await supabase
        .from('test_detection_cases')
        .insert([{ input, expected }])
        .select()

      if (error) throw error

      return res.status(201).json({ case: data[0] })
    }

    if (req.method === 'PUT') {
      const { id, input, expected } = req.body

      if (!id || !input || !expected) {
        return res
          .status(400)
          .json({ error: 'ID, input, and expected fields are required' })
      }

      const { data, error } = await supabase
        .from('test_detection_cases')
        .update({ input, expected, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()

      if (error) throw error

      return res.status(200).json({ case: data[0] })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID is required' })
      }

      const { error } = await supabase
        .from('test_detection_cases')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Test detection API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
