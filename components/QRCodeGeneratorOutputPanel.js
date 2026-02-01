import React, { useState } from 'react'
import styles from '../styles/tool-output.module.css'
import OutputTabs from './OutputTabs'

export default function QRCodeGeneratorOutputPanel({ result }) {
  const [activeFormat, setActiveFormat] = useState('png')

  if (!result) {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Enter text or a URL to generate a QR code',
        contentType: 'text',
      },
      {
        id: 'json',
        label: 'JSON',
        content: '',
        contentType: 'json',
      },
    ]
    return <OutputTabs tabs={emptyTabs} showCopyButton={false} />
  }

  if (result.status === 'error' || result.error) {
    const errorTabs = [
      {
        id: 'error',
        label: 'ERROR',
        content: result.error || 'Failed to generate QR code',
        contentType: 'text',
      },
    ]
    return <OutputTabs tabs={errorTabs} showCopyButton={false} />
  }

  if (result.status === 'empty') {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: result.error || 'Enter text to generate a QR code',
        contentType: 'text',
      },
    ]
    return <OutputTabs tabs={emptyTabs} showCopyButton={false} />
  }

  const downloadImage = (format) => {
    if (format === 'png' && result.dataUrl) {
      const link = document.createElement('a')
      link.href = result.dataUrl
      link.download = 'qrcode.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (format === 'svg' && result.svg) {
      const element = document.createElement('a')
      element.setAttribute('href', `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`)
      element.setAttribute('download', 'qrcode.svg')
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const copyToClipboard = (text, format) => {
    navigator.clipboard.writeText(text).then(() => {
      // Visual feedback could be added here
      console.log(`${format} copied to clipboard`)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Main QR code display content
  const renderQRContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Format Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveFormat('png')}
          style={{
            padding: '8px 12px',
            backgroundColor: activeFormat === 'png' ? 'rgba(66, 165, 245, 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeFormat === 'png' ? '2px solid #42a5f5' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeFormat === 'png' ? '600' : '400',
            color: activeFormat === 'png' ? '#42a5f5' : 'var(--color-text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          PNG Image
        </button>
        <button
          onClick={() => setActiveFormat('svg')}
          style={{
            padding: '8px 12px',
            backgroundColor: activeFormat === 'svg' ? 'rgba(66, 165, 245, 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeFormat === 'svg' ? '2px solid #42a5f5' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeFormat === 'svg' ? '600' : '400',
            color: activeFormat === 'svg' ? '#42a5f5' : 'var(--color-text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          SVG (Scalable)
        </button>
      </div>

      {/* QR Code Display */}
      {activeFormat === 'png' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
          <img
            src={result.dataUrl}
            alt="QR Code"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              width: 'auto',
              height: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: 'white',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => downloadImage('png')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#42a5f5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Download PNG
            </button>
            <button
              onClick={() => copyToClipboard(result.dataUrl, 'PNG')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-background-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text-primary)',
              }}
            >
              Copy Data URL
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px', overflow: 'auto' }}>
            <div style={{ maxWidth: '100%', maxHeight: '400px', width: 'auto', height: 'auto', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', backgroundColor: 'white' }} dangerouslySetInnerHTML={{ __html: result.svg }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => downloadImage('svg')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#42a5f5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Download SVG
              </button>
              <button
                onClick={() => copyToClipboard(result.svg, 'SVG')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-background-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--color-text-primary)',
                }}
              >
                Copy SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      {result.metadata && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>QR Code Metadata</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Size</div>
              <div style={{ fontWeight: '500' }}>{result.metadata.size}px</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Error Correction</div>
              <div style={{ fontWeight: '500' }}>{result.metadata.errorCorrectionLevel}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Quiet Zone</div>
              <div style={{ fontWeight: '500' }}>{result.metadata.margin} modules</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Data Length</div>
              <div style={{ fontWeight: '500' }}>{result.metadata.textLength} characters</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Dark Color</div>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: result.metadata.color, border: '1px solid var(--color-border)', borderRadius: '2px' }} />
                {result.metadata.color}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Light Color</div>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: result.metadata.bgColor, border: '1px solid var(--color-border)', borderRadius: '2px' }} />
                {result.metadata.bgColor}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Text */}
      {result.input && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Encoded Data</h4>
          <div style={{ padding: '8px', backgroundColor: 'var(--color-background)', borderRadius: '4px', fontSize: '13px', wordBreak: 'break-word', maxHeight: '100px', overflow: 'auto', fontFamily: 'monospace' }}>
            {result.input}
          </div>
        </div>
      )}
    </div>
  )

  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: renderQRContent(),
      contentType: 'jsx',
    },
    {
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(result, null, 2),
      contentType: 'json',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={false} />
}
