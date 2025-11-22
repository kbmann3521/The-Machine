import { generateEmbedding, formatEmbeddingForStorage } from '../../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Category-to-intent operations mapping
// Maps tool categories to the operations users want to perform
const categoryIntentOperations = {
  writing: [
    'analyze text', 'transform text', 'process text', 'convert case', 'count words',
    'count characters', 'clean text', 'format text', 'find and replace', 'extract text',
    'generate slug', 'reverse text', 'sort lines', 'visualize whitespace',
    'strip formatting', 'unescape text', 'expects text input'
  ],
  encoding: [
    'encode text', 'decode text', 'escape special characters', 'unescape characters',
    'convert encoding', 'transform format', 'expects text input'
  ],
  json: [
    'beautify JSON', 'minify JSON', 'format JSON', 'validate JSON', 'parse JSON',
    'indent JSON', 'compact JSON', 'extract JSON path', 'analyze JSON structure',
    'expects JSON text input'
  ],
  html: [
    'format HTML', 'beautify HTML', 'minify HTML', 'validate HTML', 'parse HTML',
    'convert HTML entities', 'decode HTML entities', 'strip HTML tags', 'prettify HTML',
    'expects HTML text input'
  ],
  developer: [
    'parse data', 'decode data', 'validate format', 'extract components', 'analyze structure',
    'test regex patterns', 'test cron expressions', 'lookup HTTP status codes', 'lookup MIME types',
    'parse HTTP headers', 'validate UUID format', 'extract JSON paths', 'expects text input'
  ],
  crypto: [
    'encode text', 'decode text', 'hash data', 'encrypt data', 'validate checksums',
    'calculate checksums', 'calculate CRC32', 'ROT13 cipher', 'Caesar cipher',
    'decode JWT tokens', 'analyze JSON web tokens', 'expects text input'
  ],
  converter: [
    'convert between formats', 'transform data', 'encode data', 'decode data',
    'convert colors', 'convert timestamps', 'convert CSV to JSON', 'convert JSON to CSV',
    'convert Markdown to HTML', 'convert between number bases', 'convert between units',
    'convert between timezones', 'convert file sizes', 'convert numbers', 'convert IPv4 addresses',
    'convert ASCII to Unicode', 'expects text or numeric input'
  ],
  formatter: [
    'format code', 'beautify code', 'minify code', 'prettify code', 'validate code syntax',
    'parse code', 'format CSS', 'format SQL', 'format XML', 'format YAML',
    'format JavaScript', 'optimize SVG', 'expects code or markup input'
  ],
  validator: [
    'validate format', 'check format correctness', 'verify format', 'test validity',
    'analyze format structure', 'validate email addresses', 'validate IP addresses',
    'validate Markdown files', 'validate data structure', 'expects text input'
  ],
  'image-transform': [
    'resize image', 'scale image', 'transform image dimensions', 'optimize image',
    'convert image format', 'change width and height', 'convert image to Base64',
    'expects image file input'
  ],
  calculator: [
    'calculate IP ranges', 'calculate subnets', 'calculate CIDR blocks', 'analyze IP boundaries',
    'compute network ranges', 'expects numeric input'
  ],
  'text-analyze': [
    'analyze text content', 'extract information', 'count word occurrences', 'calculate text metrics',
    'measure readability scores', 'detect keywords', 'compare text blocks', 'find text differences',
    'analyze word frequency', 'evaluate math expressions', 'expects text input'
  ],
  'text-transform': [
    'format numbers', 'transform numbers', 'add thousand separators', 'parse number formats',
    'apply locale formatting', 'expects numeric or text input'
  ],
}

