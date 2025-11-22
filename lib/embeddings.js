// Advanced pattern detection for better tool matching
function detectInputPatterns(text) {
  const patterns = {
    urlEncoded: /(%[0-9A-Fa-f]{2})+/g.test(text),
    url: /^https?:\/\/|www\./i.test(text),
    json: /[{}\[\]]/.test(text),
    base64: /^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length > 4,
    html: /<[^>]+>/g.test(text),
    xml: /<\?xml|<[a-z]+[^>]*>/i.test(text),
    csv: /^[^,\n]*,[^,\n]*$/m.test(text),
    markdown: /^#+\s|^\*\*|^\*\*|^-\s|^\d+\./m.test(text),
    regex: /^\/.*\/[gimsu]*$|\\[dwsb]|(\[.*\])|(\(.*\))/i.test(text),
    yaml: /^\s*[a-z0-9_-]+:\s/im.test(text),
    timestamp: /^\d{10}(\d{3})?$/.test(text.trim()),
    ipAddress: /^(\d{1,3}\.){3}\d{1,3}$/.test(text),
    jwt: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(text),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text),
  }
  return patterns
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  const matrix = []

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower[i - 1] === aLower[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const maxLen = Math.max(aLower.length, bLower.length)
  return 1 - (matrix[bLower.length][aLower.length] / maxLen)
}

// Keyword-aware embedding generator for better tool matching
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
      keywords: ['url', 'encode', 'decode', 'uri', 'parameter', '?', '&', '%', 'query', 'link', 'href', 'http', 'domain', 'https'],
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
      keywords: ['regex', 'regular expression', 'pattern', 'match', 'replace pattern', '\\d', '\\w', '\\s'],
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
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('[embeddings.js] OpenAI API key not configured, using fallback embedding')
    return simpleHashEmbedding(text)
  }

  // Create abort controller with 30-second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    console.log('[embeddings.js] Calling OpenAI API with direct fetch...')
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit input to avoid token limits
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log('[embeddings.js] API response status:', response.status)

    if (!response.ok) {
      let errorMsg = `API error: ${response.status}`
      try {
        const error = await response.json()
        errorMsg = error.error?.message || errorMsg
      } catch (e) {
        // JSON parse failed, use status-based error
      }
      console.error('[embeddings.js] API error response:', errorMsg)
      throw new Error(errorMsg)
    }

    const data = await response.json()
    console.log('[embeddings.js] API response data:', {
      hasData: !!data.data,
      dataLength: data.data?.length,
      hasEmbedding: !!data.data?.[0]?.embedding,
      embeddingLength: data.data?.[0]?.embedding?.length,
    })

    if (data.data && data.data[0] && data.data[0].embedding) {
      const embedding = data.data[0].embedding
      // Verify we got a valid embedding
      if (Array.isArray(embedding) && embedding.length === 1536) {
        console.log('[embeddings.js] ✅ Valid 1536-dimension embedding returned')
        return embedding
      }
      const msg = `Invalid embedding: expected array of 1536, got ${Array.isArray(embedding) ? embedding.length : typeof embedding}`
      console.error('[embeddings.js]', msg)
      throw new Error(msg)
    }

    throw new Error(`No embedding data in response. Response structure: ${JSON.stringify({ hasData: !!data.data, dataLength: data.data?.length })}`)
  } catch (error) {
    clearTimeout(timeoutId)

    // Distinguish between timeout and other errors
    if (error.name === 'AbortError') {
      console.error('[embeddings.js] ❌ OpenAI API call timed out (30s), using fallback')
    } else {
      console.error('[embeddings.js] ❌ OpenAI embedding error, using fallback:', error.message)
    }

    console.error('[embeddings.js] Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    })

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

export { detectInputPatterns, levenshteinDistance }
