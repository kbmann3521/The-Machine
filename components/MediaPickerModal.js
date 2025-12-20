import { useState, useEffect } from 'react'
import styles from '../styles/blog-admin-forms.module.css'

export default function MediaPickerModal({ isOpen, onClose, onSelect }) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen])

  const loadMedia = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/media/list')
      if (!response.ok) throw new Error('Failed to load media')
      const data = await response.json()
      setMedia(data.media || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedId) {
      const selected = media.find((m) => m.id === selectedId)
      if (selected) {
        onSelect(selected.url)
        handleClose()
      }
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.mediaPickerModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Select Image from Media Library</h2>
          <button
            onClick={handleClose}
            className={styles.modalCloseBtn}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {loading ? (
            <div className={styles.loadingState}>Loading media library...</div>
          ) : media.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No images in media library yet.</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Upload images in the Media Library section first.
              </p>
            </div>
          ) : (
            <div className={styles.mediaGrid}>
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.mediaGridItem} ${
                    selectedId === item.id ? styles.mediaGridItemSelected : ''
                  }`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedId(item.id)
                  }}
                >
                  <img src={item.url} alt={item.filename} />
                  <div className={styles.mediaGridItemOverlay}>
                    <input
                      type="radio"
                      name="media-select"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button onClick={handleClose} className={styles.secondaryBtn}>
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className={styles.primaryBtn}
            disabled={!selectedId}
          >
            Select Image
          </button>
        </div>
      </div>
    </div>
  )
}
