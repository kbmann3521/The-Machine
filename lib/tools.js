export const TOOLS = {
  'image-resizer': {
    name: 'Image Resizer',
    description: 'Resize images to specific dimensions or scale',
    category: 'image-transform',
    inputTypes: ['image'],
    outputType: 'image',
    configSchema: [
      {
        id: 'resizeMode',
        label: 'Resize Mode',
        type: 'select',
        options: [
          { value: 'dimensions', label: 'Set Dimensions' },
          { value: 'scale', label: 'Scale Percentage' },
          { value: 'maxWidth', label: 'Max Width' },
        ],
        default: 'dimensions',
      },
      {
        id: 'width',
        label: 'Width (pixels)',
        type: 'number',
        placeholder: '800',
        default: 800,
      },
      {
        id: 'height',
        label: 'Height (pixels)',
        type: 'number',
        placeholder: '600',
        default: 600,
      },
      {
        id: 'scalePercent',
        label: 'Scale %',
        type: 'number',
        placeholder: '50',
        default: 50,
      },
      {
        id: 'maintainAspect',
        label: 'Maintain Aspect Ratio',
        type: 'toggle',
        default: true,
      },
      {
        id: 'quality',
        label: 'Quality',
        type: 'select',
        options: [
          { value: '0.6', label: 'Low (60%)' },
          { value: '0.75', label: 'Medium (75%)' },
          { value: '0.9', label: 'High (90%)' },
          { value: '1', label: 'Very High (100%)' },
        ],
        default: '0.9',
      },
    ],
  },
  'word-counter': {
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and lines in text',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'case-converter': {
    name: 'Case Converter',
    description: 'Convert text case: uppercase, lowercase, title case, sentence case',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'caseType',
        label: 'Case Type',
        type: 'select',
        options: [
          { value: 'uppercase', label: 'UPPERCASE' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'titlecase', label: 'Title Case' },
          { value: 'sentencecase', label: 'Sentence case' },
        ],
        default: 'uppercase',
      },
    ],
  },
  'find-replace': {
    name: 'Find & Replace',
    description: 'Find and replace text with optional regex support',
    category: 'text-edit',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'findText',
        label: 'Find',
        type: 'text',
        placeholder: 'Text to find',
        default: '',
      },
      {
        id: 'replaceText',
        label: 'Replace With',
        type: 'text',
        placeholder: 'Replacement text',
        default: '',
      },
      {
        id: 'useRegex',
        label: 'Use Regular Expression',
        type: 'toggle',
        default: false,
      },
      {
        id: 'matchCase',
        label: 'Match Case',
        type: 'toggle',
        default: false,
      },
    ],
  },
  'remove-extras': {
    name: 'Remove Extras',
    description: 'Clean up text: remove blank lines, trim spaces, remove duplicates',
    category: 'text-clean',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'trimSpaces',
        label: 'Trim Leading/Trailing Spaces',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeBlankLines',
        label: 'Remove Blank Lines',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeDuplicateLines',
        label: 'Remove Duplicate Lines',
        type: 'toggle',
        default: false,
      },
      {
        id: 'compressLineBreaks',
        label: 'Compress Multiple Line Breaks',
        type: 'toggle',
        default: false,
      },
    ],
  },
  'text-analyzer': {
    name: 'Text Analyzer',
    description: 'Analyze readability and generate summary statistics',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'analyzeType',
        label: 'Analysis Type',
        type: 'select',
        options: [
          { value: 'readability', label: 'Readability Score' },
          { value: 'stats', label: 'Text Statistics' },
          { value: 'both', label: 'Both' },
        ],
        default: 'both',
      },
    ],
  },
  'base64-encoder': {
    name: 'Base64 Encoder',
    description: 'Encode text to Base64 format',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'base64-decoder': {
    name: 'Base64 Decoder',
    description: 'Decode Base64 text to plain text',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'url-encoder': {
    name: 'URL Encoder',
    description: 'Encode text for use in URLs',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'url-decoder': {
    name: 'URL Decoder',
    description: 'Decode URL-encoded text',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'html-encoder': {
    name: 'HTML Encoder',
    description: 'Encode text to HTML entities',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'html-decoder': {
    name: 'HTML Decoder',
    description: 'Decode HTML entities to text',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'html-minifier': {
    name: 'HTML Minifier',
    description: 'Minify HTML by removing whitespace and comments',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeNewlines',
        label: 'Remove Extra Newlines',
        type: 'toggle',
        default: true,
      },
    ],
  },
  'html-beautifier': {
    name: 'HTML Beautifier',
    description: 'Format and beautify HTML with proper indentation',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'indentSize',
        label: 'Indent Size',
        type: 'select',
        options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' },
        ],
        default: '2',
      },
    ],
  },
  'plain-text-stripper': {
    name: 'Plain Text Stripper',
    description: 'Remove HTML and markdown formatting to get plain text',
    category: 'text-clean',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'stripMarkdown',
        label: 'Strip Markdown',
        type: 'toggle',
        default: true,
      },
      {
        id: 'stripHtml',
        label: 'Strip HTML',
        type: 'toggle',
        default: true,
      },
    ],
  },
  'json-minifier': {
    name: 'JSON Minifier',
    description: 'Minify JSON by removing whitespace',
    category: 'json',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'json-beautifier': {
    name: 'JSON Beautifier',
    description: 'Format and beautify JSON with proper indentation',
    category: 'json',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'indentSize',
        label: 'Indent Size',
        type: 'select',
        options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' },
        ],
        default: '2',
      },
    ],
  },
  'reverse-text': {
    name: 'Reverse Text',
    description: 'Reverse the order of characters in text',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'slug-generator': {
    name: 'Slug Generator',
    description: 'Convert text to URL-friendly slug format',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'separator',
        label: 'Separator',
        type: 'select',
        options: [
          { value: '-', label: 'Hyphen (-)' },
          { value: '_', label: 'Underscore (_)' },
          { value: '', label: 'None' },
        ],
        default: '-',
      },
    ],
  },
}

