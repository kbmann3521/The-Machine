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
