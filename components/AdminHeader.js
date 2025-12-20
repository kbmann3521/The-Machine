import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase-client'
import styles from '../styles/blog-admin-posts.module.css'

export default function AdminHeader({ currentSection }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleNavigation = (path) => {
    setDropdownOpen(false)
    router.push(path)
  }

  return (
    <div className={styles.adminHeader}>
      <div className={styles.headerTitleGroup}>
        <div className={styles.adminHeaderTitle}>Dashboard</div>
        <div className={styles.dropdownContainer}>
          <button
            className={styles.dropdownToggle}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Navigation menu"
          >
            {currentSection === 'posts' && 'Blog Posts'}
            {currentSection === 'harnesses' && 'Test Harnesses'}
            {currentSection === 'seo' && 'SEO Config'}
            {currentSection === 'media' && 'Media Library'}
            {currentSection === 'internal-linking' && 'Internal Linking Rules'}
            <span className={styles.dropdownIcon}>▼</span>
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => handleNavigation('/admin/posts')}
                className={`${styles.dropdownItem} ${currentSection === 'posts' ? styles.dropdownItemActive : ''}`}
              >
                Blog Posts
              </button>
              <button
                onClick={() => handleNavigation('/admin/test-harnesses')}
                className={`${styles.dropdownItem} ${currentSection === 'harnesses' ? styles.dropdownItemActive : ''}`}
              >
                Test Harnesses
              </button>
              <button
                onClick={() => handleNavigation('/admin/media')}
                className={`${styles.dropdownItem} ${currentSection === 'media' ? styles.dropdownItemActive : ''}`}
              >
                Media Library
              </button>
              <button
                onClick={() => handleNavigation('/admin/seo')}
                className={`${styles.dropdownItem} ${currentSection === 'seo' ? styles.dropdownItemActive : ''}`}
              >
                SEO Config
              </button>
              <button
                onClick={() => handleNavigation('/admin/internal-linking')}
                className={`${styles.dropdownItem} ${currentSection === 'internal-linking' ? styles.dropdownItemActive : ''}`}
              >
                Internal Linking Rules
              </button>
            </div>
          )}
        </div>
      </div>
      <button onClick={handleLogout} className={styles.logoutBtn}>
        Logout
      </button>
    </div>
  )
}
