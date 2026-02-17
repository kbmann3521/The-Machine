let yamlModule = null
import { emailValidator as validateEmail } from './emailValidator.js'
import { REGEX_PATTERN_TEMPLATES } from './regexPatterns.js'
import { httpStatusLookup } from './tools/httpStatusLookup.js'
import { httpHeaderParser } from './tools/httpHeaderParser.js'
import { jwtDecoder as enhancedJwtDecoder, jwtDecoderWithJwks } from './tools/jwtDecoder.js'
import { generateQRCode } from './tools/qrCodeGenerator.js'
const { svgOptimizer: svgOptimizerModule, validateSVG, calculateOptimizationStats, generateDiff, formatSVGPretty, formatSVGCompact, analyzeSVGStructure, lintSVG } = require('./tools/svgOptimizer.js')
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
  const { create, all } = require('mathjs')

  // Create hardened core instance for standard float mode
  mathjs = create(all, {
    predictable: true,
    number: 'number'
  })

  // Helper functions for number theory (safe, non-recursive)
  const _factorial = (n) => {
    if (n < 0) throw new Error('Factorial undefined for negative numbers')
    if (n === 0 || n === 1) return 1
    if (n > 170) throw new Error('Factorial too large')
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  const _gcd = (a, b) => {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return a
  }

  const _lcm = (a, b) => {
    return Math.abs(a * b) / _gcd(a, b)
  }

  // Inject custom functions and aliases into core instance
  mathjs.import({
    // Logarithm aliases
    ln: x => mathjs.log(x),

    // Factorial, GCD, LCM (direct implementations, no wrapping)
    factorial: n => _factorial(Math.floor(n)),
    gcd: (...args) => {
      if (args.length === 0) throw new Error('gcd requires at least one argument')
      if (args.length === 1) return Math.abs(Math.floor(args[0]))
      return args.reduce((a, b) => _gcd(a, b))
    },
    lcm: (...args) => {
      if (args.length === 0) throw new Error('lcm requires at least one argument')
      if (args.length === 1) return Math.abs(Math.floor(args[0]))
      return args.reduce((a, b) => _lcm(a, b))
    },

    // Trigonometric complements
    sec: x => 1 / mathjs.cos(x),
    csc: x => 1 / mathjs.sin(x),
    cot: x => 1 / mathjs.tan(x),

    // Inverse hyperbolic (deterministic implementations)
    asinh: x => Math.log(x + Math.sqrt(x * x + 1)),
    acosh: x => Math.log(x + Math.sqrt(x - 1) * Math.sqrt(x + 1)),
    atanh: x => 0.5 * Math.log((1 + x) / (1 - x)),

    // Angle conversions
    deg2rad: deg => (deg * Math.PI) / 180,
    rad2deg: rad => (rad * 180) / Math.PI,

    // Statistical helpers (deterministic implementations)
    mean: arr => {
      if (!Array.isArray(arr) || arr.length === 0) return 0
      return arr.reduce((a, b) => a + b, 0) / arr.length
    },
    median: arr => {
      if (!Array.isArray(arr) || arr.length === 0) return 0
      const sorted = [...arr].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    }
  }, { override: true })

  // Lock down evaluation environment
  mathjs.config({
    matrix: 'Array',
    predictable: true
  })

  // Create BigNumber instance for high-precision mode
  try {
    mathjsBigNumber = create(all)
    mathjsBigNumber.config({ number: 'BigNumber', precision: 64, predictable: true })

    // BigNumber versions of helper functions
    const _factorialBN = (n) => {
      n = Math.floor(n)
      if (n < 0) throw new Error('Factorial undefined for negative numbers')
      if (n === 0 || n === 1) return mathjsBigNumber.bignumber(1)
      if (n > 170) throw new Error('Factorial too large')
      let result = mathjsBigNumber.bignumber(1)
      for (let i = 2; i <= n; i++) {
        result = mathjsBigNumber.multiply(result, i)
      }
      return result
    }

    const _gcdBN = (a, b) => {
      a = mathjsBigNumber.abs(a)
      b = mathjsBigNumber.abs(b)
      while (mathjsBigNumber.compare(b, 0) !== 0) {
        const temp = b
        b = mathjsBigNumber.mod(a, b)
        a = temp
      }
      return a
    }

    const _lcmBN = (a, b) => {
      return mathjsBigNumber.divide(mathjsBigNumber.abs(mathjsBigNumber.multiply(a, b)), _gcdBN(a, b))
    }

    // Inject same custom functions into BigNumber instance
    mathjsBigNumber.import({
      ln: x => mathjsBigNumber.log(x),
      factorial: n => _factorialBN(n),
      gcd: (...args) => {
        if (args.length === 0) throw new Error('gcd requires at least one argument')
        if (args.length === 1) return mathjsBigNumber.abs(args[0])
        return args.reduce((a, b) => _gcdBN(a, b))
      },
      lcm: (...args) => {
        if (args.length === 0) throw new Error('lcm requires at least one argument')
        if (args.length === 1) return mathjsBigNumber.abs(args[0])
        return args.reduce((a, b) => _lcmBN(a, b))
      },
      sec: x => mathjsBigNumber.divide(1, mathjsBigNumber.cos(x)),
      csc: x => mathjsBigNumber.divide(1, mathjsBigNumber.sin(x)),
      cot: x => mathjsBigNumber.divide(1, mathjsBigNumber.tan(x)),
      asinh: x => mathjsBigNumber.log(mathjsBigNumber.add(x, mathjsBigNumber.sqrt(mathjsBigNumber.add(mathjsBigNumber.multiply(x, x), 1)))),
      acosh: x => mathjsBigNumber.log(mathjsBigNumber.add(x, mathjsBigNumber.multiply(mathjsBigNumber.sqrt(mathjsBigNumber.subtract(x, 1)), mathjsBigNumber.sqrt(mathjsBigNumber.add(x, 1))))),
      atanh: x => mathjsBigNumber.multiply(0.5, mathjsBigNumber.log(mathjsBigNumber.divide(mathjsBigNumber.add(1, x), mathjsBigNumber.subtract(1, x)))),
      deg2rad: deg => mathjsBigNumber.multiply(deg, mathjsBigNumber.divide(Math.PI, 180)),
      rad2deg: rad => mathjsBigNumber.multiply(rad, mathjsBigNumber.divide(180, Math.PI)),
      mean: arr => {
        if (!Array.isArray(arr) || arr.length === 0) return 0
        return mathjsBigNumber.divide(arr.reduce((a, b) => mathjsBigNumber.add(a, b), 0), arr.length)
      },
      median: arr => {
        if (!Array.isArray(arr) || arr.length === 0) return 0
        const sorted = [...arr].sort((a, b) => mathjsBigNumber.compare(a, b))
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 ? sorted[mid] : mathjsBigNumber.divide(mathjsBigNumber.add(sorted[mid - 1], sorted[mid]), 2)
      }
    }, { override: true })
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
  'ºc': 'degC',
  '˚c': 'degC',
  celcius: 'degC',
  celsius: 'degC',
  centigrade: 'degC',
  degc: 'degC',

  f: 'degF',
  '°f': 'degF',
  'ºf': 'degF',
  '˚f': 'degF',
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

  // Support degree symbols (°, º, ˚) for temperature units
  const match = cleaned.match(/^([+-]?\d*\.?\d+)\s*([a-z°º˚��"' ]+)?$/i)
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
  let cleaned = rawUnit.replace(/\s+/g, '')
  // Normalize all degree symbol variations (°, º, ˚) to standard degree symbol (°)
  cleaned = cleaned.replace(/[º˚]/g, '°')
  // Remove any characters that aren't lowercase letters or degree symbol
  cleaned = cleaned.replace(/[^a-z°]/g, '')
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
// Lazy-load sqlFormatter and jsonFormatter to avoid loading node-sql-parser and xmlbuilder2 on initial page load
let sqlFormatter = null
let jsonFormatter = null
let xmlFormatter = null
let cssFormatter = null
// markdownHtmlFormatter - lazily loaded on demand
let markdownFormatter = null
const { baseConverter } = require('./tools/baseConverter')
const { checksumCalculator } = require('./tools/checksumCalculator')
const { colorConverter } = require('./tools/colorConverter')

// Helper function to identify scripting language tools
export const isScriptingLanguageTool = (toolId) => {
  const scriptingLanguageTools = new Set([
    'js-formatter',
    'json-formatter',
    'xml-formatter',
    'web-playground',
    'css-formatter',
    'sql-formatter',
    'yaml-formatter',
    'svg-optimizer',
  ])
  return scriptingLanguageTools.has(toolId)
}

export const TOOLS = {
  'text-toolkit': {
    name: 'Text Toolkit',
    description: 'Free, deterministic text analysis and transformation: readability scoring, case conversion, slug generation, find & replace, sorting, and more',
    toolGroup: 'Text & Encoding',
    category: 'writing',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Text Toolkit is a comprehensive solution for analyzing and transforming text. It combines 12+ text processing utilities including word counting, readability analysis, case conversion, slug generation, find and replace, text diffing, line sorting, delimiter transformation, and text cleaning. All operations are deterministic and rule-based, producing consistent, predictable results without AI or creative interpretation.',
      howtouse: [
        'Paste or type any text into the input field',
        'Select the tool or filter you want to use from the left sidebar or the chevron menu in the INPUT tab',
        'For Word Counter: Instantly see word, character, sentence, and paragraph counts with readability metrics',
        'For Readability: View grade level, reading time, and complexity analysis',
        'For Case Converter: Choose from UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and kebab-case',
        'For Slug Generator: Automatically convert text to URL-friendly slugs with customizable separators',
        'For Find & Replace: Use text or regex patterns to find and replace content',
        'For Text Diff: Compare two text versions side-by-side to see differences',
        'For Line Sorter: Organize lines alphabetically, by length, or custom order',
        'For Delimiter Transformer: Convert between CSV, JSON, tab-separated, and other formats',
        'For Text Cleaner: Remove invisible characters, extra whitespace, and formatting issues',
        'For Character Frequency: Analyze character and word frequency distribution',
        'Use "Replace with output" to copy results back to input for chained operations',
      ],
      features: [
        'Word, character, sentence, and paragraph counting with statistics',
        'Readability metrics: grade level, reading time, and complexity scoring',
        'Multiple case conversion options (UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case)',
        'URL slug generation with customizable separators and lowercase conversion',
        'Find and replace with text and regex pattern support',
        'Text diff viewer for comparing two versions side-by-side',
        'Line sorting by alphabetical order, length, or reverse order',
        'Delimiter transformation between CSV, JSON, TSV, and custom formats',
        'Advanced text cleaning: remove invisible characters, extra whitespace, and formatting',
        'Character and word frequency analysis',
        'Fully deterministic: same input always produces same output',
      ],
      usecases: [
        'Analyze readability and grade level of content for target audience',
        'Generate URL-friendly slugs for blog posts and web pages',
        'Compare text versions to identify changes and differences',
        'Clean and standardize data from PDF extraction or machine-generated sources',
        'Convert between data formats (CSV to JSON, tab-delimited, etc.)',
        'Organize and sort lists of text',
        'Bulk-transform text case for data preparation or documentation',
        'Check for hidden characters and formatting issues',
        'Analyze word and character frequency for content analysis',
        'Prepare text for import into other systems',
        'Debug text processing issues and validate data integrity',
      ],
    },
  },
  'image-toolkit': {
    name: 'Image Toolkit',
    description: 'Configure and plan image transformations with dimension, scale, and quality settings for optimal sizing and compression',
    category: 'image-tools',
    inputTypes: ['image'],
    outputType: 'mixed',
    configSchema: [
      {
        id: 'lockAspectRatio',
        label: 'Lock Aspect Ratio',
        type: 'toggle',
        default: true,
      },
      {
        id: 'width',
        label: 'Width (pixels)',
        type: 'slider',
        min: 100,
        max: 4000,
        default: 800,
      },
      {
        id: 'height',
        label: 'Height (pixels)',
        type: 'slider',
        min: 100,
        max: 4000,
        default: 600,
      },
      {
        id: 'scalePercent',
        label: 'Scale %',
        type: 'slider',
        min: 10,
        max: 200,
        default: 100,
      },
      {
        id: 'quality',
        label: 'Quality %',
        type: 'slider',
        min: 10,
        max: 100,
        default: 80,
      },
    ],
    detailedDescription: {
      overview: 'The Image Toolkit provides an interactive configuration interface for planning image transformations. Set target dimensions, scale factors, quality levels, and aspect ratio constraints. Use this tool to calculate and preview optimal settings before applying transformations elsewhere.',
      howtouse: [
        'Upload or select an image to analyze',
        'Adjust width and height sliders to your target dimensions (100-4000 pixels)',
        'Toggle aspect ratio lock to maintain proportions',
        'Use the scale slider to resize by percentage (10-200%)',
        'Adjust the quality slider for compression levels (10-100%)',
        'Review the transformation parameters and metadata',
        'Use these settings in your image processing workflow',
      ],
      features: [
        'Width and height sliders for precise dimension control (100-4000 pixels)',
        'Aspect ratio lock toggle for proportional resizing',
        'Scale percentage slider for percentage-based resizing (10-200%)',
        'Quality slider for compression configuration (10-100%)',
        'Original image dimension detection and display',
        'Transformation parameter metadata output',
        'Proportional resizing calculations',
      ],
      usecases: [
        'Planning image optimization and resizing strategies',
        'Calculating optimal dimensions for responsive design',
        'Determining quality/file-size trade-offs before processing',
        'Standardizing image sizes for batch processing',
        'Designing thumbnail and responsive image sets',
        'Preparing transformation parameters for external image processing',
      ],
    },
  },
  'base64-converter': {
    name: 'Base64 Converter',
    description: 'Free, deterministic Base64 encoding/decoding with auto-detection, multiple variants (standard, URL-safe, MIME), and metadata analysis',
    toolGroup: 'Text & Encoding',
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
    show_in_recommendations: false,
    detailedDescription: {
      overview: 'The Base64 Converter encodes text to Base64 and decodes Base64 back to readable text with smart auto-detection. Provides multiple encoding variants (standard Base64, URL-safe, MIME-style line-wrapped, with or without padding) and helpful metadata (byte sizes, padding status, compression ratio). Auto-fixes common Base64 issues like missing padding during decoding.',
      howtouse: [
        'Enable Auto-Detect to automatically determine encode vs decode',
        'Or manually select Encode or Decode mode',
        'Choose your character encoding (UTF-8, UTF-16, or ASCII)',
        'Paste your text or Base64 string',
        'View all encoding variants instantly (standard, URL-safe, MIME, padded/unpadded)',
        'Check metadata: byte sizes, padding info, compression ratio',
        'Copy any variant to your clipboard',
      ],
      features: [
        'Auto-detection of encode vs decode mode',
        'Standard Base64 encoding with multiple variants',
        'URL-safe Base64 (replaces +/- and /)  encoding variant',
        'MIME-style line-wrapped Base64 (76 chars/line)',
        'Variants with and without padding',
        'Multiple character encodings (UTF-8, UTF-16, ASCII)',
        'Auto-fixes missing padding on decode',
        'Accepts URL-safe Base64 variants (handles - and _)',
        'Comprehensive metadata: input/output sizes, padding status, compression ratio',
        'Non-text detection warnings during decode',
        'Works with any text length and special characters',
      ],
      usecases: [
        'Encoding credentials and secrets for APIs',
        'Preparing binary data for JSON transmission',
        'Embedding images and files in HTML/CSS/data URIs',
        'Encoding email attachments and sensitive data',
        'Converting between Base64 format variants',
        'Debugging Base64 encoding issues in applications',
        'Preparing data for storage in databases',
        'Creating safe text representations of binary data',
      ],
    },
  },
  'hexadecimal-converter': {
    name: 'Hexadecimal Converter',
    description: 'Free, deterministic hexadecimal to text conversion with multiple encoding support, auto-detection, and batch processing',
    toolGroup: 'Text & Encoding',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    example: '48656C6C6F20576F726C64',
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
          { value: 'hexToText', label: 'Hex → Text' },
          { value: 'textToHex', label: 'Text → Hex' },
        ],
        default: 'hexToText',
        visibleWhen: { field: 'autoDetect', value: false },
      },
      {
        id: 'charEncoding',
        label: 'Character Encoding',
        type: 'select',
        options: [
          { value: 'utf-8', label: 'UTF-8' },
          { value: 'ascii', label: 'ASCII' },
          { value: 'utf-16', label: 'UTF-16' },
        ],
        default: 'utf-8',
      },
      {
        id: 'hexFormat',
        label: 'Hex Input Format',
        type: 'select',
        options: [
          { value: 'auto', label: 'Auto-detect' },
          { value: 'space', label: 'Space-separated (48 65 6C 6C 6F)' },
          { value: 'compact', label: 'Compact (48656C6C6F)' },
          { value: 'with0x', label: 'With 0x prefix (0x48, 0x65, ...)' },
          { value: 'cformat', label: 'C format (\\x48\\x65...)' },
        ],
        default: 'auto',
      },
    ],
    show_in_recommendations: false,
    detailedDescription: {
      overview: 'The Hex to Text Converter transforms hexadecimal strings into readable text and vice versa with intelligent auto-detection. Supports multiple input formats (space-separated, compact, 0x prefix, C format), character encodings (UTF-8, ASCII, UTF-16), and batch processing. Perfect for decoding data, debugging hex strings, and understanding binary data.',
      howtouse: [
        'Paste hex or text into the input field',
        'Enable Auto-Detect to automatically determine direction (hex→text or text→hex)',
        'Or manually select the conversion direction',
        'Choose character encoding (UTF-8, ASCII, or UTF-16)',
        'Select hex input format (space-separated, compact, 0x prefix, or C format)',
        'View converted text or hex output',
        'Copy results with one click',
      ],
      features: [
        'Auto-detection of conversion direction (hex→text or text→hex)',
        'Multiple input format support: compact, space-separated, 0x prefix, C format (\\xHH)',
        'Character encoding options: UTF-8, ASCII, UTF-16',
        'Handles invalid/incomplete hex gracefully with error messages',
        'Batch conversion of multiple hex values',
        'Support for special characters and control characters',
        'Detailed conversion metadata and statistics',
        'Works with any hex string length',
        'Case-insensitive hex parsing (A-F or a-f)',
      ],
      usecases: [
        'Decoding hexadecimal strings from logs or data files',
        'Converting between text and hex formats for data analysis',
        'Debugging binary protocols and network packets',
        'Understanding encoded data in applications',
        'Data format conversion between different systems',
        'Security analysis of encoded strings',
        'Reverse engineering and code analysis',
        'Educational demonstrations of character encoding',
      ],
    },
  },
  'binary-converter': {
    name: 'Binary Converter',
    description: 'Free, deterministic binary to text conversion with multiple encoding support, auto-detection, and format variants',
    toolGroup: 'Text & Encoding',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    example: '01001000 01100101 01101100 01101100 01101111',
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
          { value: 'binaryToText', label: 'Binary → Text' },
          { value: 'textToBinary', label: 'Text → Binary' },
        ],
        default: 'binaryToText',
        visibleWhen: { field: 'autoDetect', value: false },
      },
      {
        id: 'charEncoding',
        label: 'Character Encoding',
        type: 'select',
        options: [
          { value: 'utf-8', label: 'UTF-8' },
          { value: 'ascii', label: 'ASCII' },
          { value: 'utf-16', label: 'UTF-16' },
        ],
        default: 'utf-8',
      },
      {
        id: 'binaryFormat',
        label: 'Binary Output Format',
        type: 'select',
        options: [
          { value: 'compact', label: 'Compact (no spaces)' },
          { value: 'space', label: 'Space-separated' },
          { value: 'with0b', label: 'With 0b prefix' },
        ],
        default: 'compact',
      },
    ],
    show_in_recommendations: false,
    detailedDescription: {
      overview: 'The Binary Converter transforms binary strings (sequences of 0s and 1s) into readable text and vice versa with intelligent auto-detection. Supports multiple input formats (space-separated, compact, 0b prefix), character encodings (UTF-8, ASCII, UTF-16), and batch processing. Perfect for understanding binary data, debugging low-level code, and data encoding.',
      howtouse: [
        'Paste binary or text into the input field',
        'Enable Auto-Detect to automatically determine direction (binary→text or text→binary)',
        'Or manually select the conversion direction',
        'Choose character encoding (UTF-8, ASCII, or UTF-16)',
        'Select binary output format (compact, space-separated, or 0b prefix)',
        'View converted text or binary output',
        'Copy results with one click',
      ],
      features: [
        'Auto-detection of conversion direction (binary→text or text→binary)',
        'Multiple input format support: compact, space-separated, 0b prefix',
        'Character encoding options: UTF-8, ASCII, UTF-16',
        'Handles invalid/incomplete binary gracefully with error messages',
        'Batch conversion of multiple binary values',
        'Support for special characters and control characters',
        'Detailed conversion metadata and statistics',
        'Works with any binary string length',
        'Format conversion between binary variants',
      ],
      usecases: [
        'Decoding binary strings from logs or data files',
        'Converting between text and binary formats for data analysis',
        'Debugging binary protocols and communication',
        'Understanding encoded data in applications',
        'Data format conversion between different systems',
        'Educational demonstrations of character encoding',
        'Learning about binary representation and data structures',
        'Analyzing binary network packets and protocols',
      ],
    },
  },
  'encoder-decoder': {
    name: 'Encoder & Decoder',
    description: 'Unified encoding and decoding tool with composable transformers for flexible data conversion',
    toolGroup: 'Text & Encoding',
    category: 'encoding',
    inputTypes: ['text'],
    outputType: 'text',
    example: 'Hello World',
    configSchema: [
      {id: 'direction', label: 'Direction', type: 'select', options: [{value: 'encode', label: 'Encode'}, {value: 'decode', label: 'Decode'}], default: 'encode'},
    ],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Encoder & Decoder is a unified tool for flexible data transformation through composable transformers. Chain multiple encoding methods (Base64, URL encoding, Hexadecimal) together to create complex transformation pipelines. Perfect for developers who need flexible data encoding with minimum configuration.',
      howtouse: ['Paste text or data into the input field', 'Toggle between Encode and Decode modes', 'Add transformers from the configuration panel', 'Configure individual transformer options as needed', 'View the transformed output in real-time', 'Copy results or use them as input for another transformation'],
      features: ['Composable transformer chains - stack multiple encoders together', 'Real-time preview of transformations', 'Individual options for each transformer', 'Toggle between encode and decode directions', 'Support for Base64, Base32 (Standard, Hex, Crockford, z-base-32), URL encoding, Hexadecimal, Binary, Octal, Decimal, Roman Numerals, ASCII/Unicode, Caesar Cipher', 'Easy add/remove transformers'],
      usecases: ['Creating complex encoding pipelines with multiple layers', 'Converting between different data formats', 'Encoding data for transmission or storage', 'Decoding received or stored data', 'Learning about encoding and transformation concepts', 'Building custom encoding workflows'],
      examples: [
        'Base64: "Hello World" → "SGVsbG8gV29ybGQ="',
        'URL Encode: "Hello World!" → "Hello%20World!"',
        'Base32 (Standard): "Hell" → "JBSXG6A="',
        'Base32 (No Padding): "Hell" → "JBSXG6A"',
        'Hexadecimal: "Hello" → "48656C6C6F"',
        'Binary: "abc" → "01100001 01100010 01100011"',
        'Octal: "Hi" → "110 151"',
        'Decimal: "Hi" → "72 105"',
        'Roman Numerals: "Hi" → "LXXII CV"',
        'Caesar Cipher (Shift 3): "abc" → "def"',
        'Chained: "Hello" → Base64 → Hex → "534756736247383D"',
      ],
    },
  },
  'json-formatter': {
    name: 'JSON Formatter',
    description: 'Free, deterministic JSON beautification, minification, validation, sorting, flattening, and format conversion with error detection',
    toolGroup: 'Data Formats & Languages',
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
        'JSON → XML and back: JSON will NOT result in identical JSON. XML cannot preserve JSON types, array structure, or empty/null values.',
      ],
    },
    show_in_recommendations: true,
  },
  'regex-tester': {
    name: 'Regex Tester',
    description: 'Free, deterministic regex pattern testing with real-time match highlighting, capture groups, replacements, and pattern explanation',
    toolGroup: 'Text & Encoding',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'pattern',
        label: 'Regex Pattern',
        type: 'text',
        placeholder: '/pattern/flags',
        default: '[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
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
    detailedDescription: {
      overview: 'The Regex Tester is a complete regular expression development tool with real-time matching, pattern explanation, comprehensive warnings, capture group extraction, and find-and-replace testing. Debug JavaScript regex patterns with detailed diagnostics including human-readable pattern breakdowns and warnings for common mistakes.',
      howtouse: [
        'Paste sample text into the input field',
        'Enter a regex pattern (default email pattern provided)',
        'Set regex flags (g=global, i=case-insensitive, m=multiline, s=dotall, u=unicode, y=sticky)',
        'Optionally enter replacement text to preview find-and-replace results',
        'Review the Pattern Explanation tab to understand your pattern structure',
        'Check Warnings for common regex issues (unmatched brackets, quantifier problems, etc.)',
        'View matches highlighted in the text with capture group details',
      ],
      features: [
        'Real-time regex matching and highlighting',
        'Pattern explanation: human-readable breakdown of pattern structure',
        'Regex warnings: detects unescaped dots, unmatched brackets/parentheses, quantifier-after-quantifier, greedy quantifier hints, invalid flags, empty groups/classes',
        'Capture group extraction with group numbers and values',
        'Match position and length information',
        'Find-and-replace preview with output text',
        'All standard JavaScript regex flags support (g, i, m, s, u, y)',
        'Syntax error detection and reporting',
        'Match count and detailed match information',
        'Pattern template library for common patterns (email, URL, phone, etc.)',
      ],
      usecases: [
        'Develop and debug complex regular expressions with visual feedback',
        'Validate email, URL, phone number, and other formatted data',
        'Extract data from logs, structured text, and documents',
        'Test find-and-replace before implementation',
        'Learn regex syntax with explanations and warnings',
        'Create form validation patterns for web applications',
        'Debug regex issues in production code',
        'Share and understand regex patterns with explanation breakdowns',
      ],
    },
  },
  'csv-json-converter': {
    name: 'CSV to JSON Converter',
    description: 'Free, deterministic CSV-to-JSON, SQL, JavaScript, or TypeScript conversion with automatic delimiter detection and validation',
    toolGroup: 'Data Formats & Languages',
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
    description: 'Free, deterministic XML formatting, minification, validation, JSON/YAML conversion, and XPath query execution',
    toolGroup: 'Data Formats & Languages',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sample XML for formatter and beautifier testing -->
<configuration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="config.xsd"
               version="1.2"
               environment="production">

  <!-- Application metadata -->
  <application name="PioneerWebTools" enabled="true">
    <description>
      A collection of deterministic, privacy-first developer tools.
    </description>
    <maintainer email="admin@example.com">Kyle Mann</maintainer>
  </application>

  <!-- Feature flags -->
  <features>
    <feature key="xmlFormatter" enabled="true"/>
    <feature key="svgOptimizer" enabled="true"/>
    <feature key="linting" enabled="false"/>
  </features>

  <!-- Server configuration -->
  <server>
    <host>api.example.com</host>
    <port>443</port>
    <ssl enabled="true">
      <protocols>
        <protocol>TLSv1.2</protocol>
        <protocol>TLSv1.3</protocol>
      </protocols>
    </ssl>
  </server>

  <!-- Logging with mixed content -->
  <logging level="warn">
    Logs are written to
    <path>/var/log/app</path>
    and rotated daily.
  </logging>

  <!-- CDATA test -->
  <templates>
    <template name="email">
      <![CDATA[
        <html>
          <body>
            <h1>Hello, {{user}}</h1>
            <p>Your token is: {{token}}</p>
          </body>
        </html>
      ]]>
    </template>
  </templates>

  <!-- Whitespace + numeric precision -->
  <limits>
    <timeout units="seconds">30</timeout>
    <threshold>0.000000123456</threshold>
  </limits>

  <!-- Comments, ordering, and empty elements -->
  <!-- These must be preserved exactly -->
  <advanced>
    <emptyElement />
    <selfClosing enabled="true"/>
  </advanced>

</configuration>`,
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
        id: 'preserveXmlStructure',
        label: 'Preserve XML structure',
        type: 'toggle',
        default: false,
        description: 'Includes XML attributes, text nodes, and namespaces for exact structural fidelity. Useful for debugging and round-trip conversion.',
        visibleWhen: [
          { field: 'mode', value: 'to-json' },
          { field: 'mode', value: 'to-yaml' },
        ],
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
        tooltip: 'Unwraps CDATA sections and escapes embedded markup. May change how content is interpreted. Use with caution when CDATA contains markup.',
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
      overview: 'The XML Formatter is an advanced tool with validation, conversion, cleaning, linting, and XPath support. Format XML with proper indentation, minify for production, validate well-formedness, convert to JSON/YAML, clean unnecessary elements, lint for best practices, and run XPath queries.',
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
    description: 'Free, deterministic YAML formatting, validation, and conversion to JSON and other formats with error detection',
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
      overview: 'The YAML Formatter is an advanced tool with validation, conversion, and analysis. Handles beautification, validation, conversion to JSON/TOML/ENV, flattening, comment removal, tab conversion, and safety checks. Designed for Docker, Kubernetes, and configuration files.',
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
    description: 'Free, deterministic URL parsing, analysis, and optimization with domain extraction, parameter removal, SEO analysis, and security grading',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    detailedDescription: {
      overview: 'The URL Toolkit is an advanced analysis and optimization tool. Parse URLs into all components, analyze domain structure with TLD extraction, detect and remove tracking parameters for privacy, perform SEO audits, detect sensitive data in query parameters, generate canonical URLs, normalize with aggressive or safe modes, and calculate URL safety grades.',
      howtouse: [
        'Paste a URL into the input field',
        'View comprehensive URL component breakdown (protocol, hostname, port, path, query, fragment)',
        'Review SEO analysis: HTTPS check, fragment usage, parameter sorting, trailing slashes',
        'Check tracking parameter detection: identifies and lists known analytics parameters',
        'View query parameter deep-dive: analyzes each parameter for duplicates, empty values, and anomalies',
        'Check sensitive data detection: identifies potential secrets, emails, IPs in parameter values',
        'Review URL safety score and domain analysis',
        'Copy cleaned URLs or specific components',
      ],
      features: [
        'Complete URL parsing: protocol, hostname, port, pathname, search, hash',
        'Query parameter extraction as object with single/multiple value handling',
        'Domain analysis: extract root domain, subdomain, TLD using tldts',
        'Safe normalization: clean path, sort params, trim trailing slash',
        'Aggressive normalization: remove www, tracking params, compress fragments',
        'Canonical URL generation and calculation',
        'Tracking parameter detection and removal: identifies 100+ known analytics/marketing params (utm_*, ga, fbclid, etc.)',
        'Query parameter deep-dive: per-parameter analysis, duplicate detection, empty param detection, anomaly scoring',
        'Sensitive data detection: identifies emails, phone numbers, IP addresses, credit cards, SSN, free-text secrets in param values',
        'SEO analysis: detects tracking params, HTTPS usage, fragment usage, parameter sorting, trailing slash, canonical-ness',
        'URL safety grading based on multiple factors',
        'Path segment analysis and breakdown',
        'Punycode and international domain support',
        'Encoding/decoding of URL components',
      ],
      usecases: [
        'Parse and understand URL structure for APIs and webhooks',
        'Privacy: remove tracking parameters before sharing or logging URLs',
        'SEO audits and canonical URL verification',
        'Security audits: detect exposed sensitive data in URLs',
        'Query parameter analysis for debugging',
        'URL normalization for comparison and deduplication',
        'Detecting malicious or suspicious URL patterns',
        'International domain handling with Punycode',
        'Domain and TLD extraction for bulk URL processing',
        'Preparing clean URLs for analytics or storage',
      ],
    },
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    description: 'Free, deterministic JWT decoding with header/payload inspection, signature verification, and JWKS support',
    category: 'crypto',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    configSchema: [],
    detailedDescription: {
      overview: 'The JWT Decoder decodes JSON Web Tokens to inspect headers, payloads, and verify signatures. Supports manual signature verification and JWKS (JSON Web Key Sets) integration for automated signature validation. Perfect for debugging authentication flows and validating token integrity.',
      howtouse: [
        'Paste a complete JWT token (including header.payload.signature) into the input field',
        'The tool automatically decodes and displays all three parts: header, payload, and signature',
        'Review the decoded header (algorithm, token type) and payload (claims, user data)',
        'Check the Signature Verification section for validation results',
        'For JWKS verification, provide a JWKS URL or certificate for automatic signature validation',
        'Export decoded token data for use in your application',
      ],
      features: [
        'Decode JWT header, payload, and signature (Base64 decoding)',
        'Display all token claims and their values',
        'Show token issue time (iat), expiration (exp), and not-before (nbf) timestamps with human-readable format',
        'Automatic expiration validation with clear expired/valid status',
        'Manual signature verification using RSA, HMAC, and other algorithms',
        'JWKS support for automated signature verification against public keys',
        'Validate token structure (3 parts separated by dots)',
        'Display algorithm and key information from header',
        'Show signing and verification algorithm details',
        'JSON output for easy integration with other tools',
        'Visual indicators (✅/❌) for signature verification status',
      ],
      usecases: [
        'Debugging authentication and authorization flows',
        'Verifying JWT token claims and permissions',
        'Checking token expiration and validity',
        'Validating tokens received from external services',
        'Testing API authentication with JWT tokens',
        'Analyzing user data and permissions in tokens',
        'JWKS key rotation and signature validation',
        'OAuth 2.0 and OpenID Connect token inspection',
      ],
    },
  },
  'color-converter': {
    name: 'Color Converter',
    description: 'Free, deterministic color format conversion (RGB, HEX, HSL, etc.) with color comparisons, harmonies, and palette generation',
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
      overview: 'The Color Converter is a professional tool with support for 10+ formats, color blindness simulation, CMYK printing profiles, Delta-E comparison, and gradient generation. Auto-detects color format instantly.',
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
    description: 'Free, deterministic checksum and hash calculation using 11+ algorithms (MD5, SHA, CRC, etc.) for file integrity verification',
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
      overview: 'The Checksum Calculator is a professional-grade tool supporting 11+ algorithms (CRC, Adler, Fletcher, MD5, SHA). Handles multiple input formats (Text, Hex, Base64, Binary) with auto-detection and flexible output formatting for debugging and data verification.',
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
    description: 'Free, deterministic text escaping/unescaping for JavaScript, JSON, HTML, URL, CSV, and XML formats',
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
  },
  'ascii-unicode-converter': {
    name: 'ASCII/Unicode Converter',
    description: 'Free, deterministic character-to-ASCII/Unicode code conversion with encoding analysis and bulk processing',
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
    show_in_recommendations: false,
    detailedDescription: {
      overview: 'The ASCII/Unicode Converter converts text characters to their numeric codes (ASCII and Unicode points) and back. Perfect for understanding character encoding, debugging international text, and working with character data in programming.',
      howtouse: [
        'Enter text in the input field',
        'Select "Text to ASCII/Unicode Codes" to convert characters to their numeric values',
        'Each character displays its decimal code, hex code, and Unicode point',
        'Or select "Codes to Text" mode and enter space-separated decimal numbers to convert back to characters',
        'View full conversion table with all character details',
        'Copy results with one click for use in code or documentation',
      ],
      features: [
        'Convert text characters to ASCII decimal codes (0-127)',
        'Convert text to Unicode points (supports full Unicode range)',
        'Display hexadecimal codes alongside decimal',
        'Reverse conversion: decimal codes back to characters',
        'Batch conversion of multiple characters at once',
        'Support for special characters, emoji, and international scripts',
        'Detailed conversion table with all numeric formats',
        'Handles Unicode combining characters and multi-byte sequences',
      ],
      usecases: [
        'Understanding character encoding and ASCII tables',
        'Debugging text encoding issues in applications',
        'Working with character data in programming',
        'Converting between text and numeric representations',
        'Building character lookup tables and reference materials',
        'International text and emoji handling',
        'Low-level text processing and binary data analysis',
        'HTML/CSS character entity reference lookup',
      ],
    },
  },
  'caesar-cipher': {
    name: 'Caesar Cipher',
    description: 'Free, deterministic Caesar cipher encryption with configurable shift amounts, ROT13, and brute force decryption',
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
    show_in_recommendations: false,
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
    description: 'Free, deterministic CSS formatting, minification, validation, and linting with vendor prefixing and error detection',
    toolGroup: 'Data Formats & Languages',
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
        label: 'Show Linting',
        type: 'toggle',
        default: true,
      },
    ],
    detailedDescription: {
      overview: 'The CSS Formatter beautifies messy CSS with proper indentation and line breaks for readability, or minifies it to reduce file size. Includes validation, linting, and autoprefixer support. Useful for debugging and production optimization.',
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
    show_in_recommendations: true,
  },
  'sql-formatter': {
    name: 'SQL Formatter',
    description: 'Free, deterministic SQL query formatting and beautification for all dialects with linting and validation',
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
      overview: 'The SQL Formatter is a premium tool with formatting, linting, and analysis. Supports PostgreSQL, MySQL, SQL Server, SQLite, and more. Detects issues, extracts tables/columns, and provides query insights.',
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
    description: 'Free, deterministic HTTP status code lookup with extraction from logs, explanations, and developer guidance',
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
      overview: 'The HTTP Status Code Lookup tool provides deterministic lookups with auto-detection, rich metadata, and code examples. Paste a code, log, or description to get instant guidance on status codes.',
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
    description: 'Free, deterministic file extension and MIME type lookup with reverse matching and security information',
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
      overview: 'The MIME Type Lookup tool converts between extensions, MIME types, filenames, and Content-Type headers with rich metadata. Includes security notes, category classification, binary/text detection, and compression info. Supports fuzzy matching and bulk processing.',
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
    description: 'Free, deterministic HTTP header parsing and validation with security analysis and caching behavior simulation',
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
      overview: 'The HTTP Header Parser is a pro-level tool that validates, analyzes, and provides security insights for HTTP request and response headers. Similar to Postman, Cloudflare, and API Gateway dashboards.',
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
    description: 'Free, deterministic UUID validation, generation, and analysis with full version/variant support',
    category: 'developer',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [
      {
        id: 'mode',
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
      overview: 'The UUID Validator is a professional tool supporting versions 1, 3, 4, 5, and 7. Validates structure, detects common mistakes, generates UUIDs, and provides detailed metadata including variant, version, and alternative formats.',
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
    description: 'Free, deterministic SVG minification and optimization by removing unnecessary content with detailed analysis',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'json',
    example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
    configSchema: [],
    detailedDescription: {
      overview: 'The SVG Optimizer is a professional tool with three optimization presets (safe/balanced/aggressive), ID graph analysis, structural cleanup, and detailed change tracking. Safely removes unnecessary markup, attributes, precision, and IDs while preventing breaking changes to external references.',
      howtouse: [
        'Paste your SVG code',
        'Start with Safe preset for minimal risk, or choose Balanced/Aggressive for more optimization',
        'Safe preset: removes comments, trims paths, cleans attributes, minifies IDs',
        'Balanced/Aggressive: adds unused def removal, empty group removal, text-to-path conversion',
        'Confirm Phase 2 operations (like text-to-path) when prompted',
        'Review ID graph analysis showing element references',
        'Copy the optimized SVG',
      ],
      features: [
        'Three optimization presets: Safe (minimal changes), Balanced (moderate), Aggressive (maximum reduction)',
        'Safety gates and confirmations for breaking operations (text-to-path conversion)',
        'ID minification and cleanup with reference graph analysis',
        'Precision reduction for path data (configurable decimal places)',
        'Attribute cleanup: removes empty, default, and redundant attributes',
        'Unused definitions removal (automatically tracks references)',
        'Empty group removal and structure flattening',
        'Path merging and optimization',
        'Comment and metadata removal',
        'ID graph visualization showing which elements reference which IDs',
        'Detailed change tracking: shows what was removed and why',
        'Structural analysis: element count, features detected, optimization statistics',
        'File size reduction metrics and compression ratio',
        'Visual change highlighting',
      ],
      usecases: [
        'Icon library optimization with safety gates',
        'Performance improvement for SVG-heavy applications',
        'Aggressive optimization for production deployment',
        'Cleaning exports from Figma, Illustrator, or other design tools',
        'Analyzing SVG structure for refactoring',
        'Identifying unused definitions and dead code',
        'Reducing initial load time for web applications',
      ],
    },
  },
  'unit-converter': {
    toolId: 'unit-converter',
    name: 'Unit Converter',
    description: 'Free, deterministic unit conversion (length, mass, temperature, volume, etc.) with intelligent auto-detection',
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
    description: 'Free, deterministic number formatting with thousands separators, decimal places, percentages, and currency conversions',
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
    description: 'Free, deterministic date parsing, normalization, and timezone conversion with explicit timezone context',
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
    description: 'Free, deterministic number base conversion (binary, octal, decimal, hexadecimal) with format auto-detection',
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
      overview: 'The Base Converter is a professional tool with automatic detection. Recognizes 0x (hex), 0b (binary), and 0o (octal) prefixes. Converts any number to binary, octal, decimal, and hexadecimal with optional formatting.',
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
    description: 'Free, deterministic mathematical expression evaluation with 30+ functions, high precision, and formula validation',
    category: 'text-analyze',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    detailedDescription: {
      overview: 'The Math Expression Evaluator safely evaluates complex mathematical expressions with 30+ built-in functions and proper order of operations. Supports trigonometric, logarithmic, statistical, and custom functions with high-precision float and arbitrary-precision BigNumber modes. Perfect for quick calculations, formula validation, and scientific computing.',
      howtouse: [
        'Enter any mathematical expression (e.g., "sin(pi/2) + ln(10)" or "factorial(5) * sqrt(16)")',
        'Select numeric mode: Standard (floating-point) or High-Precision (BigNumber)',
        'Optionally set decimal precision and rounding rules',
        'View the result, raw calculation details, and diagnostic information',
        'Review function usage, variables, complexity analysis, and assumptions in the Calculation Details tab',
      ],
      features: [
        '30+ mathematical functions including trigonometric, logarithmic, exponential, and statistical',
        'Trigonometric functions: sin, cos, tan, sec, csc, cot, asin, acos, atan (with radian assumption)',
        'Hyperbolic functions: sinh, cosh, tanh, asinh, acosh, atanh',
        'Logarithmic: log, log10, log2, ln (natural logarithm)',
        'Statistical: mean, median',
        'Number theory: factorial, gcd, lcm',
        'Angle conversions: deg2rad, rad2deg',
        'Rounding and aggregation: abs, ceil, floor, round, trunc, sign, min, max',
        'High-precision BigNumber mode for arbitrary decimal precision',
        'Customizable decimal precision with multiple rounding modes (half-up, half-even, floor, ceil)',
        'Automatic variable detection and function usage reporting',
        'Rich diagnostics including expression complexity, variable list, and evaluation assumptions',
        'Safe evaluation sandbox with restricted function whitelist',
      ],
      usecases: [
        'Scientific and engineering calculations with high precision',
        'Physics formulas and calculations with trigonometric functions',
        'Financial calculations with precise decimal handling',
        'Statistical analysis with mean/median functions',
        'Spreadsheet formula testing and validation',
        'Quick mathematical calculations with verify results',
        'Educational demonstrations of mathematical concepts',
        'Algorithm development and formula prototyping',
      ],
    },
  },
  'cron-tester': {
    name: 'Cron Expression Tester',
    description: 'Free, deterministic cron expression validation and explanation with schedule preview',
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
    description: 'Free, deterministic file size conversion (bytes, KB, MB, GB, TB, PB) with automatic unit detection',
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
    name: 'JavaScript Formatter',
    description: 'Free, deterministic JavaScript formatting, minification, linting, and analysis with style rules and error detection',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'json',
    example: `// TODO: refactor later
const  foo ={a:1,b:2,c:3,};

function   test (x,y ){
if(x==y){
console.log("Equal values")
}else{
 console.log( 'Not equal' )
}
return{x:x,y:y, sum:x+y}
}

const   add=(a,b)=>{return a+b}

const list=[1,2,3,4,5,]

list.forEach((item)=>{
console.log(item)
})

if(foo.a==1 && foo.b==2 && foo.c==3){console.log("All good")}

const obj={name:"Kyle",age:30,active:true,}

function unused ( ){
var temp=  42
}

add(1,2)`,
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
      overview: 'The JavaScript Formatter is a professional-grade tool with formatting, minification, linting, code analysis, and obfuscation. Supports modern JavaScript (ES2020+) and provides detailed code insights.',
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
    description: 'Free, deterministic email validation with syntax checking, disposable domain detection, TLD validation, and reputation scoring',
    category: 'validator',
    inputTypes: ['text'],
    outputType: 'json',

    configSchema: [],
    detailedDescription: {
      overview: 'The Email Validator is a professional-grade validation tool designed for marketing campaigns, user signup, list cleaning, and data quality assurance. It combines real-time DNS validation (MX/A/AAAA records), RFC 5321/5322 syntax checking, disposable domain detection (55,000+ domains), infrastructure authentication assessment (SPF/DMARC), and multi-dimensional scoring (deliverability, trust, gibberish, phishing risk). Results include campaign readiness scores (0-100), detailed breakdowns, and actionable feedback suitable for production use.',
      howtouse: [
        'Enter email address(es): single, comma-separated, or newline-separated for batch validation',
        'View instant analysis with syntax validity, deliverability status, and campaign readiness score',
        'Review detailed scoring: Domain Health Score (infrastructure quality), Local-Part Gibberish Score (identity quality), and combined Campaign Readiness (0-100)',
        'Check DNS metrics: MX records, SPF record status, DMARC policy strength, authentication maturity',
        'Identify warnings: role-based addresses, gibberish scores, phishing risk, reputation issues',
        'Use filters to sort results by status, campaign score range, TLD quality, gibberish level, DNS completeness',
        'Export results to CSV with full scoring breakdown and DNS metrics for integration with your systems',
      ],
      features: [
        'RFC 5321/5322 syntax validation with Punycode support and comprehensive error reporting',
        'Real-time DNS lookups: MX record verification, A/AAAA fallback detection, mail server redundancy checking',
        'TLD (Top-Level Domain) validation against ICANN approved list and quality assessment (high-trust/neutral/low-trust)',
        'Disposable/temporary email detection (55,000+ domains list with automatic updates)',
        'Free/commercial email provider detection (Gmail, Yahoo, Outlook, ProtonMail, etc.)',
        'Role-based email detection (admin@, support@, noreply@, postmaster@, billing@, etc.)',
        'Authentication infrastructure scoring: SPF record analysis, DMARC policy strength (reject/quarantine/none/missing)',
        'Domain Health Score: infrastructure maturity, TLD trust, corporate domain verification',
        'Local-Part Gibberish Score: username gibberish detection, pattern analysis, semantic assessment',
        'Campaign Readiness Score (0-100): combined suitability scoring for marketing use',
        'Phishing risk assessment and suspicious pattern detection',
        'Gibberish and linguistic quality scoring for username assessment',
        'Abusive/hateful/adult content detection with severity scoring',
        'Brand impersonation detection and credential stuffing risk signals',
        'Batch validation: process single or multiple emails (up to thousands) at once',
        'Advanced filtering: by status, score range, TLD quality, gibberish level, role-based, MX records',
        'Detailed JSON output with complete breakdowns and actionable feedback per email',
        'CSV export with full scoring information, DNS metrics, and analysis details',
      ],
      usecases: [
        'Email list validation before marketing campaigns (reduce bounces, improve sender reputation)',
        'Lead list cleaning and hygiene (identify low-quality, disposable, role-based addresses)',
        'User registration and signup form validation (prevent spam accounts and throwaway emails)',
        'Campaign readiness assessment (score addresses by suitability before sending)',
        'Data quality assurance for CRMs and mailing lists',
        'Fraud prevention and phishing pattern detection',
        'Lead validation and enrichment workflows',
        'Compliance validation for contact list management',
        'DNS and authentication infrastructure assessment',
        'Bulk email validation and batch processing',
      ],
    },
  },
  'web-playground': {
    name: 'Web Playground',
    description: 'Free, deterministic web code playground for validating, formatting, and converting HTML, Markdown, CSS, and JavaScript with syntax checking, accessibility linting, and beautification',
    category: 'formatter',
    inputTypes: ['text'],
    outputType: 'text',
    example: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Playground Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }

        .modal-header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .modal-header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .modal-content {
            padding: 32px 24px;
        }

        .modal-content h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 12px;
        }

        .modal-content p {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .button-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        button {
            flex: 1;
            min-width: 140px;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
        }

        .feedback {
            margin-top: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            display: none;
            animation: fadeIn 0.3s ease;
        }

        .feedback.show {
            display: block;
        }

        .feedback.success {
            background: #d4edda;
            color: #155724;
        }

        .feedback.info {
            background: #d1ecf1;
            color: #0c5460;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="modal-header">
            <h1>✨ All-in-One Internet Tools</h1>
            <p>Master your data with precision</p>
        </div>

        <div class="modal-content">
            <h2>Welcome to the Web Playground</h2>
            <p>This interactive modal demonstrates the power of combining HTML, CSS, and JavaScript. Try clicking the buttons below to explore the features!</p>

            <div class="button-group">
                <button class="btn-primary" data-action="explore">Explore Tools</button>
                <button class="btn-secondary" data-action="learn">Learn More</button>
                <button class="btn-secondary" data-action="visit">Visit Site</button>
            </div>

            <div class="feedback"></div>
        </div>
    </div>

    <script>
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const feedback = document.querySelector('.feedback');

                feedback.classList.remove('show', 'success', 'info');

                switch(action) {
                    case 'explore':
                        feedback.textContent = '🔍 Ready to explore 100+ powerful tools!';
                        feedback.classList.add('show', 'success');
                        break;
                    case 'learn':
                        feedback.textContent = '📚 Check out our guides and documentation!';
                        feedback.classList.add('show', 'info');
                        break;
                    case 'visit':
                        feedback.textContent = '🌐 Opening the main website...';
                        feedback.classList.add('show', 'info');
                        setTimeout(() => {
                            window.open('https://example.com', '_blank');
                        }, 500);
                        break;
                }
            });
        });
    </script>
</body>
</html>`,
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
        id: 'enableHtml',
        label: 'Enable HTML',
        type: 'toggle',
        default: false,
        tooltip: 'Allow raw HTML fragments to render inside the Markdown preview',
      },
      {
        id: 'enableGfm',
        label: 'GitHub Markdown Features (GFM)',
        type: 'toggle',
        default: true,
        tooltip: 'Toggle GitHub-flavored Markdown extras like tables, task lists, strikethrough, and autolinks',
      },
      {
        id: 'minify',
        label: 'Minify',
        type: 'toggle',
        default: false,
      },
      {
        id: 'showValidation',
        label: 'Show Validation',
        type: 'toggle',
        default: true,
      },
      {
        id: 'showLinting',
        label: 'Show Linting',
        type: 'toggle',
        default: true,
      },
    ],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The Web Playground is a comprehensive tool for validating, formatting, and converting Markdown and HTML documents. It combines multiple utilities including HTML/Markdown validation, syntax error detection, accessibility linting, semantic checking, formatting and beautification, conversion between formats, and minification. All operations are deterministic and rule-based, producing consistent, predictable results without AI or creative interpretation.',
      howtouse: [
        'Paste your HTML or Markdown code into the input field',
        'Select a tool or mode from the left sidebar or use the chevron menu in the INPUT tab',
        'For HTML Validation: Check for syntax errors, unclosed tags, and structural issues',
        'For Accessibility Lint: Review missing alt text, semantic issues, and WCAG compliance',
        'For Markdown Validation: Check Markdown syntax and formatting correctness',
        'For Formatting: Beautify and reformat your code with proper indentation',
        'For Conversion: Convert between Markdown and HTML formats',
        'For Minification: Compress code by removing unnecessary whitespace and comments',
        'View detailed error messages and linting results in the output panel',
      ],
      features: [
        'HTML validation: syntax checking, unclosed tag detection, structure validation',
        'Accessibility linting: missing alt text, semantic HTML issues, WCAG compliance',
        'Markdown validation: syntax checking and format verification',
        'Semantic checks: proper heading hierarchy, duplicate IDs, deprecated elements',
        'Best practice warnings: inline styles, presentational HTML, deprecated tags',
        'Code formatting and beautification with customizable indentation',
        'Markdown to HTML conversion',
        'HTML to Markdown conversion',
        'Minification for production optimization',
        'Side-by-side view of input and output',
        'Fully deterministic: same input always produces same output',
      ],
      usecases: [
        'Validate HTML before publishing to ensure compatibility',
        'Check accessibility compliance for WCAG standards',
        'Convert between Markdown and HTML for different workflows',
        'Clean up messy or auto-generated HTML code',
        'Minify HTML for production deployment and reduced file size',
        'Debug HTML syntax errors that cause rendering issues',
        'Ensure consistent code formatting across projects',
        'Detect deprecated HTML elements in legacy codebases',
        'Verify proper heading hierarchy for SEO and accessibility',
        'Prepare HTML for content management systems',
      ],
    },
  },
  'ip-address-toolkit': {
    name: 'IP Address Toolkit',
    description: 'Free, deterministic IP address validation, conversion, and analysis for IPv4/IPv6, ranges, CIDR subnets, and bulk lists',
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
  'qr-code-generator': {
    name: 'QR Code Generator',
    description: 'Free, deterministic QR code generation from text, URLs, or any data with customizable size, colors, and error correction',
    category: 'generator',
    inputTypes: ['text'],
    outputType: 'json',
    example: 'https://www.example.com',

    configSchema: [
      {
        id: 'size',
        label: 'QR Code Size (pixels)',
        type: 'number',
        placeholder: '200',
        default: 200,
        description: 'Width and height of the generated QR code in pixels (50-500)',
      },
      {
        id: 'errorCorrectionLevel',
        label: 'Error Correction Level',
        type: 'select',
        options: [
          { value: 'L', label: 'Low (7% recovery)' },
          { value: 'M', label: 'Medium (15% recovery)' },
          { value: 'Q', label: 'Quartile (25% recovery)' },
          { value: 'H', label: 'High (30% recovery)' },
        ],
        default: 'M',
        description: 'Higher levels allow recovery from more damage but create larger codes',
      },
      {
        id: 'margin',
        label: 'Quiet Zone (modules)',
        type: 'number',
        placeholder: '2',
        default: 2,
        description: 'Margin around the QR code in modules (0-10 recommended)',
      },
      {
        id: 'color',
        label: 'Dark Color',
        type: 'text',
        placeholder: '#000000',
        default: '#000000',
        description: 'Hex color for dark modules (typically black)',
      },
      {
        id: 'bgColor',
        label: 'Light Color',
        type: 'text',
        placeholder: '#FFFFFF',
        default: '#FFFFFF',
        description: 'Hex color for light modules (typically white)',
      },
    ],
    show_in_recommendations: true,
    detailedDescription: {
      overview: 'The QR Code Generator creates scannable QR codes from any text, URL, or data. Perfect for sharing links, contact information, WiFi credentials, or any encoded data. Generates both PNG and SVG formats with customizable size, colors, and error correction levels.',
      howtouse: [
        'Enter the text or URL you want to encode as a QR code',
        'Customize the size (50-500 pixels)',
        'Select error correction level (Low, Medium, Quartile, High)',
        'Adjust the quiet zone margin around the code',
        'Choose colors for dark and light modules',
        'View the generated QR code in both PNG and SVG formats',
        'Download or copy the QR code',
      ],
      features: [
        'Generate QR codes from text, URLs, or any data',
        'Customizable size (50-500 pixels)',
        'Four error correction levels (7%, 15%, 25%, 30% recovery)',
        'Adjustable quiet zone (margin) around the code',
        'Custom colors for dark and light modules',
        'Output in both PNG (raster) and SVG (vector) formats',
        'Support for up to 2953 bytes of data (depends on error correction)',
        'Automatic QR code validation',
        'Metadata display (size, error correction, margin, colors)',
      ],
      usecases: [
        'Generate QR codes for URLs and links',
        'Share contact information (vCard format)',
        'WiFi network sharing (WiFi QR codes)',
        'Event tickets and passes',
        'Product packaging and labels',
        'Marketing materials and branding',
        'Payment information (e.g., Bitcoin addresses)',
        'Document tracking and inventory',
        'Social media sharing',
      ],
    },
  },
}

