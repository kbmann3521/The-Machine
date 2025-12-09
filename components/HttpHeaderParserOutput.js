import { useState } from 'react'
import { FaCopy, FaCheck } from 'react-icons/fa6'
import styles from '../styles/http-header-parser.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value, variant = 'default' }) {
  const [isCopied, setIsCopied] = useState(false)

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
    document.body.removeChild(textarea)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      fallbackCopy(value)
    }
  }

  const variantClass = variant === 'highlight' ? styles.cardHighlight : styles.cardDefault

  return (
    <div className={`${toolOutputStyles.copyCard} ${variantClass}`}>
      <div className={toolOutputStyles.copyCardHeader}>
        <span className={toolOutputStyles.copyCardLabel}>{label}</span>
        <button
          type="button"
          className="copy-action"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {isCopied ? <FaCheck /> : <FaCopy />}
        </button>
      </div>
      <div className={toolOutputStyles.copyCardValue}>{value}</div>
    </div>
  )
}

function HeaderBadge({ level, text }) {
  const variants = {
    success: { icon: '✓', className: 'badge-success' },
    warning: { icon: '⚠', className: 'badge-warning' },
    error: { icon: '✕', className: 'badge-error' },
    info: { icon: 'ℹ', className: 'badge-info' },
  }
  const variant = variants[level] || variants.info

  return (
    <span className={`${styles.badge} ${styles[variant.className]}`}>
      {variant.icon} {text}
    </span>
  )
}

function StatusSection({ title, icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  )
}

