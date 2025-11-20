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
    example: 'The quick brown fox jumps over the lazy dog. It then ran away!\n\nThis is another paragraph.',
    configSchema: [],
  },
  'case-converter': {
    name: 'Case Converter',
    description: 'Convert text case: uppercase, lowercase, title case, sentence case',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'this is a sample sentence. another Sentence here.',
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
    example: 'Hello world. Hello everyone. Hello!',
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
    example: '  Line one  \n\nLine two\nLine two\n   \nLine three   ',
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
    example: 'Artificial intelligence is rapidly changing software development. It helps automate repetitive tasks and provides new ways to build products.',
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
    example: 'Hello World',
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
    example: 'https://example.com/search?q=hello world&lang=en',
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
    example: '<div class="title">Tom & Jerry</div>',
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
    example: '<html><body><h1>Title</h1><p>Hello</p></body></html>',
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
    example: '<p>Hello **world** — _nice_ to meet you!</p>\n\n# Heading',
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
    example: '{"name":"John","age":30,"skills":["js","py"]}',
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
    example: 'Hello World',
    configSchema: [],
  },
  'slug-generator': {
    name: 'Slug Generator',
    description: 'Convert text to URL-friendly slug format',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    example: '  Hello, World! Welcome_to 2025  ',
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
  'regex-tester': {
    name: 'Regex Tester',
    description: 'Test regular expressions with match highlighting and replacement',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'Order #12345\nOrder #987\norder #111',
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
  'timestamp-converter': {
    name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '1633024800',
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
  'csv-json-converter': {
    name: 'CSV to JSON Converter',
    description: 'Convert between CSV and JSON formats',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'name,age,city\nAlice,30,Seattle\nBob,25,Portland',
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
    example: '# Title\n\nThis is **bold** and this is *italic*.\n\n- item A\n- item B',
    configSchema: [],
  },
  'xml-formatter': {
    name: 'XML Formatter',
    description: 'Format and beautify XML with indentation or minify',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: '<root><item id="1"><name>Item1</name></item></root>',
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
    example: 'server:\n  port: 8080\n  host: localhost\nusers:\n - alice\n - bob',
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
    example: 'https://example.com:8080/path/page?query=1#section',
    configSchema: [],
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    description: 'Decode and analyze JSON Web Tokens',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    configSchema: [],
  },
  'text-diff-checker': {
    name: 'Text Diff Checker',
    description: 'Compare two text blocks and highlight differences',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'The quick brown fox\njumps over the lazy dog',
    configSchema: [
      {
        id: 'text2',
        label: 'Text 2 (to compare with input above)',
        type: 'textarea',
        placeholder: 'Paste the second text to compare',
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
    example: '#FF5733',
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
    example: 'The quick brown fox jumps over the lazy dog',
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
    example: 'Hello "World" with \'quotes\' and a tab\there',
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
    example: 'zebra\napple\ncherry\nbanana',
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
    example: 'Hello  world\twith\ttabs',
    configSchema: [],
  },
  'ascii-unicode-converter': {
    name: 'ASCII/Unicode Converter',
    description: 'Convert between ASCII codes, Unicode, and text characters',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'Hello',
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
    example: 'mañana',
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
    example: '1010101',
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
    example: 'Hello World',
    configSchema: [],
  },
  'caesar-cipher': {
    name: 'Caesar Cipher',
    description: 'Encode or decode text using Caesar cipher with configurable shift',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello World',
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
    example: '.container { color: red; padding: 10px; margin: 5px; }',
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
    example: 'SELECT id, name, email FROM users WHERE active = 1 ORDER BY created_at DESC',
    configSchema: [],
  },
  'http-status-lookup': {
    name: 'HTTP Status Code Lookup',
    description: 'Look up HTTP status codes and their meanings',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '404',
    configSchema: [],
  },
  'mime-type-lookup': {
    name: 'MIME Type Lookup',
    description: 'Find MIME types by file extension or vice versa',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'pdf',
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
    example: 'Content-Type: application/json\nAuthorization: Bearer token123',
    configSchema: [],
  },
  'uuid-validator': {
    name: 'UUID Validator',
    description: 'Validate if text is a valid UUID format',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '550e8400-e29b-41d4-a716-446655440000',
    configSchema: [],
  },
  'json-path-extractor': {
    name: 'JSON Path Extractor',
    description: 'Extract values from JSON using dot notation paths',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '{"user": {"name": "John", "age": 30}}',
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
    example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
    configSchema: [],
  },
  'unit-converter': {
    name: 'Unit Converter',
    description: 'Convert between length, weight, temperature, speed, and volume units',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '100',
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
    example: '1234567.89',
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
    example: '2024-01-15 14:30:00',
    configSchema: [
      {
        id: 'fromTimezone',
        label: 'From Timezone',
        type: 'select',
        options: [
          { value: 'UTC', label: 'UTC (GMT)' },
          { value: 'EST', label: 'EST (UTC-5)' },
          { value: 'EDT', label: 'EDT (UTC-4)' },
          { value: 'CST', label: 'CST (UTC-6)' },
          { value: 'CDT', label: 'CDT (UTC-5)' },
          { value: 'MST', label: 'MST (UTC-7)' },
          { value: 'MDT', label: 'MDT (UTC-6)' },
          { value: 'PST', label: 'PST (UTC-8)' },
          { value: 'PDT', label: 'PDT (UTC-7)' },
          { value: 'GMT', label: 'GMT (UTC)' },
          { value: 'BST', label: 'BST (UTC+1)' },
          { value: 'CET', label: 'CET (UTC+1)' },
          { value: 'CEST', label: 'CEST (UTC+2)' },
          { value: 'IST', label: 'IST (UTC+5:30)' },
          { value: 'JST', label: 'JST (UTC+9)' },
          { value: 'AEST', label: 'AEST (UTC+10)' },
          { value: 'AEDT', label: 'AEDT (UTC+11)' },
        ],
        default: 'UTC',
      },
      {
        id: 'toTimezone',
        label: 'To Timezone',
        type: 'select',
        options: [
          { value: 'UTC', label: 'UTC (GMT)' },
          { value: 'EST', label: 'EST (UTC-5)' },
          { value: 'EDT', label: 'EDT (UTC-4)' },
          { value: 'CST', label: 'CST (UTC-6)' },
          { value: 'CDT', label: 'CDT (UTC-5)' },
          { value: 'MST', label: 'MST (UTC-7)' },
          { value: 'MDT', label: 'MDT (UTC-6)' },
          { value: 'PST', label: 'PST (UTC-8)' },
          { value: 'PDT', label: 'PDT (UTC-7)' },
          { value: 'GMT', label: 'GMT (UTC)' },
          { value: 'BST', label: 'BST (UTC+1)' },
          { value: 'CET', label: 'CET (UTC+1)' },
          { value: 'CEST', label: 'CEST (UTC+2)' },
          { value: 'IST', label: 'IST (UTC+5:30)' },
          { value: 'JST', label: 'JST (UTC+9)' },
          { value: 'AEST', label: 'AEST (UTC+10)' },
          { value: 'AEDT', label: 'AEDT (UTC+11)' },
        ],
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
    example: '255',
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
    example: '(10 + 5) * 2 - 3',
    configSchema: [],
  },
  'keyword-extractor': {
    name: 'Keyword Extractor',
    description: 'Extract important keywords and phrases from text',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'Machine learning is transforming artificial intelligence. Deep learning models are used in many AI applications.',
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
    example: '0 9 * * MON-FRI',
    configSchema: [],
  },
  'file-size-converter': {
    name: 'File Size Converter',
    description: 'Convert between bytes, KB, MB, GB, TB file sizes',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '1024',
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
  'js-minifier': {
    name: 'JavaScript Minifier',
    description: 'Minify JavaScript code to reduce file size',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'function greet(name) {\n  console.log("Hello, " + name);\n}',
    configSchema: [
      {
        id: 'preserveComments',
        label: 'Preserve Important Comments',
        type: 'toggle',
        default: false,
      },
    ],
  },
  'js-beautifier': {
    name: 'JavaScript Beautifier',
    description: 'Format and beautify JavaScript code with proper indentation',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'const obj={name:"John",age:30};function test(){return obj.name;}',
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
  'html-minifier': {
    name: 'HTML Minifier',
    description: 'Minify HTML code to reduce file size',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: '<div class="container">\n  <h1>Title</h1>\n  <p>Content here</p>\n</div>',
    configSchema: [
      {
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeAttributes',
        label: 'Remove Optional Attributes',
        type: 'toggle',
        default: false,
      },
    ],
  },
  'email-validator': {
    name: 'Email Validator',
    description: 'Validate email addresses and check format correctness',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'john.doe@example.com',
    configSchema: [],
  },
  'ip-validator': {
    name: 'IP Address Validator',
    description: 'Validate IPv4 and IPv6 addresses',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.1',
    configSchema: [
      {
        id: 'version',
        label: 'IP Version',
        type: 'select',
        options: [
          { value: 'both', label: 'IPv4 and IPv6' },
          { value: '4', label: 'IPv4 Only' },
          { value: '6', label: 'IPv6 Only' },
        ],
        default: 'both',
      },
    ],
  },
  'ip-to-integer': {
    name: 'IP to Integer Converter',
    description: 'Convert IPv4 addresses to integer representation',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.1',
    configSchema: [],
  },
  'integer-to-ip': {
    name: 'Integer to IP Converter',
    description: 'Convert integer values back to IPv4 addresses',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '3232235777',
    configSchema: [],
  },
  'ip-range-calculator': {
    name: 'IP Range Calculator',
    description: 'Calculate CIDR ranges, subnets, and IP boundaries',
    category: 'calculator',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.0/24',
    configSchema: [],
  },
  'markdown-linter': {
    name: 'Markdown Linter',
    description: 'Lint and validate Markdown files for common issues',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',
    example: '# Heading\n\nThis is a paragraph.\n\n- List item 1\n- List item 2',
    configSchema: [
      {
        id: 'strictMode',
        label: 'Strict Mode',
        type: 'toggle',
        default: false,
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
    case 'regex-tester':
      return regexTester(inputText, config)
    case 'timestamp-converter':
      return timestampConverter(inputText, config)
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
    case 'text-diff-checker':
      return textDiffChecker(inputText, config)
    case 'color-converter':
      return colorConverter(inputText, config)
    case 'checksum-calculator':
      return checksumCalculator(inputText, config)
    case 'escape-unescape':
      return escapeUnescape(inputText, config)
    case 'sort-lines':
      return sortLines(inputText, config)
    case 'whitespace-visualizer':
      return whitespaceVisualizer(inputText)
    case 'ascii-unicode-converter':
      return asciiUnicodeConverter(inputText, config)
    case 'punycode-converter':
      return punycodeConverter(inputText, config)
    case 'binary-converter':
      return binaryConverter(inputText, config)
    case 'rot13-cipher':
      return rot13Cipher(inputText)
    case 'caesar-cipher':
      return caesarCipher(inputText, config)
    case 'css-formatter':
      return cssFormatter(inputText, config)
    case 'sql-formatter':
      return sqlFormatter(inputText)
    case 'http-status-lookup':
      return httpStatusLookup(inputText)
    case 'mime-type-lookup':
      return mimeTypeLookup(inputText, config)
    case 'http-header-parser':
      return httpHeaderParser(inputText)
    case 'uuid-validator':
      return uuidValidator(inputText)
    case 'json-path-extractor':
      return jsonPathExtractor(inputText, config)
    case 'image-to-base64':
      return imageToBase64(inputImage)
    case 'svg-optimizer':
      return svgOptimizer(inputText)
    case 'unit-converter':
      return unitConverter(inputText, config)
    case 'number-formatter':
      return numberFormatter(inputText, config)
    case 'timezone-converter':
      return timezoneConverter(inputText, config)
    case 'base-converter':
      return baseConverter(inputText, config)
    case 'math-evaluator':
      return mathEvaluator(inputText)
    case 'keyword-extractor':
      return keywordExtractor(inputText, config)
    case 'cron-tester':
      return cronTester(inputText)
    case 'file-size-converter':
      return fileSizeConverter(inputText, config)
    case 'js-minifier':
      return jsMinifier(inputText, config)
    case 'js-beautifier':
      return jsBeautifier(inputText, config)
    case 'html-minifier':
      return htmlMinifierTool(inputText, config)
    case 'email-validator':
      return emailValidator(inputText)
    case 'ip-validator':
      return ipValidator(inputText, config)
    case 'ip-to-integer':
      return ipToInteger(inputText)
    case 'integer-to-ip':
      return integerToIp(inputText)
    case 'ip-range-calculator':
      return ipRangeCalculator(inputText)
    case 'markdown-linter':
      return markdownLinter(inputText, config)
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
    return {
      error: 'Please upload an image to resize. Click the image upload area above to select an image.',
      status: 'waiting_for_image',
    }
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


function textDiffChecker(text, config) {
  const text1 = text || ''
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

function escapeUnescape(text, config) {
  const mode = config.mode || 'escape'
  const format = config.format || 'javascript'
  if (mode === 'escape') {
    if (format === 'javascript') return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    if (format === 'json') return JSON.stringify(text).slice(1, -1)
    if (format === 'html') return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }
  return text
}

function sortLines(text, config) {
  const lines = text.split('\n')
  let sorted = [...lines]
  if (config.order === 'length') sorted.sort((a, b) => a.length - b.length)
  else if (config.order === 'desc') sorted.sort().reverse()
  else sorted.sort()
  if (config.removeDuplicates) sorted = [...new Set(sorted)]
  return sorted.join('\n')
}

function whitespaceVisualizer(text) {
  return text.replace(/ /g, '·').replace(/\t/g, '→').replace(/\n/g, '↵\n')
}

function asciiUnicodeConverter(text, config) {
  if (config.mode === 'toCode') return text.split('').map(c => ({ char: c, code: c.charCodeAt(0) }))
  try {
    const codes = text.match(/\d+/g) || []
    return codes.map(c => String.fromCharCode(parseInt(c))).join('')
  } catch (e) {
    return { error: 'Invalid codes' }
  }
}

function punycodeConverter(text, config) {
  return config.mode === 'encode' ? text : text
}

function binaryConverter(text, config) {
  const fromBase = parseInt(config.fromBase) || 2
  const toBase = parseInt(config.toBase) || 10
  try {
    const decimal = parseInt(text, fromBase)
    if (isNaN(decimal)) return { error: 'Invalid input' }
    return { result: decimal.toString(toBase).toUpperCase() }
  } catch (e) {
    return { error: e.message }
  }
}

function rot13Cipher(text) {
  return text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26 + (c <= 'Z' ? 65 : 97)))
}

function caesarCipher(text, config) {
  const shift = parseInt(config.shift) || 3
  return text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + shift) % 26 + (c <= 'Z' ? 65 : 97)))
}

function cssFormatter(text, config) {
  if (config.mode === 'minify') return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim()
  return text.replace(/\{/g, ' {\n  ').replace(/;/g, ';\n  ').replace(/\}/g, '\n}').replace(/\n\s*\n/g, '\n')
}

function sqlFormatter(text) {
  return text.replace(/\b(SELECT|FROM|WHERE|JOIN|ON|GROUP|ORDER|LIMIT)\b/gi, '\n$1 ').trim()
}

function httpStatusLookup(text) {
  const statusCodes = {
    '100': { meaning: 'Continue', category: '1xx Informational', description: 'Indicates that the request has been received and the process is being continued.' },
    '101': { meaning: 'Switching Protocols', category: '1xx Informational', description: 'Server is switching to a different protocol as requested by the client.' },
    '200': { meaning: 'OK', category: '2xx Success', description: 'The request succeeded and the server returned the requested data.' },
    '201': { meaning: 'Created', category: '2xx Success', description: 'The request succeeded and a new resource was created as a result.' },
    '202': { meaning: 'Accepted', category: '2xx Success', description: 'The request has been accepted for processing, but the processing has not been completed.' },
    '204': { meaning: 'No Content', category: '2xx Success', description: 'The request succeeded but there is no content to send back.' },
    '206': { meaning: 'Partial Content', category: '2xx Success', description: 'Server is delivering part of the resource due to a range request.' },
    '300': { meaning: 'Multiple Choices', category: '3xx Redirection', description: 'The request has multiple possible responses.' },
    '301': { meaning: 'Moved Permanently', category: '3xx Redirection', description: 'The URL of the requested resource has changed permanently.' },
    '302': { meaning: 'Found', category: '3xx Redirection', description: 'The URI of requested resource has changed temporarily.' },
    '304': { meaning: 'Not Modified', category: '3xx Redirection', description: 'Resource has not been modified since the version specified by the request headers.' },
    '307': { meaning: 'Temporary Redirect', category: '3xx Redirection', description: 'The request should be repeated with another URI, but the method should not be changed.' },
    '308': { meaning: 'Permanent Redirect', category: '3xx Redirection', description: 'The request should be repeated with another URI, but the method should not be changed.' },
    '400': { meaning: 'Bad Request', category: '4xx Client Error', description: 'The request could not be understood or was missing required parameters.' },
    '401': { meaning: 'Unauthorized', category: '4xx Client Error', description: 'Authentication is required and has failed or has not been provided.' },
    '403': { meaning: 'Forbidden', category: '4xx Client Error', description: 'The client does not have access rights to the content.' },
    '404': { meaning: 'Not Found', category: '4xx Client Error', description: 'The requested resource could not be found on the server.' },
    '405': { meaning: 'Method Not Allowed', category: '4xx Client Error', description: 'The request method is not supported by the server.' },
    '408': { meaning: 'Request Timeout', category: '4xx Client Error', description: 'The server timed out waiting for the request.' },
    '409': { meaning: 'Conflict', category: '4xx Client Error', description: 'The request conflicts with the current state of the server.' },
    '410': { meaning: 'Gone', category: '4xx Client Error', description: 'The requested resource is no longer available and will not be available again.' },
    '413': { meaning: 'Payload Too Large', category: '4xx Client Error', description: 'The request entity is larger than limits defined by the server.' },
    '415': { meaning: 'Unsupported Media Type', category: '4xx Client Error', description: 'The media format of the requested data is not supported by the server.' },
    '429': { meaning: 'Too Many Requests', category: '4xx Client Error', description: 'The user has sent too many requests in a given amount of time (rate limiting).' },
    '500': { meaning: 'Internal Server Error', category: '5xx Server Error', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.' },
    '501': { meaning: 'Not Implemented', category: '5xx Server Error', description: 'The server does not support the functionality required to fulfill the request.' },
    '502': { meaning: 'Bad Gateway', category: '5xx Server Error', description: 'The server received an invalid response from an upstream server.' },
    '503': { meaning: 'Service Unavailable', category: '5xx Server Error', description: 'The server is unable to handle the request due to temporary overloading or maintenance.' },
    '504': { meaning: 'Gateway Timeout', category: '5xx Server Error', description: 'The server did not receive a timely response from an upstream server.' },
  }

  const code = text.trim()
  const statusInfo = statusCodes[code]

  if (statusInfo) {
    return {
      code,
      meaning: statusInfo.meaning,
      category: statusInfo.category,
      description: statusInfo.description,
    }
  }

  return {
    code,
    error: `Status code "${code}" not found. Common codes: 200 (OK), 404 (Not Found), 500 (Server Error)`,
  }
}

function mimeTypeLookup(text, config) {
  const mimeMap = { html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4' }
  if (config.mode === 'extension') {
    const ext = text.trim().toLowerCase().replace(/^\./, '')
    return { extension: ext, mimeType: mimeMap[ext] || 'Unknown' }
  }
  return { mimeType: text.trim() }
}

function httpHeaderParser(text) {
  const headers = {}
  text.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':')
    if (key) headers[key.trim()] = rest.join(':').trim()
  })
  return headers
}

function uuidValidator(text) {
  const uuid = text.trim()
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
  return { uuid, isValid: valid }
}

function jsonPathExtractor(text, config) {
  try {
    const obj = JSON.parse(text)
    const keys = (config.jsonPath || '').split('.')
    let value = obj
    keys.forEach(k => { if (k) value = value[k] })
    return { path: config.jsonPath, value }
  } catch (e) {
    return { error: 'Invalid JSON or path' }
  }
}

function imageToBase64(imageData) {
  if (!imageData) {
    return { error: 'Please upload an image to convert. Click the image upload area above to select an image.' }
  }
  return { message: 'Image Base64 preview', length: imageData.length, base64: imageData.substring(0, 100) + '...' }
}

function svgOptimizer(text) {
  return text.replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/<!--.*?-->/g, '').trim()
}

function unitConverter(text, config) {
  const value = parseFloat(text)
  if (isNaN(value)) return { error: 'Invalid number' }

  const type = config.type || 'length'

  const conversions = {
    length: {
      units: {
        m: { to: { km: 0.001, ft: 3.28084, mi: 0.000621371, cm: 100, mm: 1000, yd: 1.09361 },
             base: 'meter' },
        km: { to: { m: 1000, ft: 3280.84, mi: 0.621371, cm: 100000, mm: 1000000, yd: 1093.61 },
              base: 'kilometer' },
        ft: { to: { m: 0.3048, km: 0.0003048, mi: 0.000189394, cm: 30.48, mm: 304.8, yd: 0.333333 },
              base: 'feet' },
        mi: { to: { m: 1609.34, km: 1.60934, ft: 5280, cm: 160934, mm: 1609340, yd: 1760 },
              base: 'miles' },
        cm: { to: { m: 0.01, km: 0.00001, ft: 0.328084, mi: 0.00000621371, mm: 10, yd: 0.0109361 },
              base: 'centimeter' },
        mm: { to: { m: 0.001, km: 0.000001, ft: 0.00328084, mi: 6.21371e-7, cm: 0.1, yd: 0.00109361 },
              base: 'millimeter' },
        yd: { to: { m: 0.9144, km: 0.0009144, ft: 3, mi: 0.000568182, cm: 91.44, mm: 914.4 },
              base: 'yard' },
      }
    },
    weight: {
      units: {
        kg: { to: { lb: 2.20462, oz: 35.274, g: 1000 },
              base: 'kilogram' },
        lb: { to: { kg: 0.453592, oz: 16, g: 453.592 },
              base: 'pound' },
        oz: { to: { kg: 0.0283495, lb: 0.0625, g: 28.3495 },
              base: 'ounce' },
        g: { to: { kg: 0.001, lb: 0.00220462, oz: 0.035274 },
             base: 'gram' },
      }
    },
    temperature: {
      units: {
        C: { to: { F: (v) => (v * 9/5) + 32, K: (v) => v + 273.15 },
             base: 'Celsius' },
        F: { to: { C: (v) => (v - 32) * 5/9, K: (v) => (v - 32) * 5/9 + 273.15 },
             base: 'Fahrenheit' },
        K: { to: { C: (v) => v - 273.15, F: (v) => (v - 273.15) * 9/5 + 32 },
             base: 'Kelvin' },
      }
    },
    speed: {
      units: {
        'ms': { to: { 'kmh': 3.6, 'mph': 2.23694 },
                base: 'meter/second' },
        'kmh': { to: { 'ms': 0.277778, 'mph': 0.621371 },
                 base: 'kilometer/hour' },
        'mph': { to: { 'ms': 0.44704, 'kmh': 1.60934 },
                 base: 'mile/hour' },
      }
    },
    volume: {
      units: {
        L: { to: { ml: 1000, gal: 0.264172, cup: 4.22675 },
             base: 'liter' },
        ml: { to: { L: 0.001, gal: 0.000264172, cup: 0.00422675 },
              base: 'milliliter' },
        gal: { to: { L: 3.78541, ml: 3785.41, cup: 16 },
               base: 'gallon' },
        cup: { to: { L: 0.236588, ml: 236.588, gal: 0.0625 },
               base: 'cup' },
      }
    }
  }

  const typeData = conversions[type]
  if (!typeData) return { error: `Unknown unit type: ${type}` }

  const results = {}
  const units = typeData.units

  for (const [unit, unitData] of Object.entries(units)) {
    const conversionsTo = unitData.to
    results[unit] = {}

    for (const [targetUnit, factor] of Object.entries(conversionsTo)) {
      if (typeof factor === 'function') {
        results[unit][targetUnit] = factor(value)
      } else {
        results[unit][targetUnit] = value * factor
      }
    }
  }

  return {
    input: value,
    type: type,
    results: results,
    message: `Converted ${value} across all ${type} units`
  }
}

function numberFormatter(text, config) {
  const value = parseFloat(text)
  if (isNaN(value)) return { error: 'Invalid number' }
  const decimals = parseInt(config.decimals) || 2
  const separator = config.separator || ','
  const fixed = value.toFixed(decimals)
  const parts = fixed.split('.')
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator) + (parts[1] ? '.' + parts[1] : '')
}

function timezoneConverter(text, config) {
  const timezoneOffsets = {
    'UTC': 0,
    'GMT': 0,
    'EST': -5,
    'EDT': -4,
    'CST': -6,
    'CDT': -5,
    'MST': -7,
    'MDT': -6,
    'PST': -8,
    'PDT': -7,
    'BST': 1,
    'CET': 1,
    'CEST': 2,
    'IST': 5.5,
    'JST': 9,
    'AEST': 10,
    'AEDT': 11,
  }

  const fromTz = config.fromTimezone || 'UTC'
  const toTz = config.toTimezone || 'UTC'
  const fromOffset = timezoneOffsets[fromTz]
  const toOffset = timezoneOffsets[toTz]

  if (fromOffset === undefined || toOffset === undefined) {
    return { error: `Unknown timezone: ${fromOffset === undefined ? fromTz : toTz}` }
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return { error: 'Please enter a time (e.g., 1:00 PM, 13:00, 1:30 PM)' }
  }

  // Parse time formats: "1:00 PM", "13:00", "1:30 PM UTC", etc.
  const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i
  const match = trimmed.match(timeRegex)

  if (!match) {
    return { error: 'Invalid time format. Use formats like: 1:00 PM, 13:00, or 1:30 PM' }
  }

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = match[3] ? parseInt(match[3]) : 0
  const meridiem = match[4]?.toUpperCase()

  // Convert 12-hour to 24-hour format
  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return { error: 'Invalid time values' }
  }

  // Create a reference date (date doesn't matter for timezone conversion)
  const totalMinutes = hours * 60 + minutes + Math.round((fromOffset - toOffset) * 60)
  let newHours = Math.floor(totalMinutes / 60)
  let newMinutes = totalMinutes % 60

  // Handle day wraparound
  let dayOffset = 0
  if (newHours < 0) {
    dayOffset = -1
    newHours += 24
  } else if (newHours >= 24) {
    dayOffset = 1
    newHours -= 24
  }

  if (newMinutes < 0) {
    newMinutes += 60
    newHours -= 1
    if (newHours < 0) {
      dayOffset -= 1
      newHours += 24
    }
  }

  // Format output
  const pad = (n) => String(n).padStart(2, '0')
  const inputTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  const outputTime = `${pad(newHours)}:${pad(newMinutes)}:${pad(seconds)}`

  const meridiem12Input = hours >= 12 ? 'PM' : 'AM'
  const hours12Input = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const meridiem12Output = newHours >= 12 ? 'PM' : 'AM'
  const hours12Output = newHours === 0 ? 12 : newHours > 12 ? newHours - 12 : newHours

  const dayLabel = dayOffset === -1 ? ' (previous day)' : dayOffset === 1 ? ' (next day)' : ''

  return {
    input: {
      time: inputTime,
      time12h: `${hours12Input}:${pad(minutes)} ${meridiem12Input}`,
      timezone: fromTz,
      offset: `UTC${fromOffset >= 0 ? '+' : ''}${fromOffset}`,
    },
    output: {
      time: outputTime,
      time12h: `${hours12Output}:${pad(newMinutes)} ${meridiem12Output}${dayLabel}`,
      timezone: toTz,
      offset: `UTC${toOffset >= 0 ? '+' : ''}${toOffset}`,
    },
    timeDifference: `${toOffset - fromOffset > 0 ? '+' : ''}${toOffset - fromOffset} hours`,
  }
}

function baseConverter(text, config) {
  const value = parseInt(text)
  if (isNaN(value)) return { error: 'Invalid number' }
  const result = value.toString(parseInt(config.toBase) || 16)
  return { result: result.toUpperCase() }
}

function mathEvaluator(text) {
  try {
    const safe = text.replace(/[^0-9+\-*/().\s]/g, '')
    const result = Function('"use strict"; return (' + safe + ')')()
    return { expression: text, result }
  } catch (e) {
    return { error: 'Invalid expression' }
  }
}

function keywordExtractor(text, config) {
  const count = parseInt(config.count) || 10
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || []
  const freq = {}
  words.forEach(w => freq[w] = (freq[w] || 0) + 1)
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, count).map(([word, freq]) => ({ word, frequency: freq }))
}

function cronTester(text) {
  const parts = text.trim().split(' ')
  return parts.length !== 5 ? { error: 'Cron needs 5 parts' } : { cron: text, valid: true, parts }
}

function fileSizeConverter(text, config) {
  const value = parseFloat(text)
  if (isNaN(value)) return { error: 'Invalid number' }
  const units = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 }
  const bytes = value * (units[config.fromUnit] || 1)
  const result = bytes / (units[config.toUnit] || 1)
  return { value, fromUnit: config.fromUnit, toUnit: config.toUnit, result: result.toFixed(2) }
}

function jsMinifier(text, config) {
  let result = text
  if (config.preserveComments !== true) {
    result = result.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
  }
  result = result.replace(/\s+/g, ' ').replace(/\s*([{}();:,])\s*/g, '$1').trim()
  return result
}

function jsBeautifier(text, config) {
  const indent = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2)
  let result = ''
  let indentLevel = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if ((char === '"' || char === "'" || char === '`') && text[i - 1] !== '\\') {
      inString = !inString
      if (inString) stringChar = char
      result += char
      continue
    }

    if (inString) {
      result += char
      continue
    }

    if (char === '{') {
      result += ' {\n' + indent.repeat(indentLevel + 1)
      indentLevel++
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1)
      result = result.trimRight() + '\n' + indent.repeat(indentLevel) + '}'
    } else if (char === ';') {
      result += ';\n' + indent.repeat(indentLevel)
    } else if (char === '\n' || char === '\r') {
      continue
    } else if (char === ' ' && result.trim()) {
      if (result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
        result += ' '
      }
    } else {
      result += char
    }
  }

  return result.replace(/\n\s*\n/g, '\n').trim()
}

