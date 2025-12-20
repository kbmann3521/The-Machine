import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase-client'
import styles from '../styles/admin-css-bar.module.css'
import CSSEditorSidebar from './CSSEditorSidebar'

export default function AdminCSSBar({ onCSSChange, postId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [css, setCss] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpen = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/custom-css')
      const data = await response.json()
      const cssContent = data.css || ''
      setCss(cssContent)

      // Ensure the main style element is updated
      let styleElement = document.getElementById('blog-custom-css-style')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'blog-custom-css-style'
        document.head.appendChild(styleElement)
      }
      styleElement.textContent = cssContent

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
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/blog/custom-css', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ css }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save CSS')
      }

      const responseData = await response.json()
      const savedCss = responseData.css || css

      // Update localStorage cache
      localStorage.setItem('blog_custom_css_cache', savedCss)

      // Update the custom CSS in the parent component
      if (onCSSChange) {
        onCSSChange(savedCss)
      }

      setIsOpen(false)
      alert('CSS saved successfully!')
    } catch (err) {
      console.error('Failed to save CSS:', err)
      alert(`Failed to save CSS: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className={styles.adminBar}>
        <div className={styles.adminBarContent}>
          <span className={styles.adminLabel}>Admin</span>
          {postId && (
            <Link href={`/admin/posts/${postId}/edit`} className={styles.editPostBtn}>
              Edit Post
            </Link>
          )}
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
