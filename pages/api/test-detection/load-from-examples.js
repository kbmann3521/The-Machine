import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

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

      // Get examples from the tool's getExamples function
      if (toolData.getExamples && typeof toolData.getExamples === 'function') {
        try {
          const examples = toolData.getExamples()

          if (Array.isArray(examples) && examples.length > 0) {
            // Handle examples that might be multi-line (e.g., email validator)
            // Each line or item becomes a separate test case
            examples.forEach(example => {
              if (example && typeof example === 'string') {
                // For multi-line examples, split on newlines and create separate test cases
                // But for most tools, just use the example as-is
                const lines = example.split('\n').filter(line => line.trim())

                // If it's a multi-line example with multiple items, create one test case per item
                // Otherwise use the whole thing as one test case
                if (lines.length > 2) {
                  // Multi-line example - add the whole thing as one test case
                  generatedCases.push({
                    input: example,
                    expected: toolId,
                  })
                } else {
                  // Single/double line - add as-is
                  generatedCases.push({
                    input: example,
                    expected: toolId,
                  })
                }
              }
            })
          }
        } catch (err) {
          console.warn(`Failed to get examples for ${toolId}:`, err.message)
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
