function parseStatusLine(line) {
  const requestMatch = line.match(/^([A-Z]+)\s+(\S+)\s+(HTTP\/\d\.\d)$/i)
  if (requestMatch) {
    return {
      type: 'request',
      method: requestMatch[1].toUpperCase(),
      path: requestMatch[2],
      httpVersion: requestMatch[3],
    }
  }

  const responseMatch = line.match(/^(HTTP\/\d\.\d)\s+(\d{3})(?:\s+(.+))?$/i)
  if (responseMatch) {
    return {
      type: 'response',
      httpVersion: responseMatch[1],
      statusCode: parseInt(responseMatch[2]),
      statusMessage: responseMatch[3] || '',
    }
  }

  return null
}

function normalizeHeaderName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-')
}

function parseJWT(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false, reason: 'JWT must have 3 parts separated by dots' }

  for (let part of parts) {
    if (!/^[A-Za-z0-9_-]+$/.test(part)) {
      return { valid: false, reason: 'JWT contains invalid Base64URL characters' }
    }
  }

  if (parts[0].length < 5 || parts[1].length < 10 || parts[2].length < 10) {
    return { valid: false, reason: 'JWT parts appear too short' }
  }

  return { valid: true, parts: parts.length }
}

function validateContentType(value) {
  const issues = []
  const match = value.match(/^([^;]+)(?:;(.+))?$/)
  if (!match) {
    issues.push({ level: 'error', message: 'Invalid Content-Type format' })
    return { valid: false, issues, mime: null, charset: null }
  }

  const mime = match[1].trim()
  const params = match[2] ? match[2].split(';').map(p => p.trim()) : []

  const validMimes = [
    'application/json', 'application/x-www-form-urlencoded', 'text/html', 'text/plain',
    'text/css', 'text/javascript', 'application/javascript', 'image/jpeg', 'image/png',
    'image/gif', 'image/svg+xml', 'application/pdf', 'application/xml', 'text/xml',
    'application/octet-stream', 'multipart/form-data', 'application/ld+json', 'application/atom+xml',
    'video/mp4', 'audio/mpeg', 'font/ttf', 'font/woff', 'font/woff2'
  ]

  if (!validMimes.some(m => mime.toLowerCase().includes(m))) {
    issues.push({ level: 'warning', message: `Unknown MIME type: ${mime}` })
  }

  let charset = null
  const charsetParam = params.find(p => p.startsWith('charset='))
  if (charsetParam) {
    charset = charsetParam.split('=')[1]
    if (charset && charset.toLowerCase() !== 'utf-8') {
      issues.push({ level: 'warning', message: `Non-UTF-8 charset detected: ${charset}` })
    }
  } else if (mime.includes('text') || mime.includes('json')) {
    issues.push({ level: 'warning', message: 'Missing charset parameter (recommend charset=utf-8)' })
  }

  return { valid: issues.filter(i => i.level === 'error').length === 0, issues, mime, charset }
}

function validateAuthorization(value) {
  const issues = []
  const parts = value.split(' ')

  if (parts.length < 2) {
    issues.push({ level: 'error', message: 'Missing token after scheme' })
    return { valid: false, issues, scheme: parts[0], token: null }
  }

  const scheme = parts[0]
  const token = parts.slice(1).join(' ')

  if (scheme.toLowerCase() === 'bearer') {
    const jwtValidation = parseJWT(token)
    if (!jwtValidation.valid) {
      issues.push({ level: 'warning', message: `Invalid JWT format: ${jwtValidation.reason}` })
    }
  }

  if (scheme.toLowerCase() === 'basic') {
    if (!/^[A-Za-z0-9+/=]+$/.test(token)) {
      issues.push({ level: 'error', message: 'Invalid Base64 encoding in Basic auth' })
    }
  }

  return { valid: issues.filter(i => i.level === 'error').length === 0, issues, scheme, token, tokenLength: token.length }
}

