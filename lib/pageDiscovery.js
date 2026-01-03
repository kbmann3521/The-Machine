/**
 * Discover internal test/diagnostic pages
 *
 * This list contains ONLY pages where per-page noindex/nofollow rules make sense.
 *
 * Excluded (handled elsewhere or not configurable):
 * - Public pages (/, /blog, /blog/*) → always index/follow, never toggle
 * - Admin routes (/admin/*) → hardcoded robots.txt disallow + meta noindex,nofollow
 * - API routes (/api/*) → robots.txt only, no meta tags needed
 * - Framework internals (/.next) → robots.txt only
 * - Infrastructure files (/robots.txt, /sitemap.xml) → not indexable content
 */
export const AVAILABLE_PAGES = [
  // Internal test/diagnostic pages only
  { path: '/ip-toolkit-tests', label: 'IP Toolkit Tests' },
  { path: '/jwt-tests', label: 'JWT Tests' },
  { path: '/math-evaluator-tests', label: 'Math Evaluator Tests' },
  { path: '/phase5-tests', label: 'Phase 5 Tests' },
  { path: '/test-detection', label: 'Test Detection' },
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
  rules.push('Allow: /api/sitemap.xml')
  rules.push('')
  rules.push('# Disallow admin and API routes')
  rules.push('Disallow: /admin/')
  rules.push('Disallow: /api/')
  rules.push('Disallow: /.next/')
  rules.push('')
  rules.push('Sitemap: https://www.pioneerwebtools.com/api/sitemap.xml')

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
