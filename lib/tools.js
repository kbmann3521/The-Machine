let yamlModule = null
let tomlModule = null
let xmlParser = null
let minify = null
let xpath = null
let DOMParser = null
let json2csvModule = null
let xmlbuilder2Module = null
let ipaddr = null
let ipNum = null
let prettyData = null

try {
  ipaddr = require('ipaddr.js')
} catch (error) {
  // ipaddr.js not available
}

try {
  ipNum = require('ip-num')
} catch (error) {
  // ip-num not available
}

try {
  yamlModule = require('yaml')
} catch (error) {
  try {
    yamlModule = require('js-yaml')
  } catch (fallbackError) {
    // YAML parsing packages not available
  }
}

try {
  tomlModule = require('@iarna/toml')
} catch (error) {
  // TOML module not available
}

try {
  if (typeof window === 'undefined') {
    const fxp = require('fast-xml-parser')
    xmlParser = fxp
  }
} catch (error) {
  // fast-xml-parser not available
}

try {
  if (typeof window === 'undefined') {
    const hmt = require('html-minifier-terser')
    minify = hmt.minify
  }
} catch (error) {
  // html-minifier-terser not available
}

try {
  if (typeof window === 'undefined') {
    xpath = require('xpath')
    const xmldom = require('xmldom')
    DOMParser = xmldom.DOMParser
  }
} catch (error) {
  // xpath/xmldom not available
}

try {
  if (typeof window === 'undefined') {
    json2csvModule = require('json2csv')
  }
} catch (error) {
  // json2csv not available
}

try {
  if (typeof window === 'undefined') {
    xmlbuilder2Module = require('xmlbuilder2')
  }
} catch (error) {
  // xmlbuilder2 not available
}

let jsonpathPlusModule = null

try {
  if (typeof window === 'undefined') {
    jsonpathPlusModule = require('jsonpath-plus')
  }
} catch (error) {
  // jsonpath-plus not available
}

try {
  if (typeof window === 'undefined') {
    prettyData = require('pretty-data')
  }
} catch (error) {
  // pretty-data not available
}

let qs = null
let punycodeModule = null
let tldts = null
let validator = null

try {
  if (typeof window === 'undefined') {
    qs = require('qs')
    punycodeModule = require('punycode/')
    tldts = require('tldts')
    validator = require('validator')
  }
} catch (error) {
  // URL toolkit modules not available
}

let htmlEntities = null
let jsStringEscape = null
let jsonEscaping = null

try {
  if (typeof window === 'undefined') {
    htmlEntities = require('html-entities')
    jsStringEscape = require('js-string-escape')
    jsonEscaping = require('json-escaping')
  }
} catch (error) {
  // Encoding packages not available
}

// SQL formatter modules are loaded in sqlFormatter.js

// JavaScript formatter modules are loaded in jsFormatter.js

// =============== Unit Converter Helpers ===============
const { unit: mathUnit } = require('mathjs')

// Map our canonical names to mathjs unit names
const UNIT_TO_MATHJS = {
  // length
  inch: 'inch',
  foot: 'foot',
  yard: 'yard',
  mile: 'mile',
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  km: 'km',

  // mass
  ounce: 'oz',
  pound: 'lb',
  stone: 'stone',
  g: 'g',
  gram: 'g',
  kg: 'kg',
  tonne: 'tonne',

  // temperature (special handling needed)
  degC: 'degC',
  degF: 'degF',
  K: 'K',

  // volume
  ml: 'ml',
  l: 'L',
  liter: 'L',
  litre: 'L',
  gal: 'gal',
  pint: 'pint',
  cup: 'cup'
}

// Canonical unit names we will use with mathjs
// (these are user-friendly names, will be mapped to mathjs names)
const UNIT_CATEGORY = {
  // length
  inch: 'length',
  foot: 'length',
  yard: 'length',
  mile: 'length',
  mm: 'length',
  cm: 'length',
  m: 'length',
  km: 'length',

  // mass
  ounce: 'mass',
  pound: 'mass',
  stone: 'mass',
  g: 'mass',
  gram: 'mass',
  kg: 'mass',
  tonne: 'mass',

  // temperature
  degC: 'temperature',
  degF: 'temperature',
  K: 'temperature',

  // volume
  ml: 'volume',
  l: 'volume',
  liter: 'volume',
  litre: 'volume',
  gal: 'volume',
  pint: 'volume',
  cup: 'volume'
}

// Target units we want to output for each category
const CATEGORY_UNITS = {
  length: ['inch', 'foot', 'yard', 'cm', 'm', 'km'],
  mass: ['ounce', 'pound', 'stone', 'g', 'kg', 'tonne'],
  temperature: ['degC', 'degF', 'K'],
  volume: ['ml', 'l', 'gal', 'pint', 'cup']
}

// Fuzzy aliases and misspellings ��� canonical unit
const UNIT_ALIASES = {
  // length
  in: 'inch',
  '"': 'inch',
  '"': 'inch',
  inch: 'inch',
  inches: 'inch',
  inc: 'inch',

  ft: 'foot',
  "'": 'foot',
  foot: 'foot',
  feet: 'foot',

  yd: 'yard',
  yard: 'yard',
  yards: 'yard',

  mm: 'mm',
  millimeter: 'mm',
  millimeters: 'mm',
  millimetre: 'mm',
  millimetres: 'mm',

  cm: 'cm',
  centimeter: 'cm',
  centimeters: 'cm',
  centimetre: 'cm',
  centimetres: 'cm',

  m: 'm',
  meter: 'm',
  meters: 'm',
  metre: 'm',
  metres: 'm',

  km: 'km',
  kilometer: 'km',
  kilometers: 'km',
  kilometre: 'km',
  kilometres: 'km',

  mi: 'mile',
  mile: 'mile',
  miles: 'mile',

  // mass
  oz: 'ounce',
  ounce: 'ounce',
  ounces: 'ounce',

  lb: 'pound',
  lbs: 'pound',
  pnd: 'pound',
  pnds: 'pound',
  pound: 'pound',
  pounds: 'pound',

  g: 'g',
  gram: 'g',
  grams: 'g',

  kg: 'kg',
  kgs: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilogam: 'kg',
  kilogams: 'kg',

  tonne: 'tonne',
  ton: 'tonne',
  tons: 'tonne',

  stone: 'stone',
  stones: 'stone',
  st: 'stone',

  // temperature
  c: 'degC',
  '°c': 'degC',
  celcius: 'degC',
  celsius: 'degC',
  centigrade: 'degC',
  degc: 'degC',

  f: 'degF',
  '°f': 'degF',
  fahrenheit: 'degF',
  degf: 'degF',

  k: 'K',
  kelvin: 'K',

  // volume
  ml: 'ml',
  mls: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',

  l: 'l',
  lt: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',

  gal: 'gal',
  gallon: 'gal',
  gallons: 'gal',

  pint: 'pint',
  pints: 'pint',

  cup: 'cup',
  cups: 'cup'
}

// Human-readable names and plurals for display
const HUMAN_UNIT_NAMES = {
  inch: { singular: 'inch', plural: 'inches' },
  foot: { singular: 'foot', plural: 'feet' },
  yard: { singular: 'yard', plural: 'yards' },
  mile: { singular: 'mile', plural: 'miles' },
  mm: { singular: 'millimeter', plural: 'millimeters' },
  cm: { singular: 'centimeter', plural: 'centimeters' },
  m: { singular: 'meter', plural: 'meters' },
  km: { singular: 'kilometer', plural: 'kilometers' },

  ounce: { singular: 'ounce', plural: 'ounces' },
  pound: { singular: 'pound', plural: 'pounds' },
  stone: { singular: 'stone', plural: 'stones' },
  g: { singular: 'gram', plural: 'grams' },
  kg: { singular: 'kilogram', plural: 'kilograms' },
  tonne: { singular: 'tonne', plural: 'tonnes' },

  degC: { singular: 'degree Celsius', plural: 'degrees Celsius' },
  degF: { singular: 'degree Fahrenheit', plural: 'degrees Fahrenheit' },
  K: { singular: 'Kelvin', plural: 'Kelvin' },

  ml: { singular: 'milliliter', plural: 'milliliters' },
  l: { singular: 'liter', plural: 'liters' },
  gal: { singular: 'gallon', plural: 'gallons' },
  pint: { singular: 'pint', plural: 'pints' },
  cup: { singular: 'cup', plural: 'cups' }
}

