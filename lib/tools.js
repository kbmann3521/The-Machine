export const TOOLS = {
  'text-toolkit': {
    name: 'Text Toolkit',
    description: 'Unified text analysis tool - analyze, transform, and visualize text all in one place',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'The quick brown fox jumps over the lazy dog.',
    configSchema: [],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Text Toolkit is your all-in-one solution for analyzing and transforming plain English text, paragraphs, essays, and any human-written content. Combines multiple text analysis and transformation tools into one unified interface. Works with natural language sentences, paragraphs, articles, and general writing. Instantly get word counts, text analysis, reversals, slugs, case conversions, and whitespace visualization all from a single input.',
      howtouse: [
        'Paste or type any plain English text into the input field',
        'The toolkit automatically runs all analysis and transformation tools',
        'View results from each tool in organized sections:',
        '  • Word Counter: statistics on words, characters, sentences, paragraphs',
        '  • Text Analyzer: readability scores, grade level, text metrics',
        '  • Case Converter: transform text case for any purpose',
        '  • Slug Generator: URL-friendly slug format for web content',
        '  • Reverse Text: character-reversed version of your text',
        '  ��� Whitespace Visualizer: show hidden spaces, tabs, and formatting',
        '  • Sort Lines: alphabetically sorted lines from your text',
        'Copy individual results or the complete output for your next task',
      ],
      features: [
        'Process any plain English text or natural language content',
        'Multiple text analysis and transformation tools in one interface',
        'Real-time analysis and results for all metrics',
        'No configuration needed - uses optimal defaults for all text',
        'Comprehensive text statistics and transformations',
        'Whitespace visualization for debugging formatting issues',
        'URL-friendly slug generation for web content',
        'Readability scoring and grade level analysis',
        'Works with essays, paragraphs, sentences, and general writing',
        'Transform and analyze human-written text of any length',
      ],
      usecases: [
        'Analyze and transform plain English paragraphs and sentences',
        'Comprehensive text analysis for content creators and writers',
        'Grade level assessment for academic and educational content',
        'Developer debugging and text transformation tasks',
        'SEO optimization with slug generation from article titles',
        'Readability assessment for target audiences and clarity improvement',
        'Data analysis and text processing for research and studies',
        'Format validation and text cleanup from various sources',
        'Grammar and readability scoring for business writing',
        'Transform natural English text for different use cases',
        'Analyze essays, explanations, instructions, and technical writing',
      ],
    },
  },
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
    detailedDescription: {
      overview: 'The Image Resizer tool allows you to quickly resize images to specific dimensions, scale them by a percentage, or constrain them to a maximum width. Perfect for optimizing images for web use, social media, or adjusting sizes for various applications. Maintain aspect ratios to avoid distortion.',
      howtouse: [
        'Upload or drag and drop an image into the input area',
        'Select your resize mode: Set Dimensions, Scale Percentage, or Max Width',
        'Enter the desired dimensions or percentage based on your selected mode',
        'Toggle "Maintain Aspect Ratio" if you want to preserve proportions',
        'Select the output quality level (affects file size and clarity)',
        'Download the resized image',
      ],
      features: [
        'Multiple resize modes for different use cases',
        'Maintain aspect ratio option to prevent image distortion',
        'Adjustable quality settings (60% to 100%)',
        'Support for common image formats',
        'Real-time preview of resized dimensions',
        'Efficient batch resizing capability',
      ],
      usecases: [
        'Optimizing images for websites and web pages',
        'Preparing images for social media platforms',
        'Creating thumbnail versions of large images',
        'Standardizing image sizes for galleries or portfolios',
        'Reducing file sizes for faster loading times',
        'Adapting images for mobile and responsive designs',
      ],
    },
  },
  'word-counter': {
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and lines in text',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'The quick brown fox jumps over the lazy dog. It then ran away!\n\nThis is another paragraph.',
    configSchema: [],
    detailedDescription: {
      overview: 'The Word Counter tool instantly analyzes any plain English text and provides comprehensive statistics including word count, character count, sentence count, line count, and paragraph count. Works with natural language paragraphs, essays, articles, and general human-written text. Useful for meeting specific word/character limits or understanding text complexity and density.',
      howtouse: [
        'Type or paste your plain English text into the input field',
        'The tool automatically counts all metrics in real-time',
        'View word count, character count, sentence count, line count, and paragraph count',
        'See average word length and words per sentence metrics',
        'Use these statistics for academic papers, articles, or content requirements',
        'Copy the text or statistics as needed',
      ],
      features: [
        'Analyze plain English text and human-written paragraphs',
        'Real-time word and character counting as you type',
        'Counts words, characters, sentences, lines, and paragraphs',
        'Shows character count with and without spaces',
        'Displays average word length and words per sentence',
        'Instant results for any text length',
        'Works with essays, articles, paragraphs, and general writing',
      ],
      usecases: [
        'Meeting word count requirements for essays and academic assignments',
        'Analyzing plain English text from any source',
        'Checking character limits for social media posts and content',
        'Analyzing text density and readability for plain text',
        'Content management and optimization for web writing',
        'Compliance with character limits in forms and text fields',
        'Evaluating text length for SEO and web content optimization',
        'Counting words in paragraphs and human-written text',
      ],
    },
    show_in_recommendations: false,
  },
  'case-converter': {
    name: 'Case Converter',
    description: 'Convert text case: uppercase, lowercase, title case, sentence case',
    category: 'writing',
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
    detailedDescription: {
      overview: 'The Case Converter tool instantly transforms any plain English text between different capitalization styles. Works with natural language sentences, paragraphs, and general human-written content. Whether you need to convert text to all uppercase, all lowercase, title case, or sentence case, this tool handles the conversion quickly and accurately. Perfect for reformatting text for different purposes like headers, code, content formatting, and general text transformation.',
      howtouse: [
        'Enter or paste your plain English text in the input field',
        'Select your desired case type from the dropdown menu',
        'Choose from UPPERCASE, lowercase, Title Case, or Sentence case',
        'The output will display instantly in the preview area',
        'Copy the converted text to your clipboard or use in another tool',
      ],
      features: [
        'Transform any plain English text case instantly',
        'Multiple case formats: UPPERCASE, lowercase, Title Case, and Sentence case',
        'Real-time conversion as you type or paste',
        'Handles multiple sentences and entire paragraphs',
        'Preserves spaces and punctuation in your text',
        'One-click copy to clipboard',
        'Works with any length of plain text or natural language',
      ],
      usecases: [
        'Transform plain English text for different formatting needs',
        'Converting text for code variable names and constants',
        'Formatting headings and titles for documents and articles',
        'Standardizing email addresses to lowercase',
        'Converting natural language text for database entries',
        'Creating SEO-friendly URLs and slugs from text',
        'Formatting names and proper nouns consistently',
        'Converting text for hashtags and social media posts',
        'Normalizing text data from various sources and inputs',
        'Reformat paragraphs and sentences for different contexts',
      ],
    },
    show_in_recommendations: false,
  },
  'find-replace': {
    name: 'Find & Replace',
    description: 'Find and replace text with optional regex support',
    category: 'writing',
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
    detailedDescription: {
      overview: 'The Find & Replace tool allows you to search for text and replace it with alternative text in any plain English document or paragraph. Works with natural language and supports both simple text matching and powerful regular expressions for complex pattern-based replacements. Case sensitivity options help you control matching behavior.',
      howtouse: [
        'Paste your plain English text into the input area',
        'Enter the text or pattern you want to find in the "Find" field',
        'Enter the replacement text in the "Replace With" field',
        'Toggle "Use Regular Expression" for pattern-based search (optional)',
        'Toggle "Match Case" if you need case-sensitive matching',
        'The tool will show all matches and perform replacements',
        'View and copy the cleaned result',
      ],
      features: [
        'Search plain English text and replace content',
        'Simple text find and replace functionality',
        'Regular expression support for advanced pattern matching',
        'Case-sensitive or case-insensitive matching options',
        'Shows total number of replacements made',
        'Real-time preview of all replacements',
        'Works with unlimited text length and paragraphs',
      ],
      usecases: [
        'Batch replacing text throughout documents and articles',
        'Finding and updating repeated phrases or references',
        'Using regex for complex pattern replacements in text',
        'Normalizing whitespace and text formatting',
        'Extracting specific data using regex groups',
        'Refactoring code and content systematically',
        'Transforming natural language text with search and replace',
      ],
    },
    show_in_recommendations: false,
  },
  'remove-extras': {
    name: 'Clean Text',
    description: 'Advanced text cleaning: fix spacing, remove garbage chars, normalize whitespace',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'This  text   has   weird spacing.\n\nAlso ï»¿  garbage   chars     from  PDFs  .',
    configSchema: [
      {
        id: 'removePdfGarbage',
        label: 'Remove PDF Garbage Characters',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeInvisibleChars',
        label: 'Remove Invisible Unicode Characters',
        type: 'toggle',
        default: true,
      },
      {
        id: 'stripHtml',
        label: 'Strip HTML Tags',
        type: 'toggle',
        default: true,
      },
      {
        id: 'stripMarkdown',
        label: 'Strip Markdown Formatting',
        type: 'toggle',
        default: true,
      },
      {
        id: 'normalizeWhitespace',
        label: 'Normalize Whitespace (Tabs, NBSP, etc.)',
        type: 'toggle',
        default: true,
      },
      {
        id: 'fixPunctuationSpacing',
        label: 'Fix Spacing Around Punctuation',
        type: 'toggle',
        default: true,
      },
      {
        id: 'compressSpaces',
        label: 'Compress Multiple Spaces',
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
        id: 'compressLineBreaks',
        label: 'Compress Excessive Line Breaks',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeLineBreaks',
        label: 'Remove All Line Breaks',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeTimestamps',
        label: 'Remove Log Timestamps',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeDuplicateLines',
        label: 'Remove Duplicate Lines',
        type: 'toggle',
        default: false,
      },
      {
        id: 'smartJoinWords',
        label: 'Smart Join OCR Words',
        type: 'toggle',
        default: false,
      },
      {
        id: 'filterCharacters',
        label: 'Filter Characters',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: 'No filtering' },
          { value: 'ascii-only', label: 'ASCII only (a-zA-Z0-9 + punctuation)' },
          { value: 'keep-accents', label: 'Keep accented letters (àáé, etc.)' },
          { value: 'basic-punctuation', label: 'Keep basic punctuation only' },
        ],
      },
      {
        id: 'flattenToSingleLine',
        label: 'Flatten to Single Line (legacy)',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'The Advanced Clean Text tool transforms messy text from any source into clean, well-formatted output. Handles PDF garbage characters, invisible Unicode characters, excessive whitespace, malformed HTML/Markdown, OCR output, and more. Perfect for cleaning copy/paste text, PDF exports, chat logs, and any real-world messy text.',
      howtouse: [
        'Paste your messy text into the input area',
        'Toggle cleanup options based on what needs fixing:',
        '  • PDF Garbage: Removes junk characters from PDFs and scanned documents',
        '  • Invisible Characters: Removes zero-width spaces and other hidden Unicode',
        '  • HTML/Markdown: Strips formatting tags and syntax',
        '  • Whitespace Normalization: Converts tabs and special spaces to regular spaces',
        '  • Punctuation Spacing: Fixes spacing around commas, periods, and quotes',
        '  • Compress Spaces: Collapses multiple spaces to single spaces',
        '  • Remove Blank Lines: Eliminates empty lines',
        '  • Log Timestamps: Removes timestamps from chat logs and system logs',
        '  • Duplicate Lines: Removes repeated lines',
        '  • Flatten: Convert multiline text to single line',
        'Copy the cleaned result',
      ],
      features: [
        'Remove PDF extraction garbage and corrupted characters',
        'Remove zero-width and invisible Unicode characters',
        'Strip HTML tags from copy/paste content',
        'Strip Markdown formatting (bold, italic, etc.)',
        'Normalize all whitespace types (tabs, non-breaking spaces, etc.)',
        'Fix spacing issues around punctuation',
        'Compress excessive spacing (OCR artifacts, Word formatting)',
        'Remove blank lines and compress excessive line breaks',
        'Remove timestamps from logs and chat exports',
        'Eliminate duplicate lines while preserving order',
        'Flatten multiline text to single line',
        'Trim leading/trailing spaces on all lines',
        'Fully customizable with individual toggle options',
      ],
      usecases: [
        'Cleaning text copied from PDFs and scanned documents',
        'Fixing messy copy/paste text from websites and emails',
        'Processing OCR output from image scanning',
        'Cleaning text exported from Word and Google Docs',
        'Fixing chat logs and system log exports',
        'Removing formatting from HTML and Markdown sources',
        'Preparing text for analysis or processing',
        'Standardizing text formatting across documents',
        'Handling text with invisible/control characters',
        'Cleaning up improperly formatted text from various sources',
      ],
    },
    show_in_recommendations: true,
  },
  'text-analyzer': {
    name: 'Text Analyzer',
    description: 'Analyze readability and generate summary statistics',
    category: 'writing',
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
    detailedDescription: {
      overview: 'The Text Analyzer tool evaluates any plain English text for readability and generates detailed statistics. Works with natural language paragraphs, essays, articles, and general human-written content. It calculates Flesch Readability Score, Flesch-Kincaid Grade Level, and provides word statistics to help understand text complexity and audience suitability.',
      howtouse: [
        'Paste your plain English text into the input field',
        'Select analysis type: Readability Score, Text Statistics, or Both',
        'View the readability scores and grade level assessment',
        'Check text statistics including word and sentence counts',
        'Use insights to adjust your writing for target audience clarity',
      ],
      features: [
        'Analyze plain English paragraphs and natural language text',
        'Flesch Reading Ease score (0-100) for text readability',
        'Flesch-Kincaid Grade Level for academic assessment',
        'Comprehensive text statistics and metrics',
        'Average word length calculation and analysis',
        'Words per sentence analysis for structure',
        'Readability level classification and recommendations',
      ],
      usecases: [
        'Analyze plain English text readability for target audiences',
        'Evaluating document complexity and clarity',
        'Adjusting writing complexity for academic and education levels',
        'Optimizing content for specific reading levels',
        'Analyzing technical documentation clarity and accessibility',
        'Improving blog post and article readability scores',
        'Meeting readability standards for accessibility requirements',
        'Assessing grade level for student writing and academic work',
      ],
    },
    show_in_recommendations: false,
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
    detailedDescription: {
      overview: 'The Base64 Converter tool encodes plain text to Base64 format or decodes Base64 strings back to readable text. Base64 encoding is useful for transmitting binary data in text-only environments like emails and JSON.',
      howtouse: [
        'Enter your text in the input field',
        'Select "Encode to Base64" to convert plain text to Base64',
        'Or select "Decode from Base64" to convert encoded text back',
        'View the converted result instantly',
        'Copy the output to your clipboard',
      ],
      features: [
        'Encode plain text to Base64 format',
        'Decode Base64 strings to plain text',
        'Handles special characters and unicode',
        'Fast and accurate conversion',
        'Works with any text length',
      ],
      usecases: [
        'Encoding credentials for APIs and authentication',
        'Transmitting binary data in emails',
        'Storing binary data in JSON and databases',
        'Encoding images for embedding in HTML/CSS',
        'Creating data URIs for inline content',
        'Obfuscating text data for simple privacy',
      ],
    },
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
    detailedDescription: {
      overview: 'The URL Converter tool encodes text for safe use in URLs or decodes URL-encoded text back to readable format. URL encoding (percent encoding) converts special characters to %XX format for safe transmission in URLs.',
      howtouse: [
        'Enter your text in the input field',
        'Select "Encode for URL" to convert text to URL-safe format',
        'Or select "Decode from URL" to convert encoded text back',
        'View the converted result',
        'Copy the encoded URL or decoded text',
      ],
      features: [
        'Encode text to URL-safe format',
        'Decode percent-encoded URLs',
        'Handles special characters correctly',
        'Preserves URL structure and spaces',
        'Fast and reliable encoding',
      ],
      usecases: [
        'Encoding query parameters for URLs',
        'Creating URL-safe search queries',
        'Decoding suspicious or complex URLs',
        'Building dynamic URLs with parameters',
        'Handling special characters in URLs',
        'Preparing data for API calls',
      ],
    },
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
    detailedDescription: {
      overview: 'The HTML Entities Converter tool converts special characters to HTML entity format (like &amp; for &) or decodes entities back to characters. Essential for displaying special characters safely in HTML without rendering them as code.',
      howtouse: [
        'Enter your text in the input field',
        'Select "Encode to HTML Entities" to convert special characters',
        'Or select "Decode HTML Entities" to convert entities back',
        'View the converted result',
        'Copy and paste into your HTML code',
      ],
      features: [
        'Encode special characters to HTML entities',
        'Decode HTML entities to readable text',
        'Supports all standard HTML entities',
        'Handles quotes, ampersands, and special symbols',
        'Preserves formatting and structure',
      ],
      usecases: [
        'Displaying HTML code as text on webpages',
        'Preventing HTML injection attacks',
        'Showing code snippets safely in HTML',
        'Displaying special characters in content',
        'Preparing content for CMS systems',
        'Sanitizing user input display',
      ],
    },
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
    detailedDescription: {
      overview: 'The HTML Formatter tool beautifies messy HTML code with proper indentation and line breaks for readability, or minifies it to reduce file size. Beautified HTML is easier to debug and maintain, while minified HTML loads faster.',
      howtouse: [
        'Paste your HTML code into the input field',
        'Select "Beautify" to format with indentation or "Minify" to compress',
        'For beautify mode, choose your preferred indent size (2 spaces, 4 spaces, or tabs)',
        'For minify mode, optionally toggle to remove comments',
        'View the formatted result',
        'Copy the result to your code editor',
      ],
      features: [
        'Beautify HTML with proper indentation',
        'Minify HTML to reduce file size',
        'Customizable indent size',
        'Optional comment removal for minification',
        'Fixes basic HTML formatting issues',
        'Preserves HTML structure and attributes',
      ],
      usecases: [
        'Beautifying minified HTML for editing',
        'Improving code readability and maintenance',
        'Minifying HTML for production deployment',
        'Reducing website file sizes and load times',
        'Debugging malformed HTML code',
        'Standardizing HTML formatting in projects',
      ],
    },
  },
  'plain-text-stripper': {
    name: 'Plain Text Stripper',
    description: 'Remove HTML and markdown formatting to get plain text',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'text',
    example: '<p>Hello **world** �� _nice_ to meet you!</p>\n\n# Heading',
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
    detailedDescription: {
      overview: 'The Plain Text Stripper tool removes HTML tags and Markdown formatting from any text, leaving clean, readable plain English text. Works with formatted content from websites, emails, and documents. Perfect for converting formatted content to plain text for compatibility, simplification, or plain English processing.',
      howtouse: [
        'Paste your formatted HTML or Markdown text into the input',
        'Toggle "Strip Markdown" to remove markdown syntax like **bold**, *italic*, headings, etc.',
        'Toggle "Strip HTML" to remove HTML tags and elements',
        'View the cleaned plain text result',
        'Copy the result for use in plain text systems or further processing',
      ],
      features: [
        'Remove HTML tags and all formatting',
        'Remove Markdown syntax and formatting marks',
        'Extract pure text content and preserve meaning',
        'Selective stripping with individual toggle options',
        'Handles nested and complex formatting correctly',
        'Convert formatted text to plain English paragraphs',
      ],
      usecases: [
        'Converting HTML emails to plain text',
        'Extracting plain text from formatted documents',
        'Preparing content for plain text systems',
        'Removing formatting for accessibility requirements',
        'Cleaning up content copied from websites',
        'Converting rich text to simple plain English format',
        'Processing formatted text into natural language',
      ],
    },
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
    detailedDescription: {
      overview: 'The JSON Formatter tool beautifies compact JSON with proper indentation for readability, or minifies JSON to reduce file size. Essential for debugging API responses and preparing JSON for production use.',
      howtouse: [
        'Paste your JSON code into the input field',
        'Select "Beautify" for readable formatting with indentation',
        'Or select "Minify" to compress into a single line',
        'Choose your indent size for beautify mode',
        'View the formatted result',
        'Copy to use in your projects',
      ],
      features: [
        'Beautify JSON with proper indentation',
        'Minify JSON to reduce file size',
        'Validate JSON syntax during formatting',
        'Customizable indent sizes',
        'Handles complex nested objects',
        'Error detection and reporting',
      ],
      usecases: [
        'Debugging API JSON responses',
        'Making JSON human-readable for editing',
        'Minifying JSON for production',
        'Validating JSON structure',
        'Standardizing JSON formatting in projects',
        'Converting compact API data to readable format',
      ],
    },
    show_in_recommendations: false,
  },
  'reverse-text': {
    name: 'Reverse Text',
    description: 'Reverse the order of characters in text',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello World',
    configSchema: [],
    detailedDescription: {
      overview: 'The Reverse Text tool reverses the character order in any plain English text. Works with natural language sentences, words, and paragraphs. Useful for creative writing, creating palindromes, wordplay, or simply reversing text for fun or testing purposes.',
      howtouse: [
        'Type or paste your plain English text into the input field',
        'The tool instantly reverses the character order',
        'View the reversed result',
        'Copy the reversed text for use elsewhere',
      ],
      features: [
        'Instantly reverses text character order',
        'Preserves spaces and special characters',
        'Works with any text length or plain English content',
        'Handles multiple lines and paragraphs',
      ],
      usecases: [
        'Creating palindromes and fun text transformations',
        'Creative writing and wordplay with natural language',
        'Reversing accidentally typed text',
        'Testing string handling in code',
        'Data processing and text transformation',
      ],
    },
    show_in_recommendations: false,
  },
  'slug-generator': {
    name: 'Slug Generator',
    description: 'Convert text to URL-friendly slug format',
    category: 'writing',
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
    detailedDescription: {
      overview: 'The Slug Generator tool converts any plain English text into URL-friendly slug format, perfect for creating clean URLs, file names, and web identifiers. Works with natural language titles, paragraphs, and article names. Removes special characters and spaces, replacing them with your chosen separator.',
      howtouse: [
        'Enter your plain English text or title into the input field',
        'Select your preferred separator: hyphen, underscore, or none',
        'The tool automatically converts text to URL-friendly slug format',
        'View the generated slug',
        'Copy and use in URLs, filenames, or web paths',
      ],
      features: [
        'Transform plain English text to URL-friendly slugs',
        'Converts text to lowercase',
        'Removes special characters and accents from text',
        'Replaces spaces with chosen separator',
        'Customizable separator options (hyphen, underscore, none)',
        'Handles multiple spaces and punctuation correctly',
      ],
      usecases: [
        'Creating URL-friendly blog post titles from text',
        'Generating clean file names from natural text',
        'Creating SEO-friendly URL paths from paragraphs',
        'Generating hashtags for social media',
        'Creating database identifiers from text',
        'Normalizing plain English text for URLs',
        'Converting article titles to web-friendly slugs',
      ],
    },
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
        default: 'Order #(\\d+)',
      },
      {
        id: 'flags',
        label: 'Flags',
        type: 'text',
        placeholder: 'g, i, m, s, etc.',
        default: 'gi',
      },
      {
        id: 'replacement',
        label: 'Replacement (optional)',
        type: 'text',
        placeholder: 'Leave empty to find only',
        default: '',
      },
    ],
    detailedDescription: {
      overview: 'The Regex Tester tool helps you develop and test regular expressions against sample text. Comes with a default pattern that immediately matches the example text, allowing instant testing. Modify the pattern and flags to test your own regular expressions.',
      howtouse: [
        'Paste your sample text into the input area',
        'A default pattern is provided - it will show matches immediately',
        'Modify the regex pattern in the pattern field to test your own',
        'Adjust flags (g for global, i for case-insensitive, m for multiline, etc.)',
        'Optionally enter replacement text for substitution testing',
        'View all matches, match count, and test results in real-time',
      ],
      features: [
        'Default pattern included for instant results',
        'Real-time pattern testing against sample text',
        'Supports all standard regex flags',
        'Shows detailed match information with captured groups',
        'Test replacements before using in code',
        'Indicates match count and match positions',
      ],
      usecases: [
        'Developing and testing regex patterns',
        'Validating email and URL patterns',
        'Pattern-based text extraction and matching',
        'Testing find and replace operations',
        'Learning and practicing regex syntax',
        'Debugging complex pattern matching',
      ],
    },
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
    detailedDescription: {
      overview: 'The Timestamp Converter tool converts between Unix timestamps (seconds since epoch) and human-readable dates/times. Essential for debugging logs, working with APIs, and managing time-based data.',
      howtouse: [
        'Enter a Unix timestamp or date in the input field',
        'Select "Timestamp to Date" to convert numbers to readable dates',
        'Or select "Date to Timestamp" to convert dates to Unix format',
        'View the converted result',
        'Use the conversion in your projects',
      ],
      features: [
        'Convert Unix timestamps to readable dates',
        'Convert dates to Unix timestamps',
        'Display timezone information',
        'Handles millisecond timestamps',
        'Shows both UTC and local time',
      ],
      usecases: [
        'Debugging server logs with timestamps',
        'Working with API responses containing timestamps',
        'Converting historical dates to timestamps',
        'Calculating time differences',
        'Scheduling tasks with Unix time',
        'Data analysis and time-series data',
      ],
    },
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
    detailedDescription: {
      overview: 'The CSV/JSON Converter tool converts data between CSV (comma-separated values) and JSON formats. Essential for data import/export, working with spreadsheets, and API integration.',
      howtouse: [
        'Paste your CSV or JSON data into the input field',
        'Select your conversion mode: CSV to JSON or JSON to CSV',
        'Choose the correct delimiter if using custom separators',
        'View the converted data',
        'Copy and use in your applications',
      ],
      features: [
        'Convert CSV to JSON and vice versa',
        'Customizable delimiters (comma, semicolon, tab)',
        'Automatic header detection in CSV',
        'Properly formatted JSON output',
        'Handles quoted fields with commas',
      ],
      usecases: [
        'Importing CSV spreadsheet data',
        'Exporting database records',
        'Converting between data formats',
        'Data migration and integration',
        'API payload preparation',
        'Data analysis and transformation',
      ],
    },
  },
  'markdown-html-converter': {
    name: 'Markdown to HTML',
    description: 'Convert Markdown syntax to HTML',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'text',
    example: '# Title\n\nThis is **bold** and this is *italic*.\n\n- item A\n- item B',
    configSchema: [],
    detailedDescription: {
      overview: 'The Markdown to HTML Converter tool transforms Markdown formatted text into proper HTML. Perfect for converting documentation, blog posts, and content files to web-ready HTML.',
      howtouse: [
        'Type or paste Markdown formatted text',
        'The tool automatically converts to HTML',
        'Preview the HTML output',
        'Copy the HTML code to your website or editor',
      ],
      features: [
        'Converts Markdown to proper HTML',
        'Supports headings, lists, and code blocks',
        'Handles bold, italic, and links',
        'Preserves formatting and structure',
        'Generates clean, valid HTML',
      ],
      usecases: [
        'Converting blog post drafts to HTML',
        'Converting documentation to web format',
        'Preparing content for websites',
        'Converting README files to web pages',
        'Batch converting Markdown files',
      ],
    },
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
    detailedDescription: {
      overview: 'The XML Formatter tool beautifies XML code with proper indentation for readability or minifies it to reduce file size. Essential for working with configuration files, data exchange, and API responses.',
      howtouse: [
        'Paste your XML code into the input field',
        'Select "Beautify" for readable formatting or "Minify" for compression',
        'Choose your indent size for beautify mode',
        'View the formatted result',
        'Copy the XML to use in your projects',
      ],
      features: [
        'Beautify XML with proper indentation',
        'Minify XML to reduce file size',
        'Validate XML structure',
        'Customizable indent sizes',
        'Preserves attributes and structure',
      ],
      usecases: [
        'Formatting configuration files',
        'Making API XML responses readable',
        'Minifying XML for production',
        'Debugging malformed XML',
        'Standardizing XML formatting',
      ],
    },
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
    detailedDescription: {
      overview: 'The YAML Formatter tool formats YAML configuration files with proper indentation and structure. YAML is commonly used in Docker, Kubernetes, and configuration files, and proper formatting is crucial for correctness.',
      howtouse: [
        'Paste your YAML configuration into the input field',
        'Select your preferred indent size',
        'The tool automatically formats your YAML',
        'View the properly formatted output',
        'Copy to your configuration files',
      ],
      features: [
        'Format YAML with proper indentation',
        'Validate YAML syntax',
        'Customizable indent sizes',
        'Preserves values and structure',
        'Detects formatting errors',
      ],
      usecases: [
        'Formatting Docker Compose files',
        'Formatting Kubernetes manifests',
        'Organizing configuration files',
        'Standardizing YAML formatting',
        'Debugging YAML syntax errors',
      ],
    },
  },
  'url-parser': {
    name: 'URL Parser',
    description: 'Extract and analyze URL components',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'https://example.com:8080/path/page?query=1#section',
    configSchema: [],
    detailedDescription: {
      overview: 'The URL Parser tool breaks down URLs into their constituent parts: protocol, domain, port, path, query parameters, and fragments. Useful for URL validation, analysis, and manipulation.',
      howtouse: [
        'Paste a URL into the input field',
        'The tool automatically analyzes and breaks down the URL',
        'View all components: protocol, host, port, path, query, fragment',
        'Copy specific components as needed',
      ],
      features: [
        'Extract protocol, domain, and port',
        'Parse query parameters',
        'Identify URL fragments',
        'Validate URL structure',
        'Show complete breakdown',
      ],
      usecases: [
        'Debugging URL structures',
        'Extracting query parameters',
        'URL validation',
        'Building dynamic URLs',
        'Analyzing redirect chains',
      ],
    },
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    description: 'Decode and analyze JSON Web Tokens',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    configSchema: [],
    detailedDescription: {
      overview: 'The JWT Decoder tool decodes JSON Web Tokens to reveal their payload and header information. Useful for debugging authentication tokens and understanding token claims without verification.',
      howtouse: [
        'Paste a JWT token into the input field',
        'The tool automatically decodes all three parts',
        'View the header, payload, and signature information',
        'Copy decoded values as needed',
      ],
      features: [
        'Decode JWT header and payload',
        'Display token claims',
        'Show token expiration and issue times',
        'Validate token structure',
        'Decode Base64 payload',
      ],
      usecases: [
        'Debugging authentication tokens',
        'Verifying token claims',
        'Checking token expiration',
        'Analyzing user permissions in tokens',
        'Testing API authentication',
      ],
    },
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
    detailedDescription: {
      overview: 'The Text Diff Checker tool compares two text blocks and highlights the differences between them. Perfect for reviewing document changes, code reviews, and content updates.',
      howtouse: [
        'Paste your first text into the main input field',
        'Paste the second text to compare in the "Text 2" field',
        'The tool highlights additions, deletions, and changes',
        'Review the differences visually',
      ],
      features: [
        'Line-by-line text comparison',
        'Highlights added and deleted text',
        'Shows change percentages',
        'Color-coded differences',
        'Character-level diff analysis',
      ],
      usecases: [
        'Comparing document versions',
        'Code review and change tracking',
        'Content management updates',
        'Finding accidental text changes',
        'Version control visualization',
      ],
    },
  },
  'color-converter': {
    name: 'Color Converter',
    description: 'Convert between RGB, HEX, and HSL color formats',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '#FF5733',
    configSchema: [],
    detailedDescription: {
      overview: 'The Color Converter tool automatically detects your color format and converts between HEX, RGB, and HSL. No format selection needed - just paste a color and get all three formats instantly.',
      howtouse: [
        'Enter a color in any format: HEX (#FF0000), RGB (255,0,0), or HSL (0,100%,50%)',
        'The tool automatically detects your format',
        'View all three color format conversions instantly',
        'Copy the color code in your preferred format',
      ],
      features: [
        'Auto-detect color format (HEX, RGB, HSL)',
        'Convert between all three formats automatically',
        'Supports shorthand HEX colors (#FFF)',
        'Show all conversions simultaneously',
        'Validate color values',
        'Fast and accurate conversion',
      ],
      usecases: [
        'Converting between color format standards without selection',
        'Web design color picking and conversion',
        'CSS color code conversion between formats',
        'Switching between design tool and code formats',
        'Design system color management',
      ],
    },
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
    detailedDescription: {
      overview: 'The Checksum Calculator tool generates CRC32, Adler-32, and simple checksums for data validation. Checksums help verify data integrity and detect transmission errors.',
      howtouse: [
        'Paste your data into the input field',
        'Select the checksum algorithm',
        'View the calculated checksum value',
        'Use it to verify data integrity',
      ],
      features: [
        'Calculate CRC32 checksums',
        'Calculate Adler-32 checksums',
        'Simple checksum calculation',
        'Verify data integrity',
        'Fast computation',
      ],
      usecases: [
        'Verifying file integrity',
        'Network data transmission validation',
        'Error detection in data transfer',
        'File corruption detection',
      ],
    },
  },
  'escape-unescape': {
    name: 'Escape/Unescape',
    description: 'Escape or unescape special characters in text, JSON, CSV, HTML',
    category: 'writing',
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
        label: 'Escape Type',
        type: 'select',
        options: [
          { value: 'javascript', label: 'JavaScript (quotes, newlines, backslashes)' },
          { value: 'json', label: 'JSON (JSON-safe escaping)' },
          { value: 'html', label: 'HTML (HTML entities)' },
          { value: 'csv', label: 'CSV (quote handling)' },
        ],
        default: 'javascript',
      },
    ],
    detailedDescription: {
      overview: 'The Escape/Unescape tool converts any plain English text between plain and escaped formats across JavaScript, JSON, HTML, and CSV standards. Choose which escaping standard to apply or reverse for your specific use case.',
      howtouse: [
        'Paste your plain English text into the input field',
        'Select "Escape" to encode special characters or "Unescape" to decode them',
        'Select the escape type (JavaScript, JSON, HTML, or CSV) that matches your needs',
        'View the converted result',
        'Copy to use in your code or data structures',
      ],
      features: [
        'Transform text between formats with bidirectional conversion',
        'Bidirectional conversion (escape ↔ unescape)',
        'Multiple escape standards: JavaScript, JSON, HTML, CSV',
        'Auto-detects when text is already escaped',
        'Handles quotes, newlines, special chars, and entities',
      ],
      usecases: [
        'Preparing plain text for JSON payloads or APIs',
        'Escaping quotes and special characters for JavaScript code',
        'Converting special characters to HTML entities',
        'Creating valid CSV files with quoted fields and text',
        'Safe HTML content display from plain text',
        'Data format conversion between standards',
        'Processing natural language text for APIs',
      ],
    },
    show_in_recommendations: false,
  },
  'sort-lines': {
    name: 'Sort Lines',
    description: 'Sort text lines alphabetically, reverse, or by length',
    category: 'writing',
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
          { value: 'length-asc', label: 'By Length (Short to Long)' },
          { value: 'length-desc', label: 'By Length (Long to Short)' },
          { value: 'numeric', label: 'Numeric (0-9)' },
          { value: 'reverse', label: 'Reverse Order' },
        ],
        default: 'asc',
      },
      {
        id: 'caseSensitive',
        label: 'Case-Sensitive Sort',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeDuplicates',
        label: 'Remove Duplicates',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'The Sort Lines tool organizes lines of plain English text in various orders: alphabetically, numerically, by length, or reversed. Works with natural language lists, paragraphs broken by lines, and text content. Perfect for organizing lists, data cleanup, and sorting content with flexible options.',
      howtouse: [
        'Paste your plain English text with multiple lines',
        'Select sort order: Ascending (A-Z), Descending (Z-A), By Length, Numeric, or Reverse',
        'Toggle "Case-Sensitive Sort" to distinguish uppercase from lowercase',
        'Toggle "Remove Duplicates" to eliminate repeated lines',
        'View the sorted result',
        'Copy the organized content for use',
      ],
      features: [
        'Sort plain English text lines alphabetically',
        'Sort alphabetically ascending or descending',
        'Sort numerically (0-9)',
        'Sort by line length (short to long or long to short)',
        'Reverse line order',
        'Case-sensitive sorting option',
        'Remove duplicate lines while preserving content',
        'Preserves line content and text',
        'Handles special characters correctly',
      ],
      usecases: [
        'Organizing word lists and dictionaries',
        'Sorting plain text lines from documents',
        'Sorting URLs and domain names',
        'Cleaning up unsorted data and lists',
        'Creating sorted lists of items from text',
        'Finding and removing duplicate lines',
        'Organizing text for analysis or processing',
      ],
    },
    show_in_recommendations: false,
  },
  'whitespace-visualizer': {
    name: 'Whitespace Visualizer',
    description: 'Show spaces, tabs, newlines, and other whitespace characters visually',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello  world\twith\ttabs',
    configSchema: [],
    detailedDescription: {
      overview: 'The Whitespace Visualizer tool makes invisible whitespace characters visible in any text, showing spaces, tabs, newlines, and other whitespace with visual symbols. Works with plain English text and paragraphs. Essential for debugging formatting issues in text.',
      howtouse: [
        'Paste your plain English text into the input field',
        'The tool reveals all whitespace characters visually',
        'Spaces appear as dots (·)',
        'Tabs appear as arrows (→)',
        'Newlines appear as pilcrow marks (¶)',
        'Identify problematic whitespace in your text',
      ],
      features: [
        'Display spaces, tabs, and newlines visually',
        'Show trailing whitespace in text',
        'Detect mixed indentation in paragraphs',
        'Identify formatting issues in documents',
        'Preserve original content and meaning',
        'Make invisible characters visible for debugging',
      ],
      usecases: [
        'Debugging code indentation and formatting issues',
        'Finding hidden trailing spaces in text',
        'Detecting mixed tabs and spaces in documents',
        'Analyzing text formatting from various sources',
        'Fixing whitespace-related issues in content',
        'Debugging plain text exported from other tools',
      ],
    },
    show_in_recommendations: false,
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
    detailedDescription: {
      overview: 'The ASCII/Unicode Converter tool converts text characters to their ASCII/Unicode numeric codes and vice versa. Useful for character encoding work and understanding character values.',
      howtouse: [
        'Enter text or character codes',
        'Select "Text to ASCII/Unicode Codes" to see numeric values',
        'Or select "Codes to Text" to convert numbers back to characters',
        'View all conversions',
      ],
      features: [
        'Convert text to ASCII codes',
        'Convert text to Unicode points',
        'Convert codes back to text',
        'Show both ASCII and Unicode values',
      ],
      usecases: [
        'Character encoding understanding',
        'Working with character data',
        'Debugging character issues',
        'Building character lookup tables',
      ],
    },
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
    detailedDescription: {
      overview: 'The Binary Converter tool converts numbers between different number bases: binary (2), octal (8), decimal (10), and hexadecimal (16). Essential for programming and computer science work.',
      howtouse: [
        'Enter a number in your source base',
        'Select the "From Base" (source number system)',
        'Select the "To Base" (target number system)',
        'View the converted number',
      ],
      features: [
        'Convert between binary, octal, decimal, hex',
        'Support for all standard number bases',
        'Accurate mathematical conversion',
      ],
      usecases: [
        'Debugging hexadecimal color codes',
        'Working with binary bit operations',
        'Computer science and algorithm work',
        'Network masking calculations',
      ],
    },
  },
  'rot13-cipher': {
    name: 'ROT13 Cipher',
    description: 'Encode or decode text using ROT13 simple letter rotation',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello World',
    configSchema: [],
    detailedDescription: {
      overview: 'The ROT13 Cipher tool applies the simple ROT13 cipher, rotating each letter 13 positions in the alphabet. ROT13 is a classic obfuscation technique, though not for serious encryption.',
      howtouse: [
        'Type or paste your text',
        'The tool applies ROT13 rotation automatically',
        'Apply again to decode (ROT13 is its own inverse)',
      ],
      features: [
        'Rotate text by 13 positions',
        'Reversible cipher',
        'Preserves non-alphabetic characters',
      ],
      usecases: [
        'Simple text obfuscation',
        'Rot13 encoding/decoding',
        'Learning cipher basics',
      ],
    },
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
    detailedDescription: {
      overview: 'The Caesar Cipher tool shifts each letter by a configurable amount, creating a simple substitution cipher. Perfect for learning encryption basics and puzzle solving.',
      howtouse: [
        'Enter your text',
        'Set the shift amount (positive or negative)',
        'View the encrypted result',
        'Use the negative shift to decrypt',
      ],
      features: [
        'Configurable letter shift',
        'Preserve case and non-alphabetic characters',
        'Reversible with opposite shift',
      ],
      usecases: [
        'Learning cipher concepts',
        'Simple text obfuscation',
        'Puzzle games and challenges',
        'Historical cipher study',
      ],
    },
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
    detailedDescription: {
      overview: 'The CSS Formatter tool beautifies messy CSS with proper indentation and line breaks for readability, or minifies it to reduce file size. Useful for debugging and production optimization.',
      howtouse: [
        'Paste your CSS code',
        'Select "Beautify" for readable formatting or "Minify" for compression',
        'View the formatted result',
        'Copy to your stylesheet',
      ],
      features: [
        'Beautify CSS with proper indentation',
        'Minify CSS for smaller file sizes',
        'Validate CSS syntax',
        'Organize selectors and properties',
      ],
      usecases: [
        'Improving CSS readability',
        'Minifying CSS for production',
        'Debugging CSS formatting issues',
        'Reducing CSS file size',
      ],
    },
  },
  'sql-formatter': {
    name: 'SQL Formatter',
    description: 'Format SQL queries with proper indentation and readability',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'SELECT id, name, email FROM users WHERE active = 1 ORDER BY created_at DESC',
    configSchema: [],
    detailedDescription: {
      overview: 'The SQL Formatter tool formats SQL queries with proper indentation and line breaks for readability. Essential for working with complex database queries.',
      howtouse: [
        'Paste your SQL query',
        'The tool automatically formats it',
        'Review the formatted query',
        'Copy to your database client',
      ],
      features: [
        'Format SQL with proper indentation',
        'Organize clauses logically',
        'Improve query readability',
        'Validate SQL syntax',
      ],
      usecases: [
        'Formatting complex queries',
        'Improving readability of database code',
        'Debugging query structure',
        'Code review preparation',
      ],
    },
  },
  'http-status-lookup': {
    name: 'HTTP Status Code Lookup',
    description: 'Look up HTTP status codes and their meanings',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '404',
    configSchema: [],
    detailedDescription: {
      overview: 'The HTTP Status Code Lookup tool provides detailed information about HTTP status codes. Look up any code to understand its meaning and common use cases.',
      howtouse: [
        'Enter an HTTP status code (e.g., 404, 200, 500)',
        'View the status name and explanation',
        'Get information about what the code means',
      ],
      features: [
        'Complete HTTP status code database',
        'Detailed explanations for each code',
        'Grouped by category (2xx, 4xx, 5xx, etc)',
      ],
      usecases: [
        'Debugging HTTP errors',
        'Understanding API responses',
        'Learning HTTP status meanings',
        'API development reference',
      ],
    },
  },
  'mime-type-lookup': {
    name: 'MIME Type Lookup',
    description: 'Find MIME types by file extension or vice versa',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'pdf',
    configSchema: [],
    detailedDescription: {
      overview: 'The MIME Type Lookup tool automatically converts between file extensions and MIME types. Enter either a file extension (pdf, jpg, docx) or MIME type (application/pdf) and get instant conversions. Supports 42+ common file types.',
      howtouse: [
        'Enter a file extension (with or without the dot) or a MIME type',
        'The tool automatically detects which you entered and converts it',
        'View the corresponding MIME type or file extensions',
        'For MIME types that map to multiple extensions, all are shown',
      ],
      features: [
        'Comprehensive database of 42+ MIME types',
        'Auto-detects input (extension or MIME type)',
        'Bidirectional conversion without manual selection',
        'Covers documents, images, video, audio, fonts, and archives',
        'Shows all file extensions for a given MIME type',
      ],
      usecases: [
        'Setting correct content types in APIs without lookup',
        'File upload validation and MIME type detection',
        'Content negotiation in web servers',
        'Finding MIME types by file extension instantly',
        'Identifying file types from MIME headers',
      ],
    },
  },
  'http-header-parser': {
    name: 'HTTP Header Parser',
    description: 'Parse and validate HTTP headers',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'Content-Type: application/json\nAuthorization: Bearer token123',
    configSchema: [],
    detailedDescription: {
      overview: 'The HTTP Header Parser tool analyzes HTTP headers, extracting key-value pairs and validating format. Useful for debugging API requests and responses.',
      howtouse: [
        'Paste your HTTP headers',
        'The tool parses and organizes them',
        'View individual header names and values',
      ],
      features: [
        'Parse HTTP header format',
        'Extract key-value pairs',
        'Validate header syntax',
      ],
      usecases: [
        'Debugging API requests',
        'Understanding HTTP responses',
        'Request header validation',
      ],
    },
  },
  'uuid-validator': {
    name: 'UUID Validator',
    description: 'Validate if text is a valid UUID format',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '550e8400-e29b-41d4-a716-446655440000',
    configSchema: [],
    detailedDescription: {
      overview: 'The UUID Validator tool checks if a string is a valid UUID (Universally Unique Identifier) format. Essential for data validation in applications using UUIDs.',
      howtouse: [
        'Enter a UUID string',
        'The tool validates the format',
        'See if it\'s a valid UUID v1, v4, or other version',
      ],
      features: [
        'Validate UUID format',
        'Identify UUID version',
        'Check format compliance',
      ],
      usecases: [
        'User ID validation',
        'Database ID verification',
        'API request validation',
      ],
    },
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
    detailedDescription: {
      overview: 'The JSON Path Extractor tool extracts specific values from JSON using dot notation paths. Perfect for parsing API responses and working with complex JSON structures.',
      howtouse: [
        'Paste your JSON data',
        'Enter a path using dot notation (e.g., user.name.first)',
        'The tool extracts the value at that path',
        'Copy the extracted value',
      ],
      features: [
        'Extract values using dot notation',
        'Support for nested objects',
        'Array indexing support',
        'Validate path existence',
      ],
      usecases: [
        'Extracting data from API responses',
        'Parsing deeply nested JSON',
        'Data transformation tasks',
      ],
    },
  },
  'image-to-base64': {
    name: 'Image to Base64',
    description: 'Convert images to Base64 encoded strings',
    category: 'converter',
    inputTypes: ['image'],
    outputType: 'text',
    configSchema: [],
    detailedDescription: {
      overview: 'The Image to Base64 tool converts image files into Base64 encoded strings, perfect for embedding images in HTML, CSS, or JSON data.',
      howtouse: [
        'Upload or drag an image',
        'The tool converts it to Base64 encoding',
        'Copy the encoded string',
        'Use in <img src="data:image/png;base64,..."> tags',
      ],
      features: [
        'Support for common image formats',
        'Generate data URIs',
        'Copy to clipboard ready',
      ],
      usecases: [
        'Embedding images in HTML/CSS',
        'Creating data URIs',
        'Inline image data in emails',
        'JSON API image transmission',
      ],
    },
  },
  'svg-optimizer': {
    name: 'SVG Optimizer',
    description: 'Minify and optimize SVG files by removing unnecessary content',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
    configSchema: [],
    detailedDescription: {
      overview: 'The SVG Optimizer tool removes unnecessary content from SVG files, reducing file size while maintaining visual appearance. Essential for web performance.',
      howtouse: [
        'Paste your SVG code',
        'The tool optimizes and minifies it',
        'View the optimized SVG',
        'Copy the smaller, cleaner code',
      ],
      features: [
        'Remove unnecessary attributes',
        'Minify SVG markup',
        'Remove metadata and comments',
        'Reduce file size significantly',
      ],
      usecases: [
        'Web icon optimization',
        'Reducing SVG file sizes',
        'Performance optimization',
        'Cleaning SVG exports',
      ],
    },
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
    detailedDescription: {
      overview: 'The Unit Converter tool converts between various measurement units across length, weight, temperature, speed, and volume. Essential for international work and scientific calculations.',
      howtouse: [
        'Enter a numeric value',
        'Select the unit type to convert',
        'Choose your input and output units',
        'View all conversion results',
      ],
      features: [
        'Convert between metric and imperial units',
        'Temperature conversion (Celsius, Fahrenheit, Kelvin)',
        'Comprehensive unit database',
        'Accurate conversions',
      ],
      usecases: [
        'International measurement conversions',
        'Recipe and cooking conversions',
        'Scientific and engineering calculations',
        'Distance and speed conversions',
      ],
    },
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
    detailedDescription: {
      overview: 'The Number Formatter tool formats numbers with thousand separators, decimal precision, and locale-specific formatting. Perfect for displaying numbers in financial and business contexts.',
      howtouse: [
        'Enter a number',
        'Set decimal places',
        'Choose thousand separator style',
        'View formatted result',
      ],
      features: [
        'Add thousand separators',
        'Control decimal precision',
        'Multiple separator styles',
        'Locale-specific formatting',
      ],
      usecases: [
        'Financial data presentation',
        'Currency formatting',
        'Statistical data display',
        'International number standards',
      ],
    },
  },
  'timezone-converter': {
    name: 'Timezone Converter',
    description: 'Convert times between different timezones',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '2pm',
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
    detailedDescription: {
      overview: 'The Timezone Converter tool converts times between different timezones worldwide. Perfect for coordinating across global teams and international scheduling.',
      howtouse: [
        'Enter a time in formats like 1pm, 2am, 5:30pm, or 13:00',
        'Select the source timezone',
        'Select the target timezone',
        'View the converted time',
      ],
      features: [
        'Support for 16+ major timezones',
        'Account for daylight saving time',
        'Accurate offset calculations',
      ],
      usecases: [
        'Scheduling meetings across timezones',
        'International business operations',
        'Travel planning and coordination',
        'Global team scheduling',
      ],
    },
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
    detailedDescription: {
      overview: 'The Base Converter tool converts numbers between any base from 2 to 36. Support for binary, octal, decimal, hexadecimal, and custom bases.',
      howtouse: [
        'Enter a number',
        'Specify the source base (2-36)',
        'Specify the target base',
        'View the converted number',
      ],
      features: [
        'Convert between any base (2-36)',
        'Support for alphanumeric digits',
        'Accurate mathematical conversion',
      ],
      usecases: [
        'Number system conversions',
        'Programming and development',
        'Mathematical calculations',
      ],
    },
  },
  'math-evaluator': {
    name: 'Math Expression Evaluator',
    description: 'Safely evaluate and calculate mathematical expressions',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    example: '(10 + 5) * 2 - 3',
    configSchema: [],
    detailedDescription: {
      overview: 'The Math Expression Evaluator safely evaluates mathematical expressions with proper order of operations. Perfect for quick calculations and formula validation.',
      howtouse: [
        'Enter a mathematical expression',
        'The tool evaluates it safely',
        'View the calculation result',
      ],
      features: [
        'Support for all basic math operations',
        'Parentheses and order of operations',
        'Functions like sin, cos, sqrt, etc.',
        'Safe evaluation sandbox',
      ],
      usecases: [
        'Quick mathematical calculations',
        'Formula validation',
        'Spreadsheet formula testing',
        'Physics and engineering calculations',
      ],
    },
  },
  'keyword-extractor': {
    name: 'Word Frequency Counter',
    description: 'Count and analyze word frequency in text',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'Machine learning and deep learning are important. Machine learning and AI are the future. Learning is essential.',
    configSchema: [
      {
        id: 'count',
        label: 'Number of Words to Show',
        type: 'number',
        placeholder: '10',
        default: 10,
      },
    ],
    detailedDescription: {
      overview: 'The Word Frequency Counter analyzes text and counts how many times each word appears. Shows the most frequently occurring words in your text.',
      howtouse: [
        'Paste your text',
        'Set how many top words you want to see',
        'The tool counts all words (4+ characters)',
        'View words ranked by frequency',
      ],
      features: [
        'Count word occurrences',
        'Sort by frequency',
        'Configurable result count',
        'Case-insensitive matching',
      ],
      usecases: [
        'Analyze text patterns',
        'Find repeated words in documents',
        'Content analysis',
        'Text statistics',
      ],
    },
  },
  'cron-tester': {
    name: 'Cron Expression Tester',
    description: 'Validate and explain cron schedule expressions',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',
    example: '0 9 * * MON-FRI',
    configSchema: [],
    detailedDescription: {
      overview: 'The Cron Expression Tester validates and explains cron schedule expressions used in Linux/Unix systems. Perfect for scheduling jobs and understanding cron syntax.',
      howtouse: [
        'Enter a cron expression',
        'The tool validates the syntax',
        'View the explanation of when it runs',
        'See next scheduled execution times',
      ],
      features: [
        'Validate cron expression syntax',
        'Explain cron schedule in plain English',
        'Show next execution times',
        'Support for standard cron syntax',
      ],
      usecases: [
        'Scheduling server tasks',
        'Job scheduler configuration',
        'System automation',
        'Cron syntax learning',
      ],
    },
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
    detailedDescription: {
      overview: 'The File Size Converter tool converts between different file size units: bytes, KB, MB, GB, and TB. Essential for disk space management and file size estimation.',
      howtouse: [
        'Enter a file size value',
        'Select the source unit',
        'Select the target unit',
        'View the converted size',
      ],
      features: [
        'Convert between all standard file size units',
        'Accurate mathematical conversion',
        'Support for decimal and binary definitions',
      ],
      usecases: [
        'Disk space management',
        'File upload size limits',
        'Bandwidth calculations',
        'Storage capacity planning',
      ],
    },
  },
  'js-formatter': {
    name: 'JavaScript Formatter',
    description: 'Format, minify, or beautify JavaScript code',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'function greet(name) {\n  console.log("Hello, " + name);\n}',
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
      {
        id: 'preserveComments',
        label: 'Preserve Important Comments',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'The JavaScript Formatter tool beautifies messy JavaScript code with proper formatting or minifies it for production use. Essential for code readability and performance.',
      howtouse: [
        'Paste your JavaScript code',
        'Select "Beautify" for readability or "Minify" for compression',
        'Choose indent style for beautification',
        'Optionally preserve comments',
        'Copy the formatted result',
      ],
      features: [
        'Beautify JavaScript with proper indentation',
        'Minify JavaScript to reduce file size',
        'Customizable formatting options',
        'Preserve or remove comments',
        'Validate syntax errors',
      ],
      usecases: [
        'Improving code readability',
        'Production code minification',
        'Debugging malformed JavaScript',
        'Code standardization',
      ],
    },
  },
  'email-validator': {
    name: 'Email Validator',
    description: 'Validate email addresses and check format correctness',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'john.doe@example.com',
    configSchema: [],
    detailedDescription: {
      overview: 'The Email Validator tool checks if email addresses are properly formatted and valid. Useful for form validation and data quality checks.',
      howtouse: [
        'Enter an email address',
        'The tool validates the format',
        'See if the email is valid or the specific issues',
      ],
      features: [
        'Validate email format',
        'Check domain structure',
        'Identify format errors',
      ],
      usecases: [
        'Form validation',
        'Data quality checking',
        'Preventing invalid email entries',
        'List cleaning',
      ],
    },
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
    detailedDescription: {
      overview: 'The IP Address Validator tool validates IPv4 and IPv6 addresses for correct format. Essential for network configuration and validation.',
      howtouse: [
        'Enter an IP address',
        'Select IP version (IPv4, IPv6, or both)',
        'The tool validates the address format',
      ],
      features: [
        'Validate IPv4 and IPv6 addresses',
        'Check format correctness',
        'Identify invalid addresses',
      ],
      usecases: [
        'Network configuration validation',
        'Firewall rule validation',
        'Server setup verification',
        'Log analysis',
      ],
    },
  },
  'ip-integer-converter': {
    name: 'IP ↔ Integer Converter',
    description: 'Convert between IPv4 addresses and integer representation',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.1',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'toInteger', label: 'IP to Integer' },
          { value: 'toIp', label: 'Integer to IP' },
        ],
        default: 'toInteger',
      },
    ],
    detailedDescription: {
      overview: 'The IP ↔ Integer Converter tool converts between IPv4 addresses and their integer representation. Useful for IP address calculations, database storage, and network programming. Auto-detects the input format.',
      howtouse: [
        'Enter an IPv4 address (e.g., 192.168.1.1) or an integer (e.g., 3232235777)',
        'The tool automatically detects the format and converts to the other',
        'For manual control, select the desired conversion mode',
        'View the result with additional formats (hex, binary)',
      ],
      features: [
        'Bidirectional conversion (IP ↔ Integer)',
        'Auto-detects input format',
        'Shows hex and binary representations',
        'Support for all valid IPv4 addresses',
        'Full range support (0 to 4294967295)',
      ],
      usecases: [
        'Database IP storage and retrieval',
        'IP range calculations and subnet masking',
        'Network programming and debugging',
        'Log analysis and IP lookups',
        'Converting between different IP representations',
      ],
    },
  },
  'ip-range-calculator': {
    name: 'IP Range Calculator',
    description: 'Calculate CIDR ranges, subnets, and IP boundaries',
    category: 'calculator',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.0/24',
    configSchema: [],
    detailedDescription: {
      overview: 'The IP Range Calculator tool analyzes CIDR notations and calculates subnet boundaries, broadcast addresses, and available IP ranges. Essential for network planning.',
      howtouse: [
        'Enter a CIDR notation (e.g., 192.168.1.0/24)',
        'The tool calculates all range details',
        'View subnet mask, broadcast address, and available IPs',
      ],
      features: [
        'Calculate subnet information',
        'Show CIDR breakdown',
        'List usable IP ranges',
        'Calculate broadcast address',
      ],
      usecases: [
        'Network planning',
        'Subnet allocation',
        'CIDR notation calculations',
        'Network documentation',
      ],
    },
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
    detailedDescription: {
      overview: 'The Markdown Linter tool checks Markdown files for syntax errors and style issues. Helps maintain consistent and valid Markdown formatting.',
      howtouse: [
        'Paste your Markdown content',
        'Toggle strict mode for stricter validation',
        'View identified issues and warnings',
        'Fix issues and improve formatting',
      ],
      features: [
        'Validate Markdown syntax',
        'Check heading hierarchy',
        'Detect formatting inconsistencies',
        'Suggest improvements',
        'Strict and lenient modes',
      ],
      usecases: [
        'Documentation quality assurance',
        'README file validation',
        'Blog post checking',
        'Markdown consistency enforcement',
      ],
    },
  },
}

