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

// Comprehensive business domain keywords
const businessDomainKeywords = [
  'company', 'corp', 'organization', 'agency', 'industries', 'systems', 'solutions',
  'services', 'consulting', 'business', 'enterprise', 'global', 'international',
  'financial', 'technology', 'digital', 'ventures', 'partners', 'group', 'holding',
  'labs', 'research', 'development', 'innovation', 'ventures', 'capital', 'fund',
  'studio', 'collective', 'network', 'alliance', 'consortium', 'cooperative',
  'corporation', 'incorporated', 'limited', 'partnership', 'llc', 'gmbh', 'ag',
  'pty', 'nv', 'bv', 'sa', 'srl', 'sas', 'kft', 'spzoo', 'ooo'
]

// Comprehensive personal & freeemail providers
const personalFreemailProviders = new Set([
  // Major providers
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  // Alternative privacy/secure
  'protonmail.com', 'mail.protonmail.com', 'pm.me',
  'tutanota.com', 'mailbox.org', 'fastmail.com', 'hey.com',
  // Regional/international
  'yandex.com', 'yandex.ru', 'mail.ru', 'rambler.ru',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
  'daum.net', 'naver.com', 'hanmail.net',
  // Generic free email
  'aol.com', 'gmx.com', 'gmx.de', 'mail.com', 'zoho.com',
  'inbox.com', 'mail.inbox.com', 'web.de', 'freenet.de',
  'laposte.net', 'wanadoo.fr', 'free.fr', 'sfr.fr',
  // Student/academic
  'student.com', 'university.ac', 'edu.au', 'ac.uk',
  // Temporary/disposable (cross-listed with knownDisposableDomains for safety)
  'tempmail.com', 'temp-mail.org', 'mailinator.com', 'yopmail.com',
  'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  // Other free services
  'pobox.com', 'mailanator.com', 'sharklasers.com', 'cock.li', 'cock.email',
  'getmail.com', 'emailnow.net', 'list.ru'
])

// Comprehensive corporate & enterprise domain list
const corporateProviderDomains = new Set([
  // Big Tech / FAANG
  'microsoft.com', 'apple.com', 'google.com', 'amazon.com', 'meta.com', 'facebook.com',
  // Cloud & Infrastructure
  'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com',
  'ibm.com', 'oracle.com', 'vmware.com', 'salesforce.com', 'adobe.com',
  // AI & Machine Learning
  'openai.com', 'anthropic.com', 'deepmind.google.com', 'stability.ai',
  'huggingface.co', 'cohere.com', 'together.ai',
  // Fintech & Finance
  'stripe.com', 'paypal.com', 'square.com', 'shopify.com', 'bankofamerica.com',
  'bofa.com', 'chase.com', 'citi.com', 'wellsfargo.com', 'capitalone.com',
  'goldman.com', 'jpmorgan.com', 'blackrock.com', 'vanguard.com',
  // Crypto & Web3
  'coinbase.com', 'kraken.com', 'gemini.com', 'opensea.io', 'uniswap.org',
  // Social & Communication
  'twitter.com', 'x.com', 'threads.com', 'slack.com', 'discord.com',
  'telegram.org', 'whatsapp.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'snapchat.com', 'reddit.com', 'quora.com',
  // Video & Streaming
  'netflix.com', 'youtube.com', 'hulu.com', 'disneyplus.com', 'primevideo.com',
  'twitch.tv', 'vimeo.com', 'dailymotion.com',
  // Storage & Productivity
  'dropbox.com', 'box.com', 'onedrive.com', 'icloud.com', 'google.com',
  'notion.so', 'asana.com', 'monday.com', 'trello.com', 'jira.atlassian.com',
  'confluence.atlassian.com',
  // Developer Tools
  'github.com', 'gitlab.com', 'bitbucket.org', 'vercel.com', 'netlify.com',
  'heroku.com', 'digitalocean.com', 'linode.com', 'aws.com',
  // E-commerce
  'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'wix.com',
  // Travel & Hospitality
  'uber.com', 'lyft.com', 'airbnb.com', 'booking.com', 'expedia.com',
  'hotels.com', 'tripadvisor.com', 'airbnb.com',
  // Entertainment & Media
  'spotify.com', 'pandora.com', 'apple.com', 'amazon.com', 'disney.com',
  'warnerbros.com', 'sony.com', 'viacomcbs.com',
  // Education
  'coursera.org', 'udemy.com', 'edx.org', 'skillshare.com', 'linkedin.com',
  // Hardware & Gaming
  'nvidia.com', 'amd.com', 'intel.com', 'sony.com', 'microsoft.com',
  'nintendo.com', 'valve.com', 'epicgames.com', 'roblox.com',
  // AI & Startups
  'tesla.com', 'spacex.com', 'openai.com', 'anthropic.com', 'runwayml.com',
  'midjourney.com', 'perplexity.ai', 'eleven-labs.com',
  // Security & Privacy
  '1password.com', 'bitwarden.com', 'lastpass.com', 'dashlane.com',
  'nordvpn.com', 'expressvpn.com', 'protonvpn.com',
  // Analytics & Data
  'splunk.com', 'datadog.com', 'newrelic.com', 'mixpanel.com',
  'amplitude.com', 'segment.com', 'tableau.com', 'looker.com',
  // Recruitment & HR
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com'
])

