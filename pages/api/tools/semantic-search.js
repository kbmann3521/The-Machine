import { generateEmbedding } from '../../../lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Map classifier categories to actual tool categories
function mapToToolCategory(classifierCategory) {
  const mapping = {
    'writing': 'writing',
    'text': 'writing',
    'text-analyze': 'writing',
    'url': 'developer',
    'code': 'developer',
    'json': 'json',
    'html': 'html',
    'image': 'image-transform',
    'crypto': 'crypto',
    'formatting': 'formatter',
    'conversion': 'converter',
    'data': 'converter',
    'validator': 'validator',
    'other': null,
  }
  return mapping[classifierCategory] || classifierCategory
}

// Classify input to get category for boosting
async function classifyInputForCategory(inputText) {
  try {
    const response = await fetch('http://localhost:3000/api/tools/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputText }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.category ? mapToToolCategory(data.category) : null
  } catch (e) {
    console.warn('Classification failed:', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { inputText, category, intent } = req.body

  if (!inputText) {
    return res.status(400).json({ error: 'No input provided' })
  }

  try {
    // Generate embedding based on intent + category context
    // This ensures the embedding reflects what operations the user wants to perform
    // rather than analyzing the content itself

    let embeddingText = inputText

    if (category || intent) {
      // Construct a context-aware embedding text that reflects developer intent
      const contextParts = []

      if (category) {
        contextParts.push(`${category}:`)
      }

      if (intent) {
        // Add INPUT-TYPE-SPECIFIC context (not generic intent operations)
        if (category === 'validator') {
          // Different context based on the specific validator pattern detected
          if (inputText.includes('@') && inputText.includes('.')) {
            // Email pattern
            contextParts.push('email address validation email format email syntax checker')
          } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(inputText.trim())) {
            // IP address pattern
            contextParts.push('IP address validation IP format IPv4 validator')
          } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputText.trim())) {
            // UUID pattern
            contextParts.push('UUID validation GUID format UUID validator')
          } else {
            // Generic validator
            contextParts.push('validate check format verify')
          }
        } else if (intent.intent === 'url_operations') {
          contextParts.push('URL parsing URL decoding URL encoding components')
        } else if (intent.intent === 'code_formatting') {
          contextParts.push('code formatting beautifier minifier syntax')
        } else if (intent.intent === 'data_conversion') {
          contextParts.push('data format conversion transformation')
        } else if (intent.intent === 'writing') {
          contextParts.push('text analysis word count character count metrics')
        } else if (intent.intent === 'text_transformation') {
          contextParts.push('case conversion encoding decoding character transformation')
        } else if (intent.intent === 'security_crypto') {
          contextParts.push('hashing encryption encoding checksum cryptography')
        } else if (intent.intent === 'pattern_matching') {
          contextParts.push('regex pattern matching validation')
        }
      }

      // Combine context with the actual input
      if (contextParts.length > 0) {
        embeddingText = contextParts.join(' ') + ' ' + inputText
      }
    }

    const embedding = await generateEmbedding(embeddingText)

    if (!embedding || embedding.length === 0) {
      return res.status(400).json({ error: 'Failed to generate embedding' })
    }

    // Fetch all tools with embeddings
    const { data: allTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description, embedding')

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message })
    }

    // Parse embeddings (they're stored as strings or JSON) and calculate similarity
    const toolScores = allTools
      .filter(tool => {
        // Only include tools with embeddings
        return tool.embedding && tool.embedding !== null && tool.embedding !== 'null'
      })
      .map(tool => {
        let toolEmbedding

        // Parse embedding if it's a string
        if (typeof tool.embedding === 'string') {
          try {
            toolEmbedding = JSON.parse(tool.embedding)
          } catch (e) {
            console.warn(`Could not parse embedding for ${tool.id}:`, e.message)
            return null
          }
        } else {
          toolEmbedding = tool.embedding
        }

        // Calculate cosine similarity
        if (!Array.isArray(toolEmbedding) || toolEmbedding.length === 0) {
          return null
        }

        let similarity = cosineSimilarity(embedding, toolEmbedding)

        return {
          toolId: tool.id,
          name: tool.name,
          description: tool.description,
          similarity: Math.max(0, Math.min(1, similarity)),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity - a.similarity)

    res.status(200).json({
      success: true,
      results: toolScores.slice(0, 10),
      metadata: {
        embeddingDimensions: embedding.length,
        toolsSearched: allTools.length,
        toolsWithValidEmbeddings: toolScores.length,
      },
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    res.status(500).json({
      error: error.message,
    })
  }
}

function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  const minLength = Math.min(a.length, b.length)
  for (let i = 0; i < minLength; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (normA * normB)
}
