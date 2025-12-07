/**
 * Enterprise-Grade Email Validator with Advanced Scoring
 *
 * SCORING DIMENSIONS:
 * - Deliverability Score (0-100): Server-side delivery probability
 * - Trustworthiness Score (0-100): Likelihood this is a real human/legit mailbox
 * - Abusive Score (0-100): Presence of offensive/profane content
 * - Gibberish Score (0-100): Username randomness/gibberish detection
 * - Phishing Risk (None/Low/Medium/High/Very High): Impersonation risk
 * - Combined Grade: Single letter (A+ to F, or "Invalid")
 * - Human Likelihood: Is this a real human or organization mailbox?
 */

let punycode
try {
  punycode = require('punycode/')
} catch (e) {
  punycode = { toASCII: (domain) => domain }
}

let MailChecker
try {
  MailChecker = require('mailchecker')
} catch (e) {
  MailChecker = undefined
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

// High/low trust TLDs
const highTrustTLDs = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'us', 'ca',
  'au', 'jp', 'in', 'br', 'it', 'gr', 'ir', 'nl', 'ch', 'se', 'no', 'dk', 'fi'
])

const lowTrustTLDs = new Set([
  'xyz', 'top', 'click', 'link', 'gq', 'tk', 'cf', 'ml', 'ga',
  'download', 'stream', 'faith', 'buzz', 'club', 'cricket'
])

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
  // IDN
  '广告', '中国', '中文', '我爱你', '北京', '中文网', '公司', '网络', '网站', '中文网',
  // ASCII/punycode versions of IDN TLDs
  'xn--3ds443g', // .广告
  'xn--fiqs8s',  // .中国
  'xn--fiq228c', // .中文
  'xn--6qq986b3xl', // .我爱你
  'xn--1lq90ic7f1rc', // .北京
  'xn--55qx5d',  // .中文网
  'xn--55q35aw', // .公司
  'xn--3e0b707e', // .网络
  'xn--pbt977c', // .网站
  'xn--p1ai',    // .рф
  'xn--p1acf'    // .ру
])

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq', 'pw'])
const suspiciousTLDs = new Set(['xyz', 'pw', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])

const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

// Business domain keywords (root-level only)
const businessDomainKeywords = [
  'company', 'corp', 'organization', 'agency', 'industries', 'systems', 'solutions',
  'services', 'consulting', 'business', 'enterprise', 'global', 'international',
  'financial', 'technology', 'digital', 'ventures', 'partners', 'group', 'holding',
  'labs', 'research', 'development', 'innovation', 'ventures', 'capital', 'fund',
  'studio', 'collective', 'network', 'alliance', 'consortium', 'cooperative',
  'corporation', 'incorporated', 'limited', 'partnership', 'llc', 'gmbh', 'ag',
  'pty', 'nv', 'bv', 'sa', 'srl', 'sas', 'kft', 'spzoo', 'ooo'
]

// Freemail providers
const personalFreemailProviders = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'mail.protonmail.com', 'pm.me',
  'tutanota.com', 'mailbox.org', 'fastmail.com', 'hey.com',
  'yandex.com', 'yandex.ru', 'mail.ru', 'rambler.ru',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
  'daum.net', 'naver.com', 'hanmail.net',
  'aol.com', 'gmx.com', 'gmx.de', 'mail.com', 'zoho.com',
  'inbox.com', 'mail.inbox.com', 'web.de', 'freenet.de',
  'laposte.net', 'wanadoo.fr', 'free.fr', 'sfr.fr',
  'student.com', 'university.ac', 'edu.au', 'ac.uk',
  'tempmail.com', 'temp-mail.org', 'mailinator.com', 'yopmail.com',
  'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'pobox.com', 'mailanator.com', 'sharklasers.com', 'cock.li', 'cock.email',
  'getmail.com', 'emailnow.net', 'list.ru'
])

// Corporate provider domains (exact or single-subdomain)
const corporateProviderDomains = new Set([
  'microsoft.com', 'apple.com', 'google.com', 'amazon.com', 'meta.com', 'facebook.com',
  'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com',
  'ibm.com', 'oracle.com', 'vmware.com', 'salesforce.com', 'adobe.com',
  'openai.com', 'anthropic.com', 'deepmind.google.com', 'stability.ai',
  'huggingface.co', 'cohere.com', 'together.ai',
  'stripe.com', 'paypal.com', 'square.com', 'shopify.com', 'bankofamerica.com',
  'bofa.com', 'chase.com', 'citi.com', 'wellsfargo.com', 'capitalone.com',
  'coinbase.com', 'kraken.com', 'gemini.com', 'opensea.io', 'uniswap.org',
  'twitter.com', 'x.com', 'threads.com', 'slack.com', 'discord.com',
  'telegram.org', 'whatsapp.com', 'instagram.com', 'tiktok.com', 'snapchat.com',
  'reddit.com', 'quora.com',
  'netflix.com', 'youtube.com', 'hulu.com', 'disneyplus.com', 'primevideo.com',
  'twitch.tv', 'vimeo.com',
  'dropbox.com', 'box.com', 'onedrive.com', 'notion.so', 'asana.com', 'monday.com',
  'trello.com', 'jira.atlassian.com', 'confluence.atlassian.com',
  'github.com', 'gitlab.com', 'bitbucket.org', 'vercel.com', 'netlify.com',
  'heroku.com', 'digitalocean.com', 'aws.com',
  'etsy.com', 'ebay.com', 'wix.com',
  'uber.com', 'lyft.com', 'airbnb.com', 'booking.com', 'expedia.com',
  'hotels.com', 'tripadvisor.com',
  'spotify.com', 'warnerbros.com', 'sony.com',
  'coursera.org', 'udemy.com', 'edx.org', 'skillshare.com', 'linkedin.com',
  'nvidia.com', 'amd.com', 'intel.com', 'nintendo.com', 'valve.com', 'epicgames.com',
  'roblox.com'
])

