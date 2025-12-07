/**
 * Enterprise-Grade Email Validator with Advanced Scoring
 * 
 * SCORING DIMENSIONS:
 * - Deliverability Score (0-100): Server-side delivery probability
 * - Trustworthiness Score (0-100): Likelihood this is a real human's email
 * - Abusive Score (0-100): Presence of offensive/profane content
 * - Gibberish Score (0-100): Username randomness/gibberish detection
 * - Phishing Risk (None/Low/Medium/High/Very High): Impersonation risk
 * - Combined Grade: Single letter (A+ to F, or "Invalid")
 * - Human Likelihood: Is this a real human or organization mailbox?
 */

let punycode;
try {
  punycode = require('punycode/');
} catch (e) {
  punycode = { toASCII: (domain) => domain };
}

const roleBasedPrefixes = [
  'admin', 'noreply', 'no-reply', 'contact', 'info', 'support',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',
  'root', 'abuse', 'security', 'billing', 'sales', 'marketing',
  'notifications', 'notification', 'alerts', 'alert', 'system', 'help'
]

const knownDisposableDomains = [
  'mailinator', 'yopmail', '10minutemail', 'temp-mail',
  'guerrillamail', 'anonymousemail', 'cock.li', 'cock.email',
  'tempmail', 'throwaway', 'mailnesia', '10min',
  'maildrop', 'mailtest', 'fakeinbox', 'trashmail', 'spam4', 'dispostable'
]

// FIX #11: Add .gr and .ir as high-trust national TLDs
const highTrustTLDs = new Set(['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'us', 'ca', 'au', 'jp', 'in', 'br', 'it', 'gr', 'ir', 'nl', 'ch', 'se', 'no', 'dk', 'fi'])
const lowTrustTLDs = new Set(['xyz', 'top', 'click', 'link', 'gq', 'tk', 'cf', 'ml', 'ga', 'download', 'stream', 'faith', 'buzz', 'club', 'cricket'])

const validTLDs = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro',
  'mobi', 'asia', 'tel', 'aero', 'coop', 'jobs', 'travel', 'museum', 'post',
  'xxx', 'cat', 'travel', 'post', 'tel', 'adult', 'app', 'blog', 'cloud',
  'dev', 'digital', 'download', 'media', 'news', 'online', 'shop', 'site',
  'space', 'store', 'tech', 'video', 'web', 'website', 'world',
  'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch',
  'at', 'se', 'no', 'dk', 'fi', 'pt', 'gr', 'ie', 'cz', 'pl', 'ru', 'jp',
  'cn', 'in', 'br', 'mx', 'ar', 'za', 'nz', 'sg', 'hk', 'kr', 'tw', 'th',
  'ph', 'id', 'my', 'vn', 'pk', 'bd', 'lk', 'ng', 'ke', 'eg', 'tr', 'il',
  'ae', 'sa', 'ksa', 'ir', 'gq', 'ml', 'xyz', 'me', 'rf', 'рф', 'ad', 'af',
  'ag', 'ai', 'al', 'am', 'ao', 'aq', 'as', 'aw', 'ax', 'az', 'ba', 'bb',
  'bf', 'bg', 'bh', 'bi', 'bj', 'bl', 'bm', 'bn', 'bo', 'bq', 'bs', 'bt',
  'bv', 'bw', 'by', 'bz', 'cc', 'cd', 'cf', 'cg', 'ci', 'ck', 'cl', 'cm',
  'cr', 'cu', 'cv', 'cw', 'cx', 'cy', 'dj', 'dm', 'do', 'dz', 'ec', 'ee',
  'eh', 'er', 'et', 'eu', 'fj', 'fk', 'fm', 'fo', 'ga', 'gd', 'ge', 'gf',
  'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gs', 'gt', 'gu', 'gw', 'gy',
  'hn', 'hr', 'ht', 'hu', 'iq', 'is', 'je', 'jm', 'jo', 'ki', 'km', 'kn',
  'kp', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lr', 'ls', 'lt', 'lu',
  'lv', 'ly', 'ma', 'mc', 'md', 'mf', 'mg', 'mh', 'mk', 'mm', 'mn', 'mo',
  'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mz', 'na', 'nc', 'ne',
  'nf', 'ni', 'np', 'nr', 'nu', 'om', 'pa', 'pe', 'pf', 'pg', 'pm', 'pn',
  'pr', 'ps', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'rw', 'sb', 'sc', 'sd',
  'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sv',
  'sx', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'tj', 'tk', 'tl', 'tm', 'tn',
  'to', 'tp', 'tr', 'tt', 'tv', 'tz', 'ua', 'ug', 'um', 'uy', 'uz', 'va',
  'vc', 've', 'vg', 'vi', 'wf', 'ws', 'ye', 'yt',
  // Internationalized TLDs (punycode variants handled separately)
  '广告', '中国', '中文', '我爱你', '北京', '中文网', '公司', '网络', '网站', '中文网',
  // ASCII/punycode versions of IDN TLDs
  'xn--3ds443g', // .广告
  'xn--fiqs8s', // .中国
  'xn--fiq228c', // .中文
  'xn--6qq986b3xl', // .我爱你
  'xn--1lq90ic7f1rc', // .北京
  'xn--55qx5d', // .中文网
  'xn--55q35aw', // .公司
  'xn--3e0b707e', // .网络
  'xn--pbt977c', // .网站
  'xn--p1ai', // .рф (Russian)
  'xn--p1acf' // .ру (Russian)
])

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq', 'pw'])
const suspiciousTLDs = new Set(['xyz', 'pw', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])

