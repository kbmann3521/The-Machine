// JWT Decoder - Phase 1: Core Decoder with Validation & Analytics
// Features: Parsing, Base64URL Decoding, JSON Validation, Timestamp Interpretation, Claim Diagnostics, Claim Linting

function decodeBase64Url(str) {
  try {
    // Add padding if needed
    let padded = str
    const remainder = str.length % 4
    if (remainder) {
      padded = str + '='.repeat(4 - remainder)
    }

    // Decode base64url to base64 (replace - and _ with + and /)
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    // Decode to string
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    return { success: true, value: decoded }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function parseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    return { success: true, value: parsed, error: null }
  } catch (error) {
    // Try to provide helpful error message
    const match = error.message.match(/position (\d+)/)
    const position = match ? parseInt(match[1]) : null
    const context = position ? jsonString.substring(Math.max(0, position - 20), Math.min(jsonString.length, position + 20)) : null

    return {
      success: false,
      value: null,
      error: `Invalid JSON: ${error.message}${context ? ` near: "${context}"` : ''}`,
    }
  }
}

function detectDuplicateKeys(jsonString) {
  const keys = []
  const duplicates = []
  let inString = false
  let escapeNext = false
  let currentKey = ''
  let inKey = false

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
      if (!inString) {
        inString = true
        currentKey = ''
        inKey = true
      } else {
        inString = false
        if (inKey) {
          if (keys.includes(currentKey)) {
            duplicates.push(currentKey)
          } else {
            keys.push(currentKey)
          }
          inKey = false
        }
      }
    } else if (inString && inKey) {
      currentKey += char
    }
  }

  return duplicates
}

