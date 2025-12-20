import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if table exists and what's in it
    const { data: allRows, error: allRowsError } = await supabase
      .from('seo_settings')
      .select('*')

    if (allRowsError) {
      return res.status(200).json({
        error: allRowsError.message,
        code: allRowsError.code,
        table_exists: false,
      })
    }

    // Try to get id=1 specifically
    const { data: singleRow, error: singleError } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 1)
      .single()

    return res.status(200).json({
      table_exists: true,
      all_rows_count: allRows?.length || 0,
      all_rows: allRows || [],
      single_row_error: singleError?.message,
      single_row: singleRow || null,
    })
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      table_exists: false,
    })
  }
}
