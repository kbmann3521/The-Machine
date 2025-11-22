import { generateEmbedding } from '../../lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../lib/tools.js'

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
        // Add intent operations
        if (intent.intent === 'url_operations') {
          contextParts.push('parse, decode, encode, validate, extract components, format')
        } else if (intent.intent === 'code_formatting') {
          contextParts.push('beautify, minify, format, validate, parse')
        } else if (intent.intent === 'data_conversion') {
          contextParts.push('convert, format, parse, validate')
        } else if (intent.intent === 'writing') {
          contextParts.push('analyze, transform, process, count, metrics')
        } else if (intent.intent === 'text_transformation') {
          contextParts.push('encode, decode, case conversion, transformation')
        } else if (intent.intent === 'security_crypto') {
          contextParts.push('hash, encrypt, encode, checksum, crypto')
        } else if (intent.intent === 'pattern_matching') {
          contextParts.push('regex, pattern, validate, match, test')
        }
      }

      // Combine context with the actual input
      if (contextParts.length > 0) {
        embeddingText = contextParts.join(' ') + ' ' + inputText
      }
    }

    const embedding = await generateEmbedding(embeddingText)

    // Also detect input category for relevance boosting
    const inputCategory = await classifyInputForCategory(inputText)

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

        // Apply category boosting as PRIMARY signal for relevance
        if (inputCategory) {
          const toolData = TOOLS[tool.id]
          if (toolData && toolData.category === inputCategory) {
            // Category match is the strongest signal when category is clearly detected
            // Add base score + semantic similarity
            // This ensures category-matched tools rank highest
            similarity = 0.7 + (similarity * 0.3)  // 0.7 base for category match + 0.3 weight for semantic similarity
          }
        }

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