function extractValueAndUnit(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Input must be text like "100 pounds" or "250cm"')
  }

  const cleaned = raw.trim().toLowerCase()

  const match = cleaned.match(/^([+-]?\d*\.?\d+)\s*([a-z��"' ]+)?$/i)
  if (!match) {
    throw new Error('Could not detect a number and unit. Try "100 pounds" or "250 cm".')
  }

  const value = parseFloat(match[1].replace(',', ''))
  const unitPart = (match[2] || '').trim()

  if (!unitPart) {
    throw new Error('Missing unit. Try "100 pounds" instead of just "100".')
  }

  return { value, rawUnit: unitPart }
}

function normalizeUnit(rawUnit) {
  const cleaned = rawUnit.replace(/\s+/g, '').replace(/[^a-z°]/g, '')
  const alias = UNIT_ALIASES[cleaned]
  return alias || cleaned
}

function getCategoryForUnit(unitName) {
  return UNIT_CATEGORY[unitName] || null
}

function formatHumanValue(value) {
  const abs = Math.abs(value)
  if (abs === 0) return '0'
  if (abs >= 1000) return value.toFixed(0)
  if (abs >= 100) return value.toFixed(1)
  if (abs >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

function humanizeUnit(value, unitName) {
  const meta = HUMAN_UNIT_NAMES[unitName] || {
    singular: unitName,
    plural: unitName + 's'
  }
  const abs = Math.abs(value)
  const name = abs === 1 ? meta.singular : meta.plural
  return `${formatHumanValue(value)} ${name}`
}

// Import separate tool modules
const { jsFormatter } = require('./tools/jsFormatter')
const { yamlFormatter } = require('./tools/yamlFormatter')
const { sqlFormatter } = require('./tools/sqlFormatter')
const { jsonFormatter } = require('./tools/jsonFormatter')
const { cssFormatter } = require('./tools/cssFormatter')
const { htmlFormatter, htmlEncoder, htmlDecoder } = require('./tools/htmlFormatter')
const { markdownHtmlFormatter, markdownToHtml } = require('./tools/markdownFormatter')
const { baseConverter } = require('./tools/baseConverter')
const { checksumCalculator } = require('./tools/checksumCalculator')
const { colorConverter } = require('./tools/colorConverter')

// Helper function to identify scripting language tools
export const isScriptingLanguageTool = (toolId) => {
  const scriptingLanguageTools = new Set([
    'js-formatter',
    'json-formatter',
    'xml-formatter',
    'markdown-html-formatter',
    'css-formatter',
    'sql-formatter',
    'yaml-formatter',
  ])
  return scriptingLanguageTools.has(toolId)
}

export const TOOLS = {
  'text-toolkit': {
    name: 'Text Toolkit',
    description: 'Unified text analysis tool - analyze, transform, and visualize text all in one place',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'json',

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
        '  • Whitespace Visualizer: show hidden spaces, tabs, and formatting',
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
  'image-toolkit': {
    name: 'Image Toolkit',
    description: 'Resize images and convert to Base64',
    category: 'image-tools',
    inputTypes: ['image'],
    outputType: 'mixed',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'resize', label: 'Resize Image' },
          { value: 'base64', label: 'Convert to Base64' },
        ],
        default: 'resize',
      },
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
      {
        id: 'maintainAspect',
        label: 'Maintain Aspect Ratio',
        type: 'toggle',
        default: true,
      },
    ],
    detailedDescription: {
      overview: 'The Image Toolkit combines image resizing and Base64 conversion in one unified tool. Resize images to specific dimensions, scale them by percentage, or convert them to Base64 encoded strings for embedding in HTML, CSS, or data URIs.',
      howtouse: [
        'Upload or drag and drop an image into the input area',
        'Select your desired operation: Resize Image or Convert to Base64',
        'For resize: Select your resize mode, enter dimensions, and adjust quality',
        'For Base64: The tool automatically converts your image to Base64 encoding',
        'View the result and download or copy as needed',
      ],
      features: [
        'Multiple resize modes for different use cases',
        'Maintain aspect ratio option to prevent image distortion',
        'Adjustable quality settings (60% to 100%)',
        'Base64 conversion for embedding in code',
        'Real-time preview of resized dimensions',
        'Support for common image formats',
      ],
      usecases: [
        'Optimizing images for websites and social media',
        'Creating thumbnail versions of large images',
        'Converting images to inline Base64 data URIs',
        'Embedding images in HTML/CSS',
        'Standardizing image sizes for galleries',
        'Reducing file sizes for faster loading',
      ],
    },
  },
  'base64-converter': {
    name: 'Base64 Converter',
    description: 'Encode or decode Base64 text',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',

    configSchema: [
      {
        id: 'autoDetect',
        label: 'Auto-Detect Mode',
        type: 'toggle',
        default: true,
      },
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode to Base64' },
          { value: 'decode', label: 'Decode from Base64' },
        ],
        default: 'encode',
        visibleWhen: { field: 'autoDetect', value: false },
      },
      {
        id: 'charEncoding',
        label: 'Character Encoding',
        type: 'select',
        options: [
          { value: 'utf-8', label: 'UTF-8' },
          { value: 'utf-16', label: 'UTF-16' },
          { value: 'ascii', label: 'ASCII' },
        ],
        default: 'utf-8',
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
  'json-formatter': {
    name: 'JSON Formatter',
    description: 'Format, validate, repair, and transform JSON with advanced features',
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
          { value: 'sort-keys', label: 'Sort Keys' },
          { value: 'flatten', label: 'Flatten' },
          { value: 'unflatten', label: 'Unflatten' },
          { value: 'to-yaml', label: 'JSON → YAML' },
          { value: 'to-csv', label: 'JSON → CSV' },
          { value: 'to-xml', label: 'JSON → XML' },
          { value: 'compress', label: 'Compress (Base64)' },
          { value: 'decompress', label: 'Decompress' },
          { value: 'extract-path', label: 'Extract Path' },
        ],
        default: 'beautify',
      },
      {
        id: 'jsonPath',
        label: 'JSON Path',
        type: 'text',
        placeholder: 'e.g., user.profile.name or $.data[*].id',
        default: '',
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
        id: 'showValidation',
        label: 'Show Validation',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeEmptyArrays',
        label: 'Remove Empty Arrays/Objects',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeEmptyStrings',
        label: 'Remove Empty Strings',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'The JSON Formatter is a powerful tool for formatting, validating, and transforming JSON. It handles beautification, minification, validation, key sorting, flattening, extraction of specific paths, and conversion to other formats. Use the toggle options to remove empty arrays, objects, and strings.',
      howtouse: [
        'Paste your JSON code or data into the input field',
        'Select your desired mode: Beautify, Minify, Sort Keys, Flatten, Unflatten, Convert to YAML/CSV/XML, Compress, Decompress, or Extract Path',
        'For Extract Path mode, enter a JSONPath expression like $.user.name or $.items[*].id',
        'Use the toggle options to remove empty arrays/objects and empty strings from your output',
        'Enable Show Validation to see validation results in the Validation tab',
        'View the formatted or transformed result',
        'Copy the output for use in your projects',
      ],
      features: [
        'Beautify JSON with customizable indentation',
        'Minify to reduce file size and whitespace',
        'Validate JSON syntax and catch errors',
        'Sort object keys alphabetically',
        'Flatten nested JSON to single-level objects',
        'Unflatten back to nested structure',
        'Remove null and empty values',
        'Extract values using JSONPath expressions',
        'Convert JSON to YAML format',
        'Compress to Base64 for storage',
        'Decompress Base64 back to JSON',
      ],
      usecases: [
        'Debugging and validating API responses',
        'Fixing broken JSON from various sources',
        'Formatting JSON for readability and editing',
        'Minifying JSON for production use',
        'Organizing JSON keys alphabetically',
        'Flattening nested data structures',
        'Cleaning up JSON by removing null values',
        'Extracting specific data from complex JSON structures',
        'Converting between JSON and YAML formats',
        'Compressing JSON data for storage or transmission',
      ],
      warnings: [
        'JSON → XML ��� JSON will NOT result in identical JSON. XML cannot preserve JSON types, array structure, or empty/null values.',
      ],
    },
    show_in_recommendations: false,
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
  'xml-formatter': {
    name: 'XML Formatter',
    description: 'Advanced XML formatting, validation, conversion, and analysis',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: '<?xml version="1.0"?><root><person id="1"><name>John</name><age>30</age></person><person id="2"><name>Jane</name><age>28</age></person></root>',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'beautify', label: 'Beautify (Pretty Print)' },
          { value: 'minify', label: 'Minify (Compact)' },
          { value: 'to-json', label: 'XML → JSON' },
          { value: 'to-yaml', label: 'XML → YAML' },
          { value: 'to-toml', label: 'XML → TOML' },
          { value: 'xpath', label: 'XPath Query' },
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
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeCDATA',
        label: 'Remove CDATA Wrapper',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeXMLDeclaration',
        label: 'Remove XML Declaration',
        type: 'toggle',
        default: false,
      },
      {
        id: 'xpathQuery',
        label: 'XPath Query',
        type: 'text',
        placeholder: '/root/item[@id="1"]',
        default: '',
      },
      {
        id: 'showLinting',
        label: 'Show Linting',
        type: 'toggle',
        default: true,
      },
    ],
    detailedDescription: {
      overview: 'Advanced XML Formatter with validation, conversion, cleaning, linting, and XPath support. Format XML with proper indentation, minify for production, validate well-formedness, convert to JSON/YAML, clean unnecessary elements, lint for best practices, and run XPath queries.',
      howtouse: [
        'Paste your XML code into the input field',
        'Select a mode: Beautify, Minify, Validate, Convert, Lint, or XPath',
        'Configure options like indent size and cleaning preferences',
        'For XPath mode, enter your XPath query in the query field',
        'View results instantly',
        'Copy output for your projects',
      ],
      features: [
        'Beautify XML with customizable indentation (spaces/tabs)',
        'Minify XML to reduce file size for production',
        'Validate XML well-formedness with detailed error reporting',
        'Convert XML to JSON format',
        'Convert XML to YAML format',
        'Lint XML for best practices and formatting consistency',
        'Execute XPath queries to extract specific elements',
        'Auto-detect input type (JSON vs XML)',
        'Trim excessive whitespace and normalize formatting',
        'Preserve attributes and structure integrity',
      ],
      usecases: [
        'Formatting configuration files (PLIST, Android, etc.)',
        'Making API XML responses readable and debuggable',
        'Minifying XML for production deployment',
        'Validating XML before data migration',
        'Converting between XML and JSON/YAML formats',
        'Debugging complex XML structures with XPath',
        'Standardizing XML formatting in projects',
        'Extracting specific data from XML using XPath',
        'Ensuring XML follows best practices',
      ],
    },
  },
  'yaml-formatter': {
    name: 'YAML Formatter',
    description: 'Format, validate, convert and analyze YAML with advanced features',
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
          { value: 'to-json', label: 'YAML → JSON' },
          { value: 'to-toml', label: 'YAML → TOML' },
          { value: 'to-env', label: 'YAML → Environment Variables' },
          { value: 'flatten', label: 'Flatten' },
          { value: 'detect-unsafe', label: 'Detect Unsafe Keywords' },
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
        ],
        default: '2',
      },
      {
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: false,
      },
      {
        id: 'showLinting',
        label: 'Show Linting',
        type: 'toggle',
        default: true,
      },
    ],
    detailedDescription: {
      overview: 'Advanced YAML Formatter with validation, conversion, and analysis. Handles beautification, validation, conversion to JSON/TOML/ENV, flattening, comment removal, tab conversion, and safety checks. Designed for Docker, Kubernetes, and configuration files.',
      howtouse: [
        'Paste your YAML into the main input field',
        'Select a mode (Beautify, Validate, Convert, etc.)',
        'View the results instantly',
        'Copy output for your configuration files',
      ],
      features: [
        'Beautify and minify YAML with customizable indentation',
        'Complete YAML validation with detailed error reporting',
        'Convert YAML to JSON',
        'Convert YAML to TOML and ENV formats',
        'Flatten nested YAML to dot notation',
        'Unflatten dot notation back to YAML structure',
        'Remove comments from YAML files',
        'Convert tabs to spaces',
        'Detect unsafe YAML keywords (!!js/function, !!python/object, etc.)',
        'Fix indentation errors',
        'Normalize list styles',
        'Show syntax error locations',
      ],
      usecases: [
        'Formatting and validating Docker Compose files',
        'Kubernetes manifests validation and conversion',
        'Configuration file cleanup and standardization',
        'Converting between config formats (YAML/JSON/TOML)',
        'DevOps automation with YAML-to-ENV conversions',
        'Debugging YAML syntax errors with detailed messages',
        'Securing configs by detecting unsafe YAML',
        'Pipeline configuration management',
        'Infrastructure-as-Code file processing',
      ],
    },
  },
  'url-toolkit': {
    name: 'URL Toolkit',
    description: 'Parse, validate, and manipulate URLs with advanced features',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'parse', label: 'Parse & Analyze' },
          { value: 'encode', label: 'Encode Component' },
          { value: 'decode', label: 'Decode Component' },
          { value: 'normalize', label: 'Normalize URL' },
          { value: 'validate', label: 'Validate URL' },
          { value: 'extract-domain', label: 'Extract Root Domain' },
          { value: 'extract-subdomain', label: 'Extract Subdomain' },
          { value: 'extract-tld', label: 'Extract TLD' },
          { value: 'canonicalize', label: 'Canonicalize' },
          { value: 'remove-tracking', label: 'Remove Tracking Params' },
          { value: 'punycode-encode', label: 'Punycode Encode' },
          { value: 'punycode-decode', label: 'Punycode Decode' },
        ],
        default: 'parse',
      },
    ],
    detailedDescription: {
      overview: 'The URL Toolkit is a comprehensive solution for parsing, validating, and manipulating URLs. It breaks down URLs into constituent parts, extracts domain information, normalizes URLs, removes tracking parameters, handles international domains, and more.',
      howtouse: [
        'Paste a URL into the input field',
        'Select your desired mode from the dropdown',
        'For Parse & Analyze: View all URL components automatically',
        'For other modes: The tool processes the URL according to the selected operation',
        'Copy results or specific components as needed',
      ],
      features: [
        'Parse URLs into protocol, domain, port, path, query, fragment',
        'Encode/decode URL components safely',
        'Normalize URLs by removing redundant elements',
        'Validate URL format and structure',
        'Extract root domain and subdomain information',
        'Extract TLD (Top-Level Domain) information',
        'Canonicalize URLs for comparison',
        'Remove UTM tracking and campaign parameters',
        'Handle international domain names (Punycode)',
        'Support for complex query parameters',
      ],
      usecases: [
        'Debugging and analyzing URL structures',
        'Extracting specific domain components',
        'URL validation and error checking',
        'Normalizing URLs for comparison',
        'Removing tracking parameters for privacy',
        'Handling international domains',
        'Building and manipulating dynamic URLs',
        'Analyzing redirect chains',
        'Cleaning URLs for storage or logging',
        'API and webhook URL processing',
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
  'color-converter': {
    name: 'Color Converter',
    description: 'Convert between RGB, HEX, and HSL color formats',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'secondColor',
        label: 'Second Color (for Delta-E comparison)',
        type: 'text',
        placeholder: 'e.g., #FF0000, rgb(255,0,0), tomato',
        row: 1,
      },
      {
        id: 'gradientEndColor',
        label: 'End Color (for gradient)',
        type: 'text',
        placeholder: 'e.g., #0000FF, rgb(0,0,255), blue',
        row: 1,
      },
      {
        id: 'gradientMode',
        label: 'Gradient Interpolation',
        type: 'select',
        options: [
          { value: 'rgb', label: 'RGB' },
          { value: 'hsl', label: 'HSL' },
          { value: 'lab', label: 'LAB (Perceptually Even)' },
          { value: 'lch', label: 'LCH (Modern UI Design)' },
          { value: 'oklab', label: 'OKLAB (Perceptual)' },
        ],
        default: 'rgb',
        row: 2,
      },
      {
        id: 'gradientReversed',
        label: 'Reverse Gradient',
        type: 'toggle',
        default: false,
        row: 2,
      },
    ],
    detailedDescription: {
      overview: 'Professional color converter with support for 10+ formats, color blindness simulation, CMYK printing profiles, Delta-E comparison, and gradient generation. Auto-detects color format instantly.',
      howtouse: [
        'Enter a color in any format: HEX (#FF0000), RGB (255,0,0), HSL (0,100%,50%), or CSS names (tomato, blue)',
        'The tool automatically detects your format',
        'View all color format conversions (HEX, RGB, HSL, HSV, LAB, LCH, CMYK, XYZ)',
        'Optional: Add a second color for Delta-E comparison (CIEDE2000, CIE76, CIE94)',
        'Optional: Add end color to generate smooth gradients with color stops',
        'Export palettes as JSON or SVG',
      ],
      features: [
        'Auto-detect color format (HEX, RGB, HSL, CMYK, HSV, LAB, LCH, CSS names)',
        'Convert between 10+ color formats simultaneously',
        'CMYK profiles: Simple + FOGRA (printing industry standard)',
        'Delta-E color comparison (CIE76, CIE94, CIEDE2000)',
        'Linear gradient generator with color stops and CSS output',
        'Color blindness simulation (Protanopia, Deuteranopia, Tritanopia, Achromatopsia)',
        'WCAG accessibility contrast ratios (AA/AAA)',
        'Color palettes: shades, tints, complementary, analogous, triadic, tetradic',
        'Palette export (JSON, SVG formats)',
        'Named CSS color support',
      ],
      usecases: [
        'Web design and UI color conversion',
        'Print design CMYK color matching',
        'Accessibility testing and color contrast verification',
        'Color blindness simulation for inclusive design',
        'Gradient generation for CSS',
        'Design system color palette management',
        'Professional color comparison and Delta-E analysis',
        'Palette export for design tools',
      ],
    },
  },
  'checksum-calculator': {
    name: 'Checksum Calculator',
    description: 'Professional checksum & hash calculator with 11+ algorithms and multiple input/output modes',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        options: [
          { value: 'crc32', label: 'CRC32 (IEEE 802.3)' },
          { value: 'crc32c', label: 'CRC32-C (Castagnoli)' },
          { value: 'crc16', label: 'CRC16 (X.25)' },
          { value: 'crc16ccitt', label: 'CRC16-CCITT' },
          { value: 'crc8', label: 'CRC8' },
          { value: 'adler32', label: 'Adler-32' },
          { value: 'fletcher16', label: 'Fletcher-16' },
          { value: 'fletcher32', label: 'Fletcher-32' },
          { value: 'simple', label: 'Simple Checksum' },
          { value: 'bsd', label: 'BSD Checksum' },
          { value: 'md5', label: 'MD5 (Hash)' },
          { value: 'sha1', label: 'SHA-1 (Hash)' },
          { value: 'sha256', label: 'SHA-256 (Hash)' },
          { value: 'sha512', label: 'SHA-512 (Hash)' },
        ],
        default: 'crc32',
      },
      {
        id: 'autoDetect',
        label: 'Auto-detect input mode',
        type: 'toggle',
        default: true,
      },
      {
        id: 'inputMode',
        label: 'Input Mode',
        type: 'select',
        options: [
          { value: 'text', label: 'Text (UTF-8)' },
          { value: 'hex', label: 'Hex bytes (0xFF AB CD)' },
          { value: 'base64', label: 'Base64' },
          { value: 'binary', label: 'Binary (01010101)' },
        ],
        default: 'text',
      },
      {
        id: 'outputFormat',
        label: 'Output Format',
        type: 'select',
        options: [
          { value: 'hex', label: 'Hexadecimal (0x...)' },
          { value: 'hex-plain', label: 'Hex (plain)' },
          { value: 'decimal', label: 'Decimal' },
          { value: 'binary', label: 'Binary' },
          { value: 'bytes-be', label: 'Bytes (Big-endian)' },
          { value: 'bytes-le', label: 'Bytes (Little-endian)' },
        ],
        default: 'hex',
      },
      {
        id: 'compareMode',
        label: 'Compare two checksums',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'Professional-grade checksum and hash calculator supporting 11+ algorithms (CRC, Adler, Fletcher, MD5, SHA). Handles multiple input formats (Text, Hex, Base64, Binary) with auto-detection and flexible output formatting for debugging and data verification.',
      howtouse: [
        'Paste your data (text, hex, base64, or binary)',
        'Select checksum algorithm or enable auto-detect',
        'Choose input interpretation mode',
        'View results in multiple formats (hex, decimal, bytes, binary)',
        'Check detailed algorithm parameters and metadata',
      ],
      features: [
        '11+ algorithms: CRC32, CRC32-C, CRC16, Adler-32, Fletcher, MD5, SHA-1/256/512',
        'Auto-detect input format (text, hex, base64, binary)',
        'Multiple output formats (hex, decimal, binary, big-endian, little-endian)',
        'Detailed algorithm metadata and parameters',
        'Input byte length and encoding information',
        'Comprehensive JSON output for integration',
      ],
      usecases: [
        'File integrity verification',
        'Network packet checksums',
        'Data corruption detection',
        'Cryptographic hashing (MD5, SHA)',
        'Debugging binary data',
        'Testing transmission protocols',
        'Data forensics and analysis',
      ],
    },
  },
  'escape-unescape': {
    name: 'Escape/Unescape',
    description: 'Escape or unescape special characters in text, JSON, CSV, HTML',
    category: 'writing',
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
        hideEmptyOption: true,
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
  'caesar-cipher': {
    name: 'Caesar Cipher',
    description: 'Encode or decode text using Caesar cipher with configurable shift',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'text',

    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'encode', label: 'Encode (Shift Right)' },
          { value: 'decode', label: 'Decode (Shift Left)' },
          { value: 'auto', label: 'Auto-Detect' },
        ],
        default: 'auto',
      },
      {
        id: 'shift',
        label: 'Shift Amount',
        type: 'number',
        placeholder: '3',
        default: 3,
      },
      {
        id: 'rot13Mode',
        label: 'ROT13 Mode',
        type: 'toggle',
        default: false,
      },
      {
        id: 'preserveCase',
        label: 'Preserve Case',
        type: 'toggle',
        default: true,
      },
      {
        id: 'shiftLettersOnly',
        label: 'Shift Letters Only',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showBruteForce',
        label: 'Show Brute Force (All 26 Shifts)',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'The Caesar Cipher tool shifts each letter by a configurable amount, creating a simple substitution cipher. Perfect for learning encryption basics and puzzle solving. Features auto-detection, brute force analysis, and ROT13 support.',
      howtouse: [
        'Enter your text',
        'Choose your mode: Encode, Decode, or Auto-Detect',
        'Set the shift amount (1-25) or use ROT13 mode',
        'Toggle options: Preserve Case, Shift Letters Only, or Show Brute Force',
        'View the encrypted result and all 26 possible shifts',
      ],
      features: [
        'Encode/Decode modes with auto-detection',
        'ROT13 shortcut (shift = 13)',
        'Preserve case option',
        'Shift letters only or full ASCII characters',
        'Brute force analysis (view all 26 possible shifts)',
        'Metadata summary with shift details',
        'JSON export for API integration',
      ],
      usecases: [
        'Learning cipher concepts',
        'Simple text obfuscation',
        'Puzzle games and challenges',
        'Historical cipher study',
        'Brute force decryption analysis',
        'Educational cryptography demonstrations',
      ],
    },
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
        visibleWhen: { field: 'mode', value: 'beautify' },
      },
      {
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: false,
      },
      {
        id: 'addAutoprefix',
        label: 'Autoprefix (vendor prefixes)',
        type: 'toggle',
        default: false,
      },
      {
        id: 'browsers',
        label: 'Browserslist Query',
        type: 'text',
        placeholder: 'e.g., last 2 versions, >1%, defaults',
        default: 'last 2 versions',
        visibleWhen: { field: 'addAutoprefix', value: true },
      },
      {
        id: 'showValidation',
        label: 'Show Validation',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showLinting',
        label: 'Show Linting Warnings',
        type: 'toggle',
        default: true,
      },
    ],
    detailedDescription: {
      overview: 'The CSS Formatter tool beautifies messy CSS with proper indentation and line breaks for readability, or minifies it to reduce file size. Includes validation, linting, and autoprefixer support. Useful for debugging and production optimization.',
      howtouse: [
        'Paste your CSS code',
        'Select "Beautify" for readable formatting or "Minify" for compression',
        'Configure indentation and options (validation, linting, autoprefix)',
        'View the formatted result and validation/lint warnings',
        'Copy to your stylesheet',
      ],
      features: [
        'Beautify CSS with proper indentation',
        'Minify CSS for smaller file sizes',
        'Validate CSS syntax with detailed error reporting',
        'Lint CSS for best practices and potential issues',
        'Add vendor prefixes with Autoprefixer',
        'Remove comments before processing',
        'Customize browser target list for autoprefix',
      ],
      usecases: [
        'Improving CSS readability and maintainability',
        'Minifying CSS for production',
        'Debugging CSS formatting and syntax issues',
        'Reducing CSS file size',
        'Adding cross-browser compatibility with autoprefixer',
        'Enforcing CSS best practices',
      ],
    },
    show_in_recommendations: false,
  },
  'sql-formatter': {
    name: 'SQL Formatter',
    description: 'Format, lint, and analyze SQL queries with full dialect support',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'language',
        label: 'SQL Dialect',
        type: 'select',
        options: [
          { value: 'postgresql', label: 'PostgreSQL' },
          { value: 'mysql', label: 'MySQL' },
          { value: 'tsql', label: 'SQL Server' },
          { value: 'sqlite', label: 'SQLite' },
          { value: 'mariadb', label: 'MariaDB' },
          { value: 'plsql', label: 'Oracle' },
          { value: 'bigquery', label: 'BigQuery' },
          { value: 'redshift', label: 'Redshift' },
        ],
        default: 'postgresql',
      },
      {
        id: 'indent',
        label: 'Indentation',
        type: 'select',
        options: [
          { value: '  ', label: '2 Spaces' },
          { value: '    ', label: '4 Spaces' },
          { value: '\t', label: 'Tab' },
        ],
        default: '  ',
      },
      {
        id: 'keywordCase',
        label: 'Keyword Case',
        type: 'select',
        options: [
          { value: 'upper', label: 'UPPERCASE' },
          { value: 'lower', label: 'lowercase' },
          { value: 'preserve', label: 'Preserve' },
        ],
        default: 'upper',
      },
      {
        id: 'minify',
        label: 'Minify',
        type: 'toggle',
        default: false,
      },
      {
        id: 'showLint',
        label: 'Show Lint Warnings',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showTableAnalysis',
        label: 'Show Table & Column Analysis',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showParsing',
        label: 'Show Parse Tree',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'Premium SQL Formatter with formatting, linting, and analysis. Supports PostgreSQL, MySQL, SQL Server, SQLite, and more. Detects issues, extracts tables/columns, and provides query insights.',
      howtouse: [
        'Paste your SQL query',
        'Select your SQL dialect (PostgreSQL, MySQL, etc)',
        'Choose formatting options (indentation, case)',
        'View formatted output with lint warnings and analysis',
        'Copy the formatted query to your database client',
      ],
      features: [
        'Format SQL with proper indentation',
        'Support for 8+ SQL dialects',
        'Uppercase/lowercase/preserve keyword case',
        'Minification for compact output',
        'SQL linting with warnings for best practices',
        'Extract tables and columns used',
        'Detect query type (SELECT, INSERT, UPDATE, etc)',
        'Identify JOINs and subqueries',
        'Suggest formatting improvements',
      ],
      usecases: [
        'Formatting complex queries',
        'Improving readability of database code',
        'Linting SQL for best practices',
        'Debugging query structure',
        'Code review preparation',
        'Analyzing query composition',
        'Converting between SQL dialects',
      ],
    },
  },
  'http-status-lookup': {
    name: 'HTTP Status Code Lookup',
    description: 'Look up HTTP status codes and their meanings',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

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
    toolId: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between common length, mass, temperature, and volume units. Try inputs like "100 pounds", "250 cm", "5 ft", or "72 F".',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Unit Converter tool converts between common measurement units across length, mass, temperature, and volume categories using precise mathematical conversion.',
      howtouse: [
        'Enter a value with a unit, like "100 pounds" or "250 cm"',
        'The tool automatically detects the unit category',
        'View all conversion results for that category',
        'Copy individual results or the complete output',
      ],
      features: [
        'Support for metric and imperial units',
        'Temperature conversion (Celsius, Fahrenheit, Kelvin)',
        'Automatic unit detection',
        'Precise conversions using mathjs',
        'Human-readable output with singular/plural forms',
      ],
      usecases: [
        'International measurement conversions',
        'Recipe and cooking conversions',
        'Scientific and engineering calculations',
        'Fitness and health calculations',
      ],
    },
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
    description: 'Auto-detect and convert numbers to binary, octal, decimal, and hexadecimal',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'autoDetect',
        label: 'Auto-detect input base',
        type: 'toggle',
        default: true,
      },
      {
        id: 'fromBase',
        label: 'Input Base',
        type: 'number',
        placeholder: '10',
        default: 10,
      },
      {
        id: 'toBase',
        label: 'Custom Output Base',
        type: 'number',
        placeholder: 'Optional',
        default: '',
      },
      {
        id: 'outputCase',
        label: 'Output Case',
        type: 'select',
        default: 'uppercase',
        hideEmptyOption: true,
        options: [
          { value: 'uppercase', label: 'Uppercase (ABC)' },
          { value: 'lowercase', label: 'Lowercase (abc)' },
        ],
      },
      {
        id: 'grouping',
        label: 'Grouping',
        type: 'select',
        default: 'none',
        hideEmptyOption: true,
        options: [
          { value: 'none', label: 'None' },
          { value: 'space', label: 'Space (1111 1111)' },
          { value: 'underscore', label: 'Underscore (1111_1111)' },
        ],
      },
      {
        id: 'groupSize',
        label: 'Group Size',
        type: 'number',
        placeholder: '4',
        default: 4,
      },
    ],
    detailedDescription: {
      overview: 'Professional base converter with automatic detection. Recognizes 0x (hex), 0b (binary), and 0o (octal) prefixes. Converts any number to binary, octal, decimal, and hexadecimal with optional formatting.',
      howtouse: [
        'Paste any number (with or without prefix)',
        'Auto-detection identifies the base automatically',
        'View conversions for all 4 common bases instantly',
        'Optionally customize output case and grouping',
        'Copy any result with one click',
      ],
      features: [
        'Automatic base detection from prefixes (0x, 0b, 0o)',
        'Automatic base detection from digit patterns',
        'Converts to all 4 common bases (binary, octal, decimal, hex)',
        'Support for decimals and negative numbers',
        'Manual base override when needed',
        'Custom base conversion (2-36)',
        'Output case selection (uppercase/lowercase)',
        'Grouping options (space or underscore for readability)',
        'Validates input with helpful error messages',
      ],
      usecases: [
        'Programming and debugging',
        'Memory address viewing',
        'Bitwise operations',
        'Color code conversion (hex)',
        'File format analysis',
        'Computer science education',
        'Digital logic design',
      ],
    },
  },
  'math-evaluator': {
    name: 'Math Expression Evaluator',
    description: 'Safely evaluate and calculate mathematical expressions',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',

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
  'cron-tester': {
    name: 'Cron Expression Tester',
    description: 'Validate and explain cron schedule expressions',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { value: 'system', label: 'System Default' },
          { value: 'UTC', label: 'UTC' },
          { value: 'America/New_York', label: 'America/New_York (EST)' },
          { value: 'America/Chicago', label: 'America/Chicago (CST)' },
          { value: 'America/Denver', label: 'America/Denver (MST)' },
          { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
          { value: 'Europe/London', label: 'Europe/London (GMT)' },
          { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
          { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
          { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
          { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
          { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT)' },
          { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
          { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
          { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
          { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEDT)' },
        ],
        default: 'system',
      },
    ],
    detailedDescription: {
      overview: 'The Cron Expression Tester validates and explains cron schedule expressions used in Linux/Unix systems. Perfect for scheduling jobs and understanding cron syntax. Supports multiple timezones for global scheduling.',
      howtouse: [
        'Enter a cron expression',
        'Select your timezone (optional)',
        'The tool validates the syntax',
        'View the explanation of when it runs',
        'See the next 5 scheduled execution times in your timezone',
      ],
      features: [
        'Validate cron expression syntax with Croner',
        'Explain cron schedule in plain English with Cronstrue',
        'Show next 5 execution times',
        'Support for multiple timezones (IANA format)',
        'Support for standard cron syntax',
      ],
      usecases: [
        'Scheduling server tasks',
        'Job scheduler configuration',
        'System automation across timezones',
        'Cron syntax learning',
        'Planning scheduled jobs globally',
      ],
    },
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
    name: 'JavaScript Formatter Suite',
    description: 'Professional-grade JavaScript formatter, minifier, linter, and analyzer',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '// Greet function\\nfunction greet(name) {\\n  console.log("Hello, " + name);\\n  // Return greeting\\n  return "Hi " + name;\\n}\\n\\nconst user = { name: "John" };\\ngreet(user.name);',
    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'format', label: 'Beautify (Prettier)' },
          { value: 'minify', label: 'Minify' },
          { value: 'obfuscate', label: 'Obfuscate' },
        ],
        default: 'format',
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
        id: 'useSemicolons',
        label: 'Use Semicolons',
        type: 'toggle',
        default: true,
      },
      {
        id: 'singleQuotes',
        label: 'Use Single Quotes',
        type: 'toggle',
        default: true,
      },
      {
        id: 'trailingComma',
        label: 'Trailing Comma',
        type: 'select',
        options: [
          { value: 'all', label: 'All' },
          { value: 'es5', label: 'ES5' },
          { value: 'none', label: 'None' },
        ],
        default: 'es5',
      },
      {
        id: 'printWidth',
        label: 'Print Width',
        type: 'select',
        options: [
          { value: '60', label: '60 characters' },
          { value: '80', label: '80 characters' },
          { value: '100', label: '100 characters' },
          { value: '120', label: '120 characters' },
          { value: '140', label: '140 characters' },
          { value: '160', label: '160 characters' },
        ],
        default: '80',
      },
      {
        id: 'bracketSpacing',
        label: 'Bracket Spacing',
        type: 'toggle',
        default: true,
      },
      {
        id: 'arrowParens',
        label: 'Arrow Function Parens',
        type: 'select',
        options: [
          { value: 'always', label: 'Always' },
          { value: 'avoid', label: 'Avoid' },
        ],
        default: 'always',
      },
      {
        id: 'showAnalysis',
        label: 'Show Code Analysis',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showLinting',
        label: 'Show Linting',
        type: 'toggle',
        default: true,
      },
      {
        id: 'compressCode',
        label: 'Aggressive Compression',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeComments',
        label: 'Remove Comments',
        type: 'toggle',
        default: false,
      },
      {
        id: 'removeConsole',
        label: 'Remove Console Logs',
        type: 'toggle',
        default: false,
      },
    ],
    detailedDescription: {
      overview: 'Professional-grade JavaScript formatter with formatting, minification, linting, code analysis, and obfuscation. Supports modern JavaScript (ES2020+) and provides detailed code insights.',
      howtouse: [
        'Paste your JavaScript code',
        'Select your desired mode (Format, Minify, or Obfuscate)',
        'Customize formatting options based on your preferences',
        'Toggle linting, error detection, and code analysis as needed',
        'Copy results or view detailed insights',
      ],
      features: [
        'Format with Prettier (industry standard)',
        'Minify for production (multiple compression levels)',
        'Lint code with error detection',
        'Code analysis with detailed insights',
        'JavaScript obfuscation',
        'Syntax error detection with line/column info',
        'Extract functions, variables, imports/exports',
        'Calculate cyclomatic complexity',
        'Security scanning for dangerous patterns',
        'Remove console logs and comments',
        'Convert between CommonJS and ESM',
        'Support for ES2020+ syntax',
      ],
      usecases: [
        'Professional code formatting',
        'Production code minification',
        'Code linting and quality checks',
        'Security code scanning',
        'Code obfuscation for intellectual property',
        'Analyzing code complexity',
        'Debugging JavaScript errors',
        'Code standardization across teams',
        'Comparing code metrics',
      ],
    },
  },
  'email-validator': {
    name: 'Email Validator',
    description: 'Validate email addresses and check format correctness',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',

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
  'markdown-html-formatter': {
    name: 'Markdown + HTML Formatter',
    description: 'Convert, format, and beautify Markdown and HTML with flexible options',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: `# Getting Started with Web Development

## Introduction

Welcome to **web development**! This guide covers the essentials.

## Key Topics

- **HTML**: Structure and semantics
- **CSS**: Styling and layouts
- **JavaScript**: Interactivity and logic

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Resources

- [MDN Web Docs](https://developer.mozilla.org)
- [CSS Tricks](https://css-tricks.com)
- [Dev.to](https://dev.to)

---

*Last updated: 2024*`,
    configSchema: [
      {
        id: 'convertTo',
        label: 'Convert To',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'html', label: 'HTML' },
          { value: 'markdown', label: 'Markdown' },
        ],
        default: 'none',
      },
      {
        id: 'indent',
        label: 'Indent',
        type: 'select',
        options: [
          { value: '2spaces', label: '2 Spaces' },
          { value: '4spaces', label: '4 Spaces' },
          { value: 'tab', label: 'Tab' },
        ],
        default: '2spaces',
      },
      {
        id: 'minify',
        label: 'Minify',
        type: 'toggle',
        default: false,
      },
      {
        id: 'encodeDecode',
        label: 'Encode/Decode',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'encode-entities', label: 'Encode HTML Entities' },
          { value: 'decode-entities', label: 'Decode HTML Entities' },
          { value: 'encode-html-attr', label: 'Encode for HTML Attribute' },
          { value: 'encode-js-string', label: 'Encode for JavaScript String' },
          { value: 'encode-json', label: 'Encode for JSON' },
        ],
        default: 'none',
      },
      {
        id: 'showValidation',
        label: 'Show Validation',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showLinting',
        label: 'Show Linting Warnings',
        type: 'toggle',
        default: true,
      },
    ],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Markdown + HTML Formatter is a versatile tool for converting, formatting, beautifying both Markdown and HTML content, and encoding/decoding entities for safe use across different contexts. Supports converting between formats, beautifying with proper indentation, minifying for production, and multiple encoding modes for HTML attributes, JavaScript strings, and JSON.',
      howtouse: [
        'Paste your Markdown or HTML content',
        'Select conversion type (None, HTML, or Markdown)',
        'Choose indentation style (2 spaces, 4 spaces, or tab)',
        'Toggle minify to beautify or compress',
        'Optionally select an Encode/Decode mode (HTML Entities, HTML Attribute, JavaScript String, or JSON)',
        'Copy the formatted and optionally encoded/decoded output',
      ],
      features: [
        'Convert Markdown to HTML',
        'Convert HTML to Markdown',
        'Beautify with proper indentation',
        'Minify for production optimization',
        'Auto-detect input type (Markdown or HTML)',
        'Support mixed Markdown and HTML',
        'Configurable indentation (2 spaces, 4 spaces, tab)',
        'Encode/Decode HTML entities',
        'Encode text for safe use in HTML attributes',
        'Encode text for safe use in JavaScript string literals',
        'Encode text for safe use in JSON strings',
        'Clean HTML with JavaScript beautifier',
      ],
      usecases: [
        'Convert Markdown documentation to HTML',
        'Convert HTML pages to Markdown',
        'Format and beautify code blocks',
        'Minify HTML and Markdown for production',
        'Safely encode user input for HTML attributes',
        'Prepare text for embedding in JavaScript code',
        'Safely encode strings for JSON data structures',
        'Format mixed Markdown and HTML content',
        'Prepare content for web publishing',
        'Optimize content for performance',
      ],
    },
  },
  'ip-address-toolkit': {
    name: 'IP Address Toolkit',
    description: 'Validate, convert, analyze IPv4/IPv6 and CIDR ranges with advanced diagnostic tools',
    category: 'network',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The IP Address Toolkit is a comprehensive suite of utilities for working with IP addresses and network ranges. Validate individual IPs, process bulk IP lists, calculate CIDR subnets, and run network diagnostics all in one place. Supports both IPv4 and IPv6, with detailed analysis including geolocation, ASN information, reputation scores, and more.',
      howtouse: [
        'Select a mode: Single IP, Bulk, CIDR & Subnet, or Diagnostics',
        'For Single IP: Enter an IP address and select desired operations',
        'For Bulk: Paste multiple IPs or upload a CSV file',
        'For CIDR: Enter a network range and configure subnetting',
        'For Diagnostics: Enter target IP and select diagnostic operations',
        'Configure options specific to your selected mode',
        'Click "Run" to execute the analysis',
        'View results in organized cards or export to JSON/CSV',
      ],
      features: [
        'Single IP analysis: validation, normalization, integer conversion',
        'IPv4 and IPv6 support with auto-detection',
        'Public/Private classification and reserved range detection',
        'ASN (Autonomous System Number) lookup',
        'Geolocation data (country, region)',
        'Reverse DNS (PTR) lookup',
        'Network safety and reputation scoring',
        'Bulk processing of up to 10,000 IPs',
        'Bulk deduplication and classification',
        'CIDR compression for optimal subnet notation',
        'Subnet visualization and breakdown',
        'Network diagnostics: Ping, Traceroute, Reverse DNS',
        'Pro features: Reputation checks, Threat Intelligence, cross-source verification',
        'Multiple output formats: Cards, JSON, CSV',
      ],
      usecases: [
        'Validate IP addresses in user input or logs',
        'Analyze IP geolocation for regional user base',
        'Check if IPs belong to known threat actors',
        'Plan network infrastructure with CIDR calculations',
        'Process bulk IP lists from firewall logs or export',
        'Monitor network connectivity with diagnostics',
        'Identify private vs public addresses in datasets',
        'ASN lookup for BGP and routing analysis',
        'Network security and threat intelligence',
        'Subnet planning and IP address allocation',
      ],
    },
  },
}

