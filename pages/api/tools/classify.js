const OpenAI = require('../../../lib/openaiWrapper')

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
          content: `You are an input classifier. Analyze the input and determine its type and content summary. 
Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "input_type": "text|image|url|code|file",
  "content_summary": "brief description of what this input is"
}

Guidelines:
- text: plain English or natural language text
- image: image data, screenshots, visual content (usually base64 or image URLs)
- url: web URLs, links (http://, https://, www.)
- code: programming code in any language
- file: file data, binary content, structured data formats`,
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
      // Fallback classification
      const inputLower = input.toLowerCase()
      let inputType = 'text'
      if (
        /^(https?:\/\/|www\.)/i.test(input) ||
        /^data:image/.test(input)
      ) {
        inputType = 'url'
      } else if (/[{}\[\]<>]|function|const|let|var|class/.test(input)) {
        inputType = 'code'
      }

      classification = {
        input_type: inputType,
        content_summary: input.substring(0, 100),
      }
    }

    res.status(200).json(classification)
  } catch (error) {
    console.error('Classification error:', error)
    res.status(500).json({ error: error.message })
  }
}
