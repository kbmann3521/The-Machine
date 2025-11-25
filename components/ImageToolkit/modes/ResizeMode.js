import React from 'react'

export default function ResizeMode({ result, config }) {
  if (!result || result.error) {
    return (
      <div style={{ padding: '16px', color: '#666' }}>
        <p>Upload an image to configure resize options</p>
      </div>
    )
  }

  if (result.mode === 'resize') {
    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Resize Configuration</h4>
        <p style={{ margin: '8px 0', fontSize: '12px', color: '#999' }}>
          Current Image Size: {result.width} × {result.height} px
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
          Resize Mode: {config?.resizeMode === 'scale' ? 'Scale' : config?.resizeMode === 'maxWidth' ? 'Max Width' : 'Fixed Dimensions'}
        </p>
        {config?.resizeMode === 'dimensions' && (
          <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
            Target: {config?.width}px × {config?.height}px @ {(config?.quality * 100).toFixed(0)}% quality
          </p>
        )}
        {config?.resizeMode === 'scale' && (
          <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
            Scale: {config?.scalePercent}%
          </p>
        )}
      </div>
    )
  }

  return null
}
