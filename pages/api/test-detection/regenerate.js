import { createClient } from '@supabase/supabase-js'

let supabase = null

try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
} catch (err) {
  console.warn('Supabase client initialization failed')
}

const TOOL_DESCRIPTIONS = {
  'text-toolkit': 'A text rewriting and enhancement tool',
  'clean-text': 'A tool for cleaning and normalizing text (removing extra spaces, trimming, etc.)',
  'ascii-unicode-converter': 'Converts between ASCII and Unicode characters including emojis',
  'caesar-cipher': 'Encrypts and decrypts text using Caesar cipher (shift cipher)',
  'word-frequency-counter': 'Counts and analyzes word frequency in text',
  'js-formatter': 'Formats and beautifies JavaScript code',
  'html-formatter': 'Formats and validates HTML code',
  'markdown-html-formatter': 'Converts between Markdown and HTML formats',
  'xml-formatter': 'Formats and validates XML code',
  'yaml-formatter': 'Formats and validates YAML configuration',
  'sql-formatter': 'Formats and beautifies SQL queries',
  'regex-tester': 'Tests and validates regular expression patterns',
  'json-path-extractor': 'Extracts data from JSON using JSONPath expressions',
  'base64-converter': 'Encodes and decodes Base64 data',
  'url-converter': 'Parses, validates and formats URLs',
  'html-entities-converter': 'Encodes and decodes HTML entities',
  'jwt-decoder': 'Decodes and validates JWT tokens',
  'http-status-lookup': 'Looks up HTTP status codes and their meanings',
  'http-header-parser': 'Parses and validates HTTP headers',
  'ip-validator': 'Validates IPv4 and IPv6 addresses',
  'ip-integer-converter': 'Converts between IP addresses and integer representation',
  'ip-range-calculator': 'Calculates and validates IP address ranges and CIDR notation',
  'color-converter': 'Converts between different color formats (HEX, RGB, HSL, etc.)',
  'svg-optimizer': 'Optimizes and minifies SVG code',
  'number-formatter': 'Formats numbers with separators and decimal precision',
  'base-converter': 'Converts numbers between different bases (binary, hex, octal, etc.)',
  'math-evaluator': 'Evaluates mathematical expressions',
  'checksum-calculator': 'Calculates checksums (MD5, SHA, etc.) for data',
  'file-size-converter': 'Converts between different file size units (KB, MB, GB, etc.)',
  'time-normalizer': 'Normalizes and parses time/date formats',
  'csv-json-converter': 'Converts between CSV and JSON formats',
  'mime-type-lookup': 'Looks up MIME types for file extensions',
  'unit-converter': 'Converts between different measurement units',
  'uuid-validator': 'Validates and generates UUID identifiers',
  'email-validator': 'Validates email addresses',
}

async function generateTestCaseForTool(toolId, toolDescription) {
  const prompt = `You are a test case generator. Generate a single meaningful test input for this tool:

Tool ID: ${toolId}
Tool Description: ${toolDescription}

Generate an appropriate test input that would be typical and useful for testing this tool.
The input should be realistic and demonstrate the tool's functionality well.

Respond with ONLY the test input, nothing else. No quotes, no explanation, just the raw input string.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`OpenAI API error for ${toolId}:`, errorData)
      return null
    }

    const data = await response.json()
    const input = data.choices?.[0]?.message?.content?.trim()

    if (!input) {
      console.warn(`No input generated for ${toolId}`)
      return null
    }

    return input
  } catch (error) {
    console.error(`Error generating input for ${toolId}:`, error.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OpenAI API key not configured' })
  }

  try {
    // Fetch all tools from the database
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id')
      .order('id')

    if (toolsError) {
      console.error('Error fetching tools:', toolsError.message)
      return res.status(500).json({ error: 'Failed to fetch tools' })
    }

    if (!tools || tools.length === 0) {
      return res.status(400).json({ error: 'No tools found in database' })
    }

    const generatedCases = []
    const failedTools = []

    // Generate test cases for each tool
    for (const tool of tools) {
      const toolId = tool.id
      const description = TOOL_DESCRIPTIONS[toolId] || `Tool: ${toolId}`

      const input = await generateTestCaseForTool(toolId, description)

      if (input) {
        generatedCases.push({
          input,
          expected: toolId,
        })
      } else {
        failedTools.push(toolId)
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (generatedCases.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate any test cases',
        failedTools,
      })
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
      failed: failedTools.length,
      failedTools: failedTools.length > 0 ? failedTools : undefined,
    })
  } catch (error) {
    console.error('Error in regenerate endpoint:', error.message)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}
