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

function HeaderCard({ name, value, analysis, tokenType }) {
  const [expanded, setExpanded] = useState(false)

  let status = 'valid'
  let issues = []
  let content = null

  if (analysis) {
    if (analysis.issues) {
      const errors = analysis.issues.filter(i => i.level === 'error')
      const warnings = analysis.issues.filter(i => i.level === 'warning')
      status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid'
      issues = analysis.issues
    }

    // Special rendering for CSP
    if (analysis.directives && name === 'Content-Security-Policy') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.directivesGrid}>
            {Object.entries(analysis.directives).map(([dir, sources]) => (
              <div key={dir} className={styles.directiveItem}>
                <span className={styles.directiveName}>{dir}</span>
                <span className={styles.directiveSources}>
                  {Array.isArray(sources) ? sources.join(', ') || 'none' : sources}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Special rendering for Referrer-Policy
    if (analysis.strength && name === 'Referrer-Policy') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.policyEvaluation}>
            <div className={styles.policyItem}>
              <span className={styles.policyLabel}>Strength:</span>
              <span className={styles.policyValue}>{analysis.strength}</span>
            </div>
            <div className={styles.policyItem}>
              <span className={styles.policyLabel}>Leaks sensitive data:</span>
              <span className={styles.policyValue}>
                {analysis.allowsSensitiveLeakage ? 'Yes' : 'No'}
              </span>
            </div>
            {analysis.recommendation && (
              <div className={styles.policyRecommendation}>
                {analysis.recommendation}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Special rendering for Permissions-Policy
    if (analysis.permissions && name === 'Permissions-Policy') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.permissionsGrid}>
            {Object.entries(analysis.permissions).map(([feature, status]) => (
              <div key={feature} className={`${styles.permissionItem} ${styles[`permission-${status.toLowerCase()}`]}`}>
                <span className={styles.featureName}>{feature}</span>
                <span className={styles.featureStatus}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Special rendering for ETag
    if (analysis.type && name === 'ETag') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.etagInfo}>
            <div className={styles.etagItem}>
              <span className={styles.etagLabel}>Type:</span>
              <span className={styles.etagValue}>{analysis.type}</span>
            </div>
            <div className={styles.etagItem}>
              <span className={styles.etagLabel}>Quoted:</span>
              <span className={styles.etagValue}>{analysis.quoted ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )
    }

    // Special rendering for Last-Modified
    if (analysis.date && name === 'Last-Modified') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.dateInfo}>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>ISO Format:</span>
              <span className={styles.dateValue}>{analysis.date}</span>
            </div>
          </div>
        </div>
      )
    }

    // Special rendering for Strict-Transport-Security
    if (analysis.maxAge !== undefined && name === 'Strict-Transport-Security') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.hstsInfo}>
            {analysis.maxAge !== null && (
              <div className={styles.hstsItem}>
                <span className={styles.hstsLabel}>Max Age:</span>
                <span className={styles.hstsValue}>{analysis.maxAge} seconds ({(analysis.maxAge / 31536000).toFixed(2)} years)</span>
              </div>
            )}
            <div className={styles.hstsItem}>
              <span className={styles.hstsLabel}>Include Subdomains:</span>
              <span className={styles.hstsValue}>{analysis.includeSubDomains ? 'Yes' : 'No'}</span>
            </div>
            <div className={styles.hstsItem}>
              <span className={styles.hstsLabel}>Preload:</span>
              <span className={styles.hstsValue}>{analysis.preload ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )
    }

    // Special rendering for X-Content-Type-Options
    if (analysis.value !== undefined && name === 'X-Content-Type-Options') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.optionsInfo}>
            <div className={styles.optionsItem}>
              <span className={styles.optionsLabel}>Value:</span>
              <span className={styles.optionsValue}>{analysis.value}</span>
            </div>
          </div>
        </div>
      )
    }

    // Special rendering for X-Frame-Options
    if (analysis.value !== undefined && name === 'X-Frame-Options') {
      content = (
        <div className={styles.analysisDetail}>
          <div className={styles.optionsInfo}>
            <div className={styles.optionsItem}>
              <span className={styles.optionsLabel}>Value:</span>
              <span className={styles.optionsValue}>{analysis.value}</span>
            </div>
          </div>
        </div>
      )
    }
  }

  const isExpandable = issues.length > 0 || content

  return (
    <div className={`${styles.headerCard} ${styles[`header-${status}`]}`}>
      <div
        className={`${styles.headerCardHeader} ${isExpandable ? styles.headerCardHeaderExpandable : ''}`}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <div className={styles.headerNameValue}>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerValue}>{value}</div>
          {tokenType && (
            <div className={styles.tokenTypeInfo}>
              <span className={styles.tokenTypeLabel}>{tokenType.type}</span>
              <span className={styles.tokenTypeDetail}>{tokenType.format}</span>
            </div>
          )}
        </div>
        <div className={styles.headerCardActions}>
          {isExpandable && (
            <span className={`${styles.expandChevron} ${expanded ? styles.expandChevronOpen : ''}`}>
              ▶
            </span>
          )}
          {status === 'valid' && <HeaderBadge level="success" text="Valid" />}
          {status === 'warning' && <HeaderBadge level="warning" text="Warning" />}
          {status === 'error' && <HeaderBadge level="error" text="Error" />}
        </div>
      </div>
      {expanded && isExpandable && (
        <div className={styles.headerCardDetails}>
          {content && <div className={styles.contentSection}>{content}</div>}
          {issues.length > 0 && (
            <div className={styles.issuesSection}>
              {issues.map((issue, idx) => (
                <div key={idx} className={`${styles.issue} ${styles[`issue-${issue.level}`]}`}>
                  <span className={styles.issueIcon}>
                    {issue.level === 'error' ? '✕' : issue.level === 'warning' ? '⚠' : 'ℹ'}
                  </span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}
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

function SecurityScoreCard({ securityScore, overallStatus }) {
  if (!securityScore) return null

  const getScoreColor = (score) => {
    if (score >= 90) return { color: '#66bb6a', bg: 'rgba(102, 187, 106, 0.1)' }
    if (score >= 80) return { color: '#ffc107', bg: 'rgba(255, 193, 7, 0.1)' }
    if (score >= 70) return { color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' }
    return { color: '#ef5350', bg: 'rgba(239, 83, 80, 0.1)' }
  }

  const getRiskLevelInfo = (level) => {
    if (level === 'high') return { icon: '🔴', label: 'High Risk' }
    if (level === 'medium') return { icon: '🟡', label: 'Medium Risk' }
    return { icon: '🟢', label: 'Low Risk' }
  }

  const colors = getScoreColor(securityScore.score)
  const securityRiskLevel = overallStatus?.security?.riskLevel || 'low'
  const riskInfo = getRiskLevelInfo(securityRiskLevel)

  return (
    <div className={styles.securityScoreContainer}>
      <div className={styles.securityScoreCard} style={{ backgroundColor: colors.bg, borderColor: colors.color }}>
        <div className={styles.scoreCircle} style={{ borderColor: colors.color, color: colors.color }}>
          <div className={styles.scoreNumber}>{securityScore.score}</div>
          <div className={styles.scoreGrade}>{securityScore.grade}</div>
        </div>
        <div className={styles.scoreContent}>
          <div className={styles.scoreTitle}>Security Best Practices Score</div>
          <div className={styles.scoreDescription}>Based on critical security headers and configurations</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <span>{riskInfo.icon} Security Risk: {riskInfo.label}</span>
          </div>
          {securityScore.deductions && securityScore.deductions.length > 0 && (
            <div className={styles.deductionsList}>
              <div className={styles.deductionsTitle}>Deductions:</div>
              {securityScore.deductions.map((d, idx) => (
                <div key={idx} className={styles.deductionItem}>
                  <span className={styles.deductionPoints}>-{d.points}</span>
                  <span className={styles.deductionName}>{d.name}</span>
                </div>
              ))}
            </div>
          )}
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
            {status.infos > 0 && <span className={styles.infoCount}>{status.infos} info{status.infos !== 1 ? 's' : ''}</span>}
            {status.errors === 0 && status.warnings === 0 && status.infos === 0 && <span className={styles.validCount}>All clear</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProtocolDiagnostics({ issues, strictMode, onStrictModeToggle, overallStatus }) {
  const [expanded, setExpanded] = useState(false)

  const errors = issues.filter(i => i.level === 'error')
  const warnings = issues.filter(i => i.level === 'warning')
  const infos = issues.filter(i => i.level === 'info')

  // Use protocol-specific counts from overallStatus
  const protocolErrorCount = overallStatus?.protocol?.errors ?? errors.length
  const protocolWarningCount = overallStatus?.protocol?.warnings ?? warnings.length
  const protocolInfoCount = overallStatus?.protocol?.infos ?? infos.length

  const hasProtocolIssues = protocolErrorCount > 0 || protocolWarningCount > 0 || protocolInfoCount > 0

  if (!hasProtocolIssues) {
    return (
      <div className={styles.protocolDiagnosticsContainer}>
        <div className={styles.diagnosticsHeader}>
          <div>
            <h3 className={styles.diagnosticsTitle}>Protocol Diagnostics</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
              Protocol compliance issues do not affect your Security Score. Strict Mode applies RFC parsing rules but does not reduce your grade.
            </p>
          </div>
          <button
            className={`${styles.strictModeToggle} ${strictMode ? styles.strictModeOn : styles.strictModeOff}`}
            onClick={onStrictModeToggle}
            title="Strict Mode applies strict RFC 9110/7230 validation rules. Issues may be reclassified (info → warning, warning → error). This affects Protocol Diagnostics only and does not reduce your Security Score."
          >
            {strictMode ? 'Strict Mode: ON' : 'Strict Mode: OFF'}
          </button>
        </div>
        <div className={styles.diagnosticsContent}>
          <div className={styles.diagnosticsEmpty}>✓ No protocol violations detected</div>
        </div>
      </div>
    )
  }

  const protocolRiskLevel = overallStatus?.protocol?.riskLevel || 'low'
  const riskIcon = { high: '🔴', medium: '🟡', low: '🟢' }
  const riskLabel = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }

  return (
    <div className={styles.protocolDiagnosticsContainer}>
      <div className={styles.diagnosticsHeader}>
        <div>
          <h3 className={styles.diagnosticsTitle}>Protocol Diagnostics</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
            Protocol compliance issues do not affect your Security Score. Strict Mode applies RFC parsing rules but does not reduce your grade.
          </p>
        </div>
        <button
          className={`${styles.strictModeToggle} ${strictMode ? styles.strictModeOn : styles.strictModeOff}`}
          onClick={onStrictModeToggle}
          title="Strict Mode applies strict RFC 9110/7230 validation rules. Issues may be reclassified (info → warning, warning → error). This affects Protocol Diagnostics only and does not reduce your Security Score."
        >
          {strictMode ? 'Strict Mode: ON' : 'Strict Mode: OFF'}
        </button>
      </div>
      <div className={styles.diagnosticsRisk}>
        <div className={styles.riskInfo}>
          <span>{riskIcon[protocolRiskLevel]} Compliance Risk: {riskLabel[protocolRiskLevel]}</span>
          <span className={styles.strictModeLabel}>{strictMode ? 'RFC Enforcement Active' : 'Practical Mode (lenient parsing)'}</span>
        </div>
        <span className={styles.issueCounts}>
          {protocolErrorCount > 0 && <span className={styles.errorBadge}>{protocolErrorCount} error{protocolErrorCount !== 1 ? 's' : ''}</span>}
          {protocolWarningCount > 0 && <span className={styles.warningBadge}>{protocolWarningCount} warning{protocolWarningCount !== 1 ? 's' : ''}</span>}
          {protocolInfoCount > 0 && <span className={styles.infoBadge}>{protocolInfoCount} info</span>}
        </span>
      </div>
      <div className={styles.diagnosticsContent}>
        <button className={styles.expandButton} onClick={() => setExpanded(!expanded)}>
          <span className={`${styles.expandChevron} ${expanded ? styles.expandChevronOpen : ''}`}>▶</span>
          {expanded ? 'Hide' : 'Show'} Details
        </button>
        {expanded && (
          <div className={styles.diagnosticsDetails}>
            {errors.map((issue, idx) => (
              <div key={idx} className={styles.diagnosticsItem}>
                <span className={styles.itemIcon}>✕</span>
                <span className={styles.itemLevel}>Error:</span>
                <span>{issue?.message || JSON.stringify(issue)}</span>
              </div>
            ))}
            {warnings.map((issue, idx) => (
              <div key={idx} className={styles.diagnosticsItem}>
                <span className={styles.itemIcon}>⚠</span>
                <span className={styles.itemLevel}>Warning:</span>
                <span>{issue?.message || JSON.stringify(issue)}</span>
              </div>
            ))}
            {infos.map((issue, idx) => (
              <div key={idx} className={styles.diagnosticsItem}>
                <span className={styles.itemIcon}>ℹ</span>
                <span className={styles.itemLevel}>Info:</span>
                <span>{issue?.message || JSON.stringify(issue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HttpHeaderParserOutput({ result, onStrictModeToggle }) {
  const [showExport, setShowExport] = useState(false)
  const [expandedTransforms, setExpandedTransforms] = useState(null)

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

  const { statusLine, headers, headerAnalysis, analysis, overallStatus, securityScore, groupedHeaders, parseErrors, cacheSimulation, transformations, strictMode } = result

  // Collect all issues from the analysis
  const allRfcIssues = []

  if (analysis.rfcCompliance?.headerConflicts) {
    allRfcIssues.push(...analysis.rfcCompliance.headerConflicts)
  }
  if (analysis.rfcCompliance?.headerNormalization) {
    allRfcIssues.push(...analysis.rfcCompliance.headerNormalization)
  }
  if (analysis.rfcCompliance?.validatorConflicts) {
    allRfcIssues.push(...analysis.rfcCompliance.validatorConflicts)
  }
  if (analysis.rfcCompliance?.compressionValidity) {
    allRfcIssues.push(...analysis.rfcCompliance.compressionValidity)
  }
  if (analysis.http2Incompatibilities) {
    allRfcIssues.push(...analysis.http2Incompatibilities)
  }
  if (analysis.cacheHeuristics?.issues) {
    allRfcIssues.push(...analysis.cacheHeuristics.issues)
  }
  if (analysis.headerFolding) {
    allRfcIssues.push(...analysis.headerFolding)
  }

  return (
    <div className={styles.container}>
      {securityScore && <SecurityScoreCard securityScore={securityScore} overallStatus={overallStatus} />}
      <ProtocolDiagnostics issues={allRfcIssues} strictMode={strictMode} onStrictModeToggle={onStrictModeToggle} overallStatus={overallStatus} />

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
        <StatusSection key={groupName} title={`${groupName.charAt(0).toUpperCase() + groupName.slice(1)} Headers`} icon="">
          <div className={styles.headerList}>
            {Object.entries(groupedHeaders[groupName]).map(([name, value]) => {
              const headerAnal = headerAnalysis[name]
              const tokenType = name === 'Authorization' && headerAnal && headerAnal.tokenType ? headerAnal.tokenType : null
              return (
                <HeaderCard key={name} name={name} value={value} analysis={headerAnal} tokenType={tokenType} />
              )
            })}
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
        <StatusSection title="Header Conflicts" icon="">
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
        <StatusSection title="Missing Security Headers" icon="">
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

      {analysis.hopByHopHeaders && analysis.hopByHopHeaders.length > 0 && (
        <StatusSection title="Hop-by-Hop Headers (RFC 7230)" icon="">
          <div className={styles.hopByHopList}>
            {analysis.hopByHopHeaders.map((header, idx) => (
              <div key={idx} className={styles.hopByHopItem}>
                <span className={styles.hopByHopIcon}>🔗</span>
                <span className={styles.hopByHopName}>{header}</span>
                <span className={styles.hopByHopNote}>Must not be forwarded by proxies</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {analysis.http2Compatibility && analysis.http2Compatibility.length > 0 && (
        <StatusSection title="HTTP/2 Compatibility" icon="">
          <div className={styles.compatibilityList}>
            {analysis.http2Compatibility.map((issue, idx) => (
              <div key={idx} className={`${styles.compatibilityItem} ${styles[`compat-${issue.level}`]}`}>
                <span className={styles.compatIcon}>
                  {issue.level === 'error' ? '✕' : issue.level === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {analysis.headerFolding && analysis.headerFolding.length > 0 && (
        <StatusSection title="Header Folding Detection" icon="📋">
          <div className={styles.foldingList}>
            {analysis.headerFolding.map((issue, idx) => (
              <div key={idx} className={styles.foldingItem}>
                <span className={styles.foldingIcon}>⚠</span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {analysis.compressionRecommendations && analysis.compressionRecommendations.length > 0 && (
        <StatusSection title="Compression Recommendations" icon="">
          <div className={styles.recommendationsList}>
            {analysis.compressionRecommendations.map((rec, idx) => (
              <div key={idx} className={styles.recommendationItem}>
                <span className={styles.recommendationIcon}>💡</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      <StatusSection title="Caching Analysis" icon="">
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
            <span className={styles.analysisLabel}>Exposed to Shared Cache:</span>
            <span className={styles.analysisValue}>
              {analysis.caching.exposedToSharedCache ? <HeaderBadge level="warning" text="Yes" /> : <HeaderBadge level="success" text="No" />}
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

      {analysis.responseAnomalies && analysis.responseAnomalies.length > 0 && (
        <StatusSection title="Response Anomalies" icon="⚠️">
          <div className={styles.anomaliesList}>
            {analysis.responseAnomalies.map((anomaly, idx) => (
              <div key={idx} className={`${styles.anomalyItem} ${styles[`anomaly-${anomaly.level}`]}`}>
                <span className={styles.anomalyIcon}>
                  {anomaly.level === 'error' ? '✕' : anomaly.level === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <span>{anomaly.message}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {cacheSimulation && (
        <StatusSection title="Cache Behavior Simulation" icon="🔄">
          <div className={styles.cacheSimGrid}>
            <div className={styles.cacheSimCard}>
              <div className={styles.cacheSimTitle}>Browser Cache</div>
              <div className={styles.cacheSimContent}>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>Cacheable:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.browser.cacheable ? (
                      <HeaderBadge level="success" text="Yes" />
                    ) : (
                      <HeaderBadge level="error" text="No" />
                    )}
                  </span>
                </div>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>TTL:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.browser.ttl > 0 ? `${cacheSimulation.browser.ttl}s` : 'No cache'}
                  </span>
                </div>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>Revalidation:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.browser.revalidationRequired ? (
                      <HeaderBadge level="warning" text="Required" />
                    ) : (
                      <HeaderBadge level="success" text="Not needed" />
                    )}
                  </span>
                </div>
                {cacheSimulation.browser.reason && (
                  <div className={styles.cacheSimReason}>{cacheSimulation.browser.reason}</div>
                )}
              </div>
            </div>

            <div className={styles.cacheSimCard}>
              <div className={styles.cacheSimTitle}>CDN Cache</div>
              <div className={styles.cacheSimContent}>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>Cacheable:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.cdn.cacheable ? (
                      <HeaderBadge level="success" text="Yes" />
                    ) : (
                      <HeaderBadge level="error" text="No" />
                    )}
                  </span>
                </div>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>TTL:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.cdn.ttl > 0 ? `${cacheSimulation.cdn.ttl}s` : 'No cache'}
                  </span>
                </div>
                <div className={styles.cacheSimItem}>
                  <span className={styles.simLabel}>Revalidation:</span>
                  <span className={styles.simValue}>
                    {cacheSimulation.cdn.revalidationRequired ? (
                      <HeaderBadge level="warning" text="Required" />
                    ) : (
                      <HeaderBadge level="success" text="Not needed" />
                    )}
                  </span>
                </div>
                {cacheSimulation.cdn.reason && (
                  <div className={styles.cacheSimReason}>{cacheSimulation.cdn.reason}</div>
                )}
              </div>
            </div>
          </div>
        </StatusSection>
      )}

      {transformations && (
        <StatusSection title="Header Transformations" icon="🔀">
          <div className={styles.transformationsGrid}>
            {[
              { label: 'Canonical Format', key: 'canonical' },
              { label: 'Lowercase (Node.js style)', key: 'lowercase' },
              { label: 'JSON Object', key: 'jsonObject' },
              { label: 'cURL Headers', key: 'curlHeaders' },
              { label: 'fetch() Init', key: 'fetchInit' },
            ].map(({ label, key }) => (
              <div key={key} className={styles.transformBlock}>
                <button
                  className={styles.transformToggle}
                  onClick={() => setExpandedTransforms(expandedTransforms === key ? null : key)}
                >
                  <span className={`${styles.expandChevron} ${expandedTransforms === key ? styles.expandChevronOpen : ''}`}>▶</span>
                  {label}
                </button>
                {expandedTransforms === key && (
                  <div className={styles.transformContent}>
                    <div className={toolOutputStyles.copyCard}>
                      <div className={toolOutputStyles.copyCardHeader}>
                        <span className={toolOutputStyles.copyCardLabel}>{label}</span>
                        <button
                          type="button"
                          className="copy-action"
                          onClick={() => {
                            navigator.clipboard.writeText(transformations[key])
                            // Show feedback
                          }}
                          title="Copy to clipboard"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <div className={`${toolOutputStyles.copyCardValue} ${styles.transformValue}`}>
                        {transformations[key]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      <div className={styles.exportButton}>
        <button onClick={() => setShowExport(!showExport)} className={styles.exportToggle}>
          <span className={`${styles.expandChevron} ${showExport ? styles.expandChevronOpen : ''}`}>▶</span>
          Export Headers
        </button>
        {showExport && <ExportModal headers={headers} />}
      </div>
    </div>
  )
}
