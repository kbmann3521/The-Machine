import { useState, useMemo } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'

function formatSVGOutput(svg, format = 'compact') {
  if (format === 'compact') {
    return svg.replace(/\n\s*/g, '').trim()
  } else if (format === 'pretty') {
    let formatted = svg
    let indent = 0
    const indentStr = '  '

    formatted = formatted
      .replace(/>\s*</g, '>\n<')
      .replace(/\s+/g, ' ')
      .trim()

    let result = ''
    let inText = false
    let tagBuffer = ''

    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i]

      if (char === '<' && !inText) {
        if (tagBuffer) {
          result += tagBuffer
          tagBuffer = ''
        }

        const endTag = formatted.substring(i, i + 2) === '</'
        const selfClosing = formatted.substring(i).match(/^<[^>]*\/>/)

        if (endTag) indent--

        if (result && !result.endsWith('\n')) {
          result += '\n'
        }

        result += indentStr.repeat(Math.max(0, indent))
        tagBuffer = '<'
      } else if (char === '>' && !inText) {
        tagBuffer += char
        result += tagBuffer
        tagBuffer = ''

        const isTextStart = /^<text\b/.test(formatted.substring(i - 4))
        const isSelfClosing = formatted.substring(i - 1, i) === '/'
        const isClosing = formatted.substring(i - 1, i) === '</'

        if (isTextStart) inText = true

        if (!isClosing && !isSelfClosing) {
          const tagName = formatted.substring(formatted.lastIndexOf('<', i), i + 1).match(/<(\w+)/)?.[1]
          if (!['circle', 'rect', 'ellipse', 'path', 'line', 'polygon', 'image'].includes(tagName)) {
            indent++
          }
        }

        result += '\n'
      } else if (char === '>' && inText) {
        tagBuffer += char
        if (/<\/text>/.test(tagBuffer)) {
          inText = false
        }
        result += tagBuffer
        tagBuffer = ''
      } else {
        tagBuffer += char
      }
    }

    if (tagBuffer) result += tagBuffer

    return result.replace(/\n\s*\n/g, '\n').trim()
  }

  return svg
}

