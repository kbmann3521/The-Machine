import React, { useState } from 'react'
import styles from '../styles/regex-tester.module.css'

function WarningsPanel({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const errorWarnings = warnings.filter(w => w.severity === 'error');
  const regularWarnings = warnings.filter(w => w.severity === 'warning');
  const infoWarnings = warnings.filter(w => w.severity === 'info');

  return (
    <div className={styles.warningsPanelContainer}>
      {errorWarnings.length > 0 && (
        <div className={styles.warningSection}>
          {errorWarnings.map((warning, idx) => (
            <div key={`error-${idx}`} className={`${styles.warningItem} ${styles.warningErrorItem}`}>
              <span className={styles.warningItemIcon}>❌</span>
              <div>
                <div className={styles.warningItemMessage}>{warning.message}</div>
                <div className={styles.warningItemSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {regularWarnings.length > 0 && (
        <div className={styles.warningSection}>
          {regularWarnings.map((warning, idx) => (
            <div key={`warning-${idx}`} className={`${styles.warningItem} ${styles.warningRegularItem}`}>
              <span className={styles.warningItemIcon}>⚠️</span>
              <div>
                <div className={styles.warningItemMessage}>{warning.message}</div>
                <div className={styles.warningItemSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {infoWarnings.length > 0 && (
        <div className={styles.warningSection}>
          {infoWarnings.map((warning, idx) => (
            <div key={`info-${idx}`} className={`${styles.warningItem} ${styles.warningInfoItem}`}>
              <span className={styles.warningItemIcon}>ℹ️</span>
              <div>
                <div className={styles.warningItemMessage}>{warning.message}</div>
                <div className={styles.warningItemSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightedText({ text, matches }) {
  if (!matches || matches.length === 0) {
    return <div className={styles.highlightedText}>{text}</div>
  }

  const segments = [];
  let lastIndex = 0;

  matches.forEach((match, idx) => {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        key: `text-${lastIndex}`,
      });
    }

    // Add highlighted match
    segments.push({
      type: 'match',
      content: match.match,
      key: `match-${idx}`,
      matchIndex: idx,
    });

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: `text-${lastIndex}`,
    });
  }

  return (
    <div className={styles.highlightedText}>
      {segments.map((seg) =>
        seg.type === 'match' ? (
          <span key={seg.key} className={styles.matchHighlight} title={`Match ${seg.matchIndex + 1}`}>
            {seg.content}
          </span>
        ) : (
          <span key={seg.key}>{seg.content}</span>
        )
      )}
    </div>
  );
}

function MatchDetailsTable({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No matches found</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.matchTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Match</th>
            <th>Index</th>
            <th>Length</th>
            {matches.some((m) => m.groups.length > 0) && <th>Groups</th>}
          </tr>
        </thead>
        <tbody>
          {matches.map((match, idx) => (
            <tr key={idx} className={styles.matchRow}>
              <td>{idx + 1}</td>
              <td className={styles.matchCell}>
                <code>{match.match}</code>
              </td>
              <td>{match.index}</td>
              <td>{match.length}</td>
              {matches.some((m) => m.groups.length > 0) && (
                <td className={styles.groupsCell}>
                  {match.groups.length > 0 ? (
                    <div className={styles.groupsList}>
                      {match.groups.map((group, gIdx) => (
                        <div key={gIdx} className={styles.groupItem}>
                          <span className={styles.groupNumber}>G{group.number}:</span>
                          <code>{group.value || '—'}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReplacementPreview({ originalText, replacementResult }) {
  if (!replacementResult) {
    return (
      <div className={styles.emptyState}>
        <p>Enter a replacement pattern to see preview</p>
      </div>
    );
  }

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewSection}>
        <h4 className={styles.previewLabel}>Original</h4>
        <div className={styles.previewBox}>{originalText}</div>
      </div>
      <div className={styles.previewSection}>
        <h4 className={styles.previewLabel}>After Replacement</h4>
        <div className={styles.previewBox}>{replacementResult}</div>
      </div>
    </div>
  );
}

function RegexExplanation({ pattern, explanation }) {
  if (!explanation || explanation.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Unable to generate explanation</p>
      </div>
    );
  }

  return (
    <div className={styles.explanationContainer}>
      <div className={styles.patternDisplay}>
        <code className={styles.patternCode}>/{pattern}/</code>
      </div>
      <div className={styles.explanationList}>
        {explanation.map((item, idx) => (
          <div key={idx} className={styles.explanationItem}>
            <span className={styles.bullet}>•</span>
            <span className={styles.explanationText}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIAnalysisSection({ patternName, patternDescription, pattern, matches, inputText }) {
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const matchedSubstrings = matches.map(m => m.match)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const analyzeUrl = `${baseUrl}/api/test-regex-patterns`

      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          patternName,
          patternDescription,
          pattern,
          matchedSubstrings,
          inputText,
        }),
      })

      if (response.ok) {
        const { analysis: analysisText } = await response.json()
        setAnalysis(analysisText)
        setShowAnalysis(true)
      }
    } catch (error) {
      console.error('Error analyzing matches:', error)
      setAnalysis('Error analyzing matches. Please try again.')
      setShowAnalysis(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyAnalysis = () => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = analysis
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className={styles.analysisSection}>
      <button
        className={styles.analyzeButton}
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? '🔄 Analyzing...' : '💭 Analyze Matches'}
      </button>

      {showAnalysis && analysis && (
        <div className={styles.analysisContent}>
          <div className={styles.analysisHeader}>
            <button
              className={styles.copyButton}
              onClick={handleCopyAnalysis}
              title="Copy analysis to clipboard"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <div className={styles.analysisText}>{analysis}</div>
        </div>
      )}
    </div>
  )
}

export default function RegexTesterOutput({ result, inputText, patternName, patternDescription }) {
  const [activeTab, setActiveTab] = useState('matches');

  if (!result) {
    return null;
  }

  // Error state
  if (result.error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>❌</div>
          <div className={styles.errorMessage}>{result.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Warnings panel */}
      {result.warnings && result.warnings.length > 0 && (
        <WarningsPanel warnings={result.warnings} />
      )}

      {/* Match count summary */}
      <div className={styles.summary}>
        <span className={styles.matchCount}>
          {result.matchCount === 0 ? 'No matches' : `${result.matchCount} match${result.matchCount !== 1 ? 'es' : ''} found`}
        </span>
      </div>

      {/* Highlighted text preview */}
      {inputText && (
        <div className={styles.previewSection}>
          <h3 className={styles.sectionTitle}>Text Preview (Highlighted)</h3>
          <HighlightedText text={inputText} matches={result.matches} />
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button
            className={`${styles.tab} ${activeTab === 'matches' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
          {result.replacementResult && (
            <button
              className={`${styles.tab} ${activeTab === 'replacement' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('replacement')}
            >
              Replacement
            </button>
          )}
          <button
            className={`${styles.tab} ${activeTab === 'explain' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('explain')}
          >
            Explain
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'matches' && <MatchDetailsTable matches={result.matches} />}
          {activeTab === 'replacement' && (
            <ReplacementPreview originalText={inputText} replacementResult={result.replacementResult} />
          )}
          {activeTab === 'explain' && (
            <RegexExplanation pattern={result.pattern} explanation={result.explanation} />
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      {result.matches && (
        <AIAnalysisSection
          patternName={patternName}
          patternDescription={patternDescription}
          pattern={result.pattern}
          matches={result.matches}
          inputText={inputText}
        />
      )}
    </div>
  );
}