// FIX #1: More restrictive personal name pattern (only match clearly Western two-word names, not role-based emails)
// Must be firstname.lastname format with alphabetic characters only, no numbers or special prefixes
const personalNamePatterns = [
  /^[a-z]{2,}[._][a-z]{2,}$/i  // firstname.lastname or firstname_lastname (min 2 chars each)
]
// Comprehensive role-based email keywords
const roleBasedEmailKeywords = [
  // Administrative
  'admin', 'administrator', 'admins', 'sysadmin', 'superuser', 'root',
  // Support & Customer Service
  'support', 'help', 'helpdesk', 'support-team', 'customer-support', 'support-team',
  'customer-service', 'service', 'assistance', 'care', 'cs',
  // Sales & Business Development
  'sales', 'sales-team', 'business', 'bd', 'partnerships', 'partner', 'account-manager',
  'account-team', 'enterprise', 'reseller',
  // Marketing & Communications
  'marketing', 'marketing-team', 'marcom', 'communications', 'comms', 'pr', 'press',
  'media', 'advertising', 'ads', 'creative', 'brand', 'product-marketing',
  // IT & Technical
  'it', 'tech', 'tech-team', 'technical', 'it-support', 'infrastructure', 'devops',
  'platform', 'operations', 'ops', 'sre', 'site-reliability',
  // Human Resources
  'hr', 'human-resources', 'hr-team', 'recruiting', 'recruiter', 'talent',
  'people', 'payroll', 'benefits', 'careers',
  // Finance & Accounting
  'finance', 'accounting', 'accounting-team', 'accounts', 'billing', 'billing-team',
  'invoice', 'payment', 'revenue', 'financial', 'cfo', 'controller', 'bookkeeper',
  // Legal & Compliance
  'legal', 'legal-team', 'attorney', 'counsel', 'compliance', 'privacy', 'security',
  // Product & Engineering
  'product', 'product-team', 'engineering', 'engineering-team', 'dev', 'development',
  'development-team', 'code', 'qa', 'quality-assurance', 'testing', 'release',
  // Data & Analytics
  'data', 'analytics', 'analytics-team', 'bi', 'business-intelligence', 'data-science',
  'data-team', 'insights', 'metrics',
  // Operations & Management
  'operations', 'ops', 'ops-team', 'management', 'leadership', 'management-team',
  'exec', 'executive', 'ceo', 'cto', 'cfo', 'coo', 'vp', 'director',
  // Communications & Notifications
  'contact', 'info', 'information', 'inquiry', 'feedback', 'newsletter',
  'notifications', 'notification', 'alerts', 'alert', 'noreply', 'no-reply',
  'no-reply-all', 'donotreply', 'notification-center',
  // System & Monitoring
  'system', 'systems', 'monitor', 'monitoring', 'logging', 'alert',
  'alerts', 'security-alerts', 'critical-alerts', 'status', 'status-page',
  // Abuse & Trust & Safety
  'abuse', 'abuse-team', 'trust-safety', 'safety', 'trust', 'fraud',
  'fraud-team', 'phishing', 'security', 'security-team', 'incident',
  // Website & General
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon', 'www',
  'website', 'web', 'web-team', 'site', 'smtp',
  // Event & Community
  'events', 'community', 'community-team', 'ambassador', 'developer-relations',
  'devrel', 'evangelism',
  // Other Specialized
  'hello', 'team', 'office', 'reception', 'receptionist', 'general',
  'enquiry', 'partnerships', 'vendor', 'contractor'
]

