import React, { useState, useEffect, useRef } from 'react'
import styles from '../../../styles/image-toolkit.module.css'

export default function ResizeOutput({ result, configOptions, onConfigChange, onUpdateUrl }) {
  const [resizedImage, setResizedImage] = useState(null)
  const [newDimensions, setNewDimensions] = useState(null)
  const [originalDimensions, setOriginalDimensions] = useState(null)
  const [originalConfig, setOriginalConfig] = useState(null)
  const [error, setError] = useState(null)
  const [imageId, setImageId] = useState(null)
  const [transformUrl, setTransformUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [originalFileSize, setOriginalFileSize] = useState(null)
  const [estimatedFileSize, setEstimatedFileSize] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [aspectRatio, setAspectRatio] = useState(null)
  const canvasRef = useRef(null)
  const uploadAttemptedRef = useRef(false)
  const prevDimensionsRef = useRef({ width: null, height: null, scale: null, lockAspectRatio: null })

  // Show placeholder when no image is uploaded yet
  if (!result || !result.imageData) {
    return (
      <div className={styles.placeholder}>
        <p>No image selected</p>
      </div>
    )
  }

  // Detect original dimensions on first load and update config defaults
  useEffect(() => {
    if (!result.imageData || originalDimensions) {
      return
    }

    const img = new Image()
    img.onload = () => {
      setOriginalDimensions({
        width: img.width,
        height: img.height,
      })

      // Calculate and store aspect ratio
      const ratio = img.width / img.height
      setAspectRatio(ratio)

      // Calculate original file size from base64
      const sizeInBytes = Math.ceil((result.imageData.length * 3) / 4) - (result.imageData.endsWith('==') ? 2 : result.imageData.endsWith('=') ? 1 : 0)
      setOriginalFileSize(sizeInBytes)

      // Store original config for reset
      if (configOptions) {
        setOriginalConfig({
          width: img.width,
          height: img.height,
          scalePercent: configOptions.scalePercent || 100,
          quality: configOptions.quality || 80,
          lockAspectRatio: configOptions.lockAspectRatio !== false,
        })
      }

      // Update config to use original dimensions as defaults AND include aspect ratio info
      if (onConfigChange && configOptions) {
        onConfigChange({
          ...configOptions,
          width: img.width,
          height: img.height,
          originalWidth: img.width,
          originalHeight: img.height,
          aspectRatio: ratio,
        })
      }
    }
    img.src = result.imageData
  }, [result.imageData])

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
  }, [result.width, result.height, result.scalePercent, result.quality, imageId])

  // Perform client-side resize for preview and estimate file size
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

    // Build query parameters
    const params = new URLSearchParams()
    params.append('w', result.width || 800)
    params.append('h', result.height || 600)
    params.append('scale', result.scalePercent || 100)
    params.append('q', result.quality || 80)

    const url = `${baseUrl}/api/tools/get-image/${imageId}?${params.toString()}`
    setTransformUrl(url)

    // Update the parent with the URL so it appears in JSON
    if (onUpdateUrl) {
      onUpdateUrl(url)
    }
  }

  const performResize = () => {
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate dimensions based on scale percentage
        const scale = (result.scalePercent || 100) / 100
        let newWidth = Math.round((result.width || 800) * scale)
        let newHeight = Math.round((result.height || 600) * scale)

        // Ensure dimensions don't exceed original
        if (newWidth > img.width) newWidth = img.width
        if (newHeight > img.height) newHeight = img.height

        canvas.width = newWidth
        canvas.height = newHeight

        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        const qualityRatio = (result.quality || 80) / 100
        const resizedData = canvas.toDataURL('image/jpeg', qualityRatio)

        setResizedImage(resizedData)
        setNewDimensions({
          width: newWidth,
          height: newHeight,
          originalWidth: img.width,
          originalHeight: img.height,
        })

        // Estimate file size based on quality
        const estimatedSize = Math.ceil((resizedData.length * 3) / 4) - (resizedData.endsWith('==') ? 2 : resizedData.endsWith('=') ? 1 : 0)
        setEstimatedFileSize(estimatedSize)
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

  const handleCopyUrl = () => {
    if (!transformUrl) return
    navigator.clipboard.writeText(transformUrl).then(() => {
      setCopiedField('url')
      setTimeout(() => setCopiedField(null), 2000)
    }).catch(err => {
      console.error('Copy failed:', err)
      setCopiedField(null)
    })
  }

  const handleCopyCode = () => {
    const htmlCode = transformUrl
      ? `<img src="${transformUrl}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`
      : `<img src="${resizedImage}" alt="Resized Image" width="${newDimensions.width}" height="${newDimensions.height}" />`

    navigator.clipboard.writeText(htmlCode).then(() => {
      setCopiedField('code')
      setTimeout(() => setCopiedField(null), 2000)
    }).catch(err => {
      console.error('Copy failed:', err)
      setCopiedField(null)
    })
  }

  const handleReset = () => {
    if (!originalConfig || !onConfigChange || !configOptions) return

    prevDimensionsRef.current = {
      width: originalConfig.width,
      height: originalConfig.height,
      scale: originalConfig.scalePercent,
      lockAspectRatio: originalConfig.lockAspectRatio,
    }

    onConfigChange({
      ...configOptions,
      width: originalConfig.width,
      height: originalConfig.height,
      scalePercent: originalConfig.scalePercent,
      quality: originalConfig.quality,
      lockAspectRatio: originalConfig.lockAspectRatio,
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
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
  
  const reductionPercent = originalFileSize && estimatedFileSize 
    ? ((1 - estimatedFileSize / originalFileSize) * 100).toFixed(1)
    : 0

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
        <button
          onClick={handleReset}
          className={styles.resetButton}
          title="Reset to original image dimensions"
        >
          ↻ Reset Settings
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
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>File Size</h3>
        <div className={styles.fileSizeContainer}>
          <div className={styles.fileSizeRow}>
            <span className={styles.label}>Original:</span>
            <span className={styles.value}>{formatFileSize(originalFileSize)}</span>
          </div>
          <div className={styles.fileSizeRow}>
            <span className={styles.label}>Optimized:</span>
            <span className={styles.value}>{formatFileSize(estimatedFileSize)}</span>
          </div>
          <div className={styles.fileSizeRow}>
            <span className={styles.label}>Reduction:</span>
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
              onClick={handleCopyUrl}
              className={styles.copyButton}
              title="Copy URL to clipboard"
            >
              {copiedField === 'url' ? '✓ Copied!' : 'Copy URL'}
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
          onClick={handleCopyCode}
          className={styles.copyButton}
          title="Copy HTML code to clipboard"
        >
          {copiedField === 'code' ? '✓ Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  )
}
