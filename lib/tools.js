let yamlModule = null
import { emailValidator as validateEmail } from './emailValidator.js'
import { REGEX_PATTERN_TEMPLATES } from './regexPatterns.js'
import { httpStatusLookup } from './tools/httpStatusLookup.js'
import { httpHeaderParser } from './tools/httpHeaderParser.js'
import { jwtDecoder as enhancedJwtDecoder, jwtDecoderWithJwks } from './tools/jwtDecoder.js'
import {
  validate as validateUUID,
  normalize as normalizeUUID,
  toHex as uuidToHex,
  toBase64 as uuidToBase64,
  toBinary as uuidToBinary,
  toUrn as uuidToUrn,
  generateV1 as generateUUIDV1,
  generateV4 as generateUUIDV4,
  generateV7 as generateUUIDV7,
  validateBulk as validateUUIDBulk,
} from './uuidValidator.js'
import {
  isValidIPv4,
  normalizeIPv4,
  parseIPv4Octets,
  ipv4ToInteger,
  integerToIPv4,
  ipv4ToHex,
  ipv4ToBinary,
  ipv4ToBinaryOctets,
  isValidIPv6,
  expandIPv6,
  compressIPv6,
  classifyIP,
  generatePTR,
  detectIPv4Errors,
  detectIPv6Errors,
  prefixToMask,
  cidrToNetmaskBinary,
  getWildcardMask,
  getNetworkAddress,
  getBroadcastAddress,
  getFirstHost,
  getLastHost,
  getTotalHosts,
  getUsableHosts,
  isNetworkAddress,
  isBroadcastAddress,
  getIPv6Hextets,
  ipv6ToBinary,
  ipv6ToBinaryDotted,
  getCIDRType,
  isSubnetOf,
  isSupernetOf,
  findCoveringSubnet,
  validateCIDRStrict,
  getIPv6NetworkAddress,
  getIPv6FirstAddress,
  getIPv6LastAddress,
  getIPv6HostCount,
  parseIPv6WithZone,
  classifyIPv6Special,
  getIPv4FromIPv6Mapped,
} from './ipUtils.js'
import { isHostname } from './ipInputDetection.js'

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
let MailChecker = null
let mathjs = null

try {
  ipaddr = require('ipaddr.js')
} catch (error) {
  // ipaddr.js not available
}

try {
  MailChecker = require('mailchecker')
} catch (error) {
  // mailchecker not available
}

let mathjsBigNumber = null
try {
  mathjs = require('mathjs')
  try {
    const { create, all } = require('mathjs')
    mathjsBigNumber = create(all)
    mathjsBigNumber.config({ number: 'BigNumber', precision: 64 })
  } catch (error) {
    // BigNumber instance not available
  }
} catch (error) {
  // mathjs not available
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

// =============== File Size Converter Helpers ===============
const FILE_SIZE_UNITS = ['b', 'kb', 'mb', 'gb', 'tb', 'pb']

const FILE_SIZE_UNIT_ALIASES = {
  byte: 'b',
  bytes: 'b',
  b: 'b',
  kilobyte: 'kb',
  kilobytes: 'kb',
  kb: 'kb',
  megabyte: 'mb',
  megabytes: 'mb',
  mb: 'mb',
  gigabyte: 'gb',
  gigabytes: 'gb',
  gb: 'gb',
  terabyte: 'tb',
  terabytes: 'tb',
  tb: 'tb',
  petabyte: 'pb',
  petabytes: 'pb',
  pb: 'pb',
}

const FILE_SIZE_HUMAN_NAMES = {
  b: { singular: 'Byte', plural: 'Bytes' },
  kb: { singular: 'Kilobyte', plural: 'Kilobytes' },
  mb: { singular: 'Megabyte', plural: 'Megabytes' },
  gb: { singular: 'Gigabyte', plural: 'Gigabytes' },
  tb: { singular: 'Terabyte', plural: 'Terabytes' },
  pb: { singular: 'Petabyte', plural: 'Petabytes' },
}

const FILE_SIZE_MULTIPLIERS = {
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
  pb: 1024 ** 5,
}

function extractFileSizeValueAndUnit(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Input must be a number with a file size unit (e.g., "100 MB", "5 GB")')
  }

  const cleaned = raw.trim().toLowerCase()
  const match = cleaned.match(/^([+-]?\d*\.?\d+)\s*([a-z]+)?$/i)

  if (!match) {
    throw new Error('Could not detect a number and file size unit. Try "100 MB" or "5 GB".')
  }

  const value = parseFloat(match[1].replace(',', ''))
  const unitPart = (match[2] || '').trim()

  if (!unitPart) {
    throw new Error('Missing file size unit. Try "100 MB" instead of just "100".')
  }

  return { value, rawUnit: unitPart }
}

function normalizeFileSizeUnit(rawUnit) {
  const cleaned = rawUnit.replace(/\s+/g, '').toLowerCase()
  const alias = FILE_SIZE_UNIT_ALIASES[cleaned]
  return alias || cleaned
}

