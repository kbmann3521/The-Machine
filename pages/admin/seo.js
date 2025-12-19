import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase-client'
import AdminHeader from '../../components/AdminHeader'
import { AVAILABLE_PAGES, searchPages, generateRobotsText } from '../../lib/pageDiscovery'
import styles from '../../styles/blog-admin-posts.module.css'
import seoStyles from '../../styles/seo-admin.module.css'

export default function AdminSEO() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [pageRules, setPageRules] = useState({})
  const [pageSearch, setPageSearch] = useState('')
  const [filteredPages, setFilteredPages] = useState(AVAILABLE_PAGES)
  const router = useRouter()

  // Default page rules based on recommended SEO settings
  const DEFAULT_PAGE_RULES = {
    '/ip-toolkit-tests': { noindex: true, nofollow: false },
    '/jwt-tests': { noindex: true, nofollow: true },
    '/math-evaluator-tests': { noindex: true, nofollow: true },
    '/phase5-tests': { noindex: true, nofollow: false },
    '/test-detection': { noindex: true, nofollow: false },
  }

  const [settings, setSettings] = useState({
    site_name: '',
    canonical_base_url: '',
    favicon_url: '',
    theme_color: '',
    default_title: '',
    default_description: '',
    index_site: true,
    robots_txt: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    og_type: 'website',
    twitter_card_type: 'summary_large_image',
    twitter_site: '',
    twitter_creator: '',
  })

  useEffect(() => {
    const checkAuthAndLoadSettings = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()

      if (!adminUser) {
        router.push('/admin/login')
        return
      }

      loadSettings(session.access_token)
    }

    checkAuthAndLoadSettings()
  }, [router])

  const loadSettings = async (token) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const response = await fetch(`${baseUrl}/api/seo/get-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'same-origin',
      })

      if (response.ok) {
        const data = await response.json()

        // Normalize null values to empty strings for form inputs
        const normalizedData = {}
        Object.entries(data).forEach(([key, value]) => {
          if (value === null) {
            normalizedData[key] = ''
          } else {
            normalizedData[key] = value
          }
        })

        // If robots_txt is empty, show the default (but don't save it)
        if (!normalizedData.robots_txt || !normalizedData.robots_txt.trim()) {
          normalizedData.robots_txt = generateRobotsText('', normalizedData.index_site || true)
        }

        setSettings((prev) => ({ ...prev, ...normalizedData }))
        if (data.updated_at) {
          setLastUpdated(new Date(data.updated_at))
        }
        if (data.page_rules && typeof data.page_rules === 'object') {
          setPageRules(data.page_rules)
          // Store in localStorage for client-side robots meta injection
          if (typeof window !== 'undefined') {
            localStorage.setItem('seoPageRules', JSON.stringify(data.page_rules))
          }
        }
      }
    } catch (err) {
      console.error('Failed to load SEO settings:', err)
      setErrorMessage('Failed to load SEO settings')
    } finally {
      setLoading(false)
    }
  }

  // Filter pages as user types
  useEffect(() => {
    setFilteredPages(searchPages(pageSearch))
  }, [pageSearch])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'index_site') {
      const newChecked = checked

      setSettings((prev) => {
        const updated = { ...prev, [name]: newChecked }

        // If robots.txt is currently the auto-generated default, regenerate it
        // This way manual overrides are preserved
        const currentDefault = generateRobotsText('', prev.index_site)
        const isUsingDefault = prev.robots_txt.trim() === currentDefault.trim()

        if (isUsingDefault) {
          const newDefault = generateRobotsText('', newChecked)
          updated.robots_txt = newDefault
        }

        return updated
      })
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  const handlePageRuleChange = (path, directive, checked) => {
    const updated = { ...pageRules }
    if (!updated[path]) {
      updated[path] = { noindex: false, nofollow: false }
    }
    updated[path][directive] = checked
    setPageRules(updated)

    // Note: Page rules do NOT affect robots.txt
    // They only control <meta name="robots"> injection on pages
    // robots.txt is structural only (path-based)
  }

  const togglePageRule = (path) => {
    if (pageRules[path]) {
      const { [path]: _, ...rest } = pageRules
      setPageRules(rest)
    } else {
      const updated = { ...pageRules }
      updated[path] = { noindex: false, nofollow: false }
      setPageRules(updated)
    }
  }

  const validateSettings = () => {
    if (settings.canonical_base_url) {
      if (!settings.canonical_base_url.startsWith('https://')) {
        setErrorMessage('Canonical base URL must start with https://')
        return false
      }
      if (settings.canonical_base_url.endsWith('/')) {
        setErrorMessage('Canonical base URL should not end with /')
        return false
      }
    }

    if (settings.default_description && settings.default_description.length > 160) {
      console.warn(`Meta description is ${settings.default_description.length} chars (recommended: ~160)`)
    }

    if (settings.twitter_site && !settings.twitter_site.startsWith('@')) {
      setErrorMessage('Twitter handle should start with @')
      return false
    }

    return true
  }

  const handleSave = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!validateSettings()) {
      return
    }

    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const response = await fetch(`${baseUrl}/api/seo/update-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...settings,
          page_rules: pageRules,
        }),
        credentials: 'same-origin',
      })

      if (response.ok) {
        // Store page rules in localStorage for client-side robots meta injection
        if (typeof window !== 'undefined') {
          localStorage.setItem('seoPageRules', JSON.stringify(pageRules))
        }
        setSuccessMessage('SEO settings saved successfully')
        setLastUpdated(new Date())
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to save SEO settings')
      }
    } catch (err) {
      console.error('Error saving SEO settings:', err)
      setErrorMessage('Failed to save SEO settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>SEO Config - Admin</title>
        </Head>
        <AdminHeader currentSection="seo" />
        <div className={styles.loadingState}>Loading SEO settings...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>SEO Config - Admin</title>
      </Head>

      <AdminHeader currentSection="seo" />

      <div className={styles.adminContent}>
        <div className={styles.adminSection}>
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

          <div className={seoStyles.headerGroup}>
            <h1 className={styles.adminTitle} style={{ margin: 0 }}>
              SEO Configuration
            </h1>
            {lastUpdated && (
              <p className={seoStyles.lastUpdated}>
                Last updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className={seoStyles.formContainer}>
            {/* Site Identity */}
            <section className={seoStyles.section}>
              <h2 className={seoStyles.sectionTitle}>Site Identity</h2>
              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Site Name
                  <input
                    type="text"
                    name="site_name"
                    value={settings.site_name}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="All-in-One Internet Tools"
                  />
                </label>
                <p className={seoStyles.hint}>Used in metadata and browser titles</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Canonical Base URL
                  <input
                    type="text"
                    name="canonical_base_url"
                    value={settings.canonical_base_url}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="https://example.com"
                  />
                </label>
                <p className={seoStyles.hint}>Must start with https:// and not end with /</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Favicon URL
                  <input
                    type="text"
                    name="favicon_url"
                    value={settings.favicon_url}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="https://example.com/favicon.ico"
                  />
                </label>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Theme Color
                  <input
                    type="text"
                    name="theme_color"
                    value={settings.theme_color}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="#2e7d32"
                  />
                </label>
                <p className={seoStyles.hint}>Hex color code (e.g., #2e7d32)</p>
              </div>
            </section>

            {/* Default Meta Tags */}
            <section className={seoStyles.section}>
              <h2 className={seoStyles.sectionTitle}>Default Meta Tags</h2>
              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Default Page Title
                  <input
                    type="text"
                    name="default_title"
                    value={settings.default_title}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="All-in-One Internet Tools - Free Online Utilities"
                  />
                </label>
                <p className={seoStyles.hint}>Fallback when page doesn't set its own title</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Default Meta Description
                  <textarea
                    name="default_description"
                    value={settings.default_description}
                    onChange={handleChange}
                    className={seoStyles.textarea}
                    placeholder="Free tools for text transformation, image processing, and more..."
                    rows="3"
                  />
                </label>
                <p className={seoStyles.hint}>
                  {settings.default_description.length}/160 characters (recommended: ~160)
                </p>
              </div>
            </section>

            {/* Indexing Controls */}
            <section className={seoStyles.section}>
              <h2 className={seoStyles.sectionTitle}>Indexing Controls</h2>
              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="index_site"
                    checked={settings.index_site}
                    onChange={handleChange}
                  />
                  Allow search engines to index this site
                </label>
                <p className={seoStyles.hint}>
                  {settings.index_site
                    ? 'Search engines can crawl and index your site'
                    : 'Site will be hidden from search results (noindex, nofollow)'}
                </p>
              </div>

              {/* Per-Page Rules */}
              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Page-Specific Rules
                  <p className={seoStyles.hint} style={{ marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    Select specific pages and apply indexing directives. These rules will automatically generate your robots.txt.
                  </p>
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className={seoStyles.input}
                  />
                </label>
              </div>

              <div className={seoStyles.pageRulesList}>
                {filteredPages.map((page) => {
                  const hasRule = pageRules[page.path]
                  return (
                    <div key={page.path} className={seoStyles.pageRuleItem}>
                      <div className={seoStyles.pageRuleHeader}>
                        <label className={seoStyles.checkboxLabel} style={{ flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={hasRule ? true : false}
                            onChange={() => togglePageRule(page.path)}
                          />
                          <span>{page.label}</span>
                          <span className={seoStyles.pagePathLabel}>{page.path}</span>
                        </label>
                      </div>
                      {hasRule && (
                        <div className={seoStyles.pageRuleDirectives}>
                          <label className={seoStyles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={pageRules[page.path].noindex || false}
                              onChange={(e) => handlePageRuleChange(page.path, 'noindex', e.target.checked)}
                            />
                            noindex (hide from search results)
                          </label>
                          <label className={seoStyles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={pageRules[page.path].nofollow || false}
                              onChange={(e) => handlePageRuleChange(page.path, 'nofollow', e.target.checked)}
                            />
                            nofollow (don't follow links on this page)
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className={seoStyles.fieldGroup} style={{ marginTop: '1.5rem' }}>
                <label className={seoStyles.label}>
                  robots.txt
                  <p className={seoStyles.hint} style={{ marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    Controls crawl-level access (structural rules). Page-specific rules above control meta tags, not robots.txt. Leave empty to use default rules.
                  </p>
                  <textarea
                    name="robots_txt"
                    value={settings.robots_txt}
                    onChange={handleChange}
                    className={seoStyles.textarea}
                    placeholder="Leave empty for default: Allow /, Disallow: /admin/, /api/, /.next/"
                    rows="8"
                  />
                </label>
              </div>
            </section>

            {/* Social Sharing */}
            <section className={seoStyles.section}>
              <h2 className={seoStyles.sectionTitle}>Social Sharing</h2>
              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Open Graph Title
                  <input
                    type="text"
                    name="og_title"
                    value={settings.og_title}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="All-in-One Internet Tools"
                  />
                </label>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Open Graph Description
                  <textarea
                    name="og_description"
                    value={settings.og_description}
                    onChange={handleChange}
                    className={seoStyles.textarea}
                    placeholder="Free online tools for developers and content creators..."
                    rows="3"
                  />
                </label>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Open Graph Image URL
                  <input
                    type="text"
                    name="og_image_url"
                    value={settings.og_image_url}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="https://example.com/og-image.png"
                  />
                </label>
                <p className={seoStyles.hint}>Should be an absolute URL (1200x630px recommended)</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Open Graph Type
                  <input
                    type="text"
                    name="og_type"
                    value={settings.og_type}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="website"
                  />
                </label>
                <p className={seoStyles.hint}>Common values: website, article, blog</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Twitter Card Type
                  <input
                    type="text"
                    name="twitter_card_type"
                    value={settings.twitter_card_type}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="summary_large_image"
                  />
                </label>
                <p className={seoStyles.hint}>Common values: summary, summary_large_image</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Twitter Site Handle
                  <input
                    type="text"
                    name="twitter_site"
                    value={settings.twitter_site}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="@yourhandle"
                  />
                </label>
                <p className={seoStyles.hint}>Should start with @ (e.g., @yourhandle)</p>
              </div>

              <div className={seoStyles.fieldGroup}>
                <label className={seoStyles.label}>
                  Twitter Creator
                  <input
                    type="text"
                    name="twitter_creator"
                    value={settings.twitter_creator}
                    onChange={handleChange}
                    className={seoStyles.input}
                    placeholder="@creatorhandle"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className={seoStyles.actions}>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${styles.publishBtn} ${styles.publishBtnFull}`}
            >
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