export function runTool(toolId, inputText, config, inputImage = null) {
  switch (toolId) {
    case 'image-resizer':
      return imageResizer(inputImage, config)
    case 'word-counter':
      return wordCounter(inputText)
    case 'case-converter':
      return caseConverter(inputText, config.caseType)
    case 'find-replace':
      return findReplace(inputText, config)
    case 'remove-extras':
      return removeExtras(inputText, config)
    case 'text-analyzer':
      return textAnalyzer(inputText, config.analyzeType)
    case 'base64-encoder':
      return base64Encoder(inputText)
    case 'base64-decoder':
      return base64Decoder(inputText)
    case 'url-encoder':
      return urlEncoder(inputText)
    case 'url-decoder':
      return urlDecoder(inputText)
    case 'html-encoder':
      return htmlEncoder(inputText)
    case 'html-decoder':
      return htmlDecoder(inputText)
    case 'html-minifier':
      return htmlMinifier(inputText, config)
    case 'html-beautifier':
      return htmlBeautifier(inputText, config)
    case 'plain-text-stripper':
      return plainTextStripper(inputText, config)
    case 'json-minifier':
      return jsonMinifier(inputText)
    case 'json-beautifier':
      return jsonBeautifier(inputText, config)
    case 'reverse-text':
      return reverseText(inputText)
    case 'slug-generator':
      return slugGenerator(inputText, config)
    default:
      throw new Error(`Unknown tool: ${toolId}`)
  }
}

function wordCounter(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const lines = text.split('\n')
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chars = text.length
  const charsNoSpaces = text.replace(/\s/g, '').length
  
  return {
    wordCount: words.length,
    characterCount: chars,
    characterCountNoSpaces: charsNoSpaces,
    sentenceCount: sentences.length,
    lineCount: lines.length,
    paragraphCount: text.split(/\n\n+/).filter(p => p.trim().length > 0).length,
  }
}

function caseConverter(text, caseType) {
  switch (caseType) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'titlecase':
      return text
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    case 'sentencecase':
      return text
        .split(/([.!?]+\s+)/)
        .map((part, i) => {
          if (i % 2 === 1) return part
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join('')
    default:
      return text
  }
}

function findReplace(text, config) {
  const { findText, replaceText, useRegex, matchCase } = config
  
  if (!findText) return text
  
  try {
    if (useRegex) {
      const flags = matchCase ? 'g' : 'gi'
      const regex = new RegExp(findText, flags)
      return text.replace(regex, replaceText)
    } else {
      const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const flags = matchCase ? 'g' : 'gi'
      const regex = new RegExp(escapedFind, flags)
      return text.replace(regex, replaceText)
    }
  } catch (error) {
    return text
  }
}

function removeExtras(text, config) {
  let result = text
  
  if (config.trimSpaces) {
    result = result
      .split('\n')
      .map(line => line.trim())
      .join('\n')
  }
  
  if (config.removeBlankLines) {
    result = result
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')
  }
  
  if (config.removeDuplicateLines) {
    const lines = result.split('\n')
    const seen = new Set()
    result = lines
      .filter(line => {
        if (seen.has(line)) return false
        seen.add(line)
        return true
      })
      .join('\n')
  }
  
  if (config.compressLineBreaks) {
    result = result.replace(/\n\n+/g, '\n\n')
  }
  
  return result
}

function textAnalyzer(text, analyzeType) {
  const result = {}
  
  if (analyzeType === 'readability' || analyzeType === 'both') {
    result.readability = calculateReadability(text)
  }
  
  if (analyzeType === 'stats' || analyzeType === 'both') {
    const stats = wordCounter(text)
    result.statistics = {
      words: stats.wordCount,
      characters: stats.characterCount,
      sentences: stats.sentenceCount,
      lines: stats.lineCount,
      averageWordLength: stats.characterCountNoSpaces / Math.max(stats.wordCount, 1),
      averageWordsPerSentence: stats.wordCount / Math.max(stats.sentenceCount, 1),
    }
  }
  
  return result
}

function calculateReadability(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const syllables = countSyllables(text)
  
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  
  const fleschKincaid = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59
  const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount)
  
  let readabilityLevel = 'Basic'
  if (flesch >= 90) readabilityLevel = 'Very Easy'
  else if (flesch >= 80) readabilityLevel = 'Easy'
  else if (flesch >= 70) readabilityLevel = 'Fairly Easy'
  else if (flesch >= 60) readabilityLevel = 'Standard'
  else if (flesch >= 50) readabilityLevel = 'Fairly Difficult'
  else if (flesch >= 30) readabilityLevel = 'Difficult'
  else readabilityLevel = 'Very Difficult'
  
  return {
    fleschKincaidGrade: Math.max(0, Math.round(fleschKincaid * 10) / 10),
    fleschReadingEase: Math.round(flesch * 10) / 10,
    readabilityLevel,
  }
}

