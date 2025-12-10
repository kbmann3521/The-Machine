import { useState } from 'react'
import { FaCopy, FaCheck, FaShieldAlt, FaTag, FaDatabase, FaLightbulb } from 'react-icons/fa6'
import styles from '../styles/mime-type-lookup.module.css'

function CopyButton({ value, size = 'sm' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <button
      className={styles.copyButton}
      onClick={handleCopy}
      title="Copy to clipboard"
      aria-label="Copy"
    >
      {copied ? <FaCheck /> : <FaCopy />}
    </button>
  )
}

function CategoryBadge({ category }) {
  const categoryEmoji = {
    document: '📄',
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    archive: '📦',
    code: '💻',
    font: '🔤',
  }

  return (
    <span className={`${styles.badge} ${styles[`badge-${category}`]}`}>
      {categoryEmoji[category]} {category}
    </span>
  )
}

function MetadataRow({ label, value, copyable = false }) {
  if (Array.isArray(value)) {
    return (
      <div className={styles.metadataRow}>
        <span className={styles.metadataLabel}>{label}:</span>
        <div className={styles.metadataValues}>
          {value.map((v, idx) => (
            <span key={idx} className={styles.tag}>{v}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.metadataRow}>
      <span className={styles.metadataLabel}>{label}:</span>
      <span className={styles.metadataValue}>
        {value}
        {copyable && <CopyButton value={value} />}
      </span>
    </div>
  )
}

function ResultCard({ result }) {
  const [expandedSections, setExpandedSections] = useState({
    security: true,
    metadata: true,
    applications: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (result.error) {
    return (
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>❌</div>
        <div className={styles.errorText}>{result.error}</div>
      </div>
    )
  }

  if (!result.found) {
    return (
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundIcon}>❓</div>
        <div className={styles.notFoundText}>
          {result.type === 'extension' && `Extension "${result.input}" not found in database`}
          {result.type === 'mime' && `MIME type "${result.input}" not found in database`}
          {result.type === 'filename' && `No extension found in "${result.filename}"`}
        </div>

        {result.suggestions && result.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <div className={styles.suggestionsTitle}>🔍 Did you mean:</div>
            {result.suggestions.slice(0, 3).map((suggestion, idx) => (
              <div key={idx} className={styles.suggestion}>
                <span className={styles.suggestionExt}>.{suggestion.extension}</span>
                <span className={styles.suggestionMime}>{suggestion.mime}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Success case - rich result
  const isMimeInput = result.type === 'mime'

  return (
    <div className={styles.resultCard}>
      {/* Header */}
      <div className={styles.resultHeader}>
        <div className={styles.resultPrimary}>
          {isMimeInput ? (
            <>
              <div className={styles.resultLabel}>MIME Type</div>
              <div className={styles.resultValue}>{result.mime}</div>
            </>
          ) : (
            <>
              <div className={styles.resultLabel}>Extension</div>
              <div className={styles.resultValue}>.{result.extension}</div>
            </>
          )}
        </div>
        <div className={styles.resultSecondary}>
          {isMimeInput ? (
            <>
              <div className={styles.resultLabel}>Extensions</div>
              <div className={styles.resultValue}>{result.extensions.map(e => `.${e}`).join(', ')}</div>
            </>
          ) : (
            <>
              <div className={styles.resultLabel}>MIME Type</div>
              <div className={styles.resultValue}>{result.mime}</div>
            </>
          )}
        </div>
      </div>

      {/* Quick Copy */}
      <div className={styles.quickCopy}>
        <button className={styles.quickCopyButton}>
          {isMimeInput ? (
            <>
              <FaCopy /> Copy Extension
            </>
          ) : (
            <>
              <FaCopy /> Copy MIME Type
            </>
          )}
        </button>
      </div>

      {/* Category & Flags */}
      <div className={styles.flags}>
        {result.category && <CategoryBadge category={result.category} />}
        {result.binary ? (
          <span className={`${styles.badge} ${styles['badge-binary']}`}>📦 Binary</span>
        ) : (
          <span className={`${styles.badge} ${styles['badge-text']}`}>📄 Text</span>
        )}
        {result.compressible && (
          <span className={`${styles.badge} ${styles['badge-compressible']}`}>🗜️ Compressible</span>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Description */}
        {result.description && (
          <div className={styles.description}>
            <FaLightbulb className={styles.descriptionIcon} />
            <span>{result.description}</span>
          </div>
        )}

        {/* Metadata Grid */}
        <div className={styles.metadataGrid}>
          {result.charsets && result.charsets.length > 0 && (
            <MetadataRow label="Charsets" value={result.charsets} />
          )}
          {result.commonApplications && (
            <MetadataRow label="Common Apps" value={result.commonApplications} />
          )}
        </div>

        {/* Security Section */}
        {result.securityNotes && result.securityNotes.length > 0 && (
          <div className={styles.section}>
            <button
              className={styles.sectionToggle}
              onClick={() => toggleSection('security')}
            >
              <FaShieldAlt />
              Security & Safety
              <span className={expandedSections.security ? '▼' : '▶'}>
                {expandedSections.security ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.security && (
              <div className={styles.sectionContent}>
                <ul className={styles.securityNotes}>
                  {result.securityNotes.map((note, idx) => (
                    <li key={idx} className={styles.securityNote}>
                      <span className={styles.securityIcon}>⚠️</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Applications Section */}
        {result.commonApplications && result.commonApplications.length > 0 && (
          <div className={styles.section}>
            <button
              className={styles.sectionToggle}
              onClick={() => toggleSection('applications')}
            >
              <FaDatabase />
              Common Applications
              <span className={expandedSections.applications ? '▼' : '▶'}>
                {expandedSections.applications ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.applications && (
              <div className={styles.sectionContent}>
                <div className={styles.applications}>
                  {result.commonApplications.map((app, idx) => (
                    <span key={idx} className={styles.appTag}>{app}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BulkResultsTable({ results }) {
  return (
    <div className={styles.bulkContainer}>
      <div className={styles.bulkHeader}>
        Processed {results.length} items
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.bulkTable}>
          <thead>
            <tr>
              <th>Input</th>
              <th>Type</th>
              <th>MIME Type</th>
              <th>Extension(s)</th>
              <th>Category</th>
              <th>Binary</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr key={idx}>
                <td className={styles.tableInput}>{result.input}</td>
                <td>{result.type || '—'}</td>
                <td className={styles.tableMime}>
                  {result.mime || result.extension ? (
                    <>
                      {result.mime || `—`}
                      {(result.mime || result.extension) && <CopyButton value={result.mime || result.extension} />}
                    </>
                  ) : '—'}
                </td>
                <td>{result.extensions ? result.extensions.join(', ') : result.extension ? `.${result.extension}` : '—'}</td>
                <td>{result.category ? <CategoryBadge category={result.category} /> : '—'}</td>
                <td>{result.binary !== undefined ? (result.binary ? '📦' : '📄') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MIMETypeLookupOutput({ result }) {
  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          Enter an extension, MIME type, filename, or Content-Type header to begin
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {result.mode === 'bulk' && result.results ? (
        <BulkResultsTable results={result.results} />
      ) : (
        <ResultCard result={result} />
      )}
    </div>
  )
}
