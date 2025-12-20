/**
 * Get the robots meta tag content for a given page path
 * Based on SEO settings stored in the database
 * 
 * This handles per-page indexing directives that should be applied via meta tags,
 * not robots.txt
 */

/**
 * Check if a path matches a rule (handles wildcards)
 */
function pathMatches(pagePath, rulePath) {
  if (rulePath === pagePath) return true
  
  // Handle wildcard patterns like /blog/*
  if (rulePath.endsWith('/*')) {
    const prefix = rulePath.slice(0, -2)
    return pagePath.startsWith(prefix)
  }
  
  return false
}

/**
 * Get robots meta directives for a page path
 * @param {string} currentPath - Current page path (e.g., '/jwt-tests')
 * @param {object} pageRules - Rules object { [path]: { noindex, nofollow } }
 * @returns {string|null} Meta content string or null if no directives needed
 */
export function getRobotsMetaContent(currentPath, pageRules) {
  if (!pageRules || typeof pageRules !== 'object') {
    return null
  }
  
  const directives = []
  
  // Find matching rule for this path
  for (const [rulePath, rule] of Object.entries(pageRules)) {
    if (pathMatches(currentPath, rulePath)) {
      if (rule.noindex) directives.push('noindex')
      if (rule.nofollow) directives.push('nofollow')
      break
    }
  }
  
  // Return meta content if any directives apply
  return directives.length > 0 ? directives.join(',') : null
}

/**
 * Get default robots directives for admin paths
 * Admin pages always get noindex,nofollow
 */
export function getAdminRobotsMeta(currentPath) {
  if (currentPath.startsWith('/admin')) {
    return 'noindex,nofollow'
  }
  return null
}
