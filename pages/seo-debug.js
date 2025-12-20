import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getRobotsMetaContent, getAdminRobotsMeta } from '../lib/getRobotsMeta'

export default function SEODebug() {
  const router = useRouter()
  const [debug, setDebug] = useState(null)
  const [metaTag, setMetaTag] = useState(null)

  useEffect(() => {
    // Check localStorage
    const pageRulesStr = typeof window !== 'undefined' ? localStorage.getItem('seoPageRules') : null
    let pageRules = null

    if (pageRulesStr) {
      try {
        pageRules = JSON.parse(pageRulesStr)
      } catch (e) {
        console.error('Failed to parse seoPageRules from localStorage:', e)
      }
    }

    const adminMeta = getAdminRobotsMeta(router.pathname)
    const metaContent = adminMeta || getRobotsMetaContent(router.pathname, pageRules)

    // Check actual meta tag in DOM (with small delay to let injector run)
    setTimeout(() => {
      const actualMetaTag = document.querySelector('meta[name="robots"]')
      setMetaTag({
        exists: actualMetaTag !== null,
        content: actualMetaTag?.getAttribute('content') || 'NOT FOUND',
      })
    }, 100)

    setDebug({
      pathname: router.pathname,
      pageRules,
      adminMeta,
      metaContent,
      localStorageExists: pageRulesStr !== null,
      localStorageContent: pageRulesStr || '(empty)',
    })
  }, [router.pathname])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#e4e4e4', minHeight: '100vh' }}>
      <h1>SEO Debug Info</h1>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>Page Route: {debug?.pathname}</h2>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>localStorage.seoPageRules</h2>
        <pre>{debug?.localStorageExists ? JSON.stringify(debug?.pageRules, null, 2) : 'EMPTY - Not saved yet'}</pre>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>Meta Tag in DOM</h2>
        <p>
          <strong>Exists:</strong> {metaTag?.exists ? '✅ YES' : '❌ NO'}
        </p>
        <p>
          <strong>Content:</strong> {metaTag?.content}
        </p>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>Computed Meta Content</h2>
        <p>
          <strong>Admin Meta:</strong> {debug?.adminMeta || 'None'}
        </p>
        <p>
          <strong>Should Inject:</strong> {debug?.metaContent || 'No (use default)'}
        </p>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>Test Pages</h2>
        <ul>
          <li>
            <a href="/jwt-tests" style={{ color: '#0066cc' }}>
              /jwt-tests (should have: noindex,nofollow)
            </a>
          </li>
          <li>
            <a href="/math-evaluator-tests" style={{ color: '#0066cc' }}>
              /math-evaluator-tests (should have: noindex,nofollow)
            </a>
          </li>
          <li>
            <a href="/ip-toolkit-tests" style={{ color: '#0066cc' }}>
              /ip-toolkit-tests (should have: noindex)
            </a>
          </li>
          <li>
            <a href="/admin/login" style={{ color: '#0066cc' }}>
              /admin/login (should have: noindex,nofollow)
            </a>
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <h2>Quick Test</h2>
        <p>
          1. Go to <a href="/admin/seo" style={{ color: '#0066cc' }}>SEO Admin</a>
        </p>
        <p>2. Make sure test pages have noindex checked</p>
        <p>3. Click Save</p>
        <p>4. Come back here and refresh this page</p>
        <p>5. Visit a test page and check if "Meta Tag in DOM" shows ✅ YES</p>
      </div>
    </div>
  )
}
