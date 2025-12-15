import { useMemo } from 'react'
import TimeNormalizerSingleOutput from './TimeNormalizerSingleOutput'
import TimeNormalizerBulkOutput from './TimeNormalizerBulkOutput'
import OutputTabs from './OutputTabs'
import { isBulkInput, parseBulkInput } from '../lib/bulkTimeParser'
import { timeNormalizer } from '../lib/tools'
import styles from '../styles/tool-output.module.css'

export default function TimeNormalizerOutputPanel({ result, inputText, config = {} }) {
  // Check if input is bulk
  const isBulk = useMemo(() => {
    if (!inputText) return false
    return isBulkInput(inputText)
  }, [inputText])

  // Process bulk inputs if in bulk mode
  const bulkResults = useMemo(() => {
    if (!isBulk || !inputText) return null

    const parsed = parseBulkInput(inputText, {
      softLimit: 500,
      hardLimit: 1000,
    })

    if (
      (parsed.errors && parsed.errors.length > 0) ||
      !parsed.entries ||
      parsed.entries.length === 0
    ) {
      return null
    }

    // Process each entry through timeNormalizer
    const results = parsed.entries.map((entry, idx) => {
      try {
        const singleResult = timeNormalizer(entry, config)
        return {
          ...singleResult,
          input: entry,
          _bulkIndex: idx,
        }
      } catch (err) {
        return {
          input: entry,
          error: err.message,
          _bulkIndex: idx,
        }
      }
    })

    return {
      entries: results,
      warnings: parsed.warnings,
      errors: parsed.errors,
    }
  }, [isBulk, inputText, config])

  // Route to appropriate output component based on mode
  const renderOutput = () => {
    // If bulk mode and we have processed results, use TimeNormalizerBulkOutput
    if (isBulk && bulkResults) {
      return <TimeNormalizerBulkOutput results={bulkResults.entries} isBulkMode={true} />
    }

    // Single mode - wrap in tabs
    if (!result) {
      return (
        <div className={styles.emptyState}>
          Enter a time to see the conversion results.
        </div>
      )
    }

    if (result.error) {
      const tabs = [
        {
          id: 'output',
          label: 'OUTPUT',
          content: (
            <div style={{ padding: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '6px',
                  color: '#f44336',
                  fontSize: '13px',
                }}
              >
                <strong>Parse Error:</strong> {result.error}
              </div>
              {result.acceptedFormats && (
                <div style={{ marginTop: '20px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
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
          ),
          contentType: 'component',
        },
      ]
      return <OutputTabs tabs={tabs} showCopyButton={true} />
    }

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: <TimeNormalizerSingleOutput result={result} isBulkExpanded={false} />,
        contentType: 'component',
      },
      {
        id: 'json',
        label: 'JSON',
        content: JSON.stringify(result, null, 2),
        contentType: 'json',
      },
    ]

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  return <div style={{ width: '100%' }}>{renderOutput()}</div>
}