export async function runTool(toolId, inputText, config, inputImage = null) {
  switch (toolId) {
    case 'text-toolkit':
      const toolkitResult = {
        reverseText: reverseText(inputText),
        caseConverter: {
          uppercase: caseConverter(inputText, 'uppercase'),
          lowercase: caseConverter(inputText, 'lowercase'),
          titleCase: caseConverter(inputText, 'titlecase'),
          sentenceCase: caseConverter(inputText, 'sentencecase'),
          randomCase: caseConverter(inputText, 'randomcase'),
          alternatingCase: caseConverter(inputText, 'alternatingcase'),
          inverseCase: caseConverter(inputText, 'inversecase'),
          camelCase: caseConverter(inputText, 'camelcase'),
          pascalCase: caseConverter(inputText, 'pascalcase'),
          snakeCase: caseConverter(inputText, 'snakecase'),
          kebabCase: caseConverter(inputText, 'kebabcase'),
          constantCase: caseConverter(inputText, 'constantcase'),
          dotCase: caseConverter(inputText, 'dotcase'),
          pathCase: caseConverter(inputText, 'pathcase'),
          trainCase: caseConverter(inputText, 'traincase'),
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
        delimiterTransformer: delimiterTransformer(inputText, {
          delimiter: config?.delimiter ?? ' ',
          mode: config?.mode ?? 'rows',
          joinSeparator: config?.joinSeparator ?? ',',
        }),
        numberRows: numberRows(inputText, {
          start: config?.start || 1,
          pad: config?.pad || 0,
          separator: config?.separator ?? '. ',
        }),
      }

      return toolkitResult
    case 'base64-converter':
      return base64ConverterTool(inputText, config)
    case 'json-formatter':
      if (!jsonFormatter) {
        const module = require('./tools/jsonFormatter')
        jsonFormatter = module.jsonFormatter
      }
      return jsonFormatter(inputText, config)
    case 'regex-tester':
      return regexTester(inputText, config)
    case 'csv-json-converter':
      return csvJsonConverter(inputText, config)
    case 'web-playground':
      if (!markdownFormatter) {
        const module = require('./tools/markdownFormatter')
        markdownFormatter = module.markdownHtmlFormatter
      }
      return await markdownFormatter(inputText, config)
    case 'xml-formatter':
      if (!xmlFormatter) {
        const module = require('./tools/xmlFormatter')
        xmlFormatter = module.xmlFormatter
      }
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
      if (!cssFormatter) {
        const module = require('./tools/cssFormatter')
        cssFormatter = module.cssFormatter
      }
      return cssFormatter(inputText, config)
    case 'sql-formatter':
      if (!sqlFormatter) {
        const module = require('./tools/sqlFormatter')
        sqlFormatter = module.sqlFormatter
      }
      return sqlFormatter(inputText, config)
    case 'http-status-lookup':
      return httpStatusLookup(inputText, config)
    case 'mime-type-lookup':
      return mimeTypeLookup(inputText, config)
    case 'http-header-parser':
      return httpHeaderParser(inputText, config)
    case 'uuid-validator':
      return uuidValidator(inputText)
    case 'svg-optimizer': {
      const phase0_1Result = svgOptimizerModule(inputText, config)
      if (config?.phase2 && config.phase2.enabled) {
        return applyPhase2Optimization(phase0_1Result, config.phase2.level, config.phase2.overrides, config)
      }
      return phase0_1Result
    }
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
      return await validateEmail(inputText, config)
    case 'ip-address-toolkit':
      return validateIPAddress(inputText, config)
    case 'image-toolkit':
      return imageToolkit(inputImage, config)
    case 'qr-code-generator':
      return await generateQRCode(inputText, config)
    case 'hexadecimal-converter': {
      const { hexToTextConverter } = await import('./tools/hexToTextConverter.js')
      return hexToTextConverter(inputText, config)
    }
    case 'binary-converter': {
      const { binaryConverter } = await import('./tools/binaryConverter.js')
      return binaryConverter(inputText, config)
    }
    case 'encoder-decoder': {
      const { encoderDecoder } = await import('./tools/encoderDecoder.js')
      return encoderDecoder(inputText, config)
    }
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
    case 'randomcase':
      return text.split('').map(char => {
        return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
      }).join('')
    case 'alternatingcase':
      return text.split('').map((char, i) => {
        return i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      }).join('')
    case 'inversecase':
      return text.split('').map(char => {
        return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      }).join('')
    case 'camelcase':
      return text
        .split(/[\s\-_]+/)
        .filter(word => word.length > 0)
        .map((word, i) => {
          if (i === 0) return word.toLowerCase()
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join('')
    case 'pascalcase':
      return text
        .split(/[\s\-_]+/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
    case 'snakecase':
      return text
        .split(/[\s\-]+/)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase())
        .join('_')
    case 'kebabcase':
      return text
        .split(/[\s_]+/)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase())
        .join('-')
    case 'constantcase':
      return text
        .split(/[\s\-]+/)
        .filter(word => word.length > 0)
        .map(word => word.toUpperCase())
        .join('_')
    case 'dotcase':
      return text
        .split(/[\s\-_]+/)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase())
        .join('.')
    case 'pathcase':
      return text
        .split(/[\s_]+/)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase())
        .join('/')
    case 'traincase':
      return text
        .split(/[\s_]+/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-')
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
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const syllables = countSyllables(text)

    // Get unique words for lexical density
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const lexicalDensity = (uniqueWords.size / Math.max(words.length, 1)) * 100

    // Get longest/shortest word
    const longestWord = words.reduce((max, w) => w.length > max.length ? w : max, words[0] || '')
    const shortestWord = words.reduce((min, w) => w.length < min.length ? w : min, words[0] || '')

    // Get longest/shortest sentence
    const sentenceWithCounts = sentences.map((s, i) => ({
      text: s.trim(),
      wordCount: s.trim().split(/\s+/).filter(w => w.length > 0).length,
      index: i
    }))
    const sentenceWordCounts = sentenceWithCounts.map(s => s.wordCount)
    const maxSentenceLength = sentenceWordCounts.length > 0 ? Math.max(...sentenceWordCounts) : 0
    const minSentenceLength = sentenceWordCounts.length > 0 ? Math.min(...sentenceWordCounts) : 0
    const medianSentenceLength = getMedianValue(sentenceWordCounts)
    const longestSentence = sentenceWithCounts.reduce((max, s) => (s.wordCount > max.wordCount ? s : max), { wordCount: 0, text: '' }).text
    const shortestSentence = sentenceWithCounts.reduce((min, s) => s.wordCount > 0 && (min.wordCount === 0 || s.wordCount < min.wordCount) ? s : min, { wordCount: Infinity, text: '' }).text

    // Count various character types
    const digits = (text.match(/\d/g) || []).length
    const punctuation = (text.match(/[!?.,:;"'()\[\]{}—-]/g) || []).length
    const uppercase = (text.match(/[A-Z]/g) || []).length
    const lowercase = (text.match(/[a-z]/g) || []).length
    const whitespace = (text.match(/\s/g) || []).length
    const spaceCount = (text.match(/ /g) || []).length
    const tabCount = (text.match(/\t/g) || []).length
    const newlineCount = (text.match(/\n/g) || []).length

    // Calculate stop words
    const stopWords = getStopWords()
    const stopWordsList = words.filter(w => stopWords.has(w.toLowerCase()))
    const stopWordCount = stopWordsList.length
    const stopWordsPercent = (stopWordCount / Math.max(words.length, 1)) * 100

    // Word length metrics
    const wordLengths = words.map(w => w.length)
    const minWordLength = wordLengths.length > 0 ? Math.min(...wordLengths) : 0
    const maxWordLength = wordLengths.length > 0 ? Math.max(...wordLengths) : 0
    const medianWordLength = getMedianValue(wordLengths)

    // Calculate advanced readability scores
    const gunningFog = calculateGunningFog(words.length, sentences.length, countComplexWords(words))
    const smogIndex = calculateSMOGIndex(sentences.length, countComplexWords(words))
    const colemanLiau = calculateColemanLiau(stats.characterCountNoSpaces, words.length, sentences.length)
    const ari = calculateARI(stats.characterCountNoSpaces, words.length, sentences.length)

    // Calculate read time (avg 200-250 words per minute)
    const readTime = Math.ceil(words.length / 225)

    // Calculate average syllables per word
    const avgSyllablesPerWord = syllables / Math.max(words.length, 1)

    // Paragraph metrics
    const paragraphs = stats.paragraphCount || 1
    const avgWordsPerParagraph = words.length / Math.max(paragraphs, 1)
    const avgSentencesPerParagraph = sentences.length / Math.max(paragraphs, 1)

    // Get most repeated words (simple keyword density)
    const wordFreq = {}
    words.forEach(w => {
      const lw = w.toLowerCase()
      wordFreq[lw] = (wordFreq[lw] || 0) + 1
    })
    const topKeywords = Object.entries(wordFreq)
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count, percent: (count / words.length) * 100 }))

    // Content density (non-stop words)
    const contentDensity = 100 - stopWordsPercent

    // Type-token ratio (vocabulary richness)
    const typeTokenRatio = uniqueWords.size / Math.max(words.length, 1)

    // Generate whitespace visualization with symbols
    const whitespaceSafeText = text
      .replace(/ /g, '·')
      .replace(/\t/g, '→')
      .replace(/\n/g, '↵\n')

    result.statistics = {
      // Basic counts
      words: stats.wordCount,
      characters: stats.characterCount,
      charactersNoSpaces: stats.characterCountNoSpaces,
      digits: digits,
      punctuation: punctuation,

      // Letter distribution
      uppercase: uppercase,
      lowercase: lowercase,
      whitespace: whitespace,
      spaceCount: spaceCount,
      tabCount: tabCount,
      newlineCount: newlineCount,
      whitespaceSafeText: whitespaceSafeText,

      // Sentence metrics
      sentences: stats.sentenceCount,
      avgWordsPerSentence: stats.wordCount / Math.max(stats.sentenceCount, 1),
      longestSentenceLength: maxSentenceLength,
      longestSentence: longestSentence,
      shortestSentenceLength: minSentenceLength,
      shortestSentence: shortestSentence,
      medianSentenceLength: medianSentenceLength,

      // Word metrics
      avgWordLength: stats.characterCountNoSpaces / Math.max(stats.wordCount, 1),
      longestWord: longestWord,
      shortestWord: shortestWord,
      minWordLength: minWordLength,
      maxWordLength: maxWordLength,
      medianWordLength: medianWordLength,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,

      // Paragraph metrics
      lines: stats.lineCount,
      paragraphs: stats.paragraphCount,
      avgWordsPerParagraph: Math.round(avgWordsPerParagraph * 100) / 100,
      avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 100) / 100,

      // Density & vocabulary
      lexicalDensity: Math.round(lexicalDensity * 100) / 100,
      stopWordsCount: stopWordCount,
      stopWordsPercent: Math.round(stopWordsPercent * 100) / 100,
      stopWordsList: stopWordsList,
      contentDensity: Math.round(contentDensity * 100) / 100,
      typeTokenRatio: Math.round(typeTokenRatio * 10000) / 10000,

      // Advanced readability scores
      gunningFogIndex: Math.max(0, Math.round(gunningFog * 10) / 10),
      smogIndex: Math.max(0, Math.round(smogIndex * 10) / 10),
      colemanLiauIndex: Math.max(0, Math.round(colemanLiau * 10) / 10),
      automatedReadabilityIndex: Math.max(0, Math.round(ari * 10) / 10),

      // Estimated read time
      estimatedReadTimeMinutes: readTime,

      // Unique words frequency
      uniqueWordsFreq: Object.entries(wordFreq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => (b.count || 0) - (a.count || 0)),

      // Top keywords
      topKeywords: topKeywords,
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

// Helper function to get median value from an array
function getMedianValue(arr) {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// Helper function to count complex words (3+ syllables, excluding common words)
function countComplexWords(words) {
  const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'])
  let count = 0

  for (const word of words) {
    if (commonWords.has(word.toLowerCase())) continue
    const syllables = countSyllablesForWord(word)
    if (syllables >= 3) count++
  }

  return count
}

// Helper function to count syllables in a single word
function countSyllablesForWord(word) {
  const lowerWord = word.toLowerCase()
  let count = 0
  let previousWasVowel = false

  for (const char of lowerWord) {
    const isVowel = 'aeiouy'.includes(char)
    if (isVowel && !previousWasVowel) count++
    previousWasVowel = isVowel
  }

  if (lowerWord.endsWith('e')) count--
  if (lowerWord.endsWith('le') && lowerWord.length > 2) count++

  return Math.max(1, count)
}

// Gunning Fog Index - measures years of education needed to understand text
function calculateGunningFog(wordCount, sentenceCount, complexWordCount) {
  if (wordCount === 0 || sentenceCount === 0) return 0
  return 0.4 * ((wordCount / sentenceCount) + 100 * (complexWordCount / wordCount))
}

// SMOG Index - estimates years of education needed to understand text
function calculateSMOGIndex(sentenceCount, complexWordCount) {
  if (sentenceCount === 0) return 0
  return (Math.sqrt(complexWordCount * (30 / sentenceCount)) + 3)
}

// Coleman-Liau Index - uses character count instead of syllables
function calculateColemanLiau(charCount, wordCount, sentenceCount) {
  if (wordCount === 0 || sentenceCount === 0) return 0
  const L = (charCount / wordCount) * 100
  const S = (sentenceCount / wordCount) * 100
  return (0.0588 * L) - (0.296 * S) - 15.8
}

// Automated Readability Index (ARI) - based on characters, words, and sentences
function calculateARI(charCount, wordCount, sentenceCount) {
  if (wordCount === 0 || sentenceCount === 0) return 0
  return (4.71 * (charCount / wordCount)) + (0.5 * (wordCount / sentenceCount)) - 21.43
}

// Get common English stop words
function getStopWords() {
  return new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
    'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
    'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he',
    'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
    'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'might', 'more', 'most',
    'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
    'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
    'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself',
    'yourselves'
  ])
}

function imageToolkit(imageData, config) {
  return {
    mode: 'resize',
    imageData: imageData || null,
    width: config.width || 800,
    height: config.height || 600,
    lockAspectRatio: config.lockAspectRatio !== false,
    scalePercent: config.scalePercent || 100,
    quality: config.quality || 80,
    transformUrl: null,
  }
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

function isValidUTF8(buffer) {
  let i = 0
  while (i < buffer.length) {
    const byte1 = buffer[i]

    if (byte1 < 0x80) {
      i += 1
    } else if ((byte1 & 0xE0) === 0xC0) {
      if (i + 1 >= buffer.length) return false
      const byte2 = buffer[i + 1]
      if ((byte2 & 0xC0) !== 0x80) return false
      i += 2
    } else if ((byte1 & 0xF0) === 0xE0) {
      if (i + 2 >= buffer.length) return false
      const byte2 = buffer[i + 1]
      const byte3 = buffer[i + 2]
      if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80) return false
      i += 3
    } else if ((byte1 & 0xF8) === 0xF0) {
      if (i + 3 >= buffer.length) return false
      const byte2 = buffer[i + 1]
      const byte3 = buffer[i + 2]
      const byte4 = buffer[i + 3]
      if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80 || (byte4 & 0xC0) !== 0x80) return false
      i += 4
    } else {
      return false
    }
  }
  return true
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
    let decodedBuffer
    if (cleanText.includes('-') || cleanText.includes('_')) {
      // URL-safe variant
      const standardBase64 = cleanText.replace(/-/g, '+').replace(/_/g, '/')
      decodedBuffer = Buffer.from(standardBase64, 'base64')
    } else {
      decodedBuffer = Buffer.from(cleanText, 'base64')
    }

    // Validate UTF-8 before decoding
    const isValidUTF8Text = isValidUTF8(decodedBuffer)

    // Decode with appropriate encoding
    let decodedText
    if (isValidUTF8Text) {
      decodedText = decodedBuffer.toString('utf-8')
    } else {
      // If not valid UTF-8, show as hex to avoid corruption
      decodedText = decodedBuffer.toString('hex')
    }

    const inputBytes = Buffer.from(trimmed, 'utf-8').length
    const outputBytes = decodedBuffer.length

    return {
      mode: 'decode',
      detectedMode: 'decode',
      output: isValidUTF8Text ? decodedText : `[Binary data - showing hex]\n${decodedText}`,
      input: text,
      isValidText: isValidUTF8Text,
      warning: !isValidUTF8Text ? '⚠ Decoded data is not valid UTF-8. Showing as hex. Try a different character encoding.' : null,

      metadata: {
        'Mode': 'Decode',
        'Character Encoding': charEncoding.toUpperCase(),
        'Input Size': `${inputBytes} byte${inputBytes !== 1 ? 's' : ''}`,
        'Output Size': `${outputBytes} byte${outputBytes !== 1 ? 's' : ''}`,
        'Decoded Successfully': isValidUTF8Text ? 'Yes' : 'No (Invalid UTF-8)',
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

function numberRows(text, config) {
  if (!text) return ''
  const start = parseInt(config?.start) || 1
  const pad = Math.max(0, parseInt(config?.pad) || 0)
  const separator = config?.separator ?? '. '
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const num = (start + i).toString()
    const numStr = pad ? num.padStart(pad, '0') : num
    return `${numStr}${separator}${line}`
  }).join('\n')
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

// xmlFormatter has been moved to lib/tools/xmlFormatter.js
// It is now lazy-loaded only when the 'xml-formatter' tool is invoked

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

function delimiterTransformer(text, config) {
  if (!text) return ''

  let delimiter = config?.delimiter ?? ' '
  const mode = config?.mode ?? 'rows'
  let joinSeparator = config?.joinSeparator ?? ' '

  // Ensure delimiter is not empty - default to space if it somehow becomes empty
  if (!delimiter || delimiter === '') {
    delimiter = ' '
  }

  // Split text: prioritize newlines (how editor stores rows), then fall back to delimiter
  let items
  if (text.includes('\n')) {
    // If text has newlines, split by newlines (editor-formatted rows)
    items = text.split('\n').filter(item => item.trim().length > 0)
  } else if (delimiter === ' ') {
    // For space delimiter on single-line text, split and filter empty strings
    items = text.split(delimiter).filter(item => item.length > 0)
  } else {
    // For other delimiters, split, trim, and filter
    items = text.split(delimiter).map(item => item.trim()).filter(item => item.length > 0)
  }

  if (mode === 'rows') {
    // Convert to rows: each item on a new line
    return items.join('\n')
  } else if (mode === 'singleLine') {
    // Convert to single line: rejoin items with the specified separator
    // Ensure joinSeparator is not empty - default to space if it is
    if (!joinSeparator || joinSeparator === '') {
      joinSeparator = ' '
    }
    return items.join(joinSeparator)
  }

  return text
}

function asciiUnicodeConverter(text, config) {
  const autoDetect = config.autoDetect !== false // defaults to true
  let mode = config.mode || 'toCode'

  // Auto-detect the mode if enabled
  if (autoDetect) {
    // Check if input looks like numbers (space-separated, comma-separated, or mixed)
    const trimmed = text.trim()
    // Match: space-separated, comma-separated, comma-space separated, or combinations
    const hasOnlyNumbers = /^[\d\s,]+$/.test(trimmed) && /\d/.test(trimmed)
    // Additional check: should contain at least one separator (space or comma) to be detected as codes
    const hasSeparator = /[\s,]/.test(trimmed)

    if (hasOnlyNumbers && hasSeparator && trimmed.length > 0) {
      mode = 'toText'
    } else {
      mode = 'toCode'
    }
  }

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

// SVG optimization functions have been moved to lib/tools/svgOptimizer.js

// Phase 2: Optimization Level Presets
const PHASE2_PRESETS = {
  safe: {
    name: 'Safe',
    description: 'Attribute cleanup only. Preserves rendering, accessibility, and identifiers. Best for production.',
    config: {
      attributeCleanup: { enabled: true },
      removeUnusedDefs: { enabled: false },
      removeEmptyGroups: { enabled: true },
      precisionReduction: { enabled: false },
      shapeConversion: { enabled: false },
      pathMerging: { enabled: false },
      idCleanup: { enabled: false, mode: 'preserve' },
      textHandling: { mode: 'preserve' }
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Attribute cleanup + selective precision reduction and shape conversion. Small, unnoticeable changes.',
    config: {
      attributeCleanup: { enabled: true },
      removeUnusedDefs: { enabled: true },
      removeEmptyGroups: { enabled: true },
      precisionReduction: { enabled: true, decimals: 3 },
      shapeConversion: { enabled: false },
      pathMerging: { enabled: false },
      idCleanup: { enabled: true, mode: 'unused-only' },
      textHandling: { mode: 'preserve' }
    }
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Maximum size reduction including ID minification. May break external references. Advanced use only.',
    config: {
      attributeCleanup: { enabled: true },
      removeUnusedDefs: { enabled: true },
      removeEmptyGroups: { enabled: true },
      precisionReduction: { enabled: true, decimals: 2 },
      shapeConversion: { enabled: true },
      pathMerging: { enabled: true },
      idCleanup: { enabled: true, mode: 'minify' },
      textHandling: { mode: 'preserve' }
    }
  }
}

// Phase 2: Safety Gating Rules
// REFACTORED: Only blocks on truly impossible operations, not on feature-based safety checks
// Safety concerns are now reported in linting/analysis, not enforced silently
function checkSafetyGates(optimization, safetyFlags, config) {
  const gating = {
    allowed: true,
    reason: null,
    skipped: false
  }

  switch (optimization) {
    // Precision reduction: allow user choice; warnings are in linting/analysis
    case 'precisionReduction':
      // No blocking - user's choice is respected
      // Linting will warn about text/masks/filters if precision is set too aggressively
      break

    // Shape conversion: allow user choice; warnings are in linting/analysis
    case 'shapeConversion':
      // No blocking - user's choice is respected
      // Linting will warn about animations/scripts if shape conversion is enabled
      break

    // Path merging: requires shape conversion to work
    case 'pathMerging':
      if (config.shapeConversion?.enabled !== true) {
        gating.allowed = false
        gating.reason = 'Path merging skipped (requires shape conversion, which is disabled)'
        gating.skipped = true
      }
      break

    // ID cleanup: allow user choice; warnings are in linting/analysis
    case 'idCleanup':
      // No blocking - user's choice is respected
      // Linting will warn about broken references and external refs if ID cleanup is enabled
      // Advanced users may want to fix broken refs by removing unused IDs
      break

    // Text-to-path conversion: ONLY block if not confirmed (required by user)
    case 'textHandling':
      if (config.textHandling?.mode === 'convert-to-path' && !config.textHandling.userConfirmed) {
        gating.allowed = false
        gating.reason = 'Text-to-path conversion requires explicit user confirmation'
        gating.skipped = true
      }
      break
  }

  return gating
}

// Helper: Clean presentation attributes
function cleanAttributes(svg, safetyFlags) {
  let cleaned = svg
  const defaultAttrs = {
    fill: 'black',
    stroke: 'none',
    'stroke-width': '1',
    opacity: '1',
    'fill-rule': 'nonzero'
  }

  // Remove attributes with default values
  for (const [attr, defaultValue] of Object.entries(defaultAttrs)) {
    const pattern = new RegExp(`\\s${attr}="${defaultValue}"`, 'gi')
    cleaned = cleaned.replace(pattern, '')
  }

  // Remove redundant attributes (e.g., fill="none" when stroke is present)
  cleaned = cleaned.replace(/\sfill="none"\s+stroke=/g, ' stroke=')

  return { svg: cleaned }
}

// Helper: Reduce precision in numbers (attribute-aware)
function reducePrecision(svg, decimals, safetyFlags = {}) {
  let reduced = svg
  const textRelatedAttrs = ['font-size', 'dx', 'dy', 'letter-spacing', 'word-spacing']

  // Process attribute-by-attribute
  reduced = reduced.replace(/([\w-]+)="([^"]*)"/g, (match, attr, value) => {
    // Skip text-related attributes when text is present
    if (safetyFlags.hasText && textRelatedAttrs.includes(attr)) {
      return match
    }

    // Reduce precision in numeric values
    const reducedValue = value.replace(/(\d+\.\d+)/g, (numMatch) => {
      const num = parseFloat(numMatch)
      return num.toFixed(decimals)
    })

    return `${attr}="${reducedValue}"`
  })

  return { svg: reduced }
}

// Helper: Convert shapes to paths (simplified)
function convertShapesToPaths(svg, allowedShapes = ['rect', 'circle', 'ellipse', 'line', 'polygon']) {
  // DISABLED: Shape conversion requires proper SVG->Path conversion math
  // Simply copying attributes from shapes to paths produces invalid SVG
  // (paths need d="..." not x/y/width/height/cx/cy/r attributes)
  // TODO: Implement with proper geometry conversion library or skip in aggressive mode
  return { svg: svg, convertedCount: 0 }
}

// Helper: Merge consecutive paths with identical styles
function mergePaths(svg) {
  let merged = svg
  let mergedCount = 0

  const pathPattern = /<path([^>]*)\/>/g
  const paths = []
  let match

  while ((match = pathPattern.exec(svg)) !== null) {
    paths.push({ fullTag: match[0], attrs: match[1] })
  }

  // Group by style signature
  const styleGroups = {}
  paths.forEach((path) => {
    const fillMatch = path.attrs.match(/fill="([^"]*)"/)?.[1] || 'black'
    const strokeMatch = path.attrs.match(/stroke="([^"]*)"/)?.[1] || 'none'
    const key = `${fillMatch}|${strokeMatch}`

    if (!styleGroups[key]) styleGroups[key] = []
    styleGroups[key].push(path)
  })

  // Merge consecutive paths in same group
  for (const group of Object.values(styleGroups)) {
    if (group.length > 1) {
      const dValues = group.map((p) => p.attrs.match(/d="([^"]*)"/)?.[1] || '').filter(Boolean)
      if (dValues.length === group.length) {
        const mergedD = dValues.join(' ')
        // CRITICAL FIX: Close the d attribute quote properly
        const mergedPath = `<path${group[0].attrs.replace(/d="[^"]*"/, `d="${mergedD}"`)} />`

        // Replace first occurrence and remove rest
        let firstReplaced = false
        group.forEach((path) => {
          if (!firstReplaced) {
            merged = merged.replace(path.fullTag, mergedPath)
            firstReplaced = true
          } else {
            merged = merged.replace(path.fullTag, '')
          }
        })

        mergedCount += group.length - 1
      }
    }
  }

  return { svg: merged, mergedCount }
}

