import React from 'react'

export default function Base64Mode({ result, config }) {
  if (!result || result.error) {
    return (
      <div style={{ padding: '16px', color: '#666' }}>
        <p>Upload an image to convert to Base64</p>
      </div>
    )
  }

  if (result.mode === 'base64') {
    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Base64 Conversion</h4>
        <p style={{ margin: '8px 0', fontSize: '12px', color: '#999' }}>
          Encoded Size: {(result.length / 1024).toFixed(2)} KB
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
          Ready to copy Base64 data to clipboard
        </p>
      </div>
    )
  }

  return null
}
