import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { marked } from 'marked'
import { supabase } from '../../../../lib/supabase-client'
import { getPostById, updatePost, deletePost, createPost } from '../../../../lib/blog-client'
import { generateSlug } from '../../../../lib/slug-utils'
import MediaPickerModal from '../../../../components/MediaPickerModal'
import styles from '../../../../styles/blog-admin-forms.module.css'
import blogPostStyles from '../../../../styles/blog-post.module.css'

export default function EditPost() {
  const router = useRouter()
  const { id } = router.query
  const isNewPost = id === 'new'

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
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [postNotFoundError, setPostNotFoundError] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [contentTab, setContentTab] = useState('edit')
  const [customCss, setCustomCss] = useState('')
  const [expandedAccordions, setExpandedAccordions] = useState({
    actions: true,
    basicInfo: true,
    thumbnail: false,
    seo: false,
    social: false,
    indexing: false,
  })

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

      if (!isNewPost && id) {
        setLoading(true)
        setSaving(false)
        setSuccessMessage('')
        setPostNotFoundError(false)
        try {
          const postData = await getPostById(id)
          if (!postData) {
            setPostNotFoundError(true)
            setPost(null)
          } else {
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
            setThumbnailUrl(postData.thumbnail_url || '')
            setPostNotFoundError(false)
          }
        } catch (err) {
          setError(err.message)
          setPostNotFoundError(true)
        } finally {
          setLoading(false)
        }
      }
    }

    if (router.isReady) {
      if (isNewPost) {
        setLoading(false)
        setPostNotFoundError(false)
      }
      checkAuth()
    }
  }, [router.isReady, id, isNewPost])

  useEffect(() => {
    if (title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title, slug])

  useEffect(() => {
    if (!isNewPost && post) {
      setSaving(false)
      setError('')
    }
  }, [post])

  useEffect(() => {
    const fetchCustomCss = async () => {
      try {
        const response = await fetch('/api/blog/custom-css')
        const data = await response.json()
        setCustomCss(data.css || '')
      } catch (err) {
        console.error('Failed to load custom CSS:', err)
      }
    }

    fetchCustomCss()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const newPost = await createPost({
        title,
        slug,
        excerpt,
        content,
        status,
        thumbnail_url: thumbnailUrl,
      })

      router.push(`/admin/posts/${newPost.id}/edit`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

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
        thumbnail_url: thumbnailUrl,
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

  const toggleAccordion = (section) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
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

  if (!isNewPost && !loading && postNotFoundError) {
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

  const pageTitle = isNewPost ? 'Create New Post' : title || 'Untitled Post'
  const headTitle = isNewPost ? 'New Post - Admin' : 'Edit Post - Admin'
  const submitHandler = isNewPost ? handleCreate : handleUpdate

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>{headTitle}</title>
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
            <h1 className={styles.postTitle}>{pageTitle}</h1>
            {!isNewPost && post && (
              <p className={styles.postTimestamp}>Last updated: {formatDate(post.updated_at)}</p>
            )}
          </div>

          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={submitHandler} className={styles.editForm}>
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
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="content">
                Content (Markdown) <span className={styles.required}>*</span>
              </label>
              <div className={styles.contentTabContainer}>
                <div className={styles.contentTabs}>
                  <button
                    type="button"
                    className={`${styles.contentTab} ${contentTab === 'edit' ? styles.contentTabActive : ''}`}
                    onClick={() => setContentTab('edit')}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.contentTab} ${contentTab === 'preview' ? styles.contentTabActive : ''}`}
                    onClick={() => setContentTab('preview')}
                  >
                    Preview
                  </button>
                </div>
                {contentTab === 'edit' ? (
                  <textarea
                    id="content"
                    className={styles.contentTextarea}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    disabled={saving}
                    placeholder="Write your post content in Markdown format..."
                  />
                ) : (
                  <div className={styles.contentPreview}>
                    <div
                      className={blogPostStyles.postContent}
                      dangerouslySetInnerHTML={{
                        __html: marked(content || ''),
                      }}
                    />
                  </div>
                )}
              </div>
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
                    {!isNewPost && status === 'published' && (
                      <button
                        type="button"
                        onClick={() => window.open(`/blog/${slug}`, '_blank')}
                        className={styles.sidebarSecondaryBtn}
                      >
                        Open in New Tab
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={submitHandler}
                      className={styles.sidebarPrimaryBtn}
                      disabled={saving}
                    >
                      {isNewPost ? (saving ? 'Creating...' : 'Create Post') : (saving ? 'Saving...' : 'Save Changes')}
                    </button>

                    {!isNewPost && (
                      <>
                        {status === 'draft' ? (
                          <button
                            onClick={handlePublish}
                            className={styles.sidebarPrimaryBtn}
                            disabled={saving}
                          >
                            {saving ? 'Publishing...' : 'Publish'}
                          </button>
                        ) : (
                          <button
                            onClick={handleUnpublish}
                            className={styles.sidebarSecondaryBtn}
                            disabled={saving}
                          >
                            Unpublish
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteModalOpen(true)}
                          className={styles.sidebarDangerBtn}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    <Link href="/admin/posts" className={styles.sidebarSecondaryBtn}>
                      {isNewPost ? 'Cancel' : 'Back to Posts'}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                          disabled={saving}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailUrl('')}
                          className={styles.sidebarDangerBtn}
                          disabled={saving}
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
                      disabled={saving}
                    >
                      + Add Thumbnail
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SEO Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('seo')}
              >
                <span className={styles.accordionTitle}>SEO</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.seo ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.seo && (
                <div className={styles.accordionBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="seoTitle">
                      Meta Title
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
                    <p className={styles.fieldHint}>
                      {seoTitle.length}/60 characters (recommended: ~50-60)
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="seoDescription">
                      Meta Description
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
                    <p className={styles.fieldHint}>
                      {seoDescription.length}/160 characters (recommended: ~155-160)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('social')}
              >
                <span className={styles.accordionTitle}>Social Media</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.social ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.social && (
                <div className={styles.accordionBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="ogTitle">
                      Open Graph Title
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
                    <p className={styles.fieldHint}>
                      Absolute URL, 1200x630px recommended
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Indexing Accordion */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion('indexing')}
              >
                <span className={styles.accordionTitle}>Indexing</span>
                <span className={`${styles.accordionIcon} ${expandedAccordions.indexing ? styles.expanded : ''}`}>
                  ›
                </span>
              </button>
              {expandedAccordions.indexing && (
                <div className={styles.accordionBody}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={seoNoindex}
                      onChange={(e) => setSeoNoindex(e.target.checked)}
                      disabled={saving}
                    />
                    Hide from search results (noindex)
                  </label>
                  <p className={styles.fieldHint}>
                    {status === 'draft' ? '✓ Draft posts are automatically hidden from search' : 'Override: Hide published post from search engines'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isNewPost && deleteModalOpen && (
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

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setThumbnailUrl(url)}
      />
    </div>
  )
}