function interpretTimestamp(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) return null

  const date = new Date(seconds * 1000)
  const now = Date.now()
  const msElapsed = now - date.getTime()

  let status = 'active'
  let timeStr = ''

  if (msElapsed < 0) {
    status = 'future'
    const msUntil = Math.abs(msElapsed)
    const minutesUntil = Math.floor(msUntil / 60000)
    const hoursUntil = Math.floor(msUntil / 3600000)
    const daysUntil = Math.floor(msUntil / 86400000)

    if (daysUntil > 0) {
      timeStr = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
    } else if (hoursUntil > 0) {
      timeStr = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
    } else if (minutesUntil > 0) {
      timeStr = `in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`
    } else {
      timeStr = 'in a few seconds'
    }
  } else {
    status = 'expired'
    const minutesAgo = Math.floor(msElapsed / 60000)
    const hoursAgo = Math.floor(msElapsed / 3600000)
    const daysAgo = Math.floor(msElapsed / 86400000)

    if (daysAgo > 0) {
      timeStr = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
    } else if (hoursAgo > 0) {
      timeStr = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
    } else if (minutesAgo > 0) {
      timeStr = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`
    } else {
      timeStr = 'a few seconds ago'
    }
  }

  return {
    timestamp: seconds,
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    status,
    relative: timeStr,
  }
}

function checkClaimPresence(payload) {
  const recommendedClaims = {
    iss: { name: 'Issuer', importance: 'high' },
    aud: { name: 'Audience', importance: 'high' },
    exp: { name: 'Expiration', importance: 'high' },
    iat: { name: 'Issued At', importance: 'high' },
    nbf: { name: 'Not Before', importance: 'medium' },
    jti: { name: 'JWT ID', importance: 'medium' },
    sub: { name: 'Subject', importance: 'medium' },
  }

  const diagnostics = []
  const present = []

  for (const [claim, info] of Object.entries(recommendedClaims)) {
    if (claim in payload) {
      present.push(claim)
    } else {
      diagnostics.push({
        level: info.importance === 'high' ? 'warning' : 'info',
        claim,
        name: info.name,
        message: `Missing recommended claim: ${info.name}`,
      })
    }
  }

  return { present, diagnostics }
}

function lintClaims(payload) {
  const issues = []

  // Check for numeric claims that should be timestamps
  const timestampClaims = ['exp', 'iat', 'nbf']
  for (const claim of timestampClaims) {
    if (claim in payload) {
      const value = payload[claim]
      if (typeof value !== 'number') {
        issues.push({
          level: 'error',
          claim,
          message: `${claim} should be a number (UNIX timestamp), got ${typeof value}`,
        })
      }
    }
  }

  // exp < iat = invalid
  if ('exp' in payload && 'iat' in payload) {
    if (payload.exp < payload.iat) {
      issues.push({
        level: 'error',
        message: 'exp (expiration) is earlier than iat (issued at) - token is always invalid',
      })
    }
  }

  // nbf > exp = invalid
  if ('nbf' in payload && 'exp' in payload) {
    if (payload.nbf > payload.exp) {
      issues.push({
        level: 'error',
        message: 'nbf (not before) is later than exp (expiration) - token is always invalid',
      })
    }
  }

  // TTL > 24 hours = warning
  if ('iat' in payload && 'exp' in payload) {
    const ttl = payload.exp - payload.iat
    const hoursPerSecond = 1 / 3600
    const hours = ttl * hoursPerSecond
    if (hours > 24) {
      issues.push({
        level: 'warning',
        message: `Long TTL: ${hours.toFixed(1)} hours (recommended: ≤ 24 hours)`,
      })
    }
  }

  // Missing exp = danger
  if (!('exp' in payload)) {
    issues.push({
      level: 'error',
      message: 'No expiration (exp) claim - token never expires',
    })
  }

  // Check for standard claims with unexpected types
  if ('iss' in payload && typeof payload.iss !== 'string') {
    issues.push({
      level: 'warning',
      claim: 'iss',
      message: 'iss (issuer) should be a string',
    })
  }

  if ('aud' in payload) {
    const aud = payload.aud
    if (typeof aud !== 'string' && !Array.isArray(aud)) {
      issues.push({
        level: 'warning',
        claim: 'aud',
        message: 'aud (audience) should be a string or array of strings',
      })
    }
  }

  if ('sub' in payload && typeof payload.sub !== 'string') {
    issues.push({
      level: 'warning',
      claim: 'sub',
      message: 'sub (subject) should be a string',
    })
  }

  return issues
}

export function jwtDecoder(text) {
  const token = text.trim()

  // Phase 1.1: Token Structure Parsing
  const parts = token.split('.')
  if (parts.length < 3) {
    return {
      error: `Invalid JWT format. Expected 3 parts (header.payload.signature) separated by dots, got ${parts.length}.`,
      decoded: false,
    }
  }

  if (parts.length > 3) {
    return {
      error: `Invalid JWT format. Expected 3 parts (header.payload.signature) separated by dots, got ${parts.length}.`,
      decoded: false,
    }
  }

  // Phase 1.5: Missing Signature Detection
  if (!parts[0] || !parts[1] || !parts[2]) {
    const missingParts = []
    if (!parts[0]) missingParts.push('header')
    if (!parts[1]) missingParts.push('payload')
    if (!parts[2]) missingParts.push('signature')
    return {
      error: `Invalid JWT: missing ${missingParts.join(', ')} part${missingParts.length > 1 ? 's' : ''}`,
      decoded: false,
    }
  }

  // Phase 1.5: Invalid base64url Detection
  for (let i = 0; i < parts.length; i++) {
    const partName = i === 0 ? 'header' : i === 1 ? 'payload' : 'signature'
    if (!/^[A-Za-z0-9_-]*$/.test(parts[i])) {
      const invalidChars = parts[i].match(/[^A-Za-z0-9_-]/g) || []
      const uniqueChars = [...new Set(invalidChars)].join(', ')
      return {
        error: `Invalid JWT: ${partName} contains non-base64url characters (${uniqueChars}). Base64url allows: a-z, A-Z, 0-9, hyphen (-), underscore (_)`,
        decoded: false,
      }
    }
  }

  // Phase 1.2: Base64URL Decoding + Error Handling
  const headerDecoded = decodeBase64Url(parts[0])
  if (!headerDecoded.success) {
    return {
      error: `Failed to decode header: ${headerDecoded.error}. Check that the header is valid base64url.`,
      decoded: false,
    }
  }

  const payloadDecoded = decodeBase64Url(parts[1])
  if (!payloadDecoded.success) {
    return {
      error: `Failed to decode payload: ${payloadDecoded.error}. Check that the payload is valid base64url.`,
      decoded: false,
    }
  }

  // Phase 1.3: Invalid JSON Detection + JSON Validation
  const headerParsed = parseJSON(headerDecoded.value)
  if (!headerParsed.success) {
    return {
      error: `Invalid JSON in header: ${headerParsed.error}`,
      decoded: false,
      raw: {
        header: headerDecoded.value,
      },
    }
  }

  const payloadParsed = parseJSON(payloadDecoded.value)
  if (!payloadParsed.success) {
    return {
      error: `Invalid JSON in payload: ${payloadParsed.error}`,
      decoded: false,
      raw: {
        payload: payloadDecoded.value,
      },
    }
  }

  // Detect duplicate keys
  const headerDuplicates = detectDuplicateKeys(headerDecoded.value)
  const payloadDuplicates = detectDuplicateKeys(payloadDecoded.value)

  // Phase 1.4: Timestamp Interpretation
  const timestamps = {}
  for (const field of ['exp', 'iat', 'nbf']) {
    if (field in payloadParsed.value) {
      timestamps[field] = interpretTimestamp(payloadParsed.value[field])
    }
  }

  // Phase 1.5: Claim Presence Diagnostics
  const claimPresence = checkClaimPresence(payloadParsed.value)

  // Phase 1.6: Basic Claim Linting
  const claimLinting = lintClaims(payloadParsed.value)

  // Overall status
  const allIssues = [...claimPresence.diagnostics, ...claimLinting]
  const errors = allIssues.filter(i => i.level === 'error')
  const warnings = allIssues.filter(i => i.level === 'warning')
  const infos = allIssues.filter(i => i.level === 'info')

  return {
    decoded: true,
    token: {
      header: headerParsed.value,
      payload: payloadParsed.value,
      signature: parts[2],
    },
    raw: {
      header: headerDecoded.value,
      payload: payloadDecoded.value,
      signature: parts[2],
    },
    validation: {
      headerDuplicateKeys: headerDuplicates,
      payloadDuplicateKeys: payloadDuplicates,
    },
    timestamps,
    claims: {
      present: claimPresence.present,
    },
    diagnostics: allIssues,
    issues: {
      errors,
      warnings,
      infos,
    },
    summary: {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: infos.length,
    },
  }
}
