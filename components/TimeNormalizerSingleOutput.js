import { useState } from 'react'
import { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'

export default function TimeNormalizerSingleOutput({ result, isBulkExpanded = false }) {
  const [copiedField, setCopiedField] = useState('')

  if (!result || result.error) {
    return (
      <div style={{ color: '#f44336', fontSize: '12px' }}>
        <strong>Parse Error:</strong> {result?.error || 'Unable to parse this time format.'}
      </div>
    )
  }

  const {
    humanSummary,
    inputReadable,
    convertedReadable,
    detectedFormat,
    inputTimezone,
    inputTime,
    inputOffset,
    convertedTime,
    outputTimezone,
    outputOffset,
    unixSeconds,
    unixMillis,
  } = result

  const handleCopyField = (text, fieldId) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(''), 2000)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isBulkExpanded ? '16px' : '20px',
      }}
    >
      {/* Human Summary - TOP PRIORITY */}
      {humanSummary && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            border: '2px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Time Conversion
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '10px 0',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text)',
                borderBottom: '1px solid rgba(76, 175, 80, 0.2)',
              }}
            >
              <strong>From:</strong> {humanSummary.from}
            </div>
            <div
              style={{
                padding: '10px 0',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text)',
              }}
            >
              <strong>To:</strong> {humanSummary.to}
            </div>
            {humanSummary.difference && (
              <div
                style={{
                  padding: '10px 0',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <strong>Difference:</strong> {humanSummary.difference}
              </div>
            )}
            {humanSummary.dayShift !== 'Same Day' && (
              <div
                style={{
                  padding: '10px 0',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <strong>Day Shift:</strong> {humanSummary.dayShift}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Layer - Secondary */}
      {(inputReadable || convertedReadable) && (
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Formatted Times
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inputReadable && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Time</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(inputReadable, 'input-readable')}
                    title="Copy input time"
                  >
                    {copiedField === 'input-readable' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{inputReadable}</div>
              </div>
            )}
            {convertedReadable && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Converted Time</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(convertedReadable, 'converted-readable')}
                    title="Copy converted time"
                  >
                    {copiedField === 'converted-readable' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{convertedReadable}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Details - Tertiary */}
      {(detectedFormat || inputTimezone || inputOffset || outputTimezone || outputOffset || unixSeconds || unixMillis) && (
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Technical Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detectedFormat && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Detected Format</span>
                </div>
                <div className={styles.copyCardValue}>{detectedFormat}</div>
              </div>
            )}
            {inputTimezone && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Timezone</span>
                </div>
                <div className={styles.copyCardValue}>{inputTimezone}</div>
              </div>
            )}
            {inputOffset && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Offset</span>
                </div>
                <div className={styles.copyCardValue}>{inputOffset}</div>
              </div>
            )}
            {outputTimezone && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Output Timezone</span>
                </div>
                <div className={styles.copyCardValue}>{outputTimezone}</div>
              </div>
            )}
            {outputOffset && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Output Offset</span>
                </div>
                <div className={styles.copyCardValue}>{outputOffset}</div>
              </div>
            )}
            {unixSeconds && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Unix Timestamp (seconds)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(unixSeconds.toString(), 'unix-seconds')}
                    title="Copy Unix timestamp"
                  >
                    {copiedField === 'unix-seconds' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{unixSeconds}</div>
              </div>
            )}
            {unixMillis && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Unix Timestamp (milliseconds)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(unixMillis.toString(), 'unix-millis')}
                    title="Copy Unix timestamp"
                  >
                    {copiedField === 'unix-millis' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{unixMillis}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
