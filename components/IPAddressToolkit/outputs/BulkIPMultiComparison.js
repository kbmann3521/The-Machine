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
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '12px'
      }}>
        {/* Total Items */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--color-text-primary)',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Total Items
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {analysis.total}
          </div>
        </div>

        {/* Valid */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '8px',
          borderLeft: '4px solid #4caf50',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#4caf50', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Valid
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#4caf50' }}>
            {analysis.validCount}
          </div>
        </div>

        {/* Invalid */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(244, 67, 54, 0.08)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          borderLeft: '4px solid #f44336',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#f44336', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Invalid
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f44336' }}>
            {analysis.invalidCount}
          </div>
        </div>

        {/* Private */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(33, 150, 243, 0.08)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '8px',
          borderLeft: '4px solid #2196f3',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#2196f3', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Private
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2196f3' }}>
            {analysis.privateCount}
          </div>
        </div>

        {/* Public */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 152, 0, 0.08)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '8px',
          borderLeft: '4px solid #ff9800',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#ff9800', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Public
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ff9800' }}>
            {analysis.publicCount}
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--color-text-secondary)',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Type Distribution
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px'
        }}>
          {Object.entries(analysis.typeDistribution).map(([type, count]) => {
            const typeColors = {
              'IPv4': { bg: 'rgba(33, 150, 243, 0.08)', border: '#2196f3', color: '#2196f3' },
              'IPv6': { bg: 'rgba(156, 39, 176, 0.08)', border: '#9c27b0', color: '#9c27b0' },
              'CIDR': { bg: 'rgba(255, 152, 0, 0.08)', border: '#ff9800', color: '#ff9800' },
              'Hostname': { bg: 'rgba(76, 175, 80, 0.08)', border: '#4caf50', color: '#4caf50' },
              'Range': { bg: 'rgba(244, 67, 54, 0.08)', border: '#f44336', color: '#f44336' },
              'Invalid': { bg: 'rgba(158, 158, 158, 0.08)', border: '#9e9e9e', color: '#9e9e9e' },
            }
            const colorScheme = typeColors[type] || typeColors['Invalid']

            return (
              <div
                key={type}
                style={{
                  padding: '16px',
                  backgroundColor: colorScheme.bg,
                  border: `1px solid ${colorScheme.border}`,
                  borderRadius: '8px',
                  borderLeft: `4px solid ${colorScheme.border}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  color: colorScheme.color,
                  marginBottom: '8px',
                  letterSpacing: '0.5px'
                }}>
                  {type}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: colorScheme.color
                }}>
                  {count}
                </div>
              </div>
            )
          })}
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