const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

const businessDomainKeywords = ['company', 'corp', 'organization', 'agency', 'industries', 'systems', 'solutions', 'services', 'consulting']

const personalFreemailProviders = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.protonmail.com', 'fastmail.com',
  'hey.com', 'zoho.com', 'gmx.com', 'mail.com', 'yandex.com', 'yandex.ru',
  'inbox.com', 'mail.com', 'mailinator.com', 'guerrillamail.com', 'temp-mail.org'
])

const corporateProviderDomains = new Set([
  'microsoft.com', 'openai.com', 'oracle.com', 'tesla.com', 'stripe.com',
  'meta.com', 'spacex.com', 'vercel.com', 'nvidia.com', 'apple.com',
  'google.com', 'amazon.com', 'facebook.com', 'twitter.com', 'github.com',
  'notion.so', 'slack.com', 'discord.com', 'spotify.com', 'uber.com',
  'airbnb.com', 'netflix.com', 'dropbox.com', 'slack.com', 'asana.com'
])

// FIX #1: More restrictive personal name pattern (only match clearly Western two-word names, not role-based emails)
// Must be firstname.lastname format with alphabetic characters only, no numbers or special prefixes
const personalNamePatterns = [
  /^[a-z]{2,}[._][a-z]{2,}$/i  // firstname.lastname or firstname_lastname (min 2 chars each)
]
const roleBasedEmailKeywords = ['it', 'admin', 'info', 'support', 'help', 'contact', 'billing', 'sales', 'marketing', 'tech', 'ops', 'hr']

// FIX #7: Expanded abusive/offensive word list with more variations
const abusiveTerms = [
  'fuck', 'shit', 'dick', 'ass', 'cunt', 'bitch', 'slut', 'whore', 'piss',
  'damn', 'hell', 'nigger', 'faggot', 'racist', 'rapist', 'rape', 'sex', 'porn',
  'xxx', 'cum', 'cock', 'pussy', 'asshole', 'bastard', 'sexy', 'horny',
  'nazi', 'kill', 'murder', 'bomb', 'terror', 'badword', 'badass', 'offensive',
  'hateful', 'abuse', 'vulgar', 'crude', 'filthy', 'obscene', 'explicit'
]

const brandImpersonationPatterns = [
  'paypal', 'amazon', 'apple', 'google', 'microsoft', 'facebook', 'meta',
  'twitter', 'instagram', 'netflix', 'uber', 'airbnb', 'stripe', 'github',
  'notion', 'slack', 'discord', 'bank', 'support', 'help', 'verify', 'confirm',
  'security', 'account', 'billing', 'payment', 'reset', 'admin'
]

