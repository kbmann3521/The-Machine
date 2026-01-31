import Link from 'next/link'
import styles from '../styles/hub.module.css'

export default function PageFooter({ showBackToTools = false }) {
  return (
    <footer className={styles.footer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {showBackToTools ? (
          <Link href="/" style={{ textDecoration: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.3s ease' }}>
            ← Back to Tools
          </Link>
        ) : (
          <div></div>
        )}
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.3s ease' }}>
          © {new Date().getFullYear()} Pioneer Web Tools. All rights reserved.
        </p>
        <Link href="/blog/how-we-make-tools" style={{ textDecoration: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.3s ease' }}>
          About
        </Link>
      </div>
    </footer>
  )
}
