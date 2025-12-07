/**
 * Email Validator Module
 * Comprehensive email validation with deliverability scoring
 */

// Common role-based email prefixes
const roleBasedPrefixes = [
  'admin', 'noreply', 'no-reply', 'contact', 'info', 'support',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',
  'root', 'abuse', 'security', 'billing', 'sales', 'marketing',
  'notifications', 'notification', 'alerts', 'alert', 'system'
]

const knownDisposableDomains = [
  'mailinator', 'yopmail', '10minutemail', 'temp-mail',
  'guerrillamail', 'anonymousemail', 'cock.li', 'cock.email',
  'tempmail', 'throwaway', 'mailnesia', '10min',
  'maildrop', 'mailtest', 'fakeinbox', 'trashmail'
]

// ICANN-approved TLDs (common ones; full list has 1000+ entries)
const validTLDs = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name',
  'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch',
  'at', 'se', 'no', 'dk', 'fi', 'pt', 'gr', 'ie', 'cz', 'pl', 'ru', 'jp',
  'cn', 'in', 'br', 'mx', 'ar', 'za', 'nz', 'sg', 'hk', 'kr', 'tw', 'th',
  'ph', 'id', 'my', 'vn', 'pk', 'bd', 'lk', 'ng', 'ke', 'eg', 'tr', 'il',
  'ae', 'sa', 'ksa', 'app', 'dev', 'io', 'pro', 'mobi', 'asia', 'travel',
  'tel', 'jobs', 'post', 'online', 'site', 'website', 'space', 'blog',
  'shop', 'store', 'cloud', 'tech', 'digital', 'media', 'news', 'tv', 'li'
])

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])

const rarelyUsedTLDs = new Set(['tk', 'ml', 'ga', 'cf', 'br.to', 'eu.org', 'freenom', 'xyz', 'club', 'cricket'])

// Reserved documentation domains
const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