// Helper: Build complete ID graph (unconditional, always run analysis)
// This is the single source of truth for ID usage in the SVG
function buildIdGraph(svg) {
  const idPattern = /\bid="([^"]+)"/g
  const refPattern = /url\(#([^)]+)\)|xlink:href="#([^"]+)"|href="#([^"]+)"|<use[^>]+href="#([^"]+)"|aria-labelledby="([^"]+)"|aria-describedby="([^"]+)"/g

  const definedIDs = new Set()
  const usedIDs = new Set()
  const idToElements = new Map() // Track which element has each ID

  // Find all defined IDs and their context
  let match
  const idWithContextPattern = /<(\w+)\s+[^>]*id="([^"]+)"[^>]*>/gi
  while ((match = idWithContextPattern.exec(svg)) !== null) {
    const elementType = match[1].toLowerCase()
    const idValue = match[2]
    definedIDs.add(idValue)
    if (!idToElements.has(idValue)) {
      idToElements.set(idValue, [])
    }
    idToElements.get(idValue).push({ type: elementType })
  }

  // Find all referenced IDs (internal references only)
  const refPatternReset = /url\(#([^)]+)\)|xlink:href="#([^"]+)"|href="#([^"]+)"|<use[^>]+href="#([^"]+)"|aria-labelledby="([^"]+)"|aria-describedby="([^"]+)"/g
  while ((match = refPatternReset.exec(svg)) !== null) {
    const refID = match[1] || match[2] || match[3] || match[4] || match[5] || match[6]
    if (refID) {
      usedIDs.add(refID)
    }
  }

  return {
    defined: definedIDs,
    used: usedIDs,
    unused: new Set([...definedIDs].filter(id => !usedIDs.has(id))),
    idToElements,
    isIDUsed: (id) => usedIDs.has(id),
    isIDUnused: (id) => !usedIDs.has(id)
  }
}