export default function SVGOptimizerOutput({ result, config, onJSONToggle }) {
  const [copiedSVG, setCopiedSVG] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const outputFormat = config?.outputFormat || 'compact'
  const formattedSvg = useMemo(() => {
    if (!result?.optimizedSvg) return ''
    return formatSVGOutput(result.optimizedSvg, outputFormat)
  }, [result?.optimizedSvg, outputFormat])

  const handleCopySVG = async () => {
    try {
      await navigator.clipboard.writeText(formattedSvg)
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

  const { stats, analysis, diff, validation, optimizationResult, potentialOptimizations, normalization, safetyFlags } = result

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                {stats.attributes.byElement && Object.keys(stats.attributes.byElement).length > 0 && (
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(76, 175, 80, 0.15)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: '500' }}>By Element Type:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                      {Object.entries(stats.attributes.byElement).map(([tag, count]) => (
                        <div key={tag} style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                          <strong>&lt;{tag}&gt;</strong>: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {stats.elements.byType && Object.keys(stats.elements.byType).length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(76, 175, 80, 0.15)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: '500' }}>By Element Type:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                      {Object.entries(stats.elements.byType).map(([tag, count]) => (
                        <div key={tag} style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                          <strong>&lt;{tag}&gt;</strong>: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stats.precision && stats.precision.reduced && (
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
                {stats.precision.originalDecimals && stats.precision.optimizedDecimals && (
                  <div style={{ marginTop: '6px', fontSize: '11px' }}>
                    ({stats.precision.originalDecimals} → {stats.precision.optimizedDecimals} decimal places)
                  </div>
                )}
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
            {analysis.features && (
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
                  {analysis.features.usesDefs && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Definitions (&lt;defs&gt;)</div>}
                  {analysis.features.usesText && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Text Elements</div>}
                  {analysis.features.usesMasks && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Masks</div>}
                  {analysis.features.usesFilters && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Filters</div>}
                  {analysis.features.usesGradients && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Gradients</div>}
                  {analysis.features.usesPatterns && <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>✓ Patterns</div>}
                  {!Object.values(analysis.features).some(v => v) && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>No special features detected</div>
                  )}
                </div>
              </div>
            )}

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
            {analysis.fonts && (analysis.fonts.detected.length > 0 || analysis.fonts.implicit) && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Fonts
                </div>
                {analysis.fonts.detected.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: analysis.fonts.implicit ? '12px' : '0' }}>
                    {analysis.fonts.detected.map((font, idx) => (
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
                ) : null}
                {analysis.fonts.implicit && (
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    ℹ Implicit font: Text elements without explicit font-family attribute
                  </div>
                )}
              </div>
            )}

            {/* Viewport Metadata */}
            {analysis.viewport && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Viewport
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div>{analysis.viewport.hasViewBox ? '✓' : '✗'} ViewBox {analysis.viewport.viewBox ? `"${analysis.viewport.viewBox}"` : 'missing'}</div>
                  <div>{analysis.viewport.hasWidth ? '✓' : '✗'} Width {analysis.viewport.width ? `"${analysis.viewport.width}"` : 'not set'}</div>
                  <div>{analysis.viewport.hasHeight ? '✓' : '✗'} Height {analysis.viewport.height ? `"${analysis.viewport.height}"` : 'not set'}</div>
                </div>
              </div>
            )}

            {/* References */}
            {analysis.references && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  ID References
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div>IDs defined: <strong>{analysis.references.idsDefined.length}</strong></div>
                  <div>IDs referenced: <strong>{analysis.references.idsReferenced.length}</strong></div>
                  {analysis.references.brokenReferences.length > 0 && (
                    <div style={{ color: '#ff9800', marginTop: '4px' }}>
                      ⚠ Broken references: {analysis.references.brokenReferences.join(', ')}
                    </div>
                  )}
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

      {/* Normalization Changes */}
      {normalization && normalization.applied && normalization.details.length > 0 && (
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
            ✓ Normalization Applied
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {normalization.details.map((detail, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                  • {detail}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Potential Optimizations (Phase 2) */}
      {potentialOptimizations && Object.values(potentialOptimizations).some(v => v?.possible) && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#9c27b0',
          }}>
            💡 Potential Optimizations (with Aggressive Mode)
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(156, 39, 176, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(156, 39, 176, 0.2)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {potentialOptimizations.precisionReduction?.possible && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>✓ Reduce numeric precision (decimal places)</div>
                  {potentialOptimizations.precisionReduction.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                      {potentialOptimizations.precisionReduction.reason}
                    </div>
                  )}
                </div>
              )}
              {potentialOptimizations.shapeConversion?.possible && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>✓ Convert shapes to paths</div>
                  {potentialOptimizations.shapeConversion.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                      {potentialOptimizations.shapeConversion.reason}
                    </div>
                  )}
                </div>
              )}
              {potentialOptimizations.pathMerging?.possible && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>✓ Merge multiple paths</div>
                  {potentialOptimizations.pathMerging.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                      {potentialOptimizations.pathMerging.reason}
                    </div>
                  )}
                </div>
              )}
              {potentialOptimizations.attributeCleanup?.possible && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>✓ Remove unused/redundant attributes</div>
                  {potentialOptimizations.attributeCleanup.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                      {potentialOptimizations.attributeCleanup.reason}
                    </div>
                  )}
                </div>
              )}
              {potentialOptimizations.commentRemoval?.possible && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>✓ Remove comments</div>
                  {potentialOptimizations.commentRemoval.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                      {potentialOptimizations.commentRemoval.reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Flags (Phase 2 Reference) */}
      {result?.safetyFlags && Object.values(result.safetyFlags).some(v => v) && (
        <div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '4px 4px 0 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#f44336',
          }}>
            ⚠ Safety Flags (Phase 2 Reference)
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(244, 67, 54, 0.05)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid rgba(244, 67, 54, 0.2)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              {result.safetyFlags.hasText && <div>◆ Contains text elements</div>}
              {result.safetyFlags.hasExternalRefs && <div>◆ Has external references (IDs)</div>}
              {result.safetyFlags.hasFilters && <div>◆ Uses filters</div>}
              {result.safetyFlags.hasAnimations && <div>◆ Contains animations</div>}
              {result.safetyFlags.hasScripts && <div>◆ Contains scripts</div>}
              {result.safetyFlags.hasMasks && <div>◆ Uses masks</div>}
              {result.safetyFlags.hasGradients && <div>◆ Uses gradients</div>}
              {result.safetyFlags.hasPatterns && <div>◆ Uses patterns</div>}
              {result.safetyFlags.hasBrokenReferences && <div style={{ color: '#f44336' }}>⚠ Has broken ID references</div>}
            </div>
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