function validateSingleEmail(trimmedEmail) {
  const details = {
    email: trimmedEmail,
    valid: false,
    issues: [],
    deliverabilityScore: 0,
    mxRecords: [],
    domainExists: false
  }

  // 1. Basic syntax validation - check for @ and domain
  if (!trimmedEmail.includes('@')) {
    details.issues.push('Missing @ symbol')
    details.deliverabilityScore = 0
    return details
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (!localPart || !domain) {
    details.issues.push('Invalid email format: missing local part or domain')
    details.deliverabilityScore = 0
    return details
  }

  // 2. Check for spaces and invalid characters
  if (/\s/.test(trimmedEmail)) {
    details.issues.push('Contains whitespace')
  }

  if (/\.\./.test(trimmedEmail)) {
    details.issues.push('Contains consecutive dots')
  }

  if (/^\.|\.$/.test(localPart)) {
    details.issues.push('Local part starts or ends with dot')
  }

  // 3. Check domain validity and TLD
  const hasDot = domain.includes('.')
  const startsWithDot = domain.startsWith('.')
  const hasValidTld = /\.[a-zA-Z]{2,}$/.test(domain)
  let tldIsIcannApproved = false

  if (startsWithDot) {
    details.issues.push('Domain cannot start with a dot')
  } else if (!hasDot) {
    details.issues.push('Domain must contain a dot (e.g., example.com)')
  } else if (!hasValidTld) {
    details.issues.push('Invalid TLD (top-level domain)')
  } else {
    // Extract TLD and check against approved list
    const tldMatch = domain.match(/\.([a-zA-Z]+)$/)
    if (tldMatch) {
      const tld = tldMatch[1].toLowerCase()
      tldIsIcannApproved = validTLDs.has(tld)
      if (!tldIsIcannApproved) {
        details.issues.push(`TLD ".${tld}" is not ICANN-approved`)
      }
    }
  }

  if (domain.length > 255) {
    details.issues.push('Domain exceeds 255 characters')
  }

  if (localPart.length > 64) {
    details.issues.push('Local part exceeds 64 characters')
  }

  // 3b. Check for reserved/documentation domains
  if (reservedDomains.has(domain.toLowerCase())) {
    details.issues.push(`"${domain}" is a reserved example domain — not deliverable`)
  }

  // 4. Check for role-based emails
  const localLower = localPart.toLowerCase()
  const roleMatch = roleBasedPrefixes.some(role =>
    localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')
  )
  if (roleMatch) {
    details.roleBasedEmail = true
  }

  // 5. Check for known disposable domains
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
  }

  // 5b. Username heuristic flags - Robust nonsense pattern detection
  details.usernameHeuristics = []
  const vowelPattern = /[aeiou]/gi

  // Check for bot-like strings (automated patterns)
  const botPatterns = ['bot', 'test', 'noreply', 'mailer', 'daemon', 'no-reply', 'notification', 'alert', 'auto', 'auto-', 'generated', 'tmp', 'temp']
  if (botPatterns.some(pattern => localLower.includes(pattern))) {
    details.usernameHeuristics.push('Username looks automated')
  }

  // Check for only numbers (unusual)
  if (/^\d+$/.test(localPart)) {
    details.usernameHeuristics.push('Username is only numbers')
  }

  // Check for excessive dots (unusual formatting)
  const dotCount = (localPart.match(/\./g) || []).length
  if (dotCount > 2) {
    details.usernameHeuristics.push('Username has excessive dots')
  }

  // Check for repeated characters (aaa, bbb, etc.) - sign of gibberish
  if (/(.)\1{2,}/.test(localPart)) {
    details.usernameHeuristics.push('Username has repeated characters')
  }

  // Check for excessive dashes/underscores
  const dashUnderscoreCount = (localPart.match(/[-_]/g) || []).length
  if (dashUnderscoreCount >= 3) {
    details.usernameHeuristics.push('Username has too many dashes or underscores')
  }

  // Check for really long username (>32 chars is unusual)
  if (localPart.length > 32) {
    details.usernameHeuristics.push('Username is very long and suspicious')
  }

  // Check for high entropy/nonsensical pattern (low vowel ratio = gibberish)
  const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
  const vowelRatioLocal = vowelsInLocal / localPart.length
  const specialCharsInLocal = (localPart.match(/[^a-zA-Z0-9.-]/g) || []).length

  // Very low vowels (< 15%) = almost certainly gibberish
  if (vowelRatioLocal < 0.15) {
    details.usernameHeuristics.push('Username appears to be gibberish or randomly generated')
  }
  // Low vowels (15-20%) in longer usernames = likely gibberish
  else if (vowelRatioLocal < 0.20 && localPart.length > 10) {
    details.usernameHeuristics.push('Username appears to be gibberish or randomly generated')
  }
  // Low vowels + special chars = gibberish
  else if (vowelRatioLocal < 0.25 && specialCharsInLocal >= 2) {
    details.usernameHeuristics.push('Username appears to be gibberish or randomly generated')
  }

  // Check for gibberish patterns: repeated uncommon letter patterns
  const trigrams = new Map()
  for (let i = 0; i <= localLower.length - 3; i++) {
    const trigram = localLower.substring(i, i + 3)
    trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1)
  }

  const repeatedTrigrams = Array.from(trigrams.values()).filter(count => count >= 2).length
  if (repeatedTrigrams >= 3) {
    details.usernameHeuristics.push('Username appears to be gibberish or randomly generated')
  }

  // Check for high consonant density in short stretches
  for (let i = 0; i <= localLower.length - 5; i++) {
    const window = localLower.substring(i, i + 5)
    const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
    if (consonantCount >= 4) {
      details.usernameHeuristics.push('Username appears to be gibberish or randomly generated')
      break
    }
  }

  // Check for mixed case with numbers and special chars (high entropy pattern)
  const hasUppercase = /[A-Z]/.test(localPart)
  const hasLowercase = /[a-z]/.test(localPart)
  const hasNumbers = /\d/.test(localPart)
  const hasSpecial = /[^a-zA-Z0-9.-]/.test(localPart)
  const entropyIndicators = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length

  if (entropyIndicators >= 3 && localPart.length > 20) {
    details.usernameHeuristics.push('Username has excessive character variety (gibberish-like)')
  }

  // Check for sequences of numbers in middle (like qwerty123456 or user12345)
  if (/[a-zA-Z]\d{4,}/.test(localPart)) {
    details.usernameHeuristics.push('Username contains long number sequence')
  }

  // 5c. Domain heuristic flags
  details.domainHeuristics = []

  if (domain.length > 40) {
    details.domainHeuristics.push('Domain name is unusually long')
  }

  // Check for random gibberish (no vowels or too many consonants in a row)
  const domainWithoutDots = domain.replace(/\./g, '')
  const domainVowelCount = (domainWithoutDots.match(vowelPattern) || []).length
  const domainVowelRatio = domainVowelCount / domainWithoutDots.length
  if (domainVowelRatio < 0.15) {
    details.domainHeuristics.push('Domain looks randomly generated')
  }

  // Check if TLD is rarely used
  const tldMatchHeuristic = domain.match(/\.([a-zA-Z]+)$/)
  if (tldMatchHeuristic) {
    const tld = tldMatchHeuristic[1].toLowerCase()
    if (rarelyUsedTLDs.has(tld)) {
      details.domainHeuristics.push(`TLD ".${tld}" is rarely used`)
    }
  }

  // 6. Use mailchecker for comprehensive validation if available
  let mailcheckerValid = true
  let hasBadReputation = false

  if (typeof MailChecker !== 'undefined' && details.issues.length === 0 && !isDisposable) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
      if (!mailcheckerValid) {
        hasBadReputation = true
        details.hasBadReputation = true
      }
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // 7. DNS/MX Record Lookup (moved to API endpoint for server-side processing)
  details.domainExists = null
  details.mxRecords = []

  // 8. Calculate Deliverability Score (0-100) using professional scoring model
  let score = 100
  details.penalties = []
  details.bonuses = []

  // HIGH-RISK PENALTIES
  if (details.issues.length > 0) {
    score = 0
    details.penalties.push({ issue: 'Syntax invalid', deduction: 100 })
  } else if (isDisposable) {
    score = 0
    details.penalties.push({ issue: 'Disposable/temporary email domain', deduction: 100 })
  } else {
    // Spammy TLD detection
    const tldMatchSpammy = domain.match(/\.([a-zA-Z]+)$/)
    if (tldMatchSpammy) {
      const tld = tldMatchSpammy[1].toLowerCase()
      if (spammyTLDs.has(tld)) {
        score = Math.max(0, score - 50)
        details.penalties.push({ issue: `Spammy TLD (.${tld})`, deduction: 50 })
      }
    }

    // MEDIUM-RISK PENALTIES
    if (roleMatch) {
      score = Math.max(0, score - 30)
      details.penalties.push({ issue: 'Role-based email (admin@, support@, hr@, etc.)', deduction: 30 })
    }

    if (details.usernameHeuristics?.some(h => h.includes('automated'))) {
      score = Math.max(0, score - 25)
      details.penalties.push({ issue: 'Username looks automated', deduction: 25 })
    }

    const gibberishHeuristics = details.usernameHeuristics?.filter(h =>
      h.includes('gibberish') ||
      h.includes('randomly generated') ||
      h.includes('repeated characters') ||
      h.includes('very long') ||
      h.includes('excessive character variety') ||
      h.includes('long number sequence')
    ) || []

    if (gibberishHeuristics.length > 0) {
      let gibberishPenalty = Math.max(-35, -10 - Math.floor((localPart.length - 15) * 0.5))
      score = Math.max(0, score + gibberishPenalty)
      details.penalties.push({ issue: 'Username contains gibberish or nonsensical patterns', deduction: Math.abs(gibberishPenalty) })
    }

    const unusualFormatting = details.usernameHeuristics?.filter(h =>
      h.includes('many dots') ||
      h.includes('too many dashes') ||
      h.includes('excessive dots')
    ) || []

    if (unusualFormatting.length > 0) {
      score = Math.max(0, score - 20)
      details.penalties.push({ issue: 'Unusual character patterns in username', deduction: 20 })
    }

    // Domain is known free-mail provider - Tiered scoring
    const domainLower = domain.toLowerCase()

    if (domainLower === 'gmail.com') {
      score = Math.min(100, score + 5)
      details.bonuses.push({ feature: 'Gmail (trusted provider)', bonus: 5 })
    } else if (['outlook.com', 'hotmail.com', 'icloud.com'].includes(domainLower)) {
      score = Math.max(0, score - 5)
      details.penalties.push({ issue: 'Standard free-mail provider (outlook/hotmail/icloud)', deduction: 5 })
    } else if (['yahoo.com', 'protonmail.com', 'mail.protonmail.com'].includes(domainLower)) {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'Medium-risk free-mail provider (yahoo/protonmail)', deduction: 10 })
    } else if (domainLower === 'aol.com') {
      score = Math.max(0, score - 15)
      details.penalties.push({ issue: 'High-risk free-mail provider (AOL - legacy/high bounce rate)', deduction: 15 })
    } else if (['zoho.com', 'gmx.com', 'mail.com'].includes(domainLower)) {
      score = Math.max(0, score - 25)
      details.penalties.push({ issue: 'High-risk free-mail provider (zoho/gmx/mail.com)', deduction: 25 })
    }

    if (hasBadReputation) {
      score = Math.max(0, score - 20)
      details.penalties.push({ issue: 'Known bad reputation provider', deduction: 20 })
    }

    // LOW-RISK PENALTIES
    if (/\s/.test(trimmedEmail)) {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'Whitespace trimmed from address', deduction: 10 })
    }

    if ((domain.match(/\./g) || []).length > 1) {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'Subdomain-based email (rare corporate setup)', deduction: 10 })
    }

    if (/[^\x00-\x7F]/.test(trimmedEmail)) {
      score = Math.max(0, score - 15)
      details.penalties.push({ issue: 'Non-ASCII characters in address', deduction: 15 })
    }

    if (!tldIsIcannApproved && hasValidTld) {
      score = Math.max(0, score - 15)
      details.penalties.push({ issue: 'Non-ICANN approved TLD', deduction: 15 })
    }
  }

  // Map final score to meaning
  if (score === 0) {
    details.deliverabilityMeaning = 'Guaranteed bad'
  } else if (score >= 90) {
    details.deliverabilityMeaning = 'Excellent deliverability'
  } else if (score >= 70) {
    details.deliverabilityMeaning = 'Likely deliverable but not perfect'
  } else if (score >= 40) {
    details.deliverabilityMeaning = 'Risky / may bounce'
  } else {
    details.deliverabilityMeaning = 'Very likely invalid'
  }

  details.deliverabilityScore = score

  // Determine final validity
  const basicValid = details.issues.length === 0
  details.valid = basicValid && (typeof MailChecker !== 'undefined' ? (isDisposable ? false : mailcheckerValid) : true)

  return details
}

export function emailValidator(text) {
  const emails = text.split(/[,\n]+/).map(e => e.trim()).filter(e => e)

  const results = emails.map((email) => validateSingleEmail(email))

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    mailcheckerAvailable: typeof MailChecker !== 'undefined',
    dnsCheckAvailable: true,
    averageDeliverabilityScore: Math.round(results.reduce((sum, r) => sum + r.deliverabilityScore, 0) / results.length),
    results,
  }
}
