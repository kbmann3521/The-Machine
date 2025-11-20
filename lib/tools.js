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
  'base64-converter': {
    name: 'Base64 Converter',
    description: 'Encode or decode Base64 text',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode to Base64' },
          { value: 'decode', label: 'Decode from Base64' },
        ],
        default: 'encode',
      },
    ],
  },
  'url-converter': {
    name: 'URL Converter',
    description: 'Encode or decode URL text',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode for URL' },
          { value: 'decode', label: 'Decode from URL' },
        ],
        default: 'encode',
      },
    ],
  },
  'html-entities-converter': {
    name: 'HTML Entities Converter',
    description: 'Encode or decode HTML entities',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode to HTML Entities' },
          { value: 'decode', label: 'Decode HTML Entities' },
        ],
        default: 'encode',
      },
    ],
  },
  'html-formatter': {
    name: 'HTML Formatter',
    description: 'Format HTML: minify or beautify with indentation',
    category: 'html',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'beautify', label: 'Beautify' },
          { value: 'minify', label: 'Minify' },
        ],
        default: 'beautify',
      },
      {
        id: 'indentSize',
        label: 'Indent Size (Beautify)',
        type: 'select',
        options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' },
        ],
        default: '2',
      },
      {
        id: 'removeComments',
        label: 'Remove Comments (Minify)',
        type: 'toggle',
        default: true,
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
  'json-formatter': {
    name: 'JSON Formatter',
    description: 'Format JSON: minify or beautify with indentation',
    category: 'json',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'beautify', label: 'Beautify' },
          { value: 'minify', label: 'Minify' },
        ],
        default: 'beautify',
      },
      {
        id: 'indentSize',
        label: 'Indent Size (Beautify)',
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
  'uuid-generator': {
    name: 'UUID/GUID Generator',
    description: 'Generate unique UUIDs and GUIDs for identifiers',
    category: 'generator',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'version',
        label: 'UUID Version',
        type: 'select',
        options: [
          { value: 'v4', label: 'v4 (Random)' },
          { value: 'v5', label: 'v5 (SHA-1)' },
        ],
        default: 'v4',
      },
      {
        id: 'count',
        label: 'Number of UUIDs',
        type: 'number',
        placeholder: '1',
        default: 1,
      },
    ],
  },
  'regex-tester': {
    name: 'Regex Tester',
    description: 'Test regular expressions with match highlighting and replacement',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'pattern',
        label: 'Regex Pattern',
        type: 'text',
        placeholder: '/pattern/flags',
        default: '',
      },
      {
        id: 'flags',
        label: 'Flags',
        type: 'text',
        placeholder: 'g, i, m, s, etc.',
        default: 'g',
      },
      {
        id: 'replacement',
        label: 'Replacement (optional)',
        type: 'text',
        placeholder: 'Leave empty to find only',
        default: '',
      },
    ],
  },
  'hash-generator': {
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        options: [
          { value: 'md5', label: 'MD5' },
          { value: 'sha1', label: 'SHA-1' },
          { value: 'sha256', label: 'SHA-256' },
          { value: 'sha512', label: 'SHA-512' },
        ],
        default: 'sha256',
      },
    ],
  },
  'timestamp-converter': {
    name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'toReadable', label: 'Timestamp to Date' },
          { value: 'toTimestamp', label: 'Date to Timestamp' },
        ],
        default: 'toReadable',
      },
    ],
  },
  'password-generator': {
    name: 'Password Generator',
    description: 'Create secure random passwords with custom requirements',
    category: 'generator',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'length',
        label: 'Length',
        type: 'number',
        placeholder: '16',
        default: 16,
      },
      {
        id: 'uppercase',
        label: 'Include Uppercase (A-Z)',
        type: 'toggle',
        default: true,
      },
      {
        id: 'lowercase',
        label: 'Include Lowercase (a-z)',
        type: 'toggle',
        default: true,
      },
      {
        id: 'numbers',
        label: 'Include Numbers (0-9)',
        type: 'toggle',
        default: true,
      },
      {
        id: 'symbols',
        label: 'Include Symbols (!@#$%)',
        type: 'toggle',
        default: true,
      },
    ],
  },
  'csv-json-converter': {
    name: 'CSV to JSON Converter',
    description: 'Convert between CSV and JSON formats',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'csvToJson', label: 'CSV to JSON' },
          { value: 'jsonToCsv', label: 'JSON to CSV' },
        ],
        default: 'csvToJson',
      },
      {
        id: 'delimiter',
        label: 'Delimiter',
        type: 'select',
        options: [
          { value: ',', label: 'Comma (,)' },
          { value: ';', label: 'Semicolon (;)' },
          { value: '\t', label: 'Tab' },
        ],
        default: ',',
      },
    ],
  },
  'markdown-html-converter': {
    name: 'Markdown to HTML',
    description: 'Convert Markdown syntax to HTML',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'xml-formatter': {
    name: 'XML Formatter',
    description: 'Format and beautify XML with indentation or minify',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'beautify', label: 'Beautify' },
          { value: 'minify', label: 'Minify' },
        ],
        default: 'beautify',
      },
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
  'yaml-formatter': {
    name: 'YAML Formatter',
    description: 'Format and beautify YAML configuration files',
    category: 'formatter',
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
        ],
        default: '2',
      },
    ],
  },
  'url-parser': {
    name: 'URL Parser',
    description: 'Extract and analyze URL components',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    description: 'Decode and analyze JSON Web Tokens',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'qr-code-generator': {
    name: 'QR Code Generator',
    description: 'Generate QR codes from text or URLs',
    category: 'generator',
    inputTypes: ['text'],
    outputType: 'image',
    configSchema: [
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { value: '150', label: 'Small (150px)' },
          { value: '300', label: 'Medium (300px)' },
          { value: '500', label: 'Large (500px)' },
        ],
        default: '300',
      },
    ],
  },
  'text-diff-checker': {
    name: 'Text Diff Checker',
    description: 'Compare two text blocks and highlight differences',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'text1',
        label: 'Text 1',
        type: 'textarea',
        placeholder: 'First text to compare',
        default: '',
      },
      {
        id: 'text2',
        label: 'Text 2',
        type: 'textarea',
        placeholder: 'Second text to compare',
        default: '',
      },
    ],
  },
  'color-converter': {
    name: 'Color Converter',
    description: 'Convert between RGB, HEX, and HSL color formats',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'fromFormat',
        label: 'From Format',
        type: 'select',
        options: [
          { value: 'hex', label: 'HEX (#FF0000)' },
          { value: 'rgb', label: 'RGB (255,0,0)' },
          { value: 'hsl', label: 'HSL (0,100%,50%)' },
        ],
        default: 'hex',
      },
    ],
  },
  'checksum-calculator': {
    name: 'Checksum Calculator',
    description: 'Calculate CRC32 and checksums for data validation',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        options: [
          { value: 'crc32', label: 'CRC32' },
          { value: 'checksum', label: 'Simple Checksum' },
          { value: 'adler32', label: 'Adler-32' },
        ],
        default: 'crc32',
      },
    ],
  },
  'escape-unescape': {
    name: 'Escape/Unescape',
    description: 'Escape or unescape special characters in text, JSON, CSV, HTML',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'escape', label: 'Escape' },
          { value: 'unescape', label: 'Unescape' },
        ],
        default: 'escape',
      },
      {
        id: 'format',
        label: 'Format',
        type: 'select',
        options: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'json', label: 'JSON' },
          { value: 'html', label: 'HTML' },
          { value: 'csv', label: 'CSV' },
        ],
        default: 'javascript',
      },
    ],
  },
  'sort-lines': {
    name: 'Sort Lines',
    description: 'Sort text lines alphabetically, reverse, or by length',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'order',
        label: 'Sort Order',
        type: 'select',
        options: [
          { value: 'asc', label: 'Ascending (A-Z)' },
          { value: 'desc', label: 'Descending (Z-A)' },
          { value: 'length', label: 'By Length (Short to Long)' },
        ],
        default: 'asc',
      },
      {
        id: 'removeDuplicates',
        label: 'Remove Duplicates',
        type: 'toggle',
        default: false,
      },
    ],
  },
  'whitespace-visualizer': {
    name: 'Whitespace Visualizer',
    description: 'Show spaces, tabs, newlines, and other whitespace characters visually',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'ascii-unicode-converter': {
    name: 'ASCII/Unicode Converter',
    description: 'Convert between ASCII codes, Unicode, and text characters',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'toCode', label: 'Text to ASCII/Unicode Codes' },
          { value: 'toText', label: 'Codes to Text' },
        ],
        default: 'toCode',
      },
    ],
  },
  'punycode-converter': {
    name: 'Punycode Converter',
    description: 'Encode or decode Punycode for internationalized domain names',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode to Punycode' },
          { value: 'decode', label: 'Decode from Punycode' },
        ],
        default: 'encode',
      },
    ],
  },
  'binary-converter': {
    name: 'Binary Converter',
    description: 'Convert between binary, hexadecimal, octal, and decimal numbers',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'fromBase',
        label: 'From Base',
        type: 'select',
        options: [
          { value: '2', label: 'Binary (2)' },
          { value: '8', label: 'Octal (8)' },
          { value: '10', label: 'Decimal (10)' },
          { value: '16', label: 'Hexadecimal (16)' },
        ],
        default: '2',
      },
      {
        id: 'toBase',
        label: 'To Base',
        type: 'select',
        options: [
          { value: '2', label: 'Binary (2)' },
          { value: '8', label: 'Octal (8)' },
          { value: '10', label: 'Decimal (10)' },
          { value: '16', label: 'Hexadecimal (16)' },
        ],
        default: '10',
      },
    ],
  },
  'rot13-cipher': {
    name: 'ROT13 Cipher',
    description: 'Encode or decode text using ROT13 simple letter rotation',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'caesar-cipher': {
    name: 'Caesar Cipher',
    description: 'Encode or decode text using Caesar cipher with configurable shift',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'shift',
        label: 'Shift Amount',
        type: 'number',
        placeholder: '3',
        default: 3,
      },
    ],
  },
  'css-formatter': {
    name: 'CSS Formatter',
    description: 'Minify or beautify CSS with proper formatting',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'beautify', label: 'Beautify' },
          { value: 'minify', label: 'Minify' },
        ],
        default: 'beautify',
      },
    ],
  },
  'sql-formatter': {
    name: 'SQL Formatter',
    description: 'Format SQL queries with proper indentation and readability',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'http-status-lookup': {
    name: 'HTTP Status Code Lookup',
    description: 'Look up HTTP status codes and their meanings',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'mime-type-lookup': {
    name: 'MIME Type Lookup',
    description: 'Find MIME types by file extension or vice versa',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'extension', label: 'Extension to MIME Type' },
          { value: 'mime', label: 'MIME Type to Extension' },
        ],
        default: 'extension',
      },
    ],
  },
  'http-header-parser': {
    name: 'HTTP Header Parser',
    description: 'Parse and validate HTTP headers',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'uuid-validator': {
    name: 'UUID Validator',
    description: 'Validate if text is a valid UUID format',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'json-path-extractor': {
    name: 'JSON Path Extractor',
    description: 'Extract values from JSON using dot notation paths',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'jsonPath',
        label: 'JSON Path',
        type: 'text',
        placeholder: 'e.g., user.profile.name',
        default: '',
      },
    ],
  },
  'image-to-base64': {
    name: 'Image to Base64',
    description: 'Convert images to Base64 encoded strings',
    category: 'converter',
    inputTypes: ['image'],
    outputType: 'text',
    configSchema: [],
  },
  'svg-optimizer': {
    name: 'SVG Optimizer',
    description: 'Minify and optimize SVG files by removing unnecessary content',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [],
  },
  'unit-converter': {
    name: 'Unit Converter',
    description: 'Convert between length, weight, temperature, speed, and volume units',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'type',
        label: 'Unit Type',
        type: 'select',
        options: [
          { value: 'length', label: 'Length (m, km, ft, mi, etc)' },
          { value: 'weight', label: 'Weight (kg, lb, oz, etc)' },
          { value: 'temperature', label: 'Temperature (C, F, K)' },
          { value: 'speed', label: 'Speed (m/s, km/h, mph)' },
          { value: 'volume', label: 'Volume (L, gal, ml)' },
        ],
        default: 'length',
      },
    ],
  },
  'number-formatter': {
    name: 'Number Formatter',
    description: 'Format numbers with thousand separators, decimals, and locale options',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    configSchema: [
      {
        id: 'decimals',
        label: 'Decimal Places',
        type: 'number',
        placeholder: '2',
        default: 2,
      },
      {
        id: 'separator',
        label: 'Thousand Separator',
        type: 'select',
        options: [
          { value: ',', label: 'Comma (,)' },
          { value: '.', label: 'Period (.)' },
          { value: ' ', label: 'Space ( )' },
          { value: "'", label: 'Apostrophe (\')' },
        ],
        default: ',',
      },
    ],
  },
  'timezone-converter': {
    name: 'Timezone Converter',
    description: 'Convert times between different timezones',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'fromTimezone',
        label: 'From Timezone',
        type: 'text',
        placeholder: 'UTC, EST, PST, etc',
        default: 'UTC',
      },
      {
        id: 'toTimezone',
        label: 'To Timezone',
        type: 'text',
        placeholder: 'UTC, EST, PST, etc',
        default: 'EST',
      },
    ],
  },
  'base-converter': {
    name: 'Base Converter',
    description: 'Convert numbers between different bases (binary, octal, decimal, hex)',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'fromBase',
        label: 'From Base',
        type: 'number',
        placeholder: '10',
        default: 10,
      },
      {
        id: 'toBase',
        label: 'To Base',
        type: 'number',
        placeholder: '16',
        default: 16,
      },
    ],
  },
  'math-evaluator': {
    name: 'Math Expression Evaluator',
    description: 'Safely evaluate and calculate mathematical expressions',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'keyword-extractor': {
    name: 'Keyword Extractor',
    description: 'Extract important keywords and phrases from text',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'count',
        label: 'Number of Keywords',
        type: 'number',
        placeholder: '10',
        default: 10,
      },
    ],
  },
  'cron-tester': {
    name: 'Cron Expression Tester',
    description: 'Validate and explain cron schedule expressions',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [],
  },
  'file-size-converter': {
    name: 'File Size Converter',
    description: 'Convert between bytes, KB, MB, GB, TB file sizes',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    configSchema: [
      {
        id: 'fromUnit',
        label: 'From Unit',
        type: 'select',
        options: [
          { value: 'B', label: 'Bytes (B)' },
          { value: 'KB', label: 'Kilobytes (KB)' },
          { value: 'MB', label: 'Megabytes (MB)' },
          { value: 'GB', label: 'Gigabytes (GB)' },
          { value: 'TB', label: 'Terabytes (TB)' },
        ],
        default: 'MB',
      },
      {
        id: 'toUnit',
        label: 'To Unit',
        type: 'select',
        options: [
          { value: 'B', label: 'Bytes (B)' },
          { value: 'KB', label: 'Kilobytes (KB)' },
          { value: 'MB', label: 'Megabytes (MB)' },
          { value: 'GB', label: 'Gigabytes (GB)' },
          { value: 'TB', label: 'Terabytes (TB)' },
        ],
        default: 'KB',
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
    case 'base64-converter':
      return config.mode === 'decode' ? base64Decoder(inputText) : base64Encoder(inputText)
    case 'url-converter':
      return config.mode === 'decode' ? urlDecoder(inputText) : urlEncoder(inputText)
    case 'html-entities-converter':
      return config.mode === 'decode' ? htmlDecoder(inputText) : htmlEncoder(inputText)
    case 'html-formatter':
      return config.mode === 'minify' ? htmlMinifier(inputText, config) : htmlBeautifier(inputText, config)
    case 'plain-text-stripper':
      return plainTextStripper(inputText, config)
    case 'json-formatter':
      return config.mode === 'minify' ? jsonMinifier(inputText) : jsonBeautifier(inputText, config)
    case 'reverse-text':
      return reverseText(inputText)
    case 'slug-generator':
      return slugGenerator(inputText, config)
    case 'uuid-generator':
      return uuidGenerator(config)
    case 'regex-tester':
      return regexTester(inputText, config)
    case 'hash-generator':
      return hashGenerator(inputText, config)
    case 'timestamp-converter':
      return timestampConverter(inputText, config)
    case 'password-generator':
      return passwordGenerator(config)
    case 'csv-json-converter':
      return csvJsonConverter(inputText, config)
    case 'markdown-html-converter':
      return markdownToHtml(inputText)
    case 'xml-formatter':
      return xmlFormatter(inputText, config)
    case 'yaml-formatter':
      return yamlFormatter(inputText, config)
    case 'url-parser':
      return urlParser(inputText)
    case 'jwt-decoder':
      return jwtDecoder(inputText)
    case 'qr-code-generator':
      return qrCodeGenerator(inputText, config)
    case 'text-diff-checker':
      return textDiffChecker(inputText, config)
    case 'color-converter':
      return colorConverter(inputText, config)
    case 'checksum-calculator':
      return checksumCalculator(inputText, config)
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

function uuidGenerator(config) {
  const count = Math.min(parseInt(config.count) || 1, 100)
  const uuids = []

  for (let i = 0; i < count; i++) {
    if (config.version === 'v5') {
      uuids.push(generateUUIDv5())
    } else {
      uuids.push(generateUUIDv4())
    }
  }

  return uuids.join('\n')
}

function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function generateUUIDv5() {
  return 'xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function regexTester(text, config) {
  const pattern = config.pattern || ''
  const flags = config.flags || 'g'
  const replacement = config.replacement || ''

  if (!pattern) {
    return { error: 'Please enter a regex pattern', matches: [] }
  }

  try {
    const regex = new RegExp(pattern, flags)
    const matches = [...text.matchAll(regex)].map(m => ({
      match: m[0],
      groups: m.slice(1),
      index: m.index,
    }))

    let result = text
    if (replacement && flags.includes('g')) {
      result = text.replace(regex, replacement)
    }

    return {
      pattern,
      flags,
      matchCount: matches.length,
      matches,
      result: replacement ? result : undefined,
    }
  } catch (error) {
    return { error: `Invalid regex: ${error.message}` }
  }
}

function hashGenerator(text, config) {
  const algorithm = config.algorithm || 'sha256'

  try {
    const crypto = require('crypto')
    const hash = crypto.createHash(algorithm).update(text).digest('hex')
    return { algorithm, hash, input: text }
  } catch (error) {
    return { error: 'Hash generation failed', algorithm }
  }
}

function timestampConverter(text, config) {
  const mode = config.mode || 'toReadable'

  try {
    if (mode === 'toReadable') {
      const timestamp = parseInt(text)
      if (isNaN(timestamp)) {
        return { error: 'Invalid timestamp. Please enter a valid Unix timestamp.' }
      }
      const date = new Date(timestamp * 1000)
      return {
        timestamp,
        readable: date.toISOString(),
        local: date.toString(),
      }
    } else {
      const date = new Date(text)
      if (isNaN(date.getTime())) {
        return { error: 'Invalid date format. Please enter a valid date.' }
      }
      return {
        date: text,
        timestamp: Math.floor(date.getTime() / 1000),
        iso: date.toISOString(),
      }
    }
  } catch (error) {
    return { error: error.message }
  }
}

function passwordGenerator(config) {
  const length = Math.min(Math.max(parseInt(config.length) || 16, 8), 256)
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let chars = ''
  if (config.uppercase !== false) chars += uppercase
  if (config.lowercase !== false) chars += lowercase
  if (config.numbers !== false) chars += numbers
  if (config.symbols !== false) chars += symbols

  if (!chars) chars = lowercase

  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return password
}

function csvJsonConverter(text, config) {
  const mode = config.mode || 'csvToJson'
  const delimiter = config.delimiter || ','

  try {
    if (mode === 'csvToJson') {
      const lines = text.trim().split('\n')
      if (lines.length === 0) return '[]'

      const headers = lines[0].split(delimiter).map(h => h.trim())
      const result = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim())
        const obj = {}
        headers.forEach((header, i) => {
          obj[header] = values[i] || ''
        })
        return obj
      })

      return JSON.stringify(result, null, 2)
    } else {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) {
        return { error: 'JSON must be an array of objects' }
      }

      if (data.length === 0) return ''

      const headers = Object.keys(data[0])
      const csv = [headers.join(delimiter)]

      data.forEach(obj => {
        csv.push(headers.map(h => String(obj[h] || '')).join(delimiter))
      })

      return csv.join('\n')
    }
  } catch (error) {
    return { error: error.message }
  }
}

