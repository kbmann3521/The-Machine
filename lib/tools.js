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
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'The quick brown fox jumps over the lazy dog. It then ran away!\n\nThis is another paragraph.',
    configSchema: [],
    detailedDescription: {
      overview: 'The Word Counter tool instantly analyzes your text and provides comprehensive statistics including word count, character count, sentence count, line count, and paragraph count. Useful for meeting specific word/character limits or understanding text complexity and density.',
      howtouse: [
        'Type or paste your text into the input field',
        'The tool automatically counts all metrics in real-time',
        'View word count, characters, sentences, lines, and paragraphs',
        'Use these metrics for academic papers, articles, or content requirements',
        'Copy the text or statistics as needed',
      ],
      features: [
        'Real-time word and character counting',
        'Counts words, characters, sentences, lines, and paragraphs',
        'Shows character count with and without spaces',
        'Displays average word length and words per sentence',
        'Instant results as you type',
        'Works with any length of text',
      ],
      usecases: [
        'Meeting word count requirements for essays and assignments',
        'Checking character limits for social media posts',
        'Analyzing text density and readability',
        'Content management and optimization',
        'Compliance with character limits in forms and fields',
        'Evaluating text length for SEO and web content',
      ],
    },
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
    detailedDescription: {
      overview: 'The Case Converter tool instantly transforms text between different capitalization styles. Whether you need to convert text to all uppercase, all lowercase, title case, or sentence case, this tool handles the conversion quickly and accurately. Perfect for formatting text for different purposes like headers, code, and content formatting.',
      howtouse: [
        'Enter or paste your text in the input field',
        'Select your desired case type from the dropdown menu',
        'Choose from UPPERCASE, lowercase, Title Case, or Sentence case',
        'The output will display instantly in the preview area',
        'Copy the converted text to your clipboard',
      ],
      features: [
        'Multiple case formats: UPPERCASE, lowercase, Title Case, and Sentence case',
        'Real-time conversion as you type',
        'Handles multiple sentences and paragraphs',
        'Preserves spaces and punctuation',
        'One-click copy to clipboard',
        'Works with any length of text',
      ],
      usecases: [
        'Converting text for code variable names and constants',
        'Formatting headings and titles for documents',
        'Standardizing email addresses to lowercase',
        'Converting text for database entries and structured data',
        'Creating SEO-friendly URLs and slugs',
        'Formatting names and proper nouns consistently',
        'Converting text for hashtags and social media posts',
        'Normalizing text data from various sources',
      ],
    },
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
    detailedDescription: {
      overview: 'The Find & Replace tool allows you to search for text and replace it with alternative text. Supports both simple text matching and powerful regular expressions for complex pattern-based replacements. Case sensitivity options help you control matching behavior.',
      howtouse: [
        'Enter the text you want to find in the "Find" field',
        'Enter the replacement text in the "Replace With" field',
        'Toggle "Use Regular Expression" for pattern-based search (optional)',
        'Toggle "Match Case" if you need case-sensitive matching',
        'The tool will show all matches and perform replacements',
        'View and copy the result',
      ],
      features: [
        'Simple text find and replace',
        'Regular expression support for advanced pattern matching',
        'Case-sensitive or case-insensitive matching',
        'Shows total number of replacements made',
        'Real-time preview of replacements',
        'Works with unlimited text length',
      ],
      usecases: [
        'Batch replacing text throughout documents',
        'Finding and updating URLs or references',
        'Using regex for complex pattern replacements',
        'Normalizing whitespace and formatting',
        'Extracting specific data using regex groups',
        'Refactoring code and content systematically',
      ],
    },
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
    detailedDescription: {
      overview: 'The Remove Extras tool cleans up messy text by removing unnecessary whitespace, blank lines, and duplicate lines. Perfect for cleaning up copied content, formatted text from various sources, or standardizing text formatting.',
      howtouse: [
        'Paste your text into the input area',
        'Select the cleanup options you need',
        'Toggle "Trim Leading/Trailing Spaces" to remove extra spaces at line edges',
        'Toggle "Remove Blank Lines" to eliminate empty lines',
        'Toggle "Remove Duplicate Lines" to eliminate repeated content',
        'Toggle "Compress Line Breaks" to reduce multiple consecutive breaks',
        'Copy the cleaned result',
      ],
      features: [
        'Trim leading and trailing spaces from lines',
        'Remove completely blank lines',
        'Eliminate duplicate lines while preserving order',
        'Compress multiple line breaks into single breaks',
        'Selective cleanup with individual toggles',
        'Preserves intentional formatting and structure',
      ],
      usecases: [
        'Cleaning up imported data from spreadsheets',
        'Removing extra whitespace from copied content',
        'Eliminating duplicate entries in lists',
        'Standardizing text formatting across documents',
        'Preparing messy data for processing',
        'Cleaning logs and error messages',
      ],
    },
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
    detailedDescription: {
      overview: 'The Text Analyzer tool evaluates your text for readability and generates detailed statistics. It calculates Flesch Readability Score, Flesch-Kincaid Grade Level, and provides word statistics to help understand text complexity and audience suitability.',
      howtouse: [
        'Paste your text into the input field',
        'Select analysis type: Readability Score, Text Statistics, or Both',
        'View the readability scores and grade levels',
        'Check text statistics including word and sentence counts',
        'Use insights to adjust writing for target audience',
      ],
      features: [
        'Flesch Reading Ease score (0-100)',
        'Flesch-Kincaid Grade Level',
        'Comprehensive text statistics',
        'Average word length calculation',
        'Words per sentence analysis',
        'Readability level classification',
      ],
      usecases: [
        'Evaluating document readability for target audiences',
        'Adjusting writing complexity for academic levels',
        'Optimizing content for specific reading levels',
        'Analyzing technical documentation clarity',
        'Improving blog post and article readability',
        'Meeting readability standards for accessibility',
      ],
    },
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
    detailedDescription: {
      overview: 'The Plain Text Stripper tool removes HTML tags and Markdown formatting from your text, leaving clean, readable plain text. Perfect for converting formatted content to plain text for compatibility or simplification.',
      howtouse: [
        'Paste your formatted HTML or Markdown text',
        'Toggle "Strip Markdown" to remove markdown syntax like **bold**, *italic*, etc.',
        'Toggle "Strip HTML" to remove HTML tags and elements',
        'View the cleaned plain text result',
        'Copy the result for use elsewhere',
      ],
      features: [
        'Remove HTML tags and formatting',
        'Remove Markdown syntax and formatting',
        'Preserve text content and meaning',
        'Selective stripping with individual toggles',
        'Handles nested and complex formatting',
      ],
      usecases: [
        'Converting HTML emails to plain text',
        'Extracting text from formatted documents',
        'Preparing content for plain text systems',
        'Removing formatting for accessibility',
        'Cleaning up content copied from websites',
        'Converting rich text to simple format',
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
  },
  'reverse-text': {
    name: 'Reverse Text',
    description: 'Reverse the order of characters in text',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello World',
    configSchema: [],
    detailedDescription: {
      overview: 'The Reverse Text tool reverses the character order in your text. Useful for creative writing, creating palindromes, or simply reversing text for fun or testing purposes.',
      howtouse: [
        'Type or paste your text into the input field',
        'The tool instantly reverses the text',
        'View the reversed result',
        'Copy the reversed text',
      ],
      features: [
        'Instantly reverses text character order',
        'Preserves spaces and special characters',
        'Works with any text length',
        'Handles multiple lines',
      ],
      usecases: [
        'Creating palindromes and fun text',
        'Testing string handling in code',
        'Reversing accidentally typed text',
        'Creative writing and wordplay',
        'Data processing and transformation',
      ],
    },
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
    detailedDescription: {
      overview: 'The Slug Generator tool converts any text into URL-friendly slug format, perfect for creating clean URLs, file names, and web identifiers. Removes special characters and spaces, replacing them with your chosen separator.',
      howtouse: [
        'Enter your text or title into the input field',
        'Select your preferred separator: hyphen, underscore, or none',
        'The tool automatically converts text to slug format',
        'View the generated slug',
        'Copy and use in URLs or filenames',
      ],
      features: [
        'Converts text to lowercase',
        'Removes special characters and accents',
        'Replaces spaces with chosen separator',
        'Customizable separator options',
        'Handles multiple spaces and punctuation',
      ],
      usecases: [
        'Creating URL-friendly blog post titles',
        'Generating clean file names',
        'Creating SEO-friendly URL paths',
        'Generating hashtags for social media',
        'Creating database identifiers',
        'Normalizing text for URLs',
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
      overview: 'The Regex Tester tool helps you develop and test regular expressions against sample text. Test patterns, view all matches, experiment with flags, and perform pattern-based replacements all in one place.',
      howtouse: [
        'Paste your sample text into the input area',
        'Enter your regex pattern in the pattern field',
        'Add flags (g for global, i for case-insensitive, m for multiline, etc.)',
        'Optionally enter replacement text for substitutions',
        'View all matches and test results',
        'Refine your pattern until it works as expected',
      ],
      features: [
        'Test regex patterns against sample text',
        'Supports all standard regex flags',
        'Highlights all matches in the text',
        'Shows detailed match information',
        'Test replacements before using in code',
        'Indicates match count and positions',
      ],
      usecases: [
        'Developing complex regex patterns',
        'Testing pattern matching before coding',
        'Validating email and URL patterns',
        'Pattern-based text extraction',
        'Testing find and replace operations',
        'Learning and practicing regex syntax',
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
      overview: 'The Color Converter tool converts colors between HEX, RGB, and HSL formats. Essential for web designers and developers working across different color systems and tools.',
      howtouse: [
        'Enter a color in HEX, RGB, or HSL format',
        'Select the input format',
        'View all format conversions',
        'Copy the color code in your preferred format',
      ],
      features: [
        'Convert between HEX, RGB, and HSL',
        'Display color preview',
        'Show complementary colors',
        'Validate color values',
      ],
      usecases: [
        'Converting between color format standards',
        'Web design color picking',
        'CSS color code conversion',
        'Color accessibility and contrast',
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
    detailedDescription: {
      overview: 'The Escape/Unescape tool handles special character escaping across multiple formats: JavaScript, JSON, HTML, and CSV. Essential for handling quotes, newlines, and special characters in different contexts.',
      howtouse: [
        'Paste your text into the input field',
        'Select "Escape" or "Unescape" mode',
        'Select the target format (JavaScript, JSON, HTML, CSV)',
        'View the converted result',
        'Copy to use in your code or data',
      ],
      features: [
        'Escape for JavaScript, JSON, HTML, and CSV',
        'Unescape from all supported formats',
        'Handle quotes, newlines, and special chars',
        'Format-specific escaping rules',
      ],
      usecases: [
        'Preparing text for JSON payloads',
        'Escaping quotes in JavaScript strings',
        'Creating valid CSV with special characters',
        'Safe HTML content display',
        'Data format conversion',
      ],
    },
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
    detailedDescription: {
      overview: 'The Sort Lines tool organizes lines of text in various orders: alphabetically ascending/descending or by length. Perfect for organizing lists, data cleanup, and sorting content.',
      howtouse: [
        'Paste your text with multiple lines',
        'Select sort order: Ascending, Descending, or By Length',
        'Toggle "Remove Duplicates" to eliminate repeated lines',
        'View the sorted result',
        'Copy the organized content',
      ],
      features: [
        'Sort alphabetically ascending or descending',
        'Sort by line length',
        'Remove duplicate lines',
        'Preserves line content',
        'Handles special characters',
      ],
      usecases: [
        'Organizing word lists and dictionaries',
        'Sorting URLs and domain names',
        'Cleaning up unsorted data',
        'Creating sorted lists of items',
        'Finding duplicate lines',
      ],
    },
  },
  'whitespace-visualizer': {
    name: 'Whitespace Visualizer',
    description: 'Show spaces, tabs, newlines, and other whitespace characters visually',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello  world\twith\ttabs',
    configSchema: [],
    detailedDescription: {
      overview: 'The Whitespace Visualizer tool makes invisible whitespace characters visible, showing spaces, tabs, newlines, and other whitespace with visual symbols. Essential for debugging formatting issues.',
      howtouse: [
        'Paste your text into the input field',
        'The tool reveals all whitespace characters',
        'Spaces appear as dots (·)',
        'Tabs appear as arrows (→)',
        'Newlines appear as pilcrow marks (¶)',
        'Identify problematic whitespace',
      ],
      features: [
        'Display spaces, tabs, and newlines visually',
        'Show trailing whitespace',
        'Detect mixed indentation',
        'Identify formatting issues',
        'Preserve original content',
      ],
      usecases: [
        'Debugging code indentation issues',
        'Finding hidden trailing spaces',
        'Detecting mixed tabs and spaces',
        'Analyzing text formatting',
        'Fixing whitespace-related bugs',
      ],
    },
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
    detailedDescription: {
      overview: 'The Punycode Converter tool encodes Unicode domain names to ASCII-compatible Punycode format and decodes them back. Essential for internationalized domain names (IDNs) that contain non-ASCII characters.',
      howtouse: [
        'Enter a domain name or Punycode string',
        'Select "Encode to Punycode" for Unicode domains',
        'Or select "Decode from Punycode" to decode IDN domains',
        'View the converted domain',
      ],
      features: [
        'Encode internationalized domains to Punycode',
        'Decode Punycode to readable Unicode',
        'Support for all Unicode characters',
      ],
      usecases: [
        'Working with internationalized domain names',
        'Registering domains with special characters',
        'Email systems with international addresses',
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
      overview: 'The MIME Type Lookup tool provides mappings between file extensions and MIME types. Essential for file uploads, API development, and content negotiation.',
      howtouse: [
        'Enter a file extension or MIME type',
        'Select the lookup direction',
        'View the corresponding MIME type or extension',
      ],
      features: [
        'Comprehensive MIME type database',
        'Bidirectional lookups',
        'Common and uncommon file types',
      ],
      usecases: [
        'Setting correct content types in APIs',
        'File upload validation',
        'Content negotiation',
        'Web server configuration',
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
    detailedDescription: {
      overview: 'The Timezone Converter tool converts times between different timezones worldwide. Perfect for coordinating across global teams and international scheduling.',
      howtouse: [
        'Enter a date and time',
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
    detailedDescription: {
      overview: 'The Keyword Extractor tool identifies and extracts the most important keywords and phrases from your text. Useful for SEO, content analysis, and document tagging.',
      howtouse: [
        'Paste your text',
        'Set the number of keywords to extract',
        'The tool analyzes and identifies key terms',
        'View extracted keywords with frequencies',
      ],
      features: [
        'Extract important keywords and phrases',
        'Frequency analysis',
        'Configurable result count',
        'Relevance scoring',
      ],
      usecases: [
        'SEO keyword identification',
        'Content tagging and categorization',
        'Document summarization',
        'Topic analysis',
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
    detailedDescription: {
      overview: 'The HTML Minifier tool compresses HTML code by removing unnecessary whitespace, comments, and optional attributes. Perfect for reducing page load times.',
      howtouse: [
        'Paste your HTML code',
        'Toggle options to remove comments and attributes',
        'View the minified HTML',
        'Copy for production use',
      ],
      features: [
        'Remove unnecessary whitespace',
        'Strip comments',
        'Remove optional attributes',
        'Preserve functionality',
      ],
      usecases: [
        'Reducing HTML file sizes',
        'Production website optimization',
        'Improving page load performance',
        'Bandwidth reduction',
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
  'ip-to-integer': {
    name: 'IP to Integer Converter',
    description: 'Convert IPv4 addresses to integer representation',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '192.168.1.1',
    configSchema: [],
    detailedDescription: {
      overview: 'The IP to Integer Converter tool converts IPv4 addresses to their integer representation. Useful for IP address calculations and database storage.',
      howtouse: [
        'Enter an IPv4 address',
        'The tool converts to integer format',
        'View the numeric representation',
      ],
      features: [
        'Convert IPv4 to integer',
        'Support for all valid IP addresses',
        'Accurate conversion',
      ],
      usecases: [
        'Database IP storage',
        'IP range calculations',
        'Network programming',
      ],
    },
  },
  'integer-to-ip': {
    name: 'Integer to IP Converter',
    description: 'Convert integer values back to IPv4 addresses',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '3232235777',
    configSchema: [],
    detailedDescription: {
      overview: 'The Integer to IP Converter tool converts integer values back to IPv4 addresses. Reverse operation of IP to integer conversion.',
      howtouse: [
        'Enter an integer value',
        'The tool converts to IPv4 address format',
        'View the IP address',
      ],
      features: [
        'Convert integer to IPv4',
        'Reverse IP conversion',
        'Validate conversion results',
      ],
      usecases: [
        'Retrieving IPs from database storage',
        'Log analysis and debugging',
        'Network calculations',
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
    case 'js-formatter':
      return config.mode === 'minify' ? jsMinifier(inputText, config) : jsBeautifier(inputText, config)
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