// Helper: Clean up unused IDs
function cleanupIDs(svg, mode = 'preserve', safetyFlags = {}, idGraph = null) {
  // Use provided idGraph or build one
  const graph = idGraph || buildIdGraph(svg)
  let cleaned = svg
  let removedCount = 0

  if (mode === 'unused-only') {
    // Remove IDs that are not internally referenced
    // This applies to ALL elements: defs, shapes, groups, text, etc.
    graph.unused.forEach((id) => {
      const escapedID = id.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
      // Match and remove: whitespace (if present) + id="value"
      // This handles both " id="value"" and "id="value""
      cleaned = cleaned.replace(new RegExp(`\\s*id="${escapedID}"`, 'g'), '')
      // Clean up any resulting double spaces
      cleaned = cleaned.replace(/\s{2,}/g, ' ')
      removedCount++
    })
  } else if (mode === 'minify') {
    // Minify IDs: map all IDs to shorter names
    // CRITICAL INVARIANT SEQUENCE:
    // 1. Build mapping of all defined IDs
    // 2. Rewrite ALL references FIRST (before touching definitions)
    // 3. Rewrite ID definitions
    // 4. Verify ZERO broken references (fail hard if any exist)
    // 5. Only then remove unused IDs

    const idMap = {}
    let minifyIndex = 0

    const minifyID = (index) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (index < 52) return chars[index]
      let result = ''
      while (index >= 0) {
        result = chars[index % 52] + result
        index = Math.floor(index / 52) - 1
      }
      return result
    }

    // Step 1: Map ALL IDs (both used and unused) to minified names
    graph.defined.forEach((id) => {
      const newID = minifyID(minifyIndex++)
      idMap[id] = newID
    })

    // Step 2: Rewrite ALL references FIRST
    // This ensures no broken links before we touch definitions
    // Critical: use literal string.replace() with function callback to avoid regex escaping issues
    Object.entries(idMap).forEach(([oldID, newID]) => {
      // Replace all occurrences of "#oldID" with "#newID" (handles all attribute types)
      cleaned = cleaned.split(`"#${oldID}"`).join(`"#${newID}"`)
      // Replace all occurrences of url(#oldID) with url(#newID) (common in fill/stroke/mask)
      cleaned = cleaned.split(`url(#${oldID})`).join(`url(#${newID})`)
    })

    // Step 3: Now rewrite ID definitions
    // Critical: use literal string replacement to avoid regex escaping issues
    Object.entries(idMap).forEach(([oldID, newID]) => {
      cleaned = cleaned.split(`id="${oldID}"`).join(`id="${newID}"`)
      removedCount++
    })

    // Step 4: HARD VERIFICATION - zero broken references allowed
    const verifyGraph = buildIdGraph(cleaned)

    // Check for broken references (references to non-existent IDs)
    const brokenRefs = [...verifyGraph.used].filter(id => !verifyGraph.defined.has(id))

    if (brokenRefs.length > 0) {
      // INVARIANT VIOLATION: ID minification created broken references
      // This is a critical bug that should never happen
      const errorMsg = `ID minification invariant violated: broken references found: ${brokenRefs.join(', ')}`
      console.error('[SVG Optimizer]', errorMsg)

      // Return original SVG and mark as failed
      return {
        svg: svg,
        removedCount: 0,
        usedCount: graph.used.size,
        minificationFailed: true,
        failureReason: errorMsg
      }
    }

    // Check for unexpected unused IDs (shouldn't happen after minification)
    if (verifyGraph.unused.size > 0) {
      console.warn('[SVG Optimizer] ID minification resulted in unused IDs (unexpected):', Array.from(verifyGraph.unused))
    }
  }

  return { svg: cleaned, removedCount, usedCount: graph.used.size }
}