function parseCacheControl(value) {
  const directives = {}
  const issues = []

  value.split(',').forEach(directive => {
    const trimmed = directive.trim()
    const [key, val] = trimmed.split('=')
    directives[key.trim()] = val ? val.trim() : true
  })

  if (directives.public && directives.private) {
    issues.push({ level: 'error', message: 'Cannot have both "public" and "private"' })
  }

  if (directives['max-age']) {
    const maxAge = parseInt(directives['max-age'])
    if (isNaN(maxAge)) {
      issues.push({ level: 'error', message: 'Invalid max-age value' })
    } else if (maxAge === 0) {
      issues.push({ level: 'warning', message: 'max-age=0 means no caching' })
    } else if (maxAge < 60) {
      issues.push({ level: 'warning', message: 'Very short cache duration (< 1 minute)' })
    }
  }

  if (directives.public && (directives['set-cookie'] || value.includes('Authorization'))) {
    issues.push({ level: 'error', message: 'Public caching with sensitive headers is a security risk' })
  }

  return { directives, issues }
}

function validateContentLength(value, body = null) {
  const issues = []
  const length = parseInt(value)

  if (isNaN(length)) {
    issues.push({ level: 'error', message: 'Content-Length must be a number' })
    return { valid: false, issues, length: null }
  }

  if (length < 0) {
    issues.push({ level: 'error', message: 'Content-Length cannot be negative' })
  }

  if (body && body.length !== length) {
    issues.push({ level: 'warning', message: `Declared length (${length}) does not match actual body length (${body.length})` })
  }

  return { valid: issues.filter(i => i.level === 'error').length === 0, issues, length }
}

function validateCommonHeaders(headers) {
  const missingRecommended = []
  const securityWarnings = []
  const conflicts = []

  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy',
    'Permissions-Policy',
  ]

  securityHeaders.forEach(header => {
    if (!Object.keys(headers).find(h => h.toLowerCase() === header.toLowerCase())) {
      missingRecommended.push(header)
    }
  })

  if (headers.Authorization && headers['Cache-Control']) {
    const cacheControl = headers['Cache-Control'].toLowerCase()
    if (cacheControl.includes('public')) {
      conflicts.push('Authorization header with public caching is a security risk')
    }
  }

  if (headers['Content-Length'] && headers['Transfer-Encoding']) {
    conflicts.push('Cannot have both Content-Length and Transfer-Encoding (ambiguous)')
  }

  if (headers.Authorization) {
    securityWarnings.push('Authorization header contains credentials - be careful with logging/sharing')
  }

  const suspiciousHeaders = Object.keys(headers).filter(h => h.includes('password') || h.includes('secret') || h.includes('token'))
  suspiciousHeaders.forEach(h => {
    if (!headers[h].includes('***') && headers[h].length > 10) {
      securityWarnings.push(`Header "${h}" might contain sensitive data`)
    }
  })

  return { missingRecommended, securityWarnings, conflicts }
}

function analyzeCaching(headers) {
  const analysis = {
    isCacheable: true,
    maxAge: null,
    isPublic: false,
    requiresRevalidation: false,
    hasStrongValidator: false,
    hasWeakValidator: false,
  }

  const cc = headers['Cache-Control']
  if (cc) {
    const ccObj = parseCacheControl(cc)
    analysis.isPublic = !!ccObj.directives.public
    if (ccObj.directives['max-age']) {
      analysis.maxAge = parseInt(ccObj.directives['max-age'])
    }
    if (ccObj.directives['no-cache'] || ccObj.directives['must-revalidate']) {
      analysis.requiresRevalidation = true
    }
    if (ccObj.directives['no-store']) {
      analysis.isCacheable = false
    }
  }

  if (headers.ETag) {
    analysis.hasStrongValidator = true
  }
  if (headers['Last-Modified']) {
    analysis.hasWeakValidator = true
  }

  return analysis
}

