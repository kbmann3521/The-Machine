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
  let roleMatch = null
  let roleBasedPenalty = 0

  // More granular role-based penalties
  if (localLower === 'admin' || localLower.startsWith('admin+') || localLower.startsWith('admin.')) {
    roleMatch = 'admin'
    roleBasedPenalty = -20
  } else if (localLower === 'support' || localLower.startsWith('support+') || localLower.startsWith('support.')) {
    roleMatch = 'support'
    roleBasedPenalty = -20
  } else if (localLower === 'info' || localLower.startsWith('info+') || localLower.startsWith('info.')) {
    roleMatch = 'info'
    roleBasedPenalty = -20
  } else if (localLower === 'hr' || localLower === 'careers' || localLower === 'press') {
    roleMatch = 'hr'
    roleBasedPenalty = -15
  } else if (localLower === 'contact' || localLower === 'office') {
    roleMatch = 'contact'
    roleBasedPenalty = -10
  } else if (localLower === 'noreply' || localLower === 'no-reply') {
    roleMatch = 'noreply'
    roleBasedPenalty = -5
  } else if (localLower === 'abuse' || localLower === 'postmaster' || localLower === 'mailer-daemon' || localLower === 'hostmaster') {
    roleMatch = 'abuse'
    roleBasedPenalty = -40  // RFC special cases
  } else {
    // Check remaining role prefixes
    for (const role of roleBasedPrefixes) {
      if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
        roleMatch = role
        roleBasedPenalty = -15  // Default for other roles
        break
      }
    }
  }

  if (roleMatch) {
    details.roleBasedEmail = true
    details.roleBasedType = roleMatch
    details.roleBasedPenalty = roleBasedPenalty
  }

  // 5. Check for known disposable domains
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
  }

  // 5b. Username risk scoring - Unified approach instead of multiple penalties
  details.usernameHeuristics = []
  const vowelPattern = /[aeiou]/gi

  let usernameRiskScore = 0

  // Calculate username risk signals
  const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
  const vowelRatioLocal = vowelsInLocal / localPart.length

  if (vowelRatioLocal < 0.15) {
    usernameRiskScore += 5
    details.usernameHeuristics.push('Low vowel ratio')
  }

  const specialCharsInLocal = (localPart.match(/[^a-zA-Z0-9.-]/g) || []).length
  if (specialCharsInLocal >= 2) {
    usernameRiskScore += 3
    details.usernameHeuristics.push('Multiple special characters')
  }

  const hasUppercase = /[A-Z]/.test(localPart)
  const hasLowercase = /[a-z]/.test(localPart)
  const hasNumbers = /\d/.test(localPart)
  const hasSpecial = /[^a-zA-Z0-9.-]/.test(localPart)
  const entropyIndicators = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length

  if (entropyIndicators >= 3) {
    usernameRiskScore += 7
    details.usernameHeuristics.push('High character entropy')
  }

  if (localPart.length > 32) {
    usernameRiskScore += 5
    details.usernameHeuristics.push('Exceptionally long username')
  }

  // Check for bot-like patterns
  const botPatterns = ['bot', 'test', 'noreply', 'mailer', 'daemon', 'no-reply', 'notification', 'alert', 'auto', 'auto-', 'generated', 'tmp', 'temp']
  if (botPatterns.some(pattern => localLower.includes(pattern))) {
    usernameRiskScore += 6
    details.usernameHeuristics.push('Matches automated patterns')
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(localPart)) {
    usernameRiskScore += 4
    details.usernameHeuristics.push('Repeated characters detected')
  }

  // Check for gibberish patterns: repeated trigrams
  const trigrams = new Map()
  for (let i = 0; i <= localLower.length - 3; i++) {
    const trigram = localLower.substring(i, i + 3)
    trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1)
  }
  const repeatedTrigrams = Array.from(trigrams.values()).filter(count => count >= 2).length
  if (repeatedTrigrams >= 3) {
    usernameRiskScore += 8
    details.usernameHeuristics.push('Repeated letter patterns (gibberish)')
  }

  // Check for high consonant density
  for (let i = 0; i <= localLower.length - 5; i++) {
    const window = localLower.substring(i, i + 5)
    const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
    if (consonantCount >= 4) {
      usernameRiskScore += 6
      details.usernameHeuristics.push('Heavy consonant clusters')
      break
    }
  }

  // Map risk score to penalty
  let usernamePenalty = 0
  if (usernameRiskScore >= 30) {
    usernamePenalty = -20
  } else if (usernameRiskScore >= 20) {
    usernamePenalty = -15
  } else if (usernameRiskScore >= 10) {
    usernamePenalty = -10
  } else if (usernameRiskScore >= 5) {
    usernamePenalty = -5
  }

  details.usernameRiskScore = usernameRiskScore
  details.usernamePenalty = usernamePenalty

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
    // Role-based email penalty (using granular penalties based on role type)
    if (roleMatch) {
      const rolePenaltyAbs = Math.abs(roleBasedPenalty)
      score = Math.max(0, score + roleBasedPenalty)
      const roleDesc = roleMatch === 'abuse' ? 'RFC special case (abuse/postmaster)' : `Role-based email (${roleMatch})`
      details.penalties.push({ issue: roleDesc, deduction: rolePenaltyAbs })
    }

    // Apply username risk penalty (unified from multiple signals)
    if (usernamePenalty < 0) {
      score = Math.max(0, score + usernamePenalty)
      const riskLevel = usernameRiskScore >= 30 ? 'very risky' :
                       usernameRiskScore >= 20 ? 'risky' :
                       usernameRiskScore >= 10 ? 'somewhat risky' : 'mildly risky'
      details.penalties.push({ issue: `Username patterns (${riskLevel})`, deduction: Math.abs(usernamePenalty) })
    }

    // Domain is known free-mail provider - Updated tiered scoring
    const domainLower = domain.toLowerCase()

    // Tier 1: Premium - Gmail gets bonus, Outlook/iCloud get small bonus
    if (domainLower === 'gmail.com') {
      score = Math.min(100, score + 5)
      details.bonuses.push({ feature: 'Gmail (trusted provider)', bonus: 5 })
    } else if (domainLower === 'outlook.com' || domainLower === 'hotmail.com') {
      score = Math.min(100, score + 3)
      details.bonuses.push({ feature: 'Outlook (trusted provider)', bonus: 3 })
    } else if (domainLower === 'icloud.com') {
      score = Math.min(100, score + 2)
      details.bonuses.push({ feature: 'iCloud (trusted provider)', bonus: 2 })
    }
    // Tier 2: Medium-trust free providers
    else if (domainLower === 'yahoo.com') {
      score = Math.max(0, score + 2)
      details.bonuses.push({ feature: 'Yahoo (established provider)', bonus: 2 })
    }
    else if (domainLower === 'protonmail.com' || domainLower === 'mail.protonmail.com') {
      score = Math.max(0, score - 5)
      details.penalties.push({ issue: 'ProtonMail (privacy-focused, some risk)', deduction: 5 })
    }
    // Tier 3: Older/legacy providers
    else if (domainLower === 'aol.com') {
      score = Math.max(0, score - 7)
      details.penalties.push({ issue: 'AOL (legacy, inactive accounts)', deduction: 7 })
    }
    // Tier 4: Lower-trust providers
    else if (domainLower === 'zoho.com') {
      // Zoho is legitimate - no penalty
    }
    else if (domainLower === 'gmx.com') {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'GMX (lower reputation)', deduction: 10 })
    }
    else if (domainLower === 'mail.com') {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'Mail.com (lower reputation)', deduction: 10 })
    }
    else if (domainLower === 'yandex.com' || domainLower === 'yandex.ru') {
      score = Math.max(0, score - 7)
      details.penalties.push({ issue: 'Yandex (regional provider)', deduction: 7 })
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
      score = Math.max(0, score - 3)
      details.penalties.push({ issue: 'Subdomain-based email', deduction: 3 })
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