function markdownToHtml(text) {
  let html = text

  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')

  html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>')
  html = html.replace(/__(.*?)__/gm, '<strong>$1</strong>')
  html = html.replace(/_(.*?)_/gm, '<em>$1</em>')

  html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>')

  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'

  return html
}

function xmlFormatter(text, config) {
  const mode = config.mode || 'beautify'
  const indentSize = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2)

  try {
    if (mode === 'minify') {
      return text.replace(/>\s+</g, '><').trim()
    } else {
      let formatted = ''
      let indent = 0
      const lines = text.replace(/>\s+</g, '><').split('><')

      lines.forEach((line, i) => {
        const isClosing = line.startsWith('/')
        if (isClosing) indent = Math.max(0, indent - 1)

        formatted += indentSize.repeat(indent) + '<' + line + '>\n'

        if (!isClosing && !line.endsWith('/')) indent++
      })

      return formatted.trim()
    }
  } catch (error) {
    return { error: error.message }
  }
}

function yamlFormatter(text, config) {
  const indentSize = parseInt(config.indentSize) || 2

  try {
    const lines = text.split('\n')
    const formatted = lines.map(line => {
      const spaces = line.match(/^ */)[0].length
      const content = line.trim()

      if (!content) return ''

      const newIndent = Math.round(spaces / 2) * indentSize
      return ' '.repeat(newIndent) + content
    })

    return formatted.join('\n')
  } catch (error) {
    return { error: error.message }
  }
}