function countSyllables(text) {
  const words = text.toLowerCase().split(/\s+/)
  let totalSyllables = 0

  for (const word of words) {
    let syllableCount = 0
    let previousWasVowel = false

    for (const char of word) {
      const isVowel = 'aeiouy'.includes(char)
      if (isVowel && !previousWasVowel) {
        syllableCount++
      }
      previousWasVowel = isVowel
    }

    if (word.endsWith('e')) syllableCount--
    if (word.endsWith('le') && word.length > 2) syllableCount++

    totalSyllables += Math.max(1, syllableCount)
  }

  return totalSyllables
}

function imageResizer(imageData, config) {
  if (!imageData) {
    throw new Error('No image provided')
  }

  return {
    status: 'ready_to_resize',
    message: 'Image loaded. Configure resize settings above and resize will be applied when you run the tool.',
    config: {
      resizeMode: config.resizeMode || 'dimensions',
      width: config.width || 800,
      height: config.height || 600,
      scalePercent: config.scalePercent || 50,
      maintainAspect: config.maintainAspect !== false,
      quality: parseFloat(config.quality || 0.9),
    },
  }
}

function base64Encoder(text) {
  try {
    return Buffer.from(text).toString('base64')
  } catch (error) {
    throw new Error('Failed to encode to Base64')
  }
}

function base64Decoder(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return Buffer.from(text, 'base64').toString('utf-8')
  } catch (error) {
    return `Error: Invalid Base64 format - ${error.message}`
  }
}

function urlEncoder(text) {
  return encodeURIComponent(text)
}

function urlDecoder(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return decodeURIComponent(text)
  } catch (error) {
    return `Error: Invalid URL-encoded format - ${error.message}`
  }
}

function htmlEncoder(text) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'\/]/g, char => entityMap[char])
}

function htmlDecoder(text) {
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
  }
  let result = text
  Object.keys(entityMap).forEach(entity => {
    result = result.replace(new RegExp(entity, 'g'), entityMap[entity])
  })
  return result
}

function htmlMinifier(text, config) {
  let result = text

  if (config.removeComments !== false) {
    result = result.replace(/<!--[\s\S]*?-->/g, '')
  }

  if (config.removeNewlines !== false) {
    result = result.replace(/>\s+</g, '><')
    result = result.replace(/\s+/g, ' ')
  }

  return result.trim()
}

function htmlBeautifier(text, config) {
  const indent = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2)
  let result = ''
  let indentLevel = 0

  const selfClosingTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i

  text = text.replace(/>\s+</g, '><')

  const stack = []
  let inTag = false
  let tagContent = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '<') {
      inTag = true
      tagContent = '<'
    } else if (char === '>' && inTag) {
      tagContent += '>'
      inTag = false

      const isClosing = tagContent.startsWith('</')
      const tagName = (tagContent.match(/^<\/?(\w+)/) || [])[1] || ''

      if (isClosing) {
        indentLevel = Math.max(0, indentLevel - 1)
        result += indent.repeat(indentLevel) + tagContent + '\n'
        stack.pop()
      } else {
        result += indent.repeat(indentLevel) + tagContent + '\n'
        if (!selfClosingTags.test(tagName) && !tagContent.endsWith('/>')) {
          stack.push(tagName)
          indentLevel++
        }
      }

      tagContent = ''
    } else if (inTag) {
      tagContent += char
    }
  }

  return result.trim()
}

function plainTextStripper(text, config) {
  let result = text

  if (config.stripHtml !== false) {
    result = result.replace(/<[^>]*>/g, '')
  }

  if (config.stripMarkdown !== false) {
    result = result.replace(/[*_~`#\[\]()]+/g, '')
    result = result.replace(/\n\n+/g, '\n')
  }

  result = result.replace(/&amp;/g, '&')
  result = result.replace(/&lt;/g, '<')
  result = result.replace(/&gt;/g, '>')
  result = result.replace(/&quot;/g, '"')
  result = result.replace(/&#39;/g, "'")

  return result.trim()
}

function jsonMinifier(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

function jsonBeautifier(text, config) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = JSON.parse(text)
    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(parsed, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

function reverseText(text) {
  return text.split('').reverse().join('')
}

function slugGenerator(text, config) {
  const separator = config.separator || '-'
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, separator)
    .replace(new RegExp(`${separator}+`, 'g'), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '')
}
