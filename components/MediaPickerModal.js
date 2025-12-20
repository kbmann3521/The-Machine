import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
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
  }, [isOpen]) // loadMedia intentionally not included to avoid recreating on each render

  const loadMedia = async () => {
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch('/api/media/list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'same-origin',
      })

      if (!response.ok) {
        let errorMsg = 'Failed to load media'
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      console.log('Raw API response:', data)

      const mediaArray = Array.isArray(data) ? data : (data.media || [])
      console.log('Processed media array:', mediaArray)
      console.log('Media count:', mediaArray.length)

      if (mediaArray.length === 0) {
        console.warn('Warning: No media items returned from API. Response was:', data)
      } else {
        console.log(`Successfully loaded ${mediaArray.length} media items`)
      }

      setMedia(mediaArray)
    } catch (err) {
      console.error('Media loading error:', err)
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
                  <img src={item.url} alt={item.path || 'media'} />
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
