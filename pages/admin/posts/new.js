import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase-client'
import { createPost } from '../../../lib/blog-client'
import { generateSlug } from '../../../lib/slug-utils'
import MediaPickerModal from '../../../components/MediaPickerModal'
import styles from '../../../styles/blog-admin-forms.module.css'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedAccordions, setExpandedAccordions] = useState({
    actions: true,
    basicInfo: true,
    thumbnail: false,
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
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

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title, slug])

  const toggleAccordion = (section) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const post = await createPost({
        title,
        slug,
        excerpt,
        content,
        status,
        thumbnail_url: thumbnailUrl,
      })

      router.push(`/admin/posts/${post.id}/edit`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>New Post - Admin</title>
        </Head>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderTitle}>Blog Admin</div>
        </div>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>New Post - Admin</title>
      </Head>

      <div className={styles.adminHeader}>
        <div className={styles.adminHeaderTitle}>Blog Admin</div>
        <div className={styles.adminNavigation}>
          <Link href="/admin/posts" className={styles.adminNavLink}>
            Posts
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div className={styles.editPageContainer}>
        <div className={styles.mainContentArea}>
          <div className={styles.postHeader}>
            <h1 className={styles.postTitle}>Create New Post</h1>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="title">
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="title"
                type="text"
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter post title"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="content">
                Content (Markdown) <span className={styles.required}>*</span>
              </label>
              <textarea
                id="content"
                className={styles.contentTextarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
                placeholder="Write your post content in Markdown format..."
              />
            </div>
          </form>
        </div>

        <div className={`${styles.sidebarContainer} ${sidebarOpen ? '' : styles.sidebarCollapsed}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Post Settings</h2>
            <button
              className={styles.sidebarToggleBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>

          <div className={styles.sidebarContent}>
            {/* Actions Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('actions')}
              >
                <span className={styles.accordionTitle}>Actions</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.actions ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.actions && (
                <div className={styles.accordionBody}>
                  <div className={styles.sidebarActions}>
                    <button
                      type="submit"
                      form="new-post-form"
                      className={styles.sidebarPrimaryBtn}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Post'}
                    </button>

                    <Link href="/admin/posts" className={styles.sidebarSecondaryBtn}>
                      Cancel
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('basicInfo')}
              >
                <span className={styles.accordionTitle}>Basic Info</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.basicInfo ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.basicInfo && (
                <div className={styles.accordionBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="slug">
                      Slug <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="slug"
                      type="text"
                      className={styles.formInput}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Auto-generated from title"
                    />
                    <p className={styles.fieldHint}>
                      URL-friendly identifier (lowercase, hyphens)
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="excerpt">
                      Excerpt
                    </label>
                    <input
                      id="excerpt"
                      type="text"
                      className={styles.formInput}
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      disabled={loading}
                      placeholder="Short summary of the post (optional)"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="status">
                      Status <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="status"
                      className={styles.formSelect}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={loading}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('thumbnail')}
              >
                <span className={styles.accordionTitle}>Thumbnail</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.thumbnail ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.thumbnail && (
                <div className={styles.accordionBody}>
                  {thumbnailUrl ? (
                    <div className={styles.thumbnailPreviewSmall}>
                      <div className={styles.thumbnailImageSmall}>
                        <img src={thumbnailUrl} alt="Post thumbnail" />
                      </div>
                      <p className={styles.thumbnailUrlSmall}>{thumbnailUrl}</p>
                      <div className={styles.thumbnailActionsSmall}>
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className={styles.sidebarPrimaryBtn}
                          disabled={loading}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailUrl('')}
                          className={styles.sidebarDangerBtn}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className={styles.sidebarPrimaryBtn}
                      disabled={loading}
                    >
                      + Add Thumbnail
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setThumbnailUrl(url)}
      />
    </div>
  )
}
