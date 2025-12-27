import React, { useState, useEffect, useRef } from 'react'
import styles from '../../../styles/image-toolkit.module.css'

export default function ResizeOutput({ result }) {
  const [resizedImage, setResizedImage] = useState(null)
  const [newDimensions, setNewDimensions] = useState(null)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  // Show placeholder when no image is uploaded yet
  if (!result || !result.imageData) {
    return (
      <div className={styles.placeholder}>
        <p>No image selected</p>
      </div>
    )
  }

  useEffect(() => {
    if (!result || !result.imageData) {
      return
    }

    performResize()
  }, [result])

  const performResize = () => {
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        let newWidth = result.width || 800
        let newHeight = result.height || 600

        if (result.resizeMode === 'scale') {
          const scale = (result.scalePercent || 50) / 100
          newWidth = Math.round(img.width * scale)
          newHeight = Math.round(img.height * scale)
        } else if (result.resizeMode === 'maxWidth') {
          if (img.width > (result.width || 800)) {
            const scale = (result.width || 800) / img.width
            newWidth = result.width || 800
            newHeight = Math.round(img.height * scale)
          } else {
            newWidth = img.width
            newHeight = img.height
          }
        } else if (result.maintainAspect) {
          const aspectRatio = img.width / img.height
          if (img.width > img.height) {
            newWidth = result.width || 800
            newHeight = Math.round(newWidth / aspectRatio)
          } else {
            newHeight = result.height || 600
            newWidth = Math.round(newHeight * aspectRatio)
          }
        }

        canvas.width = newWidth
        canvas.height = newHeight

        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        const quality = result.quality || 0.9
        const resizedData = canvas.toDataURL('image/jpeg', quality)

        setResizedImage(resizedData)
        setNewDimensions({
          width: newWidth,
          height: newHeight,
          originalWidth: img.width,
          originalHeight: img.height,
        })
        setError(null)
      }

      img.onerror = () => {
        setError('Failed to load image. Please check the image format.')
      }

      img.src = result.imageData
    } catch (err) {
      setError(`Resize error: ${err.message}`)
    }
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    )
  }

  if (!resizedImage || !newDimensions) {
    return (
      <div className={styles.loading}>
        <p>Resizing image...</p>
      </div>
    )
  }

  const tabs = [
    {
      id: 'resized',
      label: 'Resized Image',
      content: (
        <div className={styles.imageContainer}>
          <img src={resizedImage} alt="Resized" className={styles.image} />
          <div className={styles.dimensions}>
            <div className={styles.dimensionRow}>
              <span className={styles.label}>Original:</span>
              <span className={styles.value}>{newDimensions.originalWidth}×{newDimensions.originalHeight}px</span>
            </div>
            <div className={styles.dimensionRow}>
              <span className={styles.label}>Resized:</span>
              <span className={styles.value}>{newDimensions.width}×{newDimensions.height}px</span>
            </div>
            <div className={styles.dimensionRow}>
              <span className={styles.label}>Reduction:</span>
              <span className={styles.value}>{((1 - (newDimensions.width * newDimensions.height) / (newDimensions.originalWidth * newDimensions.originalHeight)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ),
      contentType: 'component',
    },
    {
      id: 'preview-code',
      label: 'HTML Code',
      content: `<img src="${resizedImage}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`,
      contentType: 'code',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
