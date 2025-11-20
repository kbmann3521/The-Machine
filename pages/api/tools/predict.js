import { generateEmbedding } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText, inputImage } = req.body

    if (!inputText && !inputImage) {
      return res.status(400).json({ error: 'No input provided' })
    }

    let inputContent = inputText || 'image input'
    const lowerInput = inputContent.toLowerCase()

    // Calculate similarity scores for ALL tools based on keyword matching
    const toolScores = Object.entries(TOOLS).map(([toolId, toolData]) => {
      let score = 0.3 // Base score for all tools

      // Image-based tools
      if (inputImage) {
        if (toolId === 'image-resizer' || toolId === 'image-to-base64') {
          score = 0.95
        } else if (toolData.inputTypes?.includes('image')) {
          score = 0.85
        }
      }

      // HTML-related
      if (lowerInput.includes('html') || (lowerInput.includes('<') && lowerInput.includes('>'))) {
        if (['html-formatter', 'html-entities-converter', 'plain-text-stripper', 'markdown-html-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['word-counter', 'case-converter', 'find-replace', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'json-formatter', 'slug-generator', 'reverse-text'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // JSON-related
      if (lowerInput.includes('json') || (lowerInput.includes('{') && lowerInput.includes('}'))) {
        if (['json-formatter', 'json-path-extractor'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // URL-related
      if (lowerInput.includes('http://') || lowerInput.includes('https://') || lowerInput.includes('url') || lowerInput.includes('://')) {
        if (['url-parser', 'url-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['base64-converter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Base64
      if ((lowerInput.match(/^[a-z0-9+/]*={0,2}$/i) && lowerInput.length > 4) || lowerInput.includes('base64') || lowerInput.includes('encode') || lowerInput.includes('decode')) {
        if (['base64-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['url-converter', 'word-counter', 'case-converter', 'plain-text-stripper', 'find-replace', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Regex-related
      if (lowerInput.includes('regex') || lowerInput.includes('pattern') || lowerInput.includes('match')) {
        if (['regex-tester'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['find-replace', 'word-counter', 'text-analyzer', 'plain-text-stripper'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // UUID-related
      if (lowerInput.includes('uuid') || lowerInput.includes('guid') || lowerInput.includes('identifier')) {
        if (['uuid-validator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // CSV-related
      if (lowerInput.includes('csv') || lowerInput.includes('comma')) {
        if (['csv-json-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['json-formatter'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // YAML-related
      if (lowerInput.includes('yaml') || lowerInput.includes('yml') || lowerInput.includes('config')) {
        if (['yaml-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['xml-formatter', 'json-formatter'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // XML-related
      if (lowerInput.includes('xml')) {
        if (['xml-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['html-formatter', 'plain-text-stripper'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Markdown-related
      if (lowerInput.includes('markdown') || lowerInput.includes('.md')) {
        if (['markdown-html-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['html-formatter', 'plain-text-stripper'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Color-related
      if (lowerInput.includes('color') || lowerInput.includes('rgb') || lowerInput.includes('hex') || /^#[0-9a-f]{6}/i.test(lowerInput)) {
        if (['color-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // JWT-related
      if (lowerInput.includes('jwt') || lowerInput.includes('token')) {
        if (['jwt-decoder'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['base64-converter'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Timestamp-related
      if (lowerInput.includes('timestamp') || lowerInput.includes('unix') || /^\d{10}/.test(lowerInput)) {
        if (['timestamp-converter', 'timezone-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Hash-related
      if (lowerInput.includes('hash') || lowerInput.includes('md5') || lowerInput.includes('sha')) {
        if (['checksum-calculator'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }



      // Case-related
      if (lowerInput.includes('case') || lowerInput.includes('uppercase') || lowerInput.includes('lowercase')) {
        if (['case-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['slug-generator'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Reverse-related
      if (lowerInput.includes('reverse')) {
        if (['reverse-text'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }


      // SQL-related
      if (lowerInput.includes('sql')) {
        if (['sql-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // CSS-related
      if (lowerInput.includes('css')) {
        if (['css-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // HTTP-related
      if (lowerInput.includes('http')) {
        if (['http-status-lookup', 'http-header-parser'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // MIME-related
      if (lowerInput.includes('mime')) {
        if (['mime-type-lookup'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Escape-related
      if (lowerInput.includes('escape') || lowerInput.includes('unescape')) {
        if (['escape-unescape'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Sort-related
      if (lowerInput.includes('sort')) {
        if (['sort-lines'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Diff-related
      if (lowerInput.includes('diff') || lowerInput.includes('compare')) {
        if (['text-diff-checker'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Unit conversion-related
      if (lowerInput.includes('unit') || lowerInput.includes('convert')) {
        if (['unit-converter', 'number-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Cron-related
      if (lowerInput.includes('cron')) {
        if (['cron-tester'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // ASCII/Unicode-related
      if (lowerInput.includes('ascii') || lowerInput.includes('unicode')) {
        if (['ascii-unicode-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Binary conversion-related
      if (lowerInput.includes('binary') || lowerInput.includes('hex') || lowerInput.includes('octal')) {
        if (['binary-converter', 'base-converter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Cipher-related
      if (lowerInput.includes('rot13') || lowerInput.includes('cipher') || lowerInput.includes('caesar')) {
        if (['caesar-cipher'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // SVG-related
      if (lowerInput.includes('svg')) {
        if (['svg-optimizer'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Whitespace-related
      if (lowerInput.includes('whitespace') || lowerInput.includes('space')) {
        if (['whitespace-visualizer'].includes(toolId)) {
          score = Math.max(score, 0.95)
        } else if (['remove-extras'].includes(toolId)) {
          score = Math.max(score, 0.75)
        }
      }

      // Math-related
      if (lowerInput.includes('math') || lowerInput.includes('calculate')) {
        if (['math-evaluator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Keyword extraction-related
      if (lowerInput.includes('keyword')) {
        if (['keyword-extractor'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // JavaScript-related
      if (lowerInput.includes('javascript') || lowerInput.includes('minify js') || lowerInput.includes('beautify js')) {
        if (['js-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Minify-related
      if (lowerInput.includes('minify')) {
        if (['js-formatter', 'css-formatter', 'json-formatter'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // Format/beautify-related
      if (lowerInput.includes('beautify') || lowerInput.includes('format')) {
        if (['js-formatter', 'html-formatter', 'json-formatter', 'xml-formatter'].includes(toolId)) {
          score = Math.max(score, 0.85)
        }
      }

      // Email-related
      if (lowerInput.includes('email')) {
        if (['email-validator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // IP-related
      if (lowerInput.includes('ip')) {
        if (['ip-validator', 'ip-to-integer', 'integer-to-ip', 'ip-range-calculator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // IPv4/IPv6-related
      if (lowerInput.includes('ipv4') || lowerInput.includes('ipv6')) {
        if (['ip-validator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }

      // CIDR/Subnet-related
      if (lowerInput.includes('cidr') || lowerInput.includes('subnet')) {
        if (['ip-range-calculator'].includes(toolId)) {
          score = Math.max(score, 0.95)
        }
      }



      return { toolId, score }
    })

    // Generator tools to exclude
    const generatorTools = [
      'random-string-generator',
      'variable-name-generator',
      'function-name-generator',
      'api-endpoint-generator',
      'lorem-ipsum-generator',
      'uuid-generator',
      'hash-generator',
      'password-generator',
      'qr-code-generator',
    ]

    // Sort all tools by similarity score in descending order, excluding generator tools
    const sortedTools = toolScores
      .filter(({ toolId }) => !generatorTools.includes(toolId))
      .sort((a, b) => b.score - a.score)

    // Return all non-generator tools with their scores
    const fallbackTools = sortedTools.map(({ toolId, score }) => ({
      toolId,
      name: TOOLS[toolId].name,
      description: TOOLS[toolId].description,
      similarity: score,
    }))

    res.status(200).json({
      predictedTools: fallbackTools,
      inputContent,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