export async function runTool(toolId, inputText, config, inputImage = null) {
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
    case 'base64-converter':
      return base64ConverterTool(inputText, config)
    case 'json-formatter':
      return jsonFormatter(inputText, config)
    case 'regex-tester':
      return regexTester(inputText, config)
    case 'timestamp-converter':
      return timestampConverter(inputText, config)
    case 'csv-json-converter':
      return csvJsonConverter(inputText, config)
    case 'markdown-html-formatter':
      return markdownHtmlFormatter(inputText, config)
    case 'xml-formatter':
      return xmlFormatter(inputText, config)
    case 'yaml-formatter':
      return yamlFormatter(inputText, config)
    case 'url-toolkit':
      return urlToolkit(inputText, config)
    case 'jwt-decoder':
      return jwtDecoder(inputText)
    case 'color-converter':
      return colorConverter(inputText, config)
    case 'checksum-calculator':
      return checksumCalculator(inputText, config)
    case 'escape-unescape':
      return escapeUnescape(inputText, config)
    case 'ascii-unicode-converter':
      return asciiUnicodeConverter(inputText, config)
    case 'caesar-cipher':
      return caesarCipher(inputText, config)
    case 'css-formatter':
      return cssFormatter(inputText, config)
    case 'sql-formatter':
      return sqlFormatter(inputText, config)
    case 'http-status-lookup':
      return httpStatusLookup(inputText)
    case 'mime-type-lookup':
      return mimeTypeLookup(inputText, config)
    case 'http-header-parser':
      return httpHeaderParser(inputText)
    case 'uuid-validator':
      return uuidValidator(inputText)
    case 'svg-optimizer':
      return svgOptimizer(inputText)
    case 'unit-converter':
      return unitConverterTool(inputText, config)
    case 'number-formatter':
      return numberFormatter(inputText, config)
    case 'timezone-converter':
      return timezoneConverter(inputText, config)
    case 'base-converter':
      return baseConverter(inputText, config)
    case 'math-evaluator':
      return mathEvaluator(inputText)
    case 'cron-tester':
      return cronTester(inputText, config)
    case 'file-size-converter':
      return fileSizeConverter(inputText, config)
    case 'js-formatter':
      return await jsFormatter(inputText, config)
    case 'email-validator':
      return emailValidator(inputText)
    case 'ip-address-toolkit':
      return validateIPAddress(inputText, config)
    default:
      throw new Error(`Unknown tool: ${toolId}`)
  }
}

