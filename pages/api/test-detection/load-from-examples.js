import { createClient } from '@supabase/supabase-js'
import { TOOLS, getToolExample, getToolExampleCount } from '../../../lib/tools'

let supabase = null

try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
} catch (err) {
  console.warn('Supabase client initialization failed')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  try {
    const generatedCases = []

    // Iterate through all tools and extract their examples
    Object.entries(TOOLS).forEach(([toolId, toolData]) => {
      // Skip tools that shouldn't show in recommendations
      if (toolData.show_in_recommendations === false) {
        return
      }

      // Get the number of examples for this tool
      const exampleCount = getToolExampleCount(toolId, {})

      if (exampleCount > 0) {
        // Get each example for this tool
        for (let i = 0; i < exampleCount; i++) {
          try {
            const example = getToolExample(toolId, {}, i)
            if (example && typeof example === 'string') {
              generatedCases.push({
                input: example,
                expected: toolId,
              })
            }
          } catch (err) {
            console.warn(`Failed to get example ${i} for ${toolId}:`, err.message)
          }
        }
      }
    })

    if (generatedCases.length === 0) {
      return res.status(400).json({ error: 'No examples found in tools' })
    }

    // Delete existing test cases
    const { error: deleteError } = await supabase
      .from('test_detection_cases')
      .delete()
      .neq('id', 0) // Delete all rows

    if (deleteError) {
      console.error('Error deleting existing cases:', deleteError.message)
      // Continue anyway, we'll insert the new ones
    }

    // Insert new test cases
    const { data: insertedCases, error: insertError } = await supabase
      .from('test_detection_cases')
      .insert(generatedCases)
      .select()

    if (insertError) {
      console.error('Error inserting test cases:', insertError.message)
      return res.status(500).json({
        error: 'Failed to save test cases to database',
        details: insertError.message,
      })
    }

    return res.status(200).json({
      success: true,
      cases: insertedCases || generatedCases,
      generated: generatedCases.length,
    })
  } catch (error) {
    console.error('Error in load-from-examples endpoint:', error.message)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}
