// Keyword-aware embedding generator for better tool matching
// Analyzes text for relevant keywords to create meaningful embeddings
function simpleHashEmbedding(text) {
  const lowerText = text.toLowerCase()
  const embedding = new Array(16).fill(0.5)

  // Keyword mappings for different tool categories
  const keywords = {
    html: ['html', 'tag', 'element', '<', '>', 'markup', 'dom', 'web', 'css', 'doctype', 'entity', '&lt;', '&gt;'],
    json: ['json', '{', '}', '[', ']', 'key', 'value', 'stringify', 'parse', 'api', 'data structure'],
    url: ['url', 'encode', 'decode', 'uri', 'parameter', '?', '&', '%', 'query', 'link', 'href'],
    base64: ['base64', 'encode', 'decode', 'binary', 'data uri', 'mime'],
    markdown: ['markdown', 'md', '*', '**', '#', '##', '```', 'bold', 'italic', 'heading'],
    text: ['text', 'word', 'character', 'sentence', 'line', 'paragraph', 'count', 'strip', 'reverse', 'slug'],
    format: ['format', 'beautify', 'minify', 'indent', 'spacing', 'whitespace', 'clean'],
    case: ['case', 'uppercase', 'lowercase', 'title', 'convert'],
  }

  // Score based on keyword matches
  if (keywords.html.some(kw => lowerText.includes(kw))) {
    embedding[0] += 0.5  // HTML tools boost
  }
  if (keywords.json.some(kw => lowerText.includes(kw))) {
    embedding[1] += 0.5  // JSON tools boost
  }
  if (keywords.url.some(kw => lowerText.includes(kw))) {
    embedding[2] += 0.4
  }
  if (keywords.base64.some(kw => lowerText.includes(kw))) {
    embedding[3] += 0.4
  }
  if (keywords.markdown.some(kw => lowerText.includes(kw))) {
    embedding[4] += 0.4
  }
  if (keywords.format.some(kw => lowerText.includes(kw))) {
    embedding[5] += 0.3
  }
  if (keywords.case.some(kw => lowerText.includes(kw))) {
    embedding[6] += 0.3
  }

  // Length-based features
  const wordCount = lowerText.split(/\s+/).filter(w => w).length
  const charCount = lowerText.length
  embedding[7] = Math.min(1, wordCount / 100)
  embedding[8] = Math.min(1, charCount / 500)

  // For remaining dimensions, use consistent hash for stability
  let hash = 0
  for (let i = 0; i < lowerText.length; i++) {
    hash = ((hash << 5) - hash) + lowerText.charCodeAt(i)
  }
  for (let i = 9; i < embedding.length; i++) {
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
