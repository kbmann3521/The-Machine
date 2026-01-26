import React from 'react'
import styles from '../styles/tool-description-content.module.css'

export default function ToolDescriptionContent({ tool }) {
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
        <h3 className={styles.sectionTitle}>Overview</h3>
        <div className={styles.sectionContent}>
          <p>{description.overview}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>How to Use</h3>
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

      {description.features && description.features.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Features</h3>
          <div className={styles.sectionContent}>
            <ul className={styles.featuresList}>
              {description.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {description.usecases && description.usecases.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Use Cases</h3>
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
          <h3 className={`${styles.sectionTitle} ${styles.warningTitle}`}>
            <span className={styles.warningIcon}>⚠</span>
            <span>Warnings</span>
          </h3>
          <div className={`${styles.sectionContent} ${styles.warningContent}`}>
            <ul className={styles.warningsList}>
              {description.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