function validateIPAddress(inputText, config = {}) {
  if (!inputText || !inputText.trim()) {
    return {
      error: 'No IP address provided',
      message: 'Please enter an IP address to analyze',
    }
  }

  const ip = inputText.trim()

  try {
    if (!ipaddr) {
      throw new Error('IP address library not available')
    }

    // Try to parse the IP
    let parsedIp = null
    let detectedVersion = null

    try {
      parsedIp = ipaddr.IPv4.parse(ip)
      detectedVersion = 'IPv4'
    } catch (e) {
      // Not IPv4, try IPv6
    }

    if (!parsedIp) {
      try {
        parsedIp = ipaddr.IPv6.parse(ip)
        detectedVersion = 'IPv6'
      } catch (e) {
        // Not IPv6 either
      }
    }

    // Build results - always include all sections
    const results = {
      input: ip,
      version: detectedVersion,
    }

    if (!parsedIp) {
      results.isValid = false
      return results
    }

    // IP is valid
    results.isValid = true

    // Always normalize the IP
    results.normalized = parsedIp.toString()

    // Always convert to integer (IPv4 and IPv6)
    try {
      if (detectedVersion === 'IPv4' && ipNum) {
        const ipv4 = ipNum.IPv4.fromString(ip)
        const intValue = ipv4.getValue()
        let integerValue = intValue.valueOf()
        // Convert BigInt to Number if needed
        if (typeof integerValue === 'bigint') {
          integerValue = Number(integerValue)
        }
        results.integer = integerValue
        results.integerHex = '0x' + integerValue.toString(16).toUpperCase().padStart(8, '0')
        const binary = integerValue.toString(2).padStart(32, '0')
        results.integerBinary = binary.replace(/(.{8})/g, '$1.').replace(/\.$/, '')
      } else if (detectedVersion === 'IPv6' && ipNum) {
        const ipv6 = ipNum.IPv6.fromString(ip)
        const intValue = ipv6.getValue()
        let integerValue = intValue.valueOf()
        // Convert BigInt to String for IPv6
        if (typeof integerValue === 'bigint') {
          integerValue = integerValue.toString()
        } else {
          integerValue = String(integerValue)
        }
        results.integer = integerValue
        const hexValue = parseInt(integerValue).toString(16)
        results.integerHex = '0x' + hexValue.toUpperCase()
        const binaryValue = parseInt(integerValue).toString(2)
        results.integerBinary = binaryValue
      }
    } catch (e) {
      // Conversion failed, skip integer fields
    }

    // Always include classification
    const isPrivate = parsedIp.isPrivate ? parsedIp.isPrivate() : false
    const isLoopback = parsedIp.isLoopback ? parsedIp.isLoopback() : false
    const isMulticast = parsedIp.isMulticast ? parsedIp.isMulticast() : false
    const isReserved = parsedIp.isReserved ? parsedIp.isReserved() : false
    const isLinkLocal = parsedIp.isLinkLocal ? parsedIp.isLinkLocal() : false

    results.classification = {
      type: isPrivate ? 'Private' : isLoopback ? 'Loopback' : isMulticast ? 'Multicast' : isLinkLocal ? 'Link-Local' : 'Public',
      isPrivate,
      isLoopback,
      isMulticast,
      isReserved,
      isLinkLocal,
    }

    return results
  } catch (error) {
    return {
      input: ip,
      version: null,
      error: error.message || 'Failed to parse IP address',
      isValid: false,
    }
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

  // 13. Compress consecutive blank lines to max 2 (only if explicitly enabled and NOT removing line breaks)
  // Note: This option is hidden from the UI as it was redundant with removeLineBreaks
  if (config.compressLineBreaks === true && config.removeLineBreaks !== true) {
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
  result = result.replace(/\u200B/g, ' ') // Zero Width Space ���� space
  result = result.replace(/\u200C/g, ' ') // Zero Width Non-Joiner → space
  result = result.replace(/\u200D/g, ' ') // Zero Width Joiner ��� space
  result = result.replace(/\uFEFF/g, ' ') // Zero Width No-Break Space �� space

  // Word joiner and other invisible formatting
  result = result.replace(/\u2060/g, ' ') // Word Joiner ������ space
  result = result.replace(/\u061C/g, ' ') // Arabic Letter Mark �� space
  result = result.replace(/\u180E/g, ' ') // Mongolian Vowel Separator ��� space

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
  // Conservative approach: ONLY join sequences of single-letter words
  // Limit: maximum 6 characters per fragment to avoid joining multiple words

  let result = text

  // Process line by line to handle multi-line content
  result = result
    .split('\n')
    .map(line => {
      // Split into words, keeping track of spaces
      const parts = line.split(/(\s+)/)  // Split preserves spaces as separate elements

      let processedParts = []
      let i = 0

      while (i < parts.length) {
        const part = parts[i]

        // Skip pure whitespace - they'll be handled naturally
        if (/^\s+$/.test(part)) {
          processedParts.push(part)
          i++
          continue
        }

        // Check if this is a single letter AND next item is space AND item after is single letter
        if (part.length === 1 &&
            i + 2 < parts.length &&
            /^\s+$/.test(parts[i + 1]) &&
            parts[i + 2].length === 1) {

          // Start building a fragment from consecutive single letters
          let fragment = part
          let j = i + 2  // Start at the next single-letter word

          // Keep consuming single-letter words separated by spaces
          // BUT: limit to 5 characters max to avoid joining separate words
          while (j < parts.length &&
                 parts[j].length === 1 &&
                 j + 1 < parts.length &&
                 /^\s+$/.test(parts[j + 1]) &&
                 j + 2 < parts.length &&
                 parts[j + 2].length === 1 &&
                 fragment.length < 5) {  // Limit fragment size
            // Add this single letter (skip the space between them)
            fragment += parts[j]
            j += 2  // Move past the space to the next letter
          }

          // Add the last single letter in the sequence (if it won't exceed limit)
          if (j < parts.length &&
              parts[j].length === 1 &&
              fragment.length < 5) {
            fragment += parts[j]
            j += 1
          }

          // Add the joined fragment
          processedParts.push(fragment)

          // Skip past the space that follows (if there is one)
          if (j < parts.length && /^\s+$/.test(parts[j])) {
            processedParts.push(parts[j])
            j += 1
          }

          i = j
        } else {
          processedParts.push(part)
          i += 1
        }
      }

      return processedParts.join('')
    })
    .join('\n')

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
  // Keep ASCII + accented letters (àá��ãäå, èéêë, etc.)
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


function imageToolkit(imageData, config) {
  const mode = config.mode || 'resize'

  if (mode === 'base64') {
    return {
      mode: 'base64',
      base64Data: imageData || null,
      length: imageData ? imageData.length : 0,
      preview: imageData ? imageData.substring(0, 50) + '...' : null,
    }
  }

  if (mode === 'resize') {
    return {
      mode: 'resize',
      imageData: imageData || null,
      resizeMode: config.resizeMode || 'dimensions',
      width: config.width || 800,
      height: config.height || 600,
      scalePercent: config.scalePercent || 50,
      maintainAspect: config.maintainAspect !== false,
      quality: parseFloat(config.quality || 0.9),
    }
  }

  return { error: 'Unknown mode' }
}

function base64ConverterTool(inputText, config = {}) {
  if (!inputText || !inputText.trim()) {
    return {
      error: 'No input provided',
      detectedMode: null,
      output: '',
    }
  }

  const autoDetect = config.autoDetect !== false
  const charEncoding = config.charEncoding || 'utf-8'

  // Detect if input is Base64 or plain text
  let detectedMode = config.mode || 'encode'
  if (autoDetect) {
    detectedMode = detectBase64Mode(inputText)
  }

  if (detectedMode === 'decode') {
    return base64Decoder(inputText, {
      charEncoding,
    })
  } else {
    return base64Encoder(inputText, {
      charEncoding,
    })
  }
}

function detectBase64Mode(text) {
  const trimmed = text.trim()
  if (!trimmed) return 'encode'

  // Check if input looks like Base64
  // Valid Base64 regex and length check
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  const cleanText = trimmed.replace(/\s/g, '')

  if (base64Regex.test(cleanText) && cleanText.length % 4 === 0 && cleanText.length > 0) {
    // Additional check: try to decode
    try {
      Buffer.from(cleanText, 'base64').toString('utf-8')
      return 'decode'
    } catch (e) {
      return 'encode'
    }
  }

  return 'encode'
}

function base64Encoder(text, options = {}) {
  try {
    const charEncoding = options.charEncoding || 'utf-8'

    // Encode text to bytes based on character encoding
    let buffer
    if (charEncoding === 'utf-16') {
      buffer = Buffer.from(text, 'utf16le')
    } else if (charEncoding === 'ascii') {
      buffer = Buffer.from(text, 'ascii')
    } else {
      buffer = Buffer.from(text, 'utf-8')
    }

    // Standard Base64 encoding
    const base64 = buffer.toString('base64')

    // URL-safe variant (replace + with -, / with _)
    const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_')

    // Version without padding
    const noPadding = base64.replace(/=+$/, '')
    const urlSafeNoPadding = urlSafeBase64.replace(/=+$/, '')

    // Line wrapped (MIME 76 chars)
    const wrapped = base64.match(/.{1,76}/g)?.join('\n') || base64
    const wrappedUrlSafe = urlSafeBase64.match(/.{1,76}/g)?.join('\n') || urlSafeBase64
    const wrappedNoPadding = noPadding.match(/.{1,76}/g)?.join('\n') || noPadding

    const inputBytes = Buffer.from(text, charEncoding === 'utf-16' ? 'utf16le' : charEncoding === 'ascii' ? 'ascii' : 'utf-8').length
    const outputBytes = Buffer.from(base64, 'utf-8').length

    return {
      mode: 'encode',
      detectedMode: 'encode',
      output: base64,
      input: text,
      charEncoding,
      paddingStatus: base64.match(/=+$/)?.[0] ? `Valid (${base64.match(/=+$/)[0]})` : 'None',

      // All formats available
      formats: {
        'Standard Base64': base64,
        'URL-Safe Base64': urlSafeBase64,
        'No Padding': noPadding,
        'URL-Safe No Padding': urlSafeNoPadding,
        'Line Wrapped (76 chars)': wrapped,
        'URL-Safe Wrapped': wrappedUrlSafe,
        'Wrapped No Padding': wrappedNoPadding,
      },

      // Metadata
      metadata: {
        'Mode': 'Encode',
        'Character Encoding': charEncoding.toUpperCase(),
        'Padding Status': base64.match(/=+$/)?.[0] ? `Valid (${base64.match(/=+$/)[0]})` : 'None',
        'Input Size': `${inputBytes} byte${inputBytes !== 1 ? 's' : ''}`,
        'Output Size': `${outputBytes} byte${outputBytes !== 1 ? 's' : ''}`,
        'Compression Ratio': ((outputBytes / inputBytes) * 100).toFixed(2) + '%',
      },
    }
  } catch (error) {
    return {
      error: `Encoding failed: ${error.message}`,
      detectedMode: 'encode',
      output: '',
    }
  }
}

function base64Decoder(text, options = {}) {
  const charEncoding = options.charEncoding || 'utf-8'

  const trimmed = text.trim()
  if (!trimmed) {
    return {
      mode: 'decode',
      detectedMode: 'decode',
      output: '',
      input: text,
    }
  }

  try {
    // Remove whitespace
    let cleanText = trimmed.replace(/\s+/g, '')

    // Auto-fix padding (always enabled)
    const remainder = cleanText.length % 4
    if (remainder) {
      cleanText += '='.repeat(4 - remainder)
    }

    // Handle URL-safe Base64 (replace - with +, _ with /)
    let decodedText
    if (cleanText.includes('-') || cleanText.includes('_')) {
      // URL-safe variant
      const standardBase64 = cleanText.replace(/-/g, '+').replace(/_/g, '/')
      decodedText = Buffer.from(standardBase64, 'base64').toString('utf-8')
    } else {
      decodedText = Buffer.from(cleanText, 'base64').toString('utf-8')
    }

    // Check if decoded result contains valid text
    const isValidText = /^[\x00-\x7F\x80-\xFF]*$/.test(decodedText)

    const inputBytes = Buffer.from(trimmed, 'utf-8').length
    const outputBytes = Buffer.from(decodedText, 'utf-8').length

    return {
      mode: 'decode',
      detectedMode: 'decode',
      output: decodedText,
      input: text,
      isValidText,
      warning: !isValidText ? '⚠ Decoded result may contain non-text data.' : null,

      metadata: {
        'Mode': 'Decode',
        'Character Encoding': charEncoding.toUpperCase(),
        'Input Size': `${inputBytes} byte${inputBytes !== 1 ? 's' : ''}`,
        'Output Size': `${outputBytes} byte${outputBytes !== 1 ? 's' : ''}`,
        'Decoded Successfully': isValidText ? 'Yes' : 'No',
      },
    }
  } catch (error) {
    let errorMsg = 'Invalid Base64 format'
    if (error.message.includes('is not a valid base64')) {
      errorMsg = 'Contains invalid characters for Base64'
    } else if (text.length % 4 !== 0) {
      errorMsg = 'Length is not divisible by 4 (auto-fix attempted)'
    }

    return {
      error: errorMsg,
      detectedMode: 'decode',
      output: '',
      input: text,
    }
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



function reverseText(text) {
  return text.split('').reverse().join('')
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


function xmlFormatter(text, config) {
  const mode = config.mode || 'beautify'
  const showValidation = config.showValidation !== false
  const showLinting = config.showLinting !== false
  const showRepairInfo = config.showRepairInfo || false

  try {
    let result = {}

    // Handle beautify/minify with the new pipeline
    if (mode === 'beautify' || mode === 'minify') {
      // Load the new XML formatter module
      let processXmlTool
      try {
        const xmlFormatterModule = require('./tools/xmlFormatter.js')
        processXmlTool = xmlFormatterModule.processXmlTool
      } catch (importError) {
        // Fallback to old implementation if require fails
        return xmlFormatterLegacy(text, config)
      }

      // Build options for the new pipeline
      const formatOptions = {
        formatMode: mode,
        indentSize: config.indentSize || '2',
        removeDeclaration: config.removeXMLDeclaration || false,
        removeComments: config.removeComments || false,
        removeCDATA: config.removeCDATA || false,
        showValidation,
        showLinting,
        autoRepair: config.showRepairInfo !== false,  // or your toggle
      };

      // Run the pipeline
      const pipelineResult = processXmlTool(text, formatOptions)

      if (!pipelineResult.ok) {
        return {
          error: pipelineResult.error,
          stage: pipelineResult.stage,
          originalXml: pipelineResult.originalXml,
        }
      }

      // Build result object
      result.formatted = pipelineResult.finalXml
      result.diagnostics = pipelineResult.diagnostics
      result.lintWarnings = pipelineResult.lintWarnings
      result.validation = pipelineResult.validation
      result.showValidation = pipelineResult.showValidation
      result.showLinting = pipelineResult.showLinting
      result.isWellFormed = pipelineResult.isWellFormed

      return result
    } else {
      // For conversion modes, use the new pipeline to get repairedXml, then convert
      let processXmlTool
      try {
        const xmlFormatterModule = require('./tools/xmlFormatter.js')
        processXmlTool = xmlFormatterModule.processXmlTool
      } catch (importError) {
        // Fallback to old implementation if require fails
        return xmlFormatterLegacy(text, config)
      }

      // Build options for the new pipeline
      const formatOptions = {
        formatMode: 'none',
        indentSize: config.indentSize || '2',
        removeDeclaration: config.removeXMLDeclaration || false,
        removeComments: config.removeComments || false,
        removeCDATA: config.removeCDATA || false,
        showValidation,
        showLinting,
        autoRepair: config.showRepairInfo !== false,
      }

      // Run the pipeline
      const pipelineResult = processXmlTool(text, formatOptions)

      if (!pipelineResult.ok) {
        return {
          error: pipelineResult.error,
          stage: pipelineResult.stage,
          originalXml: pipelineResult.originalXml,
        }
      }

      // Use repairedXml for conversion (NOT cleanedXml or finalXml)
      const xmlForConversion = pipelineResult.finalXml || pipelineResult.cleanedXml
      let convertedResult = null

      const mode = config.mode || 'beautify'
      switch (mode) {
        case 'to-json':
          convertedResult = xmlToJson(xmlForConversion)
          break
        case 'to-yaml':
          convertedResult = xmlToYaml(xmlForConversion)
          break
        case 'to-toml':
          convertedResult = xmlToToml(xmlForConversion)
          break
        case 'xpath':
          convertedResult = xmlXPath(xmlForConversion, config)
          break
        default:
          convertedResult = xmlForConversion
      }

      // Build result object
      result.formatted = convertedResult
      result.diagnostics = pipelineResult.diagnostics
      result.lintWarnings = pipelineResult.lintWarnings
      result.validation = pipelineResult.validation
      result.showValidation = pipelineResult.showValidation
      result.showLinting = pipelineResult.showLinting
      result.isWellFormed = pipelineResult.isWellFormed

      return result
    }
  } catch (error) {
    return { error: error.message }
  }
}

function xmlFormatterLegacy(text, config) {
  const mode = config.mode || 'beautify'
  const indentSize = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2)
  const showValidation = config.showValidation || false
  const showLinting = config.showLinting || false
  const showRepairInfo = config.showRepairInfo || false

  try {
    let result = {}
    let modeResult = null
    let repairResult = { wasRepaired: false, method: null, repairs: [] }
    let workingXml = text

    // For beautify and minify modes, run the full pipeline: repair �� validate → cleanup → format
    if (mode === 'beautify' || mode === 'minify') {
      // Step 1: Auto-repair using tolerant parsing (only if enabled)
      if (showRepairInfo) {
        repairResult = autoRepairXml(text)
        if (repairResult.wasRepaired) {
          workingXml = repairResult.xml
        }
      }

      // Step 2: Validate the repaired XML (validation happens AFTER repair)
      if (showValidation) {
        const validationResult = xmlValidate(workingXml)
        if (typeof result === 'string') {
          result = { validation: validationResult }
        } else {
          result.validation = validationResult
        }
      }

      // Step 3: Apply cleanup options (after repairs and validation)
      workingXml = applyXmlCleanup(workingXml, config)

      // Step 4: Beautify or minify using pretty-data
      switch (mode) {
        case 'beautify':
          if (prettyData && prettyData.pd && prettyData.pd.xml) {
            modeResult = prettyData.pd.xml(workingXml)
          } else {
            modeResult = xmlBeautify(workingXml, indentSize, config)
          }
          break
        case 'minify':
          if (prettyData && prettyData.pd && prettyData.pd.xmlmin) {
            const preserveComments = config?.removeComments !== true
            modeResult = prettyData.pd.xmlmin(workingXml, preserveComments)
          } else {
            modeResult = xmlMinify(workingXml, config)
          }
          break
      }
    } else {
      // For conversion modes, attempt auto-repair if enabled, then cleanup and convert
      if (showRepairInfo) {
        repairResult = autoRepairXml(text)
        if (repairResult.wasRepaired) {
          workingXml = repairResult.xml
        }
      }

      if (showValidation) {
        const validationResult = xmlValidate(workingXml)
        if (typeof result === 'string') {
          result = { validation: validationResult }
        } else {
          result.validation = validationResult
        }
      }

      let cleanXml = applyXmlCleanup(workingXml, config)

      switch (mode) {
        case 'to-json':
          modeResult = xmlToJson(cleanXml)
          break
        case 'to-yaml':
          modeResult = xmlToYaml(cleanXml)
          break
        case 'to-toml':
          modeResult = xmlToToml(cleanXml)
          break
        case 'xpath':
          modeResult = xmlXPath(cleanXml, config)
          break
        default:
          modeResult = xmlBeautify(cleanXml, indentSize, config)
      }
    }

    // Ensure result is an object with formatted output
    if (typeof modeResult === 'string') {
      result.formatted = modeResult
    } else if (typeof modeResult === 'object' && modeResult !== null) {
      result = { ...result, ...modeResult }
    }

    // Add linting if requested (linting happens at the end, on the final output)
    if (showLinting) {
      result.linting = xmlLint(text)
    }

    return result
  } catch (error) {
    return { error: error.message }
  }
}

function xmlBeautify(text, indentSize, config) {
  try {
    let trimmed = text.trim()

    if (config?.removeXMLDeclaration) {
      trimmed = trimmed.replace(/<\?xml[^?]*\?>/, '').trim()
    }

    if (config?.removeComments) {
      trimmed = trimmed.replace(/<!--[\s\S]*?-->/g, '')
    }

    if (config?.removeCDATA) {
      trimmed = trimmed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    }

    if (xmlParser && xmlParser.validate(trimmed) === true) {
      const indentChar = indentSize === '\t' ? '\t' : indentSize
      const builder = xmlParser.j2xParser({
        arrayName: 'item',
        formatCb: (tagName) => tagName,
        indentBy: indentChar,
        supressEmptyNode: false,
        ignoreAttributes: false,
        processEntities: true,
      })

      const parsed = xmlParser.parse(trimmed)
      let result = xmlParser.build(parsed, {
        indentBy: indentChar,
        supressEmptyNode: false,
        ignoreAttributes: false,
      })

      if (result.startsWith('<?xml')) {
        const xmlDeclEnd = result.indexOf('?>')
        if (xmlDeclEnd !== -1) {
          result = result.substring(xmlDeclEnd + 2).trim()
        }
      }

      return result
    } else {
      return fallbackXmlBeautify(trimmed, indentSize, config)
    }
  } catch (error) {
    return fallbackXmlBeautify(text, indentSize, config)
  }
}

function fallbackXmlBeautify(text, indentSize, config) {
  try {
    let trimmed = text.trim()
    let formatted = ''
    let indent = 0
    let i = 0

    while (i < trimmed.length) {
      if (trimmed[i] === '<') {
        const closeIdx = trimmed.indexOf('>', i)
        if (closeIdx === -1) break

        const tag = trimmed.substring(i, closeIdx + 1)

        if (tag.startsWith('<!--')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<![CDATA[')) {
          const cdataEnd = trimmed.indexOf(']]>', i)
          if (cdataEnd !== -1) {
            const cdata = trimmed.substring(i, cdataEnd + 3)
            formatted += indentSize.repeat(indent) + cdata + '\n'
            i = cdataEnd + 3
          } else {
            i = closeIdx + 1
          }
          continue
        }

        if (tag.startsWith('<?')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<!')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('</')) {
          indent = Math.max(0, indent - 1)
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
        } else if (tag.endsWith('/>')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
        } else {
          const tagName = tag.slice(1, -1).split(/\s+/)[0]
          formatted += indentSize.repeat(indent) + tag
          i = closeIdx + 1

          const nextTagIdx = trimmed.indexOf('<', i)
          if (nextTagIdx !== -1) {
            const textBetween = trimmed.substring(i, nextTagIdx)
            const closingTag = '</' + tagName + '>'

            if (textBetween.trim() && trimmed.substring(nextTagIdx).startsWith(closingTag)) {
              formatted += textBetween + closingTag + '\n'
              i = nextTagIdx + closingTag.length
              continue
            } else if (!textBetween.trim()) {
              formatted += '\n'
              indent++
            } else {
              formatted += textBetween + '\n'
              i = nextTagIdx
              indent++
              continue
            }
          } else {
            formatted += '\n'
            indent++
          }
        }
      } else {
        i++
      }
    }

    return formatted.trim()
  } catch (error) {
    return { error: 'Failed to beautify XML: ' + error.message }
  }
}

function xmlMinify(text, config) {
  try {
    let result = text

    if (config?.removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '')
    }

    if (config?.removeCDATA) {
      result = result.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    }

    if (config?.removeXMLDeclaration) {
      result = result.replace(/<\?xml[^?]*\?>/g, '')
    }

    result = result.replace(/>\s+</g, '><').trim()

    return result.trim()
  } catch (error) {
    return { error: 'Failed to minify XML: ' + error.message }
  }
}

function xmlValidate(text) {
  try {
    const trimmed = text.trim()
    const errors = []

    if (!trimmed.startsWith('<')) {
      return { status: 'invalid', errors: [{ level: 'error', message: 'Invalid XML: Does not start with < character', line: 1, column: 1 }] }
    }

    let depth = 0
    const tagStack = []
    let i = 0
    let lineNum = 1

    while (i < trimmed.length) {
      if (trimmed[i] === '\n') {
        lineNum++
      }

      if (trimmed[i] === '<') {
        const closeIdx = trimmed.indexOf('>', i)
        if (closeIdx === -1) {
          errors.push({ level: 'error', message: 'Unclosed tag at position ' + i, line: lineNum, column: i - trimmed.lastIndexOf('\n', i) })
          break
        }

        const tag = trimmed.substring(i, closeIdx + 1)

        if (tag.startsWith('<!--')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<![CDATA[')) {
          const cdataEnd = trimmed.indexOf(']]>', i)
          if (cdataEnd === -1) {
            errors.push({ level: 'error', message: 'Unclosed CDATA section', line: lineNum, column: 1 })
            break
          }
          i = cdataEnd + 3
          continue
        }

        if (tag.startsWith('<?')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<!')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('</')) {
          const tagName = tag.slice(2, -1).trim().split(/\s/)[0]
          if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
            errors.push({ level: 'error', message: 'Mismatched closing tag: </' + tagName + '>', line: lineNum, column: 1 })
          } else {
            tagStack.pop()
            depth--
          }
        } else if (tag.endsWith('/>')) {
          // Self-closing tag
        } else {
          const tagName = tag.slice(1, -1).trim().split(/\s/)[0]
          tagStack.push(tagName)
          depth++
        }

        i = closeIdx + 1
      } else {
        i++
      }
    }

    if (tagStack.length > 0) {
      errors.push({ level: 'error', message: 'Unclosed tags: ' + tagStack.join(', '), line: lineNum, column: 1 })
    }

    if (errors.length === 0) {
      return { status: 'valid', errors: [] }
    }

    return { status: 'invalid', errors }
  } catch (error) {
    return { status: 'error', errors: [{ level: 'error', message: 'Validation error: ' + error.message, line: 1, column: 1 }] }
  }
}

function cleanParsedXml(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanParsedXml(item))
  }

  const cleaned = {}

  for (const [key, value] of Object.entries(obj)) {
    // Skip XML declaration
    if (key === '?xml') {
      continue
    }

    // Skip whitespace-only text nodes
    if (key === '#text' && typeof value === 'string' && value.trim() === '') {
      continue
    }

    // Recursively clean nested objects
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanParsedXml(value)
    } else if (key === '#text' && typeof value === 'string') {
      // Trim text content
      cleaned[key] = value.trim()
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

function xmlToJson(xmlString) {
  try {
    const { XMLParser } = require('fast-xml-parser')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
      parseTrueNumberOnly: false,
    })

    const json = parser.parse(xmlString)
    const cleaned = cleanParsedXml(json)
    return JSON.stringify(cleaned, null, 2)
  } catch (error) {
    return { error: 'Failed to convert XML to JSON: ' + error.message }
  }
}

function fallbackXmlToJson(text) {
  try {
    let result = {}
    const trimmed = text.trim()

    function parseElement(str, depth = 0) {
      const obj = {}
      let remaining = str

      const rootTagMatch = remaining.match(/<(\w+)([^>]*)>/)
      if (!rootTagMatch) {
        return obj
      }

      const tagName = rootTagMatch[1]
      const attrsStr = rootTagMatch[2]
      const closeTag = '</' + tagName + '>'

      const attrs = {}
      const attrRegex = /(\w+)="([^"]*)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2]
      }

      const startIdx = remaining.indexOf('>') + 1
      const endIdx = remaining.lastIndexOf(closeTag)

      if (endIdx === -1) {
        return { [tagName]: attrs }
      }

      const content = remaining.substring(startIdx, endIdx)
      const children = {}
      let textContent = content

      const childRegex = /<(\w+)([^>]*)>[\s\S]*?<\/\1>/g
      let childMatch
      while ((childMatch = childRegex.exec(content)) !== null) {
        const childName = childMatch[1]
        const childStr = childMatch[0]
        const parsed = parseElement(childStr, depth + 1)

        if (children[childName]) {
          if (!Array.isArray(children[childName])) {
            children[childName] = [children[childName]]
          }
          children[childName].push(parsed[childName] || childStr)
        } else {
          children[childName] = parsed[childName] || childStr
        }

        textContent = textContent.replace(childStr, '')
      }

      textContent = textContent.trim()

      const element = { ...attrs }

      if (Object.keys(children).length > 0) {
        Object.assign(element, children)
      }

      if (textContent) {
        if (Object.keys(element).length === 0) {
          obj[tagName] = textContent
        } else {
          element['#text'] = textContent
          obj[tagName] = element
        }
      } else {
        obj[tagName] = element
      }

      return obj
    }

    result = parseElement(trimmed)
    return JSON.stringify(result, null, 2)
  } catch (error) {
    return { error: 'Failed to convert XML to JSON: ' + error.message }
  }
}

function getXmlRepairDifferences(original, repaired) {
  // For XML, line-by-line comparison is unreliable because formatting changes
  // Instead, we detect semantic changes by comparing normalized content

  // Normalize by removing all whitespace for comparison
  const normalizeForComparison = (xml) => {
    return xml.replace(/\s+/g, ' ').trim()
  }

  const normalizedOrig = normalizeForComparison(original)
  const normalizedRepaired = normalizeForComparison(repaired)

  // If the normalized versions are identical, no semantic repair was needed
  if (normalizedOrig === normalizedRepaired) {
    return []
  }

  // If they differ semantically, return a single comprehensive repair entry
  // showing the original vs repaired full content
  return [{
    lineNumber: 1,
    original: original.trim(),
    repaired: repaired.trim(),
    comprehensive: true
  }]
}

function autoRepairXml(xml) {
  const originalXml = xml

  try {
    if (!xmlParser || !xmlParser.XMLParser || !xmlParser.XMLBuilder) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 1: Check if already valid using strict parser
    const strictParser = new xmlParser.XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
    })

    let isValid = false
    try {
      strictParser.parse(originalXml)
      isValid = true
    } catch (e) {
      isValid = false
    }

    // If already valid, skip repair to preserve comments/CDATA
    if (isValid) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 2: Create tolerant parser for repair
    // This configuration auto-closes missing tags, fixes nesting, preserves CDATA/comments
    const tolerantParser = new xmlParser.XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      allowBooleanAttributes: true,
      commentPropName: '#comment',
      cdataPropName: '#cdata',
      alwaysCreateTextNode: true,
      trimValues: false,
    })

    let parsed
    try {
      // Tolerant parse (this is the actual "repair" step)
      parsed = tolerantParser.parse(originalXml)
    } catch (err) {
      // XML is too broken to even tolerantly parse
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 3: Rebuild XML from repaired AST
    const builder = new xmlParser.XMLBuilder({
      ignoreAttributes: false,
      preserveOrder: true,
      suppressBooleanAttributes: false,
      format: false,
      commentPropName: '#comment',
      cdataPropName: '#cdata',
    })

    let repairedXml = builder.build(parsed)

    // STEP 4: Validate the rebuilt XML to ensure it's actually valid
    let isRepairedValid = false
    try {
      strictParser.parse(repairedXml)
      isRepairedValid = true
    } catch (e) {
      isRepairedValid = false
    }

    // Only return repair if the result is valid and different from original
    if (isRepairedValid && repairedXml !== originalXml) {
      const repairDiffs = getXmlRepairDifferences(originalXml, repairedXml)
      return {
        xml: repairedXml,
        wasRepaired: true,
        method: 'fast-xml-parser-recover',
        repairs: repairDiffs,
      }
    }

    return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
  } catch (error) {
    return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
  }
}

