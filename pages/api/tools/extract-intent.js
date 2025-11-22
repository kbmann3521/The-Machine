const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { input, input_type } = req.body

    if (!input) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an intent extraction AI. Analyze the user's input and determine what they want to accomplish.
Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "intent": "category of what user wants to do",
  "sub_intent": "specific action or transformation",
  "confidence": 0.0-1.0
}

Common intent categories:
- text_analysis: counting, measuring, analyzing text
- text_transformation: changing format, converting case, encoding
- text_cleaning: removing content, cleaning up, normalizing
- data_conversion: converting between formats (JSON, CSV, Base64, URL, HTML, etc.)
- pattern_matching: finding, validating, testing patterns with regex
- code_formatting: beautifying or minifying code (HTML, JSON, XML, etc.)
- image_processing: resizing, compressing, converting images
- developer_tools: debugging, inspecting, decoding (JWT, URL parsing, etc.)
- content_generation: creating or generating new content
- security_crypto: hashing, encryption, checksums`,
        },
        {
          role: 'user',
          content: `Input type: ${input_type || 'text'}\nInput: ${input.substring(0, 1000)}`,
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
      intent = {
        intent: 'text_analysis',
        sub_intent: 'general_analysis',
        confidence: 0.5,
      }
    }

    res.status(200).json(intent)
  } catch (error) {
    console.error('Intent extraction error:', error)
    res.status(500).json({ error: error.message })
  }
}