// Extract intent keywords from tool data
function getToolIntentKeywords(tool, toolData) {
  const keywords = []

  // Get category-based operations
  const category = toolData.category || 'developer'
  const categoryOps = categoryIntentOperations[category] || []
  keywords.push(...categoryOps)

  // Extract from detailed description
  const detailed = toolData.detailedDescription || {}
  if (detailed.howtouse) {
    const actions = detailed.howtouse.join(' ').toLowerCase()
    // Extract common action verbs
    const actionVerbs = [
      'analyze', 'transform', 'convert', 'validate', 'format', 'parse', 'extract',
      'generate', 'beautify', 'minify', 'encode', 'decode', 'count', 'check', 'verify',
      'compare', 'calculate', 'measure', 'optimize', 'resize', 'scale'
    ]
    actionVerbs.forEach(verb => {
      if (actions.includes(verb) && !keywords.includes(verb)) {
        keywords.push(verb)
      }
    })
  }

  // Add name-based operations
  const nameLower = tool.name.toLowerCase()
  if (nameLower.includes('formatter')) {
    const ops = ['format', 'beautify', 'minify', 'prettify']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('converter')) {
    const ops = ['convert', 'transform', 'encode', 'decode']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('validator')) {
    const ops = ['validate', 'check', 'verify', 'test']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('parser')) {
    const ops = ['parse', 'extract', 'analyze', 'decode']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('encoder')) {
    const ops = ['encode', 'decode', 'escape']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('generator')) {
    const ops = ['generate', 'create', 'produce']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }
  if (nameLower.includes('analyzer')) {
    const ops = ['analyze', 'extract', 'measure', 'calculate']
    ops.forEach(op => !keywords.includes(op) && keywords.push(op))
  }

  // Remove duplicates and sort for consistency
  return [...new Set(keywords)]
}

// Get expected input types for the embedding context
function getExpectedInputsText(toolData) {
  if (!toolData.inputTypes || toolData.inputTypes.length === 0) {
    return 'text input'
  }
  return toolData.inputTypes.map(type => {
    if (type === 'text') return 'text input'
    if (type === 'image') return 'image input'
    return `${type} input`
  }).join(', ')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Add authentication check
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    res.setHeader('Content-Type', 'application/json')
    res.write('{"status":"generating","progress":0}\n')

    const { data: supabaseTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description')

    if (fetchError || !supabaseTools) {
      return res
        .status(400)
        .json({ error: 'Failed to fetch tools from Supabase' })
    }

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    for (let i = 0; i < supabaseTools.length; i++) {
      const tool = supabaseTools[i]

      try {
        const toolData = TOOLS[tool.id]

        if (!toolData) {
          results.skipped++
          continue
        }

        const detailedDesc = toolData.detailedDescription || {}

        // Get intent-aware keywords for this tool
        const intentKeywords = getToolIntentKeywords(tool, toolData)
        const intentPhrase = intentKeywords.join(', ')

        // Get expected input types
        const expectedInputs = getExpectedInputsText(toolData)

        // Boost category signal by repeating it for tools that need it
        const categoryBoost = toolData.category === 'writing' ? `${toolData.category} ${toolData.category} ${toolData.category}` : toolData.category

        // Build embedding text with intent operations and input expectations
        const embeddingText = [
          tool.name,
          tool.description,
          // Add expected inputs prominently
          `expects: ${expectedInputs}`,
          // Add intent operations prominently
          `operations: ${intentPhrase}`,
          // Add category boost
          categoryBoost,
          // Add detailed context
          detailedDesc.overview,
          detailedDesc.howtouse?.join(' '),
          detailedDesc.features?.join(' '),
          detailedDesc.usecases?.join(' '),
          toolData.example,
          toolData.outputType,
        ]
          .filter(Boolean)
          .join(' ')

        const embedding = await generateEmbedding(embeddingText)

        if (!embedding || embedding.length === 0) {
          throw new Error('Empty embedding returned')
        }

        // Verify we got a real embedding (1536 dimensions) not a fallback
        if (embedding.length !== 1536) {
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding.length} (expected 1536)`,
          })
          continue
        }

        // Use SQL function for proper pgvector handling
        let updateError = null
        try {
          const result = await supabase.rpc('update_tool_embedding', {
            tool_id: tool.id,
            embedding_array: embedding,
          })
          updateError = result.error
        } catch (e) {
          updateError = { message: e.message }
        }

        if (updateError) {
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: updateError.message,
          })
        } else {
          results.processed++
        }

        // Rate limiting for OpenAI API (2-3 requests per second)
        await new Promise((resolve) => setTimeout(resolve, 500))

        const progress = Math.round(((i + 1) / supabaseTools.length) * 100)
        res.write(
          JSON.stringify({
            status: 'processing',
            progress,
            processed: results.processed,
            total: supabaseTools.length,
          }) + '\n'
        )
      } catch (error) {
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }
    }

    res.write(
      JSON.stringify({
        status: 'complete',
        ...results,
        total: supabaseTools.length,
      })
    )
    res.end()
  } catch (error) {
    console.error('Embedding generation error:', error)
    res.status(500).json({ error: error.message })
  }
}
