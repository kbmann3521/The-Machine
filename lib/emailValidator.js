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

let dns
try {
  dns = require('dns').promises
} catch (e) {
  dns = undefined
}

const roleBasedPrefixes = [
  'admin', 'noreply', 'no-reply', 'contact', 'info', 'support',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',
  'root', 'abuse', 'security', 'billing', 'sales', 'marketing',
  'notifications', 'notification', 'alerts', 'alert', 'system', 'help'
]

const knownDisposableDomains = [
  // Original list
  'mailinator', 'yopmail', '10minutemail', 'temp-mail',
  'guerrillamail', 'anonymousemail', 'cock.li', 'cock.email',
  'tempmail', 'throwaway', 'mailnesia', '10min',
  'maildrop', 'mailtest', 'fakeinbox', 'trashmail', 'spam4', 'dispostable',
  // Additional services not caught by MailChecker
  'getnada', 'moakt', 'mailcatch', 'sharklasers',
  'corruption', 'spamgourmet', 'mytrashmail', 'temp',
  'mail4', 'spam.la', 'spambox', 'tempinbox',
  '99webmail', 'dudmail', 'droptmail', 'donttrustme',
  'dodgemail', 'dodgeit', 'easytrashmail', 'emkei'
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
  'space', 'store', 'tech', 'video', 'web', 'website', 'world', 'email',
  'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'io',
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


// Freemail providers
const personalFreemailProviders = new Set([
  // Global majors
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',

  // Privacy-focused
  'protonmail.com', 'mail.protonmail.com', 'pm.me',
  'tutanota.com', 'mailbox.org', 'fastmail.com', 'hey.com',

  // Russian / CIS
  'yandex.com', 'yandex.ru', 'mail.ru', 'rambler.ru', 'bk.ru', 'inbox.ru', 'list.ru',

  // Chinese
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', 'yeah.net',

  // Korean
  'daum.net', 'naver.com', 'hanmail.net',

  // European
  'aol.com', 'gmx.com', 'gmx.de', 'mail.com', 'zoho.com',
  'web.de', 'freenet.de', 'laposte.net', 'wanadoo.fr', 'free.fr', 'sfr.fr',

  // Educational patterns (not perfect but recognized commonly)
  'student.com', 'university.ac', 'edu.au', 'ac.uk',

  // Disposable / temporary (popular & obscure)
  'tempmail.com', 'temp-mail.org', 'mailinator.com', 'yopmail.com',
  'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'sharklasers.com', 'cock.li', 'cock.email', 'getnada.com',
  'trashmail.com', 'moakt.com', 'maildrop.cc', 'dispostable.com',
  'mailcatch.com', 'mailnesia.com', 'mailnull.com',

  // Misc
  'pobox.com', 'mailanator.com', 'emailnow.net'
])

// Corporate provider domains (exact or single-subdomain)
const corporateProviderDomains = new Set([
  // Big Tech
  'microsoft.com', 'apple.com', 'google.com', 'amazon.com', 'meta.com', 'facebook.com',
  'ibm.com', 'oracle.com', 'vmware.com', 'salesforce.com', 'adobe.com',
  'nvidia.com', 'amd.com', 'intel.com',

  // Cloud
  'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com',
  'digitalocean.com', 'heroku.com', 'vercel.com', 'netlify.com',

  // AI Companies
  'openai.com', 'anthropic.com', 'stability.ai', 'huggingface.co',
  'deepmind.google.com', 'cohere.com', 'together.ai',

  // E-commerce / Payments / Finance
  'paypal.com', 'square.com', 'shopify.com',
  'bankofamerica.com', 'bofa.com', 'chase.com', 'citi.com',
  'wellsfargo.com', 'capitalone.com', 'visa.com', 'mastercard.com',

  // Crypto
  'coinbase.com', 'kraken.com', 'gemini.com', 'binance.com', 'opensea.io',

  // Social platforms
  'twitter.com', 'x.com', 'threads.com', 'slack.com', 'discord.com',
  'telegram.org', 'whatsapp.com', 'instagram.com', 'tiktok.com', 'snapchat.com', 'reddit.com',

  // Media / Video
  'netflix.com', 'youtube.com', 'hulu.com', 'disneyplus.com', 'primevideo.com',
  'twitch.tv', 'vimeo.com', 'spotify.com',

  // Productivity / SaaS
  'dropbox.com', 'box.com', 'onedrive.com', 'notion.so', 'asana.com',
  'monday.com', 'trello.com', 'jira.atlassian.com', 'confluence.atlassian.com',

  // Developer platforms
  'github.com', 'gitlab.com', 'bitbucket.org',

  // E-commerce retail
  'etsy.com', 'ebay.com', 'wix.com', 'shopify.com',

  // Travel / Ride / Hospitality
  'uber.com', 'lyft.com', 'airbnb.com', 'booking.com', 'expedia.com',
  'hotels.com', 'tripadvisor.com'
])

// Personal name patterns - all legitimate variations
const personalNamePatterns = [
  /^[a-z]{2,}[._][a-z]{2,}$/i,  // firstname.lastname or firstname_lastname
  /^[a-z]{2,}[.-]?[a-z]{2,}[0-9]{1,3}$/i,  // firstnamelastname123 or firstname-lastname90
  /^[a-z]{2,}[a-z]{2,}[0-9]{1,3}$/i,  // concatenated firstname+lastname+numbers (kylemann90)
  /^[a-z]{2,}[0-9]{1,2}$|^[a-z]{2,}[0-9]{3,4}$/i  // firstname90 or firstname2024 (common patterns)
]

// Role-based emails (expanded)
const roleBasedEmailKeywords = [
  // IT / Admin
  'admin', 'administrator', 'admins', 'sysadmin', 'superuser', 'root',
  'it', 'itsupport', 'it-support', 'tech', 'technical',
  'support', 'help', 'helpdesk', 'support-team', 'service',

  // Sales / Biz
  'sales', 'sales-team', 'business', 'bd', 'partnerships', 'partner',
  'account-manager', 'account-team', 'enterprise', 'reseller',

  // Marketing / Comms
  'marketing', 'marketing-team', 'marcom', 'communications', 'comms',
  'pr', 'press', 'media', 'advertising', 'ads', 'brand',

  // Dev / Engineering
  'devops', 'platform', 'operations', 'ops', 'sre',
  'product', 'product-team', 'engineering', 'eng', 'dev', 'qa',
  'data', 'analytics', 'bi', 'insights', 'metrics',

  // HR
  'hr', 'human-resources', 'hr-team', 'recruiting', 'recruiter', 'talent',
  'careers', 'people', 'payroll', 'benefits',

  // Finance
  'finance', 'accounting', 'accounts', 'billing',
  'invoice', 'payment', 'revenue',

  // Legal
  'legal', 'legal-team', 'compliance', 'privacy', 'security',

  // Ops & Leadership
  'management', 'leadership', 'exec', 'ceo', 'cto', 'cfo', 'coo',

  // Generic mailboxes
  'contact', 'info', 'information', 'inquiry', 'feedback',
  'newsletter', 'notifications', 'alert', 'alerts',

  // No-reply variants
  'noreply', 'no-reply', 'donotreply',

  // Abuse/Security
  'abuse', 'trust-safety', 'fraud', 'phishing',

  // System / Infrastructure
  'system', 'systems', 'status',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',

  // Community
  'events', 'community', 'devrel',
  'hello', 'team', 'office', 'reception'
]

// Departmental/functional words (legit corporate identifiers)
const departmentalWords = new Set([
  // Departments
  'accounting', 'finance', 'legal', 'hr', 'operations', 'ops',
  'marketing', 'sales', 'engineering', 'dev', 'development', 'qa',
  'support', 'customer-service', 'shipping', 'warehouse',
  'research', 'product', 'design', 'ux', 'ui', 'data',
  'analytics', 'bi', 'security', 'compliance', 'audit',

  // Functional roles
  'admin', 'administrator', 'manager', 'director', 'lead', 'coordinator',
  'specialist', 'officer', 'supervisor', 'executive',

  // Team/Group identifiers
  'team', 'group', 'squad', 'tribe', 'office', 'branch',
  'department', 'division', 'unit', 'section', 'committee',

  // General functional emails
  'info', 'contact', 'hello', 'support', 'help', 'feedback',
  'inquiry', 'communication', 'general', 'main',

  // Service/inbox identifiers
  'inbox', 'mailbox', 'service', 'services', 'request', 'queue'
])

// CLASS 1: Hard Bot/Test Keywords (Always penalize everywhere)
// These never represent a real human, on any domain
const hardBotTestKeywords = new Set([
  'test', 'demo', 'dummy', 'temp', 'tmp', 'fake', 'example', 'sample',
  'placeholder', 'autogen', 'autogenerated', 'noreply', 'no-reply',
  'donotreply', 'bot', 'auto', 'system'
])

// CLASS 2: Suspicious Intent Keywords (Penalize ONLY on freemail)
// Context-dependent words that indicate throwaway on freemail, but legitimate on corporate
const suspiciousIntentKeywords = new Set([
  'spam', 'trash', 'junk', 'scam', 'fraud', 'phishing',
  'hacker', 'malware', 'virus', 'breach', 'stolen'
])

// CLASS 3: Impossible/Red-Flag Keywords on Corporate Domains
// These combinations are basically impossible in real enterprises
const corporateRedFlagKeywords = new Set([
  'spam', 'junk', 'scam', 'fraud', 'phishing', 'fake',
  'illegal', 'blacklist', 'malware', 'virus'
])

// Hateful / slur terms (maximum penalty 80-100)
const hatefulTerms = [
  // Race / ethnicity
  'nigger', 'nigga', 'nword', 'jigaboo', 'porchmonkey',
  'coon', 'spic', 'wetback', 'beaner', 'gook', 'chink',
  'zipperhead', 'dago', 'guido', 'wop', 'kike', 'heeb',
  'raghead', 'sandnigger', 'sand-monkey', 'camel-jockey',
  'cracker', 'honkey', 'redskin', 'aboriginal-slur',

  // Religion
  'christ-killer', 'heathen', 'heretic', 'infidel',
  'islamophobe', 'anti-semite',

  // LGBTQ+
  'faggot', 'dyke', 'tranny', 'shemale', 'fudgepacker',
  'fairy' , 'pillowbiter',

  // Disabilities
  'retard', 'tard', 'spaz', 'cripple', 'vegetable',

  // Hate groups / violence
  'nazi', 'white-power', 'kkk', 'skinhead',
  'facist', 'fascist', 'supremacist',

  // Violent sexual / predatory
  'rapist', 'pedo', 'pedophile', 'paedo', 'molester',

  // Genocide / extremism
  'genocide', 'ethnic-cleansing', 'terrorist', 'jihadi', 'extremist'
];

// Abusive / hostile terms (medium penalty 40-70)
const abusiveTerms = [
  // ==========================================================
  // STRONG PROFANITY
  // ==========================================================
  'fuck', 'fucking', 'fucker', 'motherfucker',
  'shit', 'bullshit', 'dipshit', 'shithead', 'fuckhead',
  'asshole', 'dumbass', 'smartass', 'jackass', 'punkass',

  // ==========================================================
  // SEXUALIZED INSULTS (non-slur)
  // ==========================================================
  'cunt', 'twat', 'coochie', 'pussy', // sexual but insulting context
  'dickhead', 'dickwad', 'prick', 'cockhead', 'ballsack', // common insult

  // ==========================================================
  // PERSONAL INSULTS / DEROGATORY LABELS
  // ==========================================================
  'idiot', 'moron', 'stupid', 'dumb', 'loser',
  'clown', 'scumbag', 'creep', 'weirdo', 'garbage', 'trash',
  'pathetic', 'worthless', 'degenerate', 'delusional',
  'jerk', 'coward', 'snake', 'liar', 'fool',
  'douche', 'douchebag',
  'failure', 'deadbeat', 'parasite',

  // ==========================================================
  // AGGRESSIVE / HOSTILE EXPRESSIONS
  // (NOT threats; those stay out for safety)
  // ==========================================================
  'kys', 'kill-yourself', 'die-in-a-fire',
  'getrekt', 'rekt',
  'burn-in-hell', 'rot-in-hell',
  'piss-off', 'screw-you',

  // ==========================================================
  // HOSTILE SLANG / INTERNET INSULTS
  // ==========================================================
  'bastard', 'bitch', 'bitchass', 'hoe',
  'slut', 'whore', 'skank', 'tramp', 'thot',
  'ratchet', 'manwhore',

  // ==========================================================
  // DRUG-RELATED INSULTS (but not health conditions)
  // ==========================================================
  'crackhead', 'junkie', 'druggie',

  // ==========================================================
  // MOCKING / BELITTLING LABELS
  // ==========================================================
  'neckbeard', 'virgin', 'simp', 'beta', 'incel',
  'scrub', 'noob', 'bot', 'tryhard',
  'crybaby', 'snowflake', 'cloutchaser',

  // ==========================================================
  // HUMILIATION TERMS
  // ==========================================================
  'loser', 'pathetic', 'embarrassment',
  'coward', 'spineless', 'weakling'
];

// Adult / NSFW terms (small penalty 10-30)
// Split into two categories to handle false positives from short collision-prone words

// SHORT COLLISION-PRONE WORDS (require word boundaries)
// These commonly appear as false positives inside longer legitimate words
// Examples: ass in "assassinate", sex in "Sussex", cum in "cucumber", tit in "titan"
const nsfwTermsShort = [
  'ass',           // word boundary required
  'sex',           // word boundary required
  'cum',           // word boundary required
  'tit',           // word boundary required (matches both tits, titties)
  'anal',          // word boundary required
  'dom'            // word boundary required (avoid collisions with domain, dominate, etc.)
];

// LONG EXPLICIT WORDS (can use substring matching safely)
// These are long and explicit enough that collisions are rare and usually intentional
const nsfwTermsLong = [
  // ==========================================================
  // GENERAL NSFW / ADULT CONTEXT
  // ==========================================================
  'nsfw', 'explicit', 'adult', 'mature', '18plus', 'only18',
  'sexy', 'horny', 'kinky', 'fetish',
  'bdsm', 'domme', 'submissive',

  // ==========================================================
  // SEXUAL TERMS (longer variants)
  // ==========================================================
  'sexual', 'nude', 'naked', 'strip', 'stripper',
  'camgirl', 'camboy', 'webcam', 'onlyfans', 'fansly',

  // ==========================================================
  // PORN / ADULT GENRES (clean + common)
  // ==========================================================
  'porn', 'xxx', 'hentai', 'ecchi',
  'yuri', 'yaoi', 'milf', 'gilf', 'bbw', 'amateur', 'latex', 'bondage', 'cosplay', 'roleplay',

  // ==========================================================
  // ADULT INDUSTRY / HOOKUP
  // ==========================================================
  'escort', 'callgirl', 'hookup', 'dating', 'swinger',
  'sugarbaby', 'sugardaddy', 'sugarmommy',
  'findom', 'paypig',

  // ==========================================================
  // SOFT EROTIC TERMS
  // ==========================================================
  'erotica', 'erotic', 'sensual', 'lovenude', 'boudoir',

  // ==========================================================
  // NSFW SLANG (non-hate)
  // ==========================================================
  'thirsttrap', 'baddie', 'instabaddie', 'babygirl',
  'onlyfansmodel', 'nsfwcreator', 'adultcreator',
  'cammodel', 'premiumsnap', 'premiumcontent',

  // ==========================================================
  // ANATOMICAL TERMS — NON-CLINICAL, SEXUAL CONTEXT
  // (no medical terms, no slurs, no violence)
  // ==========================================================
  'penis', 'dick', 'cock', 'nutsack',

  'vagina', 'pussy', 'coochie', 'cooch', 'cooter',
  'clit', 'clitoris',

  'boobs', 'titties', 'breasts',

  'butt', 'booty',

  // YES — You asked for it 🔽
  'anus', 'butthole',

  // ==========================================================
  // SEXUAL ACTIVITIES / POSITIONS (non-violent, common)
  // ==========================================================
  'handjob', 'blowjob', 'deepthroat',
  'doggystyle', 'cowgirl', 'reversecowgirl',
  'missionary', 'sext',

  // ==========================================================
  // MILD FETISH / CREATOR TERMS (safe)
  // ==========================================================
  'feetpics', 'footpics', 'footfetish',
  'lingerie', 'stockings', 'fishnets',
  'leather', 'ropeplay', 'spanking', 'tease', 'sensualmassage'
];

// Combined for backward compatibility
const nsfwTerms = [...nsfwTermsShort, ...nsfwTermsLong];

// Helper: Extract tokens from string (split on . _ - @)
function getTokens(str) {
  return str.toLowerCase().split(/[._\-@]+/).filter(t => t.length > 0)
}

// Helper: Check if domain root matches a brand
// Examples: nike.com, nike.co.uk, nikeinc.com all match "nike"
function doesDomainMatchBrand(domain, brand) {
  const domainLower = domain.toLowerCase()
  const tokens = getTokens(domainLower)
  const brandLower = brand.toLowerCase()

  // Check if brand appears as a token in the domain
  return tokens.some(token => token === brandLower)
}

// Slang whitelist
const slangWhitelist = new Set([
  'af', 'based', 'copypasta', 'cringe', 'derp', 'epic',
  'fail', 'fomo', 'geez', 'giga', 'gigachad', 'chad',

  'idk', 'idc', 'imo', 'imho', 'irl', 'jk', 'lfg',
  'lol', 'lmao', 'lmfao', 'rofl', 'kek', 'kekw',

  'pog', 'poggers', 'pepe', 'sus', 'yeet', 'yolo',
  'badass', 'dumbass', 'smartass', 'jackass', 'pissed', 'salty',
  'thicc', 'chonky', 'snacc', 'vibe', 'vibes', 'mood',

  'noob', 'n00b', 'pwn', 'pwned', 'gg', 'ggwp', 'meta',
  'nerf', 'buff', 'loot', 'grind', 'toxic', 'camping',

  'frontend', 'backend', 'fullstack', 'debug', 'coder', 'hacker',

  'podcast', 'vlogger', 'blogger', 'youtuber',
  'fitness', 'gymrat',

  'gonna', 'gotta', 'wanna', 'kinda', 'sorta', 'dunno',
  'lemme', 'gimme', 'ain\'t', 'prolly', 'tryna',

  'foodie', 'coffee', 'latte', 'brunch',

  'dope', 'cool', 'awesome', 'rad', 'fire', 'lit',
  'vibing', 'chill', 'hype', 'goated',

  'omg', 'wtf', 'brb', 'np', 'ffs', 'smh', 'ngl', 'fr', 'tfw',
  'uwu', 'owo', 'lil', 'boi', 'doggo', 'pupper',
  'heckin', 'floof', 'heck', 'whoops', 'yikes', 'oop', 'welp',
  'bruh', 'shitposter', 'shitposting', 'shitpost'
])

// Keyboard walks
const keyboardWalks = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl',
  'zxcvbn', 'zxcvbnm', 'poiuyt', 'lkjhgf',
  'mnbvcx', 'qazwsx', 'wsxedc', 'edcrfv'
]