// Comprehensive offensive/abusive terms list
const abusiveTerms = [
  // Profanity - Severe
  'fuck', 'shit', 'cunt', 'asshole', 'bastard', 'motherfucker',
  // Sexual Slurs & Dehumanizing
  'faggot', 'dyke', 'tranny', 'retard', 'tard', 'nigger', 'nword',
  'kike', 'spic', 'chink', 'dago', 'cracker', 'honkey',
  // Racial & Ethnic Slurs
  'racist', 'racism', 'nazi', 'antisemitic', 'islamophobic',
  'homophobic', 'transphobic', 'sexist', 'sexism', 'misogyny', 'misogynist',
  // Sexual Violence
  'rapist', 'rape', 'rapey', 'sexual-assault', 'molest', 'pedophile', 'pedo',
  'child-abuse', 'trafficking', 'trafficked',
  // Violence & Threats
  'kill', 'murder', 'murder-', 'massacre', 'genocide', 'war-crime',
  'bomb', 'bombing', 'terrorist', 'terrorism', 'execute', 'lynch',
  'shoot', 'stabbing', 'maim', 'torture',
  // Scam & Fraud Related
  'scammer', 'scam', 'fraud', 'fraudster', 'ponzi', 'pyramid',
  'money-laundering', 'blackmail', 'extortion', 'embezzle',
  // Drug & Substance Abuse
  'addict', 'junkie', 'heroin', 'cocaine', 'meth-head',
  'drug-deal', 'pusher', 'dealer', 'distributor',
  // Hate Speech & Extremism
  'hateful', 'hate-speech', 'hate', 'extremist', 'supremacist',
  'white-supremacy', 'kkk', 'skinhead', 'militant',
  // Dehumanizing Language
  'subhuman', 'inhuman', 'primitive', 'savage', 'barbarian',
  // General Offensive Content
  'asshat', 'douchebag', 'dickhead', 'shitbag', 'twat', 'wanker',
  'cock', 'pussy', 'dick', 'clit', 'cum', 'jizz',
  'slut', 'whore', 'prostitute', 'hoe', 'bitch', 'ho',
  'pervert', 'deviant', 'depraved', 'sicko',
  // Threatening Language
  'threat', 'threatening', 'menace', 'intimidate', 'harassment',
  'harass', 'bully', 'bullying', 'cyberbully', 'stalking', 'stalk',
  // Degrading Comments
  'ugly', 'disgusting', 'vile', 'filthy', 'obscene', 'vulgar',
  'crude', 'crass', 'gross', 'repugnant', 'abhorrent',
  // More Intensity Markers
  'damn', 'hell', 'crap', 'piss', 'pissed', 'horny', 'sexy',
  'xxx', 'porn', 'porno', 'pornography', 'explicit', 'adult',
  'nsfw', 'hentai',
  // Additional Patterns
  'offensive', 'hateful', 'abuse', 'abusive', 'insult', 'insults',
  'demean', 'demeaning', 'contempt', 'contemptuous', 'disparage',
  'deride', 'ridicule', 'mock', 'mockery', 'disdain',
  // Discriminatory
  'discriminate', 'discrimination', 'prejudice', 'prejudiced',
  'bigot', 'bigotry', 'biased', 'stereotype', 'stereotyping'
]

