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

  const renderRowData = (rowData) => {
    if (!rowData) return null

    // Fields to hide as per user request
    const hiddenFields = ['Division', 'District', 'Store', 'Division,District,Store']

    // Priority fields for prominence
    const description = rowData.Description || rowData.description || ''
    const metrics = {
      KPAR: rowData.KPAR || rowData.kpar || '0',
      KBOH: rowData.KBOH || rowData.kboh || '0',
      BOH: rowData.BOH || rowData.boh || '0'
    }

    // Filter other data
    const otherData = Object.entries(rowData).filter(([key]) => {
      const k = key.toLowerCase()
      return !hiddenFields.some(h => h.toLowerCase() === k) &&
             !['description', 'kpar', 'kboh', 'boh', 'upc'].includes(k)
    })

    return (
      <div style={{ width: '100%' }}>
        {/* Most Prominent: Description */}
        {description && (
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {description}
          </div>
        )}

        {/* Second Most Prominent: Metrics */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          {Object.entries(metrics).map(([key, value]) => {
            const displayValue = (value === null || value === undefined || String(value).trim() === '') ? 'Empty' : String(value);
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#42a5f5' }}>{displayValue}</span>
              </div>
            );
          })}
        </div>

        {/* Other Details - Condensed Flow */}
        {otherData.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: '16px',
            rowGap: '6px',
            marginBottom: '20px',
            fontSize: '11px',
            lineHeight: '1.2'
          }}>
            {otherData.map(([key, value]) => {
              const displayValue = (value === null || value === undefined || String(value).trim() === '') ? 'Empty' : String(value);
              return (
                <div key={key} style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>{key}:</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{displayValue}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        padding: '12px 20px',
        backgroundColor: 'var(--color-background-secondary)',
        borderRadius: '8px',
        fontSize: '14px',
        borderLeft: '4px solid #42a5f5'
      }}>
        <strong>Summary:</strong> Generated <strong>{success}</strong> of <strong>{count}</strong> barcodes.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map((res, index) => (
          <div key={index} style={{
            padding: '24px',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%'
            }}>
              {/* Top Section: Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  UPC: {res.input}
                </div>
                {res.rowData ? renderRowData(res.rowData) : (
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    {res.input}
                  </div>
                )}
              </div>

              {/* Bottom Section: Barcode and Actions */}
              {res.error ? (
                <div style={{
                  color: '#ef5350',
                  fontSize: '14px',
                  padding: '12px',
                  backgroundColor: 'rgba(239, 83, 80, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 83, 80, 0.2)'
                }}>
                  <strong>Error:</strong> {res.error}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '24px',
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      maxWidth: '100%',
                      overflow: 'auto',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: res.output }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => downloadSvg(res.output, `barcode-${res.input}`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#42a5f5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download SVG
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(res.output)
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy SVG
                    </button>
                  </div>
                </div>
              )}
            </div>
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
