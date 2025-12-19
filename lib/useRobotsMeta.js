import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getRobotsMetaContent, getAdminRobotsMeta } from './getRobotsMeta'

/**
 * Hook to automatically inject robots meta tag based on current page
 * Reads page rules from localStorage (synced from SEO settings)
 */
export function useRobotsMeta() {
  const router = useRouter()
  
  useEffect(() => {
    // Get admin-level robots directive (admin pages always get noindex,nofollow)
    const adminMeta = getAdminRobotsMeta(router.pathname)
    if (adminMeta) {
      setRobotsMetaTag(adminMeta)
      return
    }
    
    // Get page-specific rules from localStorage
    const pageRulesStr = typeof window !== 'undefined' ? localStorage.getItem('seoPageRules') : null
    const pageRules = pageRulesStr ? JSON.parse(pageRulesStr) : null
    
    const metaContent = getRobotsMetaContent(router.pathname, pageRules)
    if (metaContent) {
      setRobotsMetaTag(metaContent)
    } else {
      removeRobotsMetaTag()
    }
  }, [router.pathname])
}

/**
 * Set or update the robots meta tag
 */
function setRobotsMetaTag(content) {
  let metaTag = document.querySelector('meta[name="robots"]')
  
  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute('name', 'robots')
    document.head.appendChild(metaTag)
  }
  
  metaTag.setAttribute('content', content)
}

/**
 * Remove the robots meta tag if it exists
 */
function removeRobotsMetaTag() {
  const metaTag = document.querySelector('meta[name="robots"]')
  if (metaTag) {
    metaTag.remove()
  }
}
