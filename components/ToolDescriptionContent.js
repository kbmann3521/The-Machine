import React from 'react'
import Link from 'next/link'
import styles from '../styles/tool-description-content.module.css'

export default function ToolDescriptionContent({ tool, isStandaloneMode = false }) {
  if (!tool) {
    return null
  }

  const description = tool.detailedDescription || {
    overview: 'Tool information coming soon.',
    howtouse: 'Instructions will be available soon.',
    usecases: [],
    features: [],
  }

  // Helper function to render text with paragraph breaks
  const renderParagraphs = (text) => {
    if (!text) return null
    if (Array.isArray(text)) {
      return text.map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ))
    }
    return <p>{text}</p>
  }

  return (
    <div className={styles.descriptionContent}>
      {/* Tool Title Header - Only on standalone pages */}
      {isStandaloneMode && (
        <div className={styles.toolHeader}>
          <h1 className={styles.toolName}>{tool.name}</h1>
        </div>
      )}

      {/* Tool Introduction */}
      {description.overview && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tool Introduction</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.overview)}
          </div>
        </section>
      )}

      {/* What This Tool Does */}
      {description.whatToolDoes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What This Tool Does</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.whatToolDoes)}
          </div>
        </section>
      )}

      {/* Why This Tool Exists */}
      {description.whyExists && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why This Tool Exists</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.whyExists)}
          </div>
        </section>
      )}

      {/* Common Use Cases */}
      {description.commonUseCases && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Common Use Cases</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.commonUseCases)}
          </div>
        </section>
      )}

      {/* Deterministic and Predictable Behavior */}
      {description.deterministic && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Deterministic and Predictable Behavior</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.deterministic)}
          </div>
        </section>
      )}

      {/* Privacy and Data Safety */}
      {description.privacy && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy and Data Safety</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.privacy)}
          </div>
        </section>
      )}

      {/* Free to Use */}
      {description.freeToUse && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Free to Use</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.freeToUse)}
          </div>
        </section>
      )}

      {/* Input and Output Expectations */}
      {description.inputOutput && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Input and Output Expectations</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.inputOutput)}
          </div>
        </section>
      )}

      {/* Who This Tool Is For */}
      {description.whoFor && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Who This Tool Is For</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.whoFor)}
          </div>
        </section>
      )}

      {/* Reliability and Trust */}
      {description.reliability && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reliability and Trust</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.reliability)}
          </div>
        </section>
      )}

      {/* Frequently Asked Questions */}
      {description.faq && description.faq.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.sectionContent}>
            {description.faq.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <strong>{item.question}</strong>
                <p style={{ marginTop: '8px' }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Examples */}
      {description.examples && description.examples.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <div className={styles.sectionContent}>
            <ul className={styles.usecasesList}>
              {description.examples.map((example, idx) => (
                <li key={idx} style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: 'var(--color-background-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--color-border)' }}>
                  {example}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Final Notes */}
      {description.finalNotes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Final Notes</h2>
          <div className={styles.sectionContent}>
            {renderParagraphs(description.finalNotes)}
          </div>
        </section>
      )}

      {/* Legacy support for old format */}
      {description.howtouse && !description.whatToolDoes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How to Use</h2>
          <div className={styles.sectionContent}>
            <ol className={styles.instructionsList}>
              {Array.isArray(description.howtouse) ? (
                description.howtouse.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))
              ) : (
                <li>{description.howtouse}</li>
              )}
            </ol>
          </div>
        </section>
      )}

      {description.features && description.features.length > 0 && !description.whatToolDoes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <div className={styles.sectionContent}>
            <ul className={styles.featuresList}>
              {description.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {description.usecases && description.usecases.length > 0 && !description.whatToolDoes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Use Cases</h2>
          <div className={styles.sectionContent}>
            <ul className={styles.usecasesList}>
              {description.usecases.map((usecase, idx) => (
                <li key={idx}>{usecase}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {description.warnings && description.warnings.length > 0 && (
        <section className={styles.warningSection}>
          <h2 className={`${styles.sectionTitle} ${styles.warningTitle}`}>
            <span className={styles.warningIcon}>⚠</span>
            <span>Warnings</span>
          </h2>
          <div className={`${styles.sectionContent} ${styles.warningContent}`}>
            <ul className={styles.warningsList}>
              {description.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Link to Home Page or Standalone Page */}
      {(() => {
        const standalonePages = [
          'ascii-unicode-converter',
          'base-converter',
          'base64-converter',
          'caesar-cipher',
          'checksum-calculator',
          'color-converter',
          'cron-tester',
          'csv-json-converter',
          'css-formatter',
          'email-validator',
          'encoder-decoder',
          'file-size-converter',
          'http-header-parser',
          'http-status-lookup',
          'image-toolkit',
          'ip-address-toolkit',
          'js-formatter',
          'json-formatter',
          'jwt-decoder',
          'math-evaluator',
          'mime-type-lookup',
          'number-formatter',
          'qr-code-generator',
          'regex-tester',
          'sql-formatter',
          'svg-optimizer',
          'text-toolkit',
          'time-normalizer',
          'unit-converter',
          'url-toolkit',
          'uuid-validator',
          'web-playground',
          'xml-formatter',
          'yaml-formatter'
        ]
        const toolId = tool.toolId || tool.id
        const hasStandalonePage = standalonePages.includes(toolId)

        if (isStandaloneMode) {
          return (
            <section className={styles.explorationSection}>
              <p>
                Interested in exploring other tools? Check out the <Link href="/" className={styles.explorationLink}>main page</Link> to discover more utilities.
              </p>
            </section>
          )
        } else if (hasStandalonePage) {
          return (
            <section className={styles.standalonePageSection}>
              <p>
                <a href={`/${toolId}`} className={styles.standalonePageLink}>
                  Open {tool.name} in dedicated page →
                </a>
              </p>
            </section>
          )
        }
        return null
      })()}
    </div>
  )
}
