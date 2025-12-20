import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import AdminHeader from '../../components/AdminHeader'
import styles from '../../styles/blog-admin-forms.module.css'

export default function InternalLinkingAdmin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [previewData, setPreviewData, ] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [applyingRule, setApplyingRule] = useState(null)
  const [rollbackingRule, setRollbackingRule] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    phrase: '',
    target_url: '',
    max_links_per_post: 1,
    skip_headings: true,
    skip_code_blocks: true,
    skip_existing_links: true,
    skip_first_paragraph: false,
    notes: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

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

      await fetchRules()
    }

    if (router.isReady) {
      checkAuth()
    }
  }, [router.isReady])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/rules', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }

      const data = await response.json()
      setRules(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setSuccessMessage('Rule created successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      setFormData({
        phrase: '',
        target_url: '',
        max_links_per_post: 1,
        skip_headings: true,
        skip_code_blocks: true,
        skip_existing_links: true,
        skip_first_paragraph: false,
        notes: '',
      })
      setShowForm(false)
      await fetchRules()
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePreviewRule = async (ruleId) => {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ruleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      setPreviewData(data)
      setShowPreview(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleApplyRule = async (ruleId) => {
    if (!window.confirm('Apply this rule? This will insert links into posts based on the preview.')) {
      return
    }

    setError('')
    setApplyingRule(ruleId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ruleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setSuccessMessage('Rule applied successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      setShowPreview(false)
      await fetchRules()
    } catch (err) {
      setError(err.message)
    } finally {
      setApplyingRule(null)
    }
  }

  const handleRollbackRule = async (ruleId) => {
    if (!window.confirm('Rollback this rule? This will remove inserted links from posts.')) {
      return
    }

    setError('')
    setRollbackingRule(ruleId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ruleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setSuccessMessage('Rule rolled back successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchRules()
    } catch (err) {
      setError(err.message)
    } finally {
      setRollbackingRule(null)
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule? Make sure it has been rolled back first.')) {
      return
    }

    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/internal-linking/rules', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: ruleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setSuccessMessage('Rule deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchRules()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Internal Linking Rules - Admin</title>
        </Head>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderTitle}>Internal Linking Rules</div>
        </div>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Internal Linking Rules - Admin</title>
      </Head>

      <div className={styles.adminHeader}>
        <div className={styles.adminHeaderTitle}>Internal Linking Rules</div>
        <div className={styles.adminNavigation}>
          <Link href="/admin/posts" className={styles.adminNavLink}>
            Posts
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div className={styles.adminContent}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Create global phrase → link rules for glossary terms and tool references.
          Rules are applied safely with preview, approval, and rollback options.
        </p>

        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <button
          onClick={() => setShowForm(!showForm)}
          className={styles.sidebarPrimaryBtn}
          style={{ marginBottom: '2rem' }}
        >
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>

        {showForm && (
          <div className={styles.adminSection}>
            <h2 style={{ marginTop: 0 }}>Create New Rule</h2>
            <form onSubmit={handleCreateRule}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="phrase">
                  Phrase <span className={styles.required}>*</span>
                </label>
                <input
                  id="phrase"
                  type="text"
                  className={styles.formInput}
                  name="phrase"
                  value={formData.phrase}
                  onChange={handleFormChange}
                  placeholder="e.g., JWT, CIDR, IP address toolkit"
                  required
                />
                <p className={styles.fieldHint}>2-60 characters. Use stable, unambiguous terms.</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="target_url">
                  Target URL <span className={styles.required}>*</span>
                </label>
                <input
                  id="target_url"
                  type="text"
                  className={styles.formInput}
                  name="target_url"
                  value={formData.target_url}
                  onChange={handleFormChange}
                  placeholder="e.g., /blog/what-is-jwt or /tools/jwt-debugger"
                  required
                />
                <p className={styles.fieldHint}>Internal URLs recommended (/blog/... or /tools/...)</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="max_links_per_post">
                  Max Links Per Post
                </label>
                <input
                  id="max_links_per_post"
                  type="number"
                  className={styles.formInput}
                  name="max_links_per_post"
                  value={formData.max_links_per_post}
                  onChange={handleFormChange}
                  min="1"
                  max="3"
                />
                <p className={styles.fieldHint}>Default: 1 (recommended). Maximum: 3</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="skip_headings"
                    checked={formData.skip_headings}
                    onChange={handleFormChange}
                  />
                  Skip headings
                </label>
                <p className={styles.fieldHint}>Don't link phrases in heading lines (#, ##, etc.)</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="skip_code_blocks"
                    checked={formData.skip_code_blocks}
                    onChange={handleFormChange}
                  />
                  Skip code blocks
                </label>
                <p className={styles.fieldHint}>Don't link phrases in code fences or inline code</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="skip_existing_links"
                    checked={formData.skip_existing_links}
                    onChange={handleFormChange}
                  />
                  Skip existing links
                </label>
                <p className={styles.fieldHint}>Don't link phrases that are already linked</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="skip_first_paragraph"
                    checked={formData.skip_first_paragraph}
                    onChange={handleFormChange}
                  />
                  Skip first paragraph
                </label>
                <p className={styles.fieldHint}>Optional: skip linking in the introduction</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="notes">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  className={styles.formTextarea}
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="e.g., 'Tool reference' or 'Common terminology'"
                  rows="3"
                />
              </div>

              <button type="submit" className={styles.sidebarPrimaryBtn}>
                Create Rule
              </button>
            </form>
          </div>
        )}

        {showPreview && previewData && (
          <div className={styles.adminSection} style={{ marginTop: '2rem', backgroundColor: '#f0f7ff', borderColor: '#1976d2' }}>
            <h3>Preview Results for: "{previewData.rule.phrase}"</h3>
            <p>Affected posts: {previewData.affectedPostsCount} | Total links to insert: {previewData.totalInserts}</p>

            {previewData.riskWarnings.length > 0 && (
              <div style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #f57c00', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                <strong>⚠ Risk Warnings:</strong>
                {previewData.riskWarnings.map((w, i) => (
                  <p key={i} style={{ margin: '0.5rem 0 0 0' }}>• {w.message}</p>
                ))}
              </div>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
              {previewData.affectedPosts.map((post) => (
                <div key={post.postId} style={{ paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                  <div>
                    <strong>{post.title}</strong> ({post.slug})
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Matches: {post.matchCount} | Will insert: {post.insertCount}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    …{post.context}…
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleApplyRule(previewData.rule.id)}
                disabled={applyingRule === previewData.rule.id}
                className={styles.sidebarPrimaryBtn}
              >
                {applyingRule === previewData.rule.id ? 'Applying...' : 'Apply Rule'}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className={styles.sidebarSecondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={styles.adminSection} style={{ marginTop: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Active Rules</h2>

          {rules.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No rules yet. Create one to get started.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Phrase</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Target</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Enabled</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Affected Posts</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Inserts</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{rule.phrase}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: '#2e7d32', fontFamily: 'monospace' }}>
                      {rule.target_url}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {rule.is_enabled ? '✓' : '✕'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {rule.stats.affectedPosts}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {rule.stats.totalInserts}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                      <button
                        onClick={() => handlePreviewRule(rule.id)}
                        className={styles.sidebarSecondaryBtn}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}
                      >
                        Preview
                      </button>
                      {rule.stats.totalInserts > 0 && (
                        <button
                          onClick={() => handleRollbackRule(rule.id)}
                          disabled={rollbackingRule === rule.id}
                          className={styles.sidebarDangerBtn}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}
                        >
                          {rollbackingRule === rule.id ? '...' : 'Rollback'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className={styles.sidebarDangerBtn}
                        disabled={rule.stats.totalInserts > 0}
                        title={rule.stats.totalInserts > 0 ? 'Rollback first' : ''}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