// firstname.lastname pattern
const personalNamePatterns = [
  /^[a-z]{2,}[._][a-z]{2,}$/i
]

const roleBasedEmailKeywords = [
  'admin', 'administrator', 'admins', 'sysadmin', 'superuser', 'root',
  'support', 'help', 'helpdesk', 'support-team', 'customer-support',
  'customer-service', 'service', 'assistance', 'care',
  'sales', 'sales-team', 'business', 'bd', 'partnerships', 'partner',
  'account-manager', 'account-team', 'enterprise', 'reseller',
  'marketing', 'marketing-team', 'marcom', 'communications', 'comms', 'pr',
  'press', 'media', 'advertising', 'ads', 'brand',
  'it', 'tech', 'tech-team', 'technical', 'it-support', 'infrastructure',
  'devops', 'platform', 'operations', 'ops', 'sre',
  'hr', 'human-resources', 'hr-team', 'recruiting', 'recruiter', 'talent',
  'people', 'payroll', 'benefits', 'careers',
  'finance', 'accounting', 'accounting-team', 'accounts', 'billing',
  'invoice', 'payment', 'revenue',
  'legal', 'legal-team', 'compliance', 'privacy', 'security',
  'product', 'product-team', 'engineering', 'eng', 'dev', 'qa',
  'data', 'analytics', 'bi', 'insights', 'metrics',
  'operations', 'ops', 'management', 'leadership', 'exec',
  'contact', 'info', 'information', 'inquiry', 'feedback', 'newsletter',
  'notifications', 'notification', 'alerts', 'alert', 'noreply', 'no-reply',
  'donotreply', 'system', 'systems', 'status',
  'abuse', 'trust-safety', 'fraud', 'phishing',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',
  'events', 'community', 'devrel', 'hello', 'team', 'office', 'reception'
]

// Hateful / slur terms (maximum penalty 80-100)
const hatefulTerms = [
  'faggot', 'dyke', 'tranny', 'retard', 'tard', 'nigger', 'nword',
  'kike', 'spic', 'chink', 'dago', 'cracker', 'honkey',
  'nazi', 'rapist', 'rape', 'rapey',
  'terrorist', 'genocide'
]

// Abusive / hostile terms (medium penalty 40-70)
const abusiveTerms = [
  'fuck', 'shit', 'cunt', 'asshole', 'bastard', 'motherfucker',
  'slut', 'whore', 'bitch'
]

// Adult / NSFW terms (small penalty 10-30)
const nsfwTerms = [
  'porn', 'porno', 'xxx', 'hentai', 'yuri', 'yaoi', 'erotica',
  'erotic', 'sex', 'sexual', 'cam', 'webcam', 'onlyfans',
  'nude', 'naked', 'sexy', 'horny'
]

// Slang whitelist (internet/non-gibberish)
const slangWhitelist = new Set([
  'af', 'based', 'copypasta', 'cringe', 'derp', 'epic',
  'fail', 'fomo', 'geez', 'giga', 'gigachad',
  'idk', 'idc', 'imo', 'imho', 'irl', 'jk', 'lfg',
  'lol', 'lmao', 'lmfao', 'rofl', 'kek', 'kekw',
  'pog', 'poggers', 'pepe', 'sus', 'yeet', 'yolo',
  'badass', 'dumbass', 'smartass', 'jackass', 'pissed', 'salty',
  'thicc', 'chonky', 'snacc', 'vibe', 'vibes', 'mood',
  'noob', 'n00b', 'pwn', 'pwned', 'gg', 'ggwp', 'meta',
  'nerf', 'buff', 'loot', 'grind', 'toxic', 'camping',
  'devops', 'devrel', 'frontend', 'backend', 'fullstack',
  'hacker', 'coder', 'debug', 'api', 'cli',
  'podcast', 'vlogger', 'blogger', 'youtuber',
  'fitness', 'gymrat',
  'gonna', 'gotta', 'wanna', 'kinda', 'sorta', 'dunno',
  'lemme', 'gimme', 'ain\'t', 'prolly', 'tryna',
  'foodie', 'coffee', 'latte', 'brunch',
  'dope', 'cool', 'awesome', 'rad', 'fire', 'lit',
  'vibing', 'chill', 'hype', 'goated',
  'omg', 'wtf', 'brb', 'np', 'ffs', 'smh', 'ngl', 'fr', 'tfw',
  'uwu', 'owo', 'lil', 'boi', 'doggo', 'pupper', 'heckin', 'floof',
  'heck', 'whoops', 'yikes', 'oop', 'welp', 'bruh'
])

// Keyboard walks
const keyboardWalks = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl',
  'zxcvbn', 'zxcvbnm', 'poiuyt', 'lkjhgf', 'mnbvcx', 'qazwsx'
]

const negativeAdultTerms = ['nasty', 'dirty', 'kinky', 'fetish', 'slut', 'whore', 'escort', 'xxx', 'porn', 'explicit', 'nsfw', 'horny', 'sexy']

const adultTerms = [
  'nsfw', 'sfw', 'adult', 'mature', 'porn', 'pornography', 'porno',
  'xxx', 'hentai', 'yuri', 'yaoi', 'erotic',
  'erotica', 'explicit', 'sex', 'sexual', 'sexy', 'horny', 'nude',
  'naked', 'cam', 'webcam', 'onlyfans', 'fetish', 'bdsm',
  'dating', 'hookup', 'escort'
]