function urlParser(text) {
  try {
    const url = new URL(text)
    return {
      href: url.href,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 'default',
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      searchParams: Object.fromEntries(url.searchParams),
    }
  } catch (error) {
    return { error: 'Invalid URL format' }
  }
}

function jwtDecoder(text) {
  const token = text.trim()
  const parts = token.split('.')

  if (parts.length !== 3) {
    return { error: 'Invalid JWT format. Expected 3 parts separated by dots.' }
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

    return {
      header,
      payload,
      signature: parts[2],
      decoded: true,
    }
  } catch (error) {
    return { error: 'Failed to decode JWT: ' + error.message }
  }
}

function qrCodeGenerator(text, config) {
  const size = parseInt(config.size) || 300

  return {
    text,
    size,
    message: 'QR code generation requires an external library. Use https://qr.io/?qr=' + encodeURIComponent(text),
  }
}

function textDiffChecker(text, config) {
  const text1 = config.text1 || ''
  const text2 = config.text2 || ''

  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')

  const differences = {
    text1Lines: lines1.length,
    text2Lines: lines2.length,
    identical: text1 === text2,
    differences: [],
  }

  const maxLines = Math.max(lines1.length, lines2.length)
  for (let i = 0; i < maxLines; i++) {
    if (lines1[i] !== lines2[i]) {
      differences.differences.push({
        line: i + 1,
        text1: lines1[i] || '(missing)',
        text2: lines2[i] || '(missing)',
      })
    }
  }

  return differences
}

