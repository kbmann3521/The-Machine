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

function detectAuthTokenType(scheme, token) {
  const lowerScheme = scheme.toLowerCase()

  if (lowerScheme === 'bearer') {
    const jwtCheck = parseJWT(token)
    if (jwtCheck && jwtCheck.valid) {
      return { type: 'JWT', format: 'Bearer JWT', details: 'Valid JWT structure' }
    }
    if (jwtCheck && !jwtCheck.valid) {
      return { type: 'Bearer', format: 'Bearer Token (invalid JWT)', details: jwtCheck.reason }
    }
    return { type: 'Bearer', format: 'Bearer Token (opaque)', details: 'Random/opaque token' }
  }

  if (lowerScheme === 'basic') {
    return { type: 'Basic Auth', format: 'Base64-encoded credentials', details: 'username:password' }
  }

  if (token.startsWith('sk_')) {
    return { type: 'API Key', format: 'Stripe-like API key', details: 'Starts with sk_' }
  }

  if (token.startsWith('pk_')) {
    return { type: 'API Key', format: 'Public API key', details: 'Starts with pk_' }
  }

  if (token.startsWith('ghp_') || token.startsWith('gho_') || token.startsWith('ghu_')) {
    return { type: 'API Key', format: 'GitHub token', details: 'GitHub API token' }
  }

  if (token.startsWith('AWS4-HMAC-SHA256')) {
    return { type: 'AWS Signature', format: 'AWS Signature Version 4', details: 'AWS SigV4' }
  }

  if (token.match(/^[A-Za-z0-9_-]{40,}$/)) {
    return { type: 'Opaque Token', format: 'Random base64url token', details: 'Long random string' }
  }

  return { type: 'Unknown', format: scheme, details: 'Unrecognized authorization scheme' }
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

  const valid = issues.filter(i => i.level === 'error').length === 0
  return { valid, issues, mime, charset }
}

function validateAuthorization(value) {
  const issues = []
  const parts = value.split(' ')

  if (parts.length < 2) {
    issues.push({ level: 'error', message: 'Missing token after scheme' })
    return { valid: false, issues, scheme: parts[0], token: null, tokenType: null, tokenLength: 0 }
  }

  const scheme = parts[0]
  const token = parts.slice(1).join(' ')
  const tokenType = detectAuthTokenType(scheme, token)

  if (scheme.toLowerCase() === 'bearer') {
    const jwtValidation = parseJWT(token)
    if (jwtValidation && !jwtValidation.valid) {
      issues.push({ level: 'warning', message: `Invalid JWT format: ${jwtValidation.reason}` })
    }
  }

  if (scheme.toLowerCase() === 'basic') {
    if (!/^[A-Za-z0-9+/=]+$/.test(token)) {
      issues.push({ level: 'error', message: 'Invalid Base64 encoding in Basic auth' })
    }
  }

  const valid = issues.filter(i => i.level === 'error').length === 0
  return { valid, issues, scheme, token, tokenType, tokenLength: token.length }
}

function parseCSP(value) {
  const directives = {}
  const issues = []

  if (!value || !value.trim()) {
    issues.push({ level: 'warning', message: 'Empty CSP policy' })
    return { directives: {}, issues, valid: true }
  }

  const parts = value.split(';')
  const unsafeDirectives = ['unsafe-inline', 'unsafe-eval']

  parts.forEach(part => {
    const trimmed = part.trim()
    if (!trimmed) return

    const [directiveName, ...sourceValues] = trimmed.split(/\s+/)
    const sources = sourceValues.join(' ').trim()

    directives[directiveName] = sources ? sources.split(/\s+/) : []

    // Check for unsafe directives
    if (directiveName.includes('script-src') || directiveName.includes('style-src') || directiveName === 'default-src') {
      unsafeDirectives.forEach(unsafe => {
        if (sources && sources.includes(unsafe)) {
          const severity = directiveName.includes('script-src') ? 'warning' : 'info'
          const msg = unsafe === 'unsafe-inline'
            ? `'${unsafe}' in ${directiveName} reduces CSP effectiveness`
            : `'${unsafe}' in ${directiveName} allows arbitrary code execution`
          issues.push({ level: severity, message: msg })
        }
      })
    }

    // Check for overly permissive policies
    if (sources === '*' || sources === "'none'" && directiveName === 'default-src') {
      const msg = sources === '*'
        ? `${directiveName} allows all sources (overly permissive)`
        : `${directiveName} set to 'none' (overly restrictive)`
      issues.push({ level: 'warning', message: msg })
    }
  })

  // Check for missing default-src
  if (!directives['default-src'] && Object.keys(directives).length > 0) {
    issues.push({ level: 'info', message: 'Missing default-src directive (not all cases covered)' })
  }

  return { directives, issues, valid: issues.filter(i => i.level === 'error').length === 0 }
}

function evaluateReferrerPolicy(value) {
  const policies = {
    'no-referrer': { strength: 'maximum', allowsSensitiveLeakage: false },
    'no-referrer-when-downgrade': { strength: 'high', allowsSensitiveLeakage: false },
    'same-origin': { strength: 'high', allowsSensitiveLeakage: false },
    'strict-origin': { strength: 'high', allowsSensitiveLeakage: false },
    'strict-origin-when-cross-origin': { strength: 'high', allowsSensitiveLeakage: false },
    'origin': { strength: 'medium', allowsSensitiveLeakage: true },
    'origin-when-cross-origin': { strength: 'medium', allowsSensitiveLeakage: true },
    'unsafe-url': { strength: 'low', allowsSensitiveLeakage: true },
  }

  const policy = value.trim().toLowerCase()
  const evaluation = policies[policy] || { strength: 'unknown', allowsSensitiveLeakage: null }

  return {
    policy: value,
    strength: evaluation.strength,
    allowsSensitiveLeakage: evaluation.allowsSensitiveLeakage,
    recommendation: evaluation.strength === 'low' ? 'Consider using strict-origin-when-cross-origin' : null,
  }
}

function parsePermissionsPolicy(value) {
  const permissions = {}
  const issues = []

  if (!value || !value.trim()) {
    return { permissions: {}, issues, valid: true }
  }

  const directives = value.split(',')

  directives.forEach(directive => {
    const trimmed = directive.trim()
    if (!trimmed) return

    const [feature, ...rest] = trimmed.split('=')
    const featureName = feature.trim()
    const allowlist = rest.join('=').trim()

    if (allowlist === '()') {
      permissions[featureName] = 'disabled'
    } else if (allowlist === '(*)' || allowlist === '*' || !allowlist) {
      permissions[featureName] = 'unrestricted'
      issues.push({ level: 'warning', message: `"${featureName}" is unrestricted (allowed for all origins)` })
    } else {
      permissions[featureName] = 'restricted'
    }
  })

  return { permissions, issues, valid: issues.filter(i => i.level === 'error').length === 0 }
}

