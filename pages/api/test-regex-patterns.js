import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, pattern, patternDescription, patternName, matchedSubstrings, inputText } = req.body

  try {
    if (action === 'generate') {
      const generatedText = await generateExampleText(patternName, patternDescription)
      return res.status(200).json({ text: generatedText })
    }

    if (action === 'analyze') {
      const analysis = await analyzeMatches(
        patternName,
        patternDescription,
        pattern,
        inputText,
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

async function generateExampleText(patternName, patternDescription) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Generate ONE SHORT example of text containing: ${patternDescription}

Requirements:
- Keep it brief (1-3 lines)
- Make it realistic and practical
- Only output the example text, nothing else
- No explanations or extra text`,
      },
    ],
  })

  return response.choices[0].message.content.trim()
}

async function analyzeMatches(templateName, templateDescription, regex, inputTextSnippet, matchedSubstrings) {
  const matchesList = matchedSubstrings
    .map((m, i) => `${i + 1}. "${m}"`)
    .join('\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `You are reviewing a regular expression as a starting template, not as a strict validator.

Template name: ${templateName}
Intended purpose: ${templateDescription}
Regex pattern:
/${regex}/

Input text (excerpt):
${inputTextSnippet}

Matched substrings:
${matchesList}

Please provide brief, practical feedback covering the following points:

What parts of the matches look correct or reasonable for the stated purpose

Any suspicious matches or likely false positives

Any obvious misses or common cases that might not be captured

Optional suggestions for small, targeted tweaks (do not rewrite the entire regex)

Keep the response concise, technical, and advisory.
Do not declare the regex "correct" or "incorrect"; focus only on observable behavior and common developer expectations.`,
      },
    ],
  })

  return response.choices[0].message.content.trim()
}
