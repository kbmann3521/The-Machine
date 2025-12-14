import React, { useMemo } from 'react'
import { compareItems } from '../../../lib/bulkIPCompare'
import styles from '../../../styles/ip-toolkit.module.css'

const severityColors = {
  error: '#f44336',
  major: '#ff9800',
  minor: '#2196f3',
  info: '#4caf50'
}

const severityLabels = {
  error: 'Error',
  major: 'Major Difference',
  minor: 'Minor Difference',
  info: 'Information'
}

export default function BulkIPComparisonPane({ resultsA, resultsB, typeA, typeB }) {
  const comparison = useMemo(() => {
    if (!resultsA || !resultsB) return null
    return compareItems(resultsA, resultsB, typeA, typeB)
  }, [resultsA, resultsB, typeA, typeB])

  if (!comparison) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No comparison data available
      </div>
    )
  }

  // Incomparable inputs
  if (comparison.status === 'error') {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        borderRadius: '8px',
        color: '#f44336'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          ❌ Cannot Compare
        </div>
        <div style={{ fontSize: '13px' }}>
          {comparison.message}
        </div>
        <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--color-text-secondary)' }}>
          Type A: <strong>{typeA}</strong> · Type B: <strong>{typeB}</strong>
        </div>
      </div>
    )
  }

  const { differences = [], similarities = [], warnings = [] } = comparison

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#ff9800'
        }}>
          {warnings.map((warning, idx) => (
            <div key={idx} style={{ marginBottom: idx < warnings.length - 1 ? '6px' : 0 }}>
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Similarities Summary */}
      {similarities && similarities.length > 0 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(76, 175, 80, 0.05)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '6px',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#4caf50',
            marginBottom: '8px'
          }}>
            ✓ Similarities ({similarities.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {similarities.map((sim, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  color: '#4caf50',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                {sim.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      {differences && differences.length > 0 ? (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            padding: '0 4px'
          }}>
            Differences ({differences.length})
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {differences.map((diff, idx) => (
              <div key={idx} style={{
                padding: '12px 16px',
                border: `1px solid ${severityColors[diff.severity] || '#e0e0e0'}`,
                borderRadius: '6px',
                backgroundColor: `${severityColors[diff.severity] || '#e0e0e0'}11`
              }}>
                {/* Field name and severity */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{diff.field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: severityColors[diff.severity],
                    color: 'white',
                    borderRadius: '3px',
                    fontWeight: '600'
                  }}>
                    {severityLabels[diff.severity]}
                  </span>
                </div>

                {/* Side-by-side values */}
                {!diff.details ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    {/* Value A */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px'
                      }}>
                        INPUT A
                      </div>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-background-tertiary)',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        wordBreak: 'break-all',
                        color: 'var(--color-text-primary)'
                      }}>
                        {typeof diff.a === 'boolean' ? (diff.a ? '✓ Yes' : '✗ No') : String(diff.a)}
                      </div>
                    </div>

                    {/* Value B */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px'
                      }}>
                        INPUT B
                      </div>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-background-tertiary)',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        wordBreak: 'break-all',
                        color: 'var(--color-text-primary)'
                      }}>
                        {typeof diff.b === 'boolean' ? (diff.b ? '✓ Yes' : '✗ No') : String(diff.b)}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Octet-style detailed comparison */
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-background-tertiary)',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontSize: '11px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                      Octet-by-Octet Comparison
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                      gap: '8px'
                    }}>
                      {diff.details.map((octet, i) => (
                        <div key={i} style={{
                          padding: '8px',
                          backgroundColor: octet.same ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                          borderRadius: '4px',
                          textAlign: 'center',
                          borderLeft: `3px solid ${octet.same ? '#4caf50' : '#f44336'}`
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                            Octet {i + 1}
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{octet.a}</div>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>vs</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{octet.b}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional info */}
                {diff.distance !== undefined && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Distance: <strong>{diff.distance.toLocaleString()}</strong> addresses apart
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          backgroundColor: 'var(--color-background-tertiary)',
          borderRadius: '6px'
        }}>
          ✓ No differences found - inputs are identical
        </div>
      )}
    </div>
  )
}
