/**
 * Discover all available pages in the website
 * This returns a comprehensive list of routes based on common Next.js patterns
 */
export const AVAILABLE_PAGES = [
  // Public pages
  { path: '/', label: 'Home' },
  { path: '/blog', label: 'Blog Index' },
  { path: '/blog/*', label: 'Blog Posts (all)' },
  
  // Test harnesses (from your app)
  { path: '/ip-toolkit-tests', label: 'IP Toolkit Tests' },
  { path: '/jwt-tests', label: 'JWT Tests' },
  { path: '/math-evaluator-tests', label: 'Math Evaluator Tests' },
  { path: '/phase5-tests', label: 'Phase 5 Tests' },
  { path: '/test-detection', label: 'Test Detection' },
  
  // Admin pages (usually want to exclude)
  { path: '/admin', label: 'Admin (all)' },
  { path: '/admin/login', label: 'Admin Login' },
  { path: '/admin/posts', label: 'Blog Admin' },
  { path: '/admin/test-harnesses', label: 'Test Harnesses Admin' },
  { path: '/admin/seo', label: 'SEO Config Admin' },
  
  // API routes (usually want to exclude)
  { path: '/api', label: 'API (all)' },
  { path: '/api/*', label: 'All API routes' },
  
  // System files
  { path: '/.next', label: '.next build files' },
  { path: '/robots.txt', label: 'Robots.txt' },
  { path: '/sitemap.xml', label: 'Sitemap' },
]

/**
 * Filter pages by search query
 */
export function searchPages(query) {
  if (!query.trim()) return AVAILABLE_PAGES
  
  const lowerQuery = query.toLowerCase()
  return AVAILABLE_PAGES.filter(page =>
    page.label.toLowerCase().includes(lowerQuery) ||
    page.path.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Generate robots.txt content from page rules
 * pageRules: { [path]: { noindex: boolean, nofollow: boolean, noarchive: boolean, nocache: boolean } }
 */
export function generateRobotsText(pageRules, indexSite, customRobots) {
  // If custom robots.txt is set and has content, use it as-is
  if (customRobots?.trim()) {
    return customRobots
  }
  
  // If site is not indexed globally, return disallow all
  if (!indexSite) {
    return `User-agent: *
Disallow: /`
  }
  
  // Build robots.txt from page rules
  const rules = []
  
  // Group rules by directive type for cleaner output
  const noindexPaths = Object.entries(pageRules)
    .filter(([_, rule]) => rule.noindex)
    .map(([path]) => path)
  
  const nofollowPaths = Object.entries(pageRules)
    .filter(([_, rule]) => rule.nofollow && !rule.noindex)
    .map(([path]) => path)
  
  const noarchivePaths = Object.entries(pageRules)
    .filter(([_, rule]) => rule.noarchive && !rule.noindex)
    .map(([path]) => path)
  
  const nocachePaths = Object.entries(pageRules)
    .filter(([_, rule]) => rule.nocache && !rule.noindex)
    .map(([path]) => path)
  
  // Default allow
  rules.push('User-agent: *')
  rules.push('Allow: /')
  rules.push('')
  
  // Add noindex rules (these disallow indexing but allow crawling)
  if (noindexPaths.length > 0) {
    rules.push('# Pages with noindex directive')
    noindexPaths.forEach(path => {
      rules.push(`# ${path}`)
    })
    rules.push('')
  }
  
  // Add nofollow rules
  if (nofollowPaths.length > 0) {
    rules.push('# Pages with nofollow directive')
    nofollowPaths.forEach(path => {
      rules.push(`# ${path}`)
    })
    rules.push('')
  }
  
  // Add noarchive rules
  if (noarchivePaths.length > 0) {
    rules.push('# Pages with noarchive directive')
    noarchivePaths.forEach(path => {
      rules.push(`# ${path}`)
    })
    rules.push('')
  }
  
  // Add nocache rules
  if (nocachePaths.length > 0) {
    rules.push('# Pages with nocache directive')
    nocachePaths.forEach(path => {
      rules.push(`# ${path}`)
    })
    rules.push('')
  }
  
  // Add standard disallows
  rules.push('# Disallow admin and API routes by default')
  rules.push('Disallow: /api/')
  rules.push('Disallow: /admin/')
  rules.push('Disallow: /.next/')
  rules.push('')
  rules.push('Sitemap: https://www.pioneerwebtools.com/api/sitemap')
  
  return rules.join('\n').trim()
}