// Brand impersonation patterns
const brandImpersonationPatterns = [
  'apple', 'microsoft', 'google', 'amazon', 'meta', 'facebook', 'intel', 'nvidia',
  'amd', 'ibm', 'oracle', 'salesforce', 'adobe',
  'twitter', 'x', 'instagram', 'tiktok', 'snapchat', 'linkedin',
  'whatsapp', 'telegram', 'discord', 'slack', 'zoom',
  'netflix', 'spotify', 'hulu', 'disney', 'youtube', 'twitch',
  'paypal', 'stripe', 'chase', 'wellsfargo', 'bankofamerica',
  'bofa', 'citi', 'capitalone', 'visa', 'mastercard',
  'coinbase', 'kraken', 'gemini', 'binance',
  'uber', 'lyft', 'airbnb', 'booking', 'expedia', 'hotels',
  'amazon', 'ebay', 'etsy', 'wayfair', 'ikea', 'costco',
  'walmart', 'target', 'bestbuy', 'newegg',
  'github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'heroku',
  'aws', 'azure', 'gcp',
  'notion', 'asana', 'trello', 'monday', 'dropbox', 'onedrive'
]

const standardSystemEmails = new Set(['postmaster', 'abuse', 'webmaster', 'root', 'noreply', 'no-reply', 'mailer-daemon'])
const systemMailboxesCapped = new Set(['postmaster', 'abuse'])

const toxicKeywords = [
  'romance', 'dating', 'inheritance', 'lottery', 'prize', 'winnings',
  'crypto', 'bitcoin', 'wallet', 'private-key', 'seed-phrase',
  'verify-account', 'confirm-identity', 'update-payment', 'suspended-account',
  'limited-account', 'unusual-activity', 'security-alert', 'urgent-action',
  'virus', 'malware', 'infected', 'compromised', 'hacked',
  'refund', 'rebate', 'cashback', 'voucher',
  'free-money', 'risk-free', 'no-credit-check', 'guaranteed-approval'
]

// Freemail / corporate helpers
function isCorporateDomain(domain) {
  const lower = domain.toLowerCase()

  if (corporateProviderDomains.has(lower)) return true

  const parts = lower.split('.')
  if (parts.length === 3) {
    const base = parts.slice(-2).join('.')
    return corporateProviderDomains.has(base)
  }

  return false
}