function validateETag(value) {
  const issues = []
  let type = 'strong'
  let quoted = false

  if (!value || !value.trim()) {
    issues.push({ level: 'error', message: 'ETag is empty' })
    return { valid: false, issues, type: null, quoted: null }
  }

  const trimmed = value.trim()

  if (trimmed.startsWith('W/')) {
    type = 'weak'
  }

  const actualValue = trimmed.startsWith('W/') ? trimmed.slice(2) : trimmed

  if (!actualValue.startsWith('"') || !actualValue.endsWith('"')) {
    issues.push({ level: 'error', message: 'ETag value must be quoted' })
    return { valid: false, issues, type, quoted: false }
  }

  quoted = true
  const etag = actualValue.slice(1, -1)

  // Check for illegal characters in ETag (according to RFC 7232)
  if (!/^[\x21\x23-\x7E]+$/.test(etag)) {
    issues.push({ level: 'warning', message: 'ETag contains potentially invalid characters' })
  }

  if (etag.length === 0) {
    issues.push({ level: 'warning', message: 'ETag value is empty (valid but unusual)' })
  }

  const valid = issues.filter(i => i.level === 'error').length === 0
  return { valid, issues, type, quoted, etag }
}

function validateLastModified(value) {
  const issues = []

  if (!value || !value.trim()) {
    issues.push({ level: 'error', message: 'Last-Modified is empty' })
    return { valid: false, issues, date: null }
  }

  const date = new Date(value)

  if (isNaN(date.getTime())) {
    issues.push({ level: 'error', message: `Invalid date format: "${value}" (should be RFC 7231 format: "Day, DD Mon YYYY HH:MM:SS GMT")` })
    return { valid: false, issues, date: null }
  }

  const rfc7231Pattern = /^[A-Za-z]{3},\s\d{2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT$/
  if (!rfc7231Pattern.test(value)) {
    issues.push({ level: 'warning', message: 'Should follow RFC 7231 format (e.g., "Wed, 21 Oct 2023 07:28:00 GMT")' })
  }

  return { valid: issues.filter(i => i.level === 'error').length === 0, issues, date: date.toISOString() }
}

function analyzeHSTS(value) {
  const issues = []
  const result = {
    valid: true,
    issues: [],
    maxAge: null,
    includeSubDomains: false,
    preload: false,
  }

  if (!value || !value.trim()) {
    issues.push({ level: 'error', message: 'HSTS header is empty' })
    return { ...result, valid: false, issues }
  }

  const directives = value.split(';')
  directives.forEach(directive => {
    const trimmed = directive.trim()
    if (trimmed.startsWith('max-age=')) {
      const maxAge = parseInt(trimmed.split('=')[1])
      if (!isNaN(maxAge)) {
        result.maxAge = maxAge
        if (maxAge < 31536000) {
          issues.push({ level: 'warning', message: `max-age ${maxAge}s is less than recommended 1 year (31536000s)` })
        }
      }
    } else if (trimmed.toLowerCase() === 'includesubdomains') {
      result.includeSubDomains = true
    } else if (trimmed.toLowerCase() === 'preload') {
      result.preload = true
    }
  })

  if (!result.maxAge) {
    issues.push({ level: 'error', message: 'Missing required max-age directive' })
  }

  result.valid = issues.filter(i => i.level === 'error').length === 0
  result.issues = issues
  return result
}

function analyzeXContentTypeOptions(value) {
  const issues = []
  const result = {
    valid: true,
    issues: [],
    value: value ? value.trim() : null,
  }

  if (!value || !value.trim()) {
    issues.push({ level: 'error', message: 'X-Content-Type-Options is empty' })
    result.valid = false
  } else if (value.trim().toLowerCase() !== 'nosniff') {
    issues.push({ level: 'warning', message: `Expected "nosniff", got "${value}"` })
  }

  result.valid = issues.filter(i => i.level === 'error').length === 0
  result.issues = issues
  return result
}

function analyzeXFrameOptions(value) {
  const issues = []
  const result = {
    valid: true,
    issues: [],
    value: value ? value.trim() : null,
  }

  if (!value || !value.trim()) {
    issues.push({ level: 'error', message: 'X-Frame-Options is empty' })
    result.valid = false
  } else {
    const val = value.trim().toUpperCase()
    const validValues = ['DENY', 'SAMEORIGIN', 'ALLOWALL']
    if (!validValues.includes(val)) {
      const isAllowFrom = val.startsWith('ALLOW-FROM ')
      if (!isAllowFrom) {
        issues.push({ level: 'warning', message: `Invalid value "${value}" (expected DENY, SAMEORIGIN, or ALLOW-FROM uri)` })
      }
    }
  }

  result.valid = issues.filter(i => i.level === 'error').length === 0
  result.issues = issues
  return result
}

function simulateCacheBehavior(headers, analysis) {
  const cc = analysis.caching
  const cacheControl = headers['Cache-Control']
  const directives = {}

  if (cacheControl) {
    cacheControl.split(',').forEach(directive => {
      const [key, val] = directive.trim().split('=')
      directives[key.trim()] = val ? val.trim() : true
    })
  }

  const browserSimulation = {
    cacheable: true,
    ttl: 0,
    revalidationRequired: false,
    reason: null,
  }

  const cdnSimulation = {
    cacheable: true,
    ttl: 0,
    revalidationRequired: false,
    reason: null,
  }

  // Check for no-store (forbids all caching)
  if (directives['no-store']) {
    browserSimulation.cacheable = false
    browserSimulation.reason = 'no-store directive forbids any caching'
    cdnSimulation.cacheable = false
    cdnSimulation.reason = 'no-store directive forbids any caching'
    return { browser: browserSimulation, cdn: cdnSimulation }
  }

  // Check for private (forbids CDN caching)
  if (directives.private) {
    cdnSimulation.cacheable = false
    cdnSimulation.reason = 'private directive prevents CDN caching'
  }

  // Set TTL from max-age
  if (directives['max-age']) {
    const maxAge = parseInt(directives['max-age'])
    if (!isNaN(maxAge)) {
      browserSimulation.ttl = maxAge
      if (!directives.private) {
        cdnSimulation.ttl = maxAge
      }

      if (maxAge === 0) {
        browserSimulation.revalidationRequired = true
        if (cdnSimulation.cacheable) {
          cdnSimulation.revalidationRequired = true
        }
      }
    }
  }

  // Check for s-maxage (CDN-specific TTL)
  if (directives['s-maxage']) {
    const sMaxAge = parseInt(directives['s-maxage'])
    if (!isNaN(sMaxAge) && cdnSimulation.cacheable) {
      cdnSimulation.ttl = sMaxAge
    }
  }

  // Check for no-cache (requires revalidation)
  if (directives['no-cache']) {
    browserSimulation.revalidationRequired = true
    if (cdnSimulation.cacheable) {
      cdnSimulation.revalidationRequired = true
    }
  }

  // Check for must-revalidate (strict revalidation)
  if (directives['must-revalidate']) {
    browserSimulation.revalidationRequired = true
    if (cdnSimulation.cacheable) {
      cdnSimulation.revalidationRequired = true
    }
  }

  // Check for proxy-revalidate (CDN strict revalidation)
  if (directives['proxy-revalidate']) {
    if (cdnSimulation.cacheable) {
      cdnSimulation.revalidationRequired = true
    }
  }

  // Check validators
  const hasValidator = !!headers.ETag || !!headers['Last-Modified']
  if (browserSimulation.revalidationRequired && !hasValidator) {
    browserSimulation.reason = 'missing validators (ETag/Last-Modified) requires revalidation'
  }
  if (cdnSimulation.revalidationRequired && !hasValidator) {
    cdnSimulation.reason = 'missing validators (ETag/Last-Modified) requires revalidation'
  }

  // If not explicitly cacheable, mark as not cacheable
  if (browserSimulation.ttl === 0 && !directives['no-cache'] && !directives['must-revalidate']) {
    browserSimulation.cacheable = false
    browserSimulation.reason = 'no max-age or s-maxage directive specified'
  }

  if (cdnSimulation.ttl === 0 && cdnSimulation.cacheable && !directives['no-cache'] && !directives['proxy-revalidate']) {
    cdnSimulation.cacheable = false
    cdnSimulation.reason = 'no max-age or s-maxage directive specified'
  }

  return { browser: browserSimulation, cdn: cdnSimulation }
}

function generateHeaderTransformations(headers) {
  const canonical = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const lowercase = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}: ${v}`)
    .join('\n')

  const jsonObject = JSON.stringify(headers, null, 2)

  const curlHeaders = Object.entries(headers)
    .map(([k, v]) => {
      const escaped = v.replace(/"/g, '\\"')
      return `-H "${k}: ${escaped}"`
    })
    .join(' \\\n')

  const fetchInit = {
    headers: headers,
  }
  const fetchInitString = JSON.stringify(fetchInit, null, 2)

  return {
    canonical,
    lowercase,
    jsonObject,
    curlHeaders,
    fetchInit: fetchInitString,
  }
}

function detectMissingContentLength(headers, analysis) {
  const issues = []

  if (!headers['Content-Length'] && !analysis.compression.isChunked) {
    if (headers['Transfer-Encoding'] && !headers['Transfer-Encoding'].toLowerCase().includes('chunked')) {
      issues.push({
        level: 'warning',
        message: 'Missing Content-Length for non-chunked Transfer-Encoding',
      })
    } else if (!headers['Transfer-Encoding']) {
      issues.push({
        level: 'info',
        message: 'Missing Content-Length or Transfer-Encoding (client may wait for connection close)',
      })
    }
  }

  return issues
}

function detectCachingContradictions(directives) {
  const issues = []

  if (directives.public && directives['no-store']) {
    issues.push({ level: 'error', message: 'Contradictory directives: "public" and "no-store" (no-store takes precedence)' })
  }

  if (directives['no-cache'] && directives.immutable) {
    issues.push({ level: 'warning', message: 'Contradictory directives: "no-cache" and "immutable" (no-cache requires revalidation)' })
  }

  if (directives['max-age'] === 0 && directives.public) {
    issues.push({ level: 'warning', message: 'Contradictory: max-age=0 with public caching (resource won\'t be cached)' })
  }

  if (directives.private && directives.public) {
    issues.push({ level: 'error', message: 'Contradictory directives: "private" and "public"' })
  }

  return issues
}

function checkHttp2Compatibility(headers, statusLine) {
  const issues = []

  if (statusLine && statusLine.httpVersion && statusLine.httpVersion.includes('2')) {
    if (headers.Connection) {
      const connValue = headers.Connection.toLowerCase()
      if (connValue.includes('keep-alive')) {
        issues.push({ level: 'info', message: 'Connection: keep-alive is obsolete in HTTP/2 (always kept alive)' })
      }
      if (connValue.includes('upgrade') || connValue.includes('close')) {
        issues.push({ level: 'warning', message: `Connection: ${connValue} is not meaningful in HTTP/2` })
      }
    }

    if (headers['Transfer-Encoding']) {
      issues.push({ level: 'error', message: 'Transfer-Encoding is not supported in HTTP/2 (use content framing instead)' })
    }

    if (headers['Upgrade']) {
      issues.push({ level: 'info', message: 'Upgrade header is not meaningful in HTTP/2' })
    }
  }

  return issues
}

function generateCompressionRecommendations(headers, analysis) {
  const recommendations = []
  const compressibleMimes = ['text/', 'application/json', 'application/xml', 'application/javascript', 'image/svg+xml']
  const contentType = headers['Content-Type']
  const contentLength = analysis.compression.contentLength
  const isCompressed = analysis.compression.isCompressed

  if (contentType && !isCompressed && contentLength && contentLength > 200) {
    const isCompressible = compressibleMimes.some(mime => contentType.toLowerCase().includes(mime))
    if (isCompressible) {
      if (contentLength > 1024) {
        recommendations.push('Enable br (Brotli) compression for optimal text content (20-30% better than gzip)')
      } else {
        recommendations.push('Enable gzip compression for text content over 200 bytes')
      }
    }
  }

  if (contentType && contentType.toLowerCase().includes('application/json') && contentLength && contentLength > 500 && !isCompressed) {
    recommendations.push('JSON payloads over 500 bytes should always be compressed')
  }

  return recommendations
}

function detectHeaderFolding(text) {
  const issues = []
  // Header folding is detected by newline followed by space/tab (obsolete in HTTP/1.1)
  if (/\r?\n[ \t]+/.test(text)) {
    issues.push({ level: 'warning', message: 'Deprecated header folding detected (multi-line headers with leading whitespace)' })
  }
  return issues
}

function identifyHopByHopHeaders(headers) {
  const hopByHopList = ['Connection', 'Keep-Alive', 'Proxy-Authenticate', 'Proxy-Authorization', 'TE', 'Trailers', 'Transfer-Encoding', 'Upgrade']
  const found = Object.keys(headers).filter(key =>
    hopByHopList.some(hop => hop.toLowerCase() === key.toLowerCase())
  )
  return found
}

function parseCacheControl(value) {
  const directives = {}
  const normalizedDirectives = {}
  const issues = []

  value.split(',').forEach(directive => {
    const trimmed = directive.trim()
    const [key, val] = trimmed.split('=')
    const normalizedKey = key.trim()
    directives[normalizedKey] = val ? val.trim() : true

    if (val) {
      const numVal = parseInt(val.trim())
      normalizedDirectives[normalizedKey] = isNaN(numVal) ? val.trim() : numVal
    } else {
      normalizedDirectives[normalizedKey] = true
    }
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

  // Add contradictory caching directives detection
  const cacheContradictions = detectCachingContradictions(directives)
  issues.push(...cacheContradictions)

  const exposedToSharedCache = !!(directives.public || (!directives.private && !directives['no-store']))

  return { directives, normalizedDirectives, issues, exposedToSharedCache }
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

  const valid = issues.filter(i => i.level === 'error').length === 0
  return { valid, issues, length }
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
    exposedToSharedCache: false,
  }

  const cc = headers['Cache-Control']
  if (cc) {
    const ccObj = parseCacheControl(cc)
    analysis.isPublic = !!ccObj.directives.public
    analysis.exposedToSharedCache = ccObj.exposedToSharedCache
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
    // Only set hasStrongValidator if it's not a weak validator
    const isWeak = headers.ETag.trim().startsWith('W/')
    if (!isWeak) {
      analysis.hasStrongValidator = true
    }
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

function calculateSecurityScore(headers, headerAnalysis, analysis) {
  let score = 100
  const deductions = []

  const hasHeader = (name) => {
    return Object.keys(headers).some(h => h.toLowerCase() === name.toLowerCase())
  }

  const headerValue = (name) => {
    const key = Object.keys(headers).find(h => h.toLowerCase() === name.toLowerCase())
    return key ? headers[key] : null
  }

  // Critical Security Headers (10 points each)
  if (!hasHeader('Strict-Transport-Security')) {
    score -= 10
    deductions.push({ name: 'HSTS', points: 10, severity: 'critical' })
  }

  if (!hasHeader('X-Content-Type-Options')) {
    score -= 10
    deductions.push({ name: 'X-Content-Type-Options', points: 10, severity: 'critical' })
  }

  if (!hasHeader('Content-Security-Policy')) {
    score -= 8
    deductions.push({ name: 'CSP', points: 8, severity: 'critical' })
  }

  // Important Security Headers (8 points each)
  if (!hasHeader('X-Frame-Options')) {
    score -= 8
    deductions.push({ name: 'X-Frame-Options (clickjacking protection)', points: 8, severity: 'high' })
  }

  if (!hasHeader('Referrer-Policy')) {
    score -= 6
    deductions.push({ name: 'Referrer-Policy', points: 6, severity: 'high' })
  }

  if (!hasHeader('Permissions-Policy')) {
    score -= 6
    deductions.push({ name: 'Permissions-Policy', points: 6, severity: 'high' })
  }

  // Authorization + Public Caching (10 points)
  const authHeader = headerValue('Authorization')
  const cacheControl = headerValue('Cache-Control')
  if (authHeader && cacheControl && cacheControl.toLowerCase().includes('public')) {
    score -= 10
    deductions.push({ name: 'Auth + Public Caching (security risk)', points: 10, severity: 'critical' })
  }

  // Compression Analysis (8 points)
  const contentEncoding = headerValue('Content-Encoding')
  if (!contentEncoding || !['gzip', 'br', 'deflate'].includes(contentEncoding.toLowerCase())) {
    score -= 8
    deductions.push({ name: 'Missing compression (gzip/br)', points: 8, severity: 'medium' })
  }

  // MIME Type Security (5 points)
  const contentType = headerValue('Content-Type')
  if (contentType) {
    const mime = contentType.split(';')[0].trim().toLowerCase()
    if (mime === 'application/x-www-form-urlencoded' || mime === 'text/html') {
      if (!contentType.includes('charset')) {
        score -= 5
        deductions.push({ name: 'Missing charset in Content-Type', points: 5, severity: 'medium' })
      }
    }
  }

  // Connection Management (4 points)
  const connection = headerValue('Connection')
  if (connection && connection.toLowerCase() === 'close') {
    score -= 4
    deductions.push({ name: 'Connection: close (performance issue)', points: 4, severity: 'low' })
  }

  // CSP unsafe-inline in script-src (5 points)
  if (headerAnalysis['Content-Security-Policy'] && headerAnalysis['Content-Security-Policy'].directives) {
    const cspDirectives = headerAnalysis['Content-Security-Policy'].directives
    if (cspDirectives['script-src'] && cspDirectives['script-src'].includes("'unsafe-inline'")) {
      score -= 5
      deductions.push({ name: "CSP unsafe-inline in script-src", points: 5, severity: 'medium' })
    }
  }

  // RFC COMPLIANCE DEDUCTIONS (NEW)
  // Header conflicts (Content-Length mismatch, etc.) - critical security issues
  if (analysis.rfcCompliance?.headerConflicts?.some(issue => issue.level === 'error')) {
    score -= 15
    deductions.push({ name: 'Header conflicts (RFC 7230 violations)', points: 15, severity: 'critical' })
  }

  // HTTP/2 incompatibilities (forbidden headers in HTTP/2)
  if (analysis.http2Incompatibilities?.some(issue => issue.level === 'error')) {
    score -= 10
    deductions.push({ name: 'HTTP/2 incompatible headers', points: 10, severity: 'critical' })
  }

  // Validator conflicts (Etag with no-store, etc.)
  if (analysis.rfcCompliance?.validatorConflicts?.some(issue => issue.level === 'warning')) {
    score -= 3
    deductions.push({ name: 'Validator conflicts', points: 3, severity: 'low' })
  }

  // Compression validity issues (gzip on binary, etc.)
  if (analysis.rfcCompliance?.compressionValidity?.some(issue => issue.level === 'warning')) {
    score -= 2
    deductions.push({ name: 'Suboptimal compression configuration', points: 2, severity: 'low' })
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  // Calculate grade
  let grade
  if (score >= 95) grade = 'A+'
  else if (score >= 90) grade = 'A'
  else if (score >= 85) grade = 'A-'
  else if (score >= 80) grade = 'B+'
  else if (score >= 75) grade = 'B'
  else if (score >= 70) grade = 'B-'
  else if (score >= 65) grade = 'C+'
  else if (score >= 60) grade = 'C'
  else if (score >= 55) grade = 'C-'
  else if (score >= 50) grade = 'D+'
  else if (score >= 45) grade = 'D'
  else if (score >= 40) grade = 'D-'
  else grade = 'F'

  return { score, grade, deductions }
}

function calculateOverallStatus(headerAnalysis, analysis) {
  let totalErrors = 0
  let totalWarnings = 0
  let totalInfos = 0
  let securityRisk = false

  Object.values(headerAnalysis).forEach(analysis => {
    if (analysis && analysis.issues) {
      totalErrors += analysis.issues.filter(i => i.level === 'error').length
      totalWarnings += analysis.issues.filter(i => i.level === 'warning').length
      totalInfos += analysis.issues.filter(i => i.level === 'info').length
    }
  })

  if (analysis.security.conflicts.length > 0) {
    totalErrors += analysis.security.conflicts.length
  }

  if (analysis.security.warnings.length > 0) {
    totalWarnings += analysis.security.warnings.length
  }

  // COUNT RFC COMPLIANCE ISSUES
  if (analysis.rfcCompliance) {
    const rfcIssues = [
      ...( analysis.rfcCompliance.headerConflicts || []),
      ...(analysis.rfcCompliance.headerNormalization || []),
      ...(analysis.rfcCompliance.validatorConflicts || []),
      ...(analysis.rfcCompliance.compressionValidity || []),
    ]
    totalErrors += rfcIssues.filter(i => i.level === 'error').length
    totalWarnings += rfcIssues.filter(i => i.level === 'warning').length
    totalInfos += rfcIssues.filter(i => i.level === 'info').length
  }

  // Count HTTP/2 incompatibilities
  if (analysis.http2Incompatibilities) {
    totalErrors += analysis.http2Incompatibilities.filter(i => i.level === 'error').length
    totalWarnings += analysis.http2Incompatibilities.filter(i => i.level === 'warning').length
  }

  // Count cache heuristic issues
  if (analysis.cacheHeuristics?.issues) {
    totalWarnings += analysis.cacheHeuristics.issues.filter(i => i.level === 'warning').length
    totalInfos += analysis.cacheHeuristics.issues.filter(i => i.level === 'info').length
  }

  if (analysis.security.missingRecommendedHeaders.length > 3 || totalErrors > 0) {
    securityRisk = true
  }

  const valid = totalErrors === 0

  return {
    valid,
    errors: totalErrors,
    warnings: totalWarnings,
    infos: totalInfos,
    securityRisk,
    riskLevel: securityRisk ? (totalErrors > 0 ? 'high' : 'medium') : 'low',
  }
}

function detectHeaderConflicts(headers, headerLines, statusLine, strictMode = false) {
  const issues = []
  const forbiddenHeaders = ['TE', 'Proxy-Authorization', 'Proxy-Authenticate']
  const isResponse = statusLine && statusLine.type === 'response'

  // 1. Content-Length mismatch
  const contentLengthValues = headerLines
    .filter(line => line.toLowerCase().startsWith('content-length:'))
    .map(line => line.split(':')[1].trim())

  if (contentLengthValues.length > 1) {
    const unique = new Set(contentLengthValues)
    if (unique.size > 1) {
      issues.push({ level: 'error', message: `Duplicate Content-Length with mismatched values: ${Array.from(unique).join(', ')}` })
    }
  }

  // 2. Transfer-Encoding with invalid values
  if (headers['Transfer-Encoding']) {
    const te = headers['Transfer-Encoding'].toLowerCase()
    if (!['chunked', 'gzip', 'deflate', 'br', 'compress', 'trailers'].includes(te.split(',')[0].trim())) {
      issues.push({ level: 'error', message: `Invalid Transfer-Encoding value: "${headers['Transfer-Encoding']}"` })
    }
  }

  // 3. Content-Length + Transfer-Encoding with gzip (edge case)
  if (headers['Content-Length'] && headers['Transfer-Encoding'] && headers['Content-Encoding']) {
    const te = headers['Transfer-Encoding'].toLowerCase().includes('chunked')
    const ce = headers['Content-Encoding'].toLowerCase().includes('gzip')
    if (te && ce && strictMode) {
      issues.push({ level: 'warning', message: 'Content-Length with chunked Transfer-Encoding and gzip may confuse proxies' })
    }
  }

  // 4. Connection header listing missing hop-by-hop headers
  if (headers.Connection) {
    const listed = headers.Connection.split(',').map(h => h.trim().toLowerCase())
    listed.forEach(h => {
      if (!headers[h.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')] &&
          h !== 'close' && h !== 'keep-alive') {
        issues.push({ level: 'warning', message: `Connection header lists "${h}" but header is not present` })
      }
    })
  }

  // 5. Forbidden headers in responses
  if (isResponse) {
    forbiddenHeaders.forEach(header => {
      if (headers[header]) {
        issues.push({ level: 'error', message: `Header "${header}" is forbidden in HTTP responses per RFC 7230` })
      }
    })
  }

  return issues
}

function detectHeaderNormalizationIssues(text, headers, strictMode = false) {
  const issues = []
  const lines = text.trim().split('\n')

  lines.forEach((line, idx) => {
    if (!line.trim() || !line.includes(':')) return

    // 1. Leading whitespace (header folding or malformed)
    if (line.match(/^\s+/)) {
      issues.push({ level: strictMode ? 'error' : 'warning', message: `Line ${idx + 1}: Header starts with whitespace (deprecated folding or malformed)` })
    }

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return

    const fieldName = line.substring(0, colonIdx)
    const fieldValue = line.substring(colonIdx + 1)

    // 2. Illegal whitespace in header name (e.g., "X -Api-Key")
    if (fieldName.includes(' ')) {
      issues.push({ level: 'error', message: `Header name "${fieldName}" contains illegal whitespace` })
    }

    // 3. Illegal characters in field-name (must match RFC 5234 token)
    if (!/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(fieldName)) {
      issues.push({ level: 'error', message: `Header name "${fieldName}" contains illegal characters per RFC 5234` })
    }

    // 4. Multiple colons in field name (invalid)
    if (fieldName.includes(':')) {
      issues.push({ level: 'error', message: `Header name "${fieldName}" contains colon (invalid)` })
    }

    // 5. Check for multiple colons on line (Foo: bar: baz pattern)
    const colonCount = (line.match(/:/g) || []).length
    if (colonCount > 1 && !fieldValue.includes('://')) {
      issues.push({ level: strictMode ? 'error' : 'warning', message: `Line ${idx + 1}: Header contains multiple colons (may indicate malformed value)` })
    }

    // 6. Control characters or unescaped CR/LF in value (SECURITY)
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(fieldValue)) {
      issues.push({ level: 'error', message: `Header "${fieldName}" contains control characters (potential injection vector)` })
    }

    // 7. Trailing/leading whitespace (check on raw line, not parsed value)
    // Only flag if the raw line has actual leading/trailing spaces beyond normal parsing
    const rawHasLeadingSpace = line.match(/^\s+/) // Line starts with spaces
    const rawHasTrailingSpace = line.match(/\s+$/) // Line ends with spaces
    if (rawHasLeadingSpace || rawHasTrailingSpace) {
      issues.push({ level: 'info', message: `Header "${fieldName}" has leading/trailing whitespace in raw line (unusual)` })
    }

    // 8. Trailing semicolon in Content-Type
    if (fieldValue.trim().endsWith(';') && fieldName.toLowerCase() === 'content-type') {
      issues.push({ level: 'info', message: 'Content-Type ends with semicolon (minor: typically omitted)' })
    }

    // 9. Header folding (deprecated CRLF+WSP pattern)
    if (line.match(/\r\n[\t ]/)) {
      issues.push({ level: strictMode ? 'error' : 'warning', message: `Line ${idx + 1}: Deprecated header line folding detected` })
    }
  })

  return issues
}

function calculateCacheHeuristics(headers, statusLine) {
  const cc = headers['Cache-Control']
  const directives = {}
  const heuristics = {
    browserFreshnessTTL: null,
    cdnFreshnessTTL: null,
    heuristicFreshness: null,
    staleWhileRevalidateUntil: null,
    staleIfErrorUntil: null,
    issues: [],
  }

  if (cc) {
    cc.split(',').forEach(dir => {
      const [key, val] = dir.trim().split('=')
      const trimmedKey = key.trim()
      directives[trimmedKey] = val ? parseInt(val.trim()) : true
    })
  }

  const now = Math.floor(Date.now() / 1000)

  // 1. Browser freshness (max-age)
  if (directives['max-age']) {
    heuristics.browserFreshnessTTL = directives['max-age']
  }

  // 2. CDN freshness (s-maxage OVERRIDES max-age for shared caches)
  if (directives['s-maxage']) {
    heuristics.cdnFreshnessTTL = directives['s-maxage']

    // If s-maxage = 0, CDN must revalidate immediately
    if (directives['s-maxage'] === 0) {
      heuristics.issues.push({ level: 'warning', message: 's-maxage=0 forces CDN revalidation on every request' })
    }
  } else if (directives['max-age'] && !directives.private) {
    // No s-maxage means shared cache uses max-age (if not private)
    heuristics.cdnFreshnessTTL = directives['max-age']
  }

  // 3. Heuristic freshness (RFC 7234 §4.2.3)
  // When no explicit max-age/Expires, browsers use: (Date - Last-Modified) * 0.1
  // Check: no max-age, no s-maxage, no Expires, resource is cacheable, Last-Modified exists
  const hasExpiresDirective = directives['expires'] || headers['Expires']
  const isNoCacheOrNoStore = directives['no-cache'] || directives['no-store']

  if (!directives['max-age'] && !directives['s-maxage'] && !hasExpiresDirective && !isNoCacheOrNoStore && headers['Last-Modified']) {
    const lastModified = new Date(headers['Last-Modified']).getTime() / 1000
    const dateHeader = new Date(headers['Date'] || new Date()).getTime() / 1000

    if (!isNaN(lastModified) && !isNaN(dateHeader)) {
      const responseAge = dateHeader - lastModified
      if (responseAge > 0) {
        const heuristicTTL = Math.floor(responseAge * 0.1)
        heuristics.heuristicFreshness = heuristicTTL
        if (heuristicTTL > 0) {
          heuristics.issues.push({ level: 'info', message: `Heuristic freshness: ${heuristicTTL}s (10% of age since Last-Modified)` })
        }
      }
    }
  }

  // 4. Heuristic freshness also applies when Expires is missing
  if (!directives['max-age'] && !headers['Expires'] && !headers['Date'] && headers['Last-Modified']) {
    heuristics.issues.push({ level: 'warning', message: 'No explicit cache lifetime (max-age/Expires/s-maxage); heuristic freshness will be used' })
  }

  // 5. stale-while-revalidate timeline (seconds after expiration that stale response is acceptable)
  if (directives['stale-while-revalidate']) {
    const swrSeconds = directives['stale-while-revalidate']
    const ttl = heuristics.browserFreshnessTTL || heuristics.heuristicFreshness || 0
    heuristics.staleWhileRevalidateUntil = now + ttl + swrSeconds
    heuristics.issues.push({ level: 'info', message: `stale-while-revalidate: stale response acceptable for ${swrSeconds}s after expiration` })
  }

  // 6. stale-if-error timeline (seconds after expiration that stale response is acceptable on error)
  if (directives['stale-if-error']) {
    const sieSeconds = directives['stale-if-error']
    const ttl = heuristics.browserFreshnessTTL || heuristics.heuristicFreshness || 0
    heuristics.staleIfErrorUntil = now + ttl + sieSeconds
    heuristics.issues.push({ level: 'info', message: `stale-if-error: stale response acceptable for ${sieSeconds}s if revalidation fails` })
  }

  return heuristics
}

function detectCompressionValidity(headers) {
  const issues = []
  const contentType = headers['Content-Type']?.toLowerCase() || ''
  const contentEncoding = headers['Content-Encoding']?.toLowerCase() || ''
  const vary = headers['Vary']?.toLowerCase() || ''

  if (!contentEncoding) return issues

  // 1. Gzip on already-compressed binary formats
  const alreadyCompressed = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mp3', 'audio/mpeg', 'video/mp4',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/gzip', 'application/x-gzip',
    'video/h264', 'video/webm'
  ]
  if (contentEncoding === 'gzip' && alreadyCompressed.some(fmt => contentType.includes(fmt))) {
    issues.push({ level: 'warning', message: 'gzip applied to already-compressed binary format (ineffective and may increase size by 5-10%)' })
  }

  // 2. Deflate on already-compressed
  if (contentEncoding === 'deflate' && alreadyCompressed.some(fmt => contentType.includes(fmt))) {
    issues.push({ level: 'warning', message: 'deflate applied to already-compressed format (ineffective)' })
  }

  // 3. Brotli limitations
  if (contentEncoding === 'br') {
    if (contentType.includes('octet-stream') || contentType.includes('binary')) {
      issues.push({ level: 'info', message: 'Brotli provides no benefit for binary content' })
    }
  }

  // 4. Missing Vary: Accept-Encoding when compression enabled
  if (contentEncoding && !vary.includes('accept-encoding')) {
    issues.push({ level: 'warning', message: 'Missing Vary: Accept-Encoding header with Content-Encoding (caching may return wrong version)' })
  }

  return issues
}

function detectValidatorConflicts(headers, cacheControl) {
  const issues = []
  const hasETag = !!headers.ETag
  const hasLastModified = !!headers['Last-Modified']
  const directives = {}
  let maxAge = null
  let sMaxAge = null
  let isPublic = false

  if (cacheControl) {
    cacheControl.split(',').forEach(dir => {
      const [key, val] = dir.trim().split('=')
      const trimmedKey = key.trim()
      directives[trimmedKey] = val ? val.trim() : true
      if (trimmedKey === 'max-age') maxAge = parseInt(val)
      if (trimmedKey === 's-maxage') sMaxAge = parseInt(val)
      if (trimmedKey === 'public') isPublic = true
    })
  }

  // 1. Validator present but forbidden by no-store
  if ((hasETag || hasLastModified) && directives['no-store']) {
    issues.push({ level: 'warning', message: 'Validators (ETag/Last-Modified) are useless with no-store directive' })
  }

  // 2. Weak ETag with long-term caching (semantic issue)
  if (hasETag && headers.ETag.startsWith('W/') && isPublic && maxAge && maxAge > 86400) {
    issues.push({ level: 'warning', message: 'Weak ETag with long TTL (>24h) and public caching may prevent efficient revalidation' })
  } else if (hasETag && headers.ETag.startsWith('W/') && isPublic) {
    issues.push({ level: 'warning', message: 'Weak validator (W/) with public caching may cause cache invalidation issues' })
  }

  // 3. ETag strong/weak mismatch with immutable
  if (hasETag && headers.ETag.startsWith('W/') && directives.immutable) {
    issues.push({ level: 'warning', message: 'Weak validator with immutable directive is contradictory' })
  }

  // 4. Missing validators but long TTL (heuristic freshness will kick in)
  if (!hasETag && !hasLastModified && (maxAge || sMaxAge)) {
    const ttl = maxAge || sMaxAge
    if (ttl > 3600) {
      issues.push({ level: 'info', message: `Long TTL (${ttl}s) without validators means expired responses cannot be revalidated` })
    }
  }

  // 5. Cache-Control must-revalidate overrides TTL
  if (directives['must-revalidate'] && (maxAge || sMaxAge)) {
    issues.push({ level: 'info', message: 'must-revalidate requires validation at end of max-age, regardless of freshness' })
  }

  // 6. no-cache requires full method revalidation
  if (directives['no-cache']) {
    issues.push({ level: 'warning', message: 'no-cache requires full HTTP method revalidation (not conditional GET)' })
  }

  // 7. Prefer strongest validator & detect contradictions
  if (hasETag && hasLastModified) {
    const isWeakETag = headers.ETag.startsWith('W/')
    issues.push({ level: 'info', message: `Both ETag and Last-Modified present; prefer ${isWeakETag ? 'Last-Modified' : 'ETag'} as validator` })

    // Check if Last-Modified is newer than ETag (contradiction)
    // ETag format is typically "<version>" or W/"<version>", extract version for comparison
    const etagValue = headers.ETag.replace(/^W?\/"?/, '').replace(/"?$/, '')
    try {
      const lastModified = new Date(headers['Last-Modified']).getTime()
      // If Last-Modified is much newer than a numeric ETag version, flag it
      if (!isNaN(lastModified)) {
        issues.push({ level: 'info', message: 'Last-Modified and ETag may represent different versions (verify consistency)' })
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return issues
}

function calculateEffectiveContentLength(headers, analysis) {
  const result = {
    effectiveContentLength: null,
    ignoredReason: null,
  }

  if (headers['Transfer-Encoding']) {
    const te = headers['Transfer-Encoding'].toLowerCase()
    if (te.includes('chunked') && headers['Content-Length']) {
      result.ignoredReason = 'Content-Length is ignored per RFC 7230 when Transfer-Encoding is present'
      return result
    }
  }

  if (headers['Content-Length']) {
    result.effectiveContentLength = parseInt(headers['Content-Length'])
  }

  return result
}

function detectHTTP2Issues(headers, statusLine, strictMode = false) {
  const issues = []

  if (!statusLine || !statusLine.httpVersion || !statusLine.httpVersion.includes('2')) {
    return issues
  }

  const http2Forbidden = {
    'Connection': 'is invalid in HTTP/2',
    'Keep-Alive': 'is unnecessary in HTTP/2 (always kept alive)',
    'Upgrade': 'is not used in established HTTP/2 connections',
    'Transfer-Encoding': 'is forbidden in HTTP/2 (use content framing)',
    'Proxy-Connection': 'is not meaningful in HTTP/2',
  }

  Object.entries(http2Forbidden).forEach(([headerName, msg]) => {
    if (headers[headerName]) {
      issues.push({ level: 'error', message: `${headerName} header ${msg}` })
    }
  })

  return issues
}

function detectHTTP2Incompatibilities(headers, statusLine) {
  const issues = []

  // Always warn about HTTP/2 incompatible headers, even if protocol is HTTP/1.1
  // This helps users understand what would break in HTTP/2
  const http2Forbidden = {
    'Connection': 'is forbidden in HTTP/2',
    'Keep-Alive': 'is forbidden in HTTP/2 (always kept alive)',
    'Upgrade': 'is forbidden in HTTP/2',
    'Transfer-Encoding': 'is forbidden in HTTP/2 (use content framing)',
    'Proxy-Connection': 'is forbidden in HTTP/2',
  }

  Object.entries(http2Forbidden).forEach(([headerName, msg]) => {
    if (headers[headerName]) {
      issues.push({ level: 'warning', message: `${headerName} header ${msg} (if using HTTP/2)` })
    }
  })

  return issues
}

function applySeverityRewriting(allIssues, strictMode) {
  if (!strictMode) return allIssues

  return allIssues.map(issue => {
    // In strict mode, escalate warnings related to syntax/compliance to errors
    if (issue.level === 'warning') {
      const strictErrors = [
        'contains colon',
        'contains illegal',
        'contains control',
        'folding',
        'RFC 7230',
        'RFC 5234',
        'injection',
        'deprecated',
      ]
      if (strictErrors.some(keyword => issue.message.includes(keyword))) {
        return { ...issue, level: 'error' }
      }
    }

    // In strict mode, make informational items about best practices into warnings
    if (issue.level === 'info') {
      const strictWarnings = [
        'Heuristic',
        'recommend',
        'prefer',
        'unusual',
        'optional',
        'missing',
      ]
      if (strictWarnings.some(keyword => issue.message.includes(keyword))) {
        return { ...issue, level: 'warning' }
      }
    }

    return issue
  })
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
    const parsed = parseCacheControl(headers['Cache-Control'])
    headerAnalysis['Cache-Control'] = {
      valid: parsed.issues.filter(i => i.level === 'error').length === 0,
      issues: parsed.issues,
      directives: parsed.normalizedDirectives,
      exposedToSharedCache: parsed.exposedToSharedCache,
    }
  }

  if (headers['Content-Length']) {
    headerAnalysis['Content-Length'] = validateContentLength(headers['Content-Length'])
  }

  // Parse Content-Security-Policy
  if (headers['Content-Security-Policy']) {
    headerAnalysis['Content-Security-Policy'] = parseCSP(headers['Content-Security-Policy'])
  }

  // Evaluate Referrer-Policy
  if (headers['Referrer-Policy']) {
    headerAnalysis['Referrer-Policy'] = evaluateReferrerPolicy(headers['Referrer-Policy'])
  }

  // Parse Permissions-Policy
  if (headers['Permissions-Policy']) {
    headerAnalysis['Permissions-Policy'] = parsePermissionsPolicy(headers['Permissions-Policy'])
  }

  // Validate ETag
  if (headers.ETag) {
    headerAnalysis.ETag = validateETag(headers.ETag)
  }

  // Validate Last-Modified
  if (headers['Last-Modified']) {
    headerAnalysis['Last-Modified'] = validateLastModified(headers['Last-Modified'])
  }

  // Analyze Strict-Transport-Security
  if (headers['Strict-Transport-Security']) {
    headerAnalysis['Strict-Transport-Security'] = analyzeHSTS(headers['Strict-Transport-Security'])
  }

  // Analyze X-Content-Type-Options
  if (headers['X-Content-Type-Options']) {
    headerAnalysis['X-Content-Type-Options'] = analyzeXContentTypeOptions(headers['X-Content-Type-Options'])
  }

  // Analyze X-Frame-Options
  if (headers['X-Frame-Options']) {
    headerAnalysis['X-Frame-Options'] = analyzeXFrameOptions(headers['X-Frame-Options'])
  }

  const { missingRecommended, securityWarnings, conflicts } = validateCommonHeaders(headers)
  const cachingAnalysis = analyzeCaching(headers)
  const compressionAnalysis = analyzeCompression(headers)

  // Check for header folding
  const foldingIssues = detectHeaderFolding(text)

  // Identify hop-by-hop headers
  const hopByHopHeaders = identifyHopByHopHeaders(headers)

  // Check HTTP/2 compatibility (only if HTTP/2 is detected)
  const http2Issues = checkHttp2Compatibility(headers, statusLine)

  // Generate compression recommendations
  const compressionRecommendations = generateCompressionRecommendations(headers, { compression: compressionAnalysis })

  // Simulate cache behavior for browser and CDN
  const cacheSimulation = simulateCacheBehavior(headers, { caching: cachingAnalysis })

  // Detect missing Content-Length anomalies
  const missingContentLengthIssues = detectMissingContentLength(headers, { compression: compressionAnalysis })

  // Generate header transformations
  const transformations = generateHeaderTransformations(headers)

  // ===== NEW RFC-LEVEL VALIDATORS (Option C) =====
  const strictMode = config.strictMode || false

  // 1. Detect header conflicts (Content-Length, Transfer-Encoding, forbidden headers)
  const headerConflictIssues = detectHeaderConflicts(headers, headerLines, statusLine, strictMode)

  // 2. Detect header normalization issues (illegal characters, control chars, folding)
  const headerNormalizationIssues = detectHeaderNormalizationIssues(text, headers, strictMode)

  // 3. Calculate full cache heuristics (heuristic freshness, s-maxage, stale-while-revalidate)
  const cacheHeuristics = calculateCacheHeuristics(headers, statusLine)

  // 4. Detect HTTP/2 incompatibilities (both for HTTP/2 protocol and as warnings for HTTP/1.1)
  const http2IncompatibilityIssues = statusLine && statusLine.httpVersion && statusLine.httpVersion.includes('2')
    ? detectHTTP2Issues(headers, statusLine, strictMode)
    : detectHTTP2Incompatibilities(headers, statusLine)

  // 5. Effective Content-Length (ignore when chunked)
  const contentLengthEffectiveness = calculateEffectiveContentLength(headers, compressionAnalysis)

  // 6. Compression validity (gzip on binary, brotli on text-only)
  const compressionValidityIssues = detectCompressionValidity(headers)

  // 7. Validator conflicts (Etag vs Last-Modified vs no-store)
  const validatorConflictIssues = detectValidatorConflicts(headers, headers['Cache-Control'])

  // ===== APPLY STRICT MODE SEVERITY REWRITING =====
  // Collect all issues with category tracking and rewrite severity levels based on strictMode
  const categorizedIssues = [
    ...headerConflictIssues.map(issue => ({ ...issue, _category: 'headerConflicts' })),
    ...headerNormalizationIssues.map(issue => ({ ...issue, _category: 'headerNormalization' })),
    ...validatorConflictIssues.map(issue => ({ ...issue, _category: 'validatorConflicts' })),
    ...compressionValidityIssues.map(issue => ({ ...issue, _category: 'compressionValidity' })),
    ...http2IncompatibilityIssues.map(issue => ({ ...issue, _category: 'http2Incompatibilities' })),
    ...(cacheHeuristics.issues || []).map(issue => ({ ...issue, _category: 'cacheHeuristics' })),
    ...foldingIssues.map(issue => ({ ...issue, _category: 'folding' })),
    ...missingContentLengthIssues.map(issue => ({ ...issue, _category: 'missingContentLength' })),
  ]

  // Apply severity rewriting while preserving category information
  const rewrittenCategorizedIssues = categorizedIssues.map(issue => {
    const { _category, ...issueWithoutCategory } = issue
    const rewritten = applySeverityRewriting([issueWithoutCategory], strictMode)[0]
    return { ...rewritten, _category }
  })

  // Separate rewritten issues back into their categories
  const headerConflictsRewritten = rewrittenCategorizedIssues.filter(i => i._category === 'headerConflicts').map(({ _category, ...issue }) => issue)
  const headerNormRewritten = rewrittenCategorizedIssues.filter(i => i._category === 'headerNormalization').map(({ _category, ...issue }) => issue)
  const validatorConflictsRewritten = rewrittenCategorizedIssues.filter(i => i._category === 'validatorConflicts').map(({ _category, ...issue }) => issue)
  const compressionValidityRewritten = rewrittenCategorizedIssues.filter(i => i._category === 'compressionValidity').map(({ _category, ...issue }) => issue)
  const http2RewrittenIssues = rewrittenCategorizedIssues.filter(i => i._category === 'http2Incompatibilities').map(({ _category, ...issue }) => issue)
  const cacheHeuristicsRewritten = { ...cacheHeuristics, issues: rewrittenCategorizedIssues.filter(i => i._category === 'cacheHeuristics').map(({ _category, ...issue }) => issue) }

  // ===== UPDATE CACHE SIMULATION TO USE HEURISTICS =====
  // If cacheHeuristics has values, use them to update the cache simulation
  const enhancedCacheSimulation = { ...cacheSimulation }
  if (cacheHeuristics.browserFreshnessTTL !== null) {
    enhancedCacheSimulation.browser.ttl = cacheHeuristics.browserFreshnessTTL
  } else if (cacheHeuristics.heuristicFreshness !== null) {
    enhancedCacheSimulation.browser.ttl = cacheHeuristics.heuristicFreshness
    enhancedCacheSimulation.browser.reason = 'Using heuristic freshness (no max-age/Expires)'
  }

  if (cacheHeuristics.cdnFreshnessTTL !== null) {
    enhancedCacheSimulation.cdn.ttl = cacheHeuristics.cdnFreshnessTTL
  }

  const groupedHeaders = groupHeaders(headers)

  const analysis = {
    caching: cachingAnalysis,
    compression: compressionAnalysis,
    security: {
      missingRecommendedHeaders: missingRecommended,
      warnings: securityWarnings,
      conflicts,
    },
    headerFolding: foldingIssues,
    http2Compatibility: http2Issues,
    http2Incompatibilities: http2RewrittenIssues,
    compressionRecommendations,
    hopByHopHeaders,
    responseAnomalies: missingContentLengthIssues,
    // NEW RFC-LEVEL DETECTIONS (with strict mode applied)
    rfcCompliance: {
      headerConflicts: headerConflictsRewritten,
      headerNormalization: headerNormRewritten,
      validatorConflicts: validatorConflictsRewritten,
      compressionValidity: compressionValidityRewritten,
    },
    cacheHeuristics: cacheHeuristicsRewritten,
    contentLengthEffectiveness,
    strictMode,
  }

  const overallStatus = calculateOverallStatus(headerAnalysis, analysis)
  const securityScore = calculateSecurityScore(headers, headerAnalysis, analysis)

  return {
    statusLine,
    headers,
    normalizedHeaders: headers,
    headerAnalysis,
    analysis,
    overallStatus,
    securityScore,
    groupedHeaders,
    parseErrors,
    cacheSimulation: enhancedCacheSimulation,
    transformations,
    strictMode,
    timestamp: new Date().toISOString(),
  }
}

export default httpHeaderParser