// FIX #1: Slang whitelist - real English/internet slang words that don't trigger gibberish
const slangWhitelist = new Set([
  // Internet slang & memes
  'af', 'based', 'copypasta', 'cringe', 'derp', 'epic',
  'fail', 'fomo', 'geez', 'giga', 'giga-chad', 'gigachad',
  'idk', 'idc', 'imo', 'imho', 'irl', 'jk', 'lfg',
  'lol', 'lmao', 'lmfao', 'rofl', 'kek', 'kekw',
  'pog', 'poggers', 'pepe', 'sus', 'yeet', 'yolo',

  // Mild profanity slang (safe but not crude)
  'badass', 'dumbass', 'smartass', 'jackass', 'pissed', 'salty',

  // Meme creature / vibe words
  'thicc', 'chonky', 'snacc', 'vibe', 'vibes', 'mood', 'aesthetic',

  // Gamer slang
  'noob', 'n00b', 'pwn', 'pwned', 'gg', 'ggwp', 'meta',
  'nerf', 'buff', 'loot', 'grind', 'toxic', 'camping',
  'gamer', 'gaming', 'esports', 'streamer', 'streaming',

  // Tech & dev slang (commonly used in casual posts)
  'devops', 'devrel', 'frontend', 'backend', 'fullstack',
  'hacker', 'coder', 'debug', 'api', 'cli',

  // Social / creator slang
  'podcast', 'podcaster', 'vlogger', 'blogger',
  'youtuber', 'youtube', 'influencer', 'tiktoker', 'spotify',

  // Fitness / lifestyle slang
  'yoga', 'crossfit', 'marathon', 'fitness', 'gymrat',

  // Speech-pattern contractions / phonetic spellings
  'gonna', 'gotta', 'wanna', 'kinda', 'sorta', 'dunno', 'lemme',
  'gimme', 'ain\'t', 'prolly', 'tryna', 'hafta', 'outta', 'whatcha',

  // Food & daily-life slang
  'foodie', 'coffee', 'latte', 'brunch',

  // Identity & handle terms
  'username', 'alias', 'handle', 'moniker', 'persona', 'nickname',

  // Expression slang
  'dope', 'cool', 'awesome', 'epic', 'rad', 'fire', 'lit',
  'vibing', 'chill', 'hype', 'goated',

  // Short text/message slang
  'omg', 'wtf', 'brb', 'gg', 'np', 'ffs', 'smh', 'ngl', 'fr', 'tfw',

  // Common internet creatures / characters
  'uwu', 'owo', 'lil', 'boi', 'doggo', 'pupper', 'heckin', 'floof',

  // Soft weird-words that are *not* gibberish
  'heck', 'whoops', 'yikes', 'oop', 'welp', 'bruh',
])

// FIX #4: Adult content terms (not abusive, but should reduce trust)
const adultTerms = [
  'nsfw', 'sfw', 'adult', 'mature', 'porn', 'pornography', 'porno',
  'xxx', 'hentai', 'anime', 'yuri', 'yaoi', 'doujin', 'erotic',
  'erotica', 'explicit', 'sex', 'sexual', 'sexy', 'horny', 'nude',
  'naked', 'cam', 'webcam', 'onlyfans', 'patreon', 'fetish', 'bdsm',
  'dating', 'hookup', 'swinger', 'polyamorous', 'escort'
]

// Comprehensive brand impersonation patterns
const brandImpersonationPatterns = [
  // Tech Giants
  'apple', 'microsoft', 'google', 'amazon', 'meta', 'facebook', 'intel', 'nvidia',
  'amd', 'ibm', 'oracle', 'salesforce', 'adobe', 'autodesk',
  // Social & Communication
  'twitter', 'x', 'instagram', 'tiktok', 'snapchat', 'linkedin', 'facebook',
  'whatsapp', 'telegram', 'discord', 'slack', 'zoom',
  // Video & Entertainment
  'netflix', 'spotify', 'hulu', 'disney', 'youtube', 'twitch', 'hbo', 'paramount',
  'peacock', 'primevideo', 'apple-tv', 'appletv',
  // Finance & Payment
  'paypal', 'stripe', 'square', 'shopify', 'chase', 'wellsfargo', 'bankofamerica',
  'bofa', 'citi', 'capitalone', 'amex', 'visa', 'mastercard', 'discover',
  'coinbase', 'kraken', 'gemini', 'binance',
  // Travel & Hospitality
  'uber', 'lyft', 'airbnb', 'booking', 'expedia', 'hotels', 'tripadvisor',
  'marriott', 'hyatt', 'hilton', 'intercontinental',
  // Shopping & E-commerce
  'amazon', 'ebay', 'etsy', 'aliexpress', 'wish', 'wayfair', 'ikea', 'costco',
  'walmart', 'target', 'bestbuy', 'newegg',
  // Development & DevOps
  'github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'heroku', 'digitalocean',
  'aws', 'azure', 'gcp', 'kubernetes', 'docker',
  // Productivity & Collaboration
  'notion', 'slack', 'asana', 'monday', 'trello', 'jira', 'confluence',
  'dropbox', 'box', 'onedrive', 'googledrive',
  // Education
  'coursera', 'udemy', 'edx', 'skillshare', 'linkedin-learning',
  // Crypto & Web3
  'ethereum', 'bitcoin', 'crypto', 'opensea', 'uniswap',
  // Security & Privacy
  '1password', 'lastpass', 'bitwarden', 'dashlane', 'nordvpn', 'expressvpn', 'proton',
  // Other Notable Brands
  'bank', 'bofa', 'bankofamerica', 'security', 'trust', 'verification', 'verify',
  'confirm', 'validate', 'authenticate', 'authorize'
]