// Helper: Handle text elements based on mode
function textHandling(svg, mode = 'preserve', userConfirmed = false) {
  let transformed = svg
  let textCount = 0

  if (mode === 'preserve') {
    return { svg: transformed, textCount: 0 }
  }

  if (mode === 'warn-only') {
    const textPattern = /<text[^>]*>/gi
    textCount = (svg.match(textPattern) || []).length
    return { svg: transformed, textCount }
  }

  if (mode === 'convert-to-path' && userConfirmed) {
    const textPattern = /<text([^>]*)>(.*?)<\/text>/gi
    const matches = svg.matchAll(textPattern)

    for (const match of matches) {
      const attrs = match[1]
      const content = match[2]
      if (content && content.trim()) {
        const pathData = `d="M 0 0 L ${content.length * 8} 0"`
        transformed = transformed.replace(match[0], `<path${attrs} ${pathData} />`)
        textCount++
      }
    }
  }

  return { svg: transformed, textCount }
}

// Helper: Remove unused definitions from <defs>
function removeUnusedDefsFromSvg(svg, references) {
  let result = svg
  let bytesRemoved = 0

  try {
    const defsMatch = result.match(/<defs\b[^>]*>([\s\S]*?)<\/defs>/i)
    if (!defsMatch) return result

    const defsContent = defsMatch[1]
    const defPattern = /<(linearGradient|radialGradient|pattern|mask|filter|clipPath|marker|symbol)\s*[^>]*id="([^"]+)"[^>]*>/gi

    let defMatch
    while ((defMatch = defPattern.exec(defsContent)) !== null) {
      const id = defMatch[2]
      if (!references.idsReferenced.includes(id)) {
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const defRemovalPattern = new RegExp(
          `<(linearGradient|radialGradient|pattern|mask|filter|clipPath|marker|symbol)\\s*[^>]*id="${escapedId}"[^>]*>(?:[^<]|<(?!/\\1))*</\\1>`,
          'gi'
        )

        const before = result.length
        result = result.replace(defRemovalPattern, '')
        bytesRemoved += before - result.length
      }
    }

    // Remove empty defs
    result = result.replace(/<defs\b[^>]*>\s*<\/defs>/gi, '')
  } catch (error) {
    // Silently fail
  }

  return result
}

// Helper: Remove empty group elements and flatten attributeless groups
// Now ID-aware and attribute-aware: won't remove groups with unused IDs or rendering attributes
function removeEmptyGroupsFromSvg(svg, idGraph = null) {
  // Build or use provided ID graph
  const graph = idGraph || buildIdGraph(svg)

  let result = svg
  const before = result.length
  let removedCount = 0

  try {
    let changed = true
    let iterations = 0
    const maxIterations = 100

    while (changed && iterations < maxIterations) {
      changed = false
      iterations++

      // Rendering attributes that should prevent group removal
      // These attributes affect visual output even if the group is empty or flat
      const renderingAttrs = [
        'transform',
        'opacity',
        'fill',
        'stroke',
        'clip-path',
        'mask',
        'filter',
        'display',
        'visibility',
        'pointer-events',
        'mix-blend-mode'
      ]

      // Remove completely empty groups with NO attributes and NO content: <g></g> or <g> </g> or <g>\n</g>
      const emptyGroupPattern = /<g\s*>\s*<\/g>/gi
      const afterEmpty = result.replace(emptyGroupPattern, (match) => {
        // This group is truly empty, safe to remove
        return ''
      })
      if (afterEmpty !== result) {
        removedCount++
        result = afterEmpty
        changed = true
      }

      // Flatten groups with no attributes but with children: <g>content</g> → content
      // BUT: preserve if group has rendering attributes OR has an ID that's unused (to avoid cascading issues)
      // [\s\S]*? matches any character including newlines, non-greedily
      const attributelessGroupPattern = /<g\s*>([\s\S]*?)<\/g>/gi

      const afterFlatten = result.replace(attributelessGroupPattern, (match, content) => {
        // Check if this <g> tag has any attributes
        const openTagMatch = match.match(/<g\s+([^>]*)>/i)

        if (!openTagMatch) {
          // No attributes at all, safe to flatten
          return content
        }

        const attrs = openTagMatch[1]

        // Check for rendering attributes
        const hasRenderingAttr = renderingAttrs.some(attr => {
          const attrPattern = new RegExp(`\\b${attr}\\s*=`, 'i')
          return attrPattern.test(attrs)
        })

        if (hasRenderingAttr) {
          // Has rendering attributes, keep the group structure
          return match
        }

        // Check for ID attribute
        const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)
        if (idMatch) {
          const idValue = idMatch[1]
          // If this ID is unused, keep the group (ID cleanup hasn't run yet or is disabled)
          // If this ID is used, we can flatten (references are maintained via parent structure)
          if (graph.isIDUnused(idValue)) {
            return match
          }
        }

        // Safe to flatten: no rendering attributes, no unused IDs
        return content
      })

      if (afterFlatten !== result) {
        removedCount++
        result = afterFlatten
        changed = true
      }
    }
  } catch (error) {
    // Silently fail
  }

  const bytesRemoved = before - result.length
  return { result, bytesRemoved, removedCount }
}