// Brand impersonation patterns
const brandImpersonationPatterns = [
  'apple', 'microsoft', 'google', 'amazon', 'meta', 'facebook',
  'intel', 'nvidia', 'amd', 'ibm', 'oracle', 'salesforce', 'adobe',
  'twitter', 'x', 'instagram', 'tiktok', 'snapchat', 'linkedin',
  'whatsapp', 'telegram', 'discord', 'slack', 'zoom',
  'netflix', 'spotify', 'hulu', 'disney', 'youtube', 'twitch',
  'paypal', 'chase', 'wellsfargo', 'bankofamerica',
  'bofa', 'citi', 'capitalone', 'visa', 'mastercard',
  'coinbase', 'kraken', 'gemini', 'binance',
  'uber', 'lyft', 'airbnb', 'booking', 'expedia', 'hotels',
  'ebay', 'etsy', 'wayfair', 'ikea', 'costco',
  'walmart', 'target', 'bestbuy', 'newegg',
  'github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'heroku',
  'aws', 'azure', 'gcp', 'notion', 'asana',
  'trello', 'monday', 'dropbox', 'onedrive'
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

// NSFW term matcher with word boundary awareness
// Short collision-prone words require boundaries; longer words use substring matching
function matchNsfwTerms(localLower, normalized) {
  const matched = []

  // Check short collision-prone words with boundaries
  // Boundary = start/end of string OR any non-letter character
  for (const term of nsfwTermsShort) {
    const boundaryRegex = new RegExp(`(^|[^a-z])${term}([^a-z]|$)`)
    if (boundaryRegex.test(localLower)) {
      matched.push(term)
    }
  }

  // Check longer explicit words with substring matching (safe, low false-positive rate)
  for (const term of nsfwTermsLong) {
    if (normalized.includes(term) || localLower.includes(term)) {
      matched.push(term)
    }
  }

  return matched
}

// Abusive content
// Detect content severity level with concentration counting (returns object with penalty tiers)
function detectContentSeverity(localPart) {
  const localLower = localPart.toLowerCase()

  if (standardSystemEmails.has(localLower)) {
    return { isHateful: false, isAbusive: false, isNsfw: false, hatefulCount: 0, abusiveCount: 0, nsfwCount: 0, hatefulTermsMatched: [], abusiveTermsMatched: [], nsfwTermsMatched: [] }
  }

  // Don't penalize slang whitelist (it just bypasses gibberish detection)
  const normalized = localLower.replace(/\d/g, '')

  // Track matched terms for breakdown display
  const hatefulTermsMatched = hatefulTerms.filter(term => normalized.includes(term) || localLower.includes(term))
  const abusiveTermsMatched = abusiveTerms.filter(term => normalized.includes(term) || localLower.includes(term))
  const nsfwTermsMatched = matchNsfwTerms(localLower, normalized)

  return {
    isHateful: hatefulTermsMatched.length > 0,
    isAbusive: abusiveTermsMatched.length > 0,
    isNsfw: nsfwTermsMatched.length > 0,
    hatefulCount: hatefulTermsMatched.length,
    abusiveCount: abusiveTermsMatched.length,
    nsfwCount: nsfwTermsMatched.length,
    hatefulTermsMatched,
    abusiveTermsMatched,
    nsfwTermsMatched
  }
}

function hasAbusiveContent(localPart) {
  const severity = detectContentSeverity(localPart)
  return severity.isHateful || severity.isAbusive || severity.isNsfw
}

// Username semantics (no heavy gibberish logic here)
function analyzeUsernameSemantics(localPart, domain = null) {
  const insights = {
    isLikelyPersonalName: false,
    hasAbusiveContent: false,
    contentSeverity: { isHateful: false, isAbusive: false, isNsfw: false },
    hasAdultContent: false,
    isBrandImpersonation: false,
    isRoleBasedEmail: false,
    isUnicodeUsername: false,
    isStandardSystemEmail: false,
    semanticBonus: 0,
    semanticPenalty: 0,
    warnings: [],
    hatefulTermsMatched: [],
    abusiveTermsMatched: [],
    nsfwTermsMatched: [],
    brandImpersonationMatched: []
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
  // Enhanced personal name detection
  const matchesPersonalNamePattern = personalNamePatterns.some(pattern => pattern.test(localPart))

  // Additional heuristic: check for legitimate name+number patterns
  // Examples: kylemann90, john123, sarah2024, kyle-mann90
  const isLikelyNamePlusNumber = /^[a-z]{3,}[0-9]{1,4}$/i.test(localPart) ||  // kylemann90
                                  /^[a-z]{3,}[-][a-z]{2,}[0-9]{1,4}$/i.test(localPart)  // kyle-mann90

  if (!isRoleBased && (matchesPersonalNamePattern || isLikelyNamePlusNumber)) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 20
    insights.warnings.push('Likely personal name pattern')
  }

  // Detect content severity
  const severity = detectContentSeverity(localPart)
  insights.contentSeverity = severity
  insights.hasAbusiveContent = severity.isHateful || severity.isAbusive || severity.isNsfw
  insights.hatefulTermsMatched = severity.hatefulTermsMatched || []
  insights.abusiveTermsMatched = severity.abusiveTermsMatched || []
  insights.nsfwTermsMatched = severity.nsfwTermsMatched || []

  // Apply penalty based on severity with concentration multiplier
  if (severity.isHateful) {
    // Hateful: 60-90 penalty, increases with concentration
    const concentrationFactor = Math.min(severity.hatefulCount, 3) // Cap at 3x multiplier
    const basePenalty = 60
    const concentrationBonus = (severity.hatefulCount - 1) * 10
    insights.semanticPenalty -= Math.min(basePenalty + concentrationBonus, 90)
    insights.warnings.push('Contains hateful or slur language')
  } else if (severity.isAbusive) {
    // Abusive (non-slur): 15-30 penalty, increases with concentration
    // These are real humans (just edgy/rude), not bots or malicious
    const basePenalty = 15
    const concentrationBonus = (severity.abusiveCount - 1) * 8
    insights.semanticPenalty -= Math.min(basePenalty + concentrationBonus, 30)
    insights.warnings.push('Contains abusive or hostile language')
  } else if (severity.isNsfw) {
    // NSFW/Adult: 5-15 penalty, increases with concentration
    // Quirky but legitimate human emails (Reddit users, creators, etc.)
    const basePenalty = 5
    const concentrationBonus = (severity.nsfwCount - 1) * 3
    insights.semanticPenalty -= Math.min(basePenalty + concentrationBonus, 15)
    insights.warnings.push('Contains adult or explicit content')
  }


  if (!insights.hasAbusiveContent) {
    const lower = localLower
    const hasAdult = nsfwTerms.some(term => lower.includes(term))
    if (hasAdult) {
      insights.hasAdultContent = true
    }
  }

  // Brand impersonation: Only flag when brand exists in localPart but domain doesn't match
  // Examples:
  //   john.nike@nike.com        ✅ No penalty (domain matches)
  //   john.nike@gmail.com       ⚠️  Mild risk (brand-domain mismatch)
  //   alex.appleton@gmail.com   ✅ No penalty (appleton ≠ apple, natural word)
  const domainLower = domain ? domain.toLowerCase() : ''

  // Get tokens from localPart for exact matching
  const localPartTokens = getTokens(localPart)

  // Track brands that appear in localPart but DON'T match the domain
  const mismatchedBrands = []
  brandImpersonationPatterns.forEach(brand => {
    const brandLower = brand.toLowerCase()

    // Check if brand appears as a token in the localPart (exact match, not substring)
    const brandAsToken = localPartTokens.some(token => token === brandLower)

    // Also check for substring match with word boundaries (e.g., "amazon" in "assamazon")
    // Brand must be preceded/followed by non-letter or string boundary
    const brandAsSubstring = localLower.match(new RegExp(`(^|[^a-z])${brandLower}([^a-z]|$)`))

    // Check if the same brand appears in the domain
    const brandInDomain = doesDomainMatchBrand(domainLower, brand)

    // Only flag if brand is in localPart (as token or substring) BUT NOT in domain (brand-domain mismatch)
    if ((brandAsToken || brandAsSubstring) && !brandInDomain) {
      mismatchedBrands.push(brand)
    }
  })

  if (mismatchedBrands.length > 0) {
    insights.isBrandImpersonation = true
    insights.brandImpersonationMatched = mismatchedBrands
    // Note: penalty is applied in calculateCampaignScore with gates
    // This just marks the detection
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

// Calculate Campaign Safety Score (risk-based exclusion model)
// Replaces identity detection with concrete behavioral risk assessment
// DHS/LCS Architecture: Calculate Campaign Readiness Score
// Step 1: Compute DHS (domain health) independently
// Step 2: Compute LCS (local-part credibility) independently
// Step 3: Apply LCS → score cap
// Step 4: Final score = min(DHS, cap)
// This ensures bad identity cannot be rescued by good domain
function calculateCampaignScore(options) {
  const {
    localPart,
    domain,
    semantics,
    isRoleBasedEmail,
    isDomainCorporate,
    isFreemailProvider,
    tldQuality,
    deliverabilityScore,
    isDisposable,
    gibberishScore,
    gibberishBreakdown = []
  } = options

  // Hard fail: email cannot receive mail
  if (deliverabilityScore === 0) {
    return {
      campaignScore: 0,
      label: 'Poor',
      breakdown: [{ label: 'Not Deliverable', points: -100, description: 'Email is unreachable' }],
      lcsScore: null
    }
  }

  // Hard fail: disposable/temporary email
  // These are categorically unsuitable for campaigns — not a gradient penalty
  if (isDisposable) {
    return {
      campaignScore: 0,
      label: 'Poor',
      breakdown: [{ label: 'Disposable/Temporary Email', points: -100, description: 'Uses temporary or disposable email service — unsuitable for campaigns' }],
      lcsScore: null
    }
  }

  // ============ STEP 1: COMPUTE LCS (Local-Part Credibility Score) ============
  // SINGLE SOURCE OF TRUTH: lcsScore is computed here with ALL penalties applied
  // gibberishBreakdown must contain all penalties that should reduce LCS
  const lcsResult = calculateLocalPartCredibility({
    localPart,
    semantics,
    isRoleBasedEmail,
    isDisposable,
    gibberishScore,
    gibberishBreakdown
  })
  const lcsScore = lcsResult.score  // <-- AUTHORITATIVE LCS VALUE
  const lcsBreakdown = lcsResult.breakdown

  // ============ STEP 2: COMPUTE CAMPAIGN SCORE ============
  // Frontend will calculate DHS and determine final score
  // For now, backend returns LCS as the campaign readiness base
  const campaignScore = lcsScore
  let label = 'Very Poor'
  if (campaignScore >= 90) label = 'Excellent'
  else if (campaignScore >= 75) label = 'Good'
  else if (campaignScore >= 55) label = 'Risky'
  else if (campaignScore >= 30) label = 'Poor'
  else label = 'Very Poor'

  // ============ BUILD BREAKDOWN ============
  // Frontend will add DHS section before LCS; backend only provides LCS breakdown
  const breakdown = [
    { label: 'Local-Part Credibility Score', points: lcsScore, description: 'Username quality & engagement likelihood (base: 100)', isSectionHeader: true }
  ]

  // Add LCS breakdown items
  for (const item of lcsBreakdown) {
    breakdown.push(item)
  }

  breakdown.push({ label: '', points: 0, description: '', isSeparator: true })
  breakdown.push({ label: 'Final Campaign Readiness Score', points: Math.round(campaignScore), description: 'Frontend will calculate: min(Domain Health Score, Local-Part Credibility Score)' })

  return {
    campaignScore: Math.round(campaignScore),
    label,
    breakdown,
    // AUTHORITATIVE SCORE - Frontend uses this and will calculate final score with DHS
    lcsScore: Math.round(lcsScore)       // Local-Part Credibility Score (identity, base 100) - SINGLE SOURCE OF TRUTH
  }
}

// Helper: Check if local part matches penalized role pattern
function isPenalizedRole(localPart) {
  const localLower = localPart.toLowerCase()
  const penalizedRolePatterns = ['abuse', 'postmaster', 'security', 'compliance', 'legal', 'noc', 'mailer-daemon', 'noreply', 'do-not-reply', 'bounce', 'root', 'hostmaster', 'webmaster']
  return penalizedRolePatterns.some(pattern =>
    localLower === pattern ||
    localLower.startsWith(pattern + '+') ||
    localLower.startsWith(pattern + '.')
  )
}

// Determine domain mail receivability status (checks for MX + A/AAAA)
function getDomainMailStatus(domain) {
  // Note: Actual DNS checks happen on the frontend/backend API
  // This provides the structure that will be populated by DNS queries
  return {
    mx: null,        // boolean: has MX records
    fallback: null,  // boolean: has A/AAAA fallback
    receivable: null, // boolean: can receive mail (mx || fallback)
    mailHostType: null // 'mx' | 'fallback' | 'none'
  }
}

// Async DNS lookup to determine mail host type
async function getMailHostType(domain) {
  if (!dns) {
    return { mailHostType: null, hasMx: false, hasARecord: false, hasAAAARecord: false }
  }

  // Skip DNS checks in local dev to allow testing scoring without DNS
  const isLocalDev = process.env.NODE_ENV === 'development' && (
    process.env.VERCEL_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'preview'
  )

  if (isLocalDev) {
    console.log(`[Local Dev] Skipping DNS check for ${domain}`)
    return { mailHostType: null, hasMx: false, hasARecord: false, hasAAAARecord: false }
  }

  try {
    const timeoutMs = 3000
    const createTimeoutPromise = () => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs)
    )

    // 1. Try MX records first
    try {
      const mxResult = await Promise.race([
        dns.resolveMx(domain),
        createTimeoutPromise()
      ])

      if (mxResult && mxResult.length > 0) {
        return { mailHostType: 'mx', hasMx: true, hasARecord: false, hasAAAARecord: false }
      }
    } catch (e) {
      // MX lookup failed, will try A/AAAA
    }

    // 2. If no MX, try A records
    try {
      const aResult = await Promise.race([
        dns.resolve4(domain),
        createTimeoutPromise()
      ])

      if (aResult && aResult.length > 0) {
        return { mailHostType: 'fallback', hasMx: false, hasARecord: true, hasAAAARecord: false }
      }
    } catch (e) {
      // A lookup failed, try AAAA
    }

    // 3. If no A records, try AAAA records
    try {
      const aaaaResult = await Promise.race([
        dns.resolve6(domain),
        createTimeoutPromise()
      ])

      if (aaaaResult && aaaaResult.length > 0) {
        return { mailHostType: 'fallback', hasMx: false, hasARecord: false, hasAAAARecord: true }
      }
    } catch (e) {
      // AAAA lookup failed
    }

    // No mail server records found
    return { mailHostType: 'none', hasMx: false, hasARecord: false, hasAAAARecord: false }
  } catch (error) {
    // If anything goes wrong, return null (skip DNS adjustment to deliverability)
    return { mailHostType: null, hasMx: false, hasARecord: false, hasAAAARecord: false }
  }
}

// Grade downgrade helper (for gibberish)
function downgradeGrade(grade) {
  const order = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
  const idx = order.indexOf(grade)
  if (idx === -1) return grade
  if (idx === order.length - 1) return grade
  return order[idx + 1]
}

// ============ DHS / LCS SCORING ARCHITECTURE ============

// Calculate Domain Health Score (DHS)
// Purpose: Infrastructure & domain maturity
// Base: 77 (domain exists and is receivable = solid foundation)
// Includes: TLD quality, corporate domain status, DNS checks (added by component)

// Calculate Local-Part Credibility Score (LCS)
// Purpose: Username quality / engagement likelihood
// Base: 100 (assume credibility until patterns indicate otherwise)
// LCS only goes down, never up (except reaching max)
function calculateLocalPartCredibility(options) {
  const {
    localPart,
    semantics,
    isRoleBasedEmail,
    isDisposable,
    gibberishScore,
    gibberishBreakdown = []
  } = options

  let lcs = 100
  const breakdown = []

  // ===== HEAVY CREDIBILITY RISKS =====

  // Hateful language → -40
  if (semantics.contentSeverity.isHateful) {
    lcs -= 40
    breakdown.push({ label: 'Hateful Language', points: -40, description: 'Contains hate speech' })
    if (semantics.hatefulTermsMatched && semantics.hatefulTermsMatched.length > 0) {
      for (const term of semantics.hatefulTermsMatched) {
        breakdown.push({ label: `"${term}"`, points: 0, description: '', isSubItem: true })
      }
    }
  }

  // Abusive language → -30
  if (semantics.contentSeverity.isAbusive) {
    lcs -= 30
    breakdown.push({ label: 'Abusive Language', points: -30, description: 'Contains profanity/hostile terms' })
    if (semantics.abusiveTermsMatched && semantics.abusiveTermsMatched.length > 0) {
      for (const term of semantics.abusiveTermsMatched) {
        breakdown.push({ label: `"${term}"`, points: 0, description: '', isSubItem: true })
      }
    }
  }

  // Compliance/system role → -30
  const localLower = localPart.toLowerCase()
  const penalizedRolePatterns = ['abuse', 'postmaster', 'security', 'compliance', 'legal', 'noc', 'mailer-daemon', 'noreply', 'do-not-reply', 'bounce', 'root', 'hostmaster', 'webmaster']
  const isPenalizedRole = penalizedRolePatterns.some(pattern =>
    localLower === pattern ||
    localLower.startsWith(pattern + '+') ||
    localLower.startsWith(pattern + '.')
  )

  if (isPenalizedRole) {
    lcs -= 30
    breakdown.push({ label: 'Compliance/System Role', points: -30, description: 'Abuse monitoring or automated system mailbox' })
  }

  // Brand-domain mismatch → -15 to -20
  if (semantics.isBrandImpersonation && semantics.brandImpersonationMatched && semantics.brandImpersonationMatched.length > 0) {
    const penalty = semantics.brandImpersonationMatched.length > 1 ? 20 : 15
    lcs -= penalty
    breakdown.push({ label: 'Brand-Domain Mismatch', points: -penalty, description: 'Brand name appears but does not match domain' })
    for (const brand of semantics.brandImpersonationMatched) {
      breakdown.push({ label: brand, points: 0, description: '', isSubItem: true })
    }
  }

  // ===== MEDIUM RISKS =====

  // Adult/NSFW → -10
  if (semantics.contentSeverity.isNsfw) {
    lcs -= 10
    breakdown.push({ label: 'Adult Content', points: -10, description: 'Contains explicit terms' })
    if (semantics.nsfwTermsMatched && semantics.nsfwTermsMatched.length > 0) {
      for (const term of semantics.nsfwTermsMatched) {
        breakdown.push({ label: `"${term}"`, points: 0, description: '', isSubItem: true })
      }
    }
  }

  // Gibberish patterns → -5 to -70 (via signal-based escalation)
  // ALL penalties must be applied here before finalizing LCS
  if (gibberishBreakdown && gibberishBreakdown.length > 0) {
    breakdown.push({ label: 'Gibberish Patterns', points: 0, description: '' })
    for (const item of gibberishBreakdown) {
      lcs -= item.points
      breakdown.push({ label: item.pattern, points: -item.points, description: '', isSubItem: true })
    }
  }

  // ============ FINALIZE LCS: Single source of truth ============
  // This is the authoritative LCS score - it will be:
  // 1. Displayed to user
  // 2. Used to derive credibility cap
  // 3. Used to calculate final score
  // NO further modifications to LCS should happen after this
  const finalLcsScore = Math.max(0, Math.min(100, lcs))

  return {
    score: finalLcsScore,
    breakdown
  }
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

  // Brand impersonation is ALWAYS high risk - whether on freemail or corporate domain
  if (hasBrandImpersonation) return 'Very High'

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

// Main per-email validator (now async to support DNS lookups)
async function validateSingleEmail(trimmedEmail) {
  const baseInvalid = (issues, opts = {}) => ({
    email: trimmedEmail,
    normalized: trimmedEmail.toLowerCase(),
    valid: false,
    isInvalid: true,
    isDisposable: opts.isDisposable || false,
    campaignScore: 0,
    campaignReadiness: 'Poor',
    campaignBreakdown: [{ label: 'Not Deliverable', points: -100, description: 'Email is unreachable' }],
    roleBasedEmail: false,
    roleBasedType: null,
    issues,
    usernameHeuristics: [],
    trustworthinessWarnings: opts.trustworthinessWarnings || [],
    hasBadReputation: false,
    tldQuality: null,
    businessEmail: null,
    gibberishScore: 0,
    abusiveScore: 0,
    phishingRisk: 'N/A',
    deliverabilityScore: 0,
    deliverabilityLabel: 'Guaranteed bad',
    trustworthinessScore: 0,
    trustworthinessLabel: 'Invalid'
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

  // CHECK FOR DISPOSABLE DOMAINS FIRST (before all other checks)
  // This ensures disposable emails are caught regardless of other syntax errors
  const domainLower = domain.toLowerCase()
  let isDisposable = false
  isDisposable = knownDisposableDomains.some(disposable => domainLower.includes(disposable))

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

  // Collect all issues before returning (don't return early)
  const collectedIssues = [...issues] // Start with syntax errors if any
  let hasAnyIssues = hasSyntaxError

  const localLower = localPart.toLowerCase()
  // Option B1: Apply NFC normalization for Unicode support
  const normalizedLocalPart = localPart.toLowerCase().normalize('NFC')
  const normalizedDomain = domainLower.normalize('NFC')
  const normalizedEmail = `${normalizedLocalPart}@${normalizedDomain}`

  // CHECK FOR RESERVED DOMAINS (add to issues, don't return yet)
  if (reservedDomains.has(domainLower)) {
    collectedIssues.push(`"${domain}" is a reserved example domain — not deliverable`)
    hasAnyIssues = true
  }

  // If we have any issues so far (syntax or reserved), add disposable if applicable and return
  if (hasAnyIssues) {
    if (isDisposable && !collectedIssues.includes('Disposable/temporary email service — unsuitable for campaigns')) {
      collectedIssues.push('Disposable/temporary email service — unsuitable for campaigns')
    }
    return baseInvalid(collectedIssues, {
      hasSyntaxError,
      isDisposable,
      deliverabilityWarnings: collectedIssues
    })
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
    // Include disposable issue if applicable
    const allIssues = [...issues, ...tldIssues]
    if (isDisposable && !allIssues.includes('Disposable/temporary email service — unsuitable for campaigns')) {
      allIssues.push('Disposable/temporary email service — unsuitable for campaigns')
    }
    return baseInvalid(allIssues, {
      deliverabilityWarnings: tldIssues,
      hasSyntaxError: hasSyntaxError,
      isDisposable
    })
  }

  // SEMANTICS (isDisposable already checked earlier)
  const semantics = analyzeUsernameSemantics(localPart, domain)

  // Apply semantic bonuses/penalties
  if (semantics.semanticBonus > 0) {
    trustworthinessScore = Math.min(100, trustworthinessScore + semantics.semanticBonus)
  }

  // Domain-sensitivity scoring with multipliers
  let adjustedSemanticPenalty = semantics.semanticPenalty
  if (semantics.semanticPenalty < 0) {
    let multiplier = 1.0
    const isDomainCorporateTemp = corporateProviderDomains.has(domainLower)

    // High-trust TLDs (non-corporate) amplify penalties for abnormal content
    if (!isDomainCorporateTemp && tldQuality === 'high-trust' && semantics.contentSeverity &&
        (semantics.contentSeverity.isAbusive || semantics.contentSeverity.isNsfw || semantics.contentSeverity.isHateful)) {
      multiplier = 1.5 // 50% stronger penalty for high-trust TLDs with abusive content
    }

    adjustedSemanticPenalty = Math.round(semantics.semanticPenalty * multiplier)
    trustworthinessScore = Math.max(0, trustworthinessScore + adjustedSemanticPenalty)
  }

  // HARD FAIL: Disposable/temporary emails
  // These are categorically unsuitable for campaigns, regardless of other validation
  if (isDisposable) {
    return baseInvalid(['Disposable/temporary email service — unsuitable for campaigns'], {
      isDisposable: true
    })
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

  // Corporate domains with abnormal content should be nearly untrustworthy
  // (Real corporations NEVER assign such usernames)
  if (isDomainCorporate && semantics.contentSeverity) {
    if (semantics.contentSeverity.isHateful) {
      // Hateful slurs on corporate domain: impossible (set to 0)
      trustworthinessScore = 0
    } else if (semantics.contentSeverity.isAbusive) {
      // Abusive language on corporate domain: massive red flag (-60 penalty)
      // Corporations forbid such language in official emails
      trustworthinessScore = Math.max(0, trustworthinessScore - 60)
    } else if (semantics.contentSeverity.isNsfw) {
      // NSFW/adult on corporate domain: extremely suspicious (-40 penalty)
      // Corporations never assign such usernames to official mailboxes
      trustworthinessScore = Math.max(0, trustworthinessScore - 40)
    }
  }

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
  // Strict framework: only penalize roles where sending is genuinely risky
  // Normal business roles (sales, support, info, etc.) are neutral
  // Only penalize: compliance/abuse monitoring + system/automated roles
  let roleMatch = null
  let roleTrustPenalty = 0
  let isRoleBasedEmail = false
  const hasUnicodeInLocal = /[^\x00-\x7F]/.test(localPart)

  if (!hasUnicodeInLocal) {
    // Only roles that should be penalized (strict list)
    const penalizedRoles = [
      // Compliance/abuse monitoring roles (-25 to -40)
      // These are monitored inboxes designed to receive complaints
      { patterns: ['abuse', 'abuse+', 'abuse.'], role: 'abuse', penalty: -30 },
      { patterns: ['postmaster', 'postmaster+'], role: 'postmaster', penalty: -35 },
      { patterns: ['security', 'security+', 'security.'], role: 'security', penalty: -30 },
      { patterns: ['compliance', 'compliance+'], role: 'compliance', penalty: -35 },
      { patterns: ['legal', 'legal+', 'legal.'], role: 'legal', penalty: -30 },
      { patterns: ['noc', 'noc+', 'noc.'], role: 'noc', penalty: -25 },

      // System/automated roles (-15 to -25)
      // These often auto-reject or are unmonitored
      { patterns: ['mailer-daemon', 'mailer-daemon+'], role: 'mailer-daemon', penalty: -20 },
      { patterns: ['noreply', 'no-reply', 'do-not-reply'], role: 'noreply', penalty: -20 },
      { patterns: ['bounce', 'bounce+'], role: 'bounce', penalty: -15 },
      { patterns: ['root', 'root+'], role: 'root', penalty: -20 },
      { patterns: ['hostmaster', 'hostmaster+'], role: 'hostmaster', penalty: -20 },
      { patterns: ['webmaster', 'webmaster+'], role: 'webmaster', penalty: -15 }
    ]

    for (const check of penalizedRoles) {
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

    // Also detect neutral business roles (for identification, but no penalty)
    if (!isRoleBasedEmail) {
      const neutralRoles = ['sales', 'info', 'support', 'help', 'billing', 'accounts', 'admin', 'office', 'contact', 'marketing', 'hello', 'team', 'jobs', 'careers', 'press']
      for (const role of neutralRoles) {
        if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
          roleMatch = role
          roleTrustPenalty = 0 // Neutral - no penalty
          isRoleBasedEmail = true
          break
        }
      }
    }
  }

  if (isRoleBasedEmail) {
    if (roleTrustPenalty < 0) {
      trustworthinessScore = Math.max(0, trustworthinessScore + roleTrustPenalty)
      trustworthinessWarnings.push(`Role-based email (${roleMatch})`)
    }
  }

  // KEYWORD-BASED PENALTIES (Context-Aware)
  // Three separate classes with different rules and contexts

  // CLASS 1: Hard Bot/Test Keywords (Always penalize everywhere)
  if (hardBotTestKeywords.has(localLower)) {
    trustworthinessScore = Math.max(0, trustworthinessScore - 30)
    trustworthinessWarnings.push('Bot/test account keyword detected')
  }

  // CLASS 2: Suspicious Intent Keywords (Penalize ONLY on freemail)
  // These are legitimate on corporate (abuse@company.com, spam@company.com are real mailboxes)
  if (isFreemailProvider(domainLower) && suspiciousIntentKeywords.has(localLower)) {
    trustworthinessScore = Math.max(0, trustworthinessScore - 15)
    trustworthinessWarnings.push('Suspicious intent keyword on freemail domain')
  }

  // CLASS 3: Impossible/Red-Flag Keywords on Corporate Domains
  // Real corporations never assign these usernames to official mailboxes
  if (isDomainCorporate && corporateRedFlagKeywords.has(localLower)) {
    trustworthinessScore = 0
    trustworthinessWarnings.push('Impossible username for corporate domain (red-flag keyword)')
  }

  // CORPORATE DOMAIN TRUST HIERARCHY
  // Corporate emails must follow strict naming conventions
  if (isDomainCorporate && !semantics.hasAbusiveContent) {
    const isDepartmental = departmentalWords.has(localLower)
    const looksValidForCorporate =
      semantics.isLikelyPersonalName ||
      isRoleBasedEmail ||
      isDepartmental

    if (!looksValidForCorporate) {
      // Corporate domain with unknown/random word username
      // This is statistically very unlikely in real enterprises
      trustworthinessScore = Math.max(0, trustworthinessScore - 30)
      trustworthinessWarnings.push('Unusual username for corporate domain')
    }
  }

  // GIBBERISH / USERNAME HEURISTICS
  const usernameHeuristics = []
  const gibberishBreakdown = [] // Track individual gibberish patterns and points
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

  // === GIBBERISH DETECTION (Signal-Based Escalation) ===
  // Count how many structural indicators of gibberish/non-human usernames are present.
  // Each signal counts as 1 vote. The penalty curve accelerates with signal count.

  let gibberishSignalCount = 0
  let gibberishSignalNames = []

  // Check for keyboard walk
  const isKeyboardWalk = !hasUnicodeInUsername && keyboardWalks.some(seq => localLower.includes(seq))
  if (isKeyboardWalk) {
    gibberishSignalCount++
    gibberishSignalNames.push('Keyboard walk')
    usernameHeuristics.push('Username appears to be a keyboard sequence pattern')
    gibberishBreakdown.push({ pattern: 'Keyboard walk', points: 0 })
    trustworthinessScore = Math.max(0, trustworthinessScore - 20)
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
    const hasLetters = /[a-zA-Z]/.test(localPart)
    const hasNumbers = /\d/.test(localPart)
    const hasSpecial = /[^a-zA-Z0-9.-]/.test(localPart)
    const entropyIndicators = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length

    const trigrams = new Map()
    for (let i = 0; i <= localLower.length - 3; i++) {
      const trigram = localLower.substring(i, i + 3)
      trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1)
    }
    const repeatedTrigrams = Array.from(trigrams.values()).filter(count => count >= 2).length

    const skipClusterCheck =
      semantics.isLikelyPersonalName ||
      isMultiPartName ||
      /[-']/i.test(localPart) ||
      vowelRatioLocal > 0.25

    // Signal 1: Low Pronounceability (merged vowel + consonant cluster detection)
    // Fires if ANY of these are true:
    // - vowel ratio < 15%
    // - 4+ consonants in any 5-char window
    // - total vowels < 2 for length >= 6
    const totalVowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
    const isLowPronounceable =
      vowelRatioLocal < 0.15 ||
      (totalVowelsInLocal < 2 && localPart.length >= 6)

    let hasHighConsonantCluster = false
    if (!skipClusterCheck) {
      for (let i = 0; i <= localLower.length - 5; i++) {
        const window = localLower.substring(i, i + 5)
        const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
        if (consonantCount >= 4) {
          hasHighConsonantCluster = true
          break
        }
      }
    }

    // Fire once if unpronounceable by any measure
    if (isLowPronounceable || hasHighConsonantCluster) {
      gibberishSignalCount++
      gibberishSignalNames.push('Low Pronounceability')
      usernameHeuristics.push('Low vowel ratio or consonant cluster')
      gibberishBreakdown.push({ pattern: 'Low Pronounceability', points: 0 })
    }

    // Signal 2: Multiple special characters (2+)
    if (specialCharsInLocal >= 2) {
      gibberishSignalCount++
      gibberishSignalNames.push('Multiple special chars')
      usernameHeuristics.push('Multiple special characters')
      gibberishBreakdown.push({ pattern: 'Multiple special chars', points: 0 })
    }

    // Signal 3: High entropy (3+ character types)
    if (entropyIndicators >= 3) {
      gibberishSignalCount++
      gibberishSignalNames.push('High entropy indicators')
      usernameHeuristics.push('High character entropy')
      gibberishBreakdown.push({ pattern: 'High entropy indicators', points: 0 })
    }

    // Signal 4: Exceptionally long (>32 chars)
    if (localPart.length > 32) {
      gibberishSignalCount++
      gibberishSignalNames.push('Exceptionally long')
      usernameHeuristics.push('Exceptionally long username')
      gibberishBreakdown.push({ pattern: 'Exceptionally long', points: 0 })
      trustworthinessScore = Math.max(0, trustworthinessScore - 10)
    }

    if (localPart.length < 3) {
      trustworthinessScore = Math.max(0, trustworthinessScore - 5)
      trustworthinessWarnings.push('Unusually short username')
    }

    // Signal 5: Numbers-only username
    if (/^\d+$/.test(localPart)) {
      gibberishSignalCount++
      gibberishSignalNames.push('Numbers-only')
      usernameHeuristics.push('Numbers-only username')
      gibberishBreakdown.push({ pattern: 'Numbers-only username', points: 0 })
      trustworthinessScore = Math.max(0, trustworthinessScore - 40)
    }

    // Signal 6: Bot/automated patterns
    const clearBotPatterns = ['bot', 'mailer', 'daemon', 'notification', 'alert', 'auto-', 'generated', 'tmp', 'temp']
    if (!semantics.isRoleBasedEmail && clearBotPatterns.some(pattern => localLower.includes(pattern))) {
      gibberishSignalCount++
      gibberishSignalNames.push('Bot patterns')
      usernameHeuristics.push('Matches automated patterns')
      gibberishBreakdown.push({ pattern: 'Bot/automated patterns', points: 0 })
    }

    // Signal 7: Repeated characters (3+ same char)
    if (/(.)\1{2,}/.test(localPart)) {
      gibberishSignalCount++
      gibberishSignalNames.push('Repeated characters')
      usernameHeuristics.push('Repeated characters detected')
      gibberishBreakdown.push({ pattern: 'Repeated characters', points: 0 })
      trustworthinessScore = Math.max(0, trustworthinessScore - 20)
    }

    // Signal 8: Scattered letter-number interspersing (looks generated/random like a6u7i88o)
    // Only trigger if we have meaningful mix of both letters and numbers (not just 1-2 of each)
    if (hasLetters && hasNumbers && localPart.length >= 6) {
      const letterPositions = []
      const numberPositions = []
      for (let i = 0; i < localPart.length; i++) {
        if (/[a-z]/i.test(localPart[i])) letterPositions.push(i)
        else if (/\d/.test(localPart[i])) numberPositions.push(i)
      }

      // Need at least 2+ of each type to measure scattering
      if (letterPositions.length >= 2 && numberPositions.length >= 2) {
        // Measure how scattered letters are (average gap between consecutive letters)
        const letterGaps = []
        for (let i = 1; i < letterPositions.length; i++) {
          letterGaps.push(letterPositions[i] - letterPositions[i - 1])
        }
        const avgLetterGap = letterGaps.reduce((a, b) => a + b, 0) / letterGaps.length

        // If letters are scattered far apart (gap > 1.5) AND numbers are present, it looks generated
        // Example: a6u7i88o has gaps of 2, 2, 2 (scattered)
        // Example: abc123 has gap of 1 (clustered) - won't trigger
        if (avgLetterGap > 1.5) {
          gibberishSignalCount++
          gibberishSignalNames.push('Scattered letter-number mix')
          usernameHeuristics.push('Letters and numbers heavily interspersed')
          gibberishBreakdown.push({ pattern: 'Scattered letter-number mix', points: 0 })
        }
      }
    }

    // Signal 9: Excessively fragmented or synthetic multi-segment patterns
    // Examples: first1.last2.dep3.company4 or a.b.c.d or u.a.t.p
    // Fires if ≥4 segments AND matches any sub-rule (9A, 9B, or 9C)
    const segmentDelimiters = /[._\-+]/
    const rawSegments = localPart.split(segmentDelimiters).filter(s => s.length > 0)
    const numSegments = rawSegments.length

    let signal9Fires = false

    if (numSegments >= 4) {
      // === SYNTHETIC PATTERN DETECTION (original Rule 9C from previous implementation) ===
      // Count synthetic indicators (digits, patterns, etc.)
      let syntheticIndicators = 0

      const segmentsWithDigits = rawSegments.filter(seg => /\d/.test(seg)).length
      if (segmentsWithDigits >= 2) {
        syntheticIndicators++
      }

      const shortSegments = rawSegments.filter(seg => seg.length <= 2).length
      if (shortSegments >= 2) {
        syntheticIndicators++
      }

      const digitPatternMatch = rawSegments.some(seg => /[a-z]+\d$/.test(seg.toLowerCase()))
      const hasRepeatingDigitPattern = digitPatternMatch && segmentsWithDigits >= 2
      if (hasRepeatingDigitPattern) {
        syntheticIndicators++
      }

      if (syntheticIndicators >= 2) {
        signal9Fires = true
      }

      // === FRAGMENTATION DETECTION (NEW) ===
      // Rule 9A: Ultra-short fragmentation (≥3 single-character segments)
      const ultraShortSegments = rawSegments.filter(seg => seg.length === 1).length
      if (ultraShortSegments >= 3) {
        signal9Fires = true
      }

      // Rule 9B: All-small segments (all segments ≤2 chars)
      const allSmall = rawSegments.every(seg => seg.length <= 2)
      if (allSmall) {
        signal9Fires = true
      }

      // Rule 9C: Mixed small segments (≥2 small + no large segments)
      const smallSegments = rawSegments.filter(seg => seg.length <= 2).length
      const largeSegments = rawSegments.filter(seg => seg.length >= 5).length
      if (smallSegments >= 2 && largeSegments === 0) {
        signal9Fires = true
      }

      // Fire signal once if ANY sub-rule matched (idempotent)
      if (signal9Fires) {
        gibberishSignalCount++
        gibberishSignalNames.push('Excessively fragmented multi-segment pattern')
        usernameHeuristics.push(`Excessively fragmented structure (${numSegments} segments) — machine-generated pattern likely`)
        gibberishBreakdown.push({ pattern: 'Excessively fragmented multi-segment pattern', points: 0 })
      }
    }

  }

  // === APPLY SIGNAL-BASED GIBBERISH PENALTY ===
  // Penalty curve (accelerating based on number of signals):
  // 9 unique signals: Low Pronounceability, Multiple special chars,
  // High entropy, Exceptionally long, Numbers-only, Bot patterns, Repeated characters,
  // Scattered letter-number mix, Many segments with synthetic pattern
  // 0 signals → 0
  // 1 signal → -5
  // 2 signals → -15 total
  // 3 signals → -30 total
  // 4 signals → -50 total
  // 5+ signals → -70 total (capped)
  let gibberishPenalty = 0
  if (gibberishSignalCount === 1) gibberishPenalty = -5
  else if (gibberishSignalCount === 2) gibberishPenalty = -15
  else if (gibberishSignalCount === 3) gibberishPenalty = -30
  else if (gibberishSignalCount === 4) gibberishPenalty = -50
  else if (gibberishSignalCount >= 5) gibberishPenalty = -70

  // Update gibberishBreakdown with penalty explanation
  // Note: points should be positive, as calculateLocalPartCredibility does lcs -= points
  if (gibberishPenalty !== 0) {
    gibberishBreakdown.push({
      pattern: `Gibberish signals (${gibberishSignalCount})`,
      points: Math.abs(gibberishPenalty),  // Convert to positive for subtraction
      isGibberishSummary: true
    })
  }

  // Apply penalty to trust score
  let usernameTrustPenalty = gibberishPenalty

  // Short username penalty (separate from gibberish)
  if (
    !hasUnicodeInUsername &&
    !semantics.isLikelyPersonalName &&
    !semantics.isUnicodeUsername &&
    !semantics.isStandardSystemEmail
  ) {
    if (localPart.length < 3) {
      trustworthinessScore = Math.max(0, trustworthinessScore - 5)
      trustworthinessWarnings.push('Unusually short username')
    }
  }

  // Apply trust penalty if present
  if (usernameTrustPenalty < 0 && !hasUnicodeInUsername) {
    trustworthinessScore = Math.max(0, trustworthinessScore + usernameTrustPenalty)
  }

  // Unicode usernames: track heuristics without penalties
  if (hasUnicodeInUsername) {
    if (/^\d+$/.test(localPart)) {
      usernameHeuristics.push('Numbers-only username')
    }
    if (/(.)\1{2,}/.test(localPart)) {
      usernameHeuristics.push('Repeated characters detected')
    }
  }



  // MAILCHECKER
  // Option B1: Skip MailChecker for Unicode emails (MailChecker doesn't support non-ASCII)
  // Also skip for disposable domains (we detect disposable separately now)
  let mailcheckerValid = true
  const hasUnicodeInEmail = /[^\x00-\x7F]/.test(trimmedEmail)
  if (typeof MailChecker !== 'undefined' && !hasUnicodeInEmail && !isDisposable) {
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

  // Adult content penalties are now handled in semantic penalty analysis above
  // (NSFW terms apply light penalties: -5 to -15)

  // Perfect trust cannot coexist with warnings/heuristics
  // Option B1: Don't apply this rule to Unicode usernames (they get neutral trust without penalties)
  if (
    !hasUnicodeInUsername &&
    trustworthinessScore === 100 &&
    (trustworthinessWarnings.length > 0 || usernameHeuristics.length > 0)
  ) {
    trustworthinessScore = Math.max(0, trustworthinessScore - 10)
  }

  const basicValid =
    issues.length === 0 &&
    !hasSyntaxError &&
    deliverabilityScore > 0 &&
    !isInvalid

  const finalValid = basicValid && (typeof MailChecker === 'undefined' ? true : mailcheckerValid)

  // SCORES
  // Penalty hierarchy with concentration: hateful (60-90) > abusive (30-50) > nsfw (5-20) > none (0)
  let abusiveScore = 0
  if (semantics.contentSeverity.isHateful) {
    // Scale 60-90 based on concentration
    const basePenalty = 60
    const concentrationBonus = Math.min((semantics.contentSeverity.hatefulCount - 1) * 10, 30)
    abusiveScore = basePenalty + concentrationBonus
  } else if (semantics.contentSeverity.isAbusive) {
    // Scale 30-50 based on concentration
    const basePenalty = 30
    const concentrationBonus = Math.min((semantics.contentSeverity.abusiveCount - 1) * 10, 20)
    abusiveScore = basePenalty + concentrationBonus
  } else if (semantics.contentSeverity.isNsfw) {
    // Scale 5-20 based on concentration
    const basePenalty = 5
    const concentrationBonus = Math.min((semantics.contentSeverity.nsfwCount - 1) * 5, 15)
    abusiveScore = basePenalty + concentrationBonus
  }

  // Calculate gibberishScore based on signal count (0-100 scale)
  // Signal count directly maps to risk: 0 signals = 0%, 5+ signals = 100%
  const gibberishScore = Math.min(100, Math.round((gibberishSignalCount / 5) * 100))

  // DNS LOOKUP FOR MX/A/AAAA RECORDS (affects deliverability score)
  // Only perform DNS lookup if email is valid and domain seems legitimate
  if (finalValid && deliverabilityScore > 0) {
    try {
      // Small debounce before DNS lookup to prevent excessive queries
      // while user is validating emails in quick succession
      await new Promise(resolve => setTimeout(resolve, 300))

      const { mailHostType } = await getMailHostType(domain)

      if (mailHostType === 'mx') {
        // MX records present - no penalty, keep deliverability score high
        deliverabilityScore = Math.max(deliverabilityScore, 95)
      } else if (mailHostType === 'fallback') {
        // A/AAAA records but no MX - RFC valid but weaker delivery
        const fallbackPenalty = 8
        deliverabilityScore = Math.max(0, deliverabilityScore - fallbackPenalty)
        if (!deliverabilityWarnings.includes('No MX records (fallback to A/AAAA)')) {
          deliverabilityWarnings.push('No MX records (fallback to A/AAAA)')
        }
      } else if (mailHostType === 'none') {
        // No mail server records - undeliverable
        deliverabilityScore = 0
        isInvalid = true
        if (!issues.includes('No mail server records (MX, A, or AAAA). Email cannot be delivered.')) {
          issues.push('No mail server records (MX, A, or AAAA). Email cannot be delivered.')
        }
        if (!deliverabilityWarnings.includes('No mail server records (MX, A, or AAAA)')) {
          deliverabilityWarnings.push('No mail server records (MX, A, or AAAA)')
        }
      }
      // If mailHostType is null, DNS lookup failed - skip adjustment
    } catch (error) {
      // DNS lookup error - skip adjustment, don't penalize
    }
  }

  // Recalculate validity after DNS lookup (in case deliverabilityScore or isInvalid was updated)
  const basicValidAfterDns =
    issues.length === 0 &&
    !hasSyntaxError &&
    deliverabilityScore > 0 &&
    !isInvalid
  const finalValidAfterDns = basicValidAfterDns && (typeof MailChecker === 'undefined' ? true : mailcheckerValid)

  // Calculate phishing risk (still used in output)
  let phishingRisk = 'Unknown'

  if (finalValidAfterDns) {
    const isFreemail = personalFreemailProviders.has(domainLower)
    if (semantics.isBrandImpersonation && isFreemail && isRoleBasedEmail) {
      trustworthinessScore = 0
      trustworthinessWarnings.push(
        'Brand impersonation on free email with role-based pattern (likely phishing)'
      )
    }

    phishingRisk = calculatePhishingRisk(
      localPart,
      domain,
      isRoleBasedEmail,
      isDomainCorporate,
      semantics.hasAbusiveContent,
      semantics.isBrandImpersonation
    )
  }

  // Calculate campaign readiness score
  const {
    campaignScore,
    label: campaignReadiness,
    breakdown: campaignBreakdown,
    lcsScore         // Local-Part Credibility Score
  } = calculateCampaignScore({
    localPart,
    domain,
    semantics,
    isRoleBasedEmail,
    isDomainCorporate,
    isFreemailProvider: isFreemailProvider(domainLower),
    tldQuality,
    deliverabilityScore,
    isDisposable,
    gibberishScore,
    gibberishBreakdown
  })

  return {
    email: trimmedEmail,
    normalized: normalizedEmail,

    // Core validation
    // Disposable emails are invalid (hard fail)
    valid: finalValidAfterDns && !isDisposable,
    isInvalid: !finalValidAfterDns || isDisposable,
    isDisposable,

    // Campaign readiness scoring
    campaignScore,
    campaignReadiness,
    campaignBreakdown,
    lcsScore,        // Local-Part Credibility Score (single source of truth)

    // Role-based detection
    roleBasedEmail: isRoleBasedEmail,
    roleBasedType: isRoleBasedEmail ? roleMatch : null,

    // Issues and warnings
    issues: [...issues, ...tldIssues],
    usernameHeuristics,
    trustworthinessWarnings,
    hasBadReputation: semantics.hasBadReputation || false,

    // Analysis metrics (displayed in Username Analysis & Domain Intelligence)
    tldQuality,
    isDomainCorporate,
    businessEmail,
    gibberishScore,
    abusiveScore,
    abusiveType: semantics.contentSeverity.isHateful ? 'hateful' : semantics.contentSeverity.isAbusive ? 'abusive' : semantics.contentSeverity.isNsfw ? 'nsfw' : null,
    phishingRisk,

    // Deliverability and Trustworthiness scores (for hidden UI panels)
    deliverabilityScore: Math.round(deliverabilityScore),
    deliverabilityLabel: mapDeliverabilityLabel(deliverabilityScore),
    trustworthinessScore: Math.round(trustworthinessScore),
    trustworthinessLabel: mapTrustworthinessLabel(trustworthinessScore)
  }
}

// MAIN EXPORT
export async function emailValidator(text) {
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
      averageCampaignScore: 0,
      averageCampaignReadiness: 'Poor',
      results: []
    }
  }

  const results = await Promise.all(emails.map(email => validateSingleEmail(email)))

  const validResults = results.filter(r => r.valid)

  // Only calculate average if there are valid emails
  const hasValidEmails = validResults.length > 0

  const avg = (field) =>
    hasValidEmails
      ? Math.round(validResults.reduce((sum, r) => sum + (r[field] || 0), 0) / validResults.length)
      : 0

  const averageCampaignScore = hasValidEmails ? avg('campaignScore') : undefined

  // Map average campaign score to campaign readiness label (only if valid emails exist)
  let averageCampaignReadiness = undefined
  if (hasValidEmails) {
    if (averageCampaignScore >= 90) averageCampaignReadiness = 'Excellent'
    else if (averageCampaignScore >= 75) averageCampaignReadiness = 'Good'
    else if (averageCampaignScore >= 55) averageCampaignReadiness = 'Risky'
    else if (averageCampaignScore >= 30) averageCampaignReadiness = 'Poor'
    else averageCampaignReadiness = 'Very Poor'
  }

  return {
    total: results.length,
    valid: validResults.length,
    invalid: results.filter(r => !r.valid).length,
    mailcheckerAvailable: typeof MailChecker !== 'undefined',
    averageCampaignScore,
    averageCampaignReadiness,
    results
  }
}
