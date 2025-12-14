import React, { useMemo } from 'react'
import { analyzeMultipleItems } from '../../../lib/bulkIPCompare'
import styles from '../../../styles/ip-toolkit.module.css'

export default function BulkIPMultiComparison({ results, types }) {
  const analysis = useMemo(() => {
    if (!results || results.length < 2) return null
    return analyzeMultipleItems(results, types)
  }, [results, types])

  if (!analysis) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No analysis data available
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Summary Stats */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Total Items
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              {analysis.total}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Valid
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>
              {analysis.validCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Invalid
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f44336' }}>
              {analysis.invalidCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Private
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2196f3' }}>
              {analysis.privateCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Public
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff9800' }}>
              {analysis.publicCount}
            </div>
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--color-text-secondary)',
          marginBottom: '12px'
        }}>
          Type Distribution
        </div>
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-background-tertiary)',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(analysis.typeDistribution).map(([type, count]) => (
              <div key={type} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>
                  {type}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-background-secondary)',
                  borderRadius: '4px',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px'
          }}>
            Insights
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {analysis.insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#2196f3'
                }}
              >
                💡 {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outliers */}
      {analysis.outliers && analysis.outliers.length > 0 && (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px'
          }}>
            Outliers ({analysis.outliers.length})
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {analysis.outliers.map((outlier, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#f44336'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  🔻 Item #{outlier.index + 1} — {outlier.input}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  {outlier.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis.insights?.length && !analysis.outliers?.length && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          backgroundColor: 'var(--color-background-tertiary)',
          borderRadius: '6px'
        }}>
          ✓ All items are consistent - no outliers or special insights detected
        </div>
      )}
    </div>
  )
}