function applyXmlCleanup(xml, config) {
  let result = xml

  if (config?.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '')
  }

  if (config?.removeCDATA) {
    result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  }

  if (config?.removeXMLDeclaration) {
    result = result.replace(/<\?xml[^?]*\?>/g, '')
  }

  return result.trim()
}

function xmlLint(text) {
  try {
    const warnings = []
    const trimmed = text.trim()

    if (!trimmed.startsWith('<')) {
      return { total: 0, warnings, status: 'invalid', error: 'Invalid XML' }
    }

    const tagRegex = /<(\w+)([^>]*)>/g
    let match

    while ((match = tagRegex.exec(trimmed)) !== null) {
      const tagName = match[1]
      const attrsStr = match[2]

      if (attrsStr) {
        const attrs = attrsStr.match(/(\w+)=/g)
        if (attrs && attrs.length > 1) {
          const attrNames = attrs.map(a => a.slice(0, -1))
          const sorted = [...attrNames].sort()
          if (JSON.stringify(attrNames) !== JSON.stringify(sorted)) {
            warnings.push({
              level: 'warning',
              message: 'Attributes not in alphabetical order in <' + tagName + '>',
              ruleId: 'attribute-order',
              line: trimmed.substring(0, match.index).split('\n').length,
              column: 1
            })
          }
        }
      }
    }

    const indentMatch = trimmed.match(/^(\s+)/)
    if (indentMatch) {
      const indent = indentMatch[1]
      if (indent.length % 2 !== 0 && indent.length % 4 !== 0 && indent !== '\t') {
        warnings.push({
          level: 'warning',
          message: 'Inconsistent indentation',
          ruleId: 'indent-consistency',
          line: 1,
          column: 1
        })
      }
    }

    return { total: warnings.length, warnings, status: warnings.length === 0 ? 'valid' : 'invalid' }
  } catch (error) {
    return { total: 0, warnings: [], status: 'error', error: 'Linting failed: ' + error.message }
  }
}