function htmlMinifierTool(text, config) {
  let result = text

  if (config.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '')
  }

  result = result.replace(/>\s+</g, '><')
  result = result.replace(/\s+/g, ' ').trim()

  if (config.removeAttributes) {
    result = result.replace(/\s(type|method)="(text|get)"/g, '')
  }

  return result
}

function emailValidator(text) {
  const emails = text.split(/[\s,\n]+/).filter(e => e.trim())
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const results = emails.map(email => ({
    email: email.trim(),
    valid: emailRegex.test(email.trim()),
    hasAt: email.includes('@'),
    hasDomain: email.includes('.'),
  }))

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    results,
  }
}

function ipValidator(text, config) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/

  const ips = text.split(/[\s,\n]+/).filter(i => i.trim())

  const results = ips.map(ip => {
    const trimmed = ip.trim()
    const isIPv4 = ipv4Regex.test(trimmed)
    const isIPv6 = ipv6Regex.test(trimmed)

    let valid = false
    if (config.version === '4') valid = isIPv4
    else if (config.version === '6') valid = isIPv6
    else valid = isIPv4 || isIPv6

    return { ip: trimmed, valid, ipv4: isIPv4, ipv6: isIPv6 }
  })

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    results,
  }
}

function ipToInteger(text) {
  const ip = text.trim()
  const parts = ip.split('.')
  if (parts.length !== 4) return { error: 'Invalid IPv4 address' }

  const integer = parts.reduce((acc, part) => {
    const num = parseInt(part)
    if (num < 0 || num > 255) return null
    return acc * 256 + num
  }, 0)

  if (integer === null) return { error: 'Invalid IPv4 address' }
  return { ip, integer, hex: integer.toString(16), binary: integer.toString(2) }
}