export function runTool(toolId, inputText, config, inputImage = null) {
  switch (toolId) {
    case 'text-toolkit':
      const toolkitResult = {
        wordCounter: wordCounter(inputText),
        wordFrequency: wordFrequency(inputText),
        reverseText: reverseText(inputText),
        whitespaceVisualizer: whitespaceVisualizer(inputText),
        caseConverter: {
          uppercase: caseConverter(inputText, 'uppercase'),
          lowercase: caseConverter(inputText, 'lowercase'),
          titleCase: caseConverter(inputText, 'titlecase'),
          sentenceCase: caseConverter(inputText, 'sentencecase'),
        },
        textAnalyzer: textAnalyzer(inputText, 'both'),
        slugGenerator: slugGenerator(inputText, { separator: '-' }),
        removeExtras: cleanText(inputText, {
          removePdfGarbage: config?.removePdfGarbage !== false,
          removeInvisibleChars: config?.removeInvisibleChars !== false,
          stripHtml: config?.stripHtml !== false,
          stripMarkdown: config?.stripMarkdown !== false,
          normalizeWhitespace: config?.normalizeWhitespace !== false,
          smartJoinWords: config?.smartJoinWords === true,
          removeTimestamps: config?.removeTimestamps === true,
          trimLines: config?.trimLines !== false,
          fixPunctuationSpacing: config?.fixPunctuationSpacing !== false,
          compressSpaces: config?.compressSpaces !== false,
          removeLineBreaks: config?.removeLineBreaks === true,
          removeBlankLines: config?.removeBlankLines !== false,
          compressLineBreaks: config?.compressLineBreaks !== false,
          removeDuplicateLines: config?.removeDuplicateLines === true,
          filterCharacters: config?.filterCharacters || 'none',
          flattenToSingleLine: config?.flattenToSingleLine === true,
        }),
        sortLines: sortLines(inputText, {
          order: config?.order || 'asc',
          caseSensitive: config?.caseSensitive || false,
          removeDuplicates: config?.removeDuplicates || false,
        }),
        findReplace: findReplace(inputText, config || {}),
        textDiff: textDiffChecker(inputText, config || {}),
      }

      return toolkitResult
    case 'image-resizer':
      return imageResizer(inputImage, config)
    case 'word-counter':
      return wordCounter(inputText)
    case 'case-converter':
      return caseConverter(inputText, config.caseType)
    case 'find-replace':
      return findReplace(inputText, config)
    case 'remove-extras':
      return cleanText(inputText, {
        removePdfGarbage: config?.removePdfGarbage !== false,
        removeInvisibleChars: config?.removeInvisibleChars !== false,
        stripHtml: config?.stripHtml !== false,
        stripMarkdown: config?.stripMarkdown !== false,
        normalizeWhitespace: config?.normalizeWhitespace !== false,
        smartJoinWords: config?.smartJoinWords === true,
        removeTimestamps: config?.removeTimestamps === true,
        trimLines: config?.trimLines !== false,
        fixPunctuationSpacing: config?.fixPunctuationSpacing !== false,
        compressSpaces: config?.compressSpaces !== false,
        removeLineBreaks: config?.removeLineBreaks === true,
        removeBlankLines: config?.removeBlankLines !== false,
        compressLineBreaks: config?.compressLineBreaks !== false,
        removeDuplicateLines: config?.removeDuplicateLines === true,
        filterCharacters: config?.filterCharacters || 'none',
        flattenToSingleLine: config?.flattenToSingleLine === true,
      })
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
    case 'js-formatter':
      return config.mode === 'minify' ? jsMinifier(inputText, config) : jsBeautifier(inputText, config)
    case 'email-validator':
      return emailValidator(inputText)
    case 'ip-validator':
      return ipValidator(inputText, config)
    case 'ip-integer-converter':
      return ipIntegerConverter(inputText, config)
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

function wordFrequency(text) {
  const words = text.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
  const frequency = {}

  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  const sorted = Object.entries(frequency)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalUniqueWords: Object.keys(frequency).length,
    totalWords: words.length,
    frequency: sorted,
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

function cleanText(text, config = {}) {
  let result = text

  // 1. Remove PDF garbage characters and control characters
  if (config.removePdfGarbage !== false) {
    result = removePdfAndGarbageChars(result)
  }

  // 2. Remove Unicode zero-width and invisible characters
  if (config.removeInvisibleChars !== false) {
    result = removeInvisibleUnicodeChars(result)
  }

  // 3. Remove HTML tags (if present from copy/paste)
  if (config.stripHtml !== false) {
    result = result.replace(/<[^>]*>/g, '')
  }

  // 4. Remove Markdown formatting
  if (config.stripMarkdown !== false) {
    result = stripMarkdownFormatting(result)
  }

  // 5. Normalize Unicode whitespace (NBSP, etc.)
  if (config.normalizeWhitespace !== false) {
    result = normalizeAllWhitespace(result)
  }

  // 6. Smart word joining (fix OCR artifacts like "Th is tex t")
  if (config.smartJoinWords === true) {
    result = smartJoinWords(result)
  }

  // 7. Remove timestamps from logs (optional)
  if (config.removeTimestamps === true) {
    result = removeLogTimestamps(result)
  }

  // 8. Trim each line
  if (config.trimLines !== false) {
    result = result
      .split('\n')
      .map(line => line.trim())
      .join('\n')
  }

  // 9. Fix spacing around punctuation
  if (config.fixPunctuationSpacing !== false) {
    result = fixPunctuationSpacing(result)
  }

  // 10. Handle excessive spacing (tabs, multiple spaces, OCR artifacts)
  if (config.compressSpaces !== false) {
    result = compressExcessiveSpacing(result)
  }

  // 11. Remove line breaks (flatten to single line)
  if (config.removeLineBreaks === true) {
    result = result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
  }

  // 12. Remove excessive line breaks (only if NOT removing all line breaks)
  if (config.removeBlankLines !== false && config.removeLineBreaks !== true) {
    result = result
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')
  }

  // 13. Compress consecutive blank lines to max 2 (only if NOT removing line breaks)
  if (config.compressLineBreaks !== false && config.removeLineBreaks !== true) {
    result = result.replace(/\n\n\n+/g, '\n\n')
  }

  // 14. Remove duplicate lines
  if (config.removeDuplicateLines === true) {
    const lines = result.split('\n')
    const seen = new Set()
    result = lines
      .filter(line => {
        const trimmed = line.trim()
        if (trimmed === '' || seen.has(trimmed)) return false
        seen.add(trimmed)
        return true
      })
      .join('\n')
  }

  // 15. Filter non-ASCII characters (3 levels)
  if (config.filterCharacters === 'ascii-only') {
    result = filterToAsciiOnly(result)
  } else if (config.filterCharacters === 'keep-accents') {
    result = filterToAsciiWithAccents(result)
  } else if (config.filterCharacters === 'basic-punctuation') {
    result = filterToBasicPunctuation(result)
  }

  // 16. Flatten to single line (legacy support)
  if (config.flattenToSingleLine === true && config.removeLineBreaks !== true) {
    result = result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
  }

  // Final cleanup
  result = result.trim()

  return result
}

function removePdfAndGarbageChars(text) {
  let result = text

  // Remove common PDF junk characters
  // BOM (byte order mark), garbled characters from PDF extraction
  result = result.replace(/^\uFEFF/, '')
  result = result.replace(/ï»¿/g, '')

  // Remove soft hyphens and other control characters
  result = result.replace(/\u00AD/g, '')

  // Remove other common PDF artifacts
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return result
}

function removeInvisibleUnicodeChars(text) {
  let result = text

  // Zero-width characters - convert to spaces so words don't merge
  result = result.replace(/\u200B/g, ' ') // Zero Width Space → space
  result = result.replace(/\u200C/g, ' ') // Zero Width Non-Joiner → space
  result = result.replace(/\u200D/g, ' ') // Zero Width Joiner → space
  result = result.replace(/\uFEFF/g, ' ') // Zero Width No-Break Space → space

  // Word joiner and other invisible formatting
  result = result.replace(/\u2060/g, ' ') // Word Joiner → space
  result = result.replace(/\u061C/g, ' ') // Arabic Letter Mark → space
  result = result.replace(/\u180E/g, ' ') // Mongolian Vowel Separator → space

  // Other invisible spaces and separators
  result = result.replace(/\u2028/g, '\n') // Line Separator → newline
  result = result.replace(/\u2029/g, '\n') // Paragraph Separator → newline

  return result
}

function normalizeAllWhitespace(text) {
  let result = text

  // Convert tabs to spaces
  result = result.replace(/\t+/g, ' ')

  // Normalize various Unicode spaces to regular space
  result = result.replace(/\u00A0/g, ' ') // Non-breaking space
  result = result.replace(/\u1680/g, ' ') // Ogham space mark
  result = result.replace(/\u2000/g, ' ') // En quad
  result = result.replace(/\u2001/g, ' ') // Em quad
  result = result.replace(/\u2002/g, ' ') // En space
  result = result.replace(/\u2003/g, ' ') // Em space
  result = result.replace(/\u2004/g, ' ') // Three-per-em space
  result = result.replace(/\u2005/g, ' ') // Four-per-em space
  result = result.replace(/\u2006/g, ' ') // Six-per-em space
  result = result.replace(/\u2007/g, ' ') // Figure space
  result = result.replace(/\u2008/g, ' ') // Punctuation space
  result = result.replace(/\u2009/g, ' ') // Thin space
  result = result.replace(/\u200A/g, ' ') // Hair space

  // Handle multiple spaces (but preserve intentional structure for now)
  // Will be handled separately in compressExcessiveSpacing

  return result
}

function stripMarkdownFormatting(text) {
  let result = text

  // Remove bold and italic markers
  result = result.replace(/\*\*([^\*]+)\*\*/g, '$1') // **bold**
  result = result.replace(/\*([^\*]+)\*/g, '$1') // *italic*
  result = result.replace(/__([^_]+)__/g, '$1') // __bold__
  result = result.replace(/_([^_]+)_/g, '$1') // _italic_
  result = result.replace(/~~([^~]+)~~/, '$1') // ~~strikethrough~~

  // Remove backticks for inline code
  result = result.replace(/`([^`]+)`/g, '$1') // `code`
  result = result.replace(/```[\s\S]*?```/g, '') // Remove code blocks

  // Remove markdown headings
  result = result.replace(/^#+\s+/gm, '') // # Heading

  // Remove markdown links
  result = result.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1') // [text](url)

  // Remove markdown list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, '') // - bullet points

  // Clean up multiple paragraph breaks from markdown
  result = result.replace(/\n\n+/g, '\n\n')

  return result
}

function removeLogTimestamps(text) {
  let result = text

  // Remove various timestamp formats from logs
  // [HH:MM] or [HH:MM:SS] format - run multiple passes until no matches
  let prevResult
  do {
    prevResult = result
    result = result.replace(/\[\d{2}:\d{2}(?::\d{2})?\]\s*/g, '')
  } while (result !== prevResult)

  // ISO timestamp format (YYYY-MM-DDTHH:MM:SS...Z)
  result = result.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?\s*/g, '')

  // Common log format "YYYY-MM-DD HH:MM:SS"
  result = result.replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s*/g, '')

  // 12-hour format with AM/PM
  result = result.replace(/\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*/gi, '')

  // Clean up empty lines left by timestamp removal
  result = result.replace(/^\s*$/gm, '')
  result = result.replace(/\n{2,}/g, '\n')

  return result
}

function fixPunctuationSpacing(text) {
  let result = text

  // Remove space before punctuation (but not newlines)
  result = result.replace(/ +([,.!?;:\)])/g, '$1')
  result = result.replace(/ +(['"'])/g, '$1')

  // Ensure space after punctuation (but preserve newlines)
  // Only match spaces/tabs, not newlines
  result = result.replace(/([.!?])[ \t]*\n/g, '$1\n') // Preserve newline after period
  result = result.replace(/([.!?])[ \t]+([A-Z])/g, '$1 $2') // Add space before capital
  result = result.replace(/([.!?;:])[ \t]+([A-Za-z0-9])/g, '$1 $2')

  // Fix space after comma
  result = result.replace(/,([^\s])/g, ', $1')

  // Ensure single space after colons (but not URLs)
  result = result.replace(/([^:]):  +/g, '$1: ')

  return result
}

function compressExcessiveSpacing(text) {
  let result = text

  // Compress multiple spaces on the same line to single space
  // But preserve intentional indentation at line starts
  result = result
    .split('\n')
    .map(line => {
      // Get leading whitespace
      const leadingMatch = line.match(/^\s*/)
      const leading = leadingMatch ? leadingMatch[0] : ''

      // Get the actual content
      const content = line.slice(leading.length)

      // Compress multiple spaces to single space in content
      const cleaned = content.replace(/\s{2,}/g, ' ')

      return leading + cleaned
    })
    .join('\n')

  // Remove lines that became empty after cleaning (except intentional blank lines)
  result = result
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      return trimmed.length === 0 ? '' : line
    })
    .join('\n')

  return result
}

function smartJoinWords(text) {
  // Fix OCR artifacts where words are split with spaces: "T h i s" → "This" or "c a m e" → "came"
  // Conservative approach: ONLY join single letters (single char words)
  // This preserves normal text while fixing clear OCR fragmentation
  let result = text

  // Key pattern: single-letter-word followed by space followed by another single-letter-word
  // Word boundary \b ensures we're matching actual word boundaries, not middle of words
  // This matches: "c a m e" or "O C R" or "T e x t" but NOT "This is" or "Hello world"

  // Match single letters as complete words, separated by spaces
  // Use negative lookahead/lookbehind to ensure they're truly single-letter words
  let prevResult
  let passCount = 0
  const maxPasses = 20  // Safety limit to prevent infinite loops

  do {
    prevResult = result

    // Join single letter words: \b matches word boundary
    // Pattern: word boundary + single letter + word boundary + spaces + word boundary + single letter + word boundary
    result = result.replace(/\b([a-z])\s+([a-z])\b/gi, '$1$2')

    passCount++
  } while (result !== prevResult && passCount < maxPasses)

  // Clean up any multiple spaces that might have been created
  result = result.replace(/\s{2,}/g, ' ')

  return result
}

function filterToAsciiOnly(text) {
  // Keep only: a-zA-Z0-9 and basic punctuation (.,!?;:-)
  let result = text

  // Normalize accented characters to their ASCII equivalents
  try {
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  } catch (e) {
    // Fallback if normalize is not available
  }

  // Remove everything that's not ASCII letters, numbers, basic punctuation, or whitespace
  result = result.replace(/[^\x20-\x7E\n\t]/g, '')

  // Compress multiple spaces
  result = result.replace(/ {2,}/g, ' ')

  return result.trim()
}

function filterToAsciiWithAccents(text) {
  // Keep ASCII + accented letters (àáâãäå, èéêë, etc.)
  // Remove other special Unicode (emojis, symbols, etc.)
  let result = text

  // Keep: ASCII + Latin-1 Extended + Latin Extended-A ranges
  // Remove: everything else (emojis, Asian characters, symbols, etc.)
  result = result.replace(/[^\x20-\x7E\u00C0-\u017F\n\t]/g, '')

  // Compress multiple spaces
  result = result.replace(/ {2,}/g, ' ')

  return result.trim()
}

function filterToBasicPunctuation(text) {
  // Keep only: letters, numbers, spaces, and basic punctuation (.,!?;:- and quotes)
  let result = text

  // Normalize accented characters first
  try {
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  } catch (e) {
    // Fallback if normalize is not available
  }

  // Remove everything except: word characters, whitespace, and basic punctuation
  result = result.replace(/[^\w\s.,!?;:\-'"()\n\t]/g, '')

  // Compress repeated punctuation (!!!, ???, etc.)
  result = result.replace(/([.!?;:]){2,}/g, '$1')

  // Compress multiple spaces
  result = result.replace(/ {2,}/g, ' ')

  return result.trim()
}

function removeExtras(text, config) {
  // Use the advanced cleanText function instead
  return cleanText(text, config)
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
  try {
    const input = text.trim()
    let rgb = null
    let detectedFormat = 'unknown'

    const hexMatch = input.match(/^#?([0-9a-fA-F]{3}){1,2}$/)
    const rgbMatch = input.match(/^rgb(a)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    const hslMatch = input.match(/^hsl(a)?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)

    if (hexMatch) {
      detectedFormat = 'hex'
      let hex = input.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      rgb = { r, g, b }
    } else if (rgbMatch) {
      detectedFormat = 'rgb'
      const match = input.match(/\d+/g)
      rgb = { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) }
    } else if (hslMatch) {
      detectedFormat = 'hsl'
      const match = input.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
      if (match) {
        rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
      }
    }

    if (!rgb) {
      return { error: 'Invalid color format. Use HEX (#FF0000), RGB (255,0,0), or HSL (0,100%,50%)' }
    }

    return {
      detectedFormat,
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
    if (format === 'csv') return text.includes(',') || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text
  } else if (mode === 'unescape') {
    if (format === 'javascript') return text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    if (format === 'json') {
      try {
        return JSON.parse(`"${text}"`)
      } catch {
        return text
      }
    }
    if (format === 'html') return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    if (format === 'csv') return text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1).replace(/""/g, '"') : text
  }

  return text
}

function sortLines(text, config) {
  const lines = text.split('\n')
  let sorted = [...lines]
  const order = config.order || 'asc'
  const caseSensitive = config.caseSensitive || false
  const removeDuplicates = config.removeDuplicates || false

  // Create sort function based on case sensitivity
  const compareStr = (a, b) => {
    const aStr = caseSensitive ? a : a.toLowerCase()
    const bStr = caseSensitive ? b : b.toLowerCase()
    return aStr.localeCompare(bStr)
  }

  // Apply sorting based on order type
  if (order === 'asc') {
    sorted.sort(compareStr)
  } else if (order === 'desc') {
    sorted.sort(compareStr).reverse()
  } else if (order === 'length-asc') {
    sorted.sort((a, b) => a.length - b.length || compareStr(a, b))
  } else if (order === 'length-desc') {
    sorted.sort((a, b) => b.length - a.length || compareStr(a, b))
  } else if (order === 'numeric') {
    sorted.sort((a, b) => {
      const aNum = parseFloat(a) || 0
      const bNum = parseFloat(b) || 0
      if (aNum !== bNum) return aNum - bNum
      return compareStr(a, b)
    })
  } else if (order === 'reverse') {
    sorted.reverse()
  }

  // Remove duplicates if requested
  if (removeDuplicates) {
    sorted = [...new Set(sorted)]
  }

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
  const mimeDatabase = {
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    gz: 'application/gzip',
    tar: 'application/x-tar',
    txt: 'text/plain',
    csv: 'text/csv',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    toml: 'application/toml',
    sh: 'application/x-sh',
    exe: 'application/x-msdownload',
    dmg: 'application/x-apple-diskimage',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject'
  }

  const input = text.trim().toLowerCase()

  if (!config.mode || config.mode === 'extension') {
    const ext = input.replace(/^\./, '')
    const mimeType = mimeDatabase[ext]
    return {
      extension: ext,
      mimeType: mimeType || 'Not found in database',
      found: !!mimeType
    }
  } else if (config.mode === 'mime') {
    const reverseMime = {}
    Object.entries(mimeDatabase).forEach(([ext, mime]) => {
      if (!reverseMime[mime]) {
        reverseMime[mime] = []
      }
      reverseMime[mime].push(ext)
    })

    const extensions = reverseMime[input] || reverseMime[input + '; charset=utf-8'] || null
    return {
      mimeType: input,
      extensions: extensions || 'Not found in database',
      found: !!extensions
    }
  }

  return { error: 'Invalid mode' }
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

function detectUnitType(text) {
  const lowerText = text.toLowerCase()

  const unitPatterns = {
    length: /\b(meter|metres?|km|kilometer|ft|feet|mi|mile|cm|centimeter|mm|millimeter|yd|yard|inch|in|micrometers?|µm|nm|nanometer|nautical|nmi)\b/,
    weight: /\b(kg|kilogram|lb|lbs|pound|pounds|oz|ounce|gram|g|mg|milligram|ton|tonne|stone|carat|grain)\b/,
    temperature: /\b(celsius|°C|fahrenheit|°F|kelvin|K)\b/,
    speed: /\b(m\/s|km\/h|mph|mile\/hour|kilometer\/hour)\b/,
    volume: /\b(litre|liter|l|ml|milliliter|gallon|gal|cup|pint|fluid-ounce|fl-oz|floz)\b/,
    pressure: /\b(bar|psi|pascal|pa|atm|atmosphere|torr|mmhg)\b/,
    energy: /\b(joule|calorie|btu|kilocalorie|kcal|watt|w|kilowatt|kw|horsepower|hp|ergs?)\b/,
    time: /\b(second|seconds|sec|minute|minutes|min|hour|hours|hr|day|days|week|weeks|month|months|year|years)\b/,
    data: /\b(byte|bytes|b|kilobyte|kb|megabyte|mb|gigabyte|gb|terabyte|tb|petabyte|pb|bit|bits)\b/
  }

  for (const [type, pattern] of Object.entries(unitPatterns)) {
    if (pattern.test(lowerText)) {
      return type
    }
  }

  return 'length'
}

function unitConverter(text, config) {
  const value = parseFloat(text)
  if (isNaN(value)) return { error: 'Invalid number' }

  let type = config.type
  if (!type) {
    type = detectUnitType(text)
  }

  const conversions = {
    length: {
      units: {
        m: { to: { km: 0.001, ft: 3.28084, mi: 0.000621371, cm: 100, mm: 1000, yd: 1.09361, in: 39.3701, nm: 1e9, µm: 1e6 },
             base: 'meter' },
        km: { to: { m: 1000, ft: 3280.84, mi: 0.621371, cm: 100000, mm: 1000000, yd: 1093.61, in: 39370.1, nm: 1e12, µm: 1e9 },
              base: 'kilometer' },
        ft: { to: { m: 0.3048, km: 0.0003048, mi: 0.000189394, cm: 30.48, mm: 304.8, yd: 0.333333, in: 12, nm: 3.048e8, µm: 304800 },
              base: 'feet' },
        mi: { to: { m: 1609.34, km: 1.60934, ft: 5280, cm: 160934, mm: 1609340, yd: 1760, in: 63360, nm: 1.609e12, µm: 1.609e12 },
              base: 'miles' },
        cm: { to: { m: 0.01, km: 0.00001, ft: 0.328084, mi: 0.00000621371, mm: 10, yd: 0.0109361, in: 0.393701, nm: 1e7, µm: 10000 },
              base: 'centimeter' },
        mm: { to: { m: 0.001, km: 0.000001, ft: 0.00328084, mi: 6.21371e-7, cm: 0.1, yd: 0.00109361, in: 0.0393701, nm: 1e6, µm: 1000 },
              base: 'millimeter' },
        yd: { to: { m: 0.9144, km: 0.0009144, ft: 3, mi: 0.000568182, cm: 91.44, mm: 914.4, in: 36, nm: 9.144e8, µm: 914400 },
              base: 'yard' },
        in: { to: { m: 0.0254, km: 0.0000254, ft: 0.0833333, mi: 0.0000157828, cm: 2.54, mm: 25.4, yd: 0.0277778, nm: 2.54e7, µm: 25400 },
              base: 'inch' },
        nm: { to: { m: 1e-9, km: 1e-12, ft: 3.28084e-9, mi: 6.21371e-10, cm: 1e-7, mm: 1e-6, yd: 1.09361e-9, in: 3.93701e-8, µm: 0.001 },
              base: 'nanometer' },
        µm: { to: { m: 1e-6, km: 1e-9, ft: 3.28084e-6, mi: 6.21371e-7, cm: 0.0001, mm: 0.001, yd: 1.09361e-6, in: 3.93701e-5, nm: 1000 },
              base: 'micrometer' }
      }
    },
    weight: {
      units: {
        kg: { to: { lb: 2.20462, oz: 35.274, g: 1000, mg: 1e6, ton: 0.001, st: 0.157473, t: 0.001 },
              base: 'kilogram' },
        lb: { to: { kg: 0.453592, oz: 16, g: 453.592, mg: 453592, ton: 0.000453592, st: 0.0714286, t: 0.000453592 },
              base: 'pound' },
        oz: { to: { kg: 0.0283495, lb: 0.0625, g: 28.3495, mg: 28349.5, ton: 0.0000283495, st: 0.00446429, t: 0.0000283495 },
              base: 'ounce' },
        g: { to: { kg: 0.001, lb: 0.00220462, oz: 0.035274, mg: 1000, ton: 0.000001, st: 0.000157473, t: 0.000001 },
             base: 'gram' },
        mg: { to: { kg: 0.000001, lb: 2.20462e-6, oz: 3.5274e-5, g: 0.001, ton: 1e-9, st: 1.57473e-7, t: 1e-9 },
              base: 'milligram' },
        ton: { to: { kg: 1000, lb: 2204.62, oz: 35274, g: 1000000, mg: 1e9, st: 157.473, t: 1 },
               base: 'ton' },
        st: { to: { kg: 6.35029, lb: 14, oz: 224, g: 6350.29, mg: 6.35029e6, ton: 0.00635029, t: 0.00635029 },
              base: 'stone' },
        t: { to: { kg: 1000, lb: 2204.62, oz: 35274, g: 1000000, mg: 1e9, ton: 1, st: 157.473 },
             base: 'metric-ton' }
      }
    },
    temperature: {
      units: {
        C: { to: { F: (v) => (v * 9/5) + 32, K: (v) => v + 273.15 },
             base: 'Celsius' },
        F: { to: { C: (v) => (v - 32) * 5/9, K: (v) => (v - 32) * 5/9 + 273.15 },
             base: 'Fahrenheit' },
        K: { to: { C: (v) => v - 273.15, F: (v) => (v - 273.15) * 9/5 + 32 },
             base: 'Kelvin' }
      }
    },
    speed: {
      units: {
        'ms': { to: { 'kmh': 3.6, 'mph': 2.23694, 'knot': 1.94384 },
                base: 'meter/second' },
        'kmh': { to: { 'ms': 0.277778, 'mph': 0.621371, 'knot': 0.539957 },
                 base: 'kilometer/hour' },
        'mph': { to: { 'ms': 0.44704, 'kmh': 1.60934, 'knot': 0.868976 },
                 base: 'mile/hour' },
        'knot': { to: { 'ms': 0.51444, 'kmh': 1.852, 'mph': 1.15078 },
                  base: 'knot' }
      }
    },
    volume: {
      units: {
        L: { to: { ml: 1000, gal: 0.264172, cup: 4.22675, pint: 2.11338, 'fl-oz': 33.814 },
             base: 'liter' },
        ml: { to: { L: 0.001, gal: 0.000264172, cup: 0.00422675, pint: 0.00211338, 'fl-oz': 0.033814 },
              base: 'milliliter' },
        gal: { to: { L: 3.78541, ml: 3785.41, cup: 16, pint: 8, 'fl-oz': 128 },
               base: 'gallon' },
        cup: { to: { L: 0.236588, ml: 236.588, gal: 0.0625, pint: 0.5, 'fl-oz': 8 },
               base: 'cup' },
        pint: { to: { L: 0.473176, ml: 473.176, gal: 0.125, cup: 2, 'fl-oz': 16 },
                base: 'pint' },
        'fl-oz': { to: { L: 0.0295735, ml: 29.5735, gal: 0.0078125, cup: 0.125, pint: 0.0625 },
                   base: 'fluid-ounce' }
      }
    },
    pressure: {
      units: {
        bar: { to: { psi: 14.5038, pa: 100000, atm: 0.986923, torr: 750.062 },
               base: 'bar' },
        psi: { to: { bar: 0.0689476, pa: 6894.76, atm: 0.0680460, torr: 51.7149 },
               base: 'psi' },
        pa: { to: { bar: 0.00001, psi: 0.000145038, atm: 9.86923e-6, torr: 0.00750062 },
              base: 'pascal' },
        atm: { to: { bar: 1.01325, psi: 14.6959, pa: 101325, torr: 760 },
               base: 'atmosphere' },
        torr: { to: { bar: 0.00133322, psi: 0.0193368, pa: 133.322, atm: 0.00131579 },
                base: 'torr' }
      }
    },
    energy: {
      units: {
        J: { to: { cal: 0.239006, kJ: 0.001, kWh: 2.77778e-7, BTU: 0.000947817, erg: 1e7, Wh: 0.000277778 },
             base: 'joule' },
        cal: { to: { J: 4.184, kJ: 0.004184, kWh: 1.16222e-6, BTU: 0.00396567, erg: 4.184e7, Wh: 0.00116222 },
               base: 'calorie' },
        kJ: { to: { J: 1000, cal: 239.006, kWh: 0.000277778, BTU: 0.947817, erg: 1e10, Wh: 0.277778 },
              base: 'kilojoule' },
        kWh: { to: { J: 3.6e6, cal: 860420, kJ: 3600, BTU: 3412.14, erg: 3.6e13, Wh: 1000 },
               base: 'kilowatt-hour' },
        BTU: { to: { J: 1055.06, cal: 251.996, kJ: 1.05506, kWh: 0.000293071, erg: 1.05506e10, Wh: 0.293071 },
               base: 'BTU' },
        erg: { to: { J: 1e-7, cal: 2.39006e-8, kJ: 1e-10, kWh: 2.77778e-14, BTU: 9.47817e-11, Wh: 2.77778e-11 },
               base: 'erg' },
        Wh: { to: { J: 3600, cal: 860.420, kJ: 3.6, kWh: 0.001, BTU: 3.41214, erg: 3.6e10 },
              base: 'watt-hour' }
      }
    },
    time: {
      units: {
        s: { to: { min: 0.0166667, h: 0.000277778, day: 0.0000115741, week: 0.00000165344, month: 3.8027e-7, year: 3.1709e-8 },
             base: 'second' },
        min: { to: { s: 60, h: 0.0166667, day: 0.000694444, week: 0.0000992063, month: 0.0000228162, year: 1.90259e-6 },
               base: 'minute' },
        h: { to: { s: 3600, min: 60, day: 0.0416667, week: 0.00595238, month: 0.00136897, year: 0.000114156 },
             base: 'hour' },
        day: { to: { s: 86400, min: 1440, h: 24, week: 0.142857, month: 0.0328767, year: 0.00273973 },
               base: 'day' },
        week: { to: { s: 604800, min: 10080, h: 168, day: 7, month: 0.230137, year: 0.0191781 },
                base: 'week' },
        month: { to: { s: 2.628e6, min: 43800, h: 730, day: 30.4167, week: 4.34524, year: 0.0833333 },
                 base: 'month' },
        year: { to: { s: 3.154e7, min: 525960, h: 8766, day: 365.25, week: 52.1786, month: 12 },
                base: 'year' }
      }
    },
    data: {
      units: {
        b: { to: { B: 0.125, KB: 0.000122070, MB: 1.19209e-7, GB: 1.16415e-10, TB: 1.13687e-13 },
             base: 'bit' },
        B: { to: { b: 8, KB: 0.0009765625, MB: 9.5367e-7, GB: 9.3132e-10, TB: 9.0949e-13 },
             base: 'byte' },
        KB: { to: { b: 8192, B: 1024, MB: 0.0009765625, GB: 9.5367e-7, TB: 9.3132e-10 },
              base: 'kilobyte' },
        MB: { to: { b: 8.38861e6, B: 1.04858e6, KB: 1024, GB: 0.0009765625, TB: 9.5367e-7 },
              base: 'megabyte' },
        GB: { to: { b: 8.58993e9, B: 1.07374e9, KB: 1.04858e6, MB: 1024, TB: 0.0009765625 },
              base: 'gigabyte' },
        TB: { to: { b: 8.79609e12, B: 1.09951e12, KB: 1.07374e9, MB: 1.04858e6, GB: 1024 },
              base: 'terabyte' },
        PB: { to: { b: 9.00719e15, B: 1.12589e15, KB: 1.09951e12, MB: 1.07374e9, GB: 1.04858e6, TB: 1024 },
              base: 'petabyte' }
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
  let decimals = parseInt(config.decimals) || 2
  decimals = Math.max(0, Math.min(100, decimals))
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
    return { error: 'Please enter a time (e.g., 1pm, 1:00 PM, 13:00, 1:30 PM)' }
  }

  // Parse time formats: "1pm", "1:00 PM", "13:00", "1:30 PM UTC", etc.
  const timeRegex = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?/i
  const match = trimmed.match(timeRegex)

  if (!match) {
    return { error: 'Invalid time format. Use formats like: 1pm, 1:00 PM, 13:00, or 1:30 PM' }
  }

  let hours = parseInt(match[1])
  const minutes = match[2] ? parseInt(match[2]) : 0
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
  const fromBase = parseInt(config.fromBase) || 10
  const toBase = parseInt(config.toBase) || 16
  const value = parseInt(text, fromBase)
  if (isNaN(value)) return { error: `Invalid number for base ${fromBase}` }
  const result = value.toString(toBase)
  return { input: text, fromBase, toBase, result: result.toUpperCase() }
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

function ipIntegerConverter(text, config = {}) {
  const input = text.trim()
  const mode = config.mode || 'toInteger'

  const isIpFormat = /^(\d{1,3}\.){3}\d{1,3}$/.test(input)
  const isIntegerFormat = /^\d+$/.test(input) && !isNaN(parseInt(input))

  if (mode === 'toInteger' || (!isIntegerFormat && isIpFormat)) {
    const ip = input
    const parts = ip.split('.')
    if (parts.length !== 4) return { error: 'Invalid IPv4 address' }

    const integer = parts.reduce((acc, part) => {
      const num = parseInt(part)
      if (num < 0 || num > 255) return null
      return acc * 256 + num
    }, 0)

    if (integer === null) return { error: 'Invalid IPv4 address' }
    return { ip, integer, hex: integer.toString(16), binary: integer.toString(2) }
  } else if (mode === 'toIp' || (isIntegerFormat && !isIpFormat)) {
    const integer = parseInt(input)
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

  return { error: 'Invalid input format' }
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

function isValidBase64(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    return Buffer.from(str, 'base64').toString('base64') === str && str.length % 4 === 0
  } catch {
    return false
  }
}

function isUrlEncoded(str) {
  if (!str || typeof str !== 'string') return false
  return /%[0-9A-Fa-f]{2}/.test(str)
}

function hasHtmlEntities(str) {
  if (!str || typeof str !== 'string') return false
  return /&[#\w]+;/.test(str)
}

function isJsonFormatted(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    JSON.parse(str)
    return str.includes('\n') || str.includes('  ')
  } catch {
    return false
  }
}

function isJsonMinified(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    JSON.parse(str)
    return !str.includes('\n') && !str.includes('  ')
  } catch {
    return false
  }
}

function isUnixTimestamp(str) {
  if (!str || typeof str !== 'string') return false
  const num = parseInt(str.trim())
  return !isNaN(num) && num > 0 && num < 9999999999
}

function isCsvFormat(str) {
  if (!str || typeof str !== 'string') return false
  const lines = str.trim().split('\n')
  const commaCount = (lines[0] || '').split(',').length
  const colonCount = (lines[0] || '').split(':').length
  return commaCount > 1 && commaCount > colonCount
}

function isJsonFormat(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

function isFormattedJson(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    JSON.parse(str)
    return str.includes('\n') || str.includes('  ')
  } catch {
    return false
  }
}

function isMinifiedJson(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    JSON.parse(str)
    return !str.includes('\n') && !str.includes('  ')
  } catch {
    return false
  }
}

function isFormattedXml(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    return str.includes('\n') || str.includes('  ') || str.includes('>\n<')
  } catch {
    return false
  }
}

function isFormattedHtml(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  try {
    return str.includes('\n') || str.includes('  ')
  } catch {
    return false
  }
}

function isIpAddress(str) {
  if (!str || typeof str !== 'string') return false
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(str.trim())
}

function isInteger32Bit(str) {
  if (!str || typeof str !== 'string') return false
  const num = parseInt(str.trim())
  return !isNaN(num) && num >= 0 && num <= 4294967295
}

function hasEscapeSequences(str) {
  if (!str || typeof str !== 'string') return false
  return /\\[\\'"nrt]|&#?\w+;|&[a-z]+;|\\x[0-9a-f]{2}|\\u[0-9a-f]{4}/.test(str)
}

function detectNumberBase(str) {
  if (!str || typeof str !== 'string') return 10
  str = str.trim().toLowerCase()
  if (str.startsWith('0b') || /^[01]+$/.test(str)) return 2
  if (str.startsWith('0o') || /^[0-7]+$/.test(str)) return 8
  if (str.startsWith('0x') || /^[0-9a-f]+$/.test(str)) return 16
  return 10
}

function isMinifiedCss(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  return !str.includes('\n') && !str.includes('  ')
}

export function getToolExample(toolId, config = {}) {
  switch (toolId) {
    case 'escape-unescape': {
      const mode = config.mode || 'escape'
      const format = config.format || 'javascript'
      const examples = {
        escape: {
          javascript: 'Hello "World" with \'quotes\' and\nnewline',
          json: 'Hello "World" with\ttabs and\nnewlines',
          html: '<div class="title">Tom & Jerry</div>',
          csv: 'John Doe,jane@example.com,"123 Main St, Apt 4"',
        },
        unescape: {
          javascript: 'Hello \\"World\\" with \\\'quotes\\\' and\\nnewline',
          json: 'Hello \\"World\\" with\\ttabs and\\nnewlines',
          html: '&lt;div class=&quot;title&quot;&gt;Tom &amp; Jerry&lt;/div&gt;',
          csv: '"John Doe","jane@example.com","123 Main St, Apt 4"',
        },
      }
      return examples[mode]?.[format] || examples.escape.javascript
    }

    case 'base64-converter': {
      const mode = config.mode || 'encode'
      return mode === 'decode'
        ? 'SGVsbG8gV29ybGQhIFRoaXMgaXMgQmFzZTY0IGVuY29kZWQu'
        : 'Hello World! This is a plain text example.'
    }

    case 'url-converter': {
      const mode = config.mode || 'encode'
      return mode === 'decode'
        ? 'hello%20world%3F%20search%3Dtest%26filter%3Dactive'
        : 'hello world? search=test&filter=active'
    }

    case 'html-entities-converter': {
      const mode = config.mode || 'encode'
      return mode === 'decode'
        ? '&lt;div class=&quot;container&quot;&gt;Hello &amp; welcome!&lt;/div&gt;'
        : '<div class="container">Hello & welcome!</div>'
    }

    case 'csv-json-converter': {
      const mode = config.mode || 'csvToJson'
      return mode === 'csvToJson'
        ? 'name,email,age\nJohn Doe,john@example.com,28\nJane Smith,jane@example.com,34'
        : '[{"name": "John", "email": "john@example.com"}, {"name": "Jane", "email": "jane@example.com"}]'
    }

    case 'timestamp-converter': {
      const mode = config.mode || 'toReadable'
      return mode === 'toReadable'
        ? '1672531200'
        : '2023-01-01 00:00:00'
    }

    case 'json-formatter': {
      const mode = config.mode || 'beautify'
      return mode === 'beautify'
        ? '{"name":"John","age":30,"city":"New York","hobbies":["reading","gaming"]}'
        : '{\n  "name": "John",\n  "age": 30,\n  "city": "New York",\n  "hobbies": [\n    "reading",\n    "gaming"\n  ]\n}'
    }

    case 'xml-formatter': {
      const mode = config.mode || 'beautify'
      return mode === 'beautify'
        ? '<?xml version="1.0"?><root><person><name>John</name><age>30</age></person></root>'
        : '<?xml version="1.0"?>\n<root>\n  <person>\n    <name>John</name>\n    <age>30</age>\n  </person>\n</root>'
    }

    case 'html-formatter': {
      const mode = config.mode || 'beautify'
      return mode === 'beautify'
        ? '<div class="container"><h1>Hello</h1><p>Welcome to my website</p></div>'
        : '<div class="container">\n  <h1>Hello</h1>\n  <p>Welcome to my website</p>\n</div>'
    }

    case 'js-formatter': {
      const mode = config.mode || 'beautify'
      return mode === 'beautify'
        ? 'const obj={name:"John",greet:function(){console.log("Hello")}};obj.greet();'
        : 'const obj = {\n  name: "John",\n  greet: function() {\n    console.log("Hello");\n  }\n};\nobj.greet();'
    }

    case 'binary-converter': {
      const fromBase = parseInt(config.fromBase) || 2
      if (fromBase === 2) return '11111111'
      if (fromBase === 8) return '377'
      if (fromBase === 16) return 'FF'
      return '255'
    }

    case 'sort-lines': {
      const order = config.order || 'asc'
      if (order === 'length-asc') {
        return 'fig\napple\nquick\nbanana\ndatepalm'
      } else if (order === 'length-desc') {
        return 'datepalm\nbanana\nquick\napple\nfig'
      } else if (order === 'desc') {
        return 'zebra\nquick\nfox\ndog\napple'
      } else if (order === 'numeric') {
        return '1\n5\n10\n15\n100'
      } else if (order === 'reverse') {
        return 'zebra\nquick\nfox\ndog\napple'
      }
      return 'apple\ndog\nfox\nquick\nzebra'
    }

    case 'color-converter':
      return '#FF5733'

    case 'word-counter':
      return 'The quick brown fox jumps over the lazy dog. This is a sample text for word counting.'

    case 'case-converter': {
      const caseType = config.caseType || 'uppercase'
      if (caseType === 'lowercase') return 'HELLO WORLD'
      if (caseType === 'titlecase') return 'hello world example'
      if (caseType === 'sentencecase') return 'hELLO WORLD. tHIS IS A SENTENCE.'
      return 'hello world'
    }

    case 'find-replace': {
      return 'The quick brown fox jumps over the lazy dog. The quick brown fox is very clever.'
    }

    case 'remove-extras': {
      // Show different examples based on which cleanup options are enabled
      if (config.smartJoinWords) {
        return 'Th is tex t c ame from an O C R scan'
      }
      if (config.filterCharacters === 'ascii-only') {
        return 'This text has spëcial chärs and émojis 😀 that need removing'
      }
      if (config.filterCharacters === 'keep-accents') {
        return 'This tëxt hàs àccénts and émojis 😀 and symbols #@$%'
      }
      if (config.filterCharacters === 'basic-punctuation') {
        return 'Hello!!! This has weird!!!punctuation and symbols @#$%^'
      }
      if (config.removeLineBreaks) {
        return 'This text\nis split\nacross many\nlines and\nneeds flattening'
      }
      if (config.removePdfGarbage) {
        return 'This text contains ï»¿garbage characters from a PDF.\nHere\'s a sentence with hidden characters: ­­­­­­­­Hello.'
      }
      if (config.removeInvisibleChars) {
        return 'Hello\u00A0World\u200BThis\u2009Text\uFEFFIs\u2028Strange'
      }
      if (config.stripHtml) {
        return 'This <b>text</b> has <p>HTML tags</p> that need <i>removing</i>.'
      }
      if (config.stripMarkdown) {
        return 'This *used* to be **markdown** but now it has   weird spacing.'
      }
      if (config.fixPunctuationSpacing) {
        return 'Hello , world ! This is spaced wrong .'
      }
      if (config.removeTimestamps) {
        return '[14:03] Kyle: Hello\n[14:04] John: test\n[14:05] Sarah: ok'
      }
      if (config.flattenToSingleLine) {
        return 'The quick\nbrown fox\njumped over\nthe lazy dog'
      }
      // Default comprehensive example
      return 'This  text   has   weird   spacing.\n\nAlso  ï»¿ garbage  chars  from  PDFs  .\n\nHello , world ! This is spaced wrong .\n\n\n\nMultiple blank lines above.'
    }

    case 'text-analyzer':
      return 'Artificial intelligence is rapidly changing software development. It helps automate repetitive tasks and provides new ways to build products.'

    case 'plain-text-stripper':
      return '<p>Hello <b>World</b>!</p>\n<div>This is <i>formatted</i> text.</div>'

    case 'reverse-text':
      return 'Hello World!'

    case 'slug-generator': {
      const separator = config.separator || '-'
      return 'My Awesome Blog Post Title'
    }

    case 'regex-tester': {
      const pattern = config.pattern
      if (pattern && pattern.toLowerCase().includes('email')) {
        return 'john@example.com, jane@example.com, test.user@domain.org'
      }
      if (pattern && pattern.toLowerCase().includes('url')) {
        return 'Visit https://example.com or http://test.org or ftp://files.net'
      }
      if (pattern && pattern.toLowerCase().includes('phone')) {
        return 'Call 555-1234 or (555) 567-8901 or 555.123.4567'
      }
      return 'Order #12345\nOrder #987\norder #111\nInvoice-5000'
    }

    case 'markdown-html-converter': {
      const mode = config.mode || 'toHtml'
      return mode === 'toHtml'
        ? '# Hello World\nThis is **bold** and *italic* text.\n- Item 1\n- Item 2'
        : '<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>'
    }

    case 'yaml-formatter':
      return 'server:\n  port: 8080\n  host: localhost\nusers:\n  - alice\n  - bob'

    case 'url-parser':
      return 'https://www.example.com:8080/path/page?id=123&name=test#section'

    case 'jwt-decoder':
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    case 'text-diff-checker':
      return 'The original text content here for comparison.'

    case 'checksum-calculator':
      return 'Hello World!'

    case 'whitespace-visualizer':
      return 'This\thas\ttabs\nand spaces  between words'

    case 'ascii-unicode-converter': {
      const mode = config.mode || 'toCode'
      return mode === 'toCode'
        ? 'ABC'
        : '65 66 67'
    }

    case 'caesar-cipher': {
      const shift = parseInt(config.shift) || 3
      if (shift !== 3) {
        return `Sample text with shift ${shift}`
      }
      return 'Hello World'
    }

    case 'sql-formatter':
      return 'SELECT id, name, email FROM users WHERE active = 1 ORDER BY created_at DESC'

    case 'http-status-lookup':
      return '404'

    case 'mime-type-lookup':
      return 'pdf'

    case 'http-header-parser':
      return 'Content-Type: application/json\nAuthorization: Bearer token123\nCache-Control: max-age=3600'

    case 'uuid-validator':
      return '550e8400-e29b-41d4-a716-446655440000'

    case 'json-path-extractor':
      return '{"user": {"name": "John", "age": 30, "emails": ["john@example.com"]}}'

    case 'svg-optimizer':
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>'

    case 'unit-converter': {
      const unitType = config.type || 'length'
      const examples = {
        'length': '100 meters',
        'weight': '150 pounds',
        'temperature': '32 fahrenheit',
        'volume': '250 liters',
        'speed': '60 kmh',
      }
      return examples[unitType] || '100 meters'
    }

    case 'number-formatter': {
      const separator = config.thousandSeparator || ','
      return '1234567.89'
    }

    case 'timezone-converter': {
      return '2pm'
    }

    case 'base-converter': {
      const fromBase = parseInt(config.fromBase) || 10
      const toBase = parseInt(config.toBase) || 16
      if (fromBase === 2) return '11111111 (binary)'
      if (fromBase === 8) return '377 (octal)'
      if (fromBase === 16) return 'FF (hexadecimal)'
      return '255 (decimal)'
    }

    case 'math-evaluator':
      return '(10 + 5) * 2 - 3'

    case 'keyword-extractor': {
      return 'Machine learning and artificial intelligence are transforming industries. Deep learning networks enable new applications in computer vision and natural language processing. AI and machine learning are the future.'
    }

    case 'cron-tester':
      return '0 9 * * MON-FRI'

    case 'file-size-converter': {
      const fromUnit = config.fromUnit || 'B'
      const toUnit = config.toUnit || 'MB'
      const examples = {
        'B': '1048576',
        'KB': '1024',
        'MB': '1',
        'GB': '0.001',
      }
      return examples[fromUnit] || '1024'
    }

    case 'email-validator':
      return 'john.doe@example.com'

    case 'ip-validator': {
      const ipVersion = config.ipVersion || 'both'
      return '192.168.1.1'
    }

    case 'ip-integer-converter': {
      const mode = config.mode || 'toInteger'
      return mode === 'toInteger'
        ? '192.168.1.1'
        : '3232235777'
    }

    case 'base64-converter':
      return 'Hello World! This is a plain text example.'

    case 'rot13-cipher':
      return 'Hello World'

    case 'punycode-converter': {
      const mode = config.mode || 'encode'
      return mode === 'encode'
        ? 'münchen.de'
        : 'xn--mnchen-3ya.de'
    }

    case 'image-to-base64':
      return null

    case 'image-resizer':
      return null

    case 'markdown-linter': {
      const strictMode = config.strictMode
      if (strictMode) {
        return '# Heading\n\nMultiple  spaces  here\n\nTrailing whitespace  \n\nList:\n- item'
      }
      return '# Heading\n\nThis is a paragraph.\n\n- List item 1\n- List item 2'
    }

    case 'json-path-extractor': {
      return '{"user": {"name": "John", "email": "john@example.com", "address": {"city": "New York", "zip": "10001"}}}'
    }

    case 'http-header-parser': {
      return 'Content-Type: application/json\nAuthorization: Bearer token123\nAccept: text/html\nUser-Agent: Mozilla/5.0'
    }

    case 'text-toolkit':
      return 'The quick brown fox jumps over the lazy dog.'

    default:
      return null
  }
}

export function autoDetectToolConfig(toolId, inputText) {
  if (!inputText || typeof inputText !== 'string') return null

  const trimmed = inputText.trim()

  switch (toolId) {
    case 'base64-converter':
      return isValidBase64(trimmed) ? { mode: 'decode' } : { mode: 'encode' }

    case 'url-converter':
      return isUrlEncoded(trimmed) ? { mode: 'decode' } : { mode: 'encode' }

    case 'html-entities-converter':
      return hasHtmlEntities(trimmed) ? { mode: 'decode' } : { mode: 'encode' }

    case 'json-formatter':
      const hasJsonNewlines = /\n/.test(trimmed)
      const hasJsonIndentation = /^\s+/.test(trimmed)
      if (hasJsonNewlines || hasJsonIndentation) {
        return { mode: 'minify' }
      } else {
        return { mode: 'beautify' }
      }

    case 'xml-formatter':
      const hasXmlNewlines = /\n/.test(trimmed)
      const hasXmlIndentation = /^\s+/.test(trimmed)
      if (hasXmlNewlines || hasXmlIndentation) {
        return { mode: 'minify' }
      } else {
        return { mode: 'beautify' }
      }

    case 'html-formatter':
      const hasHtmlNewlines = /\n/.test(trimmed)
      const hasHtmlIndentation = /^\s+/.test(trimmed)
      if (hasHtmlNewlines || hasHtmlIndentation) {
        return { mode: 'minify' }
      } else {
        return { mode: 'beautify' }
      }

    case 'js-formatter':
      const hasJsNewlines = /\n/.test(trimmed)
      const hasJsIndentation = /^\s+/.test(trimmed)
      if (hasJsNewlines || hasJsIndentation) {
        return { mode: 'minify' }
      } else {
        return { mode: 'beautify' }
      }

    case 'timestamp-converter':
      return isUnixTimestamp(trimmed) ? { mode: 'toReadable' } : { mode: 'toTimestamp' }

    case 'csv-json-converter':
      if (isJsonFormat(trimmed)) {
        return { mode: 'jsonToCsv' }
      } else if (isCsvFormat(trimmed)) {
        return { mode: 'csvToJson' }
      }
      return null

    case 'ip-integer-converter':
      if (isIpAddress(trimmed)) {
        return { mode: 'toInteger' }
      } else if (isInteger32Bit(trimmed)) {
        return { mode: 'toIp' }
      }
      return null

    case 'escape-unescape':
      return hasEscapeSequences(trimmed) ? { mode: 'unescape' } : { mode: 'escape' }

    case 'binary-converter':
      const detectedBase = detectNumberBase(trimmed)
      return {
        fromBase: String(detectedBase),
        toBase: '10',
      }

    case 'css-formatter':
      const hasCssNewlines = /\n/.test(trimmed)
      const hasCssIndentation = /^\s+/.test(trimmed)
      return (hasCssNewlines || hasCssIndentation) ? { mode: 'minify' } : { mode: 'beautify' }

    case 'unit-converter':
      const lowerText = trimmed.toLowerCase()
      if (/(meter|metres?|km|kilometer|ft|feet|mi|mile|cm|centimeter|mm|millimeter|yd|yard|inch|in|micrometers?|µm|nm|nanometer|nautical|nmi)\b/.test(lowerText)) {
        return { type: 'length' }
      } else if (/(kg|kilogram|lb|lbs|pound|pounds|oz|ounce|gram|g|mg|milligram|ton|tonne|stone|st|t)\b/.test(lowerText)) {
        return { type: 'weight' }
      } else if (/(celsius|°C|fahrenheit|°F|kelvin|K)\b/.test(lowerText)) {
        return { type: 'temperature' }
      } else if (/(m\/s|km\/h|mph|mile\/hour|kilometer\/hour|knot|knots)\b/.test(lowerText)) {
        return { type: 'speed' }
      } else if (/(litre|liter|l|ml|milliliter|gallon|gal|cup|pint|fluid-ounce|fl-oz|floz)\b/.test(lowerText)) {
        return { type: 'volume' }
      } else if (/(bar|psi|pascal|pa|atm|atmosphere|torr)\b/.test(lowerText)) {
        return { type: 'pressure' }
      } else if (/(joule|calorie|btu|kilocalorie|kcal|watt|w|kilowatt|kw|horsepower|hp|ergs?)\b/.test(lowerText)) {
        return { type: 'energy' }
      } else if (/(second|seconds|sec|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\b/.test(lowerText)) {
        return { type: 'time' }
      } else if (/(byte|bytes|b|B|bit|bits|kb|KB|mb|MB|gb|GB|tb|TB|pb|PB)\b/.test(lowerText)) {
        return { type: 'data' }
      }
      return null

    default:
      return null
  }
}