function colorConverter(text, config) {
  const fromFormat = config.fromFormat || 'hex'

  try {
    let rgb = null

    if (fromFormat === 'hex') {
      const hex = text.trim().replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      rgb = { r, g, b }
    } else if (fromFormat === 'rgb') {
      const match = text.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
      if (!match) throw new Error('Invalid RGB format')
      rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
    } else if (fromFormat === 'hsl') {
      const match = text.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
      if (!match) throw new Error('Invalid HSL format')
      rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
    }

    return {
      hex: '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
    }
  } catch (error) {
    return { error: error.message }
  }
}

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - ((h / 60) % 2 - 1))
  const m = l - c / 2

  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return `hsl(0, 0%, ${Math.round(l * 100)}%)`
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function checksumCalculator(text, config) {
  const algorithm = config.algorithm || 'crc32'

  try {
    if (algorithm === 'crc32') {
      let crc = 0 ^ -1
      for (let i = 0; i < text.length; i++) {
        crc = (crc >>> 8) ^ ((crc ^ text.charCodeAt(i)) << 24)
        for (let j = 0; j < 8; j++) {
          crc = crc & 0x80000000 ? (crc << 1) ^ 0xEDB88320 : crc << 1
        }
      }
      return { algorithm: 'CRC32', checksum: (crc ^ -1) >>> 0 }
    } else if (algorithm === 'checksum') {
      let sum = 0
      for (let i = 0; i < text.length; i++) {
        sum += text.charCodeAt(i)
      }
      return { algorithm: 'Simple Checksum', checksum: sum }
    } else if (algorithm === 'adler32') {
      let a = 1, b = 0
      for (let i = 0; i < text.length; i++) {
        a = (a + text.charCodeAt(i)) % 65521
        b = (b + a) % 65521
      }
      return { algorithm: 'Adler-32', checksum: (b << 16) | a }
    }
  } catch (error) {
    return { error: error.message }
  }
}
