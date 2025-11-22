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
      // Fallback intent
      const fallbackIntent = category === 'writing' ? 'writing' : 'text_analysis'
      intent = {
        intent: fallbackIntent,
        sub_intent: 'general_text_processing',
        confidence: 0.5,
      }
    }

    // Boost confidence for writing category
    if (category === 'writing' && intent.intent !== 'writing') {
      intent.intent = 'writing'
      intent.confidence = Math.min(1, intent.confidence + 0.2)
    }

    res.status(200).json(intent)
  } catch (error) {
    console.error('Intent extraction error:', error)
    res.status(500).json({ error: error.message })
  }
}
