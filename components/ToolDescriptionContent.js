import React, { useState } from 'react'
import styles from '../styles/tool-description-content.module.css'

export default function ToolDescriptionContent({ tool }) {
  const [expandedSection, setExpandedSection] = useState('overview')

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!tool) {
    return null
  }

  const description = tool.detailedDescription || {
    overview: 'Tool information coming soon.',
    howtouse: 'Instructions will be available soon.',
    usecases: [],
    features: [],
  }

  return (
    <div className={styles.descriptionContent}>
      <section className={styles.section}>
        <button
          className={`${styles.sectionHeader} ${expandedSection === 'overview' ? styles.expanded : ''}`}
          onClick={() => toggleSection('overview')}
        >
          <span className={styles.sectionTitle}>Overview</span>
          <span className={styles.toggleIcon}>›</span>
        </button>
        {expandedSection === 'overview' && (
          <div className={styles.sectionContent}>
            <p>{description.overview}</p>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <button
          className={`${styles.sectionHeader} ${expandedSection === 'howtouse' ? styles.expanded : ''}`}
          onClick={() => toggleSection('howtouse')}
        >
          <span className={styles.sectionTitle}>How to Use</span>
          <span className={styles.toggleIcon}>›</span>
        </button>
        {expandedSection === 'howtouse' && (
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
        )}
      </section>

      {description.features && description.features.length > 0 && (
        <section className={styles.section}>
          <button
            className={`${styles.sectionHeader} ${expandedSection === 'features' ? styles.expanded : ''}`}
            onClick={() => toggleSection('features')}
          >
            <span className={styles.sectionTitle}>Features</span>
            <span className={styles.toggleIcon}>›</span>
          </button>
          {expandedSection === 'features' && (
            <div className={styles.sectionContent}>
              <ul className={styles.featuresList}>
                {description.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {description.usecases && description.usecases.length > 0 && (
        <section className={styles.section}>
          <button
            className={`${styles.sectionHeader} ${expandedSection === 'usecases' ? styles.expanded : ''}`}
            onClick={() => toggleSection('usecases')}
          >
            <span className={styles.sectionTitle}>Use Cases</span>
            <span className={styles.toggleIcon}>›</span>
          </button>
          {expandedSection === 'usecases' && (
            <div className={styles.sectionContent}>
              <ul className={styles.usecasesList}>
                {description.usecases.map((usecase, idx) => (
                  <li key={idx}>{usecase}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {description.warnings && description.warnings.length > 0 && (
        <section className={styles.warningSection}>
          <button
            className={`${styles.sectionHeader} ${styles.warningHeader} ${expandedSection === 'warnings' ? styles.expanded : ''}`}
            onClick={() => toggleSection('warnings')}
          >
            <span className={styles.warningIcon}>⚠</span>
            <span className={styles.sectionTitle}>Warnings</span>
            <span className={styles.toggleIcon}>›</span>
          </button>
          {expandedSection === 'warnings' && (
            <div className={`${styles.sectionContent} ${styles.warningContent}`}>
              <ul className={styles.warningsList}>
                {description.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
