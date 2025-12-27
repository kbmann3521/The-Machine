import React, { useState, useEffect, useRef } from 'react'
import styles from '../../../styles/image-toolkit.module.css'

export default function ResizeOutput({ result }) {
  const [resizedImage, setResizedImage] = useState(null)
  const [newDimensions, setNewDimensions] = useState(null)
  const [error, setError] = useState(null)
  const [imageId, setImageId] = useState(null)
  const [transformUrl, setTransformUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const canvasRef = useRef(null)
  const uploadAttemptedRef = useRef(false)

  // Show placeholder when no image is uploaded yet
  if (!result || !result.imageData) {
    return (
      <div className={styles.placeholder}>
        <p>No image selected</p>
      </div>
    )
  }

  // Auto-upload original image on first load
  useEffect(() => {
    if (!result.imageData || uploadAttemptedRef.current || imageId) {
      return
    }

    uploadAttemptedRef.current = true
    uploadOriginalImage()
  }, [result.imageData])

  // Update transformation URL whenever config changes
  useEffect(() => {
    if (imageId) {
      buildTransformationUrl()
    }
  }, [result.width, result.height, result.quality, result.resizeMode, imageId])

  // Perform client-side resize for preview
  useEffect(() => {
    if (!result || !result.imageData) {
      return
    }

    performResize()
  }, [result])

  const uploadOriginalImage = async () => {
    try {
      setUploading(true)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const uploadUrl = `${baseUrl}/api/tools/upload-image`

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: result.imageData,
        }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await uploadResponse.json()
      if (data.success && data.imageId) {
        setImageId(data.imageId)
        setError(null)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const buildTransformationUrl = () => {
    if (!imageId) return

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const qualityValue = Math.round((result.quality || 0.9) * 100)
    
    // Build query parameters based on resize mode
    const params = new URLSearchParams()
    params.append('q', qualityValue)
    
    if (result.resizeMode === 'dimensions') {
      params.append('w', result.width || 800)
      params.append('h', result.height || 600)
    } else if (result.resizeMode === 'scale') {
      params.append('scale', result.scalePercent || 50)
    } else if (result.resizeMode === 'maxWidth') {
      params.append('maxW', result.width || 800)
    }

    if (result.maintainAspect) {
      params.append('aspect', '1')
    }

    const url = `${baseUrl}/api/tools/get-image/${imageId}?${params.toString()}`
    setTransformUrl(url)
  }

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

  const htmlCode = transformUrl 
    ? `<img src="${transformUrl}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`
    : `<img src="${resizedImage}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`
  
  const reductionPercent = ((1 - (newDimensions.width * newDimensions.height) / (newDimensions.originalWidth * newDimensions.originalHeight)) * 100).toFixed(1)

  return (
    <div className={styles.outputContainer}>
      <div className={styles.imageContainer}>
        <img src={resizedImage} alt="Resized" className={styles.image} />
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleDownloadImage}
          className={styles.actionButton}
          title="Download resized image"
        >
          ⬇️ Download Image
        </button>
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

      {transformUrl && (
        <div className={styles.infoSection}>
          <h3 className={styles.sectionTitle}>Image URL</h3>
          <div className={styles.urlContainer}>
            <input
              type="text"
              value={transformUrl}
              readOnly
              className={styles.urlInput}
            />
            <button
              onClick={() => navigator.clipboard.writeText(transformUrl)}
              className={styles.copyButton}
              title="Copy URL to clipboard"
            >
              Copy URL
            </button>
          </div>
          <div className={styles.urlNote}>
            This URL will transform the image based on your current settings. It expires after 1 hour.
          </div>
        </div>
      )}

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