function humanizeFileSize(value, unitName) {
  const meta = FILE_SIZE_HUMAN_NAMES[unitName] || {
    singular: unitName.toUpperCase(),
    plural: unitName.toUpperCase() + 's'
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
    name: 'Regex Toolkit',
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
  'csv-json-converter': {
    name: 'CSV to JSON Converter',
    description: 'Convert CSV data to JSON, SQL, JavaScript, or TypeScript formats with advanced options',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',
    example: `Name,Email,Age,Active
John Doe,john@example.com,28,true
Jane Smith,jane@example.com,34,true
Bob Johnson,bob@example.com,45,false`,

    configSchema: [
      {
        id: 'autoDetectDelimiter',
        label: 'Auto-Detect Delimiter',
        type: 'toggle',
        default: true,
      },
      {
        id: 'autoDetectHeaderRow',
        label: 'Auto-Detect Header Row',
        type: 'toggle',
        default: true,
      },
      {
        id: 'headerRowMode',
        label: 'Header Row',
        type: 'select',
        options: [
          { value: 'hasHeader', label: 'First row is a header' },
          { value: 'noHeader', label: 'First row is data (no header)' },
        ],
        default: 'hasHeader',
        visibleWhen: { field: 'autoDetectHeaderRow', value: false },
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
        visibleWhen: { field: 'autoDetectDelimiter', value: false },
      },
      {
        id: 'trimWhitespace',
        label: 'Trim Whitespace',
        type: 'toggle',
        default: true,
      },
      {
        id: 'convertNumbers',
        label: 'Convert to Numbers',
        type: 'toggle',
        default: true,
      },
      {
        id: 'convertBooleans',
        label: 'Convert to Booleans/Null',
        type: 'toggle',
        default: true,
      },
      {
        id: 'removeBlankRows',
        label: 'Remove Blank Rows',
        type: 'toggle',
        default: true,
      },
      {
        id: 'strictMode',
        label: 'Strict Mode (Block on Errors)',
        type: 'toggle',
        default: false,
      },
      {
        id: 'headerFormat',
        label: 'Header Format',
        type: 'select',
        options: [
          { value: 'original', label: 'Original' },
          { value: 'camelCase', label: 'camelCase' },
          { value: 'snake_case', label: 'snake_case' },
        ],
        default: 'original',
      },
      {
        id: 'outputFormat',
        label: 'Output Format',
        type: 'select',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'jsonl', label: 'JSONL (one per line)' },
          { value: 'sql', label: 'SQL INSERT' },
          { value: 'javascript', label: 'JavaScript Export' },
          { value: 'typescript', label: 'TypeScript Export' },
        ],
        default: 'json',
      },
    ],
    detailedDescription: {
      overview: 'The CSV to JSON Converter tool converts CSV (comma-separated values) data to JSON and other formats including SQL, JavaScript, and TypeScript. Features intelligent auto-detection for delimiters and header rows. Essential for data import/export, working with spreadsheets, and API integration.',
      howtouse: [
        'Paste your CSV data into the input field',
        'Use auto-detect toggles to automatically identify delimiters and headers',
        'Or manually choose the delimiter (comma, semicolon, or tab) when auto-detect is off',
        'Specify whether the first row is a header or data (manual mode when auto-detect is off)',
        'Configure data conversion options (trim, numbers, booleans, blank rows)',
        'Select header format (original, camelCase, or snake_case) - applies to detected or existing headers',
        'Choose output format (JSON, JSONL, SQL, JavaScript, or TypeScript)',
        'Copy and use in your applications',
      ],
      features: [
        'Convert CSV to multiple formats (JSON, JSONL, SQL, JS, TS)',
        'Auto-detect delimiter (comma, semicolon, pipe, tab)',
        'Auto-detect header row (determines if first row is headers or data)',
        'Manual header/data mode selector when auto-detect is disabled',
        'Customizable delimiters when auto-detection is disabled',
        'Automatic data type conversion (numbers, booleans, null)',
        'Whitespace trimming and blank row removal',
        'Header normalization (camelCase, snake_case)',
        'Intelligent header detection based on data type patterns',
      ],
      usecases: [
        'Importing CSV spreadsheet data with unknown formatting',
        'Generating SQL INSERT statements from CSV files',
        'Creating JavaScript/TypeScript data exports',
        'Data format conversion between CSV and JSON/YAML/SQL',
        'API data preparation and payload building',
        'Data analysis and transformation pipelines',
        'Converting spreadsheet exports with varying delimiters and header patterns',
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

    configSchema: [],
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
    description: 'Look up HTTP status codes, auto-detect from logs, and get dev guidance',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'auto', label: 'Auto detect' },
          { value: 'code', label: 'Code only' },
          { value: 'log', label: 'Analyze log' },
          { value: 'search', label: 'Search by description' },
        ],
        default: 'auto',
      },
      {
        id: 'framework',
        label: 'Code Example',
        type: 'select',
        options: [
          { value: 'node', label: 'Node/Express' },
          { value: 'nextjs', label: 'Next.js' },
          { value: 'fastapi', label: 'FastAPI' },
          { value: 'flask', label: 'Flask' },
          { value: 'go', label: 'Go' },
          { value: 'php', label: 'PHP' },
          { value: 'ruby', label: 'Ruby' },
          { value: 'nginx', label: 'Nginx' },
          { value: 'cloudflare', label: 'Cloudflare Workers' },
        ],
        default: 'node',
      },
    ],
    detailedDescription: {
      overview: 'Deterministic HTTP status code lookup with auto-detection, rich metadata, and code examples. Paste a code, log, or description to get instant guidance on status codes.',
      howtouse: [
        'Enter an HTTP status code (e.g., 404), log line, or description (e.g., "payload too large")',
        'Auto mode detects what you entered and returns relevant information',
        'View the status meaning, common causes, retryability, and code examples',
        'Switch modes to code lookup, log analysis, or text search as needed',
      ],
      features: [
        'Auto-detection: code, log line, or free-form text search',
        'Rich metadata: retryability, cacheability, common causes, dev notes',
        'Code examples for 9 frameworks: Node/Express, Next.js, FastAPI, Flask, Go, PHP, Ruby, Nginx, Cloudflare Workers',
        'Bulk support: analyze multiple codes from a single log or paste',
        'Works without AI: pure static data + deterministic logic',
      ],
      usecases: [
        'Debugging HTTP errors from logs or error messages',
        'Understanding API responses and choosing correct status codes',
        'API development reference and best practices',
        'Learning HTTP semantics and when to retry/cache',
      ],
    },
  },
  'mime-type-lookup': {
    name: 'MIME Type Lookup',
    description: 'Find MIME types, extensions, security details, and more - with multiple lookup modes',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'mode',
        label: 'Lookup Mode',
        type: 'select',
        default: 'auto',
        options: [
          { value: 'auto', label: 'Auto-detect (default)' },
          { value: 'extension', label: 'Extension → MIME' },
          { value: 'mime', label: 'MIME → Extension' },
          { value: 'filename', label: 'Filename → MIME' },
          { value: 'header', label: 'Content-Type Header' }
        ],
        description: 'Auto-detects input type (extension, MIME, filename, or header) or choose explicit mode',
      },
      {
        id: 'bulkMode',
        label: 'Bulk Mode',
        type: 'toggle',
        default: false,
        description: 'Process multiple entries (one per line). Useful for batch analysis.',
      },
      {
        id: 'ignoreInvalidLines',
        label: 'Ignore Invalid Lines',
        type: 'toggle',
        default: true,
        description: 'Skip lines that don\'t match any MIME type (bulk mode only)',
      },
    ],
    detailedDescription: {
      overview: 'Advanced MIME Type Lookup: converts between extensions, MIME types, filenames, and Content-Type headers with rich metadata. Includes security notes, category classification, binary/text detection, and compression info. Supports fuzzy matching and bulk processing.',
      howtouse: [
        'Enter a file extension (.pdf, pdf), MIME type (application/pdf), filename (report.pdf), or Content-Type header',
        'Choose mode: Auto-detect (recommended) or specify Extension/MIME/Filename/Header',
        'Optional: Enable Bulk Mode to process multiple entries at once (one per line)',
        'View extended metadata: category, binary/text, compressible, charsets, security notes, applications',
      ],
      features: [
        'Comprehensive database with 50+ MIME types and rich metadata',
        'Auto-detect mode (extension, MIME, filename, or Content-Type header)',
        'Multiple lookup modes: Extension → MIME, MIME → Extension, Filename, Header',
        'Bulk processing: paste multiple items, one per line',
        'Fuzzy matching with suggestions for typos (e.g., "jepg" → "jpeg")',
        'Security notes for each MIME type (e.g., XSS risk for HTML, macro risk for Office)',
        'Category classification (document, image, video, audio, archive, code, font)',
        'Binary vs text detection, compressibility, charset info, common applications',
        'Case normalization and smart parsing',
      ],
      usecases: [
        'API development: set Content-Type headers quickly with metadata',
        'Security review: identify executable types and their risks',
        'File upload validation with detailed MIME analysis',
        'Batch processing of file types (upload multiple files)',
        'Content negotiation and compression decisions',
        'Debugging Content-Type headers from HTTP responses',
        'Learning MIME type categories and compatibility',
      ],
      examples: [
        'Single: "pdf" → {mime: "application/pdf", category: "document", binary: true, ...}',
        'Single: "application/json" → {extensions: [".json"], category: "document", binary: false, ...}',
        'Filename: "report.final.pdf" → extracts ".pdf" and looks up',
        'Header: "Content-Type: application/json; charset=utf-8" → parses and explains',
        'Bulk: paste "pdf\\npng\\napplication/json" → table with all results',
      ],
    },
  },
  'http-header-parser': {
    name: 'HTTP Header Parser',
    description: 'Parse, validate, and analyze HTTP headers like Postman or Cloudflare',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'strictMode',
        label: 'Strict RFC Mode',
        type: 'toggle',
        default: false,
        description: 'Enable RFC 7230/7231 strict compliance. Converts warnings to errors for syntax violations and deprecated patterns.',
      },
    ],
    detailedDescription: {
      overview: 'Pro-level HTTP header analysis tool that validates, analyzes, and provides security insights for HTTP request and response headers. Similar to Postman, Cloudflare, and API Gateway dashboards.',
      howtouse: [
        'Paste HTTP headers (request or response)',
        'Headers are automatically parsed and analyzed',
        'View validation results, security warnings, and performance insights',
        'Export headers in multiple formats (canonical, cURL, JSON)',
      ],
      features: [
        'Parse request and response headers automatically',
        'RFC 7230/7231/9110 compliance validation',
        'Header validation with errors, warnings, and info',
        'Security analysis and vulnerability detection',
        'Cache behavior simulation (browser vs CDN)',
        'Heuristic freshness calculation',
        'Compression validity analysis',
        'HTTP/2 & HTTP/3 compatibility checking',
        'Performance and compression analysis',
        'JWT format detection (without decoding)',
        'Header conflict detection',
        'Missing security header warnings',
        'Multi-format export (canonical, cURL, JSON, fetch)',
        'Organized header grouping (request, response, caching, security, content)',
        'Strict RFC Mode for backend engineers',
      ],
      usecases: [
        'API debugging and troubleshooting',
        'Security header validation',
        'Performance optimization analysis',
        'CORS configuration verification',
        'Cache policy review',
        'Request/response header inspection',
      ],
    },
  },
  'uuid-validator': {
    name: 'UUID Validator',
    description: 'Validate, generate, and analyze UUIDs with full version/variant support',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        name: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'validate', label: 'Validate UUID' },
          { value: 'bulk-validate', label: 'Bulk Validate (CSV/List)' },
          { value: 'generate-v4', label: 'Generate V4 (Random)' },
          { value: 'generate-v1', label: 'Generate V1 (Time-based)' },
          { value: 'generate-v7', label: 'Generate V7 (Unix Time)' },
        ],
        default: 'validate',
      },
    ],
    detailedDescription: {
      overview: 'Professional UUID validator supporting versions 1, 3, 4, 5, and 7. Validates structure, detects common mistakes, generates UUIDs, and provides detailed metadata including variant, version, and alternative formats.',
      howtouse: [
        'Select validation or generation mode',
        'For validation: enter a UUID string (with or without hyphens)',
        'For bulk: paste CSV or newline-separated UUIDs',
        'For generation: click the mode to generate UUIDs',
      ],
      features: [
        'Validate UUID format and structure',
        'Identify UUID version (1, 3, 4, 5, 7)',
        'Detect RFC 4122 variant compliance',
        'Normalize input (auto-add hyphens, remove URN prefix)',
        'Show multiple output formats (hex, base64, binary, URN)',
        'Extract metadata (timestamp, node, clock sequence)',
        'Detect common copy/paste errors',
        'Generate UUIDs (v1, v4, v7)',
        'Bulk validation from CSV or list',
        'Copy individual formats to clipboard',
      ],
      usecases: [
        'User ID validation in applications',
        'Database record verification',
        'API request validation',
        'Batch UUID validation from datasets',
        'UUID generation for new records',
        'Debugging UUID-related issues',
        'Format conversion for different systems',
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
    description: 'Format numbers with separators, decimals, percentages, abbreviations, and more',
    category: 'text-transform',
    inputTypes: ['text'],
    outputType: 'text',

    configSchema: [
      {
        id: 'formatMode',
        label: 'Format Mode',
        type: 'select',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'percentage', label: 'Percentage (%)' },
          { value: 'abbreviation', label: 'Abbreviation (K, M, B)' },
          { value: 'scientific', label: 'Scientific Notation' },
          { value: 'engineering', label: 'Engineering Notation' },
        ],
        default: 'standard',
      },
      {
        id: 'decimals',
        label: 'Decimal Places',
        type: 'number',
        placeholder: '2',
        default: 2,
      },
      {
        id: 'thousandSeparator',
        label: 'Thousand Separator',
        type: 'select',
        options: [
          { value: ',', label: 'Comma (,)' },
          { value: '.', label: 'Period (.)' },
          { value: '_', label: 'Underscore (_)' },
          { value: ' ', label: 'Space ( )' },
          { value: '', label: 'None' },
        ],
        default: ',',
      },
      {
        id: 'decimalSeparator',
        label: 'Decimal Separator',
        type: 'select',
        options: [
          { value: '.', label: 'Period (.)' },
          { value: ',', label: 'Comma (,)' },
        ],
        default: '.',
      },
      {
        id: 'negativeStyle',
        label: 'Negative Number Style',
        type: 'select',
        options: [
          { value: 'minus', label: 'Minus (-1,234.56)' },
          { value: 'parentheses', label: 'Parentheses (1,234.56)' },
          { value: 'trailing-minus', label: 'Trailing Minus (1,234.56-)' },
        ],
        default: 'minus',
      },
      {
        id: 'roundingMode',
        label: 'Rounding Mode',
        type: 'select',
        options: [
          { value: 'half-up', label: 'Half Up (standard)' },
          { value: 'half-down', label: 'Half Down' },
          { value: 'toward-zero', label: 'Toward Zero (truncate)' },
          { value: 'away-zero', label: 'Away from Zero' },
          { value: 'banker', label: "Banker's Rounding" },
        ],
        default: 'half-up',
      },
      {
        id: 'bulkSeparator',
        label: 'Multiple Numbers Separator',
        type: 'select',
        options: [
          { value: 'newline', label: 'Newline (one per line)' },
          { value: 'line', label: 'Detect automatically' },
        ],
        default: 'newline',
      },
    ],
    detailedDescription: {
      overview: 'The Number Formatter tool provides comprehensive number formatting with support for multiple styles, separators, and modes. Perfect for financial data, scientific calculations, and international number standards.',
      howtouse: [
        'Enter a number or multiple numbers (one per line)',
        'Select format mode (standard, percentage, abbreviation, scientific, or engineering)',
        'Configure decimal places and separators',
        'Choose negative number style',
        'Select rounding mode for precision',
        'View formatted result(s)',
      ],
      features: [
        'Multiple format modes (standard, percentage, abbreviation, scientific, engineering)',
        'Custom thousand separators (comma, period, underscore, space, none)',
        'Custom decimal separators (period or comma)',
        'Negative number styles (minus, parentheses, trailing minus)',
        'Advanced rounding modes (half-up, half-down, toward zero, away from zero, banker\'s)',
        'Bulk number formatting',
        'Automatic input sanitization',
        'Humanized abbreviations (K, M, B)',
      ],
      usecases: [
        'Financial data presentation',
        'Currency formatting with locale-specific separators',
        'Statistical data display',
        'Scientific and engineering calculations',
        'Percentage calculations and display',
        'International number standards',
        'Accounting format for negative numbers',
        'Large number abbreviations for readability',
      ],
    },
  },
  'time-normalizer': {
    name: 'Time Normalizer',
    description: 'Parse, normalize, and convert dates across timezones with explicit timezone context',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'inputTimezone',
        label: 'Input Timezone',
        type: 'select',
        options: [
          { value: 'auto', label: 'Auto-detect or UTC' },
          { value: 'UTC', label: 'UTC / GMT' },
          { value: 'America/New_York', label: 'US Eastern (EST/EDT)' },
          { value: 'America/Chicago', label: 'US Central (CST/CDT)' },
          { value: 'America/Denver', label: 'US Mountain (MST/MDT)' },
          { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
          { value: 'America/Anchorage', label: 'US Alaska (AKST/AKDT)' },
          { value: 'Pacific/Honolulu', label: 'US Hawaii (HST)' },
          { value: 'Europe/London', label: 'UK (GMT/BST)' },
          { value: 'Europe/Berlin', label: 'Central Europe (CET/CEST)' },
          { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
          { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
          { value: 'Europe/Madrid', label: 'Spain (CET/CEST)' },
          { value: 'Europe/Rome', label: 'Italy (CET/CEST)' },
          { value: 'Europe/Vienna', label: 'Austria (CET/CEST)' },
          { value: 'Europe/Prague', label: 'Czech (CET/CEST)' },
          { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
          { value: 'Asia/Dubai', label: 'Dubai (GST)' },
          { value: 'Asia/Kolkata', label: 'India (IST)' },
          { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
          { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
          { value: 'Asia/Shanghai', label: 'China (CST)' },
          { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
          { value: 'Asia/Seoul', label: 'Seoul (KST)' },
          { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
          { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
          { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
          { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
          { value: 'Australia/Perth', label: 'Perth (AWST)' },
          { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
          { value: 'Pacific/Fiji', label: 'Fiji (FJT)' },
        ],
        default: 'auto',
      },
      {
        id: 'outputTimezone',
        label: 'Output Timezone',
        type: 'select',
        options: [
          { value: 'UTC', label: 'UTC / GMT' },
          { value: 'America/New_York', label: 'US Eastern (EST/EDT)' },
          { value: 'America/Chicago', label: 'US Central (CST/CDT)' },
          { value: 'America/Denver', label: 'US Mountain (MST/MDT)' },
          { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
          { value: 'America/Anchorage', label: 'US Alaska (AKST/AKDT)' },
          { value: 'Pacific/Honolulu', label: 'US Hawaii (HST)' },
          { value: 'Europe/London', label: 'UK (GMT/BST)' },
          { value: 'Europe/Berlin', label: 'Central Europe (CET/CEST)' },
          { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
          { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
          { value: 'Europe/Madrid', label: 'Spain (CET/CEST)' },
          { value: 'Europe/Rome', label: 'Italy (CET/CEST)' },
          { value: 'Europe/Vienna', label: 'Austria (CET/CEST)' },
          { value: 'Europe/Prague', label: 'Czech (CET/CEST)' },
          { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
          { value: 'Asia/Dubai', label: 'Dubai (GST)' },
          { value: 'Asia/Kolkata', label: 'India (IST)' },
          { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
          { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
          { value: 'Asia/Shanghai', label: 'China (CST)' },
          { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
          { value: 'Asia/Seoul', label: 'Seoul (KST)' },
          { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
          { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
          { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
          { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
          { value: 'Australia/Perth', label: 'Perth (AWST)' },
          { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
          { value: 'Pacific/Fiji', label: 'Fiji (FJT)' },
        ],
        default: 'UTC',
      },
    ],
    detailedDescription: {
      overview: 'The Time Normalizer tool accepts dates in any format, normalizes them, and converts them between timezones with explicit timezone context. Supports Unix timestamps (seconds/milliseconds), ISO 8601, and human-readable date strings with timezone conversion.',
      howtouse: [
        'Enter a date/time in any supported format',
        'Tool automatically detects the format',
        'Select Input Timezone (auto-detect or specific timezone)',
        'Select Output Timezone for conversion',
        'View normalized dates, timezone offsets, and day boundary shifts',
      ],
      features: [
        'Automatic format detection',
        'Unix timestamp support (seconds and milliseconds)',
        'ISO 8601 parsing',
        'Human-readable date parsing (YYYY-MM-DD HH:mm:ss)',
        'Explicit timezone context (input and output)',
        'Timezone conversion using Luxon',
        'Offset calculation for each timezone',
        'Day boundary shift detection (Yesterday, Same Day, Next Day)',
      ],
      usecases: [
        'Converting between date formats',
        'Verifying timestamp values',
        'Standardizing date representations',
        'Cross-timezone date verification',
        'Meeting scheduling across timezones',
        'Understanding date/time context with explicit timezone',
        'Debugging API responses with timezone information',
        'International business operations with DST handling',
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
    description: 'Convert between bytes, KB, MB, GB, TB, and PB file sizes. Try inputs like "100 MB", "5 GB", or "1.5 TB".',
    category: 'converter',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    detailedDescription: {
      overview: 'The File Size Converter tool converts between different file size units: bytes (B), kilobytes (KB), megabytes (MB), gigabytes (GB), terabytes (TB), and petabytes (PB). Essential for disk space management and file size estimation.',
      howtouse: [
        'Enter a file size with a unit (e.g., "100 MB", "5 GB", "1.5 TB")',
        'The converter automatically detects the unit and displays all equivalent sizes',
        'Copy any conversion result with the copy button',
      ],
      features: [
        'Auto-detects file size units from input',
        'Converts to all standard file size units',
        'Accurate binary (1024-based) conversion',
        'No configuration needed',
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
    description: 'Comprehensive email validation with disposable domain detection and reputation checking',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    detailedDescription: {
      overview: 'Advanced email validator that checks RFC-compliant syntax, detects disposable/temporary email domains, identifies suspicious providers, and flags role-based email addresses. Backed by a database of 55,000+ known throwaway domains.',
      howtouse: [
        'Enter one or more email addresses (comma or line separated)',
        'The tool performs comprehensive validation checks',
        'Review detailed results showing validation status and any issues found',
      ],
      features: [
        'RFC-like syntax validation (format, spacing, dots, etc.)',
        'Disposable email domain detection (55,000+ domains)',
        'Bad reputation provider identification',
        'Invalid domain pattern detection',
        'Role-based email detection (admin@, noreply@, etc.)',
        'Batch validation (multiple emails at once)',
        'Detailed issue reporting',
      ],
      usecases: [
        'Form validation and user registration',
        'Data quality checking for contact lists',
        'Preventing spam/throwaway email registrations',
        'Email list hygiene and cleaning',
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
    description: 'Validate, convert, analyze IPv4/IPv6, IP ranges, CIDR subnets, and bulk IP lists with advanced diagnostic tools and comparison features',
    category: 'network',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The IP Address Toolkit is a comprehensive suite of utilities for working with IP addresses and network ranges. Validate individual IPs, analyze IP ranges (e.g., 192.168.1.1 to 192.168.1.10), process bulk IP lists with filtering and export, calculate CIDR subnets, and run network diagnostics all in one place. Bulk mode supports side-by-side comparison (2 IPs) and aggregate analysis (3+ IPs) to identify patterns and outliers. Supports both IPv4 and IPv6, with detailed analysis including classification, binary/hex conversion, and more.',
      howtouse: [
        'Select a mode: Single IP, Bulk, CIDR & Subnet, or Diagnostics',
        'For Single IP: Enter an IP address, IP range, or CIDR notation and select desired operations',
        'For Bulk: Paste multiple IPs/hostnames (one per line) to enable filtering, type distribution, and comparison features',
        'Bulk mode with 2 items: Auto-generates a Comparison tab showing side-by-side field differences',
        'Bulk mode with 3+ items: Auto-generates a Comparison tab with aggregate analysis, type distribution, and outlier detection',
        'For CIDR: Enter a network range and configure subnetting',
        'For Diagnostics: Enter target IP and select diagnostic operations',
        'Configure options specific to your selected mode',
        'Click "Run" to execute the analysis',
        'View results in organized cards with filtering, or export to JSON/CSV',
      ],
      features: [
        'Single IP analysis: validation, normalization, integer conversion',
        'IPv4 and IPv6 support with auto-detection',
        'Public/Private classification and reserved range detection',
        'ASN (Autonomous System Number) lookup',
        'Geolocation data (country, region)',
        'Reverse DNS (PTR) lookup',
        'Network safety and reputation scoring',
        'Bulk processing of up to 10,000 IPs with filtering and deduplication',
        'Bulk comparison: Side-by-side diff for 2 items, aggregate analysis for 3+ items',
        'Smart outlier detection and type distribution in bulk mode',
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
      return await jwtDecoderWithJwks(inputText, config)
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
      return httpStatusLookup(inputText, config)
    case 'mime-type-lookup':
      return mimeTypeLookup(inputText, config)
    case 'http-header-parser':
      return httpHeaderParser(inputText, config)
    case 'uuid-validator':
      return uuidValidator(inputText)
    case 'svg-optimizer':
      return svgOptimizer(inputText)
    case 'unit-converter':
      return unitConverterTool(inputText, config)
    case 'number-formatter':
      return numberFormatter(inputText, config)
    case 'time-normalizer':
      return timeNormalizer(inputText, config)
    case 'base-converter':
      return baseConverter(inputText, config)
    case 'math-evaluator':
      return mathEvaluator(inputText, config)
    case 'cron-tester':
      return cronTester(inputText, config)
    case 'file-size-converter':
      return fileSizeConverter(inputText, config)
    case 'js-formatter':
      return await jsFormatter(inputText, config)
    case 'email-validator':
      return validateEmail(inputText)
    case 'ip-address-toolkit':
      return validateIPAddress(inputText, config)
    default:
      throw new Error(`Unknown tool: ${toolId}`)
  }
}

/**
 * Detects and parses CIDR notation
 * Returns { base, cidr } or null if not valid CIDR
 */
function parseCIDRNotation(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed.includes('/')) return null

  const [baseIP, cidrStr] = trimmed.split('/')
  if (!baseIP || !cidrStr) return null

  const base = baseIP.trim()
  const cidr = parseInt(cidrStr.trim(), 10)

  if (!isValidIPv4(base) && !isValidIPv6(base)) return null
  if (isNaN(cidr) || cidr < 0) return null

  const isIPv4 = isValidIPv4(base)
  const maxCIDR = isIPv4 ? 32 : 128

  // Return object even if prefix is out of range - let buildCIDRResult handle the error
  return {
    base,
    cidr,
    isIPv4,
    isValid: cidr <= maxCIDR,
    normalized: `${base}/${cidr}`,
    cidrError: cidr > maxCIDR ? { code: 'INVALID_CIDR_PREFIX', maxCIDR } : null
  }
}

/**
 * Detects and parses IP range notation
 *
 * Supported separators:
 *   - Hyphen: - (e.g., "10.0.0.1 - 10.0.0.5")
 *   - En-dash: – (e.g., "10.0.0.1 – 10.0.0.5")
 *   - Em-dash: — (e.g., "10.0.0.1 — 10.0.0.5")
 *   - Double dots: .. (e.g., "10.0.0.1..10.0.0.5")
 *   - Unicode ellipsis: … (e.g., "10.0.0.1…10.0.0.5")
 *   - Keyword: to (e.g., "10.0.0.1 to 10.0.0.5")
 *
 * Unsupported separators (return null):
 *   - Tilde: ~ (e.g., "10.0.0.1 ~ 10.0.0.5")
 *   - Comma: , (e.g., "10.0.0.1, 10.0.0.5")
 *   - Other symbols
 *
 * Note: Whitespace (spaces, tabs) around separators is handled
 */
function parseIPRange(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()

  let startStr, endStr
  let separator = null

  // Check for "to" keyword
  if (trimmed.toLowerCase().includes(' to ')) {
    separator = 'to'
    ;[startStr, endStr] = trimmed.split(/\s+to\s+/i).map(s => s.trim())
  }
  // Check for two dots (..)
  else if (trimmed.includes('..')) {
    separator = '..'
    ;[startStr, endStr] = trimmed.split('..').map(s => s.trim())
  }
  // Check for unicode ellipsis (…)
  else if (trimmed.includes('…')) {
    separator = '…'
    ;[startStr, endStr] = trimmed.split('…').map(s => s.trim())
  }
  // Check for em dash (—)
  else if (trimmed.includes('—')) {
    separator = '—'
    ;[startStr, endStr] = trimmed.split('—').map(s => s.trim())
  }
  // Check for en dash (–)
  else if (trimmed.includes('–')) {
    separator = '–'
    ;[startStr, endStr] = trimmed.split('–').map(s => s.trim())
  }
  // Check for regular dash (-)
  else if (trimmed.includes('-')) {
    separator = '-'
    // Split by dash, handling multiple dashes carefully
    const parts = trimmed.split('-').map(p => p.trim())
    if (parts.length === 2) {
      [startStr, endStr] = parts
    } else if (parts.length === 3 && parts[0] === '') {
      // Handle negative numbers like "-10.0.0.1" (IPv4 can't be negative, so this is invalid)
      return null
    } else {
      return null
    }
  } else {
    return null
  }

  if (!startStr || !endStr) return null

  const start = startStr.trim()
  const end = endStr.trim()

  const isIPv4Start = isValidIPv4(start)
  const isIPv6Start = isValidIPv6(start)
  const isIPv4End = isValidIPv4(end)
  const isIPv6End = isValidIPv6(end)

  // Check if both are valid IPs (of any family)
  const startIsValidIP = isIPv4Start || isIPv6Start
  const endIsValidIP = isIPv4End || isIPv6End

  // If both look like IPs but are different families, it's a cross-family range (invalid)
  if (startIsValidIP && endIsValidIP && ((isIPv4Start && isIPv6End) || (isIPv6Start && isIPv4End))) {
    return {
      start,
      end,
      startInt: null,
      endInt: null,
      isIPv4: false,
      isIPv6: false,
      isValid: false,
      isMixedFamily: true,
      separator,
    }
  }

  // Both must be the same version
  if ((isIPv4Start && !isIPv4End) || (isIPv6Start && !isIPv6End)) return null
  if (!startIsValidIP) return null

  const isIPv4 = isIPv4Start
  const startInt = isIPv4 ? ipv4ToInteger(start) : null
  const endInt = isIPv4 ? ipv4ToInteger(end) : null

  return {
    start,
    end,
    startInt,
    endInt,
    isIPv4,
    isIPv6: !isIPv4,
    isValid: true,
    separator,
  }
}

function validateIPAddress(inputText, config = {}) {
  if (!inputText || !inputText.trim()) {
    return {
      error: 'No input provided',
      message: 'Please enter an IP address or hostname to analyze',
    }
  }

  const rawInput = inputText
  const inputTrimmed = inputText.trim()

  try {
    // Phase 3: Check for hostname FIRST (before trying IP validation)
    if (isHostname(inputTrimmed)) {
      return buildHostnameResult(inputTrimmed, rawInput, config)
    }

    // Phase 2: Check for CIDR notation
    const cidrParsed = parseCIDRNotation(inputTrimmed)
    if (cidrParsed) {
      return buildCIDRResult(cidrParsed, rawInput, config)
    }

    // Phase 2: Check for range notation
    const rangeParsed = parseIPRange(inputTrimmed)
    if (rangeParsed) {
      return buildRangeResult(rangeParsed, rawInput, config)
    }

    // Phase 1: Single IP address validation
    // But first check if this looks like an IP attempt or unrecognized input
    const singleIPResult = buildSingleIPResult(inputTrimmed, rawInput, config)

    // If invalid, check if it looks like an IP attempt at all
    if (!singleIPResult.isValid) {
      const looksLikeIPAttempt = /^[0-9a-fA-F:.\s\-/]*$/.test(inputTrimmed) &&
                                 (inputTrimmed.includes('.') || inputTrimmed.includes(':'))

      // If it doesn't look like an IP attempt, treat as unrecognized input
      if (!looksLikeIPAttempt) {
        return buildUnrecognizedResult(inputTrimmed, rawInput, config)
      }
    }

    return singleIPResult

  } catch (error) {
    return {
      rawInput,
      inputType: 'unknown',
      version: null,
      isIPv4: false,
      isIPv6: false,
      metadata: { versionString: 'Unknown' },
      error: error.message || 'Failed to parse input',
      isValid: false,
    }
  }
}

function buildHostnameResult(hostname, rawInput, config) {
  // Handle localhost as a special case per RFC 6761
  const isLocalhost = hostname === 'localhost'

  // Parse hostname into labels and extract TLD
  const labels = hostname.split('.')
  let tld = isLocalhost ? null : labels[labels.length - 1]
  let registrable = isLocalhost ? 'localhost' : labels.slice(-2).join('.')
  const isSubdomain = labels.length > 2

  // Validate hostname format
  const isValid = isLocalhost || (
    labels.every(label =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/.test(label)
    ) &&
    hostname.length <= 253
  )

  const results = {
    rawInput,
    input: hostname,
    inputType: 'hostname',
    isValid,
    isHostname: true,
    metadata: {
      versionString: 'Hostname',
    },
  }

  // Add hostname metadata
  if (isValid) {
    // Determine if fully qualified (FQDN): has TLD (not single-label) and is not special-use
    const isFullyQualified = !isLocalhost && labels.length > 1

    results.hostname = {
      labels,
      tld,
      registrable,
      isSubdomain,
      isFullyQualified,
    }

    // Add RFC 6761 special use domain indicator for localhost
    if (isLocalhost) {
      results.hostname.isSpecialUse = true
      results.isSpecialUse = true
    }

    // Add diagnostics
    results.diagnostics = {
      errors: [],
      warnings: [],
      tips: [
        {
          code: 'VALID_HOSTNAME',
          message: '✓ Valid hostname format',
          severity: 'info',
        },
        {
          code: 'DNS_RESOLUTION_AVAILABLE',
          message: isLocalhost
            ? 'Localhost (RFC 6761) - resolves to 127.0.0.1 and ::1'
            : 'DNS resolution will be performed to resolve hostname to IP address(es)',
          severity: 'info',
        },
      ],
    }

    results.allIssues = results.diagnostics.tips
  } else {
    // Invalid hostname format
    results.diagnostics = {
      errors: [
        {
          code: 'INVALID_HOSTNAME_FORMAT',
          message: 'Invalid hostname format',
          severity: 'error',
        },
      ],
      warnings: [],
      tips: [
        {
          code: 'HOSTNAME_RULES',
          message: 'Hostname must be 1-253 characters, labels 1-63 chars, alphanumeric and hyphens (no leading/trailing hyphens)',
          severity: 'info',
        },
      ],
    }

    results.allIssues = [
      ...results.diagnostics.errors,
      ...results.diagnostics.tips,
    ]
  }

  return results
}

function buildUnrecognizedResult(input, rawInput, config) {
  const results = {
    rawInput,
    input,
    inputType: 'unknown',
    isValid: false,
    version: null,
    isIPv4: false,
    isIPv6: false,
    metadata: {
      versionString: 'Unknown',
    },
    diagnostics: {
      errors: [
        {
          code: 'UNRECOGNIZED_INPUT',
          message: 'Input is not a valid IPv4, IPv6, CIDR, range, or hostname',
          severity: 'error',
        },
      ],
      warnings: [],
      tips: [
        {
          code: 'INPUT_FORMATS',
          message: 'Valid formats: IPv4 (192.168.1.1), IPv6 (2001:db8::1), CIDR (192.168.1.0/24), Range (192.168.1.1-192.168.1.10), or Hostname (example.com)',
          severity: 'info',
        },
      ],
    },
  }

  results.allIssues = [
    ...results.diagnostics.errors,
    ...results.diagnostics.tips,
  ]

  return results
}

function buildSingleIPResult(ip, rawInput, config) {
  // Determine IP version and validate
  let version = null
  let isValid = false
  let inputType = 'unknown'

  if (isValidIPv4(ip)) {
    version = 4
    isValid = true
    inputType = 'ipv4'
  } else if (isValidIPv6(ip)) {
    version = 6
    isValid = true
    inputType = 'ipv6'
  } else {
    // Invalid IP - determine type from format (: = IPv6, . = IPv4)
    // This ensures consistent classification even for malformed inputs
    if (ip.includes(':')) {
      inputType = 'ipv6'
      version = 6
    } else if (ip.includes('.')) {
      inputType = 'ipv4'
      version = 4
    }
    // If no colons or dots, leave as 'unknown'
  }

  // Build results object with Phase 1 enhancements
  const results = {
    rawInput,
    input: ip,
    inputType,
    version,
    isIPv4: version === 4,
    isIPv6: version === 6,
    metadata: {
      versionString: version === 4 ? 'IPv4' : version === 6 ? 'IPv6' : 'Unknown',
    },
    isValid,
  }

  // If invalid, include diagnostics
  if (!isValid) {
    const errorData = ip.includes(':')
      ? detectIPv6Errors(ip)
      : detectIPv4Errors(ip)
    results.diagnostics = errorData
    // Create allIssues array from diagnostics
    if (errorData) {
      const allIssues = [
        ...(errorData.errors || []),
        ...(errorData.warnings || []),
        ...(errorData.tips || []),
      ]
      results.allIssues = allIssues
    }
    return results
  }

  // IP is valid - add normalized form
  if (config.normalize !== false || version === 4) {
    if (version === 4) {
      results.normalized = normalizeIPv4(ip)
    } else if (version === 6) {
      results.normalized = compressIPv6(ip)
    }
  }

  // IPv4-specific enhancements
  if (version === 4) {
    // Parse octets (foundation for Phase 2+ subnet math)
    const octets = parseIPv4Octets(ip)
    results.parsed = { octets }

    // Kind detection: host vs network vs broadcast
    results.kind = 'host'

    // Integer conversions
    if (config.ipToInteger !== false) {
      const int = ipv4ToInteger(ip)
      results.integer = int
      if (config.ipToHex !== false) {
        results.integerHex = ipv4ToHex(ip)
      }
      if (config.ipToBinary !== false) {
        const binary = ipv4ToBinary(ip)
        results.integerBinary = binary.replace(/(.{8})/g, '$1.').replace(/\.$/, '')
        // Add binaryContinuous: continuous binary string without dots
        results.binaryContinuous = binary
      }
    }

    // Binary octets array (for Phase 4 visual subnet bar)
    if (config.ipToBinary !== false) {
      results.binaryOctets = ipv4ToBinaryOctets(ip)
    }
  } else if (version === 6) {
    // Zone index parsing FIRST (fe80::1%eth0 format)
    const zoneInfo = parseIPv6WithZone(ip)
    const ipv6AddressOnly = zoneInfo?.address || ip

    // IPv6-specific enhancements - use address WITHOUT zone ID
    if (config.ipv6Expansion !== false) {
      results.expanded = expandIPv6(ipv6AddressOnly)
      results.compressed = compressIPv6(ipv6AddressOnly)
      results.hextets = getIPv6Hextets(ipv6AddressOnly)
    }
    if (config.ipv6Binary !== false) {
      results.ipv6Binary = ipv6ToBinary(ipv6AddressOnly)
      results.ipv6BinaryDotted = ipv6ToBinaryDotted(ipv6AddressOnly)
    }

    // Add zone ID info if present
    if (zoneInfo?.zoneId) {
      results.zoneId = zoneInfo.zoneId
      results.normalizedWithoutZone = zoneInfo.normalizedWithoutZone
      results.normalizedWithZone = zoneInfo.normalizedWithZone
    }

    // Check for IPv4-mapped IPv6 addresses (use address without zone)
    const mappedIPv4 = getIPv4FromIPv6Mapped(ipv6AddressOnly)
    if (mappedIPv4) {
      results.isIPv4Mapped = true
      results.mappedIPv4 = mappedIPv4
    }

    // Classify special IPv6 types (use address without zone)
    const ipv6Special = classifyIPv6Special(ipv6AddressOnly)
    if (ipv6Special) {
      results.ipv6Special = ipv6Special
    }

    // Store the address-only version for later use in PTR and classification
    results._ipv6AddressOnly = ipv6AddressOnly
  }

  // PTR records (use IP without zone ID if present)
  if (config.ptrRecord !== false) {
    const ipForPTR = results._ipv6AddressOnly || ip
    const ptrData = generatePTR(ipForPTR)
    if (ptrData) {
      results.ptr = ptrData.ptr
    }
  }

  // RFC Classification (use IP without zone ID if present)
  if (config.classification !== false) {
    const ipForClassification = results._ipv6AddressOnly || ip
    const classification = classifyIP(ipForClassification)
    if (classification) {
      results.classification = classification
    }
  }

  // Diagnostics and tips
  if (config.diagnostics !== false) {
    const errorData = version === 4
      ? detectIPv4Errors(ip)
      : detectIPv6Errors(ip)
    results.diagnostics = errorData
    // Create allIssues array from diagnostics
    const allIssues = [
      ...(errorData.errors || []),
      ...(errorData.warnings || []),
      ...(errorData.tips || []),
    ]
    results.allIssues = allIssues
  }

  return results
}

function buildCIDRResult(cidrParsed, rawInput, config) {
  const { base, cidr, isIPv4, normalized, isValid, cidrError } = cidrParsed

  // Handle invalid CIDR prefix
  if (!isValid && cidrError) {
    const maxCIDR = cidrError.maxCIDR

    // Build result object for invalid CIDR
    const result = {
      rawInput,
      input: normalized,
      inputType: 'cidr',
      isValid: false,
      version: isIPv4 ? 4 : 6,
      isIPv4,
      isIPv6: !isIPv4,
      metadata: { versionString: isIPv4 ? 'IPv4 CIDR' : 'IPv6 CIDR' },
      diagnostics: {
        errors: [
          {
            code: 'INVALID_CIDR_PREFIX',
            message: `CIDR prefix ${cidr} is out of range. Allowed: 0–${maxCIDR} for IPv${isIPv4 ? '4' : '6'}.`,
            severity: 'error',
          },
        ],
        warnings: [],
        tips: [],
      },
      allIssues: [
        {
          code: 'INVALID_CIDR_PREFIX',
          message: `CIDR prefix ${cidr} is out of range. Allowed: 0–${maxCIDR} for IPv${isIPv4 ? '4' : '6'}.`,
          severity: 'error',
        },
      ],
    }

    // Include baseIP analysis even when CIDR prefix is invalid
    const baseClassification = classifyIP(base)
    if (isIPv4) {
      result.baseIP = {
        input: base,
        normalized: normalizeIPv4(base),
        integer: ipv4ToInteger(base),
        integerHex: ipv4ToHex(base),
        classification: baseClassification,
      }
    } else {
      result.baseIP = {
        input: base,
        compressed: compressIPv6(base),
        expanded: expandIPv6(base),
        hextets: getIPv6Hextets(base),
        classification: baseClassification,
      }
    }

    return result
  }

  const results = {
    rawInput,
    inputType: 'cidr',
    input: normalized,
    isValid: true,
    cidr: {
      input: normalized,
      cidr,
    },
  }

  if (isIPv4) {
    results.version = 4
    results.isIPv4 = true
    results.isIPv6 = false
    results.metadata = { versionString: 'IPv4 CIDR' }

    // Netmask calculations
    const netmask = prefixToMask(cidr)
    const netmaskBinary = cidrToNetmaskBinary(cidr)
    const wildcardMask = getWildcardMask(netmask)

    // ISSUE 3 FIX: Use proper integer math for reliable CIDR calculations
    const baseInt = ipv4ToInteger(base)
    let mask = (0xFFFFFFFF << (32 - cidr)) >>> 0
    let networkInt = (baseInt & mask) >>> 0
    let broadcastInt = (networkInt | (~mask >>> 0)) >>> 0

    // SPECIAL CASE: /0 represents the entire IPv4 address space
    // Set proper broadcast to 255.255.255.255 and lastHost to 255.255.255.254
    if (cidr === 0) {
      networkInt = 0
      broadcastInt = 4294967295 // 255.255.255.255
    }

    let networkAddress = integerToIPv4(networkInt)
    let broadcastAddress = integerToIPv4(broadcastInt)

    // ISSUE 2 FIX: Calculate firstHost and lastHost directly from integer values
    // Don't rely on getFirstHost/getLastHost which call potentially-null functions
    let firstHost
    let lastHost

    if (cidr === 32) {
      // /32: single host, everything is the IP itself
      firstHost = base
      lastHost = base
    } else if (cidr === 31) {
      // /31: point-to-point, both are usable
      firstHost = integerToIPv4(networkInt)
      lastHost = integerToIPv4(broadcastInt)
    } else if (cidr === 0) {
      // /0: entire IPv4 space - first usable is 0.0.0.1, last usable is 255.255.255.254
      firstHost = integerToIPv4(1)
      lastHost = integerToIPv4(4294967294) // 255.255.255.254
    } else {
      // /1 to /30: normal case - first host is network + 1, last host is broadcast - 1
      firstHost = integerToIPv4(networkInt + 1)
      lastHost = integerToIPv4(broadcastInt - 1)
    }

    const totalHosts = getTotalHosts(cidr)
    const usableHosts = getUsableHosts(cidr)

    const hostBits = 32 - cidr
    const networkBits = cidr

    // Determine if base IP is network or broadcast address
    const isNetworkAddr = cidr === 32 ? true : isNetworkAddress(base, cidr)
    const isBroadcastAddr = cidr === 32 ? false : isBroadcastAddress(base, cidr)

    // Get CIDR type classification
    const cidrType = getCIDRType(cidr)

    // ISSUE 1 FIX: Always assign network/broadcast/host addresses from integer values
    results.cidr = {
      ...results.cidr,
      netmask,
      netmaskBinary,
      wildcardMask,
      networkAddress: integerToIPv4(networkInt),
      broadcastAddress: integerToIPv4(broadcastInt),
      firstHost: cidr >= 31 ? integerToIPv4(networkInt) : integerToIPv4(networkInt + 1),
      lastHost: cidr >= 31 ? integerToIPv4(broadcastInt) : integerToIPv4(broadcastInt - 1),
      totalHosts,
      usableHosts,
      hostBits,
      networkBits,
      isNetworkAddress: isNetworkAddr,
      isBroadcastAddress: isBroadcastAddr,
      integer: {
        network: networkInt,
        broadcast: broadcastInt,
      },
      cidrType: cidrType?.type || null,
      cidrTypeDescription: cidrType?.description || null,
    }

    // Base IP analysis
    const baseClassification = classifyIP(base)

    results.baseIP = {
      input: base,
      normalized: normalizeIPv4(base),
      integer: ipv4ToInteger(base),
      integerHex: ipv4ToHex(base),
      classification: baseClassification,
    }

  } else {
    results.version = 6
    results.isIPv4 = false
    results.isIPv6 = true
    results.metadata = { versionString: 'IPv6 CIDR' }

    // IPv6 CIDR network address and host calculations
    const networkAddress = getIPv6NetworkAddress(base, cidr)
    const firstAddress = getIPv6FirstAddress(base, cidr)
    const lastAddress = getIPv6LastAddress(base, cidr)
    const hostCount = getIPv6HostCount(cidr)

    results.cidr = {
      ...results.cidr,
      expanded: expandIPv6(base),
      compressed: compressIPv6(base),
      hextets: getIPv6Hextets(base),
      networkAddress,
      firstAddress,
      lastAddress,
      hostCount,
      prefix: cidr,
    }

    const baseClassification = classifyIP(base)
    results.baseIP = {
      input: base,
      compressed: compressIPv6(base),
      expanded: expandIPv6(base),
      classification: baseClassification,
    }
  }

  return results
}

function buildRangeResult(rangeParsed, rawInput, config) {
  const { start, end, startInt, endInt, isIPv4, isIPv6, separator, isMixedFamily } = rangeParsed

  // Handle cross-family range (IPv4-IPv6 mix)
  if (isMixedFamily) {
    return {
      rawInput,
      inputType: 'range',
      isValid: false,
      version: null,
      isIPv4: false,
      isIPv6: false,
      metadata: { versionString: 'Mixed IP Families' },
      range: {
        start,
        end,
        startInt: null,
        endInt: null,
        isValid: false,
        rangeStatus: 'invalid_mixed_families',
        separator,
      },
      diagnostics: {
        errors: [
          {
            code: 'MIXED_ADDRESS_FAMILIES',
            message: 'IPv4 and IPv6 addresses cannot form a range',
            severity: 'error',
          },
        ],
        warnings: [],
        tips: [],
      },
      allIssues: [
        {
          code: 'MIXED_ADDRESS_FAMILIES',
          message: 'IPv4 and IPv6 addresses cannot form a range',
          severity: 'error',
        },
      ],
    }
  }

  const results = {
    rawInput,
    inputType: 'range',
    isValid: true,
  }

  if (isIPv4) {
    results.version = 4
    results.isIPv4 = true
    results.isIPv6 = false
    results.metadata = { versionString: 'IPv4 Range' }

    const isIncreasing = startInt <= endInt
    const size = Math.abs(endInt - startInt) + 1

    const startClassification = classifyIP(start)
    const endClassification = classifyIP(end)

    // Check for scope consistency (both same family, type, and special scopes)
    const scopeMismatch = (
      startClassification.type !== endClassification.type ||
      startClassification.scope !== endClassification.scope
    )

    const classificationMatch = (
      startClassification.type === endClassification.type &&
      startClassification.isPrivate === endClassification.isPrivate &&
      !scopeMismatch
    )

    // ISSUE FIX #5: Detect if IPs are in the same /24 subnet
    const startOctets = start.split('.')
    const endOctets = end.split('.')
    const isSameSubnet = (
      startOctets[0] === endOctets[0] &&
      startOctets[1] === endOctets[1] &&
      startOctets[2] === endOctets[2]
    )

    // Check for range size warnings
    const warnings = []
    if (size > 1000000) {
      warnings.push('Large range: processing may be slow')
    }

    // Detect covering subnet (minimal deterministic subnet)
    const coveringSubnet = isIncreasing ? findCoveringSubnet(start, end) : null

    // Calculate host range information
    const hosts = {
      first: start,
      last: end,
      count: size,
    }

    // Calculate boundary checks
    const boundaryChecks = {}
    if (coveringSubnet && isIncreasing) {
      const startOctets = start.split('.').map(Number)
      const endOctets = end.split('.').map(Number)
      const networkOctets = coveringSubnet.networkAddr.split('.').map(Number)
      const broadcastOctets = coveringSubnet.broadcastAddr.split('.').map(Number)

      // Check if range starts exactly at network address
      const startsAtNetwork = start === coveringSubnet.networkAddr
      // Check if range ends exactly at broadcast address
      const endsAtBroadcast = end === coveringSubnet.broadcastAddr

      boundaryChecks.includesNetworkAddress = startsAtNetwork
      boundaryChecks.includesBroadcastAddress = endsAtBroadcast
      boundaryChecks.touchesSubnetEdge = startsAtNetwork || endsAtBroadcast
    }

    // Determine subnet context
    const subnetContext = {}
    if (isSameSubnet && isIncreasing) {
      const octets = start.split('.')
      subnetContext.subnet = `${octets[0]}.${octets[1]}.${octets[2]}.0/24`
      subnetContext.fullyContained = true
    } else if (coveringSubnet && isIncreasing) {
      subnetContext.subnet = coveringSubnet.subnet
      subnetContext.fullyContained = true
    }

    // Enumeration hint
    const enumeration = {}
    if (isIncreasing) {
      enumeration.recommended = size <= 1000
      if (size <= 10) {
        enumeration.reason = `Very small range (${size} hosts)`
      } else if (size <= 100) {
        enumeration.reason = `Small range (${size} hosts)`
      } else if (size <= 1000) {
        enumeration.reason = `Moderate range (${size} hosts)`
      } else if (size <= 10000) {
        enumeration.reason = `Large range (${size.toLocaleString()} hosts) - may be slow`
      } else {
        enumeration.reason = `Very large range (${size.toLocaleString()} hosts) - not recommended`
      }
    }

    // Determine range status for semantic clarity
    let rangeStatus = 'valid'
    if (!isIncreasing) {
      rangeStatus = 'reversed'
    } else if (scopeMismatch) {
      rangeStatus = 'inconsistent-scope'
    }

    // Build scope notes
    const scopeNotes = []
    if (scopeMismatch) {
      if (startClassification.scope !== endClassification.scope) {
        scopeNotes.push(`Start is ${startClassification.scope}`)
        scopeNotes.push(`End is ${endClassification.scope}`)
      }
      if (startClassification.type !== endClassification.type) {
        scopeNotes.push(`Start type: ${startClassification.type}`)
        scopeNotes.push(`End type: ${endClassification.type}`)
      }
    }

    const classificationNotes = []
    if (startClassification.isPrivate && endClassification.isPrivate) {
      classificationNotes.push('Both addresses are private IPv4')
    } else if (!startClassification.isPrivate && !endClassification.isPrivate) {
      classificationNotes.push('Both addresses are public IPv4')
    }

    if (startClassification.rfc && endClassification.rfc && startClassification.rfc === endClassification.rfc) {
      const rfcLabel = startClassification.rfc.includes('RFC') ? startClassification.rfc : `RFC ${startClassification.rfc}`
      classificationNotes.push(`Both belong to ${rfcLabel}`)
    }

    if (isSameSubnet && isIncreasing) {
      classificationNotes.push('All addresses are in the same /24 subnet')
    }

    results.range = {
      start,
      end,
      startInt,
      endInt,
      size,
      isValid: isIncreasing && !scopeMismatch,
      isIncreasing,
      isSameSubnet,
      classificationMatch,
      scopeMismatch,
      rangeStatus,
      scopeNotes,
      classificationNotes,
      warnings,
      coveringSubnet,
      hosts,
      boundaryChecks,
      subnetContext,
      enumeration,
      separator,
    }

    results.startIP = {
      input: start,
      normalized: normalizeIPv4(start),
      integer: startInt,
      integerHex: ipv4ToHex(start),
      classification: startClassification,
    }

    results.endIP = {
      input: end,
      normalized: normalizeIPv4(end),
      integer: endInt,
      integerHex: ipv4ToHex(end),
      classification: endClassification,
    }

  } else if (isIPv6) {
    results.version = 6
    results.isIPv4 = false
    results.isIPv6 = true
    results.metadata = { versionString: 'IPv6 Range' }

    const startClassification = classifyIP(start)
    const endClassification = classifyIP(end)

    // Check for scope consistency
    const scopeMismatch = (
      startClassification.type !== endClassification.type ||
      startClassification.scope !== endClassification.scope
    )

    const classificationMatch = (
      startClassification.type === endClassification.type &&
      !scopeMismatch
    )

    // IPv6 ranges are typically much larger, warn about large ranges
    const warnings = []
    warnings.push('IPv6 range enumeration is not practical - range may be extremely large')

    const scopeNotes = []
    if (scopeMismatch) {
      if (startClassification.scope !== endClassification.scope) {
        scopeNotes.push(`Start is ${startClassification.scope}`)
        scopeNotes.push(`End is ${endClassification.scope}`)
      }
    }

    results.range = {
      start,
      end,
      isValid: !scopeMismatch,
      classificationMatch,
      scopeMismatch,
      scopeNotes,
      classificationNotes: [],
      warnings,
      separator,
    }

    results.startIP = {
      input: start,
      compressed: compressIPv6(start),
      expanded: expandIPv6(start),
      classification: startClassification,
    }

    results.endIP = {
      input: end,
      compressed: compressIPv6(end),
      expanded: expandIPv6(end),
      classification: endClassification,
    }
  }

  return results
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



function explainRegex(pattern) {
  const explanations = [];
  let i = 0;
  let inCharClass = false;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '[' && (i === 0 || pattern[i - 1] !== '\\')) {
      inCharClass = true;
      let charClass = '[';
      i++;
      while (i < pattern.length && pattern[i] !== ']') {
        charClass += pattern[i];
        i++;
      }
      if (i < pattern.length) charClass += ']';
      explanations.push(`Character class ${charClass}`);
      inCharClass = false;
      i++;
    } else if (char === '(' && (i === 0 || pattern[i - 1] !== '\\')) {
      explanations.push('Start capturing group');
      i++;
    } else if (char === ')' && (i === 0 || pattern[i - 1] !== '\\')) {
      explanations.push('End capturing group');
      i++;
    } else if (char === '\\') {
      i++;
      if (i < pattern.length) {
        const escaped = pattern[i];
        const escapeMap = {
          'd': 'digit (0-9)',
          'D': 'non-digit',
          'w': 'word character (a-z, A-Z, 0-9, _)',
          'W': 'non-word character',
          's': 'whitespace',
          'S': 'non-whitespace',
          'n': 'newline',
          't': 'tab',
          '.': 'literal dot',
        };
        if (escapeMap[escaped]) {
          explanations.push(`\\${escaped} → ${escapeMap[escaped]}`);
        } else {
          explanations.push(`Escaped character: \\${escaped}`);
        }
        i++;
      }
    } else if (char === '*') {
      explanations.push('Zero or more of previous');
      i++;
    } else if (char === '+') {
      explanations.push('One or more of previous');
      i++;
    } else if (char === '?') {
      explanations.push('Zero or one of previous (optional)');
      i++;
    } else if (char === '^') {
      explanations.push('Start of line/string');
      i++;
    } else if (char === '$') {
      explanations.push('End of line/string');
      i++;
    } else if (char === '|') {
      explanations.push('OR');
      i++;
    } else if (char === '.') {
      explanations.push('Any character except newline');
      i++;
    } else if (char === '{') {
      let quantifier = '{';
      i++;
      while (i < pattern.length && pattern[i] !== '}') {
        quantifier += pattern[i];
        i++;
      }
      if (i < pattern.length) quantifier += '}';
      explanations.push(`Quantifier: repeat ${quantifier.slice(1, -1)} times`);
      i++;
    } else if (!/\s/.test(char)) {
      explanations.push(`Literal: "${char}"`);
      i++;
    } else {
      i++;
    }
  }

  return explanations;
}

function detectRegexWarnings(pattern) {
  const warnings = [];
  let i = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let braceCount = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const prevChar = i > 0 ? pattern[i - 1] : '';
    const isEscaped = prevChar === '\\' && (i < 2 || pattern[i - 2] !== '\\');

    // Detect unescaped dot without context
    if (char === '.' && !isEscaped && i > 0) {
      const before = pattern[i - 1];
      const after = pattern[i + 1];
      if (before !== '\\' && (i === 0 || !['[', '\\'].includes(before))) {
        const contextStart = Math.max(0, i - 3);
        const contextEnd = Math.min(pattern.length, i + 4);
        const context = pattern.substring(contextStart, contextEnd);
        warnings.push({
          type: 'unescaped-dot',
          severity: 'warning',
          message: 'Unescaped dot matches ANY character',
          suggestion: 'Did you mean to match a literal dot? Use \\. instead.',
          position: i,
          context,
        });
      }
    }

    // Track parentheses
    if (char === '(' && !isEscaped) {
      parenCount++;
    } else if (char === ')' && !isEscaped) {
      parenCount--;
      if (parenCount < 0) {
        warnings.push({
          type: 'unmatched-closing-paren',
          severity: 'error',
          message: 'Unmatched closing parenthesis )',
          suggestion: 'Remove the extra ) or add an opening ( before it.',
          position: i,
        });
      }
    }

    // Track brackets
    if (char === '[' && !isEscaped) {
      bracketCount++;
    } else if (char === ']' && !isEscaped) {
      bracketCount--;
      if (bracketCount < 0) {
        warnings.push({
          type: 'unmatched-closing-bracket',
          severity: 'error',
          message: 'Unmatched closing bracket ]',
          suggestion: 'Remove the extra ] or add an opening [ before it.',
          position: i,
        });
      }
    }

    // Track braces
    if (char === '{' && !isEscaped) {
      braceCount++;
    } else if (char === '}' && !isEscaped) {
      braceCount--;
      if (braceCount < 0) {
        warnings.push({
          type: 'unmatched-closing-brace',
          severity: 'error',
          message: 'Unmatched closing brace }',
          suggestion: 'Remove the extra } or add an opening { before it.',
          position: i,
        });
      }
    }

    // Detect quantifier after quantifier
    if (['+', '*', '?', '{'].includes(char) && !isEscaped && i > 0) {
      const prevChar = pattern[i - 1];
      if (['+', '*', '?', '}'].includes(prevChar)) {
        warnings.push({
          type: 'quantifier-after-quantifier',
          severity: 'warning',
          message: `Quantifier after quantifier: ${prevChar}${char}`,
          suggestion: 'Quantifiers cannot be repeated. Remove one or clarify your intent.',
          position: i,
        });
      }
    }

    // Detect greedy vs non-greedy behavior hint
    if (char === '*' && !isEscaped) {
      const nextChar = pattern[i + 1];
      if (nextChar === '?') {
        // Non-greedy, which is fine
      } else if (i > 0) {
        // Greedy - might be an issue depending on context
        // Only warn if followed by another quantifiable pattern
        if (nextChar && /[.*+?}]/.test(nextChar)) {
          warnings.push({
            type: 'greedy-quantifier-warning',
            severity: 'info',
            message: 'Greedy quantifier * found - be aware of potential backtracking',
            suggestion: 'If you want non-greedy matching, use *? instead.',
            position: i,
          });
        }
      }
    }

    i++;
  }

  // Check unclosed groups
  if (parenCount > 0) {
    warnings.push({
      type: 'unclosed-group',
      severity: 'error',
      message: `${parenCount} unclosed parenthesis/group`,
      suggestion: 'Add the missing closing parenthesis ) at the end or adjust your groups.',
      position: pattern.length,
    });
  } else if (parenCount < 0) {
    warnings.push({
      type: 'extra-closing-group',
      severity: 'error',
      message: 'Extra closing parenthesis',
      suggestion: 'Remove extra closing parenthesis ) or add opening parenthesis.',
      position: pattern.length,
    });
  }

  // Check unclosed character class
  if (bracketCount > 0) {
    warnings.push({
      type: 'unclosed-bracket',
      severity: 'error',
      message: 'Unclosed character class [',
      suggestion: 'Add the missing closing bracket ] at the end.',
      position: pattern.length,
    });
  } else if (bracketCount < 0) {
    warnings.push({
      type: 'extra-closing-bracket',
      severity: 'error',
      message: 'Extra closing bracket',
      suggestion: 'Remove extra closing bracket ] or add opening bracket.',
      position: pattern.length,
    });
  }

  // Check unclosed quantifier
  if (braceCount > 0) {
    warnings.push({
      type: 'unclosed-brace',
      severity: 'error',
      message: 'Unclosed quantifier {',
      suggestion: 'Add the missing closing brace } at the end.',
      position: pattern.length,
    });
  } else if (braceCount < 0) {
    warnings.push({
      type: 'extra-closing-brace',
      severity: 'error',
      message: 'Extra closing brace',
      suggestion: 'Remove extra closing brace } or add opening brace.',
      position: pattern.length,
    });
  }

  // Check for common flag issues
  if (pattern.endsWith('/')) {
    const flagCheck = pattern.split('/').pop();
    if (flagCheck && /[a-z]/.test(flagCheck) && !['g', 'i', 'm', 's', 'd', 'u', 'y'].some(f => flagCheck.includes(f))) {
      warnings.push({
        type: 'invalid-flags',
        severity: 'warning',
        message: 'Possible invalid regex flag',
        suggestion: 'Valid flags are: g (global), i (case-insensitive), m (multiline), s (dotAll), u (unicode), y (sticky), d (hasIndices)',
        position: pattern.length,
      });
    }
  }

  // Check for empty patterns or groups
  if (pattern === '()' || pattern === '(|)' || pattern === '[]') {
    warnings.push({
      type: 'empty-group-or-class',
      severity: 'warning',
      message: 'Empty pattern or group detected',
      suggestion: 'Empty groups/classes will match empty strings. Did you mean to add content?',
      position: pattern.length,
    });
  }

  return warnings;
}

function regexTester(text, config) {
  const pattern = config.pattern || ''
  const flags = config.flags || 'g'
  const replacement = config.replacement || ''

  if (!pattern) {
    return {
      error: 'Please enter a regex pattern',
      matches: [],
      explanation: [],
      warnings: [],
    }
  }

  try {
    // Validate regex and provide explanation
    const regex = new RegExp(pattern, flags)
    const explanation = explainRegex(pattern)
    const warnings = detectRegexWarnings(pattern)

    // Extract detailed match information
    const matches = [];
    let match;
    const regexForMatching = new RegExp(pattern, flags);

    while ((match = regexForMatching.exec(text)) !== null) {
      const matchObj = {
        index: match.index,
        match: match[0],
        length: match[0].length,
        groups: [],
      };

      // Add detailed info for each group
      for (let i = 1; i < match.length; i++) {
        matchObj.groups.push({
          number: i,
          value: match[i],
          length: match[i] ? match[i].length : 0,
        });
      }

      matches.push(matchObj);

      // Avoid infinite loop with non-global flag
      if (!flags.includes('g')) break;
    }

    // Generate replacement preview
    let replacementResult = null;
    if (replacement && matches.length > 0) {
      replacementResult = text.replace(regex, replacement);
    }

    return {
      valid: true,
      pattern,
      flags,
      matchCount: matches.length,
      matches,
      explanation,
      replacement: replacement || null,
      replacementResult,
      warnings,
    }
  } catch (error) {
    return {
      valid: false,
      error: `Syntax Error: ${error.message}`,
      pattern,
      flags,
      matches: [],
      explanation: [],
      warnings: detectRegexWarnings(pattern),
    }
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

function detectDelimiter(text) {
  const delimiters = [',', ';', '|', '\t']
  const lines = text.trim().split(/\r?\n/).slice(0, 10)

  const scores = {}
  delimiters.forEach(delim => {
    scores[delim] = 0
  })

  lines.forEach(line => {
    delimiters.forEach(delim => {
      const count = (line.match(new RegExp('\\' + delim, 'g')) || []).length
      if (count > 0) {
        scores[delim] += 1
      }
    })
  })

  let maxScore = 0
  let detectedDelimiter = ','
  for (const delim in scores) {
    if (scores[delim] > maxScore) {
      maxScore = scores[delim]
      detectedDelimiter = delim
    }
  }

  return detectedDelimiter
}


function detectCellType(value) {
  if (!value || value.trim() === '') return 'empty'
  const trimmed = value.trim()
  if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') return 'boolean'
  if (!isNaN(trimmed) && !isNaN(parseFloat(trimmed))) return 'number'
  return 'text'
}

export function filterWarningsBasedOnSettings(warnings, config) {
  if (!warnings || warnings.length === 0) {
    return []
  }

  return warnings.filter(warning => {
    const trimWhitespace = config.trimWhitespace !== false
    const removeBlankRows = config.removeBlankRows !== false
    const convertNumbers = config.convertNumbers !== false
    const convertBooleans = config.convertBooleans !== false

    switch (warning.type) {
      case 'excessive-whitespace':
        return !trimWhitespace
      case 'header-whitespace':
        return !trimWhitespace
      case 'blank-rows':
        return !removeBlankRows
      case 'type-mismatch':
        return !(convertNumbers || convertBooleans)
      default:
        return true
    }
  })
}

function validateCSV(text, delimiter, headerRowIndex) {
  const warnings = []
  const lines = text.split('\n')

  // Check for mixed newline types
  const hasWindowsLineEndings = text.includes('\r\n')
  const hasUnixLineEndings = text.includes('\n') && !text.includes('\r\n')
  const hasMacLineEndings = text.includes('\r') && !text.includes('\r\n')

  if ((hasWindowsLineEndings && hasUnixLineEndings) || (hasWindowsLineEndings && hasMacLineEndings) || (hasUnixLineEndings && hasMacLineEndings)) {
    warnings.push({
      type: 'mixed-lineendings',
      severity: 'warning',
      message: 'Mixed newline types detected',
      description: 'CSV contains different line ending styles (CRLF, LF, CR). This may cause inconsistent parsing across systems.',
      row: undefined,
    })
  }

  // Check for unclosed quotes
  let quoteBalance = 0
  let lastQuoteRow = -1
  lines.forEach((line, idx) => {
    const quotes = (line.match(/"/g) || []).length
    quoteBalance += quotes
    if (quoteBalance % 2 !== 0) {
      lastQuoteRow = idx
    }
  })

  if (quoteBalance % 2 !== 0) {
    warnings.push({
      type: 'critical',
      severity: 'critical',
      message: `Unclosed quote detected`,
      description: `Row ${lastQuoteRow + 1} has an unclosed quoted field. Check for missing closing quotes or unexpected newlines inside quoted fields.`,
      row: lastQuoteRow,
    })
  }

  // Check for duplicate headers
  if (headerRowIndex >= 0 && lines[headerRowIndex]) {
    const headerLine = lines[headerRowIndex]
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
    const headerSet = new Set()
    const duplicates = new Set()

    headers.forEach(h => {
      if (headerSet.has(h) && h) {
        duplicates.add(h)
      }
      headerSet.add(h)
    })

    duplicates.forEach(dup => {
      warnings.push({
        type: 'duplicate-header',
        severity: 'warning',
        message: `Duplicate header: "${dup}"`,
        description: `The header "${dup}" appears multiple times. This may cause column mapping issues.`,
        row: headerRowIndex,
      })
    })
  }

  // Check for empty headers
  if (headerRowIndex >= 0 && lines[headerRowIndex]) {
    const headerLine = lines[headerRowIndex]
    const headers = headerLine.split(delimiter)
    headers.forEach((h, idx) => {
      if (h.trim() === '') {
        warnings.push({
          type: 'empty-header',
          severity: 'warning',
          message: `Empty header at column ${idx + 1}`,
          description: `Column ${idx + 1} has no header name. Consider naming this column or removing it.`,
          row: headerRowIndex,
          column: idx,
        })
      }
    })
  }

  // Check for whitespace in header names
  if (headerRowIndex >= 0 && lines[headerRowIndex]) {
    const headerLine = lines[headerRowIndex]
    const headers = headerLine.split(delimiter)
    headers.forEach((h, idx) => {
      const trimmed = h.trim().replace(/^"|"$/g, '')
      const rawContent = h.replace(/^"|"$/g, '')
      if (rawContent !== trimmed && trimmed !== '') {
        warnings.push({
          type: 'header-whitespace',
          severity: 'warning',
          message: `Header ${idx + 1} "${trimmed}" has leading/trailing whitespace`,
          description: `Header names should not have leading/trailing spaces. This can cause column mapping issues. Suggestion: Enable "Trim Whitespace" option.`,
          row: headerRowIndex,
          column: idx,
        })
      }

      if (/[\u200B\u200C\u200D\uFEFF]/.test(h)) {
        warnings.push({
          type: 'invisible-chars',
          severity: 'warning',
          message: `Header ${idx + 1} contains invisible characters`,
          description: `Zero-width spaces, BOM, or other hidden characters detected. These should be removed.`,
          row: headerRowIndex,
          column: idx,
        })
      }
    })
  }

  // Check for column count mismatches and trailing delimiters
  let expectedColumnCount = 0
  if (headerRowIndex >= 0 && lines[headerRowIndex]) {
    expectedColumnCount = lines[headerRowIndex].split(delimiter).length
  } else if (lines.length > 0) {
    expectedColumnCount = lines[0].split(delimiter).length
  }

  const dataStartIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 0

  lines.forEach((line, idx) => {
    if (idx !== headerRowIndex && line.trim()) {
      const columnCount = line.split(delimiter).length
      if (columnCount !== expectedColumnCount) {
        const diff = columnCount - expectedColumnCount
        const direction = diff > 0 ? 'too many' : 'too few'
        const severity = Math.abs(diff) > 2 ? 'critical' : 'warning'

        // Check for trailing delimiter
        if (diff > 0 && line.trim().endsWith(delimiter)) {
          warnings.push({
            type: 'trailing-delimiter',
            severity: 'warning',
            message: `Row ${idx + 1} has trailing delimiter`,
            description: `This row ends with a delimiter, creating an extra empty field. Remove the trailing delimiter or add a value.`,
            row: idx,
          })
        } else {
          warnings.push({
            type: 'column-mismatch',
            severity: severity,
            message: `Row ${idx + 1} has ${columnCount} columns (expected ${expectedColumnCount})`,
            description: `This row has ${direction} columns. Likely caused by unquoted delimiters in data or missing closing quotes.`,
            row: idx,
          })
        }
      }
    }
  })

  // Check for excessive whitespace in data rows
  lines.forEach((line, idx) => {
    if (idx !== headerRowIndex && line.trim()) {
      const cells = line.split(delimiter)
      let hasExcessiveWhitespace = false
      cells.forEach(cell => {
        if (cell !== cell.trim() && cell.trim() !== '') {
          hasExcessiveWhitespace = true
        }
      })

      if (hasExcessiveWhitespace) {
        warnings.push({
          type: 'excessive-whitespace',
          severity: 'info',
          message: `Row ${idx + 1} contains leading/trailing whitespace around values`,
          description: `Some fields have extra spaces. Suggestion: Enable "Trim Whitespace" option for cleaner output.`,
          row: idx,
        })
      }
    }
  })

  // Check for too many blank rows
  let consecutiveBlankRows = 0
  let maxConsecutiveBlank = 0
  lines.forEach(line => {
    if (line.trim() === '') {
      consecutiveBlankRows++
      maxConsecutiveBlank = Math.max(maxConsecutiveBlank, consecutiveBlankRows)
    } else {
      consecutiveBlankRows = 0
    }
  })

  if (maxConsecutiveBlank > 1) {
    warnings.push({
      type: 'blank-rows',
      severity: 'info',
      message: `Multiple consecutive blank rows detected`,
      description: `CSV contains ${maxConsecutiveBlank} consecutive blank lines. This may be unintentional. Suggestion: Enable "Remove Blank Rows" option.`,
      row: undefined,
    })
  }

  // Check for multiline quoted fields
  lines.forEach((line, idx) => {
    if (line.includes('"') && idx < lines.length - 1) {
      const quoteCount = (line.match(/"/g) || []).length
      if (quoteCount % 2 !== 0) {
        warnings.push({
          type: 'multiline-field',
          severity: 'info',
          message: `Row ${idx + 1} contains a multiline quoted field`,
          description: `This field spans multiple lines. Verify this is intentional and not caused by an unclosed quote.`,
          row: idx,
        })
      }
    }
  })

  // Check for inconsistent quoting style
  lines.slice(dataStartIdx).forEach((line, dataIdx) => {
    if (line.trim()) {
      const actualIdx = dataIdx + dataStartIdx
      const cells = line.split(delimiter)
      let quotedCount = 0
      let unquotedCount = 0

      cells.forEach(cell => {
        const trimmed = cell.trim()
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          quotedCount++
        } else if (trimmed.length > 0 && !trimmed.startsWith('"')) {
          unquotedCount++
        }
      })

      // If row has both quoted and unquoted fields, it might be inconsistent
      if (quotedCount > 0 && unquotedCount > 0 && quotedCount !== unquotedCount) {
        warnings.push({
          type: 'inconsistent-quoting',
          severity: 'info',
          message: `Row ${actualIdx + 1} mixes quoted and unquoted fields`,
          description: `Some fields are quoted while others are not. Ensure consistency or verify no quotes are accidentally missing.`,
          row: actualIdx,
        })
      }
    }
  })

  // Check for numeric type inference issues (simple heuristic)
  if (headerRowIndex >= 0 && lines[headerRowIndex]) {
    const headers = lines[headerRowIndex].split(delimiter).map(h => h.toLowerCase().trim())
    const numericKeywords = ['age', 'count', 'number', 'id', 'qty', 'price', 'salary', 'value', 'amount']

    lines.slice(dataStartIdx).forEach((line, dataIdx) => {
      if (line.trim()) {
        const actualIdx = dataIdx + dataStartIdx
        const cells = line.split(delimiter)

        cells.forEach((cell, colIdx) => {
          const header = headers[colIdx] || ''
          const isNumericColumn = numericKeywords.some(kw => header.includes(kw))
          const cellValue = cell.trim().replace(/^"|"$/g, '')

          if (isNumericColumn && cellValue && isNaN(cellValue) && cellValue.toLowerCase() !== 'null' && cellValue !== '') {
            warnings.push({
              type: 'type-mismatch',
              severity: 'info',
              message: `Column "${header}" contains non-numeric value "${cellValue}" in row ${actualIdx + 1}`,
              description: `This column appears to be numeric (based on header name), but row ${actualIdx + 1} contains "${cellValue}". Verify this is intentional.`,
              row: actualIdx,
              column: colIdx,
            })
          }
        })
      }
    })
  }

  // Remove duplicates and return
  return warnings.filter((w, idx, arr) => arr.findIndex(x => x.message === w.message && x.row === w.row) === idx)
}

function getRowTypePattern(row, delimiter) {
  return row.split(delimiter).map(cell => detectCellType(cell))
}

function isLikelyHeaderRow(firstRow, secondRow, delimiter) {
  if (!firstRow || !secondRow) return false

  const firstRowCells = firstRow.split(delimiter).map(c => c.trim())
  const secondRowCells = secondRow.split(delimiter).map(c => c.trim())

  // Must have same number of columns
  if (firstRowCells.length !== secondRowCells.length) return false
  if (firstRowCells.length === 0) return false

  // Get type patterns for both rows
  const firstRowTypes = getRowTypePattern(firstRow, delimiter)
  const secondRowTypes = getRowTypePattern(secondRow, delimiter)

  // Count how many columns have different types between row 1 and row 2
  let differentTypeCount = 0
  for (let i = 0; i < firstRowTypes.length; i++) {
    if (firstRowTypes[i] !== secondRowTypes[i]) {
      differentTypeCount++
    }
  }

  // If at least 40% of columns have different types, likely a header
  // This catches cases like (text,text,text,text) vs (text,text,number,boolean)
  if (differentTypeCount / firstRowCells.length >= 0.4) return true

  // Also check if first row looks like typical header names (no numbers, mostly single words)
  const headerPattern = /^[a-zA-Z_][a-zA-Z0-9_\s]*$/
  const headerLikeCells = firstRowCells.filter(c => c && headerPattern.test(c))
  const headerLikeRatio = headerLikeCells.length / firstRowCells.filter(c => c).length

  // If 70%+ of cells look like header names AND second row has mostly numbers/booleans
  const secondRowDataCells = secondRowCells.filter(c => c)
  const secondRowDataTypes = secondRowDataCells.map(c => detectCellType(c))
  const secondRowHasData = secondRowDataTypes.some(t => t === 'number' || t === 'boolean')

  if (headerLikeRatio >= 0.7 && secondRowHasData) return true

  return false
}

function csvJsonConverter(text, config) {
  const autoDetectDelimiter = config.autoDetectDelimiter === true
  const autoDetectHeaderRow = config.autoDetectHeaderRow === true

  let delimiter = config.delimiter || ','
  const trimWhitespace = config.trimWhitespace !== false
  const convertNumbers = config.convertNumbers !== false
  const convertBooleans = config.convertBooleans !== false
  const removeBlankRows = config.removeBlankRows !== false
  const headerFormat = config.headerFormat || 'original'
  const outputFormat = config.outputFormat || 'json'
  const strictMode = config.strictMode === true

  try {
    const lines = text.trim().split('\n')
    if (lines.length === 0) {
      return {
        output: formatOutput([], outputFormat, []),
        warnings: [],
      }
    }

    // Auto-detect delimiter if enabled
    if (autoDetectDelimiter) {
      delimiter = detectDelimiter(text)
    }

    // Determine header row handling
    let headerRowIndex = 0
    if (autoDetectHeaderRow && lines.length > 1) {
      // Compare first row to second row to detect if first is a header
      if (!isLikelyHeaderRow(lines[0], lines[1], delimiter)) {
        headerRowIndex = -1 // No header row detected
      }
    } else if (!autoDetectHeaderRow) {
      // Manual mode: use headerRowMode setting
      const headerRowMode = config.headerRowMode || 'hasHeader'
      if (headerRowMode === 'noHeader') {
        headerRowIndex = -1 // Treat all rows as data
      }
      // If 'hasHeader', keep headerRowIndex = 0 (first row is header)
    }

    // Validate CSV structure
    const warnings = validateCSV(text, delimiter, headerRowIndex)

    // In strict mode, fail on critical warnings
    if (strictMode && warnings.some(w => w.severity === 'critical')) {
      return {
        output: null,
        warnings: warnings,
        error: 'CSV validation failed in strict mode. Fix critical issues before converting.',
      }
    }

    const headerRow = headerRowIndex >= 0 ? lines[headerRowIndex] : null
    const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0

    let headers = headerRow
      ? headerRow.split(delimiter)
      : lines[dataStartIndex]?.split(delimiter).map((_, i) => `Column${i + 1}`) || []

    if (trimWhitespace) {
      headers = headers.map(h => h.trim())
    }

    // Normalize header format
    const normalizedHeaders = headers.map(h => normalizeHeader(h, headerFormat))

    const result = lines.slice(dataStartIndex).map(line => {
      const values = line.split(delimiter)
      const obj = {}
      normalizedHeaders.forEach((header, i) => {
        let value = values[i] || ''
        if (trimWhitespace) {
          value = value.trim()
        }
        value = convertValue(value, convertNumbers, convertBooleans)
        obj[header] = value
      })
      return obj
    })

    // Remove blank rows if enabled
    const filteredResult = removeBlankRows ? result.filter(obj => Object.values(obj).some(v => v !== '' && v !== null)) : result

    const output = formatOutput(filteredResult, outputFormat, normalizedHeaders)

    return {
      output: output,
      warnings: warnings,
      warningCount: warnings.length,
      criticalWarnings: warnings.filter(w => w.severity === 'critical').length,
    }
  } catch (error) {
    return {
      output: null,
      error: error.message,
      warnings: []
    }
  }
}

function normalizeHeader(header, format) {
  if (format === 'camelCase') {
    return header
      .replace(/[^\w\s]/g, '') // Remove special chars
      .trim()
      .split(/[\s_-]+/)
      .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  } else if (format === 'snake_case') {
    return header
      .replace(/[^\w\s]/g, '') // Remove special chars
      .trim()
      .split(/[\s_-]+/)
      .map(word => word.toLowerCase())
      .join('_')
  }
  return header
}

function convertValue(value, convertNumbers, convertBooleans) {
  if (!convertBooleans && !convertNumbers) return value

  if (convertBooleans) {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === '' || value === 'null') return null
  }

  if (convertNumbers && value !== '' && value !== null) {
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num
  }

  return value
}

function formatOutput(data, format, headers) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  } else if (format === 'jsonl') {
    return data.map(obj => JSON.stringify(obj)).join('\n')
  } else if (format === 'sql') {
    if (data.length === 0) return ''
    const tableName = 'table_name'
    const lines = data.map(obj => {
      const columns = Object.keys(obj)
      const values = Object.values(obj).map(v => {
        if (v === null) return 'NULL'
        if (typeof v === 'boolean') return v ? '1' : '0'
        if (typeof v === 'number') return String(v)
        return `'${String(v).replace(/'/g, "''")}'`
      })
      return `(${values.join(', ')})`
    })
    const columns = Object.keys(data[0])
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${lines.join(',\n')};`
  } else if (format === 'javascript') {
    return `export default ${JSON.stringify(data, null, 2)};`
  } else if (format === 'typescript') {
    return `export const data: Array<Record<string, any>> = ${JSON.stringify(data, null, 2)};`
  }
  return JSON.stringify(data, null, 2)
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
  // Clean only real newlines, don't touch backslashes (they're part of the URL encoding)
  let cleanedText = text
    .replace(/\n+/g, '')                    // Remove only real newlines
    .trim()

  try {
    const url = new URL(cleanedText)
    const result = {
      original: cleanedText,
      validation: {
        isValid: true,
        message: 'Valid URL',
      },
      components: {
        href: url.href,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      },
      searchParams: (() => {
        const params = new URLSearchParams(url.search)
        const searchParams = {}
        for (const key of params.keys()) {
          const values = params.getAll(key)
          searchParams[key] = values.length > 1 ? values : values[0]
        }
        return searchParams
      })()
    }

    // Encoding/Decoding
    result.encoding = {
      encoded: encodeURIComponent(cleanedText),
      decoded: decodeURIComponent(cleanedText),
    }

    // SEO Analysis
    try {
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'mc_eid', 'msclkid']
      const hasTrackingParams = trackingParams.some(param => url.searchParams.has(param))
      const isCanonical = url.href === `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}${url.search}${url.hash}`
      const hasSortedParams = [...url.searchParams.keys()].every((key, i, arr) => i === 0 || key >= arr[i - 1])
      const hasFragment = url.hash.length > 0
      const hasTrailingSlash = url.pathname.endsWith('/') && url.pathname.length > 1
      const isHttps = url.protocol === 'https:'

      // Build list of SEO issues
      const seoIssues = []
      if (!isHttps) seoIssues.push('Uses HTTP instead of HTTPS')
      if (hasTrackingParams) seoIssues.push('Contains tracking parameters (UTM, fbclid, gclid, etc.)')
      if (!hasSortedParams) seoIssues.push('Query parameters are not alphabetically sorted')
      if (hasFragment) seoIssues.push('URL contains fragment (#hash) which affects crawlability')
      if (!isCanonical) seoIssues.push('URL is not in canonical form')

      const seoFriendly = isHttps && !hasTrackingParams && hasSortedParams && !hasFragment && isCanonical

      result.seoAnalysis = {
        isCanonical,
        hasSortedQueryParams: hasSortedParams,
        hasTrackingParams,
        fragmentAffectsCrawlability: hasFragment,
        hasTrailingSlash,
        usesHttps: isHttps,
        seoFriendly,
        issues: seoIssues.length > 0 ? seoIssues : null,
      }
    } catch (e) {
      result.seoAnalysis = { error: 'Failed to analyze SEO' }
    }

    // Multiple Normalization Levels
    try {
      result.normalization = {}

      // Safe normalization - basic cleanup, preserves intent
      try {
        const normalizedPath = url.pathname.replace(/\/+/g, '/')
        const params = new URLSearchParams(url.search)
        const sortedParams = new URLSearchParams([...params].sort())
        result.normalization.safe = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${normalizedPath}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}${url.hash}`
      } catch (e) {
        result.normalization.safe = null
      }

      // Aggressive normalization - maximum cleanup for SEO tools
      try {
        const aggressiveUrl = new URL(trimmed)
        let hostname = aggressiveUrl.hostname.toLowerCase()
        if (hostname.startsWith('www.')) {
          hostname = hostname.substring(4)
        }
        const normalizedPath = aggressiveUrl.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
        const params = new URLSearchParams(aggressiveUrl.search)

        // Remove tracking parameters
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'mc_eid', 'msclkid']
        trackingParams.forEach(param => params.delete(param))

        const sortedParams = new URLSearchParams([...params].sort())
        result.normalization.aggressive = `${aggressiveUrl.protocol}//${hostname}${aggressiveUrl.port && aggressiveUrl.port !== '443' && aggressiveUrl.port !== '80' ? ':' + aggressiveUrl.port : ''}${normalizedPath}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}`
      } catch (e) {
        result.normalization.aggressive = null
      }
    } catch (e) {
      result.normalization = { error: 'Failed to normalize URL' }
    }

    // Canonical form (for reference)
    try {
      let hostname = url.hostname.toLowerCase()
      const normalizedPath = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
      const params = new URLSearchParams(url.search)
      const sortedParams = new URLSearchParams([...params].sort())
      result.canonical = `${url.protocol}//${hostname}${url.port ? ':' + url.port : ''}${normalizedPath}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}${url.hash}`
    } catch (e) {
      result.canonical = null
    }

    // Domain analysis
    if (tldts) {
      try {
        result.domain = {
          hostname: url.hostname,
          rootDomain: tldts.getDomain(url.hostname) || url.hostname,
          subdomain: tldts.getSubdomain(url.hostname) || '(none)',
          tld: tldts.getPublicSuffix(url.hostname) || url.hostname.split('.').pop(),
        }
      } catch (e) {
        result.domain = { error: 'Failed to analyze domain' }
      }
    } else {
      result.domain = {
        hostname: url.hostname,
      }
    }

    // Tracking parameter removal
    try {
      const cleanUrl = new URL(cleanedText)
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'mc_eid', 'msclkid'
      ]

      // First pass: collect keys to delete (don't delete while iterating)
      const keysToDelete = []
      const removedParams = []

      for (const [key] of cleanUrl.searchParams) {
        // Check if the key (after cleaning) matches any tracking params
        const cleanedKey = key.trim().replace(/^n(?=[a-zA-Z0-9_-])/, '')
        if (trackingParams.includes(cleanedKey)) {
          keysToDelete.push(key)
          removedParams.push(cleanedKey)
        }
      }

      // Second pass: delete the collected keys
      keysToDelete.forEach(key => {
        cleanUrl.searchParams.delete(key)
      })

      result.tracking = {
        cleaned: cleanUrl.toString(),
        removedParams: removedParams,
        hasTrackingParams: removedParams.length > 0,
      }
    } catch (e) {
      result.tracking = { error: 'Failed to process tracking params' }
    }

    // Punycode handling
    if (punycodeModule) {
      try {
        result.punycode = {
          hostname: url.hostname,
          encoded: punycodeModule.toASCII(url.hostname),
          decoded: punycodeModule.toUnicode(url.hostname),
        }
      } catch (e) {
        result.punycode = { error: 'Failed to process punycode' }
      }
    }

    // Query Parameters Deep-Dive Analysis
    try {
      result.queryParamDeepDive = analyzeQueryParamDeepDive(url)
    } catch (e) {
      result.queryParamDeepDive = { error: 'Failed to analyze query parameters: ' + e.message }
    }

    // Calculate URL Safety Grade
    try {
      result.urlSafety = calculateURLSafetyGrade(cleanedText, result.queryParamDeepDive)
    } catch (e) {
      result.urlSafety = {
        grade: 'F',
        score: 0,
        category: 'Error',
        summary: ['Failed to calculate safety grade'],
        recommendation: 'Unable to analyze URL'
      }
    }

    // Path Segments Breakdown
    try {
      result.pathSegments = analyzePathSegments(url.pathname)
    } catch (e) {
      result.pathSegments = { error: 'Failed to analyze path segments: ' + e.message }
    }

    return result
  } catch (error) {
    return { error: 'Invalid URL format: ' + error.message }
  }
}

function analyzeQueryParamDeepDive(url) {
  const result = {
    parameters: [],
    anomalies: [],
    summary: {
      totalParams: 0,
      duplicateParams: 0,
      emptyParams: 0,
      trackingParams: 0,
      sensitiveDataDetected: false,
    }
  }

  try {
    const params = new URLSearchParams(url.search)
    const paramMap = {}
    const seenCleanKeys = {}

    // Collect all parameters with cleaned keys
    for (const [rawKey, value] of params) {
      // Clean the key: trim, remove whitespace, and strip leading "n" from escaped newline artifacts
      let cleanKey = rawKey.trim()

      // Strip leading "n" if it came from \n escape sequences (only if followed by letter/number/underscore/hyphen)
      cleanKey = cleanKey.replace(/^n(?=[a-zA-Z0-9_-])/, '')

      // Skip empty keys
      if (!cleanKey) continue

      if (!paramMap[cleanKey]) {
        paramMap[cleanKey] = []
      }
      paramMap[cleanKey].push(value)
    }

    result.summary.totalParams = Object.keys(paramMap).length

    // Analyze each parameter
    for (const [key, values] of Object.entries(paramMap)) {
      const analysis = analyzeParamKey(key, values)
      result.parameters.push(analysis)

      // Count anomalies
      if (values.length > 1) {
        result.summary.duplicateParams++
        result.anomalies.push({
          type: 'duplicate',
          key,
          message: `Parameter "${key}" appears ${values.length} times`,
          severity: 'warning'
        })
      }

      if (values.some(v => !v || v.trim() === '')) {
        result.summary.emptyParams++
        result.anomalies.push({
          type: 'empty',
          key,
          message: `Parameter "${key}" contains empty value`,
          severity: 'info'
        })
      }

      if (analysis.isTracking) {
        result.summary.trackingParams++
      }

      if (analysis.riskLevel === 'high') {
        result.summary.sensitiveDataDetected = true
      }
    }
  } catch (e) {
    result.error = 'Failed to analyze query parameters: ' + e.message
  }

  return result
}

function analyzeParamKey(key, values) {
  // Key is already cleaned by urlToolkit, just ensure trim
  const cleanedKey = key.trim()

  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'msclkid', 'dclid', 'mc_eid', 'igshid',
    'ref', 'campaign', 'source', 'medium', 'term', 'content', 'amp'
  ]

  const redirectParams = ['redirect', 'next', 'url', 'return', 'continue', 'goto', 'return_to']

  const isTracking = trackingParams.some(tp => tp.toLowerCase() === cleanedKey.toLowerCase())
  const isRedirectParam = redirectParams.some(rp => rp.toLowerCase() === cleanedKey.toLowerCase())

  const analysis = {
    key: cleanedKey,
    values: values,
    classification: [],
    risks: [],
    isTracking,
    riskLevel: 'low'
  }

  // Analyze each value
  values.forEach((value, index) => {
    const classifications = classifyParameterValue(value)
    const risks = detectParameterRisks(cleanedKey, value, classifications, isRedirectParam, index)

    if (classifications.length > 0) {
      classifications.forEach(cls => {
        analysis.classification.push({
          ...cls,
          valueIndex: index
        })
      })
    }

    if (risks.length > 0) {
      risks.forEach(risk => {
        analysis.risks.push({
          ...risk,
          valueIndex: index
        })
      })
      const maxRisk = Math.max(...risks.map(r => r.severity === 'high' ? 3 : r.severity === 'warning' ? 2 : 1))
      if (maxRisk > (analysis.riskLevel === 'high' ? 3 : analysis.riskLevel === 'warning' ? 2 : 1)) {
        analysis.riskLevel = maxRisk >= 3 ? 'high' : maxRisk >= 2 ? 'warning' : 'low'
      }
    }
  })

  if (isTracking) {
    analysis.classification.push({
      type: 'Tracking Parameter',
      description: 'Used for analytics/marketing',
      emoji: '📊'
    })
  }

  return analysis
}

const PATTERN_EMOJI_MAP = {
  email: '📧',
  url: '🔗',
  jwt: '🔐',
  'jwt-loose': '🔐',
  'jwt-batch7': '🔐',
  base64: '🔒',
  'base64-batch7': '🔒',
  uuid: '🆔',
  integer: '🔢',
  number: '🔢',
  'hex-number': '🔤',
  'hex-number-batch7': '🔤',
  currency: '💰',
  phone: '📱',
  json: '📋',
  ipv4: '🌐',
  ipv6: '🌐',
  'credit-card': '💳',
  'ssn-us': '🔐',
  'us-zip': '📮',
  'mac-address': '🖥️',
}

function decodeURIComponentSafe(value) {
  if (!value || typeof value !== 'string') return value
  try {
    return decodeURIComponent(value)
  } catch (e) {
    return value
  }
}

function detectJWT(value) {
  if (!value || typeof value !== 'string') return null
  const jwtTemplate = REGEX_PATTERN_TEMPLATES.jwt
  if (!jwtTemplate) return null

  const jwtRegex = new RegExp(`^${jwtTemplate.pattern}$`, jwtTemplate.flags)
  if (jwtRegex.test(value)) {
    return {
      type: jwtTemplate.name,
      emoji: '🔐',
      description: jwtTemplate.description
    }
  }

  // Also check loose JWT pattern if available
  const jwtLooseTemplate = REGEX_PATTERN_TEMPLATES['jwt-loose']
  if (jwtLooseTemplate) {
    const looseRegex = new RegExp(`^${jwtLooseTemplate.pattern}$`, jwtLooseTemplate.flags)
    if (looseRegex.test(value)) {
      return {
        type: jwtLooseTemplate.name,
        emoji: '🔐',
        description: jwtLooseTemplate.description
      }
    }
  }

  return null
}

function detectEmail(value) {
  if (!value || typeof value !== 'string') return null
  const emailTemplate = REGEX_PATTERN_TEMPLATES.email
  if (!emailTemplate) return null

  const emailRegex = new RegExp(`^${emailTemplate.pattern}$`, emailTemplate.flags || '')
  if (emailRegex.test(value)) {
    return {
      type: emailTemplate.name,
      emoji: '📧',
      description: emailTemplate.description
    }
  }
  return null
}

function detectURL(value) {
  if (!value || typeof value !== 'string') return null
  const urlTemplate = REGEX_PATTERN_TEMPLATES.url
  if (!urlTemplate) return null

  const urlRegex = new RegExp(urlTemplate.pattern, urlTemplate.flags || '')
  if (urlRegex.test(value)) {
    return {
      type: urlTemplate.name,
      emoji: '🔗',
      description: urlTemplate.description
    }
  }
  return null
}

function detectBase64JSON(value) {
  if (!value || typeof value !== 'string' || value.length < 20) return null
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/
  if (!base64Pattern.test(value)) return null

  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8')
    if (/^[\s]*[\{\[]/.test(decoded)) {
      try {
        JSON.parse(decoded)
        return {
          type: 'Base64 JSON',
          emoji: '📦',
          description: 'Base64 encoded JSON data'
        }
      } catch (e) {
        return null
      }
    }
  } catch (e) {
    return null
  }
  return null
}

function detectBase64(value) {
  if (!value || typeof value !== 'string' || value.length < 20) return null
  const base64Template = REGEX_PATTERN_TEMPLATES.base64
  if (!base64Template) return null

  const base64Regex = new RegExp(base64Template.pattern, base64Template.flags || '')
  if (base64Regex.test(value)) {
    return {
      type: base64Template.name,
      emoji: '🔒',
      description: base64Template.description
    }
  }
  return null
}

function detectCreditCard(value) {
  if (!value || typeof value !== 'string') return null
  const ccTemplate = REGEX_PATTERN_TEMPLATES['credit-card-strict'] || REGEX_PATTERN_TEMPLATES.creditCardStrict
  if (!ccTemplate) return null

  const ccRegex = new RegExp(ccTemplate.pattern, ccTemplate.flags || '')
  if (ccRegex.test(value.replace(/\s-/g, ''))) {
    return {
      type: ccTemplate.name,
      emoji: '💳',
      description: ccTemplate.description
    }
  }
  return null
}

function detectSQLInjection(value) {
  if (!value || typeof value !== 'string') return null
  const sqlPattern = /(union(\s+all)?\s+select|sleep\s*\(|benchmark\s*\(|or\s+['"]?1['"]?\s*=|';|--|#|\bselect\b|\bupdate\b|\bdrop\b|\binsert\b|\bdelete\b)/i
  if (sqlPattern.test(value)) {
    return {
      type: 'SQL Injection Risk',
      emoji: '⚠️',
      description: 'Potential SQL injection payload'
    }
  }
  return null
}

function detectXSS(value) {
  if (!value || typeof value !== 'string') return null
  const xssPattern = /<|>|\bscript\b|javascript:|on\w+\s*=|<\w+/i
  if (xssPattern.test(value)) {
    return {
      type: 'XSS Risk',
      emoji: '⚠️',
      description: 'Potential XSS injection payload'
    }
  }
  return null
}

function detectUUID(value) {
  if (!value || typeof value !== 'string') return null
  const uuidTemplate = REGEX_PATTERN_TEMPLATES.uuid
  if (!uuidTemplate) return null

  const uuidRegex = new RegExp(`^${uuidTemplate.pattern}$`, uuidTemplate.flags || '')
  if (uuidRegex.test(value)) {
    return {
      type: uuidTemplate.name,
      emoji: '🆔',
      description: uuidTemplate.description
    }
  }
  return null
}

function detectPureInteger(value) {
  if (!value || typeof value !== 'string') return null
  const intTemplate = REGEX_PATTERN_TEMPLATES.integer
  if (!intTemplate) return null

  const intRegex = new RegExp(`^${intTemplate.pattern}$`, intTemplate.flags || '')
  if (intRegex.test(value)) {
    return {
      type: intTemplate.name,
      emoji: '🔢',
      description: intTemplate.description
    }
  }
  return null
}

function detectSlugLike(value) {
  if (!value || typeof value !== 'string') return null
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/i
  const hasLettersAndNumbers = /[a-zA-Z]/.test(value) && /\d/.test(value)
  if (slugPattern.test(value) && hasLettersAndNumbers) {
    return {
      type: 'Slug-like Identifier',
      emoji: '🏷️',
      description: 'Hyphenated identifier (e.g., user-123)'
    }
  }
  return null
}

function detectIPv4(value) {
  if (!value || typeof value !== 'string') return null
  const ipv4Template = REGEX_PATTERN_TEMPLATES.ipv4
  if (!ipv4Template) return null

  const ipv4Regex = new RegExp(`^${ipv4Template.pattern}$`, ipv4Template.flags || '')
  if (ipv4Regex.test(value)) {
    return {
      type: ipv4Template.name,
      emoji: '🌐',
      description: ipv4Template.description
    }
  }
  return null
}

function detectIPv6(value) {
  if (!value || typeof value !== 'string') return null
  const ipv6Template = REGEX_PATTERN_TEMPLATES.ipv6 || REGEX_PATTERN_TEMPLATES['ipv6-full']
  if (!ipv6Template) return null

  const ipv6Regex = new RegExp(`^${ipv6Template.pattern}$`, ipv6Template.flags || '')
  if (ipv6Regex.test(value)) {
    return {
      type: ipv6Template.name,
      emoji: '🌐',
      description: ipv6Template.description
    }
  }
  return null
}

function detectPhoneNumber(value) {
  if (!value || typeof value !== 'string') return null

  // Try international phone format first
  const phoneTemplate = REGEX_PATTERN_TEMPLATES['phone-intl-broad'] || REGEX_PATTERN_TEMPLATES['intl-phone']
  if (phoneTemplate) {
    const phoneRegex = new RegExp(phoneTemplate.pattern, phoneTemplate.flags || '')
    if (phoneRegex.test(value)) {
      return {
        type: 'Phone Number',
        emoji: '📱',
        description: phoneTemplate.description
      }
    }
  }

  // Fallback to custom pattern if toolkit doesn't have it
  const phonePattern = /^\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{2,4}$/
  if (phonePattern.test(value)) {
    return {
      type: 'Phone Number',
      emoji: '📱',
      description: 'International or local phone number'
    }
  }
  return null
}

function detectYouTubeVideo(value) {
  if (!value || typeof value !== 'string') return null
  const youtubeTemplate = REGEX_PATTERN_TEMPLATES['youtube-id'] || REGEX_PATTERN_TEMPLATES.youtubeId
  if (!youtubeTemplate) return null

  const youtubeRegex = new RegExp(youtubeTemplate.pattern, youtubeTemplate.flags || '')
  const match = youtubeRegex.exec(value)
  if (match && (match[1] || match[0])) {
    const videoId = match[1] || match[0]
    return {
      type: youtubeTemplate.name,
      emoji: '▶️',
      description: `YouTube video ID: ${videoId}`
    }
  }
  return null
}

function detectVideoURL(value) {
  if (!value || typeof value !== 'string') return null
  const videoPattern = /\.(mp4|webm|mkv|avi|mov|flv|wmv|m3u8)$/i
  if (videoPattern.test(value)) {
    return {
      type: 'Video URL',
      emoji: '🎬',
      description: 'Video file format detected'
    }
  }
  return null
}

function detectHTTPRedirect(value) {
  if (!value || typeof value !== 'string') return null
  if (value.toLowerCase().startsWith('http://')) {
    return {
      type: 'HTTP Redirect',
      emoji: '⚠️',
      description: 'Non-encrypted HTTP URL (security risk)'
    }
  }
  return null
}

function classifyParameterValue(value) {
  const classifications = []

  if (!value || value.trim() === '') {
    return classifications
  }

  let decodedValue = decodeURIComponentSafe(value)
  const trimmedValue = decodedValue.trim()

  // HIGH PRIORITY: These override everything else
  let highPriority = null

  // Exclude file paths/names from JWT detection (files have extensions like .php, .json, etc.)
  const hasFileExtension = /\.[a-zA-Z0-9]{1,6}$/.test(trimmedValue)

  if (!hasFileExtension) {
    highPriority = detectJWT(trimmedValue)
    if (highPriority) {
      classifications.push(highPriority)
      return classifications
    }
  }

  highPriority = detectURL(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)

    // Check for HTTP redirect security issue
    const httpRedirect = detectHTTPRedirect(trimmedValue)
    if (httpRedirect) {
      classifications.push(httpRedirect)
    }

    // Check for YouTube/Video patterns
    const youtubeVideo = detectYouTubeVideo(trimmedValue)
    if (youtubeVideo) {
      classifications.push(youtubeVideo)
    }

    const videoUrl = detectVideoURL(trimmedValue)
    if (videoUrl) {
      classifications.push(videoUrl)
    }

    return classifications
  }

  highPriority = detectEmail(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectBase64JSON(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectCreditCard(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectSQLInjection(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectXSS(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  // MEDIUM PRIORITY: Apply if high-priority ones don't match
  highPriority = detectUUID(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
  }

  highPriority = detectIPv4(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectIPv6(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectPhoneNumber(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectSlugLike(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
    return classifications
  }

  highPriority = detectPureInteger(trimmedValue)
  if (highPriority) {
    classifications.push(highPriority)
  }

  // If not a pure integer, check for base64
  if (classifications.length === 0) {
    highPriority = detectBase64(trimmedValue)
    if (highPriority) {
      classifications.push(highPriority)
    }
  }

  // LOW PRIORITY: Additional pattern matching
  const patternTests = [
    'number', 'hex-number', 'currency', 'phone', 'ipv4', 'ipv6', 'ssn-us'
  ]

  for (const patternId of patternTests) {
    const template = REGEX_PATTERN_TEMPLATES[patternId]
    if (!template) continue

    try {
      const regex = new RegExp(`^${template.pattern}$`, template.flags?.replace('g', '') || '')
      if (regex.test(trimmedValue)) {
        classifications.push({
          type: template.name,
          emoji: PATTERN_EMOJI_MAP[patternId] || '✓',
          description: template.description
        })
      }
    } catch (e) {
      // Skip patterns that fail to compile
    }
  }

  // Special handling: JSON detection
  if ((trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) && (trimmedValue.endsWith('}') || trimmedValue.endsWith(']'))) {
    try {
      JSON.parse(trimmedValue)
      if (!classifications.some(c => c.type.includes('JSON'))) {
        classifications.push({
          type: 'JSON',
          emoji: '📋',
          description: 'JSON formatted data'
        })
      }
    } catch (e) {
      // Not valid JSON
    }
  }

  // Deduplicate classifications by type to avoid redundant entries
  const seen = new Set()
  const uniqueClassifications = classifications.filter(cls => {
    if (seen.has(cls.type)) {
      return false
    }
    seen.add(cls.type)
    return true
  })

  return uniqueClassifications
}

function getHarmfulDomains() {
  return [
    'bit.ly', 'tinyurl.com', 'short.link',
    'paypai.com', 'amazoin.com', 'goog1e.com',
    'test.com', 'example.com', 'localhost'
  ]
}

function getFileExtensionRisks() {
  return {
    critical: ['.php', '.exe', '.sh', '.env', '.sql', '.bak'],
    high: ['.zip', '.tar', '.tar.gz', '.rar', '.7z', '.csv', '.db']
  }
}

function checkHarmfulRedirect(url) {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.toLowerCase()
    const harmfulDomains = getHarmfulDomains()

    for (const harmful of harmfulDomains) {
      if (domain.includes(harmful)) {
        return true
      }
    }

    const tld = domain.split('.').pop()
    const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf']
    if (suspiciousTLDs.includes(tld)) {
      return true
    }

    return false
  } catch (e) {
    return false
  }
}

function analyzeFileExtensionRisk(value) {
  if (!value || typeof value !== 'string') return null

  const risks = getFileExtensionRisks()
  const lowerValue = value.toLowerCase()

  for (const ext of risks.critical) {
    if (lowerValue.endsWith(ext)) {
      return {
        type: 'Critical File Risk',
        severity: 'high',
        description: `File extension "${ext}" is dangerous and exposes critical resources`
      }
    }
  }

  for (const ext of risks.high) {
    if (lowerValue.endsWith(ext)) {
      return {
        type: 'File Risk',
        severity: 'warning',
        description: `File extension "${ext}" may contain sensitive data`
      }
    }
  }

  return null
}

function calculateURLSafetyGrade(url, queryParamDeepDive) {
  let score = 100
  const issues = []

  try {
    const urlObj = new URL(url)

    // Check HTTPS (baseline: +5 for HTTPS)
    const isHttps = urlObj.protocol === 'https:'
    if (!isHttps) {
      score -= 10
      issues.push('Uses unencrypted HTTP instead of HTTPS')
    } else {
      score += 5
    }

    // Check for tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'msclkid', 'dclid', 'mc_eid', 'igshid']
    let trackingCount = 0
    trackingParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        trackingCount++
      }
    })
    if (trackingCount > 0) {
      score -= (trackingCount * 3)
      issues.push(`Contains ${trackingCount} tracking parameter${trackingCount > 1 ? 's' : ''}`)
    } else {
      score += 5
    }

    // Check for duplicate parameters
    if (queryParamDeepDive && queryParamDeepDive.summary && queryParamDeepDive.summary.duplicateParams > 0) {
      score -= 5
      issues.push(`Contains ${queryParamDeepDive.summary.duplicateParams} duplicate parameter${queryParamDeepDive.summary.duplicateParams > 1 ? 's' : ''}`)
    }

    // Check for anomalies and risks in parameters
    if (queryParamDeepDive && queryParamDeepDive.parameters) {
      for (const param of queryParamDeepDive.parameters) {
        if (param.risks && param.risks.length > 0) {
          for (const risk of param.risks) {
            if (risk.severity === 'high') {
              if (risk.type === 'Open Redirect') {
                score -= 20
                issues.push('Open redirect vulnerability detected')
              } else if (risk.type === 'Token Exposure') {
                score -= 25
                issues.push('JWT token exposed in URL')
              } else if (risk.type === 'Payment Data Exposure') {
                score -= 30
                issues.push('Credit card number detected in URL')
              } else if (risk.type === 'SQL Injection Pattern' || risk.type.includes('SQL')) {
                score -= 30
                issues.push('SQL injection payload detected')
              } else if (risk.type === 'XSS Pattern' || risk.type.includes('XSS')) {
                score -= 25
                issues.push('XSS attack pattern detected')
              } else if (risk.type === 'Suspicious Domain') {
                score -= 15
                issues.push('Redirect targets suspicious/phishing domain')
              }
            } else if (risk.severity === 'warning') {
              if (risk.type === 'Insecure HTTP Redirect') {
                score -= 10
                issues.push('HTTP redirect detected (not HTTPS)')
              } else if (risk.type === 'PII Exposure') {
                score -= 10
                issues.push('Personal information (email/phone) exposed in URL')
              } else if (risk.type === 'File Risk' || risk.type === 'Critical File Risk') {
                score -= 20
                issues.push('Dangerous file extension in URL')
              }
            }
          }
        }

        if (param.classification && param.classification.length > 0) {
          for (const cls of param.classification) {
            const clsType = cls.type || ''
            if (clsType.includes('Base64 JSON')) {
              score -= 5
              if (!issues.includes('Base64-encoded JSON detected')) {
                issues.push('Base64-encoded JSON detected')
              }
            } else if (clsType === 'Private/Reserved IP') {
              score -= 5
              if (!issues.includes('Private/reserved IP address in URL')) {
                issues.push('Private/reserved IP address in URL')
              }
            }
          }
        }
      }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score))

    // Map score to grade
    let grade, category, recommendation

    if (score >= 95) {
      grade = 'A+'
      category = 'Excellent'
      recommendation = 'This URL appears safe. No significant security or privacy concerns detected.'
    } else if (score >= 85) {
      grade = 'A'
      category = 'Good'
      recommendation = 'Minor hygiene issues detected. Consider removing tracking parameters for cleaner URLs.'
    } else if (score >= 70) {
      grade = 'B'
      category = 'Acceptable'
      recommendation = 'Contains minor risks (emails, internal IPs). Use caution when sharing this URL.'
    } else if (score >= 50) {
      grade = 'C'
      category = 'Caution'
      recommendation = 'Moderate risks detected. Avoid sharing this URL publicly. Remove sensitive parameters.'
    } else if (score >= 30) {
      grade = 'D'
      category = 'Serious Risk'
      recommendation = 'Significant security risks detected. Review the URL and remove sensitive data immediately.'
    } else {
      grade = 'F'
      category = 'Critical Risk'
      recommendation = 'CRITICAL: This URL contains dangerous payloads. Do NOT open or share this URL.'
    }

    return {
      grade,
      score,
      category,
      summary: issues.length > 0 ? issues : ['No significant issues detected'],
      recommendation
    }
  } catch (error) {
    return {
      grade: 'F',
      score: 0,
      category: 'Invalid URL',
      summary: ['URL parsing failed'],
      recommendation: 'Unable to analyze this URL'
    }
  }
}

function detectParameterRisks(paramKey, paramValue, classifications, isRedirectParam, valueIndex) {
  const risks = []

  // Open redirect vulnerability with harmful domain check
  if (isRedirectParam && classifications.some(c => c.type === 'URL')) {
    risks.push({
      type: 'Open Redirect',
      severity: 'high',
      description: `Parameter "${paramKey}" contains URL - possible open redirect vulnerability`
    })

    if (checkHarmfulRedirect(paramValue)) {
      risks.push({
        type: 'Suspicious Domain',
        severity: 'high',
        description: `Redirect target is a known phishing or disposable domain`
      })
    }

    // Check for HTTP (non-HTTPS) redirect
    if (paramValue.toLowerCase().startsWith('http://')) {
      risks.push({
        type: 'Insecure HTTP Redirect',
        severity: 'warning',
        description: `Redirect uses unencrypted HTTP instead of HTTPS`
      })
    }
  }

  // Phone number exposure (PII)
  if (classifications.some(c => c.type === 'Phone Number')) {
    risks.push({
      type: 'PII Exposure',
      severity: 'warning',
      description: `Parameter contains phone number - personal data exposed in URL`
    })
  }

  // Token exposure
  if (classifications.some(c => c.type === 'JWT Token')) {
    risks.push({
      type: 'Token Exposure',
      severity: 'high',
      description: `Parameter contains authentication token - potential credential leak`
    })
  }

  // Email exposure (PII)
  if (classifications.some(c => c.type === 'Email Address')) {
    risks.push({
      type: 'PII Exposure',
      severity: 'warning',
      description: `Parameter contains email address - personal data exposed in URL`
    })
  }

  // Credit card exposure
  if (classifications.some(c => c.type === 'Credit Card')) {
    risks.push({
      type: 'Payment Data Exposure',
      severity: 'high',
      description: `Parameter contains credit card number - critical payment data leak`
    })
  }

  // SQL injection - check both encoded and decoded versions
  if (classifications.some(c => c.type === 'SQL Injection Risk')) {
    risks.push({
      type: 'SQL Injection Risk',
      severity: 'high',
      description: `Parameter contains potential SQL injection patterns`
    })
  } else {
    const decodedParam = decodeURIComponentSafe(paramValue)
    if (detectSQLInjection(decodedParam)) {
      if (!classifications.some(c => c.type === 'SQL Injection Risk')) {
        classifications.unshift({
          type: 'SQL Injection Pattern',
          emoji: '💉',
          description: 'Parameter contains SQL injection operators'
        })
      }
      risks.push({
        type: 'SQL Injection Risk',
        severity: 'high',
        description: `Parameter appears to be part of a SQL query condition`
      })
    }
  }

  // XSS injection
  if (classifications.some(c => c.type === 'XSS Risk')) {
    risks.push({
      type: 'XSS Risk',
      severity: 'high',
      description: `Parameter contains characters potentially used in XSS attacks`
    })
  }

  // File extension risk analysis
  const fileRisk = analyzeFileExtensionRisk(paramValue)
  if (fileRisk) {
    risks.push(fileRisk)
  }

  return risks
}

function analyzePathSegments(pathname) {
  const result = {
    segments: [],
    analysis: {
      hasFileExtension: false,
      isRestStyle: false,
      resourceCount: 0,
      idCount: 0,
    }
  }

  try {
    // Remove leading/trailing slashes and split
    const path = pathname.replace(/^\/+|\/+$/g, '')
    if (!path) {
      result.segments = []
      return result
    }

    const parts = path.split('/')

    parts.forEach((segment, index) => {
      if (!segment) return

      const analysis = analyzePathSegment(segment)
      result.segments.push({
        index,
        segment,
        ...analysis
      })

      if (analysis.type === 'id' || analysis.type === 'uuid') {
        result.analysis.idCount++
      }
      if (analysis.type === 'resource' || analysis.type === 'slug') {
        result.analysis.resourceCount++
      }
      if (analysis.hasExtension) {
        result.analysis.hasFileExtension = true
      }
    })

    // REST API detection: pattern like /resource/:id/subresource/:id
    const hasIdPattern = parts.some(p => /^\d+$/.test(p) || /^[0-9a-f]{8}-[0-9a-f]{4}/.test(p))
    const hasResourcePattern = parts.some(p => /^[a-z][a-z0-9]*$/.test(p))
    result.analysis.isRestStyle = hasIdPattern && hasResourcePattern

  } catch (e) {
    result.error = 'Failed to analyze path: ' + e.message
  }

  return result
}

function analyzePathSegment(segment) {
  const analysis = {
    type: 'unknown',
    classification: [],
    hasExtension: false,
    extension: null,
    description: ''
  }

  if (!segment) return analysis

  // Check for file extension
  const extensionMatch = segment.match(/\.([a-zA-Z0-9]{1,6})$/)
  if (extensionMatch) {
    analysis.hasExtension = true
    analysis.extension = extensionMatch[1].toLowerCase()

    // Dangerous extensions
    if (['php', 'exe', 'dll', 'sh', 'bat', 'cmd', 'py', 'pl'].includes(analysis.extension)) {
      analysis.classification.push({
        type: 'Dangerous Extension',
        emoji: '⚠️',
        severity: 'warning',
        description: `${analysis.extension.toUpperCase()} executable/script file`
      })
    }

    analysis.classification.push({
      type: 'File',
      emoji: '📄',
      description: `File: ${segment}`
    })

    analysis.type = 'file'
    return analysis
  }

  // UUID detection (use regex library)
  if (REGEX_PATTERN_TEMPLATES.uuid) {
    const uuidRegex = new RegExp(`^${REGEX_PATTERN_TEMPLATES.uuid.pattern}$`, REGEX_PATTERN_TEMPLATES.uuid.flags)
    if (uuidRegex.test(segment)) {
      analysis.type = 'uuid'
      analysis.classification.push({
        type: REGEX_PATTERN_TEMPLATES.uuid.name,
        emoji: '🆔',
        description: 'UUID identifier'
      })
      return analysis
    }
  }

  // Unix timestamp detection (10-13 digit number)
  if (/^\d{10}(\d{3})?$/.test(segment)) {
    analysis.type = 'timestamp'
    analysis.classification.push({
      type: 'Unix Timestamp',
      emoji: '⏱️',
      description: `Unix timestamp: ${segment}`
    })
    return analysis
  }

  // ISO date detection (YYYY-MM-DD)
  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(segment)) {
    analysis.type = 'iso-date'
    analysis.classification.push({
      type: 'ISO Date',
      emoji: '📅',
      description: `ISO date: ${segment}`
    })
    return analysis
  }

  // Numeric ID (use regex library)
  if (REGEX_PATTERN_TEMPLATES.integer) {
    const intRegex = new RegExp(`^${REGEX_PATTERN_TEMPLATES.integer.pattern}$`, REGEX_PATTERN_TEMPLATES.integer.flags)
    if (intRegex.test(segment)) {
      analysis.type = 'id'
      analysis.classification.push({
        type: 'Numeric ID',
        emoji: '🔢',
        description: `Resource ID: ${segment}`
      })
      return analysis
    }
  }

  // Hex ID (use regex library)
  if (REGEX_PATTERN_TEMPLATES['hex-number']) {
    const hexRegex = new RegExp(`^${REGEX_PATTERN_TEMPLATES['hex-number'].pattern}$`, REGEX_PATTERN_TEMPLATES['hex-number'].flags)
    if (hexRegex.test(segment)) {
      analysis.type = 'hex-id'
      analysis.classification.push({
        type: 'Hexadecimal ID',
        emoji: '🔤',
        description: 'Hexadecimal identifier'
      })
      return analysis
    }
  }

  // Version number (v1, v2, etc.) - custom pattern (not in library)
  if (/^v\d+(?:\.\d+)*$/.test(segment)) {
    analysis.type = 'version'
    analysis.classification.push({
      type: 'Version',
      emoji: '📌',
      description: `API/Resource version: ${segment}`
    })
    return analysis
  }

  // Hash-like strings (MD5, SHA1, SHA256)
  if (/^[a-f0-9]{32}$/.test(segment)) {
    analysis.type = 'hash-md5'
    analysis.classification.push({
      type: 'MD5 Hash',
      emoji: '🔐',
      description: `MD5 hash: ${segment}`
    })
    return analysis
  }

  if (/^[a-f0-9]{40}$/.test(segment)) {
    analysis.type = 'hash-sha1'
    analysis.classification.push({
      type: 'SHA1 Hash',
      emoji: '🔐',
      description: `SHA1 hash: ${segment}`
    })
    return analysis
  }

  if (/^[a-f0-9]{64}$/.test(segment)) {
    analysis.type = 'hash-sha256'
    analysis.classification.push({
      type: 'SHA256 Hash',
      emoji: '🔐',
      description: `SHA256 hash: ${segment}`
    })
    return analysis
  }

  // Base64-like encoded segment
  if (/^[A-Za-z0-9_-]{16,}={0,2}$/.test(segment) && segment.length > 15) {
    analysis.type = 'encoded'
    analysis.classification.push({
      type: 'Encoded Segment',
      emoji: '📦',
      description: `Base64 or URL-encoded data: ${segment}`
    })
    return analysis
  }

  // Slug pattern (kebab-case) - custom pattern (not in library)
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) {
    analysis.type = 'slug'
    analysis.classification.push({
      type: 'Slug',
      emoji: '🏷️',
      description: `URL slug: ${segment}`
    })
    return analysis
  }

  // camelCase or snake_case resource name - custom pattern (not in library)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(segment)) {
    analysis.type = 'resource'
    analysis.classification.push({
      type: 'Resource',
      emoji: '📦',
      description: `Resource name: ${segment}`
    })
    return analysis
  }

  // Default: unknown/misc type
  analysis.type = 'misc'
  analysis.classification.push({
    type: 'Segment',
    emoji: '📍',
    description: `Path segment: ${segment}`
  })

  return analysis
}

// Wrapper function to maintain compatibility
function jwtDecoder(text) {
  return enhancedJwtDecoder(text)
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


// Helper: Levenshtein distance for fuzzy matching
function levenshteinDist(a, b) {
  const aLen = a.length, bLen = b.length
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

// Enhanced MIME database with metadata
const ENHANCED_MIME_DATABASE = {
  html: { mime: 'text/html', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'HTML document', securityNotes: ['Potentially executable in browser', 'Treat as untrusted input', 'Vulnerable to XSS attacks'], commonApplications: ['Chrome', 'Firefox', 'Safari'] },
  htm: { mime: 'text/html', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'HTML document', securityNotes: ['Potentially executable in browser', 'Treat as untrusted input'], commonApplications: ['Chrome', 'Firefox'] },
  css: { mime: 'text/css', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'CSS stylesheet', securityNotes: ['Can include external resources', 'Careful with @import directives'], commonApplications: ['Chrome', 'Firefox'] },
  js: { mime: 'application/javascript', category: 'code', binary: false, compressible: true, charsets: ['utf-8'], description: 'JavaScript code', securityNotes: ['Executable script', 'CSP relevant', 'Code execution risk'], commonApplications: ['Node.js', 'All browsers'] },
  mjs: { mime: 'application/javascript', category: 'code', binary: false, compressible: true, charsets: ['utf-8'], description: 'JavaScript ES module', securityNotes: ['Executable module script', 'Modern JavaScript'], commonApplications: ['Node.js', 'Modern browsers'] },
  json: { mime: 'application/json', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'JSON data', securityNotes: ['Text-based, safe if parsed correctly', 'Avoid eval() parsing'], commonApplications: ['All languages', 'APIs'] },
  xml: { mime: 'application/xml', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'XML document', securityNotes: ['Watch for XXE attacks', 'Validate schema'], commonApplications: ['SOAP', 'Configuration files'] },
  pdf: { mime: 'application/pdf', category: 'document', binary: true, compressible: false, charsets: [], description: 'Portable Document Format', securityNotes: ['May contain embedded scripts', 'Always sanitize before processing', 'Verify digital signatures'], commonApplications: ['Adobe Acrobat', 'Chrome', 'Firefox'] },
  doc: { mime: 'application/msword', category: 'document', binary: true, compressible: false, charsets: [], description: 'Microsoft Word 97-2003', securityNotes: ['May contain macros', 'Older format, use docx instead'], commonApplications: ['Microsoft Word'] },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', binary: true, compressible: true, charsets: [], description: 'Microsoft Word 2007+', securityNotes: ['May contain macros', 'ZIP container format'], commonApplications: ['Microsoft Word', 'LibreOffice'] },
  xls: { mime: 'application/vnd.ms-excel', category: 'document', binary: true, compressible: false, charsets: [], description: 'Microsoft Excel 97-2003', securityNotes: ['May contain macros', 'Old format'], commonApplications: ['Microsoft Excel'] },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'document', binary: true, compressible: true, charsets: [], description: 'Microsoft Excel 2007+', securityNotes: ['May contain formulas', 'ZIP container'], commonApplications: ['Microsoft Excel', 'LibreOffice'] },
  ppt: { mime: 'application/vnd.ms-powerpoint', category: 'document', binary: true, compressible: false, charsets: [], description: 'Microsoft PowerPoint 97-2003', securityNotes: ['May contain macros'], commonApplications: ['Microsoft PowerPoint'] },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'document', binary: true, compressible: true, charsets: [], description: 'Microsoft PowerPoint 2007+', securityNotes: ['May contain macros', 'ZIP container'], commonApplications: ['Microsoft PowerPoint', 'LibreOffice'] },
  jpg: { mime: 'image/jpeg', category: 'image', binary: true, compressible: false, charsets: [], description: 'JPEG image (lossy)', securityNotes: ['May contain EXIF metadata', 'Strip sensitive data'], commonApplications: ['All image viewers'] },
  jpeg: { mime: 'image/jpeg', category: 'image', binary: true, compressible: false, charsets: [], description: 'JPEG image (lossy)', securityNotes: ['May contain EXIF metadata'], commonApplications: ['All image viewers'] },
  png: { mime: 'image/png', category: 'image', binary: true, compressible: true, charsets: [], description: 'PNG image (lossless)', securityNotes: ['Lossless compression, safe', 'May contain metadata'], commonApplications: ['All image viewers'] },
  gif: { mime: 'image/gif', category: 'image', binary: true, compressible: true, charsets: [], description: 'GIF image (animated)', securityNotes: ['Supports animation', 'Can be exploited with large frames'], commonApplications: ['All image viewers'] },
  webp: { mime: 'image/webp', category: 'image', binary: true, compressible: false, charsets: [], description: 'WebP image (modern)', securityNotes: ['Modern format, good compression'], commonApplications: ['Chrome', 'Firefox', 'Edge'] },
  svg: { mime: 'image/svg+xml', category: 'image', binary: false, compressible: true, charsets: ['utf-8'], description: 'Scalable Vector Graphics', securityNotes: ['XML-based, executable scripts', 'Can contain malicious content', 'Sanitize user-uploaded SVGs'], commonApplications: ['All browsers', 'Vector editors'] },
  ico: { mime: 'image/x-icon', category: 'image', binary: true, compressible: false, charsets: [], description: 'Icon file', securityNotes: ['Standard favicon format'], commonApplications: ['Browsers'] },
  mp4: { mime: 'video/mp4', category: 'video', binary: true, compressible: false, charsets: [], description: 'MPEG-4 video', securityNotes: ['Supports H.264, H.265'], commonApplications: ['All video players', 'Browsers'] },
  webm: { mime: 'video/webm', category: 'video', binary: true, compressible: false, charsets: [], description: 'WebM video (open)', securityNotes: ['Open standard', 'VP8/VP9 codec'], commonApplications: ['Chrome', 'Firefox'] },
  mp3: { mime: 'audio/mpeg', category: 'audio', binary: true, compressible: false, charsets: [], description: 'MP3 audio', securityNotes: ['Widely supported', 'May contain ID3 metadata'], commonApplications: ['All audio players', 'Browsers'] },
  wav: { mime: 'audio/wav', category: 'audio', binary: true, compressible: true, charsets: [], description: 'WAV audio', securityNotes: ['Uncompressed, large files'], commonApplications: ['All audio players'] },
  ogg: { mime: 'audio/ogg', category: 'audio', binary: true, compressible: false, charsets: [], description: 'OGG audio (Vorbis)', securityNotes: ['Open format'], commonApplications: ['Firefox', 'VLC'] },
  zip: { mime: 'application/zip', category: 'archive', binary: true, compressible: false, charsets: [], description: 'ZIP archive', securityNotes: ['Always scan for malware', 'Check for path traversal'], commonApplications: ['All OS'] },
  rar: { mime: 'application/x-rar-compressed', category: 'archive', binary: true, compressible: false, charsets: [], description: 'RAR archive', securityNotes: ['Proprietary format', 'Scan for malware'], commonApplications: ['WinRAR'] },
  '7z': { mime: 'application/x-7z-compressed', category: 'archive', binary: true, compressible: false, charsets: [], description: '7z archive', securityNotes: ['High compression', 'Scan contents'], commonApplications: ['7-Zip'] },
  gz: { mime: 'application/gzip', category: 'archive', binary: true, compressible: false, charsets: [], description: 'Gzip compressed', securityNotes: ['Often tar.gz', 'Check inner contents'], commonApplications: ['Unix/Linux'] },
  tar: { mime: 'application/x-tar', category: 'archive', binary: true, compressible: true, charsets: [], description: 'TAR archive', securityNotes: ['Watch for path traversal', 'Verify file permissions'], commonApplications: ['Unix/Linux'] },
  txt: { mime: 'text/plain', category: 'document', binary: false, compressible: true, charsets: ['utf-8', 'ascii'], description: 'Plain text', securityNotes: ['Safest format'], commonApplications: ['All text editors'] },
  csv: { mime: 'text/csv', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'CSV data', securityNotes: ['Injection attacks possible', 'Validate before use'], commonApplications: ['Spreadsheet apps'] },
  yaml: { mime: 'text/yaml', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'YAML configuration', securityNotes: ['Supports dynamic content', 'Avoid untrusted input'], commonApplications: ['Configuration files'] },
  yml: { mime: 'text/yaml', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'YAML configuration', securityNotes: ['Same as yaml'], commonApplications: ['Configuration files'] },
  toml: { mime: 'application/toml', category: 'document', binary: false, compressible: true, charsets: ['utf-8'], description: 'TOML configuration', securityNotes: ['Safe configuration format'], commonApplications: ['Config files'] },
  sh: { mime: 'application/x-sh', category: 'code', binary: false, compressible: true, charsets: ['utf-8'], description: 'Shell script', securityNotes: ['Executable code', 'Never download and execute'], commonApplications: ['Unix/Linux'] },
  exe: { mime: 'application/x-msdownload', category: 'code', binary: true, compressible: false, charsets: [], description: 'Windows executable', securityNotes: ['CRITICAL: Executable', 'Scan with antivirus', 'Never run untrusted'], commonApplications: ['Windows'] },
  dmg: { mime: 'application/x-apple-diskimage', category: 'archive', binary: true, compressible: false, charsets: [], description: 'macOS disk image', securityNotes: ['Scan for malware', 'Mount only from trusted sources'], commonApplications: ['macOS'] },
  woff: { mime: 'font/woff', category: 'font', binary: true, compressible: false, charsets: [], description: 'WOFF font', securityNotes: ['Web font format'], commonApplications: ['Browsers'] },
  woff2: { mime: 'font/woff2', category: 'font', binary: true, compressible: false, charsets: [], description: 'WOFF2 font (compressed)', securityNotes: ['Modern web font'], commonApplications: ['Modern browsers'] },
  ttf: { mime: 'font/ttf', category: 'font', binary: true, compressible: true, charsets: [], description: 'TrueType font', securityNotes: ['Can be subset for web'], commonApplications: ['All OS'] },
  otf: { mime: 'font/otf', category: 'font', binary: true, compressible: true, charsets: [], description: 'OpenType font', securityNotes: ['Advanced typography'], commonApplications: ['All OS'] },
  eot: { mime: 'application/vnd.ms-fontobject', category: 'font', binary: true, compressible: false, charsets: [], description: 'Embedded OpenType font', securityNotes: ['Legacy IE format'], commonApplications: ['Internet Explorer'] }
}

function mimeTypeLookup(text, config = {}) {
  const mode = config.mode || 'auto'
  const bulkMode = config.bulkMode || false
  const ignoreInvalid = config.ignoreInvalidLines !== false

  // Build reverse lookup
  const mimeToExts = {}
  Object.entries(ENHANCED_MIME_DATABASE).forEach(([ext, data]) => {
    const mime = data.mime
    if (!mimeToExts[mime]) mimeToExts[mime] = []
    mimeToExts[mime].push(ext)
  })

  // Helper: extract extension from filename
  function getExtFromFilename(filename) {
    const match = filename.match(/\.([a-z0-9]+)$/i)
    return match ? match[1].toLowerCase() : null
  }

  // Helper: parse content-type header
  function parseContentType(header) {
    const match = header.match(/^([^;]+)(?:;\s*(.+))?$/)
    if (!match) return null
    const mime = match[1].trim().toLowerCase()
    const params = {}
    if (match[2]) {
      match[2].split(';').forEach(param => {
        const [key, val] = param.split('=').map(s => s.trim())
        if (key) params[key.toLowerCase()] = val || true
      })
    }
    return { mime, params }
  }

  // Helper: find fuzzy matches
  function findFuzzyMatches(query, maxDistance = 2) {
    const results = []
    Object.keys(ENHANCED_MIME_DATABASE).forEach(ext => {
      const dist = levenshteinDist(query.toLowerCase(), ext.toLowerCase())
      if (dist <= maxDistance) {
        results.push({ ext, distance: dist })
      }
    })
    return results.sort((a, b) => a.distance - b.distance)
  }

  // Helper: lookup by extension
  function lookupExtension(ext) {
    const cleanExt = ext.replace(/^\./, '').toLowerCase()
    const data = ENHANCED_MIME_DATABASE[cleanExt]

    if (!data) {
      const fuzzyMatches = findFuzzyMatches(cleanExt)
      return {
        found: false,
        input: cleanExt,
        type: 'extension',
        suggestions: fuzzyMatches.map(m => ({
          extension: m.ext,
          mime: ENHANCED_MIME_DATABASE[m.ext].mime,
          distance: m.distance
        }))
      }
    }

    return {
      found: true,
      input: cleanExt,
      type: 'extension',
      extension: cleanExt,
      mime: data.mime,
      category: data.category,
      binary: data.binary,
      compressible: data.compressible,
      charsets: data.charsets,
      description: data.description,
      securityNotes: data.securityNotes,
      commonApplications: data.commonApplications
    }
  }

  // Helper: lookup by MIME type
  function lookupMime(mimeInput) {
    const cleanMime = mimeInput.toLowerCase().split(';')[0].trim()
    const extensions = mimeToExts[cleanMime]

    if (!extensions) {
      return {
        found: false,
        input: cleanMime,
        type: 'mime'
      }
    }

    const primaryExt = extensions[0]
    const data = ENHANCED_MIME_DATABASE[primaryExt]

    return {
      found: true,
      input: cleanMime,
      type: 'mime',
      mime: cleanMime,
      extensions: extensions,
      category: data.category,
      binary: data.binary,
      compressible: data.compressible,
      charsets: data.charsets,
      description: data.description,
      securityNotes: data.securityNotes,
      commonApplications: data.commonApplications
    }
  }

  // Helper: lookup by filename
  function lookupFilename(filename) {
    const cleanFilename = filename.trim().split('?')[0].split('#')[0]
    const ext = getExtFromFilename(cleanFilename)
    return {
      ...lookupExtension(ext || ''),
      filename: cleanFilename,
      extractedExtension: ext
    }
  }

  // Helper: parse and lookup content-type
  function lookupHeader(header) {
    const parsed = parseContentType(header)
    if (!parsed) {
      return { found: false, input: header, type: 'header', error: 'Invalid Content-Type format' }
    }
    const result = lookupMime(parsed.mime)
    return { ...result, type: 'header', parsedMime: parsed.mime, params: parsed.params }
  }

  // Main single lookup logic
  function performSingleLookup(input) {
    if (!input || !input.trim()) return { error: 'Empty input' }

    const trimmed = input.trim()

    // Auto-detect mode
    if (mode === 'auto') {
      if (trimmed.includes('/')) {
        // Looks like MIME type
        return lookupMime(trimmed)
      } else if (trimmed.includes('.')) {
        // Looks like filename
        return lookupFilename(trimmed)
      } else if (trimmed.includes(';')) {
        // Looks like content-type header
        return lookupHeader(trimmed)
      } else {
        // Assume extension
        return lookupExtension(trimmed)
      }
    }

    // Explicit mode
    switch (mode) {
      case 'extension':
        return lookupExtension(trimmed)
      case 'mime':
        return lookupMime(trimmed)
      case 'filename':
        return lookupFilename(trimmed)
      case 'header':
        return lookupHeader(trimmed)
      default:
        return { error: `Unknown mode: ${mode}` }
    }
  }

  // Bulk processing
  if (bulkMode) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    const results = lines.map(line => {
      const result = performSingleLookup(line)
      return { input: line, ...result }
    }).filter(r => ignoreInvalid ? r.found : true)

    return {
      mode: 'bulk',
      totalLines: lines.length,
      processedLines: results.length,
      results
    }
  }

  // Single mode
  return performSingleLookup(text)
}


function uuidValidator(text, config = {}) {
  const mode = config.mode || 'validate'

  switch (mode) {
    case 'generate-v1':
      return { generated: generateUUIDV1(), version: '1 (Time-based)' }
    case 'generate-v4':
      return { generated: generateUUIDV4(), version: '4 (Random)' }
    case 'generate-v7':
      return { generated: generateUUIDV7(), version: '7 (Unix Time-based)' }
    case 'bulk-validate':
      return { results: validateUUIDBulk(text), mode: 'bulk' }
    case 'validate':
    default:
      const validation = validateUUID(text)
      return {
        input: validation.input,
        inputFormat: validation.inputFormat,
        valid: validation.valid,
        validRFC4122: validation.validRFC4122,
        validReason: validation.validReason,
        normalized: validation.normalized,
        wasNormalized: validation.wasNormalized,
        version: validation.version,
        versionName: validation.versionName,
        versionDescription: validation.versionDescription,
        variant: validation.variant,
        type: validation.type,
        hex: validation.hex,
        raw: validation.raw,
        base64: validation.base64,
        urn: validation.urn,
        bytes: validation.bytes,
        bits: validation.bits,
        bitValidation: validation.bitValidation,
        timestamp: validation.timestamp,
        summary: validation.summary,
        errors: validation.errors,
        commonMistakes: validation.commonMistakes,
      }
  }
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
  // Configuration with defaults
  const decimals = Math.max(0, Math.min(100, parseInt(config.decimals) || 2))
  const thousandSeparator = config.thousandSeparator || ','
  const decimalSeparator = config.decimalSeparator || '.'
  const negativeStyle = config.negativeStyle || 'minus'
  const roundingMode = config.roundingMode || 'half-up'
  const formatMode = config.formatMode || 'standard'
  const bulkSeparator = config.bulkSeparator || 'newline'

  // Input sanitization
  const sanitizedInput = sanitizeInput(text.trim(), bulkSeparator === 'newline' || bulkSeparator === 'line')

  // Check if there are multiple numbers
  if (typeof sanitizedInput === 'object' && Array.isArray(sanitizedInput)) {
    // Bulk formatting
    const inputDisplays = sanitizedInput.map(num => num !== null ? String(num) : null)
    const formatted = sanitizedInput.map(num => {
      if (num === null) return null
      return formatSingleNumber(num, {
        decimals,
        thousandSeparator,
        decimalSeparator,
        negativeStyle,
        roundingMode,
        formatMode,
      })
    }).filter(r => r !== null)

    return {
      type: 'bulk',
      input: inputDisplays.filter(v => v !== null),
      results: formatted,
      formatted: formatted.join('\n'),
      config: {
        decimals,
        thousandSeparator,
        decimalSeparator,
        negativeStyle,
        roundingMode,
        formatMode
      }
    }
  }

  // Single number formatting
  if (sanitizedInput === null) {
    return { error: 'Invalid or empty input. Please enter a valid number.' }
  }

  const formatted = formatSingleNumber(sanitizedInput, {
    decimals,
    thousandSeparator,
    decimalSeparator,
    negativeStyle,
    roundingMode,
    formatMode,
  })

  return {
    type: 'single',
    input: sanitizedInput,
    output: formatted,
    results: [formatted],
    config: {
      decimals,
      thousandSeparator,
      decimalSeparator,
      negativeStyle,
      roundingMode,
      formatMode
    }
  }
}

function sanitizeInput(text, allowMultiple) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)

  if (allowMultiple && lines.length > 1) {
    const numbers = []
    for (const line of lines) {
      const num = extractNumberFromString(line)
      if (num !== null) {
        numbers.push(num)
      }
    }
    return numbers.length > 0 ? numbers : null
  }

  if (lines.length === 0) return null
  return extractNumberFromString(lines[0])
}

function extractNumberFromString(str) {
  // Remove whitespace
  str = str.trim()

  // Try to extract a number from the string (handles currency, percentages, etc.)
  // Remove common currency symbols and text
  str = str.replace(/[$€¥£₹]/g, '').replace(/%\s*$/, '')

  // For scientific notation, only process the mantissa part
  const eIndex = str.search(/[eE]/)
  const mantissaPart = eIndex > -1 ? str.substring(0, eIndex) : str
  const exponentPart = eIndex > -1 ? str.substring(eIndex) : ''

  // Determine which separator is decimal by position and count
  const dotCount = (mantissaPart.match(/\./g) || []).length
  const commaCount = (mantissaPart.match(/,/g) || []).length
  const lastDot = mantissaPart.lastIndexOf('.')
  const lastComma = mantissaPart.lastIndexOf(',')

  // Helper to count digits after a position
  const digitsAfter = (pos) => pos > -1 ? mantissaPart.substring(pos + 1).replace(/\D/g, '').length : 0

  let numberStr
  if (dotCount === 0 && commaCount === 0) {
    // No separators
    numberStr = mantissaPart
  } else if (dotCount > 1) {
    // Multiple dots: dots are thousands, last is decimal if it has <= 3 digits after
    // E.g., "1.000.000,50" (European) or just remove all
    const digitsAfterLastDot = digitsAfter(lastDot)
    if (digitsAfterLastDot <= 3 && digitsAfterLastDot > 0) {
      numberStr = mantissaPart.replace(/\./g, '').replace(',', '.')
    } else {
      numberStr = mantissaPart.replace(/\./g, '')
    }
  } else if (commaCount > 1) {
    // Multiple commas: commas are thousands, last is decimal if it has <= 3 digits after
    // E.g., "1,000,000.50" (US)
    const digitsAfterLastComma = digitsAfter(lastComma)
    if (digitsAfterLastComma <= 3 && digitsAfterLastComma > 0) {
      numberStr = mantissaPart.replace(/,/g, '')
    } else {
      numberStr = mantissaPart.replace(/,/g, '')
    }
  } else if (dotCount === 1 && commaCount === 1) {
    // One dot and one comma: rightmost is decimal separator
    if (lastDot > lastComma) {
      // Period is decimal, comma is thousands
      numberStr = mantissaPart.replace(/,/g, '')
    } else {
      // Comma is decimal, period is thousands
      numberStr = mantissaPart.replace(/\./g, '').replace(',', '.')
    }
  } else if (dotCount === 1 && commaCount === 0) {
    // Single dot, no commas: could be decimal or thousands
    // If 3 or more digits after dot, likely thousands; else decimal
    const digitsAfterDot = digitsAfter(lastDot)
    if (digitsAfterDot === 3) {
      // Likely thousands separator (e.g., "1.000")
      numberStr = mantissaPart.replace(/\./g, '')
    } else {
      // Likely decimal separator (e.g., "1.5" or "1.50")
      numberStr = mantissaPart
    }
  } else if (commaCount === 1 && dotCount === 0) {
    // Single comma, no dots: could be decimal or thousands
    // If 3 or more digits after comma, likely thousands; else decimal
    const digitsAfterComma = digitsAfter(lastComma)
    if (digitsAfterComma === 3) {
      // Likely thousands separator (e.g., "1,000")
      numberStr = mantissaPart.replace(/,/g, '')
    } else {
      // Likely decimal separator (e.g., "1,5" or "1,50")
      numberStr = mantissaPart.replace(',', '.')
    }
  } else {
    // Shouldn't reach here, but fallback
    numberStr = mantissaPart
  }

  // Add exponent part back if present
  numberStr += exponentPart

  // Handle negative
  const isNegative = /^-|^–|^−/.test(str) || /\($/.test(str)

  // Extract digits, decimal point, and scientific notation (e, E, +, -)
  numberStr = numberStr.replace(/[^\d.eE+\-]/g, '')

  const value = parseFloat(numberStr)
  if (isNaN(value)) return null

  return isNegative ? -Math.abs(value) : value
}

function formatSingleNumber(value, config) {
  const {
    decimals,
    thousandSeparator,
    decimalSeparator,
    negativeStyle,
    roundingMode,
    formatMode,
  } = config

  // Handle different format modes
  switch (formatMode) {
    case 'percentage':
      return formatPercentage(value, decimals, decimalSeparator, negativeStyle, roundingMode)
    case 'abbreviation':
      return formatAbbreviation(value, decimals, decimalSeparator, negativeStyle, roundingMode)
    case 'scientific':
      return formatScientific(value, decimals, decimalSeparator, negativeStyle, roundingMode)
    case 'engineering':
      return formatEngineering(value, decimals, decimalSeparator, negativeStyle, roundingMode)
    default:
      return formatStandard(value, decimals, thousandSeparator, decimalSeparator, negativeStyle, roundingMode)
  }
}

function applyRounding(value, decimals, mode) {
  const factor = Math.pow(10, decimals)
  const shifted = value * factor
  let rounded

  switch (mode) {
    case 'half-up':
      rounded = Math.floor(shifted + 0.5)
      break
    case 'half-down':
      rounded = Math.ceil(shifted - 0.5)
      break
    case 'toward-zero':
      rounded = Math.trunc(shifted)
      break
    case 'away-zero':
      rounded = shifted > 0 ? Math.ceil(shifted) : Math.floor(shifted)
      break
    case 'banker':
      // Round to nearest even
      rounded = Math.round(shifted)
      if (Math.abs(shifted - Math.floor(shifted) - 0.5) < 1e-10) {
        rounded = Math.floor(shifted) % 2 === 0 ? Math.floor(shifted) : Math.ceil(shifted)
      }
      break
    default:
      rounded = Math.round(shifted)
  }

  return rounded / factor
}

function formatStandard(value, decimals, thousandSeparator, decimalSeparator, negativeStyle, roundingMode) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  // Apply rounding
  const rounded = applyRounding(absValue, decimals, roundingMode)

  // Format with specified decimals
  const fixed = rounded.toFixed(decimals)
  const [integerPart, decimalPart] = fixed.split('.')

  // Add thousand separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)

  // Build the number string
  let numberStr = decimalPart ? formattedInteger + decimalSeparator + decimalPart : formattedInteger

  // Apply negative style
  return applyNegativeStyle(numberStr, isNegative, negativeStyle)
}

function formatPercentage(value, decimals, decimalSeparator, negativeStyle, roundingMode) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  // Convert to percentage
  const percentValue = absValue * 100
  const rounded = applyRounding(percentValue, decimals, roundingMode)
  const fixed = rounded.toFixed(decimals)
  const [integerPart, decimalPart] = fixed.split('.')

  let percentStr = decimalPart ? integerPart + decimalSeparator + decimalPart : integerPart
  percentStr += '%'

  return applyNegativeStyle(percentStr, isNegative, negativeStyle)
}

function formatAbbreviation(value, decimals, decimalSeparator, negativeStyle, roundingMode) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  let abbreviated
  const absLog = Math.abs(absValue) > 0 ? Math.log10(Math.abs(absValue)) : 0

  if (absLog >= 9) {
    abbreviated = createAbbreviatedNumber(absValue, decimals, 1e9, 'B', decimalSeparator, roundingMode)
  } else if (absLog >= 6) {
    abbreviated = createAbbreviatedNumber(absValue, decimals, 1e6, 'M', decimalSeparator, roundingMode)
  } else if (absLog >= 3) {
    abbreviated = createAbbreviatedNumber(absValue, decimals, 1e3, 'K', decimalSeparator, roundingMode)
  } else {
    // For small numbers, use standard formatting
    const rounded = applyRounding(absValue, decimals, roundingMode)
    const fixed = rounded.toFixed(decimals)
    const [integerPart, decimalPart] = fixed.split('.')
    abbreviated = decimalPart ? integerPart + decimalSeparator + decimalPart : integerPart
  }

  return applyNegativeStyle(abbreviated, isNegative, negativeStyle)
}

function createAbbreviatedNumber(value, decimals, divisor, suffix, decimalSeparator, roundingMode) {
  const divided = value / divisor
  const rounded = applyRounding(divided, decimals, roundingMode)
  const fixed = rounded.toFixed(decimals)
  const [integerPart, decimalPart] = fixed.split('.')

  let result = decimalPart ? integerPart + decimalSeparator + decimalPart : integerPart
  return result + suffix
}

function formatScientific(value, decimals, decimalSeparator, negativeStyle, roundingMode) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  if (absValue === 0) {
    return '0'
  }

  const exponent = Math.floor(Math.log10(absValue))
  const mantissa = absValue / Math.pow(10, exponent)

  const rounded = applyRounding(mantissa, decimals, roundingMode)
  const fixed = rounded.toFixed(decimals)
  const [integerPart, decimalPart] = fixed.split('.')

  let scientificStr = decimalPart ? integerPart + decimalSeparator + decimalPart : integerPart
  scientificStr += 'e' + (exponent >= 0 ? '+' : '') + exponent

  return applyNegativeStyle(scientificStr, isNegative, negativeStyle)
}

function formatEngineering(value, decimals, decimalSeparator, negativeStyle, roundingMode) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  if (absValue === 0) {
    return '0'
  }

  const exponent = Math.floor(Math.log10(absValue) / 3) * 3
  const mantissa = absValue / Math.pow(10, exponent)

  const rounded = applyRounding(mantissa, decimals, roundingMode)
  const fixed = rounded.toFixed(decimals)
  const [integerPart, decimalPart] = fixed.split('.')

  let engineeringStr = decimalPart ? integerPart + decimalSeparator + decimalPart : integerPart
  engineeringStr += '×10' + (exponent >= 0 ? '+' : '') + exponent

  return applyNegativeStyle(engineeringStr, isNegative, negativeStyle)
}

function applyNegativeStyle(numberStr, isNegative, style) {
  if (!isNegative) return numberStr

  switch (style) {
    case 'parentheses':
      return '(' + numberStr + ')'
    case 'trailing-minus':
      return numberStr + '-'
    case 'minus':
    default:
      return '-' + numberStr
  }
}

function getTimeNormalizerAcceptedFormats() {
  return {
    withTimezone: [
      '2024-01-15 1pm PST',
      '01/15/2024 1pm EST',
      '15/01/2024 1pm EST',
      '15.01.2024 1pm EST',
      'Jan 15, 2024 1pm PST',
      '15 Jan 2024 1pm PST',
      'January 15, 2024 1pm PST',
      '15 January 2024 1pm PST',
      '1:30am UTC',
      '13:45 GMT',
    ],
    dateAndTime: [
      '2024-01-15 14:30:00',
      '2024-01-15 14:30',
      '01/15/2024 14:30:00',
      '15/01/2024 14:30:00',
      '15.01.2024 14:30:00',
    ],
    dateOnly: [
      '2024-01-15',
      '2024/01/15',
      '2024.01.15',
      '01/15/2024',
      '01-15-2024',
      '15/01/2024',
      '15-01-2024',
      '15.01.2024',
      'Jan 15, 2024',
      '15 Jan 2024',
      'January 15, 2024',
      '15 January 2024',
    ],
    timeOnly: [
      '14:30:00',
      '14:30',
      '2:30pm',
      '2:30 pm',
    ],
    timestamp: [
      '1705276800',
      '1705276800000',
    ],
  }
}

function getTimeNormalizerExamples() {
  return [
    {
      label: 'Date + Time + Timezone (US)',
      value: '01/15/2024 1:30pm PST',
      description: 'Common US format with Pacific timezone'
    },
    {
      label: 'Date + Time + Timezone (EU)',
      value: '15/01/2024 1:30pm CET',
      description: 'Common European format with Central European timezone'
    },
    {
      label: 'ISO Date + Time + Timezone',
      value: '2024-01-15 1:30pm EST',
      description: 'ISO date format with Eastern timezone'
    },
    {
      label: 'Full Month Name',
      value: 'January 15, 2024 2pm UTC',
      description: 'Spelled-out month name with time and UTC'
    },
    {
      label: 'Time Only (Current Date)',
      value: '2:45pm PST',
      description: 'Time-only input uses today\'s date'
    },
    {
      label: 'Unix Timestamp',
      value: '1705276800',
      description: 'Unix timestamp in seconds'
    },
    {
      label: 'ISO 8601',
      value: '2024-01-15T14:30:00Z',
      description: 'Standard ISO 8601 format with UTC'
    },
    {
      label: 'Date Only',
      value: '15 January 2024',
      description: 'Date without time (uses midnight)'
    },
  ]
}

function timeNormalizer(text, config = {}) {
  const { DateTime } = require('luxon')

  const trimmed = text.trim()

  if (!trimmed) {
    return {
      error: 'Empty input — please provide a date/time to parse',
      acceptedFormats: getTimeNormalizerAcceptedFormats(),
      examples: getTimeNormalizerExamples()
    }
  }

  const TZ_ABBREVIATION_MAP = {
    utc: 'UTC',
    gmt: 'UTC',
    est: 'America/New_York',
    edt: 'America/New_York',
    cst: 'America/Chicago',
    cdt: 'America/Chicago',
    mst: 'America/Denver',
    mdt: 'America/Denver',
    pst: 'America/Los_Angeles',
    pdt: 'America/Los_Angeles',
    ast: 'America/Anchorage',
    adt: 'America/Anchorage',
    hst: 'Pacific/Honolulu',
    hdt: 'Pacific/Honolulu',
    bst: 'Europe/London',
    cet: 'Europe/Paris',
    cest: 'Europe/Paris',
    ist: 'Asia/Kolkata',
    jst: 'Asia/Tokyo',
    aest: 'Australia/Sydney',
    aedt: 'Australia/Sydney',
  }

  let dt = null
  let detectedFormat = ''
  let detectedTimezoneAbbr = null
  let actualInputTimezone = config.inputTimezone || 'auto'

  const normalized = trimmed.toLowerCase()

  // Helper function to parse common date formats
  function tryParseDate(dateStr) {
    // Try full month names: January 15, 2024 or January 15 2024 or 15 January 2024
    const fullMonthPattern = /^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$|^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})$/
    const fullMonthMatch = dateStr.match(fullMonthPattern)
    if (fullMonthMatch) {
      if (fullMonthMatch[1]) {
        const formatStr = 'd LLLL yyyy'
        return DateTime.fromFormat(`${fullMonthMatch[1]} ${fullMonthMatch[2]} ${fullMonthMatch[3]}`, formatStr)
      } else {
        const formatStr = 'LLLL d yyyy'
        return DateTime.fromFormat(`${fullMonthMatch[4]} ${fullMonthMatch[5]} ${fullMonthMatch[6]}`, formatStr)
      }
    }

    // Try short month names: Jan 15, 2024 or Jan 15 2024 or 15 Jan 2024
    const shortMonthPattern = /^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$|^([a-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/
    const shortMonthMatch = dateStr.match(shortMonthPattern)
    if (shortMonthMatch) {
      if (shortMonthMatch[1]) {
        const formatStr = 'd LLL yyyy'
        return DateTime.fromFormat(`${shortMonthMatch[1]} ${shortMonthMatch[2]} ${shortMonthMatch[3]}`, formatStr)
      } else {
        const formatStr = 'LLL d yyyy'
        return DateTime.fromFormat(`${shortMonthMatch[4]} ${shortMonthMatch[5]} ${shortMonthMatch[6]}`, formatStr)
      }
    }

    // Try slash-separated formats: MM/DD/YYYY, M/D/YYYY, DD/MM/YYYY, D.M.YYYY
    const slashPattern = /^(\d{1,2})([/\-\.]|)(\d{1,2})\2(\d{4})$/
    const slashMatch = dateStr.match(slashPattern)
    if (slashMatch) {
      const [, first, sep, second, year] = slashMatch
      const num1 = parseInt(first)
      const num2 = parseInt(second)

      // Determine if MM/DD or DD/MM based on values
      let month, day
      if (num1 > 12 && num2 <= 12) {
        // Must be DD/MM
        day = num1
        month = num2
      } else if (num2 > 12 && num1 <= 12) {
        // Must be MM/DD
        month = num1
        day = num2
      } else if (num1 > 12 || num2 > 12) {
        // One is definitely out of range for month, unclear which
        return null
      } else {
        // Both could be either month or day - default to MM/DD (US convention)
        month = num1
        day = num2
      }

      return DateTime.fromObject({ year: parseInt(year), month, day })
    }

    // Try YYYY/MM/DD, YYYY-MM-DD variants
    const isoPattern = /^(\d{4})([/\-\.]|)(\d{1,2})\2(\d{1,2})$/
    const isoMatch = dateStr.match(isoPattern)
    if (isoMatch) {
      const [, year, , month, day] = isoMatch
      return DateTime.fromObject({ year: parseInt(year), month: parseInt(month), day: parseInt(day) })
    }

    return null
  }

  // HUMAN PARSING LAYER: Try human-friendly time patterns with timezone
  // Patterns like: 1pm PST, 1:15am EST, 2024-01-15 1pm PST, Jan 15 2024 1:15am MST

  // Pattern 1: With explicit date and time+tz
  // Supports: 2024-01-15 1pm PST, Jan 15 2024 1:15am EST, 01/15/2024 1pm PST, 15.01.2024 1pm PST
  const dateTimeTzPattern = /^(.+?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*([a-z]{2,4})$/
  const dateTimeTzMatch = normalized.match(dateTimeTzPattern)
  if (dateTimeTzMatch && !dt) {
    const [, dateStr, hour, minute, ampm, tzAbbr] = dateTimeTzMatch
    const ianaZone = TZ_ABBREVIATION_MAP[tzAbbr]
    if (ianaZone) {
      try {
        let parsedDate = tryParseDate(dateStr)
        if (parsedDate && parsedDate.isValid) {
          const hour24 = parseInt(hour) + (ampm === 'pm' && parseInt(hour) !== 12 ? 12 : 0) - (ampm === 'am' && parseInt(hour) === 12 ? 12 : 0)
          const min = minute ? parseInt(minute) : 0
          dt = parsedDate.set({ hour: hour24, minute: min, second: 0, millisecond: 0 }).setZone(ianaZone, { keepLocalTime: true })
          if (dt && dt.isValid) {
            detectedFormat = 'Human-friendly with timezone'
            detectedTimezoneAbbr = tzAbbr
            actualInputTimezone = ianaZone
          }
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Pattern 2: Time-only with timezone (e.g., "1pm PST", "1:15am EST", "13:00 UTC")
  if (!dt || !dt.isValid) {
    const timeOnlyTzPattern = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|:)?\s*([a-z]{2,4})$/
    const timeOnlyTzMatch = normalized.match(timeOnlyTzPattern)
    if (timeOnlyTzMatch) {
      const [, hour, minute, ampmOrColon, tzAbbr] = timeOnlyTzMatch
      const ianaZone = TZ_ABBREVIATION_MAP[tzAbbr]
      if (ianaZone) {
        try {
          let hour24 = parseInt(hour)
          if (ampmOrColon && ampmOrColon !== ':') {
            const ampm = ampmOrColon
            hour24 = parseInt(hour) + (ampm === 'pm' && parseInt(hour) !== 12 ? 12 : 0) - (ampm === 'am' && parseInt(hour) === 12 ? 12 : 0)
          }
          const min = minute ? parseInt(minute) : 0
          dt = DateTime.now().setZone(ianaZone).set({ hour: hour24, minute: min, second: 0, millisecond: 0 })
          if (dt.isValid) {
            detectedFormat = 'Human-friendly time with timezone'
            detectedTimezoneAbbr = tzAbbr
            actualInputTimezone = ianaZone
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
  }

  // STANDARD PARSING LAYER: Continue with existing deterministic patterns

  // Step 1: Try to detect numeric-only (timestamp in seconds or milliseconds)
  if (!dt || !dt.isValid) {
    if (/^\d+$/.test(trimmed)) {
      const timestamp = parseInt(trimmed, 10)

      if (timestamp.toString().length === 10) {
        dt = DateTime.fromSeconds(timestamp, { zone: 'UTC' })
        detectedFormat = 'Unix Timestamp (seconds)'
      } else if (timestamp.toString().length === 13) {
        dt = DateTime.fromMillis(timestamp, { zone: 'UTC' })
        detectedFormat = 'Unix Timestamp (milliseconds)'
      } else if (timestamp > 0) {
        const asSeconds = DateTime.fromSeconds(timestamp, { zone: 'UTC' })
        if (asSeconds.isValid) {
          dt = asSeconds
          detectedFormat = 'Unix Timestamp (seconds)'
        } else {
          const asMillis = DateTime.fromMillis(timestamp, { zone: 'UTC' })
          if (asMillis.isValid) {
            dt = asMillis
            detectedFormat = 'Unix Timestamp (milliseconds)'
          }
        }
      }
    }
  }

  // Step 2: Try ISO 8601 format
  if (!dt || !dt.isValid) {
    dt = DateTime.fromISO(trimmed)
    if (dt.isValid) {
      detectedFormat = 'ISO 8601'
    }
  }

  // Step 3: Try RFC 3339 format
  if (!dt || !dt.isValid) {
    const rfc3339Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.?\d+)?(Z|[+-]\d{2}:\d{2})?$/
    if (rfc3339Pattern.test(trimmed)) {
      dt = DateTime.fromISO(trimmed)
      if (dt.isValid) {
        detectedFormat = 'RFC 3339'
      }
    }
  }

  // Step 4: Try common date+time formats (without timezone)
  if (!dt || !dt.isValid) {
    const dateTimePatterns = [
      { pattern: /^(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/, format: 'yyyy-MM-dd HH:mm:ss', name: 'Date+Time (YYYY-MM-DD HH:mm:ss)' },
      { pattern: /^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/, name: 'Date+Time (MM/DD/YYYY HH:mm:ss)' },
    ]

    for (const { pattern, format, name } of dateTimePatterns) {
      if (pattern.test(trimmed)) {
        if (format) {
          dt = DateTime.fromFormat(trimmed, format)
        } else {
          dt = DateTime.fromFormat(trimmed, 'MM/dd/yyyy HH:mm:ss')
          if (!dt.isValid) {
            dt = DateTime.fromFormat(trimmed, 'dd/MM/yyyy HH:mm:ss')
          }
        }
        if (dt && dt.isValid) {
          detectedFormat = name
          break
        }
      }
    }
  }

  // Step 5: Try common date-only formats
  if (!dt || !dt.isValid) {
    const datePatterns = [
      { pattern: /^(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})$/, formats: ['yyyy-MM-dd', 'yyyy/MM/dd'], name: 'Date (YYYY-MM-DD)' },
      { pattern: /^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$/, formats: ['MM/dd/yyyy', 'dd/MM/yyyy'], name: 'Date (MM/DD/YYYY or DD/MM/YYYY)' },
      { pattern: /^([a-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/i, formats: ['LLL d yyyy'], name: 'Date (Month Day, Year)' },
      { pattern: /^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$/i, formats: ['d LLL yyyy'], name: 'Date (Day Month Year)' },
      { pattern: /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})$/i, formats: ['LLLL d yyyy'], name: 'Date (Full Month Day, Year)' },
      { pattern: /^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$/i, formats: ['d LLLL yyyy'], name: 'Date (Day Full Month Year)' },
    ]

    for (const { pattern, formats, name } of datePatterns) {
      if (pattern.test(trimmed)) {
        for (const format of formats) {
          dt = DateTime.fromFormat(trimmed, format)
          if (dt && dt.isValid) {
            detectedFormat = name
            break
          }
        }
        if (dt && dt.isValid) break
      }
    }
  }

  // Step 6: Try YYYY-MM-DD HH:mm:ss format (catch-all for ISO-like with time)
  if (!dt || !dt.isValid) {
    const ymdPattern = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/
    if (ymdPattern.test(trimmed)) {
      dt = DateTime.fromFormat(trimmed, 'yyyy-MM-dd HH:mm:ss')
      if (dt.isValid) {
        detectedFormat = 'YYYY-MM-DD HH:mm:ss'
      }
    }
  }

  // Step 7: Try date-only YYYY-MM-DD
  if (!dt || !dt.isValid) {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
    if (dateOnlyPattern.test(trimmed)) {
      dt = DateTime.fromFormat(trimmed, 'yyyy-MM-dd')
      if (dt.isValid) {
        detectedFormat = 'Date only (YYYY-MM-DD)'
      }
    }
  }

  // Step 8: Try time-only formats
  if (!dt || !dt.isValid) {
    const timePatterns = [
      { format: 'HH:mm:ss', name: 'Time (HH:mm:ss)' },
      { format: 'HH:mm', name: 'Time (HH:mm)' },
    ]

    for (const { format, name } of timePatterns) {
      dt = DateTime.fromFormat(trimmed, format)
      if (dt.isValid) {
        detectedFormat = name
        break
      }
    }
  }

  // If parsing failed, return error with helpful information
  if (!dt || !dt.isValid) {
    return {
      error: `Unable to parse "${trimmed}" — this format is not recognized. Please check the accepted formats below and try again.`,
      acceptedFormats: getTimeNormalizerAcceptedFormats(),
      examples: getTimeNormalizerExamples(),
      failureReason: 'Input did not match any recognized format pattern'
    }
  }

  // Get output timezone config
  const outputTimezone = config.outputTimezone || 'UTC'

  // Determine final input timezone and metadata
  const isTimestamp = detectedFormat.includes('Unix Timestamp')
  let dtInInputZone = dt
  let timezoneDetectionSource = 'auto'

  // If we detected timezone from input, use it
  if (detectedTimezoneAbbr) {
    timezoneDetectionSource = `Detected (${detectedTimezoneAbbr.toUpperCase()} → ${actualInputTimezone})`
  } else if (actualInputTimezone !== 'auto' && !isTimestamp) {
    dtInInputZone = dt.setZone(actualInputTimezone, { keepLocalTime: true })
    timezoneDetectionSource = `Configured (${actualInputTimezone})`
  }

  // Apply final timezone
  if (actualInputTimezone !== 'auto' && !isTimestamp && !detectedTimezoneAbbr) {
    dtInInputZone = dt.setZone(actualInputTimezone, { keepLocalTime: true })
  } else if (actualInputTimezone !== 'auto' && detectedTimezoneAbbr) {
    dtInInputZone = dt.setZone(actualInputTimezone, { keepLocalTime: false })
  }

  // Convert to output timezone
  const dtInOutputZone = dtInInputZone.setZone(outputTimezone)

  // Get timezone offsets and names
  const inputOffset = dtInInputZone.offset || 0
  const inputOffsetHours = inputOffset / 60
  const inputOffsetStr = `UTC${inputOffsetHours >= 0 ? '+' : ''}${inputOffsetHours}`
  const inputTzName = dtInInputZone.zoneName || actualInputTimezone

  const outputOffset = dtInOutputZone.offset || 0
  const outputOffsetHours = outputOffset / 60
  const outputOffsetStr = `UTC${outputOffsetHours >= 0 ? '+' : ''}${outputOffsetHours}`
  const outputTzName = dtInOutputZone.zoneName || outputTimezone

  // Calculate day boundary shift
  const inputDay = dtInInputZone.day
  const outputDay = dtInOutputZone.day
  let dayBoundaryShift = 'Same Day'
  if (outputDay > inputDay) {
    dayBoundaryShift = 'Next Day'
  } else if (outputDay < inputDay) {
    dayBoundaryShift = 'Previous Day'
  }

  // Calculate time difference
  const timeDifferenceMinutes = outputOffset - inputOffset
  const timeDifferenceHours = timeDifferenceMinutes / 60

  // Format human-readable summaries
  const inputDateFormat = 'LLL d, yyyy'
  const inputTimeFormat = 't'
  const inputSummary = `${dtInInputZone.toFormat(inputDateFormat)} — ${dtInInputZone.toFormat(inputTimeFormat)} ${inputTzName}`
  const outputSummary = `${dtInOutputZone.toFormat(inputDateFormat)} — ${dtInOutputZone.toFormat(inputTimeFormat)} ${outputTzName}`

  return {
    // Human-first output (tertiary details shown separately in UI)
    humanSummary: {
      from: inputSummary,
      to: outputSummary,
      difference: `${timeDifferenceHours > 0 ? '+' : ''}${timeDifferenceHours} hours`,
      dayShift: dayBoundaryShift,
    },

    // Secondary output (context layer)
    inputReadable: dtInInputZone.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS),
    convertedReadable: dtInOutputZone.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS),

    // Tertiary output (technical details)
    inputTime: dtInInputZone.toISO(),
    inputOffset: inputOffsetStr,
    inputTimezone: timezoneDetectionSource,
    convertedTime: dtInOutputZone.toISO(),
    outputOffset: outputOffsetStr,
    outputTimezone: outputTimezone,
    unixSeconds: Math.floor(dtInInputZone.toMillis() / 1000),
    unixMillis: dtInInputZone.toMillis(),
    detectedFormat,

    // Bulk mode fields (for compact display in bulk output)
    shiftHours: Math.round(timeDifferenceHours * 10) / 10,
    dayShift: dayBoundaryShift === 'Same Day' ? 'same' : dayBoundaryShift === 'Next Day' ? 'next' : 'previous',
    outputReadable: dtInOutputZone.toFormat('LLL d, t'),
    parsedReadable: dtInInputZone.toFormat('LLL d, t'),
    detectedTimezoneAbbr: detectedTimezoneAbbr,
    input: trimmed,
  }
}

// Phase 3: Apply precision rounding with support for different rounding modes
function applyPrecisionRounding(value, precision, roundingMode = 'half-up') {
  if (precision === null || !Number.isFinite(value)) {
    return { value, wasRounded: false }
  }

  const factor = Math.pow(10, precision)
  let rounded = value

  switch (roundingMode) {
    case 'half-up':
      rounded = Math.round(value * factor) / factor
      break
    case 'half-even': {
      const shifted = value * factor
      const floor = Math.floor(shifted)
      const frac = shifted - floor
      if (frac === 0.5) {
        rounded = (floor % 2 === 0 ? floor : floor + 1) / factor
      } else {
        rounded = Math.round(shifted) / factor
      }
      break
    }
    case 'floor':
      rounded = Math.floor(value * factor) / factor
      break
    case 'ceil':
      rounded = Math.ceil(value * factor) / factor
      break
    default:
      rounded = Math.round(value * factor) / factor
  }

  const wasRounded = Math.abs(value - rounded) > 1e-15
  return { value: rounded, wasRounded }
}

// Phase 3: Detect floating-point precision artifacts
function detectFloatArtifacts(result, expression, allowedFunctions, mathjs) {
  const warnings = []

  if (!Number.isFinite(result) || result === 0) {
    return warnings
  }

  // Check for excessive trailing decimals (e.g., 0.30000000000000004)
  const resultStr = result.toString()
  if (resultStr.includes('e')) {
    return warnings
  }

  const decimalPart = resultStr.split('.')[1] || ''
  if (decimalPart.length > 15) {
    warnings.push('Floating-point precision artifact detected. Consider enabling Big Number mode.')
    return warnings
  }

  // Check for known suspicious patterns (e.g., repeating decimals, precision drift)
  if (/(\d)\1{4,}/.test(decimalPart) || /[4-9]e-\d/.test(resultStr)) {
    warnings.push('Floating-point precision artifact detected. Consider enabling Big Number mode.')
  }

  return warnings
}

function mathEvaluator(text, numericConfig = {}) {
  try {
    if (!mathjs) {
      return { expression: text, error: 'Math evaluator not available' }
    }

    // Phase 3: Numeric Configuration
    // Allowed modes: "float" (JavaScript native), "bigint" (future), "bignumber" (future)
    const config = {
      precision: numericConfig.precision ?? null,
      rounding: numericConfig.rounding ?? 'half-up',
      notation: numericConfig.notation ?? 'auto',
      mode: numericConfig.mode ?? 'float',
      ...numericConfig
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return { expression: text, error: 'Empty expression', diagnostics: { isValid: false, warnings: ['Empty expression'], functionsUsed: [], variables: [], complexity: { nodes: 0, depth: 0 }, numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false }, stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' } } }
    }

    // Whitelist of allowed functions
    const allowedFunctions = [
      'abs', 'sqrt', 'cbrt', 'pow', 'exp', 'log', 'log10', 'log2',
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
      'ceil', 'floor', 'round', 'trunc', 'sign',
      'min', 'max',
      'pi', 'e'
    ]

    // Phase 3: Use appropriate mathjs instance based on numeric mode (float | bignumber)
    // CRITICAL: Choose the instance BEFORE parsing, compilation, and evaluation
    const activeInstance = config.mode === 'bignumber' ? mathjsBigNumber : mathjs
    if (config.mode === 'bignumber' && !mathjsBigNumber) {
      return {
        expression: trimmed,
        error: 'BigNumber mode not available',
        diagnostics: {
          isValid: false,
          warnings: [],
          functionsUsed: [],
          variables: [],
          complexity: { nodes: 0, depth: 0 },
          numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
          stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: 'bigdecimal' }
        }
      }
    }

    // Parse expression to AST - validates syntax
    // CRITICAL: Use activeInstance for parsing so BigNumber mode uses BigNumber arithmetic during compilation
    let node = null
    let parseValid = true
    try {
      node = activeInstance.parse(trimmed)
    } catch (parseError) {
      let errorMsg = parseError.message || 'Invalid expression'
      if (errorMsg.includes('Unexpected')) {
        errorMsg = `Syntax error: ${errorMsg}`
      }
      parseValid = false
      return {
        expression: trimmed,
        error: errorMsg,
        diagnostics: {
          isValid: false,
          warnings: [],
          functionsUsed: [],
          variables: [],
          complexity: { nodes: 0, depth: 0 },
          numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
          stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
        }
      }
    }

    // Extract functions and variables from AST (always, before evaluation)
    const usedFunctions = extractFunctionNames(node)
    const usedVariables = extractVariableNames(node)
    const unknownFunctions = usedFunctions.filter(fn => !allowedFunctions.includes(fn))

    // Calculate complexity from full AST (upfront, independent of evaluation)
    const complexity = calculateComplexity(node)

    // Phase 2: Check for implicit multiplication patterns in raw input
    // BUT: Skip patterns that are known functions (no false positives on log10(100), etc)
    const implicitMultWarnings = detectImplicitMultiplication(trimmed, allowedFunctions)

    // Build warnings array
    const warnings = [...implicitMultWarnings]
    if (unknownFunctions.length > 0) {
      warnings.push(`Unknown function${unknownFunctions.length > 1 ? 's' : ''}: ${unknownFunctions.join(', ')}`)
    }

    // If unknown functions, return error but keep diagnostics
    if (unknownFunctions.length > 0) {
      return {
        expression: trimmed,
        error: `Unknown function${unknownFunctions.length > 1 ? 's' : ''}: ${unknownFunctions.join(', ')}`,
        diagnostics: {
          isValid: false,
          warnings: warnings,
          functionsUsed: usedFunctions,
          variables: usedVariables,
          complexity: complexity,
          numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
          stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
        }
      }
    }

    // Compile and evaluate with restricted scope
    // CRITICAL: Compilation uses the activeInstance context, which determines the arithmetic mode
    const compiled = node.compile()
    const scope = createRestrictedScope(allowedFunctions, activeInstance)
    let result = null
    let evaluationValid = true
    let evaluationError = null

    try {
      result = compiled.evaluate(scope)
    } catch (evalError) {
      evaluationValid = false
      evaluationError = evalError.message || 'Evaluation error'

      // Check for undefined variables
      if (evaluationError.includes('not defined') || evaluationError.includes('is undefined')) {
        const varMatch = evaluationError.match(/([a-zA-Z_][a-zA-Z0-9_]*) is not defined|Unknown symbol '([^']*)'/)
        if (varMatch) {
          const varName = varMatch[1] || varMatch[2]
          warnings.push(`Undefined variable: ${varName}`)
        } else {
          warnings.push('Expression contains undefined variables')
        }
        return {
          expression: trimmed,
          error: evaluationError,
          diagnostics: {
            isValid: false,
            warnings: warnings,
            functionsUsed: usedFunctions,
            variables: usedVariables,
            complexity: complexity,
            numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
            stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
          }
        }
      }

      // Check for division by zero (including computed zero)
      if (evaluationError.includes('Division by zero') || evaluationError.includes('divide by zero') ||
          evaluationError.includes('Infinity') || result === Infinity || result === -Infinity) {
        return {
          expression: trimmed,
          error: 'Division by zero',
          diagnostics: {
            isValid: false,
            warnings: warnings,
            functionsUsed: usedFunctions,
            variables: usedVariables,
            complexity: complexity,
            numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
            stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
          }
        }
      }

      // Generic evaluation error
      return {
        expression: trimmed,
        error: evaluationError,
        diagnostics: {
          isValid: false,
          warnings: warnings,
          functionsUsed: usedFunctions,
          variables: usedVariables,
          complexity: complexity,
          numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
          stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
        }
      }
    }

    // Validate result (must be finite number)
    let finalResult = null
    if (config.mode === 'bignumber' && result && typeof result.toString === 'function') {
      // In BigNumber mode, keep as string to preserve exact decimal representation
      finalResult = result.toString()
    } else if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      finalResult = result
    }

    if (finalResult === null) {
      return {
        expression: trimmed,
        error: 'Invalid result type',
        diagnostics: {
          isValid: false,
          warnings: warnings,
          functionsUsed: usedFunctions,
          variables: usedVariables,
          complexity: complexity,
          numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false },
          stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' }
        }
      }
    }

    // Phase 3: Detect floating-point precision artifacts
    const floatPrecisionWarnings = []
    if (config.mode === 'float') {
      floatPrecisionWarnings.push(...detectFloatArtifacts(finalResult, trimmed, allowedFunctions, mathjs))
    }
    warnings.push(...floatPrecisionWarnings)

    // Phase 3: Apply precision rounding and formatting to presentation layer only
    // result = raw evaluated value (never modified)
    // formattedResult = value after precision/rounding/notation transforms
    let formattedResult = finalResult
    let wasPrecisionRounded = false

    if (config.precision !== null && typeof finalResult === 'number') {
      const roundedResult = applyPrecisionRounding(finalResult, config.precision, config.rounding)
      wasPrecisionRounded = roundedResult.wasRounded
      formattedResult = roundedResult.value
      if (wasPrecisionRounded) {
        warnings.push(`Result was rounded to ${config.precision} decimal place${config.precision === 1 ? '' : 's'}`)
      }
    }

    // Phase 3: Apply notation formatting to formattedResult only
    // For BigNumber mode (string results), don't apply notation transformations
    let wasNotationApplied = false
    if (config.notation === 'scientific' && typeof formattedResult === 'number' && Math.abs(formattedResult) >= 1000) {
      formattedResult = formattedResult.toExponential()
      wasNotationApplied = true
    }

    // Phase 5: Generate expression structure and reductions (explainability)
    let expressionStructure, reductions, structureSummary, explanationMetadata
    try {
      expressionStructure = buildExpressionStructure(node)
      reductions = generateReductions(trimmed, finalResult, floatPrecisionWarnings, complexity, config)
      structureSummary = generateStructureSummary(expressionStructure, complexity, warnings, usedFunctions)
      explanationMetadata = generateExplanationMetadata(expressionStructure, trimmed, usedFunctions)
    } catch (phase5Error) {
      // Silently handle Phase 5 errors - they should not break the evaluation
      expressionStructure = null
      reductions = []
      structureSummary = { shape: 'Unknown', nestingDepth: 0, structureNodeCount: 0, functions: [], hasWarnings: warnings.length > 0 }
      explanationMetadata = {
        evaluationModel: 'standard-precedence',
        associativity: 'left',
        hasParentheses: false,
        hasFunctions: false,
        repeatedSubexpressions: false
      }
    }

    // Phase 6: Generate stability metadata
    // Tags which factors (precision, rounding, notation) affect this result
    const stabilityMetadata = generateStabilityMetadata(config, wasPrecisionRounded, wasNotationApplied, finalResult, floatPrecisionWarnings)

    // Success: fully evaluatable
    // INVARIANT: result is always the raw evaluated value, never affected by precision/rounding/notation
    const normalizedExpression = trimmed
    return {
      expression: normalizedExpression,
      result: finalResult,
      formattedResult: formattedResult,
      error: null,
      diagnostics: {
        isValid: true,
        warnings: warnings,
        functionsUsed: usedFunctions,
        variables: usedVariables,
        complexity: complexity,
        numeric: {
          mode: config.mode,
          precision: config.precision,
          rounding: config.rounding,
          notation: config.notation,
          precisionRounded: wasPrecisionRounded
        },
        stability: stabilityMetadata,
        phase5: {
          metadata: explanationMetadata,
          structure: expressionStructure,
          reductions: reductions,
          summary: structureSummary
        }
      }
    }
  } catch (e) {
    let errorMsg = e.message || 'Invalid expression'
    return {
      expression: text,
      error: errorMsg,
      diagnostics: {
        isValid: false,
        warnings: [],
        functionsUsed: [],
        variables: [],
        complexity: { nodes: 0, depth: 0 },
        numeric: {
          mode: 'float',
          precision: null,
          rounding: 'half-up',
          notation: 'auto',
          precisionRounded: false
        },
        stability: {
          precisionSensitive: false,
          roundingSensitive: false,
          notationSensitive: false,
          numericModel: 'ieee-754'
        }
      }
    }
  }
}

// Extract all function names from AST for validation
// Critical: Must traverse complete AST before evaluation
function extractFunctionNames(node) {
  const functions = new Set()
  const visited = new Set()

  function traverse(n) {
    if (!n || typeof n !== 'object') return

    // Avoid infinite loops on circular references
    if (visited.has(n)) return
    visited.add(n)

    // Capture FunctionNode - functions like sin, cos, sqrt, log, etc.
    if (n.type === 'FunctionNode') {
      // In mathjs, the function name is in n.fn.name
      if (n.fn && typeof n.fn === 'object' && n.fn.name) {
        functions.add(n.fn.name)
      } else if (typeof n.fn === 'string') {
        functions.add(n.fn)
      } else if (n.name) {
        functions.add(n.name)
      }
    }

    // Traverse all array properties
    if (Array.isArray(n)) {
      n.forEach(item => traverse(item))
      return
    }

    // Traverse all object properties comprehensively
    for (const key in n) {
      if (n.hasOwnProperty(key) && typeof n[key] === 'object') {
        const value = n[key]
        if (Array.isArray(value)) {
          value.forEach(item => traverse(item))
        } else {
          traverse(value)
        }
      }
    }
  }

  traverse(node)
  return Array.from(functions).sort()
}

// Create a scope with only whitelisted functions and constants
function createRestrictedScope(allowedFunctions, mathjs) {
  const scope = {}

  // Add only allowed functions and constants
  allowedFunctions.forEach(name => {
    if (typeof mathjs[name] === 'function' || typeof mathjs[name] === 'object') {
      scope[name] = mathjs[name]
    }
  })

  // Add mathematical constants
  scope.pi = mathjs.pi
  scope.e = mathjs.e

  return scope
}

// Detect implicit multiplication patterns in raw input
// Skip false positives on function calls and validated syntax
function detectImplicitMultiplication(input, allowedFunctions = []) {
  const warningsSet = new Set()

  // Build regex for known functions to avoid false positives
  const functionNames = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round', 'trunc', 'sign',
    'log', 'log10', 'log2', 'exp', 'pow', 'min', 'max', ...(allowedFunctions || [])
  ]
  const functionPattern = new RegExp(`\\b(${functionNames.join('|')})\\s*\\(`)

  // Pattern: digit followed by letter (e.g., 2x, 3a)
  // BUT: NOT if it's a function call like log10(x)
  if (/\d+[a-zA-Z]/.test(input) && !functionPattern.test(input)) {
    warningsSet.add("Implicit multiplication detected. Expression was evaluated as multiplication.")
  }

  // Pattern: digit followed by opening paren (e.g., 2(, 3()
  // BUT: NOT if it's actually a function call
  const digitParenMatches = input.match(/\d+\s*\(/g)
  if (digitParenMatches && digitParenMatches.length > 0) {
    const isActualFunction = functionPattern.test(input)
    if (!isActualFunction) {
      warningsSet.add("Implicit multiplication detected. Expression was evaluated as multiplication.")
    }
  }

  // Pattern: closing paren followed by opening paren (e.g., (a)(b))
  if (/\)\s*\(/.test(input)) {
    warningsSet.add("Implicit multiplication detected. Expression was evaluated as multiplication.")
  }

  // Pattern: function result followed by number (e.g., sqrt(4)2)
  if (/[a-zA-Z]+\([^)]*\)\s*\d+/.test(input)) {
    warningsSet.add("Implicit multiplication detected. Expression was evaluated as multiplication.")
  }

  // Pattern: closing paren followed by digit (e.g., (4)2)
  if (/\)\s*\d+/.test(input)) {
    warningsSet.add("Implicit multiplication detected. Expression was evaluated as multiplication.")
  }

  return Array.from(warningsSet)
}

// Extract all variable names from AST
// Critical: Must traverse complete AST before evaluation
function extractVariableNames(node) {
  const variables = new Set()
  const reserved = new Set(['pi', 'e', 'Infinity', 'undefined', 'null', 'true', 'false'])
  const knownFunctions = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round', 'trunc', 'sign',
    'log', 'log10', 'log2', 'exp', 'pow', 'min', 'max'
  ])
  const visited = new Set()

  function traverse(n) {
    if (!n || typeof n !== 'object') return

    // Avoid infinite loops on circular references
    if (visited.has(n)) return
    visited.add(n)

    // Capture SymbolNode - only if it's a variable (not reserved, not a function)
    if (n.type === 'SymbolNode') {
      const name = n.name
      if (!reserved.has(name) && !knownFunctions.has(name)) {
        variables.add(name)
      }
    }

    // Traverse all array properties
    if (Array.isArray(n)) {
      n.forEach(item => traverse(item))
      return
    }

    // Traverse all object properties comprehensively
    for (const key in n) {
      if (n.hasOwnProperty(key) && typeof n[key] === 'object') {
        const value = n[key]
        if (Array.isArray(value)) {
          value.forEach(item => traverse(item))
        } else {
          traverse(value)
        }
      }
    }
  }

  traverse(node)
  return Array.from(variables).sort()
}

// Calculate complexity: node count and depth
// Computed from full AST, independent of evaluation
function calculateComplexity(node) {
  let nodeCount = 0
  let maxDepth = 0
  const visited = new Set()

  function traverse(n, depth = 0) {
    if (!n || typeof n !== 'object') return

    // Avoid infinite loops on circular references
    if (visited.has(n)) return
    visited.add(n)

    // Count this node
    nodeCount++
    maxDepth = Math.max(maxDepth, depth)

    // Traverse all array properties at increased depth
    if (Array.isArray(n)) {
      n.forEach(item => traverse(item, depth + 1))
      return
    }

    // Traverse all object properties comprehensively
    for (const key in n) {
      if (n.hasOwnProperty(key) && typeof n[key] === 'object') {
        const value = n[key]
        if (Array.isArray(value)) {
          value.forEach(item => traverse(item, depth + 1))
        } else {
          traverse(value, depth + 1)
        }
      }
    }
  }

  traverse(node)
  return { nodes: nodeCount, depth: maxDepth }
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

function fileSizeConverter(text, config = {}) {
  const rawInput = (text || '').trim()

  if (!rawInput) {
    return {
      toolId: 'file-size-converter',
      type: 'file-size-converter',
      status: 'empty',
      rawInput
    }
  }

  let value, rawUnit

  try {
    const result = extractFileSizeValueAndUnit(rawInput)
    value = result.value
    rawUnit = result.rawUnit
  } catch {
    return {
      toolId: 'file-size-converter',
      type: 'file-size-converter',
      status: 'incomplete-number-or-unit',
      rawInput,
      error: 'Invalid input format. Please enter a number followed by a file size unit (e.g., "100 MB", "5 GB", "1.5 TB")'
    }
  }

  const normalizedUnit = normalizeFileSizeUnit(rawUnit)

  if (!FILE_SIZE_UNIT_ALIASES[normalizedUnit] && !FILE_SIZE_UNITS.includes(normalizedUnit)) {
    return {
      toolId: 'file-size-converter',
      type: 'file-size-converter',
      status: 'unknown-unit',
      rawInput,
      partialUnit: normalizedUnit,
      error: `Unknown file size unit: "${normalizedUnit}". Supported units: B, KB, MB, GB, TB, PB`
    }
  }

  const bytes = value * (FILE_SIZE_MULTIPLIERS[normalizedUnit] || 1)

  const conversions = FILE_SIZE_UNITS.map(targetUnit => {
    const converted = bytes / FILE_SIZE_MULTIPLIERS[targetUnit]
    return {
      unit: targetUnit.toUpperCase(),
      value: converted,
      human: humanizeFileSize(converted, targetUnit)
    }
  })

  return {
    toolId: 'file-size-converter',
    type: 'file-size-converter',
    status: 'ok',
    rawInput,
    normalizedInput: {
      value,
      unit: normalizedUnit.toUpperCase(),
      human: humanizeFileSize(value, normalizedUnit)
    },
    conversions
  }
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

const TOOL_EXAMPLES = {
  'escape-unescape': (config) => {
    const mode = config.mode || 'escape'
    return [
      mode === 'escape'
        ? 'The API response contains: {"status": "success", "message": "User created"}'
        : 'The API response contains: {\"status\": \"success\", \"message\": \"User created\"}'
    ]
  },
  'base64-converter': (config) => {
    const mode = config.mode || 'encode'
    return [
      mode === 'encode'
        ? 'The quick brown fox jumps over the lazy dog'
        : 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw=='
    ]
  },
  'csv-json-converter': () => [
    'First Name,Last Name,Age,Salary,Active,Verified,Premium Tier\nJohn,Doe,28,50000,true,false,\nJane,Smith,  34  ,  75000  ,true,true,Gold\n\n\nBob,Johnson,45,95000,false,true,Platinum\nAlice,Brown, 29 , 65000 , true , false , Silver',
    'id,name,email,department,salary\n1,Alice Johnson,alice@example.com,Engineering,95000\n2,Bob Smith,bob@example.com,Marketing,75000\n3,Carol White,carol@example.com,Sales,80000'
  ],
  'timestamp-converter': () => ['1704067200'],
  'json-formatter': () => [
    '{"user":{"id":1,"name":"John Doe","email":"john@example.com","roles":["admin","user"],"active":true,"metadata":{"lastLogin":"2024-01-01T12:00:00Z","loginCount":42}},"status":"success"}'
  ],
  'css-formatter': () => [
    'body{margin:0;padding:0;font-family:Arial,sans-serif}.header{background-color:#333;color:white;padding:20px}.container{max-width:1200px;margin:0 auto;padding:20px}.button{background-color:#0066cc;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer}'
  ],
  'xml-formatter': () => [
    '<root><users><user id="1"><name>John Doe</name><email>john@example.com</email><department>Engineering</department><active>true</active></user><user id="2"><name>Jane Smith</name><email>jane@example.com</email><department>Marketing</department><active>true</active></user></users></root>'
  ],
  'js-formatter': () => [
    'const fetchUserData=(userId,options={})=>{const{includeProfile=true,timeout=5000}=options;return fetch(`/api/users/${userId}`,{method:"GET",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(timeout)}).then(r=>r.json()).then(data=>includeProfile?{...data,profile:getUserProfile(data.id)}:data)}'
  ],
  'color-converter': () => ['#FF5733'],
  'regex-tester': () => [
    // Default - Recommended for most users
    'Contact us at support@example.com or sales@example.com.\nOrder #10293 was completed on 2024-02-14.\nVisit https://example.com/login?id=123 for your receipt.',

    // Email Extraction
    'Contact us at support@example.com or sales@example.com.\nYou can also reach our manager at manager.hr@company.co.uk\nor the CEO at ceo+vip@startup.io.',

    // Order Numbers / Invoices
    'Order #10293 was completed.\nOrder #994 was refunded.\nFailed attempt for Order #7783.\nTracking ID: A12-B33-C44',

    // Log File (Timestamp + Severity Parsing)
    '2024-02-14 13:55:23 [INFO] User login: id=233\n2024-02-14 13:58:01 [WARN] Disk usage at 89%\n2024-02-14 14:01:42 [ERROR] Payment failed: code=502\n2024-02-14 14:03:02 [INFO] Session ended for id=233',

    // JSON-like Structure (Key/Value Extraction)
    '{\n  "name": "Alice",\n  "email": "alice@example.com",\n  "age": 29,\n  "verified": true,\n  "roles": ["admin", "editor"]\n}',

    // URL Parsing
    'Visit https://example.com/login?id=123\nOur API: https://api.example.com/v1/users/9982/profile\nInsecure link: http://oldsite.net\nDocs: https://docs.example.com?ref=homepage&lang=en',

    // Phone Number Extraction
    'Call us at (555) 293-1023 or 555-884-2231.\nInternational: +1-404-838-0000 or +44 20 7946 0018.',

    // HTML Tag Matching / Attribute Capture
    '<div class="product" data-id="5541">\n  <h2>Wireless Mouse</h2>\n  <span class="price">$24.99</span>\n</div>\n<a href="/checkout?cart=44">Checkout</a>',

    // "Messy" Text for Harder Regex Practice
    'ID: 223-9919\nUser: john_doe99 (active)\nSession tokens: aa77f19b, 991ae33cd1, ERROR, 88314ee21f\nExpired: xx991',

    // Monetary Values / Numbers
    'Total: $233.50\nTax: $19.44\nDiscount: -$5.00\nFinal: $247.94\nRevenue (Q1): $1,422,993.44'
  ],
  'yaml-formatter': () => [
    'app:\n  name: My Application\n  version: 1.0.0\nserver:\n  host: localhost\n  port: 3000\n  environment: development\ndatabase:\n  url: postgresql://user:password@localhost:5432/myapp\n  maxConnections: 20\nlogging:\n  level: debug\n  format: json'
  ],
  'url-toolkit': () => [
    'https://www.example.com:8443/api/v1/users?id=123&filter=active&sort=name#results'
  ],
  'jwt-decoder': () => [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjcwMDAwMDAwLCJleHAiOjE2NzAwMDM2MDB9.gaj_JGj4_I8xhHhVwjO2f9Y0xQzN4T0P8DhP3QrZY_A'
  ],
  'checksum-calculator': () => ['Hello, World!'],
  'ascii-unicode-converter': () => ['Hello, World! ✨'],
  'time-normalizer': () => {
    const examples = getTimeNormalizerExamples()
    return examples.map(ex => ex.value)
  },
  'base-converter': () => ['255'],
  'math-evaluator': () => ['(25 + 15) * 2 - 10 / 2 + sqrt(16)'],
  'cron-tester': () => ['0 9 * * MON-FRI'],
  'file-size-converter': () => ['100 MB', '5 GB', '1.5 TB'],
  'email-validator': () => [
    `test@example.com
admin@example.com
noreply@example.co.uk
user@yopmail.com
test..name@example.com
test @example.com
test@
@example.com
user@mailinator.com
support@guerrillamail.com
contact@10minutemail.com
invalid@.com
user name@example.com
test@@example.com
.test@example.com
test.@example.com
user@domain
user@localhost
test@cock.li`
  ],
  'caesar-cipher': () => ['The quick brown fox jumps over the lazy dog'],
  'text-toolkit': () => [
    'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. It is commonly used for testing fonts and keyboard layouts.'
  ],
  'ip-address-toolkit': () => [
    '192.168.1.100', // Single IPv4
    '8.8.8.8', // Public IPv4
    '2001:4860:4860::8888', // IPv6 (Google Public DNS)
    '::1', // IPv6 loopback
    '192.168.0.0/24', // CIDR IPv4
    '2001:db8::/32', // CIDR IPv6
    '192.168.1.1 to 192.168.1.10', // Range with "to"
    '10.0.0.1 - 10.0.0.255', // Range with dash
    '127.0.0.1', // Loopback IPv4
    'fe80::1', // Link-local IPv6
    'google.com', // Hostname DNS lookup
    'example.com', // Hostname DNS lookup
    'github.com', // Hostname DNS lookup
  ],
  'http-status-lookup': () => [
    '404',                                                   // Direct code lookup - auto-code mode
    '500',                                                   // Server error code
    'Server returned 200, 201, 204',                         // Log analysis - auto-log mode with multiple codes
    'POST /upload → 413 Payload Too Large',                 // Log analysis - payload too large
    'GET /api/users/999 → 404 Not Found',                   // Common error scenario
    'payload too large',                                     // Text search - auto-search mode
    'rate limit exceeded',                                   // Text search - finding 429
    'unauthorized access',                                   // Text search - finding 401/403
    '400, 401, 403, 404, 500',                             // Bulk code analysis
    'Connection timeout from upstream server'                // Text search - finding 502/504
  ],
  'mime-type-lookup': () => ['pdf'],
  'number-formatter': () => ['1234567.89\n-42500\n0.12345'],
  'sql-formatter': () => [
    'SELECT u.id, u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = true AND u.created_at > \'2024-01-01\' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC'
  ],
  'svg-optimizer': () => [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#FF5733" stroke="#333" stroke-width="2" rx="5"/><circle cx="50" cy="50" r="30" fill="#FFFFFF" opacity="0.8"/><text x="50" y="55" font-size="20" text-anchor="middle">SVG</text></svg>'
  ],
  'uuid-validator': () => [
    '550e8400-e29b-41d4-a716-446655440000', // v4 - Random (standard)
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', // v4 - Random (another)
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // v1 - Time-based (time-based UUID)
    '7ed3ef40-db9e-11ea-a392-0242ac130002', // v1 - Real v1 with timestamp
    '886313e1-3b8a-5372-9b90-0c9aee199e5d', // v5 - SHA-1 name-based
    '3d813cbb-47fb-32ba-91df-831e1593ac29', // v3 - MD5 name-based
    '018f7f10-5f0e-7000-9000-000000000000', // v7 - Unix timestamp-based (sortable)
    '018f7f2a-c5f8-7000-8000-000000000001', // v7 - Another v7
    '00000000-0000-0000-0000-000000000000', // All zeros (edge case)
    '550e8400e29b41d4a716446655440000',     // v4 - No hyphens
    'urn:uuid:550e8400-e29b-41d4-a716-446655440000', // URN format
    '550E8400-E29B-41D4-A716-446655440000', // v4 - Uppercase
    'f47ac10b-58cc-4372-a567-0e02b2c3d47X', // Invalid - bad character
    '550e8400-e29b-41d4-a716',               // Invalid - too short
    '550e8400e29b41d4a716446655440000550e8400', // Invalid - too long
  ],
  'markdown-html-formatter': () => [
    '# Getting Started\n\nWelcome to our platform. This guide will help you get up and running in minutes.\n\n## Installation\n\n```bash\nnpm install example-package\n```\n\n## Usage\n\nHere\'s a **simple example** of how to use this:\n\n- Create a new instance\n- Configure settings\n- Run your code\n\n## Learn More\n\nVisit our [documentation](https://example.com/docs) for more details.'
  ],
  'http-header-parser': () => [
    // 1. A+ Grade (95+) - Best security practices with cache simulation
    'HTTP/1.1 200 OK\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\nX-Content-Type-Options: nosniff\nContent-Security-Policy: default-src \'self\'; script-src \'self\' https://trusted.cdn.com; style-src \'self\'\nX-Frame-Options: DENY\nReferrer-Policy: strict-origin-when-cross-origin\nPermissions-Policy: camera=(), microphone=(), geolocation=()\nContent-Type: application/json; charset=utf-8\nContent-Encoding: br\nContent-Length: 348\nConnection: keep-alive\nCache-Control: max-age=3600, private, must-revalidate\nETag: W/"abc123"\nLast-Modified: Wed, 21 Dec 2024 12:00:00 GMT',

    // 2. HTTP/2 response (shows HTTP/2 compatibility warnings)
    'HTTP/2 200\nStrict-Transport-Security: max-age=31536000; includeSubDomains\nX-Content-Type-Options: nosniff\nX-Frame-Options: DENY\nContent-Security-Policy: default-src \'self\'\nContent-Type: application/json; charset=utf-8\nContent-Encoding: gzip\nContent-Length: 512\nCache-Control: max-age=86400, public\nETag: "v1-xyz789"\nConnection: keep-alive\nKeep-Alive: timeout=5\nUpgrade: h2\nTransfer-Encoding: chunked',

    // 3. Cache simulation: Browser vs CDN behavior (private directive)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 1024\nCache-Control: max-age=3600, private, must-revalidate\nETag: "private-data"\nLast-Modified: Tue, 20 Dec 2024 10:30:00 GMT',

    // 4. Caching contradictions (no-store + public)
    'HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 2048\nCache-Control: no-store, public, max-age=7200\nX-Content-Type-Options: nosniff',

    // 5. Missing validators with revalidation requirement
    'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 512\nCache-Control: no-cache, must-revalidate\nContent-Encoding: gzip',

    // 6. Missing Content-Length (chunked transfer encoding)
    'HTTP/1.1 200 OK\nContent-Type: text/html\nTransfer-Encoding: chunked\nContent-Encoding: gzip\nCache-Control: max-age=3600, public',

    // 7. Missing Content-Length without chunking (streaming response)
    'HTTP/1.1 200 OK\nContent-Type: text/event-stream\nCache-Control: no-cache\nConnection: keep-alive',

    // 8. CSP with unsafe-inline in script-src (triggers security score deduction)
    'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'\nX-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN\nReferrer-Policy: no-referrer\nPermissions-Policy: geolocation=(), microphone=()\nCache-Control: max-age=1800, public',

    // 9. Referrer-Policy variations (high vs low strength)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nReferrer-Policy: unsafe-url\nCache-Control: max-age=3600\nContent-Length: 256',

    // 10. Permissions-Policy with unrestricted features
    'HTTP/1.1 200 OK\nContent-Type: text/html\nPermissions-Policy: camera=*, microphone=*, payment=(self "https://payment.example.com")\nContent-Length: 1024\nCache-Control: max-age=7200, public',

    // 11. ETag with weak validator (W/ prefix)
    'HTTP/1.1 304 Not Modified\nETag: W/"weak-validator-123"\nLast-Modified: Mon, 18 Dec 2024 14:22:00 GMT\nCache-Control: max-age=3600\nContent-Type: application/json',

    // 12. s-maxage for CDN-specific caching
    'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 512\nCache-Control: max-age=300, s-maxage=86400, public\nETag: "cdn-cache-123"\nContent-Encoding: gzip',

    // 13. Authorization with public caching (security risk)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\nCache-Control: max-age=3600, public\nContent-Length: 256\nConnection: keep-alive',

    // 14. No compression on compressible content (missing Content-Length)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 5000\nCache-Control: max-age=3600\nConnection: close',

    // 15. Complete best practices with all features
    'HTTP/1.1 200 OK\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\nX-Content-Type-Options: nosniff\nX-Frame-Options: DENY\nContent-Security-Policy: default-src \'self\'; script-src \'self\' \'nonce-abc123xyz\'; style-src \'self\' https://fonts.googleapis.com; img-src \'self\' data: https:; font-src \'self\' https://fonts.gstatic.com; connect-src \'self\' https://api.example.com\nReferrer-Policy: strict-origin-when-cross-origin\nPermissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.example.com")\nContent-Type: application/json; charset=utf-8\nContent-Encoding: br\nContent-Length: 2048\nETag: "v2-strong-validator-2024"\nLast-Modified: Wed, 25 Dec 2024 08:15:00 GMT\nCache-Control: max-age=3600, public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=86400\nVary: Accept-Encoding, Accept-Language\nContent-Security-Policy-Report-Only: default-src \'self\'; report-uri /csp-report',

    // 16. Minimal headers (F grade - poor security)
    'HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: 100\nConnection: close',

    // 17. No-store directive (prevents all caching)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: no-store\nContent-Length: 512\nContent-Encoding: gzip',

    // 18. stale-while-revalidate and stale-if-error (advanced cache control)
    'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 256\nCache-Control: max-age=300, stale-while-revalidate=86400, stale-if-error=604800\nETag: "revalidatable-123"\nContent-Encoding: gzip',

    // 19. Missing critical security headers but with compression
    'HTTP/1.1 200 OK\nContent-Type: application/json; charset=utf-8\nContent-Encoding: gzip\nContent-Length: 1024\nCache-Control: max-age=1800, public\nConnection: keep-alive',

    // 20. Custom headers with hop-by-hop detection
    'HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 2048\nConnection: keep-alive\nKeep-Alive: timeout=5, max=100\nProxy-Authenticate: Basic realm="example"\nCache-Control: max-age=3600\nX-Custom-Analytics: tracking-enabled',
  ],
  'punycode-converter': () => ['münchen.de'],
  'unit-converter': () => ['100 kg']
}

export function getToolExample(toolId, config = {}, exampleIndex = 0) {
  const toolExamples = TOOL_EXAMPLES[toolId]
  if (!toolExamples) {
    return null
  }

  const examplesArray = toolExamples(config)
  const safeIndex = exampleIndex % examplesArray.length
  return examplesArray[safeIndex]
}

export function getToolExampleCount(toolId, config = {}) {
  const toolExamples = TOOL_EXAMPLES[toolId]
  if (!toolExamples) {
    return 0
  }

  const examplesArray = toolExamples(config)
  return examplesArray.length
}

// Phase 5: Build a clean AST structure representation (not a trace)
// Mirrors the actual expression tree without fake sequencing
// Build clean AST structure from mathjs AST
// CRITICAL RULES:
// 1. Unary operators ALWAYS render as { type: 'unary', operator, argument }
//    Example: -5 is unary minus + literal, never a signed literal
//    Rule: This preserves consistency and prevents AST ambiguity (especially with variables)
// 2. Structure is engine-agnostic: deterministic regardless of numeric mode
// 3. Only structural nodes are included; evaluation logic is never exposed
// Uses visited set to prevent infinite recursion from circular AST references
function buildExpressionStructure(node) {
  const visited = new WeakSet()

  function buildNode(n) {
    if (!n) return null
    if (typeof n !== 'object') return null

    // Prevent infinite recursion from circular references
    if (visited.has(n)) return null
    visited.add(n)

    if (n.type === 'ConstantNode') {
      return {
        type: 'literal',
        value: String(n.value)
      }
    } else if (n.type === 'SymbolNode') {
      return {
        type: 'variable',
        name: n.name
      }
    } else if (n.type === 'OperatorNode') {
      const args = n.args && Array.isArray(n.args) ? n.args.map(arg => buildNode(arg)).filter(Boolean) : []

      // Unary operators: single argument
      if (args.length === 1 && (n.op === '-' || n.op === '+')) {
        return {
          type: 'unary',
          operator: n.op,
          argument: args[0]
        }
      }

      // Binary operators: two arguments
      if (n.op === '+' || n.op === '-') {
        return {
          type: 'binary',
          operator: n.op,
          left: args[0],
          right: args[1]
        }
      } else if (n.op === '*' || n.op === '/') {
        return {
          type: 'binary',
          operator: n.op,
          left: args[0],
          right: args[1]
        }
      } else if (n.op === '^' || n.op === '**') {
        return {
          type: 'binary',
          operator: '^',
          left: args[0],
          right: args[1]
        }
      } else {
        return {
          type: 'operator',
          operator: n.op,
          operands: args
        }
      }
    } else if (n.type === 'FunctionNode') {
      const fnName = n.fn && typeof n.fn === 'object' ? n.fn.name : n.fn
      const args = n.args && Array.isArray(n.args) ? n.args.map(arg => buildNode(arg)).filter(Boolean) : []
      return {
        type: 'function',
        name: fnName,
        arguments: args
      }
    } else if (n.type === 'ParenthesisNode') {
      return n.content ? buildNode(n.content) : null
    } else if (Array.isArray(n)) {
      return n.map(item => buildNode(item)).filter(Boolean)
    }
    return null
  }

  return buildNode(node)
}

// Detect if the original expression contains explicit parentheses
// These are structural hints that affect precedence, not implicit grouping
function detectParentheses(expression) {
  if (!expression || typeof expression !== 'string') return false
  return /[()]/g.test(expression)
}

// Detect if identical subexpressions appear multiple times in the structure
// This is important for explaining that expressions are NOT memoized or optimized
function detectRepeatedSubexpressions(structure) {
  if (!structure || typeof structure !== 'object') return false

  const expressionSignatures = new Map()

  function getSignature(node) {
    if (!node || typeof node !== 'object') {
      return String(node)
    }

    if (node.type === 'literal') {
      return `literal:${node.value}`
    } else if (node.type === 'variable') {
      return `var:${node.name}`
    } else if (node.type === 'unary') {
      return `unary:${node.operator}:${getSignature(node.argument)}`
    } else if (node.type === 'binary') {
      return `binary:${node.operator}:${getSignature(node.left)}:${getSignature(node.right)}`
    } else if (node.type === 'function') {
      const argsStr = node.arguments ? node.arguments.map(a => getSignature(a)).join('|') : ''
      return `func:${node.name}:${argsStr}`
    } else if (node.type === 'operator' && node.operands) {
      const opsStr = node.operands.map(o => getSignature(o)).join('|')
      return `op:${node.operator}:${opsStr}`
    }
    return 'unknown'
  }

  function countExpressions(node) {
    if (!node || typeof node !== 'object') return

    const sig = getSignature(node)
    expressionSignatures.set(sig, (expressionSignatures.get(sig) || 0) + 1)

    if (node.type === 'unary') {
      countExpressions(node.argument)
    } else if (node.type === 'binary') {
      countExpressions(node.left)
      countExpressions(node.right)
    } else if (node.type === 'function' && node.arguments) {
      node.arguments.forEach(arg => countExpressions(arg))
    } else if (node.type === 'operator' && node.operands) {
      node.operands.forEach(op => countExpressions(op))
    }
  }

  countExpressions(structure)

  // Check if any non-trivial expression appears more than once
  for (const [sig, count] of expressionSignatures) {
    // Skip single nodes (literals, variables) and only count complex expressions
    if (count > 1 && (sig.includes(':') && (sig.includes('binary:') || sig.includes('func:') || sig.includes('op:')))) {
      return true
    }
  }

  return false
}

// Generate explicit evaluation metadata for Phase 5
// This makes the intent clear instead of requiring the UI to infer from structure
function generateExplanationMetadata(structure, originalExpression, functionsUsed) {
  return {
    evaluationModel: 'standard-precedence',
    associativity: 'left',
    hasParentheses: detectParentheses(originalExpression),
    hasFunctions: functionsUsed && functionsUsed.length > 0,
    repeatedSubexpressions: detectRepeatedSubexpressions(structure)
  }
}

// Detect if a value is on a half-boundary (e.g., 2.5, 1.15, etc)
// This is important for determining if rounding mode actually changes the result
function isHalfBoundary(value, decimalPlaces) {
  if (!Number.isFinite(value) || decimalPlaces === null) {
    return false
  }

  const factor = Math.pow(10, decimalPlaces)
  const shifted = value * factor
  const fractionalPart = shifted - Math.floor(shifted)

  // Check if fractional part is approximately 0.5
  return Math.abs(fractionalPart - 0.5) < 1e-10
}

// Phase 6: Generate stability metadata
// Tags warnings with structural information so the system can reason about them
// Without parsing text or duplicating warnings
function generateStabilityMetadata(config, wasPrecisionRounded, wasNotationApplied, finalResult, floatPrecisionWarnings) {
  // Check if IEEE-754 artifact was detected
  const hasFloatArtifact = floatPrecisionWarnings && floatPrecisionWarnings.length > 0

  // Precision is sensitive if:
  // 1. IEEE-754 artifact was detected (float precision artifact is inherently a precision sensitivity issue)
  // 2. OR actual rounding occurred
  const precisionSensitive = hasFloatArtifact || wasPrecisionRounded

  // Rounding is sensitive only if:
  // 1. A rounding mode other than half-up is active
  // 2. AND the value is on a half-boundary (where rounding mode would actually change the result)
  const roundingSensitive =
    wasPrecisionRounded &&
    config.rounding !== 'half-up' &&
    config.precision !== null &&
    typeof finalResult === 'number' &&
    isHalfBoundary(finalResult, config.precision)

  return {
    precisionSensitive: precisionSensitive,
    roundingSensitive: roundingSensitive,
    notationSensitive: wasNotationApplied,
    numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754'
  }
}

// Generate key reductions where important transformations occur
// Only show reductions if there are artifacts or complex expressions
function generateReductions(expression, result, floatWarnings, complexity, config) {
  const reductions = []

  // Only add reductions for expressions with precision artifacts
  if (floatWarnings && floatWarnings.length > 0 && config.mode === 'float') {
    reductions.push({
      expression: expression,
      result: String(result),
      note: floatWarnings[0]
    })
  }

  return reductions
}

// Calculate nesting depth from clean AST structure (engine-agnostic)
function calculateNestingDepth(structure) {
  if (!structure || typeof structure !== 'object') return 0

  function getDepth(node) {
    if (!node || typeof node !== 'object') return 0

    if (node.type === 'literal' || node.type === 'variable') {
      return 0
    } else if (node.type === 'unary') {
      return 1 + getDepth(node.argument)
    } else if (node.type === 'binary') {
      return 1 + Math.max(getDepth(node.left), getDepth(node.right))
    } else if (node.type === 'function') {
      if (node.arguments && node.arguments.length > 0) {
        return 1 + Math.max(...node.arguments.map(arg => getDepth(arg)))
      }
      return 1
    } else if (node.type === 'operator' && node.operands) {
      if (node.operands.length > 0) {
        return 1 + Math.max(...node.operands.map(op => getDepth(op)))
      }
      return 1
    }
    return 0
  }

  return getDepth(structure)
}

// Count AST nodes in clean structure (engine-agnostic)
function countStructureNodes(structure) {
  if (!structure || typeof structure !== 'object') return 0

  function count(node) {
    if (!node || typeof node !== 'object') return 0

    let total = 1

    if (node.type === 'unary') {
      total += count(node.argument)
    } else if (node.type === 'binary') {
      total += count(node.left)
      total += count(node.right)
    } else if (node.type === 'function' && node.arguments) {
      for (const arg of node.arguments) {
        total += count(arg)
      }
    } else if (node.type === 'operator' && node.operands) {
      for (const operand of node.operands) {
        total += count(operand)
      }
    }

    return total
  }

  return count(structure)
}

// Generate a clean summary of the expression structure
// NOTE: structureNodeCount counts nodes in the clean AST structure ONLY
//       complexity.nodes counts evaluation nodes (may differ)
// This distinction is important: Phase 4 (numeric) vs Phase 5 (structural)
function generateStructureSummary(structure, complexity, warnings, functionsUsed) {
  let shape = 'Unknown'

  if (structure && typeof structure === 'object') {
    if (structure.type === 'literal') {
      shape = 'Literal value'
    } else if (structure.type === 'variable') {
      shape = `Variable: ${structure.name}`
    } else if (structure.type === 'unary') {
      shape = `Unary ${getOperatorName(structure.operator)} operation`
    } else if (structure.type === 'binary') {
      shape = `Binary ${getOperatorName(structure.operator)} operation`
    } else if (structure.type === 'function') {
      shape = `Function call: ${structure.name}()`
    } else if (structure.type === 'operator') {
      shape = `Operator: ${structure.operator}`
    }
  }

  const nestingDepth = calculateNestingDepth(structure)
  const structureNodeCount = countStructureNodes(structure)

  return {
    shape: shape,
    nestingDepth: nestingDepth,
    structureNodeCount: structureNodeCount,
    functions: functionsUsed && functionsUsed.length > 0 ? functionsUsed : [],
    hasWarnings: warnings && warnings.length > 0
  }
}

// Helper to get readable operator name
function getOperatorName(op) {
  const names = {
    '+': 'addition',
    '-': 'subtraction',
    '*': 'multiplication',
    '/': 'division',
    '^': 'exponentiation',
    '**': 'exponentiation'
  }
  return names[op] || op
}

// Export validateIPAddress for test harness and external use
// Export timeNormalizer for bulk mode processing
// Export mathEvaluator for test harness
export { validateIPAddress, timeNormalizer, mathEvaluator }