// FIX #C: Standard system email addresses that should NOT be penalized as gibberish
const standardSystemEmails = new Set(['postmaster', 'abuse', 'webmaster', 'root', 'noreply', 'no-reply', 'mailer-daemon'])

// FIX #7: System mailboxes that should be capped at lower trust scores
const systemMailboxesCapped = new Set(['postmaster', 'abuse'])

// Comprehensive toxic/spam/phishing keywords
const toxicKeywords = [
  // Romance & Catfish Scams
  'romance', 'dating', 'matchmaking', 'soul-mate', 'sweetheart', 'beloved',
  'dear-friend', 'lost-love', 'widow', 'widower', 'divorcee',
  // Money/Inheritance Scams
  'inheritance', 'fortune', 'legacy', 'bequest', 'estate', 'testament',
  'beneficiary', 'lottery', 'prize', 'winnings', 'congratulations',
  'claim-prize', 'claim-award', 'unclaimed',
  // Nigerian Prince & Variants
  'nigerian', 'prince', 'princess', 'minister', 'barrister', 'solicitor',
  'transaction', 'transfer-fund', 'business-proposal', 'urgent-business',
  // Crypto Scams
  'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain',
  'wallet', 'private-key', 'seed-phrase', 'token', 'defi', 'nft',
  'rug-pull', 'pump-dump', 'ico', 'presale',
  // Bank/Payment Impersonation
  'verify-account', 'confirm-identity', 'update-payment', 'suspended-account',
  'limited-account', 'unusual-activity', 'confirm-password', 'verify-code',
  'security-alert', 'urgent-action', 'immediate-action',
  // Phishing Keywords
  'urgent', 'immediately', 'asap', 'action-required', 'act-now',
  'click-here', 'verify', 'confirm', 'validate', 'authenticate',
  'update-information', 'reactivate', 'restore-access', 'unlock-account',
  // Tech Support Scams
  'virus', 'malware', 'infected', 'compromised', 'hacked', 'breach',
  'update-software', 'critical-update', 'system-update', 'security-patch',
  // Job Scams
  'work-from-home', 'remote-job', 'easy-money', 'quick-cash',
  'high-income', 'no-experience', 'guarantee', 'guaranteed-income',
  // Retail/Refund Scams
  'refund', 'rebate', 'cashback', 'store-credit', 'voucher',
  'free-shipping', 'special-offer', 'limited-time', 'act-fast',
  // Payment Services
  'cashapp', 'venmo', 'paypal', 'western-union', 'moneygram',
  'google-play', 'itunes', 'amazon-gift', 'target-gift',
  // Urgency/Pressure
  'hurry', 'deadline', 'expiring', 'limited-offer', 'only-today',
  'exclusive', 'members-only', 'vip', 'premium',
  // Authority/Trust
  'irs', 'fbi', 'cia', 'nsa', 'police', 'federal', 'agent',
  'official', 'government', 'law-enforcement', 'legal-action',
  // Suspicious Offers
  'free', 'free-money', 'gift', 'bonus', 'reward', 'incentive',
  'no-cost', 'no-charge', 'risk-free', 'money-back-guarantee',
  // Loan Scams
  'loan', 'credit', 'mortgage', 'refinance', 'bad-credit',
  'no-credit-check', 'guaranteed-approval', 'bad-credit-ok',
  // Adult/Explicit
  'adult', 'xxx', 'naked', 'hot', 'sexy', 'horny', 'cam',
  // Spam Signals
  'bulk', 'mass', 'spam', 'unsolicited', 'newsletter', 'marketing',
  'advertisement', 'promotional', 'deal', 'discount', 'sale'
]

