export const REGEX_PATTERN_TEMPLATES = {
  /* Common */
  email: {
    id: 'email',
    category: 'Common',
    name: 'Email Addresses',
    description: 'Extract email addresses',
    pattern: '[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    explanation: 'Matches basic email format.',
    examples: [
      'john.doe@example.com',
      'user+tag@company.co.uk'
    ],
  },

  url: {
    id: 'url',
    category: 'Common',
    name: 'URLs',
    description: 'Extract HTTP/HTTPS URLs',
    pattern: 'https?:\\/\\/[\\w.-]+(?:\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]*)?',
    flags: 'gi',
    explanation: 'Matches URLs without capturing trailing punctuation.',
    examples: [
      'https://example.com',
      'http://site.com/path?query=1'
    ],
  },

  number: {
    id: 'number',
    category: 'Common',
    name: 'Numbers',
    description: 'Extract integers and decimals',
    pattern: '-?\\d+(?:\\.\\d+)?',
    flags: 'g',
    explanation: 'Matches numbers with optional decimal.',
    examples: ['42', '-1.5'],
  },

  integer: {
    id: 'integer',
    category: 'Common',
    name: 'Integers',
    description: 'Extract whole integers',
    pattern: '-?\\d+',
    flags: 'g',
    explanation: 'Matches whole numbers including negative.',
    examples: ['12', '-40'],
  },

  username: {
    id: 'username',
    category: 'Common',
    name: 'Usernames',
    description: 'Extract usernames starting with @',
    pattern: '@[a-zA-Z0-9_]{3,16}\\b',
    flags: 'g',
    explanation: 'Matches @ mentions with 3-16 characters.',
    examples: ['@john_doe', '@user123'],
  },

  semver: {
    id: 'semver',
    category: 'Common',
    name: 'Semantic Versions',
    description: 'Extract semver versions',
    pattern: '\\b(\\d+)\\.(\\d+)\\.(\\d+)(?:-[\\w.-]+)?\\b',
    flags: 'g',
    explanation: 'Matches semantic versioning like 1.2.3 or 3.1.0-beta.',
    examples: ['1.2.3', '3.1.0-beta'],
  },

  currency: {
    id: 'currency',
    category: 'Common',
    name: 'Currency Amounts',
    description: 'Extract prices with currency symbols',
    pattern: '[$€£]\\s?\\d{1,3}(?:,?\\d{3})*(?:\\.\\d{2})?',
    flags: 'g',
    explanation: 'Matches currency amounts like $19.99 or €1,200.',
    examples: ['$19.99', '€1,200'],
  },

  /* Dates */
  isodate: {
    id: 'isodate',
    category: 'Dates',
    name: 'ISO Date (YYYY-MM-DD)',
    description: 'Extract ISO dates',
    pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    explanation: 'Matches ISO date format YYYY-MM-DD.',
    examples: ['2024-01-20'],
  },

  datetime: {
    id: 'datetime',
    category: 'Dates',
    name: 'ISO DateTime',
    description: 'Extract ISO datetimes',
    pattern: '\\d{4}-\\d{2}-\\d{2}[ T](?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?',
    flags: 'g',
    explanation: 'Matches ISO datetime with optional seconds.',
    examples: ['2024-02-14 13:50:22'],
  },

  time: {
    id: 'time',
    category: 'Dates',
    name: 'Time (HH:MM:SS)',
    description: 'Extract time values',
    pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?',
    flags: 'g',
    explanation: 'Matches time in 24-hour format.',
    examples: ['14:30:45', '09:15'],
  },

  /* Identifiers */
  uuid: {
    id: 'uuid',
    category: 'Identifiers',
    name: 'UUID v1–v5',
    description: 'Extract UUID/GUID strings',
    pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b',
    flags: 'g',
    explanation: 'Matches UUID format with version validation.',
    examples: ['550e8400-e29b-41d4-a716-446655440000'],
  },

  jwt: {
    id: 'jwt',
    category: 'Security',
    name: 'JWT Tokens',
    description: 'Extract JWT tokens',
    pattern: '[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
    flags: 'g',
    explanation: 'Matches JWT format with three dot-separated parts.',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'],
  },

  base64: {
    id: 'base64',
    category: 'Security',
    name: 'Base64 Strings',
    description: 'Extract base64 encoded strings',
    pattern: '[A-Za-z0-9+/]{20,}={0,2}',
    flags: 'g',
    explanation: 'Matches base64 strings of at least 20 characters.',
    examples: ['SGVsbG8gV29ybGQ='],
  },

  /* Network */
  ipv4: {
    id: 'ipv4',
    category: 'Network',
    name: 'IPv4 Addresses',
    description: 'Extract IPv4 addresses',
    pattern: '\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    explanation: 'Matches valid IPv4 addresses.',
    examples: ['192.168.1.1', '8.8.8.8'],
  },

  ipv6: {
    id: 'ipv6',
    category: 'Network',
    name: 'IPv6 Addresses',
    description: 'Extract IPv6 addresses',
    pattern: '\\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\b',
    flags: 'g',
    explanation: 'Matches full IPv6 format.',
    examples: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
  },

  cidr: {
    id: 'cidr',
    category: 'Network',
    name: 'CIDR Notation',
    description: 'Extract CIDR notation',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\/\\d{1,2}\\b',
    flags: 'g',
    explanation: 'Matches CIDR notation like 192.168.0.0/24.',
    examples: ['192.168.0.0/24', '10.0.0.0/8'],
  },

  /* Text */
  word: {
    id: 'word',
    category: 'Text',
    name: 'Words',
    description: 'Extract individual words',
    pattern: '\\b\\w+\\b',
    flags: 'g',
    explanation: 'Matches word boundaries.',
    examples: ['hello', 'world123'],
  },

  quoted: {
    id: 'quoted',
    category: 'Text',
    name: 'Quoted Text',
    description: 'Extract quoted strings',
    pattern: '"([^"]*)"|\'([^\']*)\'',
    flags: 'g',
    explanation: 'Matches single or double quoted text.',
    examples: ['"hello"', "'world'"],
  },

  camel: {
    id: 'camelcase',
    category: 'Text',
    name: 'camelCase Words',
    description: 'Extract camelCase identifiers',
    pattern: '\\b[a-z]+(?:[A-Z][a-z]+)+\\b',
    flags: 'g',
    explanation: 'Matches camelCase variable names.',
    examples: ['myVariable', 'getUserData'],
  },

  snake: {
    id: 'snakecase',
    category: 'Text',
    name: 'snake_case Words',
    description: 'Extract snake_case identifiers',
    pattern: '\\b[a-z]+(?:_[a-z0-9]+)*\\b',
    flags: 'g',
    explanation: 'Matches snake_case variable names.',
    examples: ['my_variable', 'user_id'],
  },

  /* Social */
  hashtag: {
    id: 'hashtag',
    category: 'Social',
    name: 'Hashtags',
    description: 'Extract hashtags',
    pattern: '#[A-Za-z0-9_]+',
    flags: 'g',
    explanation: 'Matches hashtags starting with #.',
    examples: ['#webdev', '#python2024'],
  },

  mention: {
    id: 'mention',
    category: 'Social',
    name: 'Mentions',
    description: 'Extract @mentions',
    pattern: '@[A-Za-z0-9_]+',
    flags: 'g',
    explanation: 'Matches @mentions.',
    examples: ['@john_doe', '@twitter'],
  },

  /* Business */
  orderId: {
    id: 'order-id',
    category: 'Business',
    name: 'Order # Numbers',
    description: 'Extract order numbers',
    pattern: '[Oo]rder\\s*#?(\\d+)',
    flags: 'g',
    explanation: 'Matches order identifiers.',
    examples: ['Order #1234', 'order 5678'],
  },

  invoice: {
    id: 'invoice',
    category: 'Business',
    name: 'Invoice Numbers',
    description: 'Extract invoice identifiers',
    pattern: '\\bINV[- ]?\\d+\\b',
    flags: 'gi',
    explanation: 'Matches invoice numbers.',
    examples: ['INV-2024-001', 'INV 9999'],
  },

  sku: {
    id: 'sku',
    category: 'Business',
    name: 'SKU Codes',
    description: 'Extract SKU codes',
    pattern: '\\b[A-Z0-9]{2,}-[A-Z0-9]+(?:-[A-Z0-9]+)?\\b',
    flags: 'gi',
    explanation: 'Matches product SKU codes.',
    examples: ['SKU-1234', 'PROD-5678-XL'],
  },

  ticker: {
    id: 'ticker',
    category: 'Business',
    name: 'Stock Ticker Symbols',
    description: 'Extract stock ticker symbols',
    pattern: '\\b[A-Z]{1,5}\\b',
    flags: 'g',
    explanation: 'Matches stock ticker symbols.',
    examples: ['AAPL', 'MSFT', 'TSLA'],
  },

  /* Web */
  htmlTag: {
    id: 'html-tag',
    category: 'Web',
    name: 'HTML Tags',
    description: 'Extract HTML tags',
    pattern: '<\\/?[a-zA-Z][a-zA-Z0-9-]*(?:\\s[^>]+)?>',
    flags: 'g',
    explanation: 'Matches HTML opening and closing tags.',
    examples: ['<div>', '</span>', '<img src="test.jpg">'],
  },

  htmlComment: {
    id: 'html-comment',
    category: 'Web',
    name: 'HTML Comments',
    description: 'Extract HTML comments',
    pattern: '<!--[\\s\\S]*?-->',
    flags: 'g',
    explanation: 'Matches HTML comments.',
    examples: ['<!-- comment -->', '<!--\n  multi-line\n-->'],
  },

  queryParam: {
    id: 'query-param',
    category: 'Web',
    name: 'URL Query Parameters',
    description: 'Extract query parameters',
    pattern: '[?&]([^=]+)=([^&#]+)',
    flags: 'g',
    explanation: 'Matches URL query parameters.',
    examples: ['?foo=bar', '&id=123'],
  },

  markdownLink: {
    id: 'mdlink',
    category: 'Web',
    name: 'Markdown Links',
    description: 'Extract markdown links',
    pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    flags: 'g',
    explanation: 'Matches markdown link syntax.',
    examples: ['[Google](https://google.com)'],
  },

  /* Location */
  usZip: {
    id: 'uszip',
    category: 'Location',
    name: 'US ZIP Codes',
    description: 'Extract US ZIP codes',
    pattern: '\\b\\d{5}(?:-\\d{4})?\\b',
    flags: 'g',
    explanation: 'Matches US ZIP codes with optional +4.',
    examples: ['10001', '90210-1234'],
  },

  ukPostcode: {
    id: 'uk-postcode',
    category: 'Location',
    name: 'UK Postcodes',
    description: 'Extract UK postcodes',
    pattern: '\\b[A-Z]{1,2}\\d[A-Z\\d]? \\d[A-Z]{2}\\b',
    flags: 'gi',
    explanation: 'Matches UK postcode format.',
    examples: ['SW1A 1AA', 'B33 8TH'],
  },

  latlong: {
    id: 'latlong',
    category: 'Location',
    name: 'Latitude & Longitude',
    description: 'Extract coordinates',
    pattern: '[-+]?\\d{1,2}\\.\\d+[, ]+[-+]?\\d{1,3}\\.\\d+',
    flags: 'g',
    explanation: 'Matches latitude, longitude pairs.',
    examples: ['40.7128, -74.0060', '51.5074,-0.1278'],
  },

  /* Programming */
  jsVarName: {
    id: 'js-var-name',
    category: 'Programming',
    name: 'JavaScript Variable Names',
    description: 'Extract valid JS variable identifiers',
    pattern: '\\b[A-Za-z_$][A-Za-z0-9_$]*\\b',
    flags: 'g',
    explanation: 'Matches variable names allowed in JS syntax.',
    examples: ['myVar', '$user_id'],
  },

  jsFunction: {
    id: 'js-function',
    category: 'Programming',
    name: 'JS Function Declarations',
    description: 'Extract function names',
    pattern: '\\bfunction\\s+([A-Za-z_$][A-Za-z0-9_$]*)',
    flags: 'g',
    explanation: 'Matches function declarations like function myFunc()',
    examples: ['function loadData()'],
  },

  arrowFunction: {
    id: 'arrow-func',
    category: 'Programming',
    name: 'Arrow Functions',
    description: 'Detect arrow function expressions',
    pattern: '\\([^)]*\\)\\s*=>',
    flags: 'g',
    explanation: 'Matches arrow functions like (a,b)=>{...}',
    examples: ['(a, b) => a + b'],
  },

  hexNumber: {
    id: 'hex-number',
    category: 'Programming',
    name: 'Hexadecimal Numbers',
    description: 'Extract hex numbers starting with 0x',
    pattern: '0x[0-9a-fA-F]+',
    flags: 'g',
    explanation: 'Matches hexadecimal notation.',
    examples: ['0xFF12', '0xa3'],
  },

  cssRgb: {
    id: 'css-rgb',
    category: 'Programming',
    name: 'CSS rgb() Colors',
    description: 'Extract rgb and rgba color definitions',
    pattern: 'rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}(?:\\s*,\\s*(0|1|0?\\.\\d+))?\\s*\\)',
    flags: 'gi',
    explanation: 'Matches CSS color functions.',
    examples: ['rgb(255, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
  },

  /* Security */
  awsAccessKey: {
    id: 'aws-access-key',
    category: 'Security',
    name: 'AWS Access Key',
    description: 'Detect potential leaked AWS access keys',
    pattern: '\\bAKIA[0-9A-Z]{16}\\b',
    flags: 'g',
    explanation: 'Matches AWS access key format.',
    examples: ['AKIAIOSFODNN7EXAMPLE'],
  },

  awsSecret: {
    id: 'aws-secret',
    category: 'Security',
    name: 'AWS Secret Key',
    description: 'Detect leaked AWS secrets',
    pattern: '[A-Za-z0-9/+=]{40}',
    flags: 'g',
    explanation: 'Matches AWS secret key patterns.',
    examples: ['wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'],
  },

  openaiKey: {
    id: 'openai-key',
    category: 'Security',
    name: 'OpenAI API Keys',
    description: 'Detect OpenAI keys starting with sk-',
    pattern: 'sk-[A-Za-z0-9]{32,}',
    flags: 'g',
    explanation: 'Matches OpenAI API key format.',
    examples: ['sk-abc123...'],
  },

  githubToken: {
    id: 'github-token',
    category: 'Security',
    name: 'GitHub Tokens',
    description: 'Detect GitHub personal access tokens',
    pattern: 'gh[pousr]_[A-Za-z0-9]{36}',
    flags: 'g',
    explanation: 'Matches GitHub token formats.',
    examples: ['ghp_1234567890abcdefghijklmnopqrstuvwxyz'],
  },

  passwordField: {
    id: 'password-field',
    category: 'Security',
    name: 'Password Fields',
    description: 'Detect password=xxxx style patterns',
    pattern: '(?i)(password|pwd|pass|secret)[\\s:=]+([^\\s]+)',
    flags: 'g',
    explanation: 'Matches password field assignments.',
    examples: ['password=mySecret123', 'pwd: hidden'],
  },

  /* Web */
  htmlAttr: {
    id: 'html-attr',
    category: 'Web',
    name: 'HTML Attributes',
    description: 'Extract key="value" attributes',
    pattern: '([a-zA-Z-]+)="([^"]*)"',
    flags: 'g',
    explanation: 'Matches HTML attribute pairs.',
    examples: ['class="container"', 'href="page.html"'],
  },

  scriptTag: {
    id: 'script-tag',
    category: 'Web',
    name: 'Script Tags',
    description: 'Extract <script> tags with content',
    pattern: '<script[^>]*>[\\s\\S]*?<\\/script>',
    flags: 'gi',
    explanation: 'Matches script tag blocks.',
    examples: ['<script>alert(1)</script>'],
  },

  styleTag: {
    id: 'style-tag',
    category: 'Web',
    name: 'Style Tags',
    description: 'Extract <style> tag blocks',
    pattern: '<style[^>]*>[\\s\\S]*?<\\/style>',
    flags: 'gi',
    explanation: 'Matches style tag blocks.',
    examples: ['<style>body { color: red; }</style>'],
  },

  imgTag: {
    id: 'img-tag',
    category: 'Web',
    name: '<img> Tags',
    description: 'Extract image tag elements',
    pattern: '<img\\b[^>]*>',
    flags: 'gi',
    explanation: 'Matches image tags.',
    examples: ['<img src="pic.jpg" alt="Image">'],
  },

  mediaUrl: {
    id: 'media-url',
    category: 'Web',
    name: 'Media URLs',
    description: 'Find URLs ending in images/videos',
    pattern: 'https?:\\/\\/[\\w.-]+\\/(?:[\\w.-]+)\\.(?:png|jpg|jpeg|gif|mp4|webm|svg)',
    flags: 'gi',
    explanation: 'Matches media file URLs.',
    examples: ['https://example.com/image.jpg'],
  },

  /* Business & Finance */
  isoCurrency: {
    id: 'iso-currency',
    category: 'Payment',
    name: 'ISO Currency Amounts',
    description: 'Extract amounts in ISO format',
    pattern: '\\b[A-Z]{3}\\s?\\d+(?:\\.\\d{2})?\\b',
    flags: 'g',
    explanation: 'Matches currency code followed by amount.',
    examples: ['USD 100.50', 'EUR500'],
  },

  iban: {
    id: 'iban',
    category: 'Payment',
    name: 'IBAN Numbers',
    description: 'Extract IBAN bank account numbers',
    pattern: '\\b[A-Z]{2}\\d{2}[A-Z0-9]{11,30}\\b',
    flags: 'g',
    explanation: 'Matches International Bank Account Numbers.',
    examples: ['DE89370400440532013000'],
  },

  creditCardStrict: {
    id: 'credit-card-strict',
    category: 'Payment',
    name: 'Credit Card (Strict Types)',
    description: 'Detect all major credit card types',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5\\d{2})\\d{12})\\b',
    flags: 'g',
    explanation: 'Matches Visa, Mastercard, Amex, Discover.',
    examples: ['4532015112830366', '5425233010103442'],
  },

  skuAdvanced: {
    id: 'sku-advanced',
    category: 'Business',
    name: 'Advanced SKU Codes',
    description: 'Extract advanced SKU code patterns',
    pattern: '\\b[A-Z]{2,5}-\\d{2,8}(?:-[A-Z0-9]{1,6})?\\b',
    flags: 'gi',
    explanation: 'Matches complex SKU formats.',
    examples: ['PROD-123456-XL', 'SKU-99'],
  },

  /* Networking */
  macAddress: {
    id: 'mac-address',
    category: 'Network',
    name: 'MAC Addresses',
    description: 'Extract MAC addresses',
    pattern: '\\b(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}\\b',
    flags: 'g',
    explanation: 'Matches MAC address format.',
    examples: ['00:1A:2B:3C:4D:5E'],
  },

  ipv6Full: {
    id: 'ipv6-full',
    category: 'Network',
    name: 'IPv6 (Full / Compressed)',
    description: 'Extract IPv6 addresses',
    pattern: '\\b(?:(?:[0-9A-Fa-f]{1,4})(?::|$)){2,7}[0-9A-Fa-f]{1,4}\\b',
    flags: 'g',
    explanation: 'Matches full and compressed IPv6.',
    examples: ['2001:db8::1', 'fe80::1'],
  },

  portNumber: {
    id: 'port-number',
    category: 'Network',
    name: 'Port Numbers',
    description: 'Extract port numbers from addresses',
    pattern: ':(\\d{2,5})\\b',
    flags: 'g',
    explanation: 'Matches :port notation.',
    examples: [':8080', ':443'],
  },

  /* Dates */
  rfc2822: {
    id: 'rfc2822',
    category: 'Dates',
    name: 'RFC 2822 Dates',
    description: 'Extract RFC 2822 format dates',
    pattern: '[A-Za-z]{3},\\s\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{2}:\\d{2}:\\d{2}\\s[+-]\\d{4}',
    flags: 'g',
    explanation: 'Matches email-standard date format.',
    examples: ['Mon, 14 Feb 2024 13:50:22 +0000'],
  },

  unixTimestamp: {
    id: 'unix-ts',
    category: 'Dates',
    name: 'Unix Timestamp',
    description: 'Extract 10-digit Unix timestamps',
    pattern: '\\b\\d{10}\\b',
    flags: 'g',
    explanation: 'Matches Unix timestamps (seconds since epoch).',
    examples: ['1707902422'],
  },

  /* Text */
  emoji: {
    id: 'emoji',
    category: 'Text',
    name: 'Emoji Characters',
    description: 'Extract emoji characters',
    pattern: '[\\u{1F600}-\\u{1F64F}]',
    flags: 'gu',
    explanation: 'Matches common emoji ranges.',
    examples: ['😀', '😂', '🎉'],
  },

  htmlEntity: {
    id: 'html-entity',
    category: 'Text',
    name: 'HTML Entities',
    description: 'Extract HTML entities',
    pattern: '&[A-Za-z0-9#]+;',
    flags: 'g',
    explanation: 'Matches HTML entity encodings.',
    examples: ['&nbsp;', '&#169;', '&lt;'],
  },

  accentedWords: {
    id: 'accented-words',
    category: 'Text',
    name: 'Accented Words',
    description: 'Extract words with accents',
    pattern: '\\b[\\p{L}]+\\b',
    flags: 'gu',
    explanation: 'Matches words with diacritical marks.',
    examples: ['café', 'naïve', 'Zürich'],
  },

  unicodeLetters: {
    id: 'unicode-letters',
    category: 'Text',
    name: 'Unicode Letters Only',
    description: 'Extract non-ASCII letters',
    pattern: '\\p{L}+',
    flags: 'gu',
    explanation: 'Matches any Unicode letter.',
    examples: ['中文', 'العربية', 'Ελληνικά'],
  },

  /* Social Media */
  tiktokUser: {
    id: 'tiktok-user',
    category: 'Social',
    name: 'TikTok Usernames',
    description: 'Extract TikTok user handles',
    pattern: '@[A-Za-z0-9._]{2,24}',
    flags: 'g',
    explanation: 'Matches TikTok usernames.',
    examples: ['@tiktokuser', '@user_123'],
  },

  youtubeId: {
    id: 'youtube-id',
    category: 'Social',
    name: 'YouTube Video IDs',
    description: 'Extract YouTube video identifiers',
    pattern: '\\b(?:v=|youtu\\.be\\/)([A-Za-z0-9_-]{11})\\b',
    flags: 'gi',
    explanation: 'Matches YouTube video ID formats.',
    examples: ['v=dQw4w9WgXcQ', 'youtu.be/dQw4w9WgXcQ'],
  },

  discordUser: {
    id: 'discord-user',
    category: 'Social',
    name: 'Discord Username + Tag',
    description: 'Extract Discord usernames',
    pattern: '[A-Za-z0-9_]{2,32}#\\d{4}',
    flags: 'g',
    explanation: 'Matches Discord username#tag format.',
    examples: ['Username#0001', 'user_123#9999'],
  },

  /* System */
  windowsPath: {
    id: 'windows-path',
    category: 'System',
    name: 'Windows File Paths',
    description: 'Extract Windows file paths',
    pattern: '[A-Za-z]:\\\\(?:[\\w-]+\\\\)*[\\w.-]+',
    flags: 'g',
    explanation: 'Matches Windows path format.',
    examples: ['C:\\Users\\Name\\file.txt'],
  },

  unixPath: {
    id: 'unix-path',
    category: 'System',
    name: 'Unix Paths',
    description: 'Extract Unix/Linux file paths',
    pattern: '\\/(?:[\\w.-]+\\/)*[\\w.-]+',
    flags: 'g',
    explanation: 'Matches Unix path format.',
    examples: ['/home/user/file.txt', '/var/log/app.log'],
  },

  scientific: {
    id: 'scientific',
    category: 'Numbers',
    name: 'Scientific Notation Numbers',
    description: 'Extract scientific notation numbers',
    pattern: '-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?',
    flags: 'gi',
    explanation: 'Matches scientific notation.',
    examples: ['1.5e-4', '3.14E+10'],
  },

  parcelTracking: {
    id: 'parcel-tracking',
    category: 'Business',
    name: 'Parcel Tracking Numbers',
    description: 'Extract package tracking numbers',
    pattern: '\\b[A-Z0-9]{8,22}\\b',
    flags: 'g',
    explanation: 'Matches tracking number formats.',
    examples: ['1Z999AA10123456784'],
  },

  isbn: {
    id: 'isbn',
    category: 'Business',
    name: 'ISBN Numbers',
    description: 'Extract ISBN book identifiers',
    pattern: '\\b(?:ISBN(?:-1[03])?:?\\s*)?(97[89][- ]?)?\\d{1,5}[- ]?\\d{1,7}[- ]?\\d{1,7}[- ]?[0-9X]\\b',
    flags: 'gi',
    explanation: 'Matches ISBN-10 and ISBN-13.',
    examples: ['978-0-306-40615-2', 'ISBN 9780306406157'],
  },

  htmlId: {
    id: 'html-id',
    category: 'Web',
    name: 'HTML #id Attributes',
    description: 'Extract HTML element IDs',
    pattern: '#[A-Za-z_][A-Za-z0-9_-]*',
    flags: 'g',
    explanation: 'Matches CSS/HTML id selectors.',
    examples: ['#myContainer', '#btn-primary'],
  },

  htmlClass: {
    id: 'html-class',
    category: 'Web',
    name: 'CSS Class Selectors',
    description: 'Extract CSS class names',
    pattern: '\\.[A-Za-z_][A-Za-z0-9_-]*',
    flags: 'g',
    explanation: 'Matches CSS class selectors.',
    examples: ['.container', '.btn-primary'],
  },

  /* Programming - Advanced */
  jsxComponent: {
    id: 'jsx-component',
    category: 'Programming',
    name: 'JSX Component Tags',
    description: 'Extract <Component> JSX tags',
    pattern: '<[A-Z][A-Za-z0-9]*(?:\\s[^>]*)?/?\\s*>',
    flags: 'g',
    explanation: 'Matches JSX component tags.',
    examples: ['<Button />', '<MyCard title="hello">'],
  },

  reactHook: {
    id: 'react-hook',
    category: 'Programming',
    name: 'React Hook Calls',
    description: 'Detect useState, useEffect, etc.',
    pattern: '\\buse[A-Z][A-Za-z]+\\b',
    flags: 'g',
    explanation: 'Matches React hook function names.',
    examples: ['useState', 'useEffect', 'useCallback'],
  },

  importStatement: {
    id: 'import-statement',
    category: 'Programming',
    name: 'ES Module Imports',
    description: 'Extract import statements',
    pattern: 'import\\s+[^;]+;',
    flags: 'g',
    explanation: 'Matches ES6 import statements.',
    examples: ['import React from "react";'],
  },

  exportStatement: {
    id: 'export-statement',
    category: 'Programming',
    name: 'ES Module Exports',
    description: 'Extract export statements',
    pattern: 'export\\s+[^;]+;',
    flags: 'g',
    explanation: 'Matches ES6 export statements.',
    examples: ['export default App;', 'export const func = () => {}'],
  },

  pythonDef: {
    id: 'python-def',
    category: 'Programming',
    name: 'Python Function Definitions',
    description: 'Extract Python function definitions',
    pattern: '^def\\s+([A-Za-z_][A-Za-z0-9_]*)',
    flags: 'gm',
    explanation: 'Matches Python function definitions.',
    examples: ['def my_function():', 'def calculate(x, y):'],
  },

  sqlSelect: {
    id: 'sql-select',
    category: 'Programming',
    name: 'SQL SELECT Statements',
    description: 'Extract SQL queries',
    pattern: '\\bSELECT\\b[\\s\\S]+?\\bFROM\\b',
    flags: 'gi',
    explanation: 'Matches SQL SELECT statements.',
    examples: ['SELECT * FROM users'],
  },

  jsonBlock: {
    id: 'json-block',
    category: 'Programming',
    name: 'Embedded JSON Objects',
    description: 'Extract JSON blocks',
    pattern: '\\{(?:[^{}]|\\{[^{}]*\\})*\\}',
    flags: 'g',
    explanation: 'Matches JSON object structures.',
    examples: ['{"name": "John", "age": 30}'],
  },

  singleComment: {
    id: 'single-comment',
    category: 'Programming',
    name: 'Single-line Comments',
    description: 'Extract single-line comments',
    pattern: '//.*$',
    flags: 'gm',
    explanation: 'Matches // style comments.',
    examples: ['// This is a comment'],
  },

  multiComment: {
    id: 'multi-comment',
    category: 'Programming',
    name: 'Multi-line Comments',
    description: 'Extract multi-line comments',
    pattern: '/\\*[\\s\\S]*?\\*/',
    flags: 'g',
    explanation: 'Matches /* ... */ style comments.',
    examples: ['/* Multi\nline\ncomment */'],
  },

  tailwindClass: {
    id: 'tailwind-class',
    category: 'Programming',
    name: 'Tailwind CSS Classes',
    description: 'Extract Tailwind utility classes',
    pattern: '\\b[a-zA-Z0-9-:]+\\b',
    flags: 'g',
    explanation: 'Matches Tailwind utility class names.',
    examples: ['bg-blue-500', 'text-lg', 'hover:scale-105'],
  },

  /* Logs & Debugging */
  jsStack: {
    id: 'js-stack',
    category: 'Logs',
    name: 'JS Stack Trace Lines',
    description: 'Extract stack trace entries',
    pattern: 'at\\s+[\\w.$]+\\s+\\(([^)]+)\\)',
    flags: 'g',
    explanation: 'Matches JavaScript stack trace lines.',
    examples: ['at myFunction (file.js:10:5)'],
  },

  logLevels: {
    id: 'log-levels',
    category: 'Logs',
    name: 'Common Log Levels',
    description: 'Extract log severity levels',
    pattern: '\\b(INFO|DEBUG|WARN|ERROR|FATAL)\\b',
    flags: 'g',
    explanation: 'Matches log level keywords.',
    examples: ['ERROR', 'DEBUG', 'WARN'],
  },

  httpLog: {
    id: 'http-log',
    category: 'Logs',
    name: 'HTTP Access Log Lines',
    description: 'Extract HTTP request logs',
    pattern: '"(GET|POST|PUT|DELETE|PATCH)\\s+([^"]+)"\\s+(\\d{3})',
    flags: 'g',
    explanation: 'Matches HTTP log entries.',
    examples: ['"GET /api/users" 200'],
  },

  logIp: {
    id: 'log-ip',
    category: 'Logs',
    name: 'IP in Web Logs',
    description: 'Extract IPs from log files',
    pattern: '^\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b',
    flags: 'gm',
    explanation: 'Matches IP addresses at line start.',
    examples: ['192.168.1.1'],
  },

  logIsoDate: {
    id: 'log-iso',
    category: 'Logs',
    name: 'ISO Timestamp Log Entries',
    description: 'Extract ISO formatted timestamps from logs',
    pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
    flags: 'gm',
    explanation: 'Matches ISO 8601 timestamps.',
    examples: ['2024-02-14T13:50:22'],
  },

  /* Web - HTML */
  htmlComment2: {
    id: 'html-comment-2',
    category: 'Web',
    name: 'HTML Comments',
    description: 'Extract HTML comment blocks',
    pattern: '<!--[\\s\\S]*?-->',
    flags: 'g',
    explanation: 'Matches HTML comments.',
    examples: ['<!-- This is a comment -->'],
  },

  htmlIdAttr: {
    id: 'html-id-attr',
    category: 'Web',
    name: 'HTML id="..." Attributes',
    description: 'Extract HTML id values',
    pattern: 'id="([^"]+)"',
    flags: 'g',
    explanation: 'Matches HTML id attribute values.',
    examples: ['id="main-container"'],
  },

  htmlClassAttr: {
    id: 'html-class-attr',
    category: 'Web',
    name: 'HTML class="..." Attributes',
    description: 'Extract HTML class values',
    pattern: 'class="([^"]+)"',
    flags: 'g',
    explanation: 'Matches HTML class attribute values.',
    examples: ['class="btn btn-primary"'],
  },

  cssSelector2: {
    id: 'css-selector-2',
    category: 'Web',
    name: 'CSS Selectors',
    description: 'Extract CSS selector patterns',
    pattern: '^[.#]?[A-Za-z0-9_-]+$',
    flags: 'gm',
    explanation: 'Matches CSS selectors.',
    examples: ['.container', '#main', 'div.active'],
  },

  imgSrc: {
    id: 'img-src',
    category: 'Web',
    name: 'Image Source URLs',
    description: 'Extract src URLs from img tags',
    pattern: '<img[^>]+src="([^"]+)"',
    flags: 'gi',
    explanation: 'Matches image source attributes.',
    examples: ['src="image.jpg"', 'src="https://example.com/pic.png"'],
  },

  /* Security - Advanced */
  sshKey: {
    id: 'ssh-key',
    category: 'Security',
    name: 'SSH Public Keys',
    description: 'Extract SSH public key strings',
    pattern: 'ssh-(rsa|ed25519) [A-Za-z0-9+/=]+',
    flags: 'g',
    explanation: 'Matches SSH public key format.',
    examples: ['ssh-rsa AAAAB3NzaC...'],
  },

  privateKeyHeader: {
    id: 'private-key-header',
    category: 'Security',
    name: 'PEM Private Key Headers',
    description: 'Detect PEM key file headers',
    pattern: '-----BEGIN [A-Z ]+PRIVATE KEY-----',
    flags: 'g',
    explanation: 'Matches PEM private key headers.',
    examples: ['-----BEGIN RSA PRIVATE KEY-----'],
  },

  ipv6Cidr: {
    id: 'ipv6-cidr',
    category: 'Network',
    name: 'IPv6 CIDR Notation',
    description: 'Extract IPv6 CIDR ranges',
    pattern: '[0-9A-Fa-f:]+\\/\\d{1,3}',
    flags: 'g',
    explanation: 'Matches IPv6 CIDR notation.',
    examples: ['2001:db8::/32'],
  },

  /* Business & Finance */
  invoiceNumber: {
    id: 'invoice-number',
    category: 'Business',
    name: 'Invoice Numbers',
    description: 'Extract invoice identifiers',
    pattern: '\\bINV[- ]?\\d{4,10}\\b',
    flags: 'gi',
    explanation: 'Matches invoice number patterns.',
    examples: ['INV-2024-001', 'INV 9999'],
  },

  productVariant: {
    id: 'product-variant',
    category: 'Business',
    name: 'Product Variant Codes',
    description: 'Extract product variant identifiers',
    pattern: '[A-Z]{2,5}-[A-Z0-9]{2,6}',
    flags: 'g',
    explanation: 'Matches product variant codes.',
    examples: ['SKU-BLUE', 'PROD-LG'],
  },

  ean13: {
    id: 'ean-13',
    category: 'Business',
    name: 'EAN-13 Barcodes',
    description: 'Extract EAN-13 barcode numbers',
    pattern: '\\b\\d{13}\\b',
    flags: 'g',
    explanation: 'Matches 13-digit EAN codes.',
    examples: ['5901234123457'],
  },

  usdCents: {
    id: 'usd-cents',
    category: 'Payment',
    name: 'USD Currency (Strict)',
    description: 'Extract USD amounts with cents',
    pattern: '\\$\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?',
    flags: 'g',
    explanation: 'Matches USD currency format.',
    examples: ['$99.99', '$1,000.50'],
  },

  intlPhone: {
    id: 'intl-phone',
    category: 'Business',
    name: 'International Phone Numbers',
    description: 'Extract international phone numbers',
    pattern: '\\+\\d{1,3}[- ]?\\d{4,14}',
    flags: 'g',
    explanation: 'Matches phone numbers with country code.',
    examples: ['+1-555-123-4567', '+44 20 7946 0958'],
  },

  /* Scientific & Measurements */
  chemicalFormula: {
    id: 'chemical-formula',
    category: 'Science',
    name: 'Chemical Formula',
    description: 'Extract chemical element notation',
    pattern: '\\b[A-Z][a-z]?[0-9]*\\b',
    flags: 'g',
    explanation: 'Matches chemical formulas.',
    examples: ['H2O', 'NaCl', 'Ca'],
  },

  measurement: {
    id: 'measurement',
    category: 'Science',
    name: 'Measurements with Units',
    description: 'Extract numeric measurements',
    pattern: '\\b\\d+(?:\\.\\d+)?\\s?(cm|mm|kg|lb|m|km|L|ml)\\b',
    flags: 'gi',
    explanation: 'Matches values with units.',
    examples: ['25kg', '3.2m', '500ml'],
  },

  percent: {
    id: 'percent',
    category: 'Numbers',
    name: 'Percentages',
    description: 'Extract percentage values',
    pattern: '\\b\\d+(?:\\.\\d+)?%\\b',
    flags: 'g',
    explanation: 'Matches percentage notation.',
    examples: ['50%', '99.9%'],
  },

  scientificSymbols: {
    id: 'scientific-symbols',
    category: 'Science',
    name: 'Scientific Symbols',
    description: 'Extract values with scientific units',
    pattern: '\\b\\d+(?:\\.\\d+)?\\s?(µ|Ω|°C|°F|ppm|mol)\\b',
    flags: 'g',
    explanation: 'Matches scientific notation with symbols.',
    examples: ['25°C', '50ppm', '5Ω'],
  },

  /* Text Processing */
  parentheses: {
    id: 'parentheses',
    category: 'Text',
    name: 'Text Inside Parentheses',
    description: 'Extract text inside ()',
    pattern: '\\(([^)]*)\\)',
    flags: 'g',
    explanation: 'Matches content within parentheses.',
    examples: ['(example)', '(multiple words here)'],
  },

  brackets: {
    id: 'brackets',
    category: 'Text',
    name: 'Text Inside [brackets]',
    description: 'Extract text inside []',
    pattern: '\\[([^\\]]*)\\]',
    flags: 'g',
    explanation: 'Matches content within brackets.',
    examples: ['[example]', '[link title]'],
  },

  curlyBraces: {
    id: 'curly-braces',
    category: 'Text',
    name: 'Content Inside {braces}',
    description: 'Extract text inside {}',
    pattern: '\\{([^}]*)\\}',
    flags: 'g',
    explanation: 'Matches content within braces.',
    examples: ['{variable}', '{object key}'],
  },

  emailName: {
    id: 'email-name',
    category: 'Text',
    name: 'Email Display Name',
    description: 'Extract email display names',
    pattern: '"([^"]+)"\\s*<([^>]+)>',
    flags: 'g',
    explanation: 'Matches "Name" <email@example.com> format.',
    examples: ['"John Doe" <john@example.com>'],
  },

  sentence: {
    id: 'sentence',
    category: 'Text',
    name: 'Sentence Extractor',
    description: 'Extract complete sentences',
    pattern: '[A-Z][^.!?]*[.!?]',
    flags: 'g',
    explanation: 'Matches sentences ending with . ! or ?',
    examples: ['This is a sentence.', 'Is this a question?'],
  },
};

export function getPatternTemplatesByCategory() {
  const categories = {};
  
  Object.values(REGEX_PATTERN_TEMPLATES).forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = [];
    }
    categories[template.category].push(template);
  });
  
  return categories;
}

export function getPatternTemplate(id) {
  return REGEX_PATTERN_TEMPLATES[id] || null;
}

export function getAllPatternTemplates() {
  return Object.values(REGEX_PATTERN_TEMPLATES);
}