function isFreemailProvider(domain) {
  const domainLower = domain.toLowerCase()
  return (
    personalFreemailProviders.has(domainLower) ||
    personalFreemailProviders.has(domainLower.split('.').slice(-2).join('.'))
  )
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

// Abusive content
// Detect content severity level (returns object with penalty tiers)
function detectContentSeverity(localPart) {
  const localLower = localPart.toLowerCase()

  if (standardSystemEmails.has(localLower)) {
    return { isHateful: false, isAbusive: false, isNsfw: false }
  }

  // Don't penalize slang whitelist (it just bypasses gibberish detection)
  const normalized = localLower.replace(/\d/g, '')

  return {
    isHateful: hatefulTerms.some(term => normalized.includes(term) || localLower.includes(term)),
    isAbusive: abusiveTerms.some(term => normalized.includes(term) || localLower.includes(term)),
    isNsfw: nsfwTerms.some(term => normalized.includes(term) || localLower.includes(term))
  }
}

function hasAbusiveContent(localPart) {
  const severity = detectContentSeverity(localPart)
  return severity.isHateful || severity.isAbusive || severity.isNsfw
}

// Adult / negative themes (for backward compatibility)
function hasAdultOrNegativeThemes(localPart) {
  const localLower = localPart.toLowerCase()
  if (standardSystemEmails.has(localLower)) return false
  return negativeAdultTerms.some(term => localLower.includes(term))
}

// Username semantics (no heavy gibberish logic here)
function analyzeUsernameSemantics(localPart, domain = null) {
  const insights = {
    isLikelyPersonalName: false,
    hasAbusiveContent: false,
    contentSeverity: { isHateful: false, isAbusive: false, isNsfw: false },
    hasNegativeAdultThemes: false,
    hasAdultContent: false,
    isBrandImpersonation: false,
    isBrandImpersonationStrong: false,
    isRoleBasedEmail: false,
    isUnicodeUsername: false,
    isStandardSystemEmail: false,
    semanticBonus: 0,
    semanticPenalty: 0,
    warnings: []
  }

  const localLower = localPart.toLowerCase()
  const isUnicode = /[^\x00-\x7F]/.test(localPart)
  insights.isUnicodeUsername = isUnicode

  // Option B1: Skip role-based email detection for Unicode (only ASCII matches)
  const isRoleBased = !isUnicode && roleBasedEmailKeywords.some(role =>
    localLower === role ||
    localLower.startsWith(role + '+') ||
    localLower.startsWith(role + '.')
  )
  insights.isRoleBasedEmail = isRoleBased

  insights.isStandardSystemEmail = standardSystemEmails.has(localLower)

  // Option B1: Skip ASCII-only semantics for Unicode usernames
  if (!isUnicode && !isRoleBased && personalNamePatterns.some(pattern => pattern.test(localPart))) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 20
    insights.warnings.push('Likely personal name pattern (firstname.lastname)')
  }

  // Detect content severity
  const severity = detectContentSeverity(localPart)
  insights.contentSeverity = severity
  insights.hasAbusiveContent = severity.isHateful || severity.isAbusive || severity.isNsfw

  // Apply penalty based on severity
  if (severity.isHateful) {
    insights.semanticPenalty -= 90 // Maximum penalty for hate speech
    insights.warnings.push('Contains hateful or slur language')
  } else if (severity.isAbusive) {
    insights.semanticPenalty -= 50 // Medium penalty for abusive language
    insights.warnings.push('Contains abusive or hostile language')
  } else if (severity.isNsfw) {
    insights.semanticPenalty -= 15 // Small penalty for NSFW/adult content
    insights.warnings.push('Contains adult or explicit content')
  }

  if (!insights.hasAbusiveContent && hasAdultOrNegativeThemes(localPart)) {
    insights.hasNegativeAdultThemes = true
    // penalty applied later once we know gibberish score
  }

  if (!insights.hasAbusiveContent) {
    const lower = localLower
    const hasAdult = adultTerms.some(term => lower.includes(term))
    if (hasAdult && !insights.hasNegativeAdultThemes) {
      insights.hasAdultContent = true
    }
  }

  // Brand impersonation
  const domainLower = domain ? domain.toLowerCase() : ''
  const strongBrandPatterns = [
    /[a-z]*paypal[a-z.]+billing/i,
    /[a-z]*paypal[a-z.]+center/i,
    /[a-z]*amazon[a-z.]+security/i,
    /[a-z]*apple[a-z.]+support/i,
    /[a-z]*google[a-z.]+account/i,
    /[a-z]*microsoft[a-z.]+verify/i,
    /bankofamerica[a-z.]+/i,
    /bank[a-z]*-[a-z]*security/i,
    /[a-z]+-security-[a-z]+/i,
    /security-[a-z]*-team/i
  ]

  const isStrongBrandImpersonation = strongBrandPatterns.some(pattern => pattern.test(localPart))
  if (isStrongBrandImpersonation) insights.isBrandImpersonationStrong = true

  const domainRoot = domainLower
    ? domainLower.split('.').slice(-2).join('.')
    : ''

  const isBrandLike = brandImpersonationPatterns.some(brand => {
    // Skip if the root domain appears to be the official brand domain
    if (domainRoot === `${brand}.com` || domainRoot === `${brand}.net` || domainRoot === `${brand}.org`) {
      return false
    }

    const brandRegex = new RegExp(`(^|[._-])${brand}([._-]|$)`, 'i')
    return (
      (brandRegex.test(localPart) ||
        localLower.includes(`${brand}support`) ||
        localLower.includes(`${brand}verify`) ||
        localLower.includes(`${brand}confirm`) ||
        localLower.includes(`${brand}help`) ||
        localLower.includes(`${brand}admin`)) &&
      !isRoleBased
    )
  })

  if (isBrandLike) {
    insights.isBrandImpersonation = true
    // Brand impersonation should be untrustworthy (20-30 trust score)
    if (isStrongBrandImpersonation) {
      insights.semanticPenalty -= 80 // Lowers trust to 20
    } else {
      insights.semanticPenalty -= 70 // Lowers trust to 30
    }
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

// Grade downgrade helper (for gibberish)
function downgradeGrade(grade) {
  const order = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
  const idx = order.indexOf(grade)
  if (idx === -1) return grade
  if (idx === order.length - 1) return grade
  return order[idx + 1]
}

// Human likelihood mapping
function mapHumanLikelihoodLabel(
  trustScore,
  isInvalid = false,
  isCorporateEmail = false,
  hasAbusiveContent = false,
  hasStrongImpersonation = false,
  isRoleBasedEmail = false
) {
  if (isInvalid) return 'Invalid (cannot receive email)'
  if (hasStrongImpersonation) return 'Likely bot / impersonator'
  if (hasAbusiveContent) return 'Cannot classify (abusive)'
  if (isRoleBasedEmail || isCorporateEmail) return 'Likely organization mailbox'

  if (trustScore >= 90) return 'Very likely human'
  if (trustScore >= 75) return 'Likely human'
  if (trustScore >= 50) return 'Possibly bot/throwaway'
  if (trustScore >= 20) return 'Suspicious'
  return 'Definitely bot'
}

// Phishing risk
function calculatePhishingRisk(
  localPart,
  domain,
  isRoleBasedEmail,
  isCorporateDomain,
  hasAbusiveContent,
  hasBrandImpersonation
) {
  if (hasAbusiveContent) return 'Low'

  if (isRoleBasedEmail && isCorporateDomain) return 'Low'

  if (hasBrandImpersonation && !isCorporateDomain) return 'Very High'

  if (isRoleBasedEmail) return 'Medium'

  // Toxic keywords bump
  const lower = `${localPart}@${domain}`.toLowerCase()
  if (toxicKeywords.some(t => lower.includes(t))) return 'Medium'

  return 'Low'
}

function normalizeDomainForTldValidation(domain) {
  try {
    if (punycode && punycode.toASCII) {
      return punycode.toASCII(domain)
    }
  } catch (e) {}
  return domain
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

// Main per-email validator
function validateSingleEmail(trimmedEmail) {
  const baseInvalid = (issues, opts = {}) => ({
    email: trimmedEmail,
    normalized: trimmedEmail.toLowerCase(),
    valid: false,
    isInvalid: true,
    isDisposable: false,
    deliverabilityScore: 0,
    trustworthinessScore: 0,
    abusiveScore: 0,
    gibberishScore: 0,
    combinedGrade: 'Invalid',
    humanLikelihood: 'Invalid (cannot receive email)',
    phishingRisk: 'N/A',
    issues,
    deliverabilityWarnings: opts.deliverabilityWarnings || [],
    trustworthinessWarnings: opts.trustworthinessWarnings || [],
    tldQuality: null,
    hasSyntaxError: opts.hasSyntaxError || false,
    businessEmail: null,
    deliverabilityLabel: 'Guaranteed bad',
    trustworthinessLabel: 'Invalid',
    usernameHeuristics: [],
    usernameRiskScore: 0,
    smtpCheck: 'Not performed (client-side)'
  })

  // QUICK SYNTAX CHECKS
  if (!trimmedEmail.includes('@')) {
    return baseInvalid(['Missing @ symbol'], { hasSyntaxError: true })
  }

  const parts = trimmedEmail.split('@')
  if (parts.length !== 2) {
    return baseInvalid(['Invalid email format (multiple or missing @)'], {
      hasSyntaxError: true
    })
  }

  const [localPart, domain] = parts

  if (!localPart || !domain) {
    return baseInvalid(['Invalid email format: missing local part or domain'], {
      hasSyntaxError: true
    })
  }

  const issues = []
  let hasSyntaxError = false

  if (/\s/.test(trimmedEmail)) {
    issues.push('Contains whitespace')
    hasSyntaxError = true
  }

  if (/\.\./.test(trimmedEmail)) {
    issues.push('Contains consecutive dots')
    hasSyntaxError = true
  }

  if (/^\.|\.$/.test(localPart)) {
    issues.push('Local part starts or ends with dot')
    hasSyntaxError = true
  }

  if (hasSyntaxError) {
    return baseInvalid(issues, { hasSyntaxError: true })
  }

  const domainLower = domain.toLowerCase()
  const localLower = localPart.toLowerCase()
  // Option B1: Apply NFC normalization for Unicode support
  const normalizedLocalPart = localPart.toLowerCase().normalize('NFC')
  const normalizedDomain = domainLower.normalize('NFC')
  const normalizedEmail = `${normalizedLocalPart}@${normalizedDomain}`

  // RESERVED DOMAINS
  if (reservedDomains.has(domainLower)) {
    return baseInvalid(
      [`"${domain}" is a reserved example domain — not deliverable`],
      { deliverabilityWarnings: ['Reserved example domain'] }
    )
  }

  // DOMAIN + TLD VALIDATION
  const tldIssues = []
  let tldQuality = null
  let deliverabilityScore = 100
  let trustworthinessScore = 100
  let isInvalid = false

  const hasDot = domain.includes('.')
  const startsWithDot = domain.startsWith('.')
  const hasValidTld = /\.(\p{L}[\p{L}\p{N}-]*)$/u.test(domain)
  let tldIsIcannApproved = false

  if (startsWithDot) {
    tldIssues.push('Domain cannot start with a dot')
    isInvalid = true
  } else if (!hasDot) {
    tldIssues.push('Domain must contain a dot (e.g., example.com)')
    isInvalid = true
  } else if (!hasValidTld) {
    tldIssues.push('Invalid TLD (top-level domain)')
    isInvalid = true
  } else {
    const normalizedDomain = normalizeDomainForTldValidation(domain)
    const tldMatch = normalizedDomain.match(/\.(\p{L}[\p{L}\p{N}-]*)$/u)

    if (tldMatch) {
      let tld = tldMatch[1].toLowerCase()
      let asciiTld = tld
      try {
        if (punycode && punycode.toASCII) {
          asciiTld = punycode.toASCII(`.${tld}`).slice(1).toLowerCase()
        }
      } catch (e) {
        asciiTld = tld
      }

      tldIsIcannApproved = validTLDs.has(tld) || validTLDs.has(asciiTld)

      if (highTrustTLDs.has(tld) || highTrustTLDs.has(asciiTld)) {
        tldQuality = 'high-trust'
        trustworthinessScore = Math.min(100, trustworthinessScore + 3)
      } else if (lowTrustTLDs.has(tld) || lowTrustTLDs.has(asciiTld)) {
        tldQuality = 'low-trust'
        trustworthinessScore = Math.max(0, trustworthinessScore - 30)
      } else {
        tldQuality = 'neutral'
      }

      if (suspiciousTLDs.has(tld) || suspiciousTLDs.has(asciiTld)) {
        trustworthinessScore = Math.max(0, trustworthinessScore - 15)
      }

      if (!tldIsIcannApproved) {
        tldIssues.push(`TLD ".${tld}" is not ICANN-approved`)
        isInvalid = true
      }
    }
  }

  if (domain.length > 255) {
    tldIssues.push('Domain exceeds 255 characters')
    isInvalid = true
  }

  if (localPart.length > 64) {
    tldIssues.push('Local part exceeds 64 characters')
    isInvalid = true
  }

  const domainLabels = domain.split('.')
  for (const label of domainLabels) {
    if (label.startsWith('-') || label.endsWith('-')) {
      tldIssues.push(`Domain label "${label}" cannot start or end with a hyphen`)
      isInvalid = true
    }
  }

  if (isInvalid) {
    return baseInvalid([...issues, ...tldIssues], {
      deliverabilityWarnings: tldIssues,
      hasSyntaxError: hasSyntaxError
    })
  }

  // DISPOSABLE DOMAINS
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domainLower.includes(disposable))) {
    isDisposable = true
    return {
      email: trimmedEmail,
      normalized: normalizedEmail,
      valid: false,
      isInvalid: true,
      isDisposable: true,
      deliverabilityScore: 0,
      trustworthinessScore: 0,
      abusiveScore: 0,
      gibberishScore: 0,
      combinedGrade: 'Invalid (Disposable)',
      humanLikelihood: 'Throwaway / Temporary',
      phishingRisk: 'High',
      issues,
      deliverabilityWarnings: ['Disposable/temporary email domain'],
      trustworthinessWarnings: ['Disposable email domain'],
      tldQuality: null,
      hasSyntaxError: false,
      businessEmail: null,
      deliverabilityLabel: 'Guaranteed bad',
      trustworthinessLabel: 'Invalid',
      usernameHeuristics: [],
      usernameRiskScore: 0,
      smtpCheck: 'Not performed (client-side)'
    }
  }

  // SEMANTICS
  const semantics = analyzeUsernameSemantics(localPart, domain)

  // Apply semantic bonuses/penalties
  if (semantics.semanticBonus > 0) {
    trustworthinessScore = Math.min(100, trustworthinessScore + semantics.semanticBonus)
  }
  if (semantics.semanticPenalty < 0) {
    trustworthinessScore = Math.max(0, trustworthinessScore + semantics.semanticPenalty)
  }

  const trustworthinessWarnings = []
  const deliverabilityWarnings = [...tldIssues]

  semantics.warnings.forEach(warning => {
    if (semantics.hasAbusiveContent && warning.includes('personal name pattern')) return
    if (semantics.isRoleBasedEmail && warning.includes('impersonate')) return
    if (!trustworthinessWarnings.includes(warning)) {
      trustworthinessWarnings.push(warning)
    }
  })

  // BUSINESS / FREEMAIL / CORPORATE
  const businessProvider = detectBusinessEmailProvider(domain)
  const isDomainCorporate = isCorporateDomain(domainLower)
  let businessEmail = null

  if (businessProvider) {
    businessEmail = businessProvider
    if (businessProvider.type === 'corporate') {
      trustworthinessWarnings.push(`${businessProvider.name} (corporate email)`)
    }
  } else if (isDomainCorporate) {
    const corpName = domainLower.split('.')[0]
    businessEmail = {
      name: corpName.charAt(0).toUpperCase() + corpName.slice(1),
      type: 'corporate'
    }
  }

  // ROLE-BASED EMAIL
  // Option B1: Skip role-based detection for Unicode usernames
  let roleMatch = null
  let roleTrustPenalty = 0
  let isRoleBasedEmail = false
  const hasUnicodeInLocal = /[^\x00-\x7F]/.test(localPart)

  if (!hasUnicodeInLocal) {
    const roleChecks = [
      { patterns: ['noreply', 'no-reply'], role: 'noreply', penalty: -20 },
      { patterns: ['info', 'info+', 'info.'], role: 'info', penalty: -25 },
      { patterns: ['support', 'support+', 'support.'], role: 'support', penalty: -30 },
      { patterns: ['admin', 'admin+', 'admin.'], role: 'admin', penalty: -30 },
      { patterns: ['marketing', 'newsletter', 'marketing+', 'newsletter+'], role: 'marketing', penalty: -30 },
      { patterns: ['help', 'contact', 'help+', 'contact+'], role: 'help', penalty: -20 }
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
  }

  if (isRoleBasedEmail) {
    trustworthinessScore = Math.max(0, trustworthinessScore + roleTrustPenalty)
    trustworthinessWarnings.push(`Role-based email (${roleMatch})`)

    if (systemMailboxesCapped.has(roleMatch)) {
      trustworthinessScore = Math.min(trustworthinessScore, 65)
    }
  }

  // GIBBERISH / USERNAME HEURISTICS
  const usernameHeuristics = []
  let usernameRiskScore = 0

  // Option B1: Detect Unicode in local part for safe mode
  const hasUnicodeInUsername = /[^\x00-\x7F]/.test(localPart)

  const marketingWhitelist = new Set([
    'newsletter', 'marketing', 'promotions', 'promo', 'outreach',
    'campaigns', 'ads', 'advertising', 'media'
  ])
  const isMarketingName = marketingWhitelist.has(localLower)

  function looksLikeMultiPartName(local) {
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length < 2) return false
    return parts.every(p => /[aeiou]/i.test(p))
  }
  const isMultiPartName = looksLikeMultiPartName(localPart)

  const acronymWhitelist = new Set(['nsfw', 'sfw', 'fyi', 'faq', 'asap', 'brb'])
  const startsWithAcronym = Array.from(acronymWhitelist).some(a => localLower.startsWith(a))

  // Option B1: Skip keyboard walk check for Unicode
  const isKeyboardWalk = !hasUnicodeInUsername && keyboardWalks.some(seq => localLower.includes(seq))
  if (isKeyboardWalk) {
    usernameRiskScore = Math.max(usernameRiskScore, 15)
    trustworthinessScore = Math.max(0, trustworthinessScore - 20)
    usernameHeuristics.push('Username appears to be a keyboard sequence pattern')
  }

  // Option B1: Skip all ASCII-based gibberish detection for Unicode usernames
  if (
    !hasUnicodeInUsername &&
    !semantics.isLikelyPersonalName &&
    !semantics.isUnicodeUsername &&
    !semantics.isStandardSystemEmail &&
    !isMarketingName &&
    !startsWithAcronym &&
    !isKeyboardWalk
  ) {
    const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
    const vowelRatioLocal = vowelsInLocal / localPart.length

    const specialCharsInLocal = (localPart.match(/[^a-zA-Z0-9.-]/g) || []).length
    const hasUppercase = /[A-Z]/.test(localPart)
    const hasLowercase = /[a-z]/.test(localPart)
    const hasNumbers = /\d/.test(localPart)
    const hasSpecial = /[^a-zA-Z0-9.-]/.test(localPart)
    const entropyIndicators = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length

    const trigrams = new Map()
    for (let i = 0; i <= localLower.length - 3; i++) {
      const trigram = localLower.substring(i, i + 3)
      trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1)
    }
    const repeatedTrigrams = Array.from(trigrams.values()).filter(count => count >= 2).length

    let clusterPoints = 0
    let entropyPoints = 0
    let repeatPoints = 0
    let vowelPenalty = 0

    const skipClusterCheck =
      semantics.isLikelyPersonalName ||
      isMultiPartName ||
      /[-']/i.test(localPart) ||
      vowelRatioLocal > 0.25

    if (vowelRatioLocal < 0.15) {
      vowelPenalty = 4
      usernameHeuristics.push('Low vowel ratio')
    }

    if (specialCharsInLocal >= 2) {
      usernameRiskScore += 3
      usernameHeuristics.push('Multiple special characters')
    }

    if (entropyIndicators >= 3) {
      entropyPoints = 5
      usernameHeuristics.push('High character entropy')
    }

    if (localPart.length > 32) {
      usernameRiskScore += 5
      usernameHeuristics.push('Exceptionally long username')
      trustworthinessScore = Math.max(0, trustworthinessScore - 10)
    }

    if (localPart.length < 3) {
      trustworthinessScore = Math.max(0, trustworthinessScore - 5)
      trustworthinessWarnings.push('Unusually short username')
    }

    if (/^\d+$/.test(localPart)) {
      usernameRiskScore += 12
      usernameHeuristics.push('Numbers-only username')
      trustworthinessScore = Math.max(0, trustworthinessScore - 40)
    }

    const clearBotPatterns = ['bot', 'mailer', 'daemon', 'notification', 'alert', 'auto-', 'generated', 'tmp', 'temp']
    if (!semantics.isRoleBasedEmail && clearBotPatterns.some(pattern => localLower.includes(pattern))) {
      usernameRiskScore += 6
      usernameHeuristics.push('Matches automated patterns')
    }

    if (/(.)\1{2,}/.test(localPart)) {
      repeatPoints = 3
      usernameHeuristics.push('Repeated characters detected')
      trustworthinessScore = Math.max(0, trustworthinessScore - 20)
    }

    if (!skipClusterCheck) {
      for (let i = 0; i <= localLower.length - 5; i++) {
        const window = localLower.substring(i, i + 5)
        const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
        if (consonantCount >= 4) {
          clusterPoints = 6
          break
        }
      }
    }

    const finalRiskScore =
      clusterPoints * 2 +
      entropyPoints * 3 +
      repeatPoints * 1 +
      vowelPenalty * 2

    usernameRiskScore += finalRiskScore
    usernameRiskScore = Math.min(40, Math.max(0, usernameRiskScore))

    const isStrongGibberish =
      (repeatedTrigrams >= 4 && vowelRatioLocal < 0.2) ||
      (entropyIndicators >= 3 && vowelRatioLocal < 0.18)

    if (isStrongGibberish) {
      usernameHeuristics.push('Username appears randomly generated (gibberish)')
    }

    const consonantRatio =
      (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / localPart.length
    const isBotLike = localPart.length >= 10 && consonantRatio >= 0.7

    let usernameTrustPenalty = 0
    if (usernameRiskScore >= 30 || isBotLike) {
      usernameTrustPenalty = -40
      trustworthinessWarnings.push('Username appears randomly generated (extreme gibberish)')
    } else if (usernameRiskScore >= 20) {
      usernameTrustPenalty = -25
      trustworthinessWarnings.push('Username appears randomly generated')
    } else if (usernameRiskScore >= 10) {
      usernameTrustPenalty = -15
      trustworthinessWarnings.push('Username looks somewhat suspicious')
    } else if (usernameRiskScore >= 5) {
      usernameTrustPenalty = -5
      trustworthinessWarnings.push('Username has unusual characteristics')
    }

    if (usernameTrustPenalty < 0) {
      trustworthinessScore = Math.max(0, trustworthinessScore + usernameTrustPenalty)
    }
  } else if (hasUnicodeInUsername) {
    // Option B1: Unicode gets neutral trust scores unless abusive/adult/brand impersonation
    // Skip gibberish penalties for Unicode usernames
    // Only track heuristics without applying trust penalties
    if (/^\d+$/.test(localPart)) {
      usernameHeuristics.push('Numbers-only username')
    }

    if (/(.)\1{2,}/.test(localPart)) {
      usernameHeuristics.push('Repeated characters detected')
    }
  }

  // DOMAIN REPUTATION & BUSINESS ROOT
  const domainRoot = domainLower.split('.').slice(-2).join('.')
  const isBusinessDomain = businessDomainKeywords.some(kw => domainRoot.includes(kw))

  if (domainLower === 'gmail.com') {
    deliverabilityScore = Math.min(100, deliverabilityScore + 5)
  } else if (domainLower === 'outlook.com' || domainLower === 'hotmail.com') {
    deliverabilityScore = Math.min(100, deliverabilityScore + 2)
  } else if (domainLower === 'icloud.com') {
    deliverabilityScore = Math.min(100, deliverabilityScore + 3)
  } else if (domainLower === 'yahoo.com') {
    deliverabilityScore = Math.min(100, deliverabilityScore + 1)
  } else if (domainLower === 'aol.com') {
    deliverabilityScore = Math.max(0, deliverabilityScore - 3)
  } else if (domainLower === 'gmx.com' || domainLower === 'mail.com') {
    deliverabilityScore = Math.max(0, deliverabilityScore - 5)
  } else if (domainLower === 'yandex.com' || domainLower === 'yandex.ru') {
    deliverabilityScore = Math.max(0, deliverabilityScore - 5)
  }

  if (!isFreemailProvider(domainLower) && isBusinessDomain) {
    trustworthinessScore = Math.min(100, trustworthinessScore + 10)
    trustworthinessWarnings.push('Business domain detected')
  }

  // MAILCHECKER
  // Option B1: Skip MailChecker for Unicode emails (MailChecker doesn't support non-ASCII)
  let mailcheckerValid = true
  const hasUnicodeInEmail = /[^\x00-\x7F]/.test(trimmedEmail)
  if (typeof MailChecker !== 'undefined' && !hasUnicodeInEmail) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // SUBDOMAIN PENALTY (deliverability only, not trust)
  const domainParts = domain.split('.')
  const commonSecondLevelDomains = [
    'co.uk', 'co.nz', 'co.jp', 'com.au', 'com.br',
    'com.mx', 'co.id', 'co.in', 'co.ke', 'co.za'
  ]
  const isCommonSLD = commonSecondLevelDomains.some(sld => domainLower.endsWith('.' + sld))
  const subdomainLabelCount = isCommonSLD ? domainParts.length - 2 : domainParts.length - 1

  if (subdomainLabelCount >= 3) {
    if (!isDomainCorporate) {
      deliverabilityScore = Math.max(0, deliverabilityScore - 3)
    }
    deliverabilityWarnings.push('Subdomain-based email')
  }

  // HARD CAP / NORMALIZATION
  deliverabilityScore = Math.max(0, Math.min(100, Math.round(deliverabilityScore)))
  trustworthinessScore = Math.max(0, Math.min(100, Math.round(trustworthinessScore)))

  if (deliverabilityScore === 0) {
    trustworthinessScore = Math.min(trustworthinessScore, 20)
    isInvalid = true
  }

  // Adult/explicit penalties now that we know username risk
  if (!semantics.hasAbusiveContent) {
    if (semantics.hasNegativeAdultThemes && usernameRiskScore > 15) {
      trustworthinessScore = Math.max(0, trustworthinessScore - 20)
      trustworthinessWarnings.push('Contains adult or explicit themes')
    } else if (semantics.hasAdultContent && usernameRiskScore > 15) {
      trustworthinessScore = Math.max(0, trustworthinessScore - 15)
      trustworthinessWarnings.push('Contains adult-oriented content')
    }
  }

  // Perfect trust cannot coexist with warnings/heuristics
  // Option B1: Don't apply this rule to Unicode usernames (they get neutral trust without penalties)
  if (
    !hasUnicodeInUsername &&
    trustworthinessScore === 100 &&
    (trustworthinessWarnings.length > 0 || usernameHeuristics.length > 0)
  ) {
    trustworthinessScore = Math.max(0, trustworthinessScore - 10)
  }

  if (semantics.isBrandImpersonationStrong) {
    trustworthinessScore = Math.max(0, trustworthinessScore - 50)
  }

  // Trust should never wildly exceed deliverability
  trustworthinessScore = Math.min(trustworthinessScore, deliverabilityScore + 20)

  const basicValid =
    issues.length === 0 &&
    !hasSyntaxError &&
    deliverabilityScore > 0 &&
    !isInvalid

  const finalValid = basicValid && (typeof MailChecker === 'undefined' ? true : mailcheckerValid)

  // SCORES
  // Penalty hierarchy: hateful (100) > abusive (70) > nsfw (30) > none (0)
  let abusiveScore = 0
  if (semantics.contentSeverity.isHateful) {
    abusiveScore = 100
  } else if (semantics.contentSeverity.isAbusive) {
    abusiveScore = 70
  } else if (semantics.contentSeverity.isNsfw) {
    abusiveScore = 30
  }

  const gibberishScore = Math.min(100, Math.round((usernameRiskScore / 40) * 100))

  let combinedGrade
  let humanLikelihood
  let phishingRisk
  let deliverabilityLabel
  let trustworthinessLabel

  if (!finalValid) {
    combinedGrade = 'Invalid'
    humanLikelihood = 'Invalid (cannot receive email)'
    deliverabilityLabel = 'Guaranteed bad'
    trustworthinessLabel = 'Invalid'
    phishingRisk = 'Unknown'
  } else {
    combinedGrade = calculateCombinedGrade(deliverabilityScore, trustworthinessScore)
    deliverabilityLabel = mapDeliverabilityLabel(deliverabilityScore)
    trustworthinessLabel = mapTrustworthinessLabel(trustworthinessScore)

    const isFreemail = personalFreemailProviders.has(domainLower)
    if (semantics.isBrandImpersonation && isFreemail && isRoleBasedEmail) {
      trustworthinessScore = 0
      trustworthinessWarnings.push(
        'Brand impersonation on free email with role-based pattern (likely phishing)'
      )
      combinedGrade = 'F'
    }

    phishingRisk = calculatePhishingRisk(
      localPart,
      domain,
      isRoleBasedEmail,
      isDomainCorporate,
      semantics.hasAbusiveContent,
      semantics.isBrandImpersonation
    )

    // Grade adjustments based on risk
    if (phishingRisk === 'Very High') {
      combinedGrade = 'F'
    } else if (abusiveScore >= 80) {
      combinedGrade = 'F'
    } else if (gibberishScore >= 25) {
      combinedGrade = downgradeGrade(combinedGrade)
    }

    humanLikelihood = mapHumanLikelihoodLabel(
      trustworthinessScore,
      false,
      isDomainCorporate,
      semantics.hasAbusiveContent,
      semantics.isBrandImpersonationStrong,
      isRoleBasedEmail
    )
  }

  return {
    email: trimmedEmail,
    normalized: normalizedEmail,
    valid: finalValid,
    isInvalid: !finalValid,
    isDisposable,
    deliverabilityScore,
    trustworthinessScore,
    abusiveScore,
    gibberishScore,
    combinedGrade,
    humanLikelihood,
    phishingRisk,
    issues: [...issues, ...tldIssues],
    deliverabilityWarnings,
    trustworthinessWarnings,
    tldQuality,
    hasSyntaxError,
    businessEmail,
    deliverabilityLabel,
    trustworthinessLabel,
    usernameHeuristics,
    usernameRiskScore,
    roleBasedEmail: isRoleBasedEmail,
    roleBasedType: isRoleBasedEmail ? roleMatch : null,
    smtpCheck: 'Not performed (client-side)'
  }
}

// MAIN EXPORT
export function emailValidator(text) {
  const emails = text
    .split(/[,\n]+/)
    .map(e => e.trim())
    .filter(e => e)

  if (emails.length === 0) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      mailcheckerAvailable: typeof MailChecker !== 'undefined',
      dnsCheckAvailable: true,
      averageDeliverabilityScore: 0,
      averageTrustworthinessScore: 0,
      averageAbusiveScore: 0,
      averageGibberishScore: 0,
      results: []
    }
  }

  const results = emails.map(email => validateSingleEmail(email))

  const avg = (field) =>
    Math.round(results.reduce((sum, r) => sum + (r[field] || 0), 0) / results.length)

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    mailcheckerAvailable: typeof MailChecker !== 'undefined',
    dnsCheckAvailable: true,
    averageDeliverabilityScore: avg('deliverabilityScore'),
    averageTrustworthinessScore: avg('trustworthinessScore'),
    averageAbusiveScore: avg('abusiveScore'),
    averageGibberishScore: avg('gibberishScore'),
    results
  }
}
