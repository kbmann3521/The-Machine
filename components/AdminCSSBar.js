import { useState } from 'react'
import { supabase } from '../lib/supabase-client'
import styles from '../styles/admin-css-bar.module.css'
import CSSEditorSidebar from './CSSEditorSidebar'

export default function AdminCSSBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [css, setCss] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpen = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/custom-css')
      const data = await response.json()
      setCss(data.css || '')
      setIsOpen(true)
    } catch (err) {
      console.error('Failed to load CSS:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/blog/custom-css', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save CSS')
      }

      const data = await response.json()
      setIsOpen(false)
      alert('CSS saved successfully!')
    } catch (err) {
      console.error('Failed to save CSS:', err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className={styles.adminBar}>
        <div className={styles.adminBarContent}>
          <span className={styles.adminLabel}>Admin</span>
          <button onClick={handleOpen} className={styles.customizeCssBtn}>
            {loading ? 'Loading...' : 'Customize CSS'}
          </button>
        </div>
      </div>

      {isOpen && (
        <CSSEditorSidebar
          css={css}
          setCss={setCss}
          onSave={handleSave}
          onClose={() => setIsOpen(false)}
          isSaving={isSaving}
        />
      )}
    </>
  )
}
