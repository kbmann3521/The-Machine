import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase-client'
import { getPostById, updatePost, deletePost } from '../../../../lib/blog-client'
import { generateSlug } from '../../../../lib/slug-utils'
import styles from '../../../../styles/blog-admin-forms.module.css'

export default function EditPost() {
  const router = useRouter()
  const { id } = router.query

  const [post, setPost] = useState(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [seoNoindex, setSeoNoindex] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
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

      try {
        const postData = await getPostById(id)
        setPost(postData)
        setTitle(postData.title)
        setSlug(postData.slug)
        setExcerpt(postData.excerpt || '')
        setContent(postData.content)
        setStatus(postData.status)
        setSeoTitle(postData.seo_title || '')
        setSeoDescription(postData.seo_description || '')
        setOgTitle(postData.og_title || '')
        setOgDescription(postData.og_description || '')
        setOgImageUrl(postData.og_image_url || '')
        setSeoNoindex(postData.seo_noindex || false)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id, router])

  const handleUpdate = async (e, newStatus = null) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const updatedPost = await updatePost(id, {
        title,
        slug,
        excerpt,
        content,
        status: newStatus || status,
        published_at: post.published_at,
        seo_title: seoTitle,
        seo_description: seoDescription,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
        seo_noindex: seoNoindex,
      })

      setPost(updatedPost)
      setStatus(updatedPost.status)
      setSuccessMessage('Post updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    await handleUpdate(e, 'published')
  }

  const handleUnpublish = async (e) => {
    e.preventDefault()
    await handleUpdate(e, 'draft')
  }

  const handleDelete = async () => {
    try {
      setError('')
      await deletePost(id)
      router.push('/admin/posts')
    } catch (err) {
      setError(err.message)
      setDeleteModalOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Edit Post - Admin</title>
        </Head>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderTitle}>Blog Admin</div>
        </div>
        <div className={styles.loadingState}>Loading post...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Edit Post - Admin</title>
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
        <div className={styles.adminContent}>
          <div className={styles.errorMessage}>Post not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Edit Post - Admin</title>
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

      <div className={styles.adminContent}>
        <div className={styles.adminSection}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className={styles.adminTitle} style={{ margin: 0, marginBottom: '0.5rem' }}>
              {title || 'Untitled Post'}
            </h1>
            <p className={styles.postMeta}>
              Last updated: {formatDate(post.updated_at)}
            </p>
          </div>

          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleUpdate} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="title">
                Title <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="slug">
                Slug <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                id="slug"
                type="text"
                className={styles.formInput}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                disabled={saving}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
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
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="content">
                Content (Markdown) <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <textarea
                id="content"
                className={styles.formTextarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="status">
                Status <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <select
                id="status"
                className={styles.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* SEO Section */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Search & Social Metadata</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Customize how this post appears in search results and social media previews. Defaults to title and excerpt if not specified.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="seoTitle">
                  Meta Title (Page Title for Search)
                </label>
                <input
                  id="seoTitle"
                  type="text"
                  className={styles.formInput}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'Defaults to post title'}
                  disabled={saving}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                  {seoTitle.length}/60 characters (recommended: ~50-60)
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="seoDescription">
                  Meta Description (Search Result Preview)
                </label>
                <textarea
                  id="seoDescription"
                  className={styles.formTextarea}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={excerpt || 'Defaults to post excerpt'}
                  rows="3"
                  disabled={saving}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                  {seoDescription.length}/160 characters (recommended: ~155-160)
                </p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>Social Media</h3>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="ogTitle">
                    Open Graph Title (Facebook/LinkedIn)
                  </label>
                  <input
                    id="ogTitle"
                    type="text"
                    className={styles.formInput}
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder={title || 'Defaults to post title'}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="ogDescription">
                    Open Graph Description
                  </label>
                  <textarea
                    id="ogDescription"
                    className={styles.formTextarea}
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder={excerpt || 'Defaults to post excerpt'}
                    rows="3"
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="ogImageUrl">
                    Open Graph Image URL
                  </label>
                  <input
                    id="ogImageUrl"
                    type="text"
                    className={styles.formInput}
                    value={ogImageUrl}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    disabled={saving}
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                    Absolute URL, 1200x630px recommended
                  </p>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>Indexing</h3>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={seoNoindex}
                    onChange={(e) => setSeoNoindex(e.target.checked)}
                    disabled={saving}
                  />
                  Hide from search results (noindex)
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>
                  {status === 'draft' ? '✓ Draft posts are automatically hidden from search' : 'Override: Hide published post from search engines'}
                </p>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {status === 'draft' ? (
                <button onClick={handlePublish} className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              ) : (
                <button onClick={handleUnpublish} className={styles.secondaryBtn} disabled={saving}>
                  Unpublish
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className={styles.dangerBtn}
                disabled={saving}
              >
                Delete
              </button>

              <Link href="/admin/posts" className={styles.secondaryBtn}>
                Back to Posts
              </Link>
            </div>
          </form>
        </div>
      </div>

      {deleteModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Delete Post</div>
            <p>Are you sure you want to delete "{title}"? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button onClick={handleDelete} className={styles.dangerBtn}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
