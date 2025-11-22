import OpenAI from '../../../lib/openaiWrapper.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { input, input_type, category } = req.body

    if (!input) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an intent extraction AI for a developer tools suite. Your job is to determine what OPERATIONS or TRANSFORMATIONS the user might want to perform on their input data.

Focus on what developers typically DO with different data types, not what the content itself represents.

Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "intent": "primary operation category",
  "sub_intent": "specific operation or action",
  "confidence": 0.0-1.0
}

Guidelines by input category:

URL inputs (category: url):
- Intent examples: "url_operations", "text_transformation"
- Sub-intent examples: "parse", "encode", "decode", "extract_components", "validate", "format", "convert"
- DO NOT extract intent as "access website" or "navigate" - focus on technical URL operations

Email inputs (category: email):
- Intent: "validation"
- Sub-intent examples: "validate", "check format", "verify"

Validator inputs (category: validator):
- Intent: "validation"
- Sub-intent examples: "validate", "check", "verify", "test format"

Writing inputs (category: writing):
- Intent: "writing"
- Sub-intent examples: "analyze", "transform", "count_metrics", "process"

Code/JSON inputs (category: code, json):
- Intent: "code_formatting" or "data_conversion"
- Sub-intent examples: "beautify", "minify", "parse", "validate", "convert"

Data inputs (category: data):
- Intent: "data_conversion"
- Sub-intent examples: "format", "parse", "validate", "convert_format"

Common intent categories for developer tools:
- validation: validating format, checking correctness
- writing: text analysis, transformation, processing
- url_operations: parsing, encoding, decoding, validating URLs
- code_formatting: beautifying, minifying, formatting code
- data_conversion: converting between formats
- pattern_matching: testing regex patterns, validating
- security_crypto: hashing, encoding, checksums
- text_transformation: case changes, encoding, decoding`,
        },
        {
          role: 'user',
          content: `Input type: ${input_type || 'text'}\nCategory: ${category || 'unknown'}\nInput: ${input.substring(0, 1000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    let intent = null
    try {
      const jsonStr = response.choices[0].message.content
        .replace(/```json\n?|\n?```/g, '')
        .trim()
      intent = JSON.parse(jsonStr)
    } catch {
      // Fallback intent based on category
      let fallbackIntent, fallbackSubIntent

      if (category === 'writing') {
        fallbackIntent = 'writing'
        fallbackSubIntent = 'text_processing'
      } else if (category === 'url') {
        fallbackIntent = 'url_operations'
        fallbackSubIntent = 'parse'
      } else if (category === 'code' || category === 'json' || category === 'html') {
        fallbackIntent = 'code_formatting'
        fallbackSubIntent = 'format'
      } else if (category === 'data') {
        fallbackIntent = 'data_conversion'
        fallbackSubIntent = 'convert'
      } else {
        fallbackIntent = 'text_transformation'
        fallbackSubIntent = 'process'
      }

      intent = {
        intent: fallbackIntent,
        sub_intent: fallbackSubIntent,
        confidence: 0.5,
      }
    }

    // Ensure category-appropriate intent
    if (category === 'writing' && intent.intent !== 'writing') {
      intent.intent = 'writing'
      intent.confidence = Math.min(1, intent.confidence + 0.2)
    } else if (category === 'url' && intent.intent === 'access website') {
      // Override incorrect "access website" intent for URLs
      intent.intent = 'url_operations'
      intent.sub_intent = 'parse'
      intent.confidence = Math.min(1, intent.confidence * 0.8)
    }

    res.status(200).json(intent)
  } catch (error) {
    console.error('Intent extraction error:', error)
    res.status(500).json({ error: error.message })
  }
}