function HeaderCard({ name, value, analysis }) {
  const [expanded, setExpanded] = useState(false)

  let status = 'valid'
  let issues = []

  if (analysis) {
    if (analysis.issues) {
      const errors = analysis.issues.filter(i => i.level === 'error')
      const warnings = analysis.issues.filter(i => i.level === 'warning')
      status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid'
      issues = analysis.issues
    }
  }

  return (
    <div className={`${styles.headerCard} ${styles[`header-${status}`]}`}>
      <div className={styles.headerCardHeader} onClick={() => issues.length > 0 && setExpanded(!expanded)}>
        <div className={styles.headerNameValue}>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerValue}>{value}</div>
        </div>
        {status === 'valid' && <HeaderBadge level="success" text="Valid" />}
        {status === 'warning' && <HeaderBadge level="warning" text="Warning" />}
        {status === 'error' && <HeaderBadge level="error" text="Error" />}
      </div>
      {expanded && issues.length > 0 && (
        <div className={styles.headerCardDetails}>
          {issues.map((issue, idx) => (
            <div key={idx} className={`${styles.issue} ${styles[`issue-${issue.level}`]}`}>
              <span className={styles.issueIcon}>
                {issue.level === 'error' ? '✕' : '⚠'}
              </span>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExportModal({ headers }) {
  const [copied, setCopied] = useState(null)

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const canonicalFormat = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const curlFormat = Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(' \\\n')

  const fetchFormat = JSON.stringify(
    Object.fromEntries(Object.entries(headers)),
    null,
    2
  )

  return (
    <div className={styles.exportModal}>
      <div className={styles.exportTitle}>Export Headers</div>

      <div className={styles.exportFormat}>
        <div className={styles.exportLabel}>Canonical Format</div>
        <div className={`${toolOutputStyles.copyCard}`} style={{ marginTop: '8px' }}>
          <div className={toolOutputStyles.copyCardHeader}>
            <span className={toolOutputStyles.copyCardLabel}>Plain Text</span>
            <button onClick={() => handleCopy(canonicalFormat, 'canonical')} className="copy-action">
              {copied === 'canonical' ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
          <div className={toolOutputStyles.copyCardValue} style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {canonicalFormat}
          </div>
        </div>
      </div>

      <div className={styles.exportFormat}>
        <div className={styles.exportLabel}>cURL Format</div>
        <div className={`${toolOutputStyles.copyCard}`} style={{ marginTop: '8px' }}>
          <div className={toolOutputStyles.copyCardHeader}>
            <span className={toolOutputStyles.copyCardLabel}>cURL Flags</span>
            <button onClick={() => handleCopy(curlFormat, 'curl')} className="copy-action">
              {copied === 'curl' ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
          <div className={toolOutputStyles.copyCardValue} style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {curlFormat}
          </div>
        </div>
      </div>

      <div className={styles.exportFormat}>
        <div className={styles.exportLabel}>JSON / Fetch Init</div>
        <div className={`${toolOutputStyles.copyCard}`} style={{ marginTop: '8px' }}>
          <div className={toolOutputStyles.copyCardHeader}>
            <span className={toolOutputStyles.copyCardLabel}>JSON Object</span>
            <button onClick={() => handleCopy(fetchFormat, 'json')} className="copy-action">
              {copied === 'json' ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
          <div className={toolOutputStyles.copyCardValue} style={{ whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {fetchFormat}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverallStatusBadge({ status }) {
  if (!status) return null

  const riskColors = {
    high: { icon: '🔴', label: 'High Risk', color: '#ef5350' },
    medium: { icon: '🟡', label: 'Warnings', color: '#ffc107' },
    low: { icon: '🟢', label: 'Safe', color: '#66bb6a' },
  }

  const riskInfo = riskColors[status.riskLevel] || riskColors.low

  return (
    <div className={styles.overallStatusContainer}>
      <div className={styles.overallStatusBadge} style={{ borderLeftColor: riskInfo.color }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>{riskInfo.icon}</span>
        <div className={styles.overallStatusContent}>
          <div className={styles.overallStatusLabel}>{riskInfo.label}</div>
          <div className={styles.overallStatusStats}>
            {status.errors > 0 && <span className={styles.errorCount}>{status.errors} error{status.errors !== 1 ? 's' : ''}</span>}
            {status.warnings > 0 && <span className={styles.warningCount}>{status.warnings} warning{status.warnings !== 1 ? 's' : ''}</span>}
            {status.errors === 0 && status.warnings === 0 && <span className={styles.validCount}>All clear</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HttpHeaderParserOutput({ result }) {
  const [showExport, setShowExport] = useState(false)

  if (!result || result.error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❌</div>
          <div className={styles.emptyTitle}>Unable to parse</div>
          <p className={styles.emptyMessage}>{result?.error || 'Invalid header format'}</p>
        </div>
      </div>
    )
  }

  const { statusLine, headers, headerAnalysis, analysis, overallStatus, groupedHeaders, parseErrors } = result

  return (
    <div className={styles.container}>
      {overallStatus && <OverallStatusBadge status={overallStatus} />}

      {parseErrors.length > 0 && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>❌</span>
          <div>
            <strong>Parse Errors:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
              {parseErrors.map((err, idx) => (
                <li key={idx} style={{ fontSize: '12px' }}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {statusLine && (
        <StatusSection title="Status Line" icon="📍">
          <div className={styles.statusLineGrid}>
            {statusLine.type === 'response' ? (
              <>
                <CopyCard label="HTTP Version" value={statusLine.httpVersion} />
                <CopyCard label="Status Code" value={statusLine.statusCode.toString()} variant="highlight" />
                <CopyCard label="Status Message" value={statusLine.statusMessage} />
              </>
            ) : (
              <>
                <CopyCard label="Method" value={statusLine.method} variant="highlight" />
                <CopyCard label="Path" value={statusLine.path} />
                <CopyCard label="HTTP Version" value={statusLine.httpVersion} />
              </>
            )}
          </div>
        </StatusSection>
      )}

      {Object.keys(groupedHeaders).map(groupName => (
        <StatusSection key={groupName} title={`${groupName.charAt(0).toUpperCase() + groupName.slice(1)} Headers`} icon="📦">
          <div className={styles.headerList}>
            {Object.entries(groupedHeaders[groupName]).map(([name, value]) => (
              <HeaderCard key={name} name={name} value={value} analysis={headerAnalysis[name]} />
            ))}
          </div>
        </StatusSection>
      ))}

      {analysis.security.warnings.length > 0 && (
        <StatusSection title="Security Warnings" icon="🔒">
          <div className={styles.warningList}>
            {analysis.security.warnings.map((warning, idx) => (
              <div key={idx} className={styles.warningItem}>
                <span className={styles.warningIcon}>⚠️</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {analysis.security.conflicts.length > 0 && (
        <StatusSection title="Header Conflicts" icon="⚔️">
          <div className={styles.conflictList}>
            {analysis.security.conflicts.map((conflict, idx) => (
              <div key={idx} className={styles.conflictItem}>
                <span className={styles.conflictIcon}>✕</span>
                <span>{conflict}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {analysis.security.missingRecommendedHeaders.length > 0 && (
        <StatusSection title="Missing Security Headers" icon="🛡️">
          <div className={styles.missingList}>
            {analysis.security.missingRecommendedHeaders.map((header, idx) => (
              <div key={idx} className={styles.missingItem}>
                <span className={styles.missingIcon}>→</span>
                <span>{header}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      <StatusSection title="Caching Analysis" icon="💾">
        <div className={styles.analysisList}>
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Cacheable:</span>
            <span className={styles.analysisValue}>
              {analysis.caching.isCacheable ? <HeaderBadge level="success" text="Yes" /> : <HeaderBadge level="error" text="No" />}
            </span>
          </div>
          {analysis.caching.maxAge !== null && (
            <div className={styles.analysisItem}>
              <span className={styles.analysisLabel}>Max Age:</span>
              <span className={styles.analysisValue}>{analysis.caching.maxAge} seconds</span>
            </div>
          )}
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Public:</span>
            <span className={styles.analysisValue}>
              {analysis.caching.isPublic ? <HeaderBadge level="info" text="Yes" /> : <HeaderBadge level="info" text="No" />}
            </span>
          </div>
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Revalidation Required:</span>
            <span className={styles.analysisValue}>
              {analysis.caching.requiresRevalidation ? <HeaderBadge level="warning" text="Yes" /> : <HeaderBadge level="success" text="No" />}
            </span>
          </div>
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Has Strong Validator (ETag):</span>
            <span className={styles.analysisValue}>
              {analysis.caching.hasStrongValidator ? <HeaderBadge level="success" text="Yes" /> : <HeaderBadge level="info" text="No" />}
            </span>
          </div>
        </div>
      </StatusSection>

      <StatusSection title="Performance Analysis" icon="⚡">
        <div className={styles.analysisList}>
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Compression:</span>
            <span className={styles.analysisValue}>
              {analysis.compression.isCompressed ? (
                <HeaderBadge level="success" text={`${analysis.compression.method}`} />
              ) : (
                <HeaderBadge level="warning" text="Not enabled" />
              )}
            </span>
          </div>
          {analysis.compression.contentLength !== null && (
            <div className={styles.analysisItem}>
              <span className={styles.analysisLabel}>Payload Size:</span>
              <span className={styles.analysisValue}>{(analysis.compression.contentLength / 1024).toFixed(2)} KB</span>
            </div>
          )}
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Streaming (Chunked):</span>
            <span className={styles.analysisValue}>
              {analysis.compression.isChunked ? <HeaderBadge level="info" text="Yes" /> : <HeaderBadge level="info" text="No" />}
            </span>
          </div>
          <div className={styles.analysisItem}>
            <span className={styles.analysisLabel}>Keep-Alive:</span>
            <span className={styles.analysisValue}>
              {analysis.compression.keepAlive ? <HeaderBadge level="success" text="Enabled" /> : <HeaderBadge level="info" text="Disabled" />}
            </span>
          </div>
        </div>
      </StatusSection>

      <div className={styles.exportButton}>
        <button onClick={() => setShowExport(!showExport)} className={styles.exportToggle}>
          {showExport ? '▼' : '▶'} Export Headers
        </button>
        {showExport && <ExportModal headers={headers} />}
      </div>
    </div>
  )
}