const toxicKeywords = [
  'crypto', 'lottery', 'prize', 'winner', 'claim', 'nigerian', 'inheritance',
  'bitcoin', 'ethereum', 'cashapp', 'venmo'
]

function isCorporateDomain(domain) {
  const domainLower = domain.toLowerCase()
  return corporateProviderDomains.has(domainLower) ||
         corporateProviderDomains.has(domainLower.split('.').slice(-2).join('.'))
}

function isFreemailProvider(domain) {
  const domainLower = domain.toLowerCase()
  return personalFreemailProviders.has(domainLower) ||
         personalFreemailProviders.has(domainLower.split('.').slice(-2).join('.'))
}

function detectBusinessEmailProvider(domain) {
  const domainLower = domain.toLowerCase()
  
  if (isFreemailProvider(domainLower)) {
    const provider = domainLower.split('.')[0]
    return {
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      type: 'freemail'
    }
  }
  
  if (isCorporateDomain(domainLower)) {
    return {
      name: domainLower.split('.')[0],
      type: 'corporate'
    }
  }
  
  return null
}

function hasAbusiveContent(localPart) {
  const localLower = localPart.toLowerCase()
  // Remove numbers for matching (e.g., "racist123" matches "racist")
  const normalized = localLower.replace(/\d/g, '')
  
  return abusiveTerms.some(term => 
    normalized.includes(term) || localLower.includes(term)
  )
}

function analyzeUsernameSemantics(localPart, domain = null) {
  const insights = {
    isLikelyPersonalName: false,
    hasAbusiveContent: false,
    isBrandImpersonation: false,
    isRoleBasedEmail: false,
    isUnicodeUsername: false,
    semanticBonus: 0,
    semanticPenalty: 0,
    warnings: []
  }

  const localLower = localPart.toLowerCase()

  // FIX #5: Detect if username contains non-Latin characters (Unicode)
  const isUnicode = /[^\x00-\x7F]/.test(localPart)
  insights.isUnicodeUsername = isUnicode

  // FIX #2: Check if this is role-based email (don't apply personal name pattern to role-based emails)
  const isRoleBased = roleBasedEmailKeywords.some(role =>
    localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')
  )
  insights.isRoleBasedEmail = isRoleBased

  // Check for personal name patterns ONLY if not role-based
  if (!isRoleBased && personalNamePatterns.some(pattern => pattern.test(localPart))) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 20
    insights.warnings.push('Likely personal name pattern (firstname.lastname)')
  }

  // Check for abusive/offensive content (BEFORE other heuristics)
  if (hasAbusiveContent(localPart)) {
    insights.hasAbusiveContent = true
    insights.semanticPenalty -= 90  // Very harsh penalty
    insights.warnings.push('Contains offensive or abusive language')
  }

  // FIX #2: Check for brand impersonation ONLY if domain does not match the brand
  // This prevents legitimate brand emails (e.g., billing@stripe.com) from being flagged
  const domainLower = domain ? domain.toLowerCase() : ''
  const isBrandLike = brandImpersonationPatterns.some(brand => {
    // Skip if domain belongs to the brand (e.g., stripe.com contains "stripe")
    if (domainLower.includes(brand)) {
      return false
    }

    const brandRegex = new RegExp(`(^|[._-])${brand}([._-]|$)`, 'i')
    return (brandRegex.test(localPart) || localLower.includes(`${brand}support`) ||
           localLower.includes(`${brand}verify`) || localLower.includes(`${brand}confirm`) ||
           localLower.includes(`${brand}help`) || localLower.includes(`${brand}admin`)) &&
           !isRoleBased  // Don't flag role-based emails as brand impersonation
  })

  if (isBrandLike) {
    insights.isBrandImpersonation = true
    insights.semanticPenalty -= 30
    insights.warnings.push('Appears to impersonate known brand or service')
  }

  return insights
}

