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
 * Generate robots.txt content - path-level rules only
 * robots.txt controls crawl access (before page fetch)
 * Meta tags handle per-page indexing directives (after page fetch)
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
  
  // Build robots.txt - keep it simple, path-based only
  const rules = []
  rules.push('User-agent: *')
  rules.push('Allow: /')
  rules.push('')
  
  // Path-level disallows (for crawl access control, not per-page SEO)
  rules.push('# Disallow admin and API routes')
  rules.push('Disallow: /api/')
  rules.push('Disallow: /admin/')
  rules.push('Disallow: /.next/')
  rules.push('')
  rules.push('Sitemap: https://www.pioneerwebtools.com/api/sitemap')
  
  return rules.join('\n').trim()
}
