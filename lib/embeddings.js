// Keyword-aware embedding generator for better tool matching
// Analyzes text for relevant keywords to create meaningful embeddings
function simpleHashEmbedding(text) {
  const lowerText = text.toLowerCase()
  const embedding = new Array(16).fill(0.5)

  // Keyword mappings for different tool categories with weights
  const keywords = {
    html: {
      keywords: ['html', 'tag', 'element', '<', '>', 'markup', 'dom', 'web', 'css', 'doctype', 'entity', '&lt;', '&gt;', 'beautify html', 'format html'],
      weight: 0.8
    },
    json: {
      keywords: ['json', '{', '}', '[', ']', 'key', 'value', 'stringify', 'parse', 'api', 'data structure', 'beautify json', 'format json'],
      weight: 0.8
    },
    url: {
      keywords: ['url', 'encode', 'decode', 'uri', 'parameter', '?', '&', '%', 'query', 'link', 'href', 'http', 'domain'],
      weight: 0.7
    },
    base64: {
      keywords: ['base64', 'encode', 'decode', 'binary', 'data uri', 'mime', 'b64'],
      weight: 0.7
    },
    markdown: {
      keywords: ['markdown', 'md', 'bold', 'italic', 'heading', 'convert markdown', 'md to html'],
      weight: 0.7
    },
    csv: {
      keywords: ['csv', 'comma', 'delimiter', 'spreadsheet', 'data table', 'convert csv'],
      weight: 0.7
    },
    text: {
      keywords: ['text', 'word', 'character', 'sentence', 'line', 'paragraph', 'count', 'strip', 'reverse', 'slug', 'diff'],
      weight: 0.6
    },
    case: {
      keywords: ['case', 'uppercase', 'lowercase', 'title', 'convert case'],
      weight: 0.6
    },
    regex: {
      keywords: ['regex', 'regular expression', 'pattern', 'match', 'replace pattern'],
      weight: 0.7
    },
    hash: {
      keywords: ['hash', 'md5', 'sha', 'checksum', 'crypto', 'encrypt'],
      weight: 0.7
    },
  }

  // Score based on keyword matches
  let scoreMap = {
    0: 'html',
    1: 'json',
    2: 'url',
    3: 'base64',
    4: 'markdown',
    5: 'csv',
    6: 'text',
    7: 'case',
    8: 'regex',
    9: 'hash'
  }

  Object.entries(keywords).forEach(([category, {keywords: kws, weight}]) => {
    if (kws.some(kw => lowerText.includes(kw))) {
      const idx = Object.values(scoreMap).indexOf(category)
      if (idx >= 0) {
        embedding[idx] += weight
      }
    }
  })

  // Boost based on phrase length (longer queries tend to have more specific intent)
  const wordCount = lowerText.split(/\s+/).filter(w => w).length
  const charCount = lowerText.length

  if (wordCount > 5) {
    embedding[10] = 0.8  // Signal: detailed query
  } else if (wordCount > 2) {
    embedding[10] = 0.6
  }

  embedding[11] = Math.min(1, charCount / 200)

  // For remaining dimensions, use consistent hash for stability
  let hash = 0
  for (let i = 0; i < lowerText.length; i++) {
    hash = ((hash << 5) - hash) + lowerText.charCodeAt(i)
  }
  for (let i = 12; i < embedding.length; i++) {
    embedding[i] = (Math.abs(Math.sin(hash + i)) + 0.5) % 1
  }

  return embedding
}

export async function generateEmbedding(text) {
  try {
    // TODO: Uncomment below after installing openai package (npm install openai)
    // import { OpenAI } from 'openai'
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    // const response = await openai.embeddings.create({
    //   model: 'text-embedding-3-small',
    //   input: text,
    // })
    // return response.data[0].embedding

    // Mock implementation - returns deterministic hash-based embedding
    return simpleHashEmbedding(text)
  } catch (error) {
    console.error('Embedding error:', error)
    return simpleHashEmbedding(text)
  }
}

export function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (normA * normB)
}