// FIX F: Only accept exact match or single-subdomain corporate domains
function isCorporateDomain(domain) {
  const lower = domain.toLowerCase()

  // Exact domain match
  if (corporateProviderDomains.has(lower)) return true

  // OR explicitly allow single-subdomain variants (e.g., dev.stripe.com from stripe.com)
  const parts = lower.split('.')
  if (parts.length === 3) {
    const base = parts.slice(-2).join('.')
    return corporateProviderDomains.has(base)
  }

  return false
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

  // FIX C: Never treat standard system mailboxes as abusive
  if (standardSystemEmails.has(localLower)) return false

  // FIX #1: Never treat slang words as abusive
  if (slangWhitelist.has(localLower)) return false

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
    isBrandImpersonationStrong: false,
    isRoleBasedEmail: false,
    isUnicodeUsername: false,
    isStandardSystemEmail: false,
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

  // FIX #C: Check if this is a standard system email (whitelist)
  insights.isStandardSystemEmail = standardSystemEmails.has(localLower)

  // Check for personal name patterns ONLY if not role-based
  if (!isRoleBased && personalNamePatterns.some(pattern => pattern.test(localPart))) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 20
    insights.warnings.push('Likely personal name pattern (firstname.lastname)')
  }

  // Check for abusive/offensive content (BEFORE other heuristics)
  if (hasAbusiveContent(localPart)) {
    insights.hasAbusiveContent = true
    insights.semanticPenalty -= 80  // FIX #3: Severe penalty but not absolute zero
    insights.warnings.push('Contains offensive or abusive language')
  }

  // FIX #4: Check for adult content (not abusive, but reduces trust)
  const hasAdultContent = adultTerms.some(term => localLower.includes(term))
  if (hasAdultContent && !insights.hasAbusiveContent) {
    insights.semanticPenalty -= 20
    insights.warnings.push('Contains adult/explicit content themes')
  }

  // FIX #A & #B: Enhanced brand impersonation detection with better patterns
  const domainLower = domain ? domain.toLowerCase() : ''

  // Check for strong brand impersonation patterns (multi-dot, brand+support/billing/security, hyphen-separated)
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

  let isStrongBrandImpersonation = strongBrandPatterns.some(pattern => pattern.test(localPart))

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
    // FIX #B: Much harsher penalty for brand impersonation
    if (isStrongBrandImpersonation) {
      insights.isBrandImpersonationStrong = true
      insights.semanticPenalty -= 75  // Severe penalty for strong impersonation
    } else {
      insights.semanticPenalty -= 50  // Significant penalty
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

// FIX D: Proper hierarchy for human likelihood labels
function mapHumanLikelihoodLabel(trustScore, isInvalid = false, isCorporateEmail = false, hasAbusiveContent = false, hasStrongImpersonation = false, isRoleBasedEmail = false) {
  // Check invalid first (highest priority)
  if (isInvalid) return 'Invalid (cannot receive email)'

  // Strong brand impersonation = likely bot/impersonator
  if (hasStrongImpersonation) return 'Likely bot / impersonator'

  // FIX #2: Abusive content = cannot classify (not "human" - bots use profanity too)
  if (hasAbusiveContent) return 'Cannot classify (abusive)'

  // FIX #4: Role-based marketing emails are organization mailboxes
  if (isRoleBasedEmail && !isInvalid && !hasAbusiveContent && !hasStrongImpersonation) {
    return 'Likely organization mailbox'
  }

  // Corporate email = likely organization mailbox
  if (isCorporateEmail) return 'Likely organization mailbox'

  // Normal trustScore range buckets
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
  // FIX E: Accept Unicode/IDN TLDs like .рф, .广告 (not just ASCII a-z)
  const hasValidTld = /\.(\p{L}[\p{L}\p{N}-]*)$/u.test(domain)
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
    // FIX E: Use Unicode regex to match IDN TLDs
    const tldMatch = normalizedDomain.match(/\.(\p{L}[\p{L}\p{N}-]*)$/u)

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
        // FIX #3 & #9: Remove duplicate TLD warnings and increase penalty for spam TLDs
        details.tldQuality = 'low-trust'
        details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 30)
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

    // FIX #7: Organization role emails like postmaster/abuse should be capped at lower trust
    if (systemMailboxesCapped.has(roleMatch)) {
      details.trustworthinessScore = Math.min(details.trustworthinessScore, 65)
    }
  }

  // 8. GIBBERISH DETECTION (FIX #C: Skip for standard system emails, FIX #5: Skip Western rules for Unicode)
  details.usernameHeuristics = []

  // FIX #1: Marketing/Newsletter whitelist
  const marketingWhitelist = new Set([
    'newsletter', 'marketing', 'promotions', 'promo', 'outreach',
    'campaigns', 'ads', 'advertising', 'media'
  ])
  const isMarketingName = marketingWhitelist.has(localLower)

  // FIX #2: Multi-part human name detection
  function looksLikeMultiPartName(local) {
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length < 2) return false
    // Each part must contain at least 1 vowel
    return parts.every(p => /[aeiou]/i.test(p))
  }
  const isMultiPartName = looksLikeMultiPartName(localPart)

  // FIX #3: Acronym whitelist
  const acronymWhitelist = new Set(['nsfw', 'sfw', 'fyi', 'faq', 'asap', 'brb'])
  const startsWithAcronym = Array.from(acronymWhitelist).some(a => localLower.startsWith(a))

  if (!semantics.isLikelyPersonalName && !semantics.isUnicodeUsername && !semantics.isStandardSystemEmail && !isMarketingName && !startsWithAcronym) {
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

    // FIX #8: Numbers-only usernames should score much lower
    if (/^\d+$/.test(localPart)) {
      usernameRiskScore += 12
      details.usernameHeuristics.push('Numbers-only username')
      details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 40)
    }

    // FIX #G: More selective bot pattern detection - only flag clear bot patterns, not generic words like "test"
    const clearBotPatterns = ['bot', 'mailer', 'daemon', 'notification', 'alert', 'auto-', 'generated', 'tmp', 'temp']
    if (!semantics.isRoleBasedEmail && clearBotPatterns.some(pattern => localLower.includes(pattern))) {
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

    // FIX G & #10: Normalize gibberish scoring calculation
    // Weighted combination of factors for consistent risk assessment
    let clusterPoints = 0
    let entropyPoints = 0
    let repeatPoints = 0
    let vowelPenalty = 0

    // Calculate individual component scores
    if (vowelRatioLocal < 0.15) vowelPenalty = 4
    if (entropyIndicators >= 3) entropyPoints = 5
    if (repeatedTrigrams >= 4) repeatPoints = 3

    // Check for heavy consonant clusters (only if not name-like)
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

    // FIX #10: Weighted normalization (entropy × 3, clusters × 2, vowels × 2, repeats × 1)
    const finalRiskScore = (clusterPoints * 2) + (entropyPoints * 3) + (repeatPoints * 1) + (vowelPenalty * 2)
    usernameRiskScore = Math.min(30, Math.max(0, finalRiskScore))

    // FIX #5: Raise thresholds for gibberish flag
    const isStrongGibberish =
      (repeatedTrigrams >= 4 && vowelRatioLocal < 0.20) ||
      (entropyIndicators >= 3 && vowelRatioLocal < 0.18)

    if (isStrongGibberish) {
      details.usernameHeuristics.push('Username appears randomly generated (gibberish)')
    }

    // FIX A: Disable consonant-cluster logic for likely names
    // FIX #2: Also skip for multi-part names like john.a.smith
    const skipClusterCheck =
      semantics.isLikelyPersonalName ||
      isMultiPartName ||
      /[-']/i.test(localPart) ||
      (vowelRatioLocal > 0.25)  // names rarely have extremely low vowel ratios

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

  // FIX #4 & #B: If there are warnings or heuristics, trustworthiness cannot be perfect (100)
  // FIX #B: Brand impersonation should drop score significantly
  if (details.trustworthinessScore === 100 && (details.trustworthinessWarnings.length > 0 || (details.usernameHeuristics && details.usernameHeuristics.length > 0))) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 10)
  }

  // FIX #B: Strong brand impersonation patterns should be penalized more heavily
  if (semantics.isBrandImpersonationStrong) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 50)
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
    // FIX D: Pass strong impersonation flag to properly categorize impersonators
    // FIX #4: Pass isRoleBasedEmail for better organization mailbox classification
    details.humanLikelihood = mapHumanLikelihoodLabel(
      details.trustworthinessScore,
      false,
      isDomainCorporate,
      semantics.hasAbusiveContent,
      semantics.isBrandImpersonationStrong,
      isRoleBasedEmail
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
