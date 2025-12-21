import { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/mime-type-lookup.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value }) {
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

  return (
    <div className={toolOutputStyles.copyCard}>
      <div className={toolOutputStyles.copyCardHeader}>
        <span className={toolOutputStyles.copyCardLabel}>{label}</span>
        <button
          type="button"
          className="copy-action"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {isCopied ? '✓' : <FaCopy />}
        </button>
      </div>
      <div className={toolOutputStyles.copyCardValue}>{value}</div>
    </div>
  )
}

function CategoryBadge({ category }) {
  const categoryColors = {
    document: '#f5a623',
    image: '#e91e63',
    video: '#f44336',
    audio: '#9c27b0',
    archive: '#4caf50',
    code: '#2196f3',
    font: '#673ab7',
  }

  return (
    <span className={`${styles.badge} ${styles[`badge-${category}`]}`}>
      {category}
    </span>
  )
}

function SectionTitle({ children }) {
  return <div className={styles.sectionTitle}>{children}</div>
}

function SectionContent({ children }) {
  return <div className={styles.sectionContent}>{children}</div>
}

function ResultCard({ result }) {
  if (result.error) {
    return (
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>Error</div>
        <div className={styles.errorText}>{result.error}</div>
      </div>
    )
  }

  if (!result.found) {
    return (
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundTitle}>
          {result.type === 'extension' && `Extension "${result.input}" not found`}
          {result.type === 'mime' && `MIME type "${result.input}" not found`}
          {result.type === 'filename' && `No extension found in "${result.filename}"`}
        </div>

        {result.suggestions && result.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <div className={styles.suggestionsTitle}>Did you mean:</div>
            {result.suggestions.slice(0, 5).map((suggestion, idx) => (
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

  const isMimeInput = result.type === 'mime'

  return (
    <div className={styles.resultContainer}>
      <div className={styles.headerSection}>
        <div className={styles.headerPrimary}>
          {isMimeInput ? (
            <>
              <div className={styles.headerLabel}>MIME Type</div>
              <div className={styles.headerValue}>{result.mime}</div>
            </>
          ) : (
            <>
              <div className={styles.headerLabel}>Extension</div>
              <div className={styles.headerValue}>.{result.extension}</div>
            </>
          )}
        </div>
        <div className={styles.headerSecondary}>
          {isMimeInput ? (
            <>
              <div className={styles.headerLabel}>Extensions</div>
              <div className={styles.headerValue}>{result.extensions.map(e => `.${e}`).join(', ')}</div>
            </>
          ) : (
            <>
              <div className={styles.headerLabel}>MIME Type</div>
              <div className={styles.headerValue}>{result.mime}</div>
            </>
          )}
        </div>
      </div>

      <div className={styles.copySection}>
        <CopyCard
          label={isMimeInput ? 'Extension' : 'MIME Type'}
          value={isMimeInput ? result.extensions[0] : result.mime}
        />
      </div>

      <div className={styles.badgesSection}>
        {result.category && <CategoryBadge category={result.category} />}
        {result.binary ? (
          <span className={`${styles.badge} ${styles['badge-binary']}`}>Binary</span>
        ) : (
          <span className={`${styles.badge} ${styles['badge-text']}`}>Text</span>
        )}
        {result.compressible && (
          <span className={`${styles.badge} ${styles['badge-compressible']}`}>Compressible</span>
        )}
      </div>

      {result.description && (
        <div className={styles.descriptionSection}>
          <SectionTitle>Description</SectionTitle>
          <SectionContent>
            <p className={styles.descriptionText}>{result.description}</p>
          </SectionContent>
        </div>
      )}

      {(result.charsets?.length > 0 || result.commonApplications?.length > 0) && (
        <div className={styles.infoSection}>
          <SectionTitle>Information</SectionTitle>
          <SectionContent>
            {result.charsets && result.charsets.length > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Character Sets:</span>
                <div className={styles.infoValues}>
                  {result.charsets.map((charset, idx) => (
                    <span key={idx} className={styles.infoTag}>{charset}</span>
                  ))}
                </div>
              </div>
            )}
            {result.commonApplications && result.commonApplications.length > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Common Applications:</span>
                <div className={styles.infoValues}>
                  {result.commonApplications.map((app, idx) => (
                    <span key={idx} className={styles.infoTag}>{app}</span>
                  ))}
                </div>
              </div>
            )}
          </SectionContent>
        </div>
      )}

      {result.securityNotes && result.securityNotes.length > 0 && (
        <div className={styles.securitySection}>
          <SectionTitle>Security & Safety</SectionTitle>
          <SectionContent>
            <ul className={styles.securityList}>
              {result.securityNotes.map((note, idx) => (
                <li key={idx} className={styles.securityItem}>{note}</li>
              ))}
            </ul>
          </SectionContent>
        </div>
      )}
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
                <td className={styles.tableMime}>{result.mime || '—'}</td>
                <td>{result.extensions ? result.extensions.join(', ') : result.extension ? `.${result.extension}` : '—'}</td>
                <td>{result.category || '—'}</td>
                <td>{result.binary !== undefined ? (result.binary ? 'Binary' : 'Text') : '—'}</td>
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