function xmlXPath(text, config) {
  try {
    const query = config?.xpathQuery || ''

    if (!query) {
      return { error: 'XPath query is required. Example: /root/item[@id="1"]' }
    }

    const trimmed = text.trim()
    const results = []

    if (xpath && DOMParser) {
      try {
        const doc = new DOMParser().parseFromString(trimmed, 'text/xml')
        const nodes = xpath.select(query, doc)

        if (nodes && nodes.length > 0) {
          results.push(...nodes.map(node => {
            if (node.nodeType === 3) return node.data
            const str = node.toString()
            return str || node.toXml?.() || serializeNode(node)
          }))
        }
      } catch (e) {
        return fallbackXmlXPath(trimmed, query)
      }
    } else {
      return fallbackXmlXPath(trimmed, query)
    }

    if (results.length === 0) {
      return { results: [], message: 'No matches found for XPath: ' + query }
    }

    return { results: results, count: results.length, query: query }
  } catch (error) {
    return { error: 'XPath query failed: ' + error.message }
  }
}

function serializeNode(node) {
  let result = ''

  if (node.nodeType === 1) {
    result = '<' + node.tagName
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i]
        result += ' ' + attr.name + '="' + attr.value + '"'
      }
    }

    if (node.childNodes && node.childNodes.length === 0) {
      result += '/>'
    } else {
      result += '>'
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          result += serializeNode(node.childNodes[i])
        }
      }
      result += '</' + node.tagName + '>'
    }
  } else if (node.nodeType === 3) {
    result = node.data
  } else if (node.nodeType === 8) {
    result = '<!--' + node.data + '-->'
  }

  return result
}

function fallbackXmlXPath(text, query) {
  try {
    const results = []
    const trimmed = text.trim()

    if (query.startsWith('//')) {
      const nodeName = query.slice(2).split('[')[0].split('@')[0].split('/')[0]
      const regex = new RegExp('<' + nodeName + '([^>]*)>([\\s\\S]*?)<\\/' + nodeName + '>', 'g')
      let match
      while ((match = regex.exec(trimmed)) !== null) {
        results.push(match[0])
      }
    } else if (query.startsWith('/')) {
      const parts = query.split('/').filter(p => p)
      let searchText = trimmed
      let currentResults = [searchText]

      for (const part of parts) {
        const newResults = []
        const cleanPart = part.split('[')[0].split('@')[0]

        for (const content of currentResults) {
          const regex = new RegExp('<' + cleanPart + '([^>]*)>([\\s\\S]*?)<\\/' + cleanPart + '>', 'g')
          let match
          while ((match = regex.exec(content)) !== null) {
            newResults.push(match[0])
          }
        }

        currentResults = newResults
      }

      results.push(...currentResults)
    }

    if (results.length === 0) {
      return { results: [], message: 'No matches found for XPath: ' + query }
    }

    return { results: results, count: results.length, query: query }
  } catch (error) {
    return { error: 'XPath query failed: ' + error.message }
  }
}

function xmlToYaml(xmlString) {
  try {
    const { XMLParser } = require('fast-xml-parser')
    const yaml = require('yaml')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
    })

    const json = parser.parse(xmlString)
    const cleaned = cleanParsedXml(json)
    return yaml.stringify(cleaned)
  } catch (error) {
    return { error: 'Failed to convert XML to YAML: ' + error.message }
  }
}

function xmlToToml(xmlString) {
  try {
    const { XMLParser } = require('fast-xml-parser')
    const toml = require('@iarna/toml')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
    })

    const json = parser.parse(xmlString)
    const cleaned = cleanParsedXml(json)
    return toml.stringify(cleaned)
  } catch (error) {
    return { error: 'Failed to convert XML to TOML: ' + error.message }
  }
}


function urlToolkit(text, config) {
  const trimmed = text.trim()
  const mode = config.mode || 'parse'

  try {
    switch (mode) {
      case 'parse': {
        const url = new URL(trimmed)
        return {
          original: trimmed,
          href: url.href,
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 'default',
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          searchParams: Object.fromEntries(url.searchParams),
        }
      }

      case 'encode': {
        return {
          original: trimmed,
          encoded: encodeURIComponent(trimmed),
        }
      }

      case 'decode': {
        return {
          original: trimmed,
          decoded: decodeURIComponent(trimmed),
        }
      }

      case 'normalize': {
        try {
          const url = new URL(trimmed)
          // Remove duplicate slashes in path
          const normalizedPath = url.pathname.replace(/\/+/g, '/')
          // Sort query parameters
          const params = new URLSearchParams(url.search)
          const sortedParams = new URLSearchParams([...params].sort())
          const normalized = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${normalizedPath}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}${url.hash}`
          return {
            original: trimmed,
            normalized,
          }
        } catch (e) {
          return { error: 'Failed to normalize URL: ' + e.message }
        }
      }

      case 'validate': {
        if (validator) {
          const isValid = validator.isURL(trimmed)
          return {
            original: trimmed,
            isValid,
            message: isValid ? 'Valid URL' : 'Invalid URL format',
          }
        }
        try {
          new URL(trimmed)
          return { original: trimmed, isValid: true, message: 'Valid URL' }
        } catch (e) {
          return { original: trimmed, isValid: false, message: 'Invalid URL format' }
        }
      }

      case 'extract-domain': {
        if (tldts) {
          try {
            const url = new URL(trimmed)
            const result = tldts.getDomain(url.hostname)
            return {
              original: trimmed,
              hostname: url.hostname,
              rootDomain: result || url.hostname,
            }
          } catch (e) {
            return { error: 'Failed to extract domain: ' + e.message }
          }
        }
        return { error: 'tldts module not available' }
      }

      case 'extract-subdomain': {
        if (tldts) {
          try {
            const url = new URL(trimmed)
            const result = tldts.getSubdomain(url.hostname)
            return {
              original: trimmed,
              hostname: url.hostname,
              subdomain: result || '(none)',
            }
          } catch (e) {
            return { error: 'Failed to extract subdomain: ' + e.message }
          }
        }
        return { error: 'tldts module not available' }
      }

      case 'extract-tld': {
        if (tldts) {
          try {
            const url = new URL(trimmed)
            const result = tldts.getPublicSuffix(url.hostname)
            return {
              original: trimmed,
              hostname: url.hostname,
              tld: result || url.hostname.split('.').pop(),
            }
          } catch (e) {
            return { error: 'Failed to extract TLD: ' + e.message }
          }
        }
        return { error: 'tldts module not available' }
      }

      case 'canonicalize': {
        try {
          const url = new URL(trimmed)
          // Canonicalize: lowercase, remove www, remove trailing slash, sort params
          let hostname = url.hostname.toLowerCase()
          if (hostname.startsWith('www.')) {
            hostname = hostname.substring(4)
          }
          const normalizedPath = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
          const params = new URLSearchParams(url.search)
          const sortedParams = new URLSearchParams([...params].sort())
          const canonical = `${url.protocol}//${hostname}${url.port ? ':' + url.port : ''}${normalizedPath}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}${url.hash}`
          return {
            original: trimmed,
            canonical,
          }
        } catch (e) {
          return { error: 'Failed to canonicalize: ' + e.message }
        }
      }

      case 'remove-tracking': {
        try {
          const url = new URL(trimmed)
          const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'fbclid', 'gclid', 'mc_eid', 'msclkid'
          ]

          trackingParams.forEach(param => {
            url.searchParams.delete(param)
          })

          return {
            original: trimmed,
            cleaned: url.toString(),
            removedParams: trackingParams.filter(param =>
              new URL(trimmed).searchParams.has(param)
            ),
          }
        } catch (e) {
          return { error: 'Failed to remove tracking params: ' + e.message }
        }
      }

      case 'punycode-encode': {
        if (punycodeModule) {
          try {
            const url = new URL(trimmed)
            const encoded = punycodeModule.toASCII(url.hostname)
            return {
              original: trimmed,
              hostname: url.hostname,
              punycodeEncoded: encoded,
              fullUrl: trimmed.replace(url.hostname, encoded),
            }
          } catch (e) {
            return { error: 'Failed to encode punycode: ' + e.message }
          }
        }
        return { error: 'punycode module not available' }
      }

      case 'punycode-decode': {
        if (punycodeModule) {
          try {
            const url = new URL(trimmed)
            const decoded = punycodeModule.toUnicode(url.hostname)
            return {
              original: trimmed,
              hostname: url.hostname,
              punycodeDecoded: decoded,
              fullUrl: trimmed.replace(url.hostname, decoded),
            }
          } catch (e) {
            return { error: 'Failed to decode punycode: ' + e.message }
          }
        }
        return { error: 'punycode module not available' }
      }

      default:
        return urlParser(trimmed)
    }
  } catch (error) {
    return { error: 'Invalid URL format: ' + error.message }
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
  return text.replace(/ /g, '·').replace(/\t/g, '���').replace(/\n/g, '↵\n')
}

function asciiUnicodeConverter(text, config) {
  const mode = config.mode || 'toCode'

  if (mode === 'toCode') {
    const breakdown = text.split('').map(c => ({ char: c, code: c.charCodeAt(0) }))
    const fullOutput = breakdown.map(item => item.code).join(', ')
    return {
      mode: 'toCode',
      fullOutput,
      breakdown,
      original: text
    }
  } else {
    try {
      const codes = text.match(/\d+/g) || []
      const result = codes.map(c => String.fromCharCode(parseInt(c))).join('')
      const breakdown = codes.map((code, idx) => ({
        code: parseInt(code),
        char: String.fromCharCode(parseInt(code))
      }))
      return {
        mode: 'toText',
        fullOutput: result,
        breakdown,
        original: text
      }
    } catch (e) {
      return { error: 'Invalid codes' }
    }
  }
}

