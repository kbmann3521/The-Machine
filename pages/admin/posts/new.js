import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase-client'
import { createPost } from '../../../lib/blog-client'
import { generateSlug } from '../../../lib/slug-utils'
import styles from '../../../styles/blog-admin.module.css'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
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

      <div className={styles.adminContent}>
        <div className={styles.adminSection}>
          <h1 className={styles.adminTitle} style={{ marginTop: 0 }}>
            Create New Post
          </h1>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
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
                disabled={loading}
                placeholder="Enter post title"
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
                disabled={loading}
                placeholder="Auto-generated from title"
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
                disabled={loading}
                placeholder="Short summary of the post (optional)"
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
                disabled={loading}
                placeholder="Write your post content in Markdown..."
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
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? 'Creating...' : 'Create Post'}
              </button>
              <Link href="/admin/posts" className={styles.secondaryBtn}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
