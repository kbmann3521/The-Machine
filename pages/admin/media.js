import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import AdminHeader from '../../components/AdminHeader'
import styles from '../../styles/blog-admin-posts.module.css'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function AdminMedia() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    checkAuthAndLoadMedia()
  }, [])

  const checkAuthAndLoadMedia = async () => {
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

    loadMedia(session.access_token)
  }

  const loadMedia = async (token) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const response = await fetch(`${baseUrl}/api/media/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'same-origin',
      })

      if (response.ok) {
        const data = await response.json()
        setMedia(data)
      }
    } catch (err) {
      console.error('Failed to load media:', err)
      setError('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Allowed: PNG, JPG, WEBP, SVG')
      return
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError(`File too large. Maximum size: 10MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    setUploading(true)
    setError('')
    setSuccessMessage('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result?.split(',')[1]

        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
          const response = await fetch(`${baseUrl}/api/media/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              filename: file.name,
              file: base64,
              mimeType: file.type,
            }),
            credentials: 'same-origin',
          })

          if (response.ok) {
            const newMedia = await response.json()
            setMedia((prev) => [newMedia, ...prev])
            setSuccessMessage(`Uploaded: ${file.name}`)
            setTimeout(() => setSuccessMessage(''), 3000)
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } else {
            const errorData = await response.json()
            setError(errorData.error || 'Upload failed')
          }
        } catch (err) {
          setError('Upload failed: ' + err.message)
        } finally {
          setUploading(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (err) {
      setError('Upload error: ' + err.message)
      setUploading(false)
    }
  }

  const copyToClipboard = async (url, id) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback: use textarea method for non-secure contexts
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      setError('')
    } catch (err) {
      console.error('Copy error:', err)
      setError('Failed to copy URL')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    const {
      data: { session },
    } = await supabase.auth.getSession()

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const response = await fetch(`${baseUrl}/api/media/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: deleteConfirm.id,
          path: deleteConfirm.path,
        }),
        credentials: 'same-origin',
      })

      if (response.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== deleteConfirm.id))
        setSuccessMessage('Deleted successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
        setDeleteConfirm(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Delete failed')
      }
    } catch (err) {
      setError('Delete error: ' + err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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
          <title>Media Library - Admin</title>
        </Head>
        <AdminHeader currentSection="media" />
        <div className={styles.loadingState}>Loading media...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Media Library - Admin</title>
      </Head>

      <AdminHeader currentSection="media" />

      <div className={styles.adminContent}>
        <div className={styles.adminSection}>
          <div className={styles.postsHeader}>
            <h1 className={styles.adminTitle} style={{ margin: 0 }}>
              Media Library
            </h1>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.publishBtnFull}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '+ Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>

          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {media.length === 0 ? (
            <div className={styles.noPosts}>
              <h2>No images yet</h2>
              <p>Upload your first image to get started</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {media.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '100%',
                      height: '150px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.path}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p
                      style={{
                        margin: '0 0 0.5rem 0',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        wordBreak: 'break-word',
                        maxHeight: '2.7em',
                        overflow: 'hidden',
                      }}
                    >
                      {item.path.split('/').pop()}
                    </p>

                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {item.size && formatFileSize(item.size)}
                    </p>

                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(item.created_at)}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => copyToClipboard(item.url, item.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: copiedId === item.id ? '#2e7d32' : 'var(--color-background-tertiary)',
                          color: copiedId === item.id ? 'white' : 'var(--color-text-primary)',
                          border: copiedId === item.id ? 'none' : '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {copiedId === item.id ? '✓ Copied' : 'Copy URL'}
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className={styles.deleteBtn}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Delete Media</div>
            <p>Are you sure you want to delete "{deleteConfirm.path.split('/').pop()}"?</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setDeleteConfirm(null)} className={styles.secondaryBtn}>
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
