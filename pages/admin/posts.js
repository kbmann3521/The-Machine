import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import { getAllPosts, deletePost, publishPost, unpublishPost } from '../../lib/blog-client'
import styles from '../../styles/blog-admin.module.css'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletePostId, setDeletePostId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadPosts = async () => {
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
        const result = await getAllPosts()
        setPosts(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadPosts()
  }, [router])

  const handleDelete = async () => {
    if (!deletePostId) return

    try {
      setError('')
      await deletePost(deletePostId)
      setPosts(posts.filter((p) => p.id !== deletePostId))
      setSuccessMessage('Post deleted successfully')
      setDeleteModalOpen(false)
      setDeletePostId(null)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
      setDeleteModalOpen(false)
      setDeletePostId(null)
    }
  }

  const handlePublish = async (postId) => {
    try {
      setError('')
      await publishPost(postId)
      const updatedPosts = posts.map((p) =>
        p.id === postId ? { ...p, status: 'published', published_at: new Date().toISOString() } : p
      )
      setPosts(updatedPosts)
      setSuccessMessage('Post published successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUnpublish = async (postId) => {
    try {
      setError('')
      await unpublishPost(postId)
      const updatedPosts = posts.map((p) =>
        p.id === postId ? { ...p, status: 'draft', published_at: null } : p
      )
      setPosts(updatedPosts)
      setSuccessMessage('Post unpublished successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
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
    })
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Posts - Admin</title>
        </Head>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderTitle}>Blog Admin</div>
        </div>
        <div className={styles.loadingState}>Loading posts...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Posts - Admin</title>
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
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.postsHeader}>
            <h1 className={styles.adminTitle} style={{ margin: 0 }}>
              Blog Posts
            </h1>
            <Link href="/admin/posts/new" className={styles.newPostBtn}>
              + New Post
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className={styles.noPosts}>
              <p>No posts yet. Create your first post to get started.</p>
            </div>
          ) : (
            <table className={styles.postsTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className={styles.postTitle}>{post.title}</td>
                    <td className={styles.postSlug}>{post.slug}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          post.status === 'published' ? styles.statusPublished : styles.statusDraft
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className={styles.postMeta}>{formatDate(post.updated_at)}</td>
                    <td>
                      <div className={styles.actionsColumn}>
                        <Link href={`/admin/posts/${post.id}/edit`} className={styles.actionBtn}>
                          Edit
                        </Link>
                        {post.status === 'published' && (
                          <Link href={`/blog/${post.slug}`} className={styles.actionBtn}>
                            View
                          </Link>
                        )}
                        {post.status === 'draft' ? (
                          <button
                            onClick={() => handlePublish(post.id)}
                            className={`${styles.actionBtn} ${styles.publishBtn}`}
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(post.id)}
                            className={`${styles.actionBtn} ${styles.publishBtn}`}
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeletePostId(post.id)
                            setDeleteModalOpen(true)
                          }}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Delete Post</div>
            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeletePostId(null)
                }}
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
