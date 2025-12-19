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
 * Generate default robots.txt content - structural path rules only
 * robots.txt controls crawl access (before page fetch)
 * Meta tags handle per-page indexing directives (after page fetch)
 *
 * ⚠️ Page-level checkboxes do NOT affect robots.txt
 * They only control <meta name="robots"> injection
 */
export function generateDefaultRobotsText() {
  const rules = []
  rules.push('User-agent: *')
  rules.push('Allow: /')
  rules.push('')
  rules.push('# Disallow admin and API routes')
  rules.push('Disallow: /admin/')
  rules.push('Disallow: /api/')
  rules.push('Disallow: /.next/')
  rules.push('')
  rules.push('Sitemap: https://www.pioneerwebtools.com/api/sitemap')

  return rules.join('\n').trim()
}

/**
 * Generate robots.txt content
 * If custom robots.txt exists, use it. Otherwise use default structural rules.
 * Page-level rules (from checkboxes) are NEVER reflected in robots.txt.
 */
export function generateRobotsText(customRobots, indexSite) {
  // If custom robots.txt is provided, use it as-is (manual override)
  if (customRobots?.trim()) {
    return customRobots
  }

  // If site indexing is disabled globally, return strict disallow
  if (!indexSite) {
    return `User-agent: *
Disallow: /`
  }

  // Otherwise use default structural rules
  return generateDefaultRobotsText()
}