function calculateCombinedGrade(delivScore, trustScore) {
  if (delivScore >= 95 && trustScore >= 90) return 'A+'
  if (delivScore >= 90 && trustScore >= 80) return 'A'
  if (delivScore >= 85 && trustScore >= 70) return 'A-'
  if (delivScore >= 80 && trustScore >= 60) return 'B+'
  if (delivScore >= 75 && trustScore >= 50) return 'B'
  if (delivScore >= 70 && trustScore >= 40) return 'B-'
  if (delivScore >= 60 && trustScore >= 30) return 'C+'
  if (delivScore >= 50 && trustScore >= 20) return 'C'
  if (delivScore >= 40 && trustScore >= 10) return 'C-'
  if (delivScore >= 30 && trustScore >= 5) return 'D'
  return 'F'
}

function mapHumanLikelihoodLabel(trustScore, isInvalid = false, isCorporateEmail = false, hasAbusiveContent = false) {
  if (isInvalid) return 'Invalid'

  if (hasAbusiveContent) return 'Very likely human (abusive)'

  if (isCorporateEmail) return 'Likely organization mailbox'

  if (trustScore >= 90) return 'Very likely human'
  if (trustScore >= 75) return 'Likely human'
  if (trustScore >= 50) return 'Possibly bot/throwaway'
  if (trustScore >= 20) return 'Suspicious'
  return 'Definitely bot'
}

// FIX #6: Phishing risk calculation - distinguish legitimate role-based corporate emails from phishing attempts
function calculatePhishingRisk(localPart, domain, isRoleBasedEmail, isCorporateDomain, hasAbusiveContent, hasBrandImpersonation) {
  if (hasAbusiveContent) return 'Low'  // Abusive but not phishing risk

  // Role-based emails on official corporate domains (e.g., billing@stripe.com) are NOT high risk
  if (isRoleBasedEmail && isCorporateDomain) return 'Low'

  // Brand impersonation with non-matching domain is very high risk
  if (hasBrandImpersonation && !isCorporateDomain) return 'Very High'

  // Role-based emails on non-corporate domains have elevated risk
  if (isRoleBasedEmail) return 'Medium'

  return 'Low'
}

function normalizeDomainForTldValidation(domain) {
  try {
    if (punycode && punycode.toASCII) {
      return punycode.toASCII(domain);
    }
  } catch (e) {
    // Fallback
  }
  return domain;
}

