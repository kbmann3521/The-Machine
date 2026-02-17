import React from 'react'
import OutputTabs from './OutputTabs'

export default function BarcodeGeneratorOutputPanel({ result, loading, error }) {
  if (loading) {
    const loadingTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Generating barcodes...',
        contentType: 'text',
      },
    ]
    return <OutputTabs tabs={loadingTabs} showCopyButton={false} />
  }

  if (error) {
    const errorTabs = [
      {
        id: 'error',
        label: 'ERROR',
        content: error,
        contentType: 'text',
      },
    ]
    return <OutputTabs tabs={errorTabs} showCopyButton={false} />
  }

  if (!result) {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Enter UPC-A codes (one per line) to generate barcodes',
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

  const { results, count, success } = result

  const downloadSvg = (svg, filename) => {
    const element = document.createElement('a')
    element.setAttribute('href', `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    element.setAttribute('download', `${filename}.svg`)
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px', fontSize: '14px' }}>
        <strong>Summary:</strong> Generated {success} of {count} barcodes.
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.map((res, index) => (
          <div key={index} style={{ 
            padding: '24px', 
            backgroundColor: 'var(--color-background-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', width: '100%', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '8px' }}>
              Input: {res.input}
            </div>
            
            {res.error ? (
              <div style={{ color: '#ef5350', fontSize: '14px' }}>
                Error: {res.error}
              </div>
            ) : (
              <>
                <div 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '16px', 
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxWidth: '100%',
                    overflow: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: res.output }} 
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => downloadSvg(res.output, `barcode-${res.input}`)}
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
                    onClick={() => {
                      navigator.clipboard.writeText(res.output)
                    }}
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: renderContent(),
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
