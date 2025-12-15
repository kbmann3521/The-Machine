import { useState, useMemo } from 'react'
import { FaChevronDown, FaDownload } from 'react-icons/fa6'
import OutputTabs from './OutputTabs'
import TimeNormalizerSingleOutput from './TimeNormalizerSingleOutput'
import styles from '../styles/tool-output.module.css'
import {
  exportToCSV,
  exportToJSON,
  generateBulkSummary,
  formatShift,
} from '../lib/bulkTimeParser'

export default function TimeNormalizerBulkOutput({ results = [], isBulkMode = false }) {
  const [expandedItems, setExpandedItems] = useState(new Set())

  // Generate summary
  const summary = useMemo(() => generateBulkSummary(results), [results])

  const handleToggleExpand = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      // Close any other expanded items (only one at a time)
      newExpanded.clear()
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleExportJSON = () => {
    const json = exportToJSON(results)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-time-results.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(results)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-time-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderBulkOutput = () => {
    if (!results || results.length === 0) {
      return (
        <div className={styles.emptyState}>
          Enter multiple times (one per line) to see bulk analysis results.
        </div>
      )
    }

    const hasMultipleTimezones = Object.keys(summary.timezones).length > 1

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              borderLeft: '3px solid var(--color-text-primary)',
            }}
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
                letterSpacing: '0.3px',
              }}
            >
              Valid
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>
              {summary.valid}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(244, 67, 54, 0.08)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #f44336',
            }}
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#f44336',
                marginBottom: '4px',
                letterSpacing: '0.3px',
              }}
            >
              Invalid
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f44336' }}>
              {summary.invalid}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #2196f3',
            }}
            title="Times that occur on the same date in both input and output timezone"
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#2196f3',
                marginBottom: '4px',
                letterSpacing: '0.3px',
              }}
            >
              Same Day
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2196f3' }}>
              {summary.sameDayCount}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(255, 152, 0, 0.08)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #ff9800',
            }}
            title="Times that move to the next calendar day when converting to the output timezone"
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#ff9800',
                marginBottom: '4px',
                letterSpacing: '0.3px',
              }}
            >
              Next Day
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff9800' }}>
              {summary.nextDayCount}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #9c27b0',
            }}
            title="Times that move to the previous calendar day when converting to the output timezone"
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#9c27b0',
                marginBottom: '4px',
                letterSpacing: '0.3px',
              }}
            >
              Previous Day
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#9c27b0' }}>
              {summary.previousDayCount}
            </div>
          </div>

          {summary.maxShift !== null && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                borderLeft: '3px solid var(--color-text-primary)',
              }}
              title="Maximum timezone offset difference across all times in this batch (e.g., +5h, -3h)"
            >
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                  letterSpacing: '0.3px',
                }}
              >
                Max TZ Offset
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                {formatShift(summary.maxShift)}
              </div>
            </div>
          )}
        </div>

        {/* Optional Timezone Distribution */}
        {hasMultipleTimezones && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(76, 175, 80, 0.08)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            <div
              style={{
                fontWeight: '600',
                marginBottom: '8px',
                fontSize: '11px',
                color: '#4caf50',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ✓ Detected Timezones
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {Object.entries(summary.timezones)
                .sort((a, b) => b[1] - a[1])
                .map(([tz, count]) => (
                  <span key={tz} style={{ color: 'var(--color-text-primary)' }}>
                    <span style={{ fontWeight: '600' }}>{tz.toUpperCase()}</span> ×{count}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Export Controls */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleExportJSON}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
            }}
            title="Export results to JSON"
          >
            <FaDownload style={{ fontSize: '12px' }} />
            JSON
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
            }}
            title="Export results to CSV"
          >
            <FaDownload style={{ fontSize: '12px' }} />
            CSV
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {results.length} results
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflow: 'auto', minHeight: 0 }}>
          {results.map((result, idx) => {
            const isExpanded = expandedItems.has(idx)
            const isInvalid = !!result.error

            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: isExpanded ? 'var(--color-background-secondary)' : 'transparent',
                }}
              >
                {/* Card Header - Conversion Line */}
                <div
                  onClick={() => handleToggleExpand(idx)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'var(--color-background-secondary)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <FaChevronDown
                    style={{
                      fontSize: '12px',
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                      color: 'var(--color-text-secondary)',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    {isInvalid ? (
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          fontFamily: 'monospace',
                          color: '#f44336',
                        }}
                      >
                        {result.input} · <span style={{ color: 'var(--color-text-secondary)' }}>invalid format</span>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            fontFamily: 'monospace',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {result.input} → {result.outputReadable || result.output}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '11px',
                            color: 'var(--color-text-secondary)',
                            marginTop: '4px',
                          }}
                        >
                          {result.shiftHours !== undefined && (
                            <span>{formatShift(result.shiftHours)}</span>
                          )}
                          {result.dayShift && (
                            <span>
                              {result.dayShift === 'same' && '· Same day'}
                              {result.dayShift === 'next' && '↑ Next day'}
                              {result.dayShift === 'previous' && '↓ Previous day'}
                            </span>
                          )}
                          {result.detectedTimezoneAbbr && (
                            <span>· {result.detectedTimezoneAbbr.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content - Full single-mode output */}
                {isExpanded && !isInvalid && (
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background-primary)',
                      padding: '12px 16px',
                    }}
                  >
                    <TimeNormalizerSingleOutput result={result} isBulkExpanded={true} />
                  </div>
                )}

                {isExpanded && isInvalid && (
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background-primary)',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ color: '#f44336', fontSize: '12px' }}>
                      <strong>Parse Error:</strong> {result.error || 'Unable to parse this time format.'}
                    </div>
                    {result.acceptedFormats && (
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Accepted Formats
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                          {Object.entries(result.acceptedFormats).map(([category, examples]) => (
                            <div key={category}>
                              <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                                {category.replace(/([A-Z])/g, ' $1').trim()}:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '16px' }}>
                                {examples.map((example, idx) => (
                                  <div key={idx} style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                    {example}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Build tabs
  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: renderBulkOutput(),
      contentType: 'component',
    },
    {
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(results, null, 2),
      contentType: 'json',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