function analyzeCompression(headers) {
  const analysis = {
    isCompressed: false,
    method: null,
    contentLength: null,
    isChunked: false,
    keepAlive: false,
  }

  if (headers['Content-Encoding']) {
    const encoding = headers['Content-Encoding'].toLowerCase()
    if (['gzip', 'deflate', 'br', 'compress'].includes(encoding)) {
      analysis.isCompressed = true
      analysis.method = encoding
    }
  }

  if (headers['Content-Length']) {
    analysis.contentLength = parseInt(headers['Content-Length'])
  }

  if (headers['Transfer-Encoding']) {
    analysis.isChunked = headers['Transfer-Encoding'].toLowerCase().includes('chunked')
  }

  if (headers.Connection) {
    analysis.keepAlive = headers.Connection.toLowerCase().includes('keep-alive')
  }

  return analysis
}

function groupHeaders(headers) {
  const groups = {
    response: {},
    request: {},
    caching: {},
    security: {},
    content: {},
    custom: {},
  }

  const securityPatterns = ['security', 'csp', 'cors', 'x-frame', 'strict', 'referrer', 'permissions']
  const cachingPatterns = ['cache', 'expires', 'etag', 'last-modified', 'age', 'date']
  const contentPatterns = ['content-type', 'content-length', 'content-encoding', 'content-disposition']
  const requestPatterns = ['accept', 'user-agent', 'host', 'referer', 'cookie', 'authorization']

  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase()

    if (lowerKey.startsWith('x-')) {
      groups.custom[key] = value
    } else if (securityPatterns.some(p => lowerKey.includes(p))) {
      groups.security[key] = value
    } else if (cachingPatterns.some(p => lowerKey.includes(p))) {
      groups.caching[key] = value
    } else if (contentPatterns.some(p => lowerKey.includes(p))) {
      groups.content[key] = value
    } else if (requestPatterns.some(p => lowerKey.includes(p))) {
      groups.request[key] = value
    } else {
      groups.response[key] = value
    }
  })

  return Object.fromEntries(Object.entries(groups).filter(([, v]) => Object.keys(v).length > 0))
}

export function httpHeaderParser(text, config = {}) {
  const lines = text.trim().split('\n')
  if (lines.length === 0) {
    return { error: 'No headers provided' }
  }

  let statusLine = null
  let headerLines = lines

  if (lines[0]) {
    const firstLineStatus = parseStatusLine(lines[0])
    if (firstLineStatus) {
      statusLine = firstLineStatus
      headerLines = lines.slice(1)
    }
  }

  const headers = {}
  const parseErrors = []

  headerLines.forEach((line, idx) => {
    if (!line.trim()) return
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) {
      parseErrors.push(`Line ${idx + 2}: Missing colon in header`)
      return
    }
    const key = line.substring(0, colonIdx).trim()
    const value = line.substring(colonIdx + 1).trim()
    if (!key) {
      parseErrors.push(`Line ${idx + 2}: Empty header name`)
      return
    }
    const normalized = normalizeHeaderName(key)
    headers[normalized] = value
  })

  const headerAnalysis = {}

  if (headers['Content-Type']) {
    headerAnalysis['Content-Type'] = validateContentType(headers['Content-Type'])
  }

  if (headers.Authorization) {
    headerAnalysis.Authorization = validateAuthorization(headers.Authorization)
  }

  if (headers['Cache-Control']) {
    headerAnalysis['Cache-Control'] = parseCacheControl(headers['Cache-Control'])
  }

  if (headers['Content-Length']) {
    headerAnalysis['Content-Length'] = validateContentLength(headers['Content-Length'])
  }

  const { missingRecommended, securityWarnings, conflicts } = validateCommonHeaders(headers)
  const cachingAnalysis = analyzeCaching(headers)
  const compressionAnalysis = analyzeCompression(headers)

  const groupedHeaders = groupHeaders(headers)

  return {
    statusLine,
    headers,
    normalizedHeaders: headers,
    headerAnalysis,
    analysis: {
      caching: cachingAnalysis,
      compression: compressionAnalysis,
      security: {
        missingRecommendedHeaders: missingRecommended,
        warnings: securityWarnings,
        conflicts,
      },
    },
    groupedHeaders,
    parseErrors,
    timestamp: new Date().toISOString(),
  }
}

export default httpHeaderParser