function caesarCipher(text, config = {}) {
  if (!text || !text.trim()) {
    return {
      error: 'No input provided',
      output: '',
      mode: config.mode || 'auto',
    }
  }

  const rot13Mode = config.rot13Mode || false
  const preserveCase = config.preserveCase !== false
  const shiftLettersOnly = config.shiftLettersOnly !== false
  const showBruteForce = config.showBruteForce || false
  let mode = config.mode || 'auto'
  let shift = parseInt(config.shift) || 3

  // ROT13 mode overrides shift
  if (rot13Mode) {
    shift = 13
  }

  // Auto-detect mode: check if text looks like it's already encoded
  if (mode === 'auto') {
    mode = detectCaesarMode(text)
  }

  // Decode mode reverses the shift
  if (mode === 'decode') {
    shift = -shift
  }

  // Normalize shift to 0-25 range
  shift = ((shift % 26) + 26) % 26

  // Apply cipher to text
  const output = shiftText(text, shift, preserveCase, shiftLettersOnly)

  // Calculate metadata
  const inputLength = text.length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length

  // Brute force: generate all 26 possible shifts
  let bruteForce = null
  if (showBruteForce) {
    bruteForce = {}
    for (let s = 0; s < 26; s++) {
      bruteForce[s] = shiftText(text, s, preserveCase, shiftLettersOnly)
    }
  }

  return {
    output,
    input: text,
    mode: mode === 'decode' ? 'Decode' : 'Encode',
    detectedMode: mode,
    shift: rot13Mode ? '13 (ROT13)' : shift,
    preserveCase,
    shiftLettersOnly,
    rot13Used: rot13Mode,
    metadata: {
      'Mode': mode === 'decode' ? 'Decode' : 'Encode',
      'Shift': rot13Mode ? '13 (ROT13)' : shift.toString(),
      'Input Length': `${inputLength} character${inputLength !== 1 ? 's' : ''}`,
      'Letter Count': `${letterCount} letter${letterCount !== 1 ? 's' : ''}`,
      'Preserve Case': preserveCase ? 'Yes' : 'No',
      'Shift Letters Only': shiftLettersOnly ? 'Yes' : 'No',
      'Non-Letter Characters': shiftLettersOnly ? 'Preserved' : 'Shifted',
    },
    bruteForce,
  }
}

function detectCaesarMode(text) {
  // Very simple heuristic: if text looks like normal English, assume it's encoded
  const words = text.toLowerCase().split(/\s+/)
  const commonWords = ['the', 'and', 'or', 'is', 'a', 'an', 'in', 'on', 'at', 'to', 'for']
  const matchCount = words.filter(w => commonWords.includes(w)).length

  // If we find common English words, assume it's already in plaintext (encode mode)
  // Otherwise assume it's encoded (decode mode)
  return matchCount > text.split(/\s+/).length * 0.15 ? 'encode' : 'decode'
}

function shiftText(text, shift, preserveCase = true, shiftLettersOnly = true) {
  if (shiftLettersOnly) {
    // Only shift letters, preserve everything else
    return text.replace(/[a-zA-Z]/g, c => {
      const isUpperCase = c === c.toUpperCase()
      const base = isUpperCase ? 65 : 97
      const charCode = c.charCodeAt(0) - base
      const shiftedCode = (charCode + shift + 26) % 26
      return String.fromCharCode(shiftedCode + base)
    })
  } else {
    // Shift all printable ASCII characters
    return text.replace(/[!-~]/g, c => {
      const charCode = c.charCodeAt(0)
      const min = 33 // !
      const max = 126 // ~
      const range = max - min + 1
      const normalized = charCode - min
      const shiftedCode = (normalized + shift + range * 26) % range
      return String.fromCharCode(shiftedCode + min)
    })
  }
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

// JSON formatter has been extracted to lib/tools/jsonFormatter.js

function imageToBase64(imageData) {
  if (!imageData) {
    return { error: 'Please upload an image to convert. Click the image upload area above to select an image.' }
  }
  return { message: 'Image Base64 preview', length: imageData.length, base64: imageData.substring(0, 100) + '...' }
}

function svgOptimizer(text) {
  return text.replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/<!--.*?-->/g, '').trim()
}

function levenshteinDistance(a, b) {
  const aLen = a.length
  const bLen = b.length
  const matrix = Array(bLen + 1).fill(null).map(() => Array(aLen + 1).fill(0))

  for (let i = 0; i <= aLen; i++) matrix[0][i] = i
  for (let j = 0; j <= bLen; j++) matrix[j][0] = j

  for (let j = 1; j <= bLen; j++) {
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }

  return matrix[bLen][aLen]
}

const unitsByType = {
  length: ['meter', 'metres', 'metre', 'kilometer', 'kilometres', 'kilometre', 'centimeter', 'centimetres', 'centimetre', 'millimeter', 'millimetres', 'millimetre', 'micrometer', 'micrometers', 'nanometer', 'nanometers', 'nautical', 'km', 'cm', 'mm', 'µm', 'nm', 'ft', 'feet', 'foot', 'mi', 'mile', 'miles', 'yd', 'yard', 'yards', 'in', 'inch', 'inches', 'nmi'],
  weight: ['kilogram', 'kilograms', 'milligram', 'milligrams', 'gram', 'grams', 'pound', 'pounds', 'ounce', 'ounces', 'ton', 'tonne', 'tonnes', 'stone', 'carat', 'grain', 'grains', 'kg', 'g', 'mg', 'lb', 'lbs', 'oz', 'st', 't'],
  temperature: ['celsius', 'fahrenheit', 'kelvin', 'centigrade', 'c', 'f', 'k'],
  speed: ['knot', 'knots', 'm/s', 'ms', 'kmh', 'km/h', 'mph', 'm/hr', 'kph'],
  volume: ['litre', 'litres', 'liter', 'liters', 'milliliter', 'millilitres', 'gallon', 'gallons', 'cup', 'cups', 'pint', 'pints', 'fluid', 'ounce', 'l', 'ml', 'gal'],
  pressure: ['pascal', 'pascals', 'bar', 'bars', 'pound', 'atmosphere', 'atmospheres', 'torr', 'mmhg', 'millibar', 'millibars', 'psi', 'pa', 'atm', 'mbar'],
  energy: ['joule', 'joules', 'calorie', 'calories', 'kilocalorie', 'kilocalories', 'british', 'thermal', 'unit', 'watt', 'watts', 'kilowatt', 'kilowatts', 'horsepower', 'erg', 'ergs', 'btu', 'btus', 'kcal', 'kw', 'kj', 'kwh', 'wh', 'hp', 'j', 'cal'],
  time: ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'sec', 'min', 'hr', 'h'],
  data: ['byte', 'bytes', 'kilobyte', 'kilobytes', 'megabyte', 'megabytes', 'gigabyte', 'gigabytes', 'terabyte', 'terabytes', 'petabyte', 'petabytes', 'bit', 'bits', 'b', 'kb', 'mb', 'gb', 'tb', 'pb', 'kib', 'mib', 'gib', 'tib']
}

const unitNameToAbbr = {
  meter: 'm', metre: 'm', meters: 'm', metres: 'm',
  kilometer: 'km', kilometre: 'km', kilometers: 'km', kilometres: 'km',
  centimeter: 'cm', centimetre: 'cm', centimeters: 'cm', centimetres: 'cm',
  millimeter: 'mm', millimetre: 'mm', millimeters: 'mm', millimetres: 'mm',
  micrometer: 'µm', micrometers: 'µm',
  nanometer: 'nm', nanometers: 'nm',
  nautical: 'nm',
  feet: 'ft', foot: 'ft',
  mile: 'mi', miles: 'mi',
  yard: 'yd', yards: 'yd',
  inch: 'in', inches: 'in',
  kilogram: 'kg', kilograms: 'kg',
  milligram: 'mg', milligrams: 'mg',
  gram: 'g', grams: 'g',
  pound: 'lb', pounds: 'lb', lbs: 'lb',
  ounce: 'oz', ounces: 'oz',
  stone: 'st',
  ton: 'ton',
  tonne: 't', tonnes: 't',
  celsius: 'C', centigrade: 'C',
  fahrenheit: 'F',
  kelvin: 'K',
  liter: 'L', litre: 'L', liters: 'L', litres: 'L',
  milliliter: 'ml', millilitre: 'ml', milliliters: 'ml', millilitres: 'ml',
  gallon: 'gal', gallons: 'gal',
  cup: 'cup', cups: 'cup',
  pint: 'pint', pints: 'pint',
  'fluid ounce': 'fl-oz', 'fluid ounces': 'fl-oz',
  knot: 'knot', knots: 'knot',
  pascal: 'pa', pascals: 'pa',
  bar: 'bar', bars: 'bar',
  atmosphere: 'atm', atmospheres: 'atm',
  joule: 'J', joules: 'J',
  calorie: 'cal', calories: 'cal',
  kilocalorie: 'kcal', kilocalories: 'kcal',
  second: 's', seconds: 's', sec: 's',
  minute: 'min', minutes: 'min',
  hour: 'h', hours: 'h', hr: 'h',
  day: 'day', days: 'day',
  week: 'week', weeks: 'week',
  month: 'month', months: 'month',
  year: 'year', years: 'year',
  byte: 'B', bytes: 'B',
  kilobyte: 'KB', kilobytes: 'KB',
  megabyte: 'MB', megabytes: 'MB',
  gigabyte: 'GB', gigabytes: 'GB',
  terabyte: 'TB', terabytes: 'TB',
  petabyte: 'PB', petabytes: 'PB',
  bit: 'b', bits: 'b',
}

function fuzzyMatchUnitType(text, maxDistance = 2) {
  const lowerText = text.toLowerCase()
  let tokens = lowerText.split(/[\s\/\-]+/).filter(t => t.length > 0)

  // Also try extracting unit from "50grams" style (number + unit without space)
  const numberMatch = lowerText.match(/^\d+(?:\.\d+)?\s*(.+)$/)
  if (numberMatch) {
    const unitPart = numberMatch[1].toLowerCase()
    tokens = [...tokens, unitPart]
  }

  // First, try to find exact matches and handle plurals
  for (let token of tokens) {
    for (const [type, units] of Object.entries(unitsByType)) {
      if (units.includes(token)) {
        return type
      }
    }

    // Try removing trailing 's' for plurals
    if (token.endsWith('s') && token.length > 2) {
      const singular = token.slice(0, -1)
      for (const [type, units] of Object.entries(unitsByType)) {
        if (units.includes(singular)) {
          return type
        }
      }
    }
  }

  // If no exact match, try fuzzy matching
  let bestMatch = { type: null, distance: maxDistance + 1 }

  for (let token of tokens) {
    if (token.length < 2) continue

    // Also try singular form for fuzzy matching
    const tokensToMatch = token.endsWith('s') && token.length > 2
      ? [token, token.slice(0, -1)]
      : [token]

    for (const currentToken of tokensToMatch) {
      for (const [type, units] of Object.entries(unitsByType)) {
        for (const unit of units) {
          if (unit.length < 2) continue

          const distance = levenshteinDistance(currentToken, unit)

          if (distance <= maxDistance && distance > 0) {
            const lenDiff = Math.abs(currentToken.length - unit.length)
            const score = distance + (lenDiff * 0.1)

            if (score < bestMatch.distance) {
              bestMatch = { type, distance: score }
            }
          }
        }
      }
    }
  }

  return bestMatch.type
}

