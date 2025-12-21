import { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'

export default function SVGOptimizerOutput({ result, onJSONToggle }) {
  const [copiedSVG, setCopiedSVG] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const handleCopySVG = async () => {
    try {
      await navigator.clipboard.writeText(result.optimizedSvg)
      setCopiedSVG(true)
      setTimeout(() => setCopiedSVG(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleCopyField = async (value, fieldName) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  if (!result || result.error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(239, 83, 80, 0.1)',
        border: '1px solid rgba(239, 83, 80, 0.3)',
        borderRadius: '4px',
        color: '#ef5350'
      }}>
        {result?.error || 'Error optimizing SVG'}
      </div>
    )
  }

  const { stats, analysis, diff, validation, optimizationResult, potentialOptimizations } = result

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Optimization Result Indicator */}
      {optimizationResult && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: optimizationResult === 'changes_applied' ? 'rgba(76, 175, 80, 0.1)' : optimizationResult === 'no_changes' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 152, 0, 0.1)',
          border: optimizationResult === 'changes_applied' ? '1px solid rgba(76, 175, 80, 0.3)' : optimizationResult === 'no_changes' ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: '600',
          color: optimizationResult === 'changes_applied' ? '#4caf50' : optimizationResult === 'no_changes' ? '#2196f3' : '#ff9800'
        }}>
          {optimizationResult === 'changes_applied' && '✓ Optimizations Applied'}
          {optimizationResult === 'no_changes' && 'ℹ No Optimizations Needed'}
          {optimizationResult === 'normalization_only' && 'ℹ Normalization Only (whitespace/formatting)'}
          {optimizationResult === 'invalid_svg' && '✗ Invalid SVG'}
        </div>
      )}

      {/* Validation Warnings */}
      {validation?.warnings && validation.warnings.length > 0 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#ffc107'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>⚠ Validation Warnings</div>
          {validation.warnings.map((w, idx) => (
            <div key={idx} style={{ marginBottom: '4px', fontSize: '11px' }}>• {w}</div>
          ))}
        </div>
      )}

      {/* Optimized SVG Code - TOP SECTION */}
      {result?.optimizedSvg && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#9c27b0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>📋 Optimized SVG Code</span>
            <button
              onClick={handleCopySVG}
              style={{
                padding: '4px 12px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7b1fa2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#9c27b0'}
            >
              {copiedSVG ? '✓ Copied' : <FaCopy size={11} />}
              {!copiedSVG && 'Copy'}
            </button>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(156, 39, 176, 0.05)',
            border: '1px solid rgba(156, 39, 176, 0.2)',
            borderRadius: '0 0 4px 4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'var(--color-text-primary)',
            maxHeight: '300px',
            overflowY: 'auto',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            backgroundColor: 'var(--color-background-tertiary)',
          }}>
            {result.optimizedSvg}
          </div>
        </div>
      )}

      {/* Optimization Stats */}
      {stats && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#4caf50',
          }}>
            ✓ Optimization Summary
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Original Size</span>
                <span className={styles.statValue}>{(stats.originalSize / 1024).toFixed(2)} KB</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Optimized Size</span>
                <span className={styles.statValue}>{(stats.optimizedSize / 1024).toFixed(2)} KB</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Size Reduction</span>
                <span className={styles.statValue} style={{ color: '#4caf50' }}>{stats.reductionPercent}%</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Bytes Removed</span>
                <span className={styles.statValue}>{stats.bytesRemoved > 0 ? `${stats.bytesRemoved} bytes` : '0 bytes'}</span>
              </div>
            </div>

            {stats.attributes && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Attributes: <strong>{stats.attributes.total}</strong> total
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Removed: <strong>{stats.attributes.removed}</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Elements: <strong>{stats.elements.total}</strong> total
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Removed: <strong>{stats.elements.removed}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stats.precisionReduced && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#ffc107'
              }}>
                ⚠ Numeric precision was reduced during optimization
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Structural Analysis */}
      {analysis && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#2196f3',
          }}>
            📊 SVG Structural Analysis
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Elements</span>
                <span className={styles.statValue}>{analysis.totalElements}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Element Types</span>
                <span className={styles.statValue}>{Object.keys(analysis.elements).length}</span>
              </div>
            </div>

            {Object.keys(analysis.elements).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Element Types
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {Object.entries(analysis.elements).map(([tag, count]) => (
                    <div
                      key={tag}
                      style={{
                        padding: '8px',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        border: '1px solid rgba(33, 150, 243, 0.2)'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#2196f3' }}>&lt;{tag}&gt;</span>
                      <span style={{ marginLeft: '4px', color: 'var(--color-text-secondary)' }}>({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features detected */}
            <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
              }}>
                Features Detected
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysis.hasDefs && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ SVG Definitions (&lt;defs&gt;)</div>}
                {analysis.hasText && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Text Elements</div>}
                {analysis.hasMask && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Masks</div>}
                {analysis.hasFilter && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Filters</div>}
                {analysis.hasUse && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Use Elements</div>}
                {!analysis.hasDefs && !analysis.hasText && !analysis.hasMask && !analysis.hasFilter && !analysis.hasUse && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>No special features detected</div>
                )}
              </div>
            </div>

            {/* IDs */}
            {analysis.ids && analysis.ids.length > 0 && (
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  IDs Found ({analysis.ids.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.ids.slice(0, 10).map((id, idx) => (
                    <span key={idx} style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(100, 200, 200, 0.2)',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {id}
                    </span>
                  ))}
                  {analysis.ids.length > 10 && (
                    <span style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      +{analysis.ids.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Fonts */}
            {analysis.fonts && analysis.fonts.length > 0 && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Fonts Used
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.fonts.map((font, idx) => (
                    <span key={idx} style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      border: '1px solid rgba(156, 39, 176, 0.3)',
                      borderRadius: '3px',
                      fontSize: '11px',
                      color: '#9c27b0'
                    }}>
                      {font}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(33, 150, 243, 0.2)'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ff9800',
                  marginBottom: '8px',
                }}>
                  ⚠ Analysis Warnings
                </div>
                {analysis.warnings.map((warning, idx) => (
                  <div key={idx} style={{
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                    paddingLeft: '8px',
                    borderLeft: '2px solid #ff9800'
                  }}>
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Highlights */}
      {diff && ((diff.removedAttributes?.length > 0) || (diff.removedElements?.length > 0) || (diff.precisionChanges?.length > 0)) && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ff9800',
          }}>
            🔍 Change Highlights
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 152, 0, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(255, 152, 0, 0.2)',
            borderTop: 'none',
          }}>
            {/* Removed Attributes */}
            {diff.removedAttributes && diff.removedAttributes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Removed Attributes ({diff.removedAttributes.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diff.removedAttributes.slice(0, 5).map((attr, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid rgba(244, 67, 54, 0.2)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--color-text-primary)',
                        wordBreak: 'break-word'
                      }}
                    >
                      {attr}
                    </div>
                  ))}
                  {diff.removedAttributes.length > 5 && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      +{diff.removedAttributes.length - 5} more attributes
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Removed Elements */}
            {diff.removedElements && diff.removedElements.length > 0 && (
              <div style={{ marginBottom: diff.removedAttributes?.length > 0 ? '16px' : '0', paddingTop: diff.removedAttributes?.length > 0 ? '16px' : '0', borderTop: diff.removedAttributes?.length > 0 ? '1px solid rgba(255, 152, 0, 0.2)' : 'none' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Removed Elements ({diff.removedElements.length})
                </div>
                {diff.removedElements.slice(0, 3).map((elem, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    <strong>{elem.type}:</strong> {elem.content?.substring(0, 60)}{elem.content?.length > 60 ? '...' : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Precision Changes */}
            {diff.precisionChanges && diff.precisionChanges.length > 0 && (
              <div style={{ paddingTop: (diff.removedAttributes?.length > 0 || diff.removedElements?.length > 0) ? '16px' : '0', borderTop: (diff.removedAttributes?.length > 0 || diff.removedElements?.length > 0) ? '1px solid rgba(255, 152, 0, 0.2)' : 'none' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Precision Changes
                </div>
                {diff.precisionChanges.map((change, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                    {change.type}: <strong>{change.count}</strong> numbers reduced (e.g., {change.example})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
