export function resizeImage(imageData, config) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let newWidth = config.width
        let newHeight = config.height
        
        if (config.resizeMode === 'scale') {
          const scale = config.scalePercent / 100
          newWidth = Math.round(img.width * scale)
          newHeight = Math.round(img.height * scale)
        } else if (config.resizeMode === 'maxWidth' && img.width > config.width) {
          const scale = config.width / img.width
          newWidth = config.width
          newHeight = Math.round(img.height * scale)
        } else if (config.maintainAspect && config.resizeMode === 'dimensions') {
          const aspectRatio = img.width / img.height
          newHeight = Math.round(newWidth / aspectRatio)
        }
        
        canvas.width = newWidth
        canvas.height = newHeight
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        const quality = parseFloat(config.quality) || 0.9
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality)
        
        resolve({
          resizedImage: resizedDataUrl,
          originalDimensions: {
            width: img.width,
            height: img.height,
          },
          newDimensions: {
            width: newWidth,
            height: newHeight,
          },
          format: 'JPEG',
          quality: quality,
        })
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageData
  })
}