// Main Phase 2 Orchestrator
function applyPhase2Optimization(phase0_1Result, optimizationLevel, advancedOverrides = {}, config = {}) {
  if (!phase0_1Result || phase0_1Result.error) {
    return { ...phase0_1Result, phase2Applied: false }
  }

  if (!phase0_1Result.validation.isValid) {
    return {
      ...phase0_1Result,
      optimizationResult: 'blocked',
      blockedReason: 'Phase 0–1 validation failed',
      phase2Applied: false
    }
  }

  const preset = PHASE2_PRESETS[optimizationLevel] || PHASE2_PRESETS.safe
  let phase2Config = { ...preset.config }

  // Apply advanced overrides - these override the preset values
  if (advancedOverrides.attributeCleanup !== undefined) {
    phase2Config.attributeCleanup = { ...phase2Config.attributeCleanup, enabled: advancedOverrides.attributeCleanup }
  }
  if (advancedOverrides.removeUnusedDefs !== undefined) {
    phase2Config.removeUnusedDefs = { ...phase2Config.removeUnusedDefs, enabled: advancedOverrides.removeUnusedDefs }
  }
  if (advancedOverrides.removeEmptyGroups !== undefined) {
    phase2Config.removeEmptyGroups = { ...phase2Config.removeEmptyGroups, enabled: advancedOverrides.removeEmptyGroups }
  }
  if (advancedOverrides.precisionReduction !== undefined) {
    phase2Config.precisionReduction = { ...phase2Config.precisionReduction, enabled: advancedOverrides.precisionReduction }
  }
  if (advancedOverrides.decimals !== undefined) {
    phase2Config.precisionReduction = { ...phase2Config.precisionReduction, decimals: advancedOverrides.decimals }
  }
  if (advancedOverrides.shapeConversion !== undefined) {
    phase2Config.shapeConversion = { ...phase2Config.shapeConversion, enabled: advancedOverrides.shapeConversion }
  }
  if (advancedOverrides.pathMerging !== undefined) {
    phase2Config.pathMerging = { ...phase2Config.pathMerging, enabled: advancedOverrides.pathMerging }
  }
  if (advancedOverrides.idCleanup !== undefined) {
    phase2Config.idCleanup = { ...phase2Config.idCleanup, mode: advancedOverrides.idCleanup, enabled: advancedOverrides.idCleanup !== 'preserve' }
  }
  if (advancedOverrides.textHandling !== undefined) {
    phase2Config.textHandling = { ...phase2Config.textHandling, mode: advancedOverrides.textHandling }
  }
  if (advancedOverrides.textToPathConfirmed !== undefined) {
    phase2Config.textHandling = { ...phase2Config.textHandling, userConfirmed: advancedOverrides.textToPathConfirmed }
  }

  // Pipeline execution with snapshots
  let currentSvg = phase0_1Result.optimizedSvg
  let lastGoodSvg = currentSvg
  const stepResults = []
  let blockedReason = null
  let failedStep = null

  // AGGRESSIVE MODE GUARDRAIL: Detect if SVG is truly standalone
  // Warn if ID minification will break external CSS/JS selectors
  let isStandaloneSvg = true
  let aggressiveWarnings = []

  if (phase2Config.idCleanup?.mode === 'minify') {
    // Check for style elements or class selectors that suggest external CSS dependency
    const hasStyleTag = /<style[\s>]/i.test(currentSvg)
    const hasClassSelectors = /class=["']([^"']+)["']/i.test(currentSvg)
    const hasDataAttributes = /data-/i.test(currentSvg)

    if (hasStyleTag) {
      isStandaloneSvg = false
      aggressiveWarnings.push('Contains <style> tag: ID minification will break internal CSS rules')
    }

    if (hasClassSelectors && !phase0_1Result.safetyFlags?.hasExternalRefs) {
      // Class selectors only matter if they reference external CSS, but we warn anyway
      aggressiveWarnings.push('Uses class selectors: Ensure no external CSS references will break')
    }

    if (hasDataAttributes) {
      aggressiveWarnings.push('Contains data-* attributes: Check if external JS depends on these')
    }
  }

  // Build ID graph unconditionally (analysis layer, always runs)
  // This is the single source of truth for ID usage throughout the pipeline
  let currentIdGraph = buildIdGraph(currentSvg)

  // Initialize finalOutputSvg early so it can be used in post-pass verification
  let finalOutputSvg = null

  const steps = [
    { name: 'attributeCleanup', fn: () => cleanAttributes(currentSvg, phase0_1Result.safetyFlags) },
    // CRITICAL: ID cleanup must run BEFORE removeUnusedDefs
    // so that ID minification has access to all defs before they are removed
    { name: 'idCleanup', fn: () => cleanupIDs(currentSvg, phase2Config.idCleanup.mode, phase0_1Result.safetyFlags, currentIdGraph) },
    // Now safe to remove unused defs since ID minification is complete
    // Use current ID graph instead of original references (IDs may have been minified)
    { name: 'removeUnusedDefs', fn: () => {
      const defsResult = removeUnusedDefsFromSvg(currentSvg, { idsReferenced: Array.from(currentIdGraph.used) })
      return { svg: defsResult, removedCount: 0 }
    } },
    { name: 'removeEmptyGroups', fn: () => {
      const result = removeEmptyGroupsFromSvg(currentSvg, currentIdGraph)
      return { svg: result.result, removedCount: result.removedCount }
    } },
    { name: 'precisionReduction', fn: () => reducePrecision(currentSvg, phase2Config.precisionReduction.decimals, phase0_1Result.safetyFlags) },
    { name: 'shapeConversion', fn: () => convertShapesToPaths(currentSvg, phase2Config.shapeConversion.allowedShapes) },
    { name: 'pathMerging', fn: () => mergePaths(currentSvg) },
    { name: 'removeEmptyGroupsAfterIdCleanup', fn: () => {
      const result = removeEmptyGroupsFromSvg(currentSvg, currentIdGraph)
      return { svg: result.result, removedCount: result.removedCount }
    } },
    { name: 'textHandling', fn: () => textHandling(currentSvg, phase2Config.textHandling.mode, phase2Config.textHandling.userConfirmed) }
  ]

  for (const step of steps) {
    const gating = checkSafetyGates(step.name, phase0_1Result.safetyFlags, phase2Config)

    if (!gating.allowed) {
      stepResults.push({
        step: step.name,
        executed: false,
        skipped: true,
        reason: gating.reason,
        impact: `${step.name} was skipped — this may reduce optimization effectiveness`
      })
      continue
    }

    // Check if step is enabled in config
    let stepEnabled = false
    if (step.name === 'attributeCleanup') {
      stepEnabled = phase2Config.attributeCleanup?.enabled !== false
    } else if (step.name === 'removeUnusedDefs') {
      stepEnabled = phase2Config.removeUnusedDefs?.enabled !== false
    } else if (step.name === 'removeEmptyGroups') {
      stepEnabled = phase2Config.removeEmptyGroups?.enabled !== false
    } else if (step.name === 'precisionReduction') {
      stepEnabled = phase2Config.precisionReduction?.enabled !== false
    } else if (step.name === 'shapeConversion') {
      stepEnabled = phase2Config.shapeConversion?.enabled !== false
    } else if (step.name === 'pathMerging') {
      stepEnabled = phase2Config.pathMerging?.enabled !== false
    } else if (step.name === 'idCleanup') {
      stepEnabled = phase2Config.idCleanup?.enabled !== false
    } else if (step.name === 'removeEmptyGroupsAfterIdCleanup') {
      stepEnabled = phase2Config.removeEmptyGroups?.enabled !== false
    } else if (step.name === 'textHandling') {
      stepEnabled = phase2Config.textHandling?.mode !== 'preserve'
    }

    if (!stepEnabled) {
      stepResults.push({
        step: step.name,
        executed: false,
        reason: 'Disabled in config'
      })
      continue
    }

    // CRITICAL GUARANTEE: Rebuild ID graph BEFORE steps that depend on it
    // This ensures idCleanup, removeEmptyGroups, and removeUnusedDefs always work with current SVG state
    // Must happen BEFORE step.fn() executes, not after
    if (step.name === 'idCleanup' || step.name === 'removeEmptyGroupsAfterIdCleanup' || step.name === 'removeUnusedDefs') {
      currentIdGraph = buildIdGraph(currentSvg)
    }

    try {
      const result = step.fn()
      currentSvg = result.svg || result

      // HARD INVARIANT: ID minification must never produce broken references
      // If minification fails, abort it and downgrade optimization level
      if (step.name === 'idCleanup' && result.minificationFailed) {
        console.warn('[SVG Optimizer] ID minification failed: invariant violation detected. Downgrading to balanced mode.')

        // Mark this step as failed but downgrade rather than abort
        stepResults.push({
          step: step.name,
          executed: false,
          skipped: true,
          reason: result.failureReason,
          impact: 'ID minification failed invariant check. Downgraded to balanced-equivalent optimization.',
          downgraded: true
        })

        // Revert SVG to last good state
        currentSvg = lastGoodSvg

        // Clear the minify option to prevent retry
        phase2Config.idCleanup.mode = 'preserve'
        phase2Config.idCleanup.enabled = false

        // Skip remaining minification-dependent steps and continue
        continue
      }

      const validation = validateSVG(currentSvg)
      if (!validation.isValid) {
        currentSvg = lastGoodSvg
        blockedReason = `Step ${step.name} produced invalid SVG`
        failedStep = step.name
        break
      }

      lastGoodSvg = currentSvg

      // After any step that mutates IDs (idCleanup), rebuild graph for downstream steps
      // This ensures removeEmptyGroupsAfterIdCleanup uses the current ID state, not stale data
      if (step.name === 'idCleanup') {
        currentIdGraph = buildIdGraph(currentSvg)
      }

      // Build contextual message for each step
      let stepMessage = ''
      if (step.name === 'precisionReduction' && phase0_1Result.safetyFlags.hasText) {
        stepMessage = 'Precision reduced on numeric attributes; text-related attributes preserved'
      } else if (step.name === 'attributeCleanup' && result.removedCount === 0) {
        stepMessage = 'No redundant attributes found'
      } else if (step.name === 'pathMerging' && result.mergedCount === 0) {
        stepMessage = 'No mergeable paths (styles differ or paths non-adjacent)'
      } else if (step.name === 'idCleanup' && result.removedCount === 0 && phase2Config.idCleanup?.mode === 'minify') {
        stepMessage = 'All IDs are in use and cannot be removed'
      } else if (step.name === 'idCleanup' && phase2Config.idCleanup?.mode === 'minify') {
        stepMessage = 'IDs minified with zero broken references verified'
      }

      stepResults.push({
        step: step.name,
        executed: true,
        message: stepMessage,
        result: {
          convertedCount: result.convertedCount,
          mergedCount: result.mergedCount,
          removedCount: result.removedCount,
          textCount: result.textCount,
          usedCount: result.usedCount
        }
      })
    } catch (error) {
      currentSvg = lastGoodSvg
      blockedReason = `Error in ${step.name}: ${error.message}`
      failedStep = step.name
      break
    }
  }

  // POST-PASS VERIFICATION: Verify zero broken references in final output
  // This is a hard assertion - if broken references exist, we have a bug
  try {
    const finalIdGraph = buildIdGraph(currentSvg)
    const brokenReferences = [...finalIdGraph.used].filter(id => !finalIdGraph.defined.has(id))

    if (brokenReferences.length > 0) {
      // CRITICAL: This should never happen in production
      console.error('[SVG Optimizer] CRITICAL: Broken ID references detected in final output:', brokenReferences)

      // Add a warning to linting
      blockedReason = `Optimization produced broken references: ${brokenReferences.join(', ')}. Output is invalid.`
      failedStep = 'post-pass-verification'

      // Revert to last good SVG
      currentSvg = lastGoodSvg
      finalOutputSvg = currentSvg
    }
  } catch (error) {
    console.error('[SVG Optimizer] Post-pass verification failed:', error.message)
  }

  // Merge empty groups reporting: combine removeEmptyGroups and removeEmptyGroupsAfterIdCleanup
  // This avoids confusing reporting of intermediate 0 counts
  const removeEmptyGroupsIdx = stepResults.findIndex(sr => sr.step === 'removeEmptyGroups')
  const removeEmptyGroupsAfterIdIdx = stepResults.findIndex(sr => sr.step === 'removeEmptyGroupsAfterIdCleanup')

  if (removeEmptyGroupsIdx >= 0 && removeEmptyGroupsAfterIdIdx >= 0) {
    const beforeResult = stepResults[removeEmptyGroupsIdx]
    const afterResult = stepResults[removeEmptyGroupsAfterIdIdx]

    const beforeCount = beforeResult.executed ? (beforeResult.removedCount || 0) : 0
    const afterCount = afterResult.executed ? (afterResult.removedCount || 0) : 0
    const totalCount = beforeCount + afterCount

    // If nothing was removed in either pass, remove both results
    if (totalCount === 0) {
      stepResults.splice(removeEmptyGroupsIdx, 1)
      // Re-find the index after the first splice
      const afterIdx = stepResults.findIndex(sr => sr.step === 'removeEmptyGroupsAfterIdCleanup')
      if (afterIdx >= 0) {
        stepResults.splice(afterIdx, 1)
      }
    }
    // If something was removed, consolidate into a single result
    else {
      // Remove the first result
      stepResults.splice(removeEmptyGroupsIdx, 1)

      // Update the second result with combined message
      const updatedResult = stepResults.findIndex(sr => sr.step === 'removeEmptyGroupsAfterIdCleanup')
      if (updatedResult >= 0) {
        stepResults[updatedResult].step = 'removeEmptyGroups'

        // Generate appropriate message based on what was removed
        if (beforeCount > 0 && afterCount > 0) {
          stepResults[updatedResult].message = `${totalCount} empty groups removed (${afterCount} after ID cleanup)`
        } else if (afterCount > 0) {
          stepResults[updatedResult].message = `${afterCount} empty groups removed (after ID cleanup)`
        } else {
          stepResults[updatedResult].message = `${beforeCount} empty groups removed`
        }

        stepResults[updatedResult].removedCount = totalCount
      }
    }
  }

  // Re-run Phase 0–1 analysis on optimized SVG
  const finalStats = calculateOptimizationStats(phase0_1Result.originalSvg, currentSvg)
  const finalDiff = generateDiff(phase0_1Result.originalSvg, currentSvg)

  // Check if any steps actually executed
  const executedSteps = stepResults.filter(sr => sr.executed)
  const phase2Executed = executedSteps.length > 0
  const phase2Changed = currentSvg !== phase0_1Result.optimizedSvg

  // CRITICAL FIX: Reformat the Phase 2 optimized SVG using the same output format
  // This ensures outputSvg is synced with optimizedSvg (the single source of truth)
  const outputFormat = config.outputFormat || phase0_1Result.outputFormat || 'compact'
  finalOutputSvg = currentSvg

  if (outputFormat === 'pretty') {
    finalOutputSvg = formatSVGPretty(currentSvg)
  } else {
    finalOutputSvg = formatSVGCompact(currentSvg)
  }

  // RE-ANALYZE ON OPTIMIZED SVG: Always recompute analysis after Phase 2 optimization
  // This ensures analysis, references, and linting reflect the final optimized SVG state,
  // not the original input state
  const inputLinting = phase0_1Result.linting  // Preserve input state for comparison
  let finalAnalysis = phase0_1Result.analysis
  let finalLinting = phase0_1Result.linting

  try {
    // Always re-analyze the optimized SVG (don't condition on phase2Changed)
    // because the contract is that analysis must reflect the current SVG state
    finalAnalysis = analyzeSVGStructure(currentSvg)
    finalLinting = lintSVG(currentSvg, finalAnalysis)

    // Enhance linting with Phase 2 context-aware messaging
    if (phase2Changed && phase2Config.idCleanup?.enabled) {
      // Remove generic ID message and replace with context-aware version
      const genericIdHintIndex = finalLinting.hints.findIndex(h => h.message && h.message.includes('ID(s) found in SVG'))
      if (genericIdHintIndex >= 0) {
        finalLinting.hints.splice(genericIdHintIndex, 1)
      }

      // Add context-aware ID message based on cleanup mode
      if (phase2Config.idCleanup.mode === 'unused-only') {
        const unusedIds = finalAnalysis.references.idsDefined.filter(
          id => !finalAnalysis.references.idsReferenced.includes(id)
        )
        if (unusedIds.length === 0) {
          finalLinting.hints.push({
            category: 'maintainability',
            level: 'info',
            message: 'No unused IDs found',
            description: 'All IDs in the SVG are internally referenced. ID cleanup completed successfully.'
          })
        } else {
          finalLinting.hints.push({
            category: 'maintainability',
            level: 'info',
            message: `${finalAnalysis.references.idsReferenced.length} internally referenced ID(s) preserved`,
            description: `IDs: ${finalAnalysis.references.idsReferenced.join(', ')}`
          })
        }
      } else if (phase2Config.idCleanup.mode === 'minify') {
        finalLinting.hints.push({
          category: 'maintainability',
          level: 'info',
          message: `All ${finalAnalysis.references.idsDefined.length} ID(s) minified`,
          description: 'IDs have been shortened (a, b, c...). External CSS/JS selectors will break. For standalone SVGs only.'
        })

        // Add aggressive mode guardrail warnings
        if (aggressiveWarnings.length > 0) {
          aggressiveWarnings.forEach(warning => {
            finalLinting.warnings = finalLinting.warnings || []
            finalLinting.warnings.push({
              category: 'aggressive-mode',
              level: 'warning',
              message: 'Aggressive mode compatibility check',
              description: warning
            })
          })
        }

        // If SVG is not standalone, add strong warning
        if (!isStandaloneSvg) {
          finalLinting.warnings = finalLinting.warnings || []
          finalLinting.warnings.push({
            category: 'aggressive-mode',
            level: 'warning',
            message: '⚠️ This SVG may not be standalone',
            description: 'ID minification will break CSS/JS selectors that reference the minified IDs. Deploy to production only if this SVG is truly self-contained.'
          })
        }
      }
    }
  } catch (error) {
    // Log for debugging but continue with original analysis
    console.error('[SVG Optimizer] Re-analysis error:', error.message)
  }

  const phase2Result = {
    ...phase0_1Result,
    optimizedSvg: currentSvg,
    outputSvg: finalOutputSvg,
    optimizationResult: failedStep ? 'blocked' : phase2Changed ? 'changes_applied' : phase2Executed ? 'changes_applied' : 'no_changes',
    blockedReason: failedStep ? blockedReason : null,
    failedStep,
    stats: finalStats,
    diff: finalDiff,
    phase2Applied: phase2Changed,
    phase2Executed: phase2Executed,
    phase2Config: phase2Config,
    phase2Level: optimizationLevel,
    stepResults,
    validation: validateSVG(currentSvg),
    analysis: finalAnalysis,
    linting: finalLinting,
    // Split linting into input (before optimization) and output (after optimization) stages for transparency
    lintingStages: {
      input: inputLinting,
      output: finalLinting
    }
  }

  return phase2Result
}

