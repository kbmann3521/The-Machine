import React, { useState, useEffect, useRef } from 'react'
import styles from '../../../styles/image-toolkit.module.css'

export default function ResizeOutput({ result }) {
  const [resizedImage, setResizedImage] = useState(null)
  const [newDimensions, setNewDimensions] = useState(null)
  const [error, setError] = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
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

  const handleUploadImage = async () => {
    if (!resizedImage) return

    setUploading(true)
    try {
      // Convert base64 to blob
      const response = await fetch(resizedImage)
      const blob = await response.blob()

      // Create FormData
      const formData = new FormData()
      formData.append('file', blob, `resized-image-${Date.now()}.jpg`)

      // Upload to imgbb (free image hosting)
      const uploadFormData = new FormData()
      uploadFormData.append('image', blob)

      // Use a simple temp upload service (ImgBB)
      const apiKey = 'ed9c79b95e7e0cace08099b1eafcc8d9' // Public key for demo
      const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await uploadResponse.json()
      if (data.success) {
        setUploadedUrl(data.data.url)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadImage = () => {
    if (!resizedImage) return

    const link = document.createElement('a')
    link.href = resizedImage
    link.download = `resized-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const htmlCode = `<img src="${resizedImage}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`
  const reductionPercent = ((1 - (newDimensions.width * newDimensions.height) / (newDimensions.originalWidth * newDimensions.originalHeight)) * 100).toFixed(1)

  return (
    <div className={styles.outputContainer}>
      <div className={styles.imageContainer}>
        <img src={resizedImage} alt="Resized" className={styles.image} />
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Image Dimensions</h3>
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
            <span className={styles.label}>Size Reduction:</span>
            <span className={styles.value}>{reductionPercent}%</span>
          </div>
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>HTML Code</h3>
        <pre className={styles.codeBlock}>{htmlCode}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(htmlCode)}
          className={styles.copyButton}
          title="Copy HTML code to clipboard"
        >
          Copy Code
        </button>
      </div>
    </div>
  )
}