function detectUnitFromText(text, type) {
  const lowerText = text.toLowerCase()
  let tokens = lowerText.split(/[\s\/\-]+/).filter(t => t.length > 0)

  // Also try extracting unit from "50grams" style (number + unit without space)
  const numberMatch = lowerText.match(/^\d+(?:\.\d+)?\s*(.+)$/)
  if (numberMatch) {
    const unitPart = numberMatch[1].toLowerCase()
    tokens = [...tokens, unitPart]
  }

  // Actual unit abbreviations from conversions (normalized to lowercase for matching)
  const unitAbbreviations = {
    length: ['m', 'km', 'ft', 'mi', 'cm', 'mm', 'yd', 'in', 'nm', 'µm'],
    weight: ['kg', 'lb', 'oz', 'g', 'mg', 'ton', 'st', 't'],
    temperature: ['c', 'f', 'k'],
    speed: ['ms', 'kmh', 'mph', 'knot'],
    volume: ['l', 'ml', 'gal', 'cup', 'pint', 'fl-oz'],
    pressure: ['bar', 'psi', 'pa', 'atm', 'torr'],
    energy: ['j', 'cal', 'kj', 'kwh', 'btu', 'erg', 'wh'],
    time: ['s', 'min', 'h', 'day', 'week', 'month', 'year'],
    data: ['b', 'kb', 'mb', 'gb', 'tb', 'pb']
  }

  const actualUnitKeys = {
    length: { m: 'm', km: 'km', ft: 'ft', mi: 'mi', cm: 'cm', mm: 'mm', yd: 'yd', in: 'in', nm: 'nm', µm: 'µm' },
    weight: { kg: 'kg', lb: 'lb', oz: 'oz', g: 'g', mg: 'mg', ton: 'ton', st: 'st', t: 't' },
    temperature: { c: 'C', f: 'F', k: 'K' },
    speed: { ms: 'ms', kmh: 'kmh', mph: 'mph', knot: 'knot' },
    volume: { l: 'L', ml: 'ml', gal: 'gal', cup: 'cup', pint: 'pint', 'fl-oz': 'fl-oz' },
    pressure: { bar: 'bar', psi: 'psi', pa: 'pa', atm: 'atm', torr: 'torr' },
    energy: { j: 'J', cal: 'cal', kj: 'kJ', kwh: 'kWh', btu: 'BTU', erg: 'erg', wh: 'Wh' },
    time: { s: 's', min: 'min', h: 'h', day: 'day', week: 'week', month: 'month', year: 'year' },
    data: { b: 'b', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB', pb: 'PB' }
  }

  const typeUnits = actualUnitKeys[type]
  if (!typeUnits) return null

  // Try exact matches first
  for (let token of tokens) {
    if (typeUnits[token]) return typeUnits[token]

    // Try removing trailing 's' for plurals
    if (token.endsWith('s') && token.length > 2) {
      const singular = token.slice(0, -1)
      if (typeUnits[singular]) return typeUnits[singular]
    }
  }

  // Try unit name to abbreviation mapping
  for (let token of tokens) {
    let match = unitNameToAbbr[token]

    // Try removing trailing 's' for plural form lookup
    if (!match && token.endsWith('s') && token.length > 2) {
      match = unitNameToAbbr[token.slice(0, -1)]
    }

    if (match) {
      const lowerAbbr = match.toLowerCase()
      if (typeUnits[lowerAbbr]) return typeUnits[lowerAbbr]
    }
  }

  // Fuzzy match token against unit abbreviations
  const abbrs = unitAbbreviations[type]
  if (abbrs) {
    let bestMatch = { unit: null, distance: 3 }

    for (let token of tokens) {
      if (token.length < 2) continue

      // Also try singular form for fuzzy matching
      const tokensToMatch = token.endsWith('s') && token.length > 2
        ? [token, token.slice(0, -1)]
        : [token]

      for (const currentToken of tokensToMatch) {
        for (const unitAbbr of abbrs) {
          const distance = levenshteinDistance(currentToken, unitAbbr)
          if (distance <= 2 && distance < bestMatch.distance) {
            bestMatch = { unit: unitAbbr, distance }
          }
        }
      }
    }

    if (bestMatch.unit) return typeUnits[bestMatch.unit]
  }

  return null
}

function detectUnitType(text) {
  const lowerText = text.toLowerCase()

  const unitPatterns = {
    length: /\b(meter|metres?|kilometer|kilometres?|centimeter|centimetres?|millimeter|millimetres?|micrometers?|nanometers?|nautical\s+mile|km|cm|mm|µm|nm|ft|feet|foot|mi|mile|miles|yd|yard|yards|in|inch|inches|nmi)\b|\b(kilometers?|metres?|feet|miles|yards|inches)\s+per\b/i,
    weight: /\b(kilogram|kilograms|milligram|milligrams|gram|grams|pound|pounds|ounce|ounces|ton|tonnes?|stone|carat|grain|grains|kg|g|mg|lb|lbs|oz|st|t)\b|\b(pounds?|ounces?|kilograms?)\s+per\b/i,
    temperature: /\b(celsius|fahrenheit|kelvin|centigrade|°C|°F|°K|°|c|f|k)\b/i,
    speed: /\b(meters?\s*per\s*second|kilometres?\s*per\s*hour|miles?\s*per\s*hour|kilometers?\s*per\s*hour|knots?|m\/s|m\s*\/\s*s|km\/h|km\s*\/\s*h|kmh|mph|m\/hr|kph|knot|knots|ms)\b/i,
    volume: /\b(litre|litres?|liter|liters?|milliliter|millilitres?|gallon|gallons?|cup|cups|pint|pints?|fluid\s*ounce|fluid\s*ounces?|fl\.?\s*oz|floz|l|ml|gal)\b/i,
    pressure: /\b(pascal|pascals?|bar|bars|pound\s+per\s+square\s+inch|atmospheres?|torr|mmhg|millibar|millibars|psi|pa|atm|mbar)\b/i,
    energy: /\b(joule|joules?|calorie|calories?|kilocalorie|kilocalories?|british\s+thermal\s+unit|watt|watts?|kilowatt|kilowatts?|horsepower|horsepower|erg|ergs?|btu|btus|kcal|kw|kj|kwh|wh|hp|j|cal)\b/i,
    time: /\b(second|seconds?|minute|minutes?|hour|hours?|day|days?|week|weeks?|month|months?|year|years?|sec|min|hr|h)\b/i,
    data: /\b(byte|bytes?|kilobyte|kilobytes?|megabyte|megabytes?|gigabyte|gigabytes?|terabyte|terabytes?|petabyte|petabytes?|bit|bits?|b|kb|mb|gb|tb|pb|kib|mib|gib|tib)\b/i
  }

  for (const [type, pattern] of Object.entries(unitPatterns)) {
    if (pattern.test(lowerText)) {
      return type
    }
  }

  const fuzzyMatch = fuzzyMatchUnitType(lowerText)
  if (fuzzyMatch) {
    return fuzzyMatch
  }

  return 'length'
}

const abbrvToFullName = {
  m: 'meter', km: 'kilometer', ft: 'feet', mi: 'mile', cm: 'centimeter', mm: 'millimeter', yd: 'yard', in: 'inch', nm: 'nanometer', µm: 'micrometer',
  kg: 'kilogram', lb: 'pound', oz: 'ounce', g: 'gram', mg: 'milligram', ton: 'ton', st: 'stone', t: 'metric ton',
  C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin',
  ms: 'meter per second', kmh: 'kilometer per hour', mph: 'mile per hour', knot: 'knot',
  L: 'liter', ml: 'milliliter', gal: 'gallon', cup: 'cup', pint: 'pint', 'fl-oz': 'fluid ounce',
  bar: 'bar', psi: 'PSI', pa: 'pascal', atm: 'atmosphere', torr: 'torr',
  J: 'joule', cal: 'calorie', kJ: 'kilojoule', kWh: 'kilowatt-hour', BTU: 'BTU', erg: 'erg', Wh: 'watt-hour',
  s: 'second', min: 'minute', h: 'hour', day: 'day', week: 'week', month: 'month', year: 'year',
  b: 'bit', B: 'byte', KB: 'kilobyte', MB: 'megabyte', GB: 'gigabyte', TB: 'terabyte', PB: 'petabyte'
}

function pluralizeUnitName(unitName, value) {
  const irregularPlurals = {
    'feet': 'feet',
    'metric ton': 'metric tons',
    'stone': 'stones',
    'ounce': 'ounces',
    'fluid ounce': 'fluid ounces',
  }

  if (value === 1 || value === 1.0) {
    return unitName
  }

  if (irregularPlurals[unitName]) {
    return irregularPlurals[unitName]
  }

  if (unitName.endsWith('y')) {
    return unitName.slice(0, -1) + 'ies'
  }

  return unitName + 's'
}

function unitConverterTool(inputText, config = {}) {
  const rawInput = (inputText || '').trim()

  // 1. Empty input ��� silently return nothing
  if (!rawInput) {
    return {
      toolId: 'unit-converter',
      type: 'unit-converter',
      status: 'empty',
      rawInput
    }
  }

  let value, rawUnit

  // 2. Extract number + unit
  try {
    const result = extractValueAndUnit(rawInput)
    value = result.value
    rawUnit = result.rawUnit
  } catch {
    // This is a partial typing state, NOT an error
    return {
      toolId: 'unit-converter',
      type: 'unit-converter',
      status: 'incomplete-number-or-unit',
      rawInput,
      error: 'Invalid input format. Please enter a number followed by a unit (e.g., "100 kg", "5 miles", "72 F")'
    }
  }

  const normalizedUnit = normalizeUnit(rawUnit)

  // 3. If unit isn't recognized yet → wait for more typing
  if (!UNIT_CATEGORY[normalizedUnit]) {
    return {
      toolId: 'unit-converter',
      type: 'unit-converter',
      status: 'unknown-unit',
      rawInput,
      partialUnit: normalizedUnit,
      error: `Unknown unit: "${normalizedUnit}". Supported categories: length, mass, temperature, volume`
    }
  }

  // 4. Fully recognized → now do actual conversion
  const category = UNIT_CATEGORY[normalizedUnit]

  // Map normalized unit to mathjs unit name
  const mathjsUnit = UNIT_TO_MATHJS[normalizedUnit]
  if (!mathjsUnit) {
    return {
      toolId: 'unit-converter',
      type: 'unit-converter',
      status: 'parse-failed',
      rawInput,
      error: `Unable to parse unit: "${normalizedUnit}". Please check your input.`
    }
  }

  let base
  try {
    base = mathUnit(`${value} ${mathjsUnit}`)
  } catch {
    // Should never happen unless malformed
    return {
      toolId: 'unit-converter',
      type: 'unit-converter',
      status: 'parse-failed',
      rawInput,
      error: `Invalid unit conversion: "${rawInput}". Please check the format.`
    }
  }

  // 5. Convert to all compatible units
  const targetUnits = CATEGORY_UNITS[category] || []
  const conversions = targetUnits.map(unitName => {
    try {
      const mathjsTargetUnit = UNIT_TO_MATHJS[unitName]
      if (!mathjsTargetUnit) return null

      const converted = base.to(mathjsTargetUnit)
      const numeric = converted.toNumber()
      return {
        unit: unitName,
        value: numeric,
        human: humanizeUnit(numeric, unitName)
      }
    } catch {
      return null
    }
  }).filter(Boolean)

  return {
    toolId: 'unit-converter',
    type: 'unit-converter',
    status: 'ok',
    rawInput,
    normalizedInput: {
      value,
      unit: normalizedUnit,
      human: humanizeUnit(value, normalizedUnit)
    },
    category,
    conversions
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

function mathEvaluator(text) {
  try {
    const safe = text.replace(/[^0-9+\-*/().\s]/g, '')
    const result = Function('"use strict"; return (' + safe + ')')()
    return { expression: text, result }
  } catch (e) {
    return { error: 'Invalid expression' }
  }
}


function cronTester(text, config = {}) {
  if (!text || !text.trim()) {
    return {
      error: 'No cron expression provided',
      output: '',
    }
  }

  try {
    // Import croner and cronstrue
    const { Cron } = require('croner')
    const cronstrue = require('cronstrue')

    const cronExpression = text.trim()
    const tzConfig = config.timezone || 'system'
    const runsToLoad = config.runsToLoad || 5

    // Determine which timezone to use
    let timezone = tzConfig === 'system' ? undefined : tzConfig
    let tzDisplay = tzConfig === 'system' ? 'System Default' : tzConfig

    // Validate cron expression using croner
    let isValid = false
    let validationError = null
    let nextRuns = []
    let humanReadable = ''

    try {
      // Create a cron job with timezone if specified
      const cronOptions = { paused: true }
      if (timezone) {
        cronOptions.timezone = timezone
      }
      const job = new Cron(cronExpression, cronOptions)
      isValid = true

      // Get scheduled runs
      nextRuns = job.nextRuns(runsToLoad).map(date => {
        const formatted = timezone
          ? date.toLocaleString('en-US', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          : date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })

        return {
          datetime: date.toISOString(),
          formatted: formatted,
        }
      })

      // Get human-readable description using cronstrue
      try {
        humanReadable = cronstrue.toString(cronExpression, { verbose: true })
      } catch (e) {
        humanReadable = 'Unable to parse human-readable format'
      }

      return {
        output: cronExpression,
        valid: true,
        isValid: true,
        cronExpression,
        humanReadable,
        nextRuns,
        nextRunCount: runsToLoad,
        timezone: tzDisplay,
        metadata: {
          'Status': 'Valid',
          'Expression': cronExpression,
          'Description': humanReadable,
          'Timezone': tzDisplay,
          'Next Run Count': runsToLoad.toString(),
        },
      }
    } catch (err) {
      validationError = err.message || 'Invalid cron expression'
      return {
        error: `Invalid cron expression: ${validationError}`,
        output: cronExpression,
        valid: false,
        isValid: false,
        cronExpression,
        humanReadable: null,
        nextRuns: [],
        timezone: tzDisplay,
      }
    }
  } catch (err) {
    return {
      error: `Error processing cron expression: ${err.message}`,
      output: text,
    }
  }
}

function fileSizeConverter(text, config) {
  const value = parseFloat(text)
  if (isNaN(value)) return { error: 'Invalid number' }
  const units = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 }
  const bytes = value * (units[config.fromUnit] || 1)
  const result = bytes / (units[config.toUnit] || 1)
  return { value, fromUnit: config.fromUnit, toUnit: config.toUnit, result: result.toFixed(2) }
}

// JavaScript formatter has been extracted to lib/tools/jsFormatter.js

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

function detectSqlDialect(sql) {
  if (!sql || typeof sql !== 'string') return 'postgresql'

  const lowerSql = sql.toLowerCase()

  // PostgreSQL specific
  if (/\bPLPGSQL\b|\b::|\bCREATE\s+FUNCTION.*RETURNS|\bPG_|postgres/i.test(sql)) {
    return 'postgresql'
  }

  // MySQL specific
  if (/\bBACKTICK\b|`.*`|LIMIT.*OFFSET|BINARY|AUTO_INCREMENT|mysql_/i.test(sql)) {
    return 'mysql'
  }

  // SQL Server specific
  if (/\[\w+\]|GO\b|EXEC\b|CONVERT\(|SQL_VARIANT|TSQL/i.test(sql)) {
    return 'tsql'
  }

  // SQLite specific
  if (/\bROWID\b|AUTOINCREMENT|PRAGMA|sqlite_/i.test(sql)) {
    return 'sqlite'
  }

  // Oracle specific
  if (/\bSYSDOCK\b|GRANT\s+.*\s+ON\s+SCHEMA|PLSQL|BEGIN.*EXCEPTION/i.test(sql)) {
    return 'plsql'
  }

  // BigQuery specific
  if (/`[\w-]+\.[\w-]+\.[\w-]+`|@|\bBYTES\b|STRUCT</i.test(sql)) {
    return 'bigquery'
  }

  // Default to PostgreSQL
  return 'postgresql'
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

function isXmlFormat(str) {
  if (!str || typeof str !== 'string') return false
  str = str.trim()
  return /^<[?!]?[\w]/.test(str) && str.includes('>')
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
      return mode === 'escape'
        ? 'The API response contains: {"status": "success", "message": "User created"}'
        : 'The API response contains: {\"status\": \"success\", \"message\": \"User created\"}'
    }
    case 'base64-converter': {
      const mode = config.mode || 'encode'
      return mode === 'encode'
        ? 'The quick brown fox jumps over the lazy dog'
        : 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw=='
    }
    case 'csv-json-converter':
      return 'id,name,email,department,salary\n1,Alice Johnson,alice@example.com,Engineering,95000\n2,Bob Smith,bob@example.com,Marketing,75000\n3,Carol White,carol@example.com,Sales,80000'
    case 'timestamp-converter':
      return '1704067200'
    case 'json-formatter':
      return '{"user":{"id":1,"name":"John Doe","email":"john@example.com","roles":["admin","user"],"active":true,"metadata":{"lastLogin":"2024-01-01T12:00:00Z","loginCount":42}},"status":"success"}'
    case 'css-formatter':
      return 'body{margin:0;padding:0;font-family:Arial,sans-serif}.header{background-color:#333;color:white;padding:20px}.container{max-width:1200px;margin:0 auto;padding:20px}.button{background-color:#0066cc;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer}'
    case 'xml-formatter':
      return '<root><users><user id="1"><name>John Doe</name><email>john@example.com</email><department>Engineering</department><active>true</active></user><user id="2"><name>Jane Smith</name><email>jane@example.com</email><department>Marketing</department><active>true</active></user></users></root>'
    case 'js-formatter':
      return 'const fetchUserData=(userId,options={})=>{const{includeProfile=true,timeout=5000}=options;return fetch(`/api/users/${userId}`,{method:"GET",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(timeout)}).then(r=>r.json()).then(data=>includeProfile?{...data,profile:getUserProfile(data.id)}:data)}'
    case 'color-converter':
      return '#FF5733'
    case 'regex-tester':
      return 'Contact us at support@example.com or sales@example.com. You can also reach us at info@example.org'
    case 'yaml-formatter':
      return 'app:\n  name: My Application\n  version: 1.0.0\nserver:\n  host: localhost\n  port: 3000\n  environment: development\ndatabase:\n  url: postgresql://user:password@localhost:5432/myapp\n  maxConnections: 20\nlogging:\n  level: debug\n  format: json'
    case 'url-toolkit':
      return 'https://www.example.com:8443/api/v1/users?id=123&filter=active&sort=name#results'
    case 'jwt-decoder':
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjcwMDAwMDAwLCJleHAiOjE2NzAwMDM2MDB9.gaj_JGj4_I8xhHhVwjO2f9Y0xQzN4T0P8DhP3QrZY_A'
    case 'checksum-calculator':
      return 'Hello, World!'
    case 'ascii-unicode-converter':
      return 'Hello, World! ✨'
    case 'timezone-converter':
      return '2024-01-15 14:30:00'
    case 'base-converter':
      return '255'
    case 'math-evaluator':
      return '(25 + 15) * 2 - 10 / 2 + sqrt(16)'
    case 'cron-tester':
      return '0 9 * * MON-FRI'
    case 'file-size-converter':
      return '5368709120'
    case 'email-validator':
      return 'john.doe+tag@example.co.uk'
    case 'caesar-cipher':
      return 'The quick brown fox jumps over the lazy dog'
    case 'text-toolkit':
      return 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. It is commonly used for testing fonts and keyboard layouts.'
    case 'ip-address-toolkit':
      return '192.168.1.100'
    case 'http-status-lookup':
      return '404'
    case 'mime-type-lookup':
      return 'pdf'
    case 'number-formatter':
      return '1234567.89'
    case 'sql-formatter':
      return 'SELECT u.id, u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = true AND u.created_at > \'2024-01-01\' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC'
    case 'svg-optimizer':
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#FF5733" stroke="#333" stroke-width="2" rx="5"/><circle cx="50" cy="50" r="30" fill="#FFFFFF" opacity="0.8"/><text x="50" y="55" font-size="20" text-anchor="middle">SVG</text></svg>'
    case 'uuid-validator':
      return '550e8400-e29b-41d4-a716-446655440000'
    case 'markdown-html-formatter':
      return '# Getting Started\n\nWelcome to our platform. This guide will help you get up and running in minutes.\n\n## Installation\n\n```bash\nnpm install example-package\n```\n\n## Usage\n\nHere\'s a **simple example** of how to use this:\n\n- Create a new instance\n- Configure settings\n- Run your code\n\n## Learn More\n\nVisit our [documentation](https://example.com/docs) for more details.'
    case 'http-header-parser':
      return 'HTTP/1.1 200 OK\nContent-Type: application/json; charset=utf-8\nContent-Length: 348\nConnection: keep-alive\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature\nX-Custom-Header: custom-value\nCache-Control: max-age=3600, public'
    case 'punycode-converter':
      return 'münchen.de'
    case 'unit-converter':
      return '100 kg'
    default:
      return null
  }
}
