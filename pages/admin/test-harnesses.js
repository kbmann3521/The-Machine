import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'
import AdminHeader from '../../components/AdminHeader'
import styles from '../../styles/blog-admin-posts.module.css'

const DEFAULT_TEST_HARNESSES = [
  { id: 'ip-toolkit-tests', path: '/ip-toolkit-tests', title: 'IP Toolkit Tests' },
  { id: 'jwt-tests', path: '/jwt-tests', title: 'JWT Tests' },
  { id: 'math-evaluator-tests', path: '/math-evaluator-tests', title: 'Math Evaluator Tests' },
  { id: 'phase5-tests', path: '/phase5-tests', title: 'Phase 5 Tests' },
  { id: 'test-detection', path: '/test-detection', title: 'Test Detection' },
]

export default function AdminTestHarnesses() {
  const [harnesses, setHarnesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingHarness, setEditingHarness] = useState(null)
  const [editSlug, setEditSlug] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadHarnesses = async () => {
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

      loadHarnesses()
    }

    checkAuthAndLoadHarnesses()
  }, [router])

  const loadHarnesses = () => {
    try {
      const stored = localStorage.getItem('testHarnessMetadata')
      const metadata = stored ? JSON.parse(stored) : {}

      const harnessesList = DEFAULT_TEST_HARNESSES.map((harness) => ({
        ...harness,
        slug: metadata[harness.id]?.slug || harness.id,
      }))

      setHarnesses(harnessesList)
    } catch (err) {
      console.error('Failed to load harnesses:', err)
      setHarnesses(DEFAULT_TEST_HARNESSES)
    } finally {
      setLoading(false)
    }
  }

  const handleEditOpen = (harness) => {
    setEditingHarness(harness)
    setEditSlug(harness.slug)
    setEditModalOpen(true)
  }

  const handleEditSave = () => {
    if (!editSlug.trim()) {
      alert('Slug cannot be empty')
      return
    }

    try {
      const stored = localStorage.getItem('testHarnessMetadata')
      const metadata = stored ? JSON.parse(stored) : {}

      metadata[editingHarness.id] = {
        slug: editSlug.trim(),
      }

      localStorage.setItem('testHarnessMetadata', JSON.stringify(metadata))

      const updatedHarnesses = harnesses.map((h) =>
        h.id === editingHarness.id ? { ...h, slug: editSlug.trim() } : h
      )
      setHarnesses(updatedHarnesses)

      setSuccessMessage('Harness slug updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      setEditModalOpen(false)
      setEditingHarness(null)
      setEditSlug('')
    } catch (err) {
      alert('Failed to save slug: ' + err.message)
    }
  }

  const handleEditCancel = () => {
    setEditModalOpen(false)
    setEditingHarness(null)
    setEditSlug('')
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Head>
          <title>Test Harnesses - Admin</title>
        </Head>
        <AdminHeader currentSection="harnesses" />
        <div className={styles.loadingState}>Loading test harnesses...</div>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Test Harnesses - Admin</title>
      </Head>

      <AdminHeader currentSection="harnesses" />

      <div className={styles.adminContent}>
        <div className={styles.adminSection}>
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

          <div className={styles.postsHeader}>
            <h1 className={styles.adminTitle} style={{ margin: 0 }}>
              Test Harnesses
            </h1>
          </div>

          <table className={styles.postsTable}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Path</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {harnesses.map((harness) => (
                <tr key={harness.id}>
                  <td className={styles.postTitle}>{harness.title}</td>
                  <td className={styles.postSlug}>{harness.path}</td>
                  <td className={styles.postSlug}>{harness.slug}</td>
                  <td>
                    <div className={styles.actionsColumn}>
                      <Link href={harness.path} className={styles.actionBtn} target="_blank" rel="noopener noreferrer">
                        View
                      </Link>
                      <button
                        onClick={() => handleEditOpen(harness)}
                        className={styles.actionBtn}
                      >
                        Edit Slug
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Edit Slug</div>
            <p>Update the slug for <strong>{editingHarness?.title}</strong></p>
            <input
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className={styles.modalInput}
              placeholder="Enter new slug"
            />
            <div className={styles.modalActions}>
              <button onClick={handleEditCancel} className={styles.secondaryBtn}>
                Cancel
              </button>
              <button onClick={handleEditSave} className={`${styles.publishBtn} ${styles.publishBtnFull}`}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