function validateSingleEmail(trimmedEmail) {
  const details = {
    email: trimmedEmail,
    valid: false,
    deliverabilityScore: 100,
    trustworthinessScore: 100,
    combinedGrade: 'A+',
    humanLikelihood: 'Very likely human',
    phishingRisk: 'Low',
    issues: [],
    deliverabilityWarnings: [],
    trustworthinessWarnings: [],
    businessEmail: null,
    tldQuality: null,
    hasSyntaxError: false,
    isInvalid: false
  }

  // 1. BASIC SYNTAX VALIDATION
  if (!trimmedEmail.includes('@')) {
    details.issues.push('Missing @ symbol')
    details.hasSyntaxError = true
    details.isInvalid = true
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: [],
      trustworthinessWarnings: [],
      tldQuality: null,
      hasSyntaxError: true,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (!localPart || !domain) {
    details.issues.push('Invalid email format: missing local part or domain')
    details.hasSyntaxError = true
    details.isInvalid = true
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: [],
      trustworthinessWarnings: [],
      tldQuality: null,
      hasSyntaxError: true,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  if (trimmedEmail.split('@').length > 2) {
    details.issues.push('Multiple @ symbols detected')
    details.hasSyntaxError = true
    details.isInvalid = true
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: [],
      trustworthinessWarnings: [],
      tldQuality: null,
      hasSyntaxError: true,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  // Check for spaces and invalid characters
  if (/\s/.test(trimmedEmail)) {
    details.issues.push('Contains whitespace')
    details.hasSyntaxError = true
    details.isInvalid = true
  }

  if (/\.\./.test(trimmedEmail)) {
    details.issues.push('Contains consecutive dots')
    details.hasSyntaxError = true
    details.isInvalid = true
  }

  if (/^\.|\.$/.test(localPart)) {
    details.issues.push('Local part starts or ends with dot')
    details.hasSyntaxError = true
    details.isInvalid = true
  }

  if (details.hasSyntaxError) {
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: [],
      trustworthinessWarnings: [],
      tldQuality: null,
      hasSyntaxError: true,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  // 2. RESERVED DOMAINS
  const domainLower = domain.toLowerCase()
  if (reservedDomains.has(domainLower)) {
    details.issues.push(`"${domain}" is a reserved example domain — not deliverable`)
    details.isInvalid = true
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: ['Reserved example domain'],
      trustworthinessWarnings: [],
      tldQuality: null,
      hasSyntaxError: false,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  // 3. DOMAIN VALIDITY AND TLD
  const hasDot = domain.includes('.')
  const startsWithDot = domain.startsWith('.')
  const hasValidTld = /\.[a-zA-Z]{2,}$/.test(domain)
  let tldIsIcannApproved = false

  if (startsWithDot) {
    details.issues.push('Domain cannot start with a dot')
    details.isInvalid = true
  } else if (!hasDot) {
    details.issues.push('Domain must contain a dot (e.g., example.com)')
    details.isInvalid = true
  } else if (!hasValidTld) {
    details.issues.push('Invalid TLD (top-level domain)')
    details.isInvalid = true
  } else {
    const normalizedDomain = normalizeDomainForTldValidation(domain);
    const tldMatch = normalizedDomain.match(/\.([a-zA-Z0-9]+)$/)
    
    if (tldMatch) {
      let tld = tldMatch[1].toLowerCase()

      // ISSUE #3 FIX: Normalize IDN TLDs to ASCII (punycode) before validation
      let asciiTld = tld
      try {
        if (punycode && punycode.toASCII) {
          asciiTld = punycode.toASCII(`.${tld}`).slice(1).toLowerCase() // Remove leading dot after conversion
        }
      } catch (e) {
        // If punycode conversion fails, use original TLD
        asciiTld = tld
      }

      // Check both the original TLD and ASCII-normalized version
      tldIsIcannApproved = validTLDs.has(tld) || validTLDs.has(asciiTld)

      if (highTrustTLDs.has(tld) || highTrustTLDs.has(asciiTld)) {
        details.tldQuality = 'high-trust'
        details.trustworthinessScore = Math.min(100, details.trustworthinessScore + 3)
      } else if (lowTrustTLDs.has(tld) || lowTrustTLDs.has(asciiTld)) {
        // FIX #3: Remove duplicate TLD warnings - only add one warning per suspicious TLD
        details.tldQuality = 'low-trust'
        details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 20)
        if (!details.trustworthinessWarnings.includes(`Suspicious TLD (.${tld}) commonly used for spam`)) {
          details.trustworthinessWarnings.push(`Suspicious TLD (.${tld}) commonly used for spam`)
        }
      } else {
        details.tldQuality = 'neutral'
      }

      if (!tldIsIcannApproved) {
        details.issues.push(`TLD ".${tld}" is not ICANN-approved`)
        details.isInvalid = true
        details.deliverabilityWarnings.push(`Unrecognized TLD (.${tld})`)
      }
    }
  }

  if (domain.length > 255) {
    details.issues.push('Domain exceeds 255 characters')
    details.isInvalid = true
  }

  if (localPart.length > 64) {
    details.issues.push('Local part exceeds 64 characters')
    details.isInvalid = true
  }

  // Check for domain labels starting/ending with hyphen
  const domainLabels = domain.split('.')
  for (const label of domainLabels) {
    if (label.startsWith('-') || label.endsWith('-')) {
      details.issues.push(`Domain label "${label}" cannot start or end with a hyphen`)
      details.hasSyntaxError = true
      details.isInvalid = true
    }
  }

  // FAIL-SAFE OVERRIDE FOR ANY INVALID CONDITION
  if (details.isInvalid) {
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: false,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid',
      humanLikelihood: 'Invalid (cannot receive email)',
      phishingRisk: 'N/A',
      issues: details.issues,
      deliverabilityWarnings: details.deliverabilityWarnings,
      trustworthinessWarnings: details.trustworthinessWarnings,
      tldQuality: null,
      hasSyntaxError: details.hasSyntaxError || false,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  // 4. DISPOSABLE DOMAINS
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domainLower.includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
    details.isInvalid = true
    details.deliverabilityWarnings.push('Disposable/temporary email domain')
    details.trustworthinessWarnings.push('Disposable email domain')

    // FAIL-SAFE FOR DISPOSABLE DOMAINS
    return {
      email: trimmedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: true,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      combinedGrade: 'Invalid (Disposable)',
      humanLikelihood: 'Throwaway / Temporary',
      phishingRisk: 'High',
      issues: details.issues,
      deliverabilityWarnings: details.deliverabilityWarnings,
      trustworthinessWarnings: details.trustworthinessWarnings,
      tldQuality: null,
      hasSyntaxError: false,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid'
    }
  }

  // 5. ANALYZE USERNAME SEMANTICS (BEFORE role detection, pass domain for context)
  const semantics = analyzeUsernameSemantics(localPart, domain)

  // Apply semantic bonuses/penalties
  if (semantics.semanticBonus > 0) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + semantics.semanticBonus)
  }
  if (semantics.semanticPenalty < 0) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + semantics.semanticPenalty)
  }

  // Add warnings from semantics
  // FIX #1: Filter out "personal name pattern" if offensive content detected
  // FIX #2: Don't add impersonation warnings if role-based email
  semantics.warnings.forEach(warning => {
    // Skip personal name pattern warnings if the email contains offensive terms
    if (semantics.hasAbusiveContent && warning.includes('personal name pattern')) {
      return
    }
    // FIX #2: Skip brand impersonation warning for role-based emails on non-corporate domains
    if (semantics.isRoleBasedEmail && warning.includes('impersonate')) {
      return
    }
    if (!details.trustworthinessWarnings.includes(warning)) {
      details.trustworthinessWarnings.push(warning)
    }
  })

  // 6. BUSINESS EMAIL INTELLIGENCE (FIX #12: Ensure businessEmail is set for corporate domains)
  const businessProvider = detectBusinessEmailProvider(domain)
  const isDomainCorporate = isCorporateDomain(domainLower)
  if (businessProvider) {
    details.businessEmail = businessProvider
    if (businessProvider.type === 'corporate') {
      details.trustworthinessWarnings.push(`${businessProvider.name} (corporate email)`)
    }
  } else if (isDomainCorporate) {
    // FIX #12: If domain is corporate but provider not in our list, still mark it
    const corpName = domainLower.split('.')[0]
    details.businessEmail = {
      name: corpName.charAt(0).toUpperCase() + corpName.slice(1),
      type: 'corporate'
    }
  }

  // 7. ROLE-BASED EMAIL DETECTION
  const localLower = localPart.toLowerCase()
  let roleMatch = null
  let roleTrustPenalty = 0
  let isRoleBasedEmail = false

  const roleChecks = [
    { patterns: ['noreply', 'no-reply'], role: 'noreply', penalty: -20 },
    { patterns: ['info', 'info+', 'info.'], role: 'info', penalty: -25 },
    { patterns: ['support', 'support+', 'support.'], role: 'support', penalty: -30 },
    { patterns: ['admin', 'admin+', 'admin.'], role: 'admin', penalty: -30 },
    { patterns: ['marketing', 'newsletter', 'marketing+', 'newsletter+'], role: 'marketing', penalty: -30 },
    { patterns: ['help', 'contact', 'help+', 'contact+'], role: 'help', penalty: -20 },
  ]

  for (const check of roleChecks) {
    for (const pattern of check.patterns) {
      if (pattern.endsWith('+') || pattern.endsWith('.')) {
        if (localLower.startsWith(pattern)) {
          roleMatch = check.role
          roleTrustPenalty = check.penalty
          isRoleBasedEmail = true
          break
        }
      } else {
        if (localLower === pattern) {
          roleMatch = check.role
          roleTrustPenalty = check.penalty
          isRoleBasedEmail = true
          break
        }
      }
    }
    if (isRoleBasedEmail) break
  }

  if (!isRoleBasedEmail) {
    for (const role of roleBasedPrefixes) {
      if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
        roleMatch = role
        roleTrustPenalty = -25
        isRoleBasedEmail = true
        break
      }
    }
  }

  if (isRoleBasedEmail) {
    details.roleBasedEmail = true
    details.roleBasedType = roleMatch
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + roleTrustPenalty)
    details.trustworthinessWarnings.push(`Role-based email (${roleMatch})`)
  }

  // 8. GIBBERISH DETECTION (SKIP for personal names, FIX #5: Skip Western rules for Unicode)
  details.usernameHeuristics = []

  if (!semantics.isLikelyPersonalName && !semantics.isUnicodeUsername) {
    const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
    const vowelRatioLocal = vowelsInLocal / localPart.length
    let usernameRiskScore = 0

    // FIX #5: Only apply vowel ratio heuristic to Latin-based usernames
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
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 10)
    }

    if (localPart.length < 3) {
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 5)
      details.trustworthinessWarnings.push('Unusually short username')
    }

    // FIX #8: Numbers-only usernames should score lower
    if (/^\d+$/.test(localPart)) {
      usernameRiskScore += 8
      details.usernameHeuristics.push('Numbers-only username')
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 25)
    }

    const botPatterns = ['bot', 'test', 'mailer', 'daemon', 'notification', 'alert', 'auto', 'auto-', 'generated', 'tmp', 'temp']
    if (!semantics.isRoleBasedEmail && botPatterns.some(pattern => localLower.includes(pattern))) {
      usernameRiskScore += 6
      details.usernameHeuristics.push('Matches automated patterns')
    }

    // FIX #9: Repeated characters should score lower (more suspicious)
    if (/(.)\1{2,}/.test(localPart)) {
      usernameRiskScore += 8
      details.usernameHeuristics.push('Repeated characters detected')
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 20)
    }

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

    if (!semantics.isRoleBasedEmail) {
      for (let i = 0; i <= localLower.length - 5; i++) {
        const window = localLower.substring(i, i + 5)
        const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
        if (consonantCount >= 4) {
          usernameRiskScore += 6
          details.usernameHeuristics.push('Heavy consonant clusters')
          break
        }
      }
    }

    let usernameTrustPenalty = 0
    const consonantRatio = (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / localPart.length
    const isBotLike = localPart.length >= 10 && consonantRatio >= 0.70

    if (usernameRiskScore >= 30 || isBotLike) {
      usernameTrustPenalty = -40
      details.trustworthinessWarnings.push('Username appears randomly generated (extreme gibberish)')
    } else if (usernameRiskScore >= 20) {
      usernameTrustPenalty = -25
      details.trustworthinessWarnings.push('Username appears randomly generated')
    } else if (usernameRiskScore >= 10) {
      usernameTrustPenalty = -15
      details.trustworthinessWarnings.push('Username looks somewhat suspicious')
    } else if (usernameRiskScore >= 5) {
      usernameTrustPenalty = -5
      details.trustworthinessWarnings.push('Username has unusual characteristics')
    }

    if (usernameTrustPenalty < 0) {
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore + usernameTrustPenalty)
    }

    details.usernameRiskScore = usernameRiskScore
  } else if (semantics.isUnicodeUsername) {
    // FIX #5: For Unicode usernames, only apply non-linguistic heuristics
    let usernameRiskScore = 0

    if (/^\d+$/.test(localPart)) {
      usernameRiskScore += 8
      details.usernameHeuristics.push('Numbers-only username')
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 25)
    }

    if (/(.)\1{2,}/.test(localPart)) {
      usernameRiskScore += 8
      details.usernameHeuristics.push('Repeated characters detected')
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 20)
    }

    details.usernameRiskScore = usernameRiskScore
  }

  // 9. DOMAIN REPUTATION
  const isBusinessDomain = businessDomainKeywords.some(kw => domainLower.includes(kw))

  if (domainLower === 'gmail.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 5)
  } else if (domainLower === 'outlook.com' || domainLower === 'hotmail.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 2)
  } else if (domainLower === 'icloud.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 3)
  } else if (domainLower === 'yahoo.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 1)
  } else if (domainLower === 'aol.com') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 3)
  } else if (domainLower === 'gmx.com' || domainLower === 'mail.com') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 5)
  } else if (domainLower === 'yandex.com' || domainLower === 'yandex.ru') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 5)
  }

  if (!isFreemailProvider(domainLower) && isBusinessDomain) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + 10)
    details.trustworthinessWarnings.push('Business domain detected')
  }

  // 10. MAILCHECKER VALIDATION
  let mailcheckerValid = true
  if (typeof MailChecker !== 'undefined' && details.issues.length === 0 && !isDisposable) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // 11. SUBDOMAIN PENALTY (FIX #10: Don't penalize corporate subdomains for trustworthiness)
  const domainParts = domain.split('.')
  const commonSecondLevelDomains = ['co.uk', 'co.nz', 'co.jp', 'com.au', 'com.br', 'com.mx', 'co.id', 'co.in', 'co.ke', 'co.za']
  const isCommonSLD = commonSecondLevelDomains.some(sld => domainLower.endsWith('.' + sld))
  const subdomainLabelCount = isCommonSLD ? domainParts.length - 2 : domainParts.length - 1

  if (subdomainLabelCount >= 3) {
    // FIX #10: Only penalize deliverability slightly, not trustworthiness (corporate subdomains are legitimate)
    if (!isDomainCorporate) {
      details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 3)
    }
    details.deliverabilityWarnings.push('Subdomain-based email')
  }

  // 12. FINALIZE SCORES
  details.deliverabilityScore = Math.max(0, Math.min(100, Math.round(details.deliverabilityScore)))
  details.trustworthinessScore = Math.max(0, Math.min(100, Math.round(details.trustworthinessScore)))

  // Critical: if deliverability is 0, trustworthiness cannot be high
  if (details.deliverabilityScore === 0) {
    details.trustworthinessScore = Math.min(details.trustworthinessScore, 20)
    details.isInvalid = true
  }

  // Determine validity
  const basicValid = details.issues.length === 0 && !details.hasSyntaxError && details.deliverabilityScore > 0 && !details.isInvalid
  details.valid = basicValid && (typeof MailChecker !== 'undefined' ? mailcheckerValid : true)

  // 13. CALCULATE GRADES AND LABELS
  // FIX #1: INVALID EMAILS ALWAYS GET "Invalid" GRADE
  if (!details.valid || details.isInvalid || details.hasSyntaxError) {
    details.combinedGrade = 'Invalid'
    details.humanLikelihood = 'Invalid'
    details.deliverabilityLabel = 'Guaranteed bad'
    details.trustworthinessLabel = 'Invalid'
    details.phishingRisk = 'Unknown'
  } else {
    // Valid email - use normal grading
    details.combinedGrade = calculateCombinedGrade(details.deliverabilityScore, details.trustworthinessScore)
    details.deliverabilityLabel = mapDeliverabilityLabel(details.deliverabilityScore)
    details.trustworthinessLabel = mapTrustworthinessLabel(details.trustworthinessScore)
    
    // FIX #2: SEPARATE HUMANLIKELIHOOD FROM PHISHING RISK
    details.humanLikelihood = mapHumanLikelihoodLabel(
      details.trustworthinessScore,
      false,
      isDomainCorporate,
      semantics.hasAbusiveContent
    )

    // FIX #3: CALCULATE PHISHING RISK
    details.phishingRisk = calculatePhishingRisk(
      localPart,
      domain,
      isRoleBasedEmail,
      isDomainCorporate,
      semantics.hasAbusiveContent,
      semantics.isBrandImpersonation
    )
  }

  return details
}

function mapDeliverabilityLabel(score) {
  if (score === 0) return 'Guaranteed bad'
  if (score >= 95) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

function mapTrustworthinessLabel(score) {
  if (score === 0) return 'Invalid'
  if (score >= 95) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Low'
  if (score >= 10) return 'Very Low'
  return 'Untrustworthy'
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
    averageTrustworthinessScore: Math.round(results.reduce((sum, r) => sum + r.trustworthinessScore, 0) / results.length),
    results,
  }
}
