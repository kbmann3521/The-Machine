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