// SVG Output Formatting (Compact or Pretty)
function formatSVGOutput(svg, format = 'compact') {
  if (format === 'compact') {
    return svg.replace(/\n\s*/g, '').trim()
  } else if (format === 'pretty') {
    let formatted = svg
    let indent = 0
    const indentStr = '  '

    formatted = formatted
      .replace(/>\s*</g, '>\n<')
      .replace(/\s+/g, ' ')
      .trim()

    let result = ''
    let inText = false
    let tagBuffer = ''

    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i]

      if (char === '<' && !inText) {
        if (tagBuffer) {
          result += tagBuffer
          tagBuffer = ''
        }

        const endTag = formatted.substring(i, i + 2) === '</'
        const selfClosing = formatted.substring(i).match(/^<[^>]*\/>/)

        if (endTag) indent--

        if (result && !result.endsWith('\n')) {
          result += '\n'
        }

        result += indentStr.repeat(Math.max(0, indent))
        tagBuffer = '<'
      } else if (char === '>' && !inText) {
        tagBuffer += char
        result += tagBuffer
        tagBuffer = ''

        const isTextStart = /^<text\b/.test(formatted.substring(i - 4))
        const isSelfClosing = formatted.substring(i - 1, i) === '/'
        const isClosing = formatted.substring(i - 1, i) === '</'

        if (isTextStart) inText = true

        if (!isClosing && !isSelfClosing) {
          const tagName = formatted.substring(formatted.lastIndexOf('<', i), i + 1).match(/<(\w+)/)?.[1]
          if (!['circle', 'rect', 'ellipse', 'path', 'line', 'polygon', 'image'].includes(tagName)) {
            indent++
          }
        }

        result += '\n'
      } else if (char === '>' && inText) {
        tagBuffer += char
        if (/<\/text>/.test(tagBuffer)) {
          inText = false
        }
        result += tagBuffer
        tagBuffer = ''
      } else {
        tagBuffer += char
      }
    }

    if (tagBuffer) result += tagBuffer

    return result.replace(/\n\s*\n/g, '\n').trim()
  }

  return svg
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
      return { expression: text, error: 'Empty expression', diagnostics: { isValid: false, info: [], warnings: ['Empty expression'], errors: [{ type: 'error', code: 'EMPTY_EXPRESSION', message: 'Empty expression' }], functionsUsed: [], variables: [], complexity: { nodes: 0, depth: 0 }, numeric: { mode: config.mode, precision: config.precision, rounding: config.rounding, notation: config.notation, precisionRounded: false }, stability: { precisionSensitive: false, roundingSensitive: false, notationSensitive: false, numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754' } } }
    }

    // Whitelist of allowed functions
    // Core math.js + injected custom functions
    const allowedFunctions = [
      // Basic arithmetic and exponents
      'abs', 'sqrt', 'cbrt', 'pow', 'exp',
      // Logarithmic functions (log = natural log)
      'log', 'log10', 'log2',
      // Logarithm aliases and custom functions
      'ln',
      // Trigonometric functions
      'sin', 'cos', 'tan',
      // Trigonometric complements (injected)
      'sec', 'csc', 'cot',
      // Inverse trigonometric
      'asin', 'acos', 'atan', 'atan2',
      // Hyperbolic functions
      'sinh', 'cosh', 'tanh',
      // Inverse hyperbolic (injected)
      'asinh', 'acosh', 'atanh',
      // Rounding and sign functions
      'ceil', 'floor', 'round', 'trunc', 'sign',
      // Aggregation functions
      'min', 'max',
      // Statistical functions (injected)
      'mean', 'median',
      // Number theory functions (injected)
      'factorial', 'gcd', 'lcm',
      // Angle conversion (injected)
      'deg2rad', 'rad2deg'
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
          info: [],
          warnings: [],
          errors: [{ type: 'error', code: 'BIGNUMBER_UNAVAILABLE', message: 'BigNumber mode not available' }],
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
          info: [],
          warnings: [],
          errors: [{ type: 'error', code: 'PARSE_ERROR', message: errorMsg }],
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
    const usedVariables = extractVariableNames(node, allowedFunctions)
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
      const errorMsg = `Unknown function${unknownFunctions.length > 1 ? 's' : ''}: ${unknownFunctions.join(', ')}`
      return {
        expression: trimmed,
        error: errorMsg,
        diagnostics: {
          isValid: false,
          info: [],
          warnings: warnings,
          errors: [{ type: 'error', code: 'UNKNOWN_FUNCTION', message: errorMsg }],
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
            info: [],
            warnings: warnings,
            errors: [{ type: 'error', code: 'UNDEFINED_VARIABLE', message: evaluationError }],
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
            info: [],
            warnings: warnings,
            errors: [{ type: 'error', code: 'DIVISION_BY_ZERO', message: 'Division by zero' }],
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
          info: [],
          warnings: warnings,
          errors: [{ type: 'error', code: 'EVALUATION_ERROR', message: evaluationError }],
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
          info: [],
          warnings: warnings,
          errors: [{ type: 'error', code: 'INVALID_RESULT', message: 'Invalid result type' }],
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
        if (config.rounding === 'floor') {
          warnings.push('Result was rounded down after applying precision')
        } else if (config.rounding === 'ceil') {
          warnings.push('Result was rounded up after applying precision')
        } else {
          const places = config.precision === 1 ? 'place' : 'places'
          warnings.push(`Result was rounded to ${config.precision} decimal ${places} using ${config.rounding}`)
        }
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
    const diagnosticInfo = generateDiagnosticInfo(usedFunctions, finalResult, trimmed)
    return {
      expression: normalizedExpression,
      result: finalResult,
      formattedResult: formattedResult,
      error: null,
      diagnostics: {
        isValid: true,
        info: diagnosticInfo,
        warnings: warnings,
        errors: [],
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
          // reductions is OPTIONAL: only included when explaining value
          // When empty (no warnings, no artifacts), it can be safely omitted
          // Frontend should check: if (phase5.reductions && phase5.reductions.length > 0)
          reductions: reductions.length > 0 ? reductions : undefined,
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
        info: [],
        warnings: [],
        errors: [{ type: 'error', code: 'GENERAL_ERROR', message: errorMsg }],
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

// Generate diagnostic info messages based on functions used and evaluation result
function generateDiagnosticInfo(usedFunctions, result, expression) {
  const info = []

  // Define function categories
  const trigFunctions = new Set(['sin', 'cos', 'tan', 'sec', 'csc', 'cot'])
  const invTrigFunctions = new Set(['asin', 'acos', 'atan', 'asinh', 'acosh', 'atanh'])
  const customExtensions = new Set(['ln', 'factorial', 'gcd', 'lcm', 'sec', 'csc', 'cot', 'asinh', 'acosh', 'atanh', 'deg2rad', 'rad2deg', 'mean', 'median'])

  // Check 1: Trig functions assume radians
  const hasTrigFunctions = usedFunctions.some(fn => trigFunctions.has(fn))
  if (hasTrigFunctions) {
    info.push({
      type: 'assumption',
      code: 'TRIG_RADIANS',
      message: 'trigonometric functions assume radians'
    })
  }

  // Check 2: Custom extensions used
  const hasCustomExtensions = usedFunctions.some(fn => customExtensions.has(fn))
  if (hasCustomExtensions) {
    const customFnUsed = usedFunctions.filter(fn => customExtensions.has(fn))
    info.push({
      type: 'extension',
      code: 'CUSTOM_EXTENSION',
      message: `custom evaluator extensions and aliases: ${customFnUsed.sort().join(', ')}`
    })
  }

  // Check 3: Inverse trig domain validation
  // Note: For now, emit basic domain OK message if any inverse trig is used
  // Full domain validation would require tracking arguments at evaluation time
  const hasInvTrigFunctions = usedFunctions.some(fn => invTrigFunctions.has(fn))
  if (hasInvTrigFunctions && result !== null) {
    info.push({
      type: 'domain',
      code: 'INVERSE_TRIG_DOMAIN_OK',
      message: 'inverse trigonometric inputs were within valid domain'
    })
  }

  return info
}

// Extract all variable names from AST
// Critical: Must traverse complete AST before evaluation
function extractVariableNames(node, allowedFunctions = []) {
  const variables = new Set()
  // Exclude only truly reserved words, not builtin constants (e and pi are included as variables)
  const reserved = new Set(['Infinity', 'undefined', 'null', 'true', 'false'])
  // Use dynamic allowedFunctions list instead of hardcoded - this ensures ln, sec, csc, etc. are excluded
  const knownFunctions = new Set(allowedFunctions)
  const visited = new Set()

  function traverse(n) {
    if (!n || typeof n !== 'object') return

    // Avoid infinite loops on circular references
    if (visited.has(n)) return
    visited.add(n)

    // Capture SymbolNode - only if it's a variable (not reserved, not a function)
    // Note: e and pi are treated as builtin constants and included in variables
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

    // Count this node only if it's a meaningful AST node
    // (has a type property that indicates it's a real AST structure node)
    if (n.type) {
      nodeCount++
      maxDepth = Math.max(maxDepth, depth)
    }

    // Traverse semantically meaningful child nodes only:
    // - arguments/args for function calls
    // - left/right for binary operations
    // - argument for unary operations
    // - elements for arrays (should not be in expression AST, but be safe)
    // This ensures we count expression structure, not implementation details
    const childNodes = []

    if (n.args) childNodes.push(...n.args)
    if (n.arguments) childNodes.push(...n.arguments)
    if (n.left) childNodes.push(n.left)
    if (n.right) childNodes.push(n.right)
    if (n.argument) childNodes.push(n.argument)
    if (Array.isArray(n.elements)) childNodes.push(...n.elements)

    childNodes.forEach(child => traverse(child, depth + 1))
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
    if (mode === 'escape') {
      return [
        'The API response contains: {"status": "success", "message": "User created"}',
        'SQL Query: SELECT * FROM users WHERE email = "user@example.com" AND status = "active"',
        'HTML template: <div class="container"><p>Welcome, "User"!</p></div>',
      ]
    } else {
      return [
        'The API response contains: {\"status\": \"success\", \"message\": \"User created\"}',
        'SQL Query: SELECT * FROM users WHERE email = \"user@example.com\" AND status = \"active\"',
        'HTML template: <div class=\"container\"><p>Welcome, \"User\"!</p></div>',
      ]
    }
  },
  'base64-converter': (config) => {
    const mode = config.mode || 'encode'
    if (mode === 'encode') {
      return [
        'The quick brown fox jumps over the lazy dog',
        'Pioneer Web Tools - Fast, Free, Deterministic',
        'admin@example.com:password123'
      ]
    } else {
      return [
        'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==',
        'UGlvbmVlciBXZWIgVG9vbHMgLSBGYXN0LCBGcmVlLCBEZXRlcm1pbmlzdGlj',
        'YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQxMjM='
      ]
    }
  },
  'encoder-decoder': (config) => {
    const direction = config.direction || 'encode'
    if (direction === 'decode') {
      return [
        'SGVsbG8gV29ybGQ=', // "Hello World" in Base64
        '48 65 6c 6c 6f', // "Hello" in Hex
        'JBSXG6A=', // "Hell" in Base32
        'JBSXG6A', // "Hell" in Base32 (no padding)
        '01001000 01101001', // "Hi" in Binary
        '110 151', // "Hi" in Octal
        '72 105', // "Hi" in Decimal
        'LXXII CV', // "Hi" in Roman
        'SGVsbG8lMjBXb3JsZA==', // "Hello World" Base64 + URL Safe
      ]
    }
    return [
      'Hello World',
      'Hi',
      'Pioneer Web Tools',
      'Example text for encoding',
      'Special Characters: !@#$%^&*()',
    ]
  },
  'csv-json-converter': () => [
    'First Name,Last Name,Age,Salary,Active,Verified,Premium Tier\nJohn,Doe,28,50000,true,false,\nJane,Smith,  34  ,  75000  ,true,true,Gold\n\n\nBob,Johnson,45,95000,false,true,Platinum\nAlice,Brown, 29 , 65000 , true , false , Silver',
    'id,name,email,department,salary\n1,Alice Johnson,alice@example.com,Engineering,95000\n2,Bob Smith,bob@example.com,Marketing,75000\n3,Carol White,carol@example.com,Sales,80000'
  ],
  'timestamp-converter': () => [
    '1704067200',
    '1735689600',
    '1609459200'
  ],
  'json-formatter': () => [
    '{"user":{"id":1,"name":"John Doe","email":"john@example.com","roles":["admin","user"],"active":true,"metadata":{"lastLogin":"2024-01-01T12:00:00Z","loginCount":42}},"status":"success"}',
    '{"products":[{"id":101,"name":"Laptop","price":999.99,"inStock":true},{"id":102,"name":"Mouse","price":29.99,"inStock":false}]}',
    '{"config":{"app_name":"Pioneer Web Tools","version":"1.0","features":{"free":true,"deterministic":true,"privacy":"No data retention"}}}'
  ],
  'css-formatter': () => [
    `/* =========================================================
   Pioneer Web Tools — CSS Toolkit Demo
   (Yes, this is all CSS. No HTML harmed.)
   ========================================================= */

/* Global baseline */
body {
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a, #020617);
  color: #e5e7eb;
}

/* Header */
.header {
  padding: 24px;
  text-align: center;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  color: white;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: "Pioneer Web Tools";
  display: block;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header::after {
  content: "CSS Toolkit — Visual, Safe, Deterministic";
  display: block;
  margin-top: 6px;
  font-size: 14px;
  opacity: 0.9;
}

/* Subtle animated glow */
@keyframes headerGlow {
  0% { box-shadow: 0 0 0 rgba(255,255,255,0); }
  50% { box-shadow: 0 0 40px rgba(255,255,255,0.15); }
  100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
}

.header {
  animation: headerGlow 6s ease-in-out infinite;
}

/* Main container */
.container {
  max-width: 900px;
  margin: 40px auto;
  padding: 32px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

/* Fun informational badge */
.container::before {
  content: "⚡ Live Preview • Hover things • Click to inspect";
  display: inline-block;
  margin-bottom: 16px;
  padding: 6px 12px;
  font-size: 12px;
  background: #0ea5e9;
  color: #020617;
  border-radius: 999px;
  font-weight: 600;
}

/* Button */
.button {
  display: inline-block;
  margin-top: 24px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

/* Button label via CSS */
.button::before {
  content: "Inspect Me 👀";
}

/* Hover state */
.button:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 12px 30px rgba(34,197,94,0.35);
  background: linear-gradient(135deg, #4ade80, #22c55e);
}

/* Active state */
.button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 6px 16px rgba(34,197,94,0.25);
}

/* Fun pulse animation */
@keyframes pulse {
  0% { box-shadow: 0 0 0 rgba(34,197,94,0.0); }
  70% { box-shadow: 0 0 0 18px rgba(34,197,94,0.0); }
  100% { box-shadow: 0 0 0 rgba(34,197,94,0.0); }
}

.button {
  animation: pulse 3s infinite;
}

/* Easter egg message */
.container::after {
  content: "✨ This preview is synthetic — the insight is real.";
  display: block;
  margin-top: 32px;
  font-size: 13px;
  opacity: 0.6;
  text-align: center;
}
`
  ],
  'xml-formatter': () => [
    `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sample XML for formatter and beautifier testing -->
<configuration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="config.xsd"
               version="1.2"
               environment="production">

  <!-- Application metadata -->
  <application name="PioneerWebTools" enabled="true">
    <description>
      A collection of deterministic, privacy-first developer tools.
    </description>
    <maintainer email="admin@example.com">Kyle Mann</maintainer>
  </application>

  <!-- Feature flags -->
  <features>
    <feature key="xmlFormatter" enabled="true"/>
    <feature key="svgOptimizer" enabled="true"/>
    <feature key="linting" enabled="false"/>
  </features>

  <!-- Server configuration -->
  <server>
    <host>api.example.com</host>
    <port>443</port>
    <ssl enabled="true">
      <protocols>
        <protocol>TLSv1.2</protocol>
        <protocol>TLSv1.3</protocol>
      </protocols>
    </ssl>
  </server>

  <!-- Logging with mixed content -->
  <logging level="warn">
    Logs are written to
    <path>/var/log/app</path>
    and rotated daily.
  </logging>

  <!-- CDATA test -->
  <templates>
    <template name="email">
      <![CDATA[
        <html>
          <body>
            <h1>Hello, {{user}}</h1>
            <p>Your token is: {{token}}</p>
          </body>
        </html>
      ]]>
    </template>
  </templates>

  <!-- Whitespace + numeric precision -->
  <limits>
    <timeout units="seconds">30</timeout>
    <threshold>0.000000123456</threshold>
  </limits>

  <!-- Comments, ordering, and empty elements -->
  <!-- These must be preserved exactly -->
  <advanced>
    <emptyElement />
    <selfClosing enabled="true"/>
  </advanced>

</configuration>`
  ],
  'js-formatter': () => [
    `// TODO: refactor later
const  foo ={a:1,b:2,c:3,};

function   test (x,y ){
if(x==y){
console.log("Equal values")
}else{
 console.log( 'Not equal' )
}
return{x:x,y:y, sum:x+y}
}

const   add=(a,b)=>{return a+b}

const list=[1,2,3,4,5,]

list.forEach((item)=>{
console.log(item)
})

if(foo.a==1 && foo.b==2 && foo.c==3){console.log("All good")}

const obj={name:"Kyle",age:30,active:true,}

function unused ( ){
var temp=  42
}

add(1,2)`
  ],
  'color-converter': () => [
    '#FF5733',
    'rgb(102, 204, 255)',
    'hsl(120, 100%, 50%)'
  ],
  'regex-tester': () => [
    'Contact us at support@example.com or sales@example.com.\nOrder #10293 was completed on 2024-02-14.\nVisit https://example.com/login?id=123 for your receipt.',
    'Phone numbers: (555) 123-4567, 555-987-6543, 5551234567',
    'Log entries: 2024-01-15 ERROR: Connection timeout\n2024-01-15 INFO: Request completed\n2024-01-15 DEBUG: Cache hit'
  ],
  'yaml-formatter': () => [
    '# Application configuration\napp:\n  name:  My Application\n  version: 1.0.0\n\nserver:\n  host: localhost\n  port: 3000\n  environment:   development\n\ndatabase:\n  url: postgresql://user:password@localhost:5432/myapp\n  maxConnections:    20\n\nlogging:\n  level: debug\n  format:  json  \n\nfeatures:\n  - featureA\n  -  featureB\n  -   featureC\n\nlimits:\n  timeout: 30\n  threshold: 0.000000123456',
    '# Pioneer Web Tools Configuration\ntools:\n  free: true\n  deterministic: true\n  privacy: No data retention\n  categories:\n    - Text & Encoding\n    - Data Formats\n    - Web & Networking',
    '# Service Configuration\nservices:\n  api:\n    host: api.example.com\n    port:   443\n    timeout:    30\n  cache:\n    enabled:   true\n    ttl:  3600'
  ],
  'url-toolkit': () => [
    'https://www.example.com:8443/api/v1/users?id=123&filter=active&sort=name#results',
    'http://api.github.com/repos/owner/repo/issues?page=1&per_page=30',
    'https://search.example.com/results?q=pioneer+web+tools&lang=en'
  ],
  'jwt-decoder': () => [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjcwMDAwMDAwLCJleHAiOjE2NzAwMDM2MDB9.gaj_JGj4_I8xhHhVwjO2f9Y0xQzN4T0P8DhP3QrZY_A',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNTAsIm5hbWUiOiJBbGljZSBKb2huc29uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQxNTM2MDB9.x7NvP2KzR5qL8wM3T9vQ1pJ4fG6hK9lM2oN5rS7uV8w',
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1In0.eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlLmNvbSIsInN1YiI6InVzZXIxMjMiLCJhdWQiOiJteWFwcCIsImlhdCI6MTY3MDAwMDAwMH0.signature'
  ],
  'checksum-calculator': () => [
    'Hello, World!',
    'Pioneer Web Tools - Fast, Free, and Deterministic',
    'The quick brown fox jumps over the lazy dog'
  ],
  'ascii-unicode-converter': () => [
    'Hello, World! ✨',
    'Café — Free Tools 🚀',
    '你好世界 (Hello World in Chinese)'
  ],
  'time-normalizer': () => {
    const examples = getTimeNormalizerExamples()
    return examples.map(ex => ex.value)
  },
  'base-converter': () => [
    '255',
    '1024',
    '16777215'
  ],
  'math-evaluator': () => [
    // Simple arithmetic
    '(25 + 15) * 2 - 10 / 2 + sqrt(16)',
    // Trigonometric functions
    'sin(pi/2) + cos(0) - tan(pi/4)',
    // Logarithmic functions (natural log with ln alias)
    'log(100) + ln(e^2) - log10(1000)',
    // Complex with nested parentheses
    '((5^3 - 2^4) * (sqrt(64) + 3)) / (10 - 2^3)',
    // Factorial and number theory
    'factorial(5) + factorial(3) - gcd(48, 18) + lcm(12, 8)',
    // Very long and complex expression with multiple trig and custom functions
    '(sin(pi/6) * cos(pi/3) + tan(pi/4)) * sqrt(144) - (ln(1000) + log10(100)) + (2^5 - 3^3) * (factorial(4) / factorial(2))',
    // Advanced: combining many functions including hyperbolic, inverse, and custom trig
    'abs(-25) + max(10, 20, 15) + min(3, 7, 2) + (e^2 + ln(e^3)) * (sinh(1) + cosh(1)) + asin(0.5) + acos(0.5) + sec(0) + csc(pi/2)',
    // Very complex long expression with all function types
    '((sqrt(16) + cbrt(27)) * (sin(deg2rad(30)) + cos(deg2rad(60))) - (ln(1000) - log10(100))) / ((2^3 + 3^2) * (factorial(4) / factorial(2)) + abs(-5))',
    // Financial calculation: compound interest with multiple terms
    '(5000 * (1 + 0.05/12)^(12*5)) + (12 * 200 * (((1 + 0.06/12)^(12*3) - 1) / (0.06/12)))',
    // Physics: kinetic energy, potential energy, and sphere surface area with angle conversion
    '(0.5 * 2 * pow(10, 2)) + (2 * 9.81 * 5) + (4 * pi * pow(6.371e6, 2)) + rad2deg(atan2(1, 1))',
    // Extra complex: all supported functions combined
    'max(sin(pi/3), cos(pi/4), tan(pi/6)) * min(sqrt(50), cbrt(100), ln(e^10)) + (2^(3+2) - 3^(2+1)) / factorial(3) + abs(log10(0.001)) + atan2(1, 1) + asinh(1) + acosh(2) + atanh(0.5)',
  ],
  'cron-tester': () => [
    '0 9 * * MON-FRI',
    '0 0 1 * *',
    '*/15 * * * *'
  ],
  'file-size-converter': () => ['100 MB', '5 GB', '1.5 TB'],
  'email-validator': () => [
    `@example.com
test@
test @example.com
user name@example.com
test..name@example.com
.test@example.com
test.@example.com
test@@example.com
testexample.com
test@.com
invalid@.example
user@domain
user@localhost
test,email@example.com
test;email@example.com
test[email]@example.com
test@exam ple.com
test@exam-ple.c
test@exam_ple.com`,
    `john.doe@gmail.com
person123@aol.com
steve.department.company@yahoo.com`,
    `xjkq9mwp@gmail.com
a7f2k9x1q@yahoo.com
bzqwerty123456@outlook.com
nsdflkjhzxcvbnm@aol.com
k8j4p0w2m5@company.com
rnd9f3x7l1b@domain.org
qweasdzxc999@test.io
m2n4k9p1x5q@mail.com`
  ],
  'caesar-cipher': () => [
    'The quick brown fox jumps over the lazy dog',
    'Pioneer Web Tools - Deterministic and Free',
    'Hello, World!'
  ],
  'text-toolkit': () => [
    'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. It is commonly used for testing fonts and keyboard layouts.',
    'Pioneer Web Tools is a free, deterministic platform for text transformation and analysis. All tools run entirely in your browser with zero data retention.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
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
  'mime-type-lookup': () => [
    'pdf',
    'json',
    'mp4'
  ],
  'number-formatter': () => [
    '1234567.89\n-42500\n0.12345',
    '1000000',
    '3.14159265359'
  ],
  'sql-formatter': () => [
    `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = TRUE AND u.created_at > '2024-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC`,
    `INSERT INTO products (name, price, stock) VALUES ('Laptop', 999.99, 15), ('Mouse', 29.99, 100), ('Keyboard', 79.99, 50)`,
    `UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = 42 AND active = true`
  ],
  'svg-optimizer': () => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">

  <!-- ======================
       DEFINITIONS
  ====================== -->
  <defs>
    <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#845EC2"/>
      <stop offset="100%" stop-color="#D65DB1"/>
    </linearGradient>

    <radialGradient id="gradRadial" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFC75F"/>
      <stop offset="100%" stop-color="#FF6F91"/>
    </radialGradient>

    <filter id="blur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>

    <mask id="circleMask">
      <rect x="0" y="0" width="100%" height="100%" fill="black"/>
      <circle cx="200" cy="150" r="80" fill="white"/>
    </mask>

    <clipPath id="clipBox">
      <rect x="50" y="50" width="300" height="200"/>
    </clipPath>

    <style><![CDATA[
      .label {
        font-family: Arial, sans-serif;
        font-size: 14px;
        fill: #FFFFFF;
      }
      .outline {
        stroke: #333333;
        stroke-width: 2;
        fill: none;
      }
    ]]></style>
  </defs>

  <!-- ======================
       BACKGROUND
  ====================== -->
  <rect
    x="0"
    y="0"
    width="400"
    height="300"
    fill="url(#gradMain)"
  />

  <!-- ======================
       GROUP WITH TRANSFORM
  ====================== -->
  <g id="shapes" transform="translate(50 40)">
    <rect
      x="0"
      y="0"
      width="120"
      height="80"
      rx="8"
      fill="url(#gradRadial)"
      stroke="#000"
      stroke-width="1.5"
    />

    <circle
      cx="180"
      cy="40"
      r="35"
      fill="#4D96FF"
      opacity="0.85"
      filter="url(#blur)"
    />

    <ellipse
      cx="280"
      cy="40"
      rx="45"
      ry="25"
      fill="#00C9A7"
    />
  </g>

  <!-- ======================
       PATHS
  ====================== -->
  <path
    d="M60 200 L180 200 L220 260 L20 260 Z"
    fill="#F9F871"
    stroke="#333"
    stroke-width="2"
  />

  <path
    d="M260 190 C300 150 360 230 320 260"
    fill="none"
    stroke="#FF9671"
    stroke-width="3"
    stroke-linecap="round"
  />

  <!-- ======================
       USE / SYMBOL
  ====================== -->
  <symbol id="iconStar" viewBox="0 0 24 24">
    <path
      d="M12 2 L15 9 L22 9 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9 L9 9 Z"
      fill="#FFC75F"
    />
  </symbol>

  <use href="#iconStar" x="300" y="30" width="40" height="40"/>

  <!-- ======================
       CLIPPED & MASKED GROUP
  ====================== -->
  <g clip-path="url(#clipBox)" mask="url(#circleMask)">
    <rect
      x="50"
      y="120"
      width="300"
      height="140"
      fill="#845EC2"
    />
  </g>

  <!-- ======================
       TEXT
  ====================== -->
  <text
    x="200"
    y="280"
    text-anchor="middle"
    class="label"
  >
    SVG Pretty Mode Test
  </text>

  <!-- ======================
       LINE / POLY / META
  ====================== -->
  <line
    x1="20"
    y1="20"
    x2="380"
    y2="20"
    stroke="#FFFFFF"
    stroke-dasharray="6 4"
  />

  <polyline
    points="50,100 100,140 150,110 200,160"
    fill="none"
    stroke="#FF6F91"
    stroke-width="2"
  />

  <metadata>
    <author>Your Name</author>
    <purpose>Pretty mode formatter stress test</purpose>
  </metadata>

</svg>`
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
  'web-playground': () => [
    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Playground - Kitchen Sink</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
            color: #333;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        header h1 {
            font-size: 32px;
            margin-bottom: 8px;
        }

        header p {
            font-size: 16px;
            opacity: 0.9;
        }

        nav {
            background: #f5f5f5;
            padding: 12px 20px;
            display: flex;
            gap: 15px;
            border-bottom: 1px solid #ddd;
            flex-wrap: wrap;
        }

        nav button {
            padding: 8px 16px;
            border: 2px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
        }

        nav button.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        nav button:hover {
            border-color: #667eea;
        }

        .content {
            padding: 30px;
        }

        section {
            display: none;
            animation: fadeIn 0.3s ease;
        }

        section.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
        }

        h2 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #333;
        }

        h3 {
            font-size: 15px;
            margin-bottom: 8px;
            color: #555;
        }

        p, li {
            font-size: 14px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 12px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 13px;
            color: #333;
        }

        input[type="text"],
        input[type="email"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="number"]:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }

        .btn-secondary:hover {
            background: #e8e8e8;
        }

        .btn-small {
            padding: 6px 12px;
            font-size: 12px;
        }

        .counter {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .counter button {
            padding: 8px 12px;
            font-size: 12px;
        }

        .counter span {
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
            min-width: 40px;
            text-align: center;
        }

        .toggle-switch {
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .switch {
            position: relative;
            width: 50px;
            height: 26px;
        }

        .switch input {
            display: none;
        }

        .switch-slider {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ccc;
            cursor: pointer;
            border-radius: 26px;
            transition: 0.3s;
        }

        .switch-slider::before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background: white;
            border-radius: 50%;
            transition: 0.3s;
        }

        .switch input:checked + .switch-slider {
            background: #667eea;
        }

        .switch input:checked + .switch-slider::before {
            transform: translateX(24px);
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            border-left: 4px solid;
        }

        .alert.success {
            background: #d4edda;
            color: #155724;
            border-color: #28a745;
        }

        .alert.error {
            background: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
        }

        .alert.info {
            background: #d1ecf1;
            color: #0c5460;
            border-color: #bee5eb;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 2px solid #ddd;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
        }

        tr:hover {
            background: #f9f9f9;
        }

        ul, ol {
            margin-left: 20px;
        }

        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #d63384;
        }

        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.5;
            margin-bottom: 16px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }

        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            background: #f9f9f9;
        }

        .card h3 {
            margin-top: 0;
        }

        footer {
            background: #f5f5f5;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Web Playground - Kitchen Sink</h1>
            <p style="color: white;">Complete HTML, CSS, and JavaScript testing ground</p>
        </header>

        <nav>
            <button class="nav-btn active" data-tab="components">Components</button>
            <button class="nav-btn" data-tab="forms">Forms</button>
            <button class="nav-btn" data-tab="interactive">Interactive</button>
            <button class="nav-btn" data-tab="content">Content</button>
        </nav>

        <div class="content">
            <!-- Components Tab -->
            <section id="components" class="active">
                <h2 class="section-title">UI Components</h2>

                <h3>Buttons</h3>
                <p>
                    <button class="btn-primary">Primary Button</button>
                    <button class="btn-secondary">Secondary Button</button>
                    <button class="btn-secondary btn-small">Small Button</button>
                </p>

                <h3>Alerts</h3>
                <div class="alert success">✓ Success message - Operation completed successfully</div>
                <div class="alert info">ℹ Info message - Here's some useful information</div>
                <div class="alert error">✗ Error message - Something went wrong</div>

                <h3>Cards</h3>
                <div class="grid">
                    <div class="card">
                        <h3>Card 1</h3>
                        <p>This is a card component demonstrating grid layout and styling.</p>
                    </div>
                    <div class="card">
                        <h3>Card 2</h3>
                        <p>Cards are great for organizing content into sections.</p>
                    </div>
                    <div class="card">
                        <h3>Card 3</h3>
                        <p>You can customize colors, borders, and spacing with CSS.</p>
                    </div>
                </div>
            </section>

            <!-- Forms Tab -->
            <section id="forms">
                <h2 class="section-title">Form Elements</h2>

                <div class="form-group">
                    <label for="text-input">Text Input</label>
                    <input type="text" id="text-input" placeholder="Enter some text...">
                </div>

                <div class="form-group">
                    <label for="email-input">Email Input</label>
                    <input type="email" id="email-input" placeholder="your@email.com">
                </div>

                <div class="form-group">
                    <label for="number-input">Number Input</label>
                    <input type="number" id="number-input" placeholder="Enter a number..." value="0">
                </div>

                <div class="form-group">
                    <label for="textarea">Textarea</label>
                    <textarea id="textarea" placeholder="Write your message here..."></textarea>
                </div>

                <div class="form-group">
                    <label for="select">Select Dropdown</label>
                    <select id="select">
                        <option>Choose an option</option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                        <option>Option 3</option>
                    </select>
                </div>

                <button class="btn-primary" onclick="handleSubmit(event)">Submit Form</button>
            </section>

            <!-- Interactive Tab -->
            <section id="interactive">
                <h2 class="section-title">Interactive Elements</h2>

                <h3>Counter</h3>
                <div class="counter">
                    <button class="btn-secondary btn-small" onclick="decrementCounter()">−</button>
                    <span id="counter-value">0</span>
                    <button class="btn-secondary btn-small" onclick="incrementCounter()">+</button>
                </div>

                <h3 style="margin-top: 24px;">Toggle Switch</h3>
                <div class="toggle-switch">
                    <label class="switch">
                        <input type="checkbox" id="toggle" onchange="handleToggle()">
                        <span class="switch-slider"></span>
                    </label>
                    <span id="toggle-status">Off</span>
                </div>

                <h3 style="margin-top: 24px;">Todo List</h3>
                <div class="form-group">
                    <input type="text" id="todo-input" placeholder="Add a new todo..." onkeypress="handleKeyPress(event)">
                    <button class="btn-primary" style="margin-top: 8px;" onclick="addTodo()">Add Todo</button>
                </div>
                <ul id="todo-list"></ul>

                <h3 style="margin-top: 24px;">Calculator</h3>
                <div class="form-group">
                    <label>Number 1</label>
                    <input type="number" id="calc-num1" placeholder="0" value="0">
                </div>
                <div class="form-group">
                    <label>Number 2</label>
                    <input type="number" id="calc-num2" placeholder="0" value="0">
                </div>
                <p>
                    <button class="btn-secondary btn-small" onclick="calculate('add')">+ Add</button>
                    <button class="btn-secondary btn-small" onclick="calculate('subtract')">− Subtract</button>
                    <button class="btn-secondary btn-small" onclick="calculate('multiply')">× Multiply</button>
                    <button class="btn-secondary btn-small" onclick="calculate('divide')">÷ Divide</button>
                </p>
                <p id="calc-result" style="font-size: 16px; color: #667eea; font-weight: 700;"></p>
            </section>

            <!-- Content Tab -->
            <section id="content">
                <h2 class="section-title">Content Examples</h2>

                <h3>Headings</h3>
                <h1>Heading 1</h1>
                <h2>Heading 2</h2>
                <h3>Heading 3</h3>

                <h3 style="margin-top: 24px;">Text Formatting</h3>
                <p>This is <strong>bold text</strong>, this is <em>italic text</em>, and this is <mark>highlighted text</mark>.</p>
                <p>You can also use <code>inline code</code> for technical terms.</p>

                <h3>Lists</h3>
                <h4>Unordered List</h4>
                <ul>
                    <li>First item</li>
                    <li>Second item</li>
                    <li>Third item</li>
                </ul>

                <h4>Ordered List</h4>
                <ol>
                    <li>Step one</li>
                    <li>Step two</li>
                    <li>Step three</li>
                </ol>

                <h3>Table Example</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Description</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>HTML Support</td>
                            <td>Full HTML5 support</td>
                            <td>✓ Active</td>
                        </tr>
                        <tr>
                            <td>CSS Support</td>
                            <td>Complete CSS3 styling</td>
                            <td>✓ Active</td>
                        </tr>
                        <tr>
                            <td>JavaScript</td>
                            <td>Full ES6+ support</td>
                            <td>✓ Active</td>
                        </tr>
                        <tr>
                            <td>DOM Manipulation</td>
                            <td>Real-time DOM updates</td>
                            <td>✓ Active</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Code Example</h3>
                <pre>// JavaScript function example
function greetUser(name) {
  return \`Hello, \${name}! Welcome to the Web Playground.\`;
}

const message = greetUser('Developer');
console.log(message);</pre>

                <h3>Links and Images</h3>
                <p>
                    <a href="https://example.com">Example Link</a> |
                    <a href="https://google.com">Google</a>
                </p>
            </section>
        </div>

        <footer>
            <p>Web Playground Kitchen Sink • Test all HTML, CSS, and JavaScript features</p>
        </footer>
    </div>

    <script>
        window.counterValue = 0;

        window.incrementCounter = function() {
            window.counterValue++;
            var el = document.getElementById('counter-value');
            if (el) el.textContent = window.counterValue;
        };

        window.decrementCounter = function() {
            window.counterValue--;
            var el = document.getElementById('counter-value');
            if (el) el.textContent = window.counterValue;
        };

        window.handleToggle = function() {
            var toggle = document.getElementById('toggle');
            var status = document.getElementById('toggle-status');
            if (toggle && status) {
                status.textContent = toggle.checked ? 'On' : 'Off';
            }
        };

        window.addTodo = function() {
            var input = document.getElementById('todo-input');
            var todoList = document.getElementById('todo-list');
            if (!input || !todoList) return;

            var text = input.value.trim();
            if (!text) return;

            var li = document.createElement('li');
            li.style.marginBottom = '8px';
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '8px';

            var span = document.createElement('span');
            span.textContent = text;
            span.style.cursor = 'pointer';
            span.style.flex = '1';
            span.onclick = function() {
                span.style.textDecoration = span.style.textDecoration === 'line-through' ? 'none' : 'line-through';
            };

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-secondary btn-small';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                li.remove();
            };

            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
            input.value = '';
            input.focus();
        };

        window.handleKeyPress = function(e) {
            if (e.key === 'Enter') window.addTodo();
        };

        window.calculate = function(operation) {
            var num1Input = document.getElementById('calc-num1');
            var num2Input = document.getElementById('calc-num2');
            var resultEl = document.getElementById('calc-result');

            if (!num1Input || !num2Input || !resultEl) return;

            var num1 = parseFloat(num1Input.value) || 0;
            var num2 = parseFloat(num2Input.value) || 0;
            var result;

            if (operation === 'add') {
                result = num1 + num2;
            } else if (operation === 'subtract') {
                result = num1 - num2;
            } else if (operation === 'multiply') {
                result = num1 * num2;
            } else if (operation === 'divide') {
                result = num2 !== 0 ? (num1 / num2).toFixed(2) : 'Cannot divide by zero';
            }

            resultEl.textContent = 'Result: ' + result;
        };

        window.handleSubmit = function(e) {
            var textInput = document.getElementById('text-input');
            var emailInput = document.getElementById('email-input');

            if (!textInput || !emailInput) return false;

            var name = textInput.value.trim();
            var email = emailInput.value.trim();

            if (name && email) {
                alert('Form submitted!\\nName: ' + name + '\\nEmail: ' + email);
            } else {
                alert('Please fill in all fields');
            }
            return false;
        };

        window.switchTab = function(tabName) {
            var navBtns = document.querySelectorAll('.nav-btn');
            navBtns.forEach(function(b) {
                b.classList.remove('active');
                if (b.getAttribute('data-tab') === tabName) {
                    b.classList.add('active');
                }
            });

            var sections = document.querySelectorAll('section');
            sections.forEach(function(s) {
                s.classList.remove('active');
            });
            var activeSection = document.getElementById(tabName);
            if (activeSection) {
                activeSection.classList.add('active');
            }
        };

        // Setup tab clicks
        document.addEventListener('DOMContentLoaded', function() {
            var navBtns = document.querySelectorAll('.nav-btn');
            navBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var tabName = this.getAttribute('data-tab');
                    if (tabName) window.switchTab(tabName);
                });
            });
        });
    </script>
</body>
</html>`
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
  'punycode-converter': () => [
    'münchen.de',
    '中文.org',
    'россия.ru'
  ],
  'unit-converter': () => [
    '100 kg',
    '5 miles',
    '32 °F'
  ],
  'qr-code-generator': () => [
    'https://www.example.com',
    'https://github.com',
    'hello@example.com',
    'Contact Info: John Doe, Phone: 555-1234',
  ],
  'hexadecimal-converter': (config) => {
    const mode = config.mode || 'auto'
    // When auto-detect is on, show mixed hex and text examples so user can see both directions
    if (mode === 'auto' || mode === 'hexToText') {
      return [
        '48656C6C6F20576F726C64',  // "Hello World" in hex (compact)
        '48 65 6C 6C 6F',  // "Hello" (space-separated)
        '0x50 0x69 0x6F 0x6E 0x65 0x65 0x72',  // "Pioneer" (0x prefix)
      ]
    }
    return [
      'Hello',
      'Pioneer Web Tools',
      'Deterministic'
    ]
  },
  'binary-converter': (config) => {
    const mode = config.mode || 'auto'
    // When auto-detect is on, show mixed binary and text examples so user can see both directions
    if (mode === 'auto' || mode === 'binaryToText') {
      return [
        '01001000 01100101 01101100 01101100 01101111',  // "Hello" (space-separated)
        '0100010001100101011101100110010101110010',  // "Devel" (compact)
        '01010000 01101001 01101111 01101110 01100101 01100101 01110010',  // "Pioneer" (byte groups)
      ]
    }
    return [
      'Hello',
      'Binary',
      'Converter'
    ]
  },
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

/**
 * Get the first example of a tool for metadata purposes (e.g., API responses).
 * This consolidates the example source - TOOL_EXAMPLES is the single source of truth,
 * and this function derives the metadata example from it with default config.
 *
 * Note: The main TOOLS object also contains an `example` field for backward compatibility.
 * Both should stay in sync, but this function ensures consistency by deriving from TOOL_EXAMPLES.
 */
export function getToolExampleForMetadata(toolId) {
  return getToolExample(toolId, {}, 0)
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

  // Rounding is sensitive if changing the rounding mode would change the formatted result
  // This is true when:
  // 1. Precision rounding was actually applied (wasPrecisionRounded)
  // 2. AND a non-default rounding mode is active (not 'half-up')
  // 3. AND precision is configured (not null)
  // 4. AND result is a valid number
  // Rule: roundingSensitive = true only if rounding mode choice materially affects output
  const roundingSensitive =
    wasPrecisionRounded &&
    config.rounding !== 'half-up' &&
    config.precision !== null &&
    typeof finalResult === 'number'

  return {
    precisionSensitive: precisionSensitive,
    roundingSensitive: roundingSensitive,
    notationSensitive: wasNotationApplied,
    numericModel: config.mode === 'bignumber' ? 'bigdecimal' : 'ieee-754'
  }
}

// Generate key reductions where important transformations occur
// Phase 5: Explainability through transformation tracking
//
// DESIGN PRINCIPLE: reductions is OPTIONAL and only present when it adds explanatory value
// This field is NOT forced to always exist. Including empty reductions adds no value.
//
// INCLUDE reductions when:
//   A. A warning exists (precision artifact, undefined variable, etc.) OR
//   B. A non-identity transformation occurred (e.g., precision rounding, notation change)
//
// OMIT reductions when:
//   - Expression is simple and evaluates cleanly (no warnings, no artifacts)
//   - Result is straightforward and needs no step-by-step explanation
//
// This keeps the response focused and meaningful, not cluttered with empty metadata
function generateReductions(expression, result, floatWarnings, complexity, config) {
  const reductions = []

  // Only add reductions for expressions with precision artifacts
  // (These are meaningful, non-identity transformations that warrant explanation)
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
// NOTE: complexity.nodes is calculated from expression structure only (Phase 4)
//       Independent of numeric mode (float vs bignumber)
//       Same input expression → same complexity value
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