function integerToIp(text) {
  const integer = parseInt(text.trim())
  if (isNaN(integer) || integer < 0 || integer > 4294967295) {
    return { error: 'Invalid integer (must be 0-4294967295)' }
  }

  const parts = [
    (integer >>> 24) & 255,
    (integer >>> 16) & 255,
    (integer >>> 8) & 255,
    integer & 255,
  ]

  return { integer, ip: parts.join('.') }
}

function ipRangeCalculator(text) {
  const cidr = text.trim()
  const [ip, mask] = cidr.split('/')

  if (!ip || !mask) return { error: 'Invalid CIDR notation (use IP/mask)' }

  const maskBits = parseInt(mask)
  if (maskBits < 0 || maskBits > 32) return { error: 'Mask must be between 0 and 32' }

  const parts = ip.split('.')
  if (parts.length !== 4) return { error: 'Invalid IP address' }

  const ipInt = parts.reduce((acc, part) => {
    const num = parseInt(part)
    if (num < 0 || num > 255) return null
    return acc * 256 + num
  }, 0)

  if (ipInt === null) return { error: 'Invalid IP address' }

  const maskInt = (0xffffffff << (32 - maskBits)) >>> 0
  const networkInt = ipInt & maskInt
  const broadcastInt = networkInt | (~maskInt >>> 0)
  const hostCount = Math.max(0, broadcastInt - networkInt - 1)

  const intToIp = (int) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.')

  return {
    cidr,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: intToIp(networkInt + 1),
    lastHost: intToIp(broadcastInt - 1),
    hostCount,
    totalAddresses: broadcastInt - networkInt + 1,
  }
}

function markdownLinter(text, config) {
  const issues = []
  const lines = text.split('\n')

  lines.forEach((line, idx) => {
    if (config.strictMode) {
      if (line.match(/^#+\s{2,}/)) issues.push({ line: idx + 1, message: 'Multiple spaces after heading', severity: 'warning' })
      if (line.match(/^(\*|-)\s{2,}/)) issues.push({ line: idx + 1, message: 'Multiple spaces after list marker', severity: 'warning' })
    }
    if (line.match(/\s+$/)) issues.push({ line: idx + 1, message: 'Trailing whitespace', severity: 'warning' })
    if (line.match(/^#{7,}/)) issues.push({ line: idx + 1, message: 'Heading level too deep (max 6)', severity: 'error' })
  })

  return {
    total: lines.length,
    issues,
    isValid: issues.filter(i => i.severity === 'error').length === 0,
  }
}
