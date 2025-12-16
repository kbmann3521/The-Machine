import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, pattern, patternDescription, patternName, matchedSubstrings } = req.body

  try {
    if (action === 'generate') {
      const generatedText = await generateExampleText(patternDescription)
      return res.status(200).json({ text: generatedText })
    }

    if (action === 'analyze') {
      const analysis = await analyzeMatches(
        patternName,
        patternDescription,
        pattern,
        matchedSubstrings
      )
      return res.status(200).json({ analysis })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Error in test-regex-patterns:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function generateExampleText(patternDescription) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate realistic text where a developer might encounter: ${patternDescription}\nDo not explain anything.`,
      },
    ],
  })

  return response.choices[0].message.content
}

async function analyzeMatches(patternName, patternDescription, pattern, matchedSubstrings) {
  const matchList = matchedSubstrings
    .map((m, i) => `${i + 1}. "${m}"`)
    .join('\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `A regex is intended to: ${patternDescription}

Pattern Name: ${patternName}
Regex: /${pattern}/

Matched substrings:
${matchList}

Please review whether these matches seem reasonable and note any commonly expected edge cases or potential issues. Do not rewrite the regex.`,
      },
    ],
  })

  return response.choices[0].message.content
}
