import OpenAI from '../../../lib/openaiWrapper.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { input } = req.body

    if (!input) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an input classifier. Analyze the input and determine its type, category, and content summary.
Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "input_type": "text|image|url|code|file",
  "category": "writing|url|code|image|data|email|validator|other",
  "content_summary": "brief description of what this input is"
}

Guidelines:
- input_type determines the data format (text, image, url, code, file)
- category determines the intent/purpose:
  - writing: plain English sentences, paragraphs, essays, articles, natural language text
  - url: web URLs, links, web addresses
  - code: programming code, markup, configuration
  - image: visual content, screenshots
  - data: structured data (JSON, CSV, XML, etc.)
  - email: email addresses (name@domain.com format)
  - validator: IP addresses, UUIDs, domain names, format patterns to validate
  - other: anything else

For plain English text (paragraphs, sentences, articles, essays): use category "writing"
For email addresses: use category "email"
For things that look like validation patterns (IPs, UUIDs, etc.): use category "validator"`,
        },
        {
          role: 'user',
          content: input.substring(0, 1000),
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    let classification = null
    try {
      const jsonStr = response.choices[0].message.content
        .replace(/```json\n?|\n?```/g, '')
        .trim()
      classification = JSON.parse(jsonStr)
    } catch {
      // Fallback classification with specific pattern detection
      const inputLower = input.toLowerCase()
      const inputTrimmed = input.trim()
      let inputType = 'text'
      let category = 'writing'  // Default to writing unless proven otherwise

      // Check for specific patterns first (most specific to least)
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inputTrimmed)) {
        // Email address
        inputType = 'email'
        category = 'email'
      } else if (/^(https?:\/\/|www\.)/i.test(inputTrimmed) || /^data:image/.test(inputTrimmed)) {
        // URL
        inputType = 'url'
        category = 'url'
      } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(inputTrimmed) ||
                 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputTrimmed) ||
                 /^[0-9a-f]{32}$/i.test(inputTrimmed)) {
        // IP address, UUID, or hash - validation patterns
        inputType = 'validator'
        category = 'validator'
      } else if (/[{}\[\]<>]|function|const|let|var|class|import|export/.test(inputTrimmed)) {
        // Code
        inputType = 'code'
        category = 'code'
      } else if (/^[{]|^\[|^<\?xml|^name,|^\w+:\s/m.test(inputTrimmed)) {
        // Structured data
        category = 'data'
      } else if (/[.!?]|[a-z]\s+[a-z]|the\s|and\s|or\s|is\s|a\s|to\s/i.test(inputTrimmed) && inputTrimmed.length > 10) {
        // Plain English text detection: sentences with punctuation, articles, conjunctions
        category = 'writing'
      }

      classification = {
        input_type: inputType,
        category: category,
        content_summary: input.substring(0, 100),
      }
    }

    res.status(200).json(classification)
  } catch (error) {
    console.error('Classification error:', error)
    res.status(500).json({ error: error.message })
  }
}
