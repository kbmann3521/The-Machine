import React from 'react'
import { FaShieldHalved, FaLock, FaGaugeHigh, FaUsers } from 'react-icons/fa6'
import styles from '../styles/value-proposition-card.module.css'

export default function ValuePropositionCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>How We Build Tools</h3>
      </div>

      <div className={styles.content}>
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaGaugeHigh />
            </div>
            <div>
              <h4 className={styles.featureName}>100% Deterministic</h4>
              <p className={styles.featureDesc}>Same input always produces the same output</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaLock />
            </div>
            <div>
              <h4 className={styles.featureName}>100% Private</h4>
              <p className={styles.featureDesc}>No sensitive data ever touches our servers</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaShieldHalved />
            </div>
            <div>
              <h4 className={styles.featureName}>100% Predictable</h4>
              <p className={styles.featureDesc}>Results you can trust, every single time</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaUsers />
            </div>
            <div>
              <h4 className={styles.featureName}>Built for Everyone</h4>
              <p className={styles.featureDesc}>Simple for everyday users, powerful for developers and engineers</p>
            </div>
          </div>
        </div>

        <div className={styles.tagline}>
          <p className={styles.taglineText}>
            <strong>Accurate. Private. Predictable.</strong>
          </p>
          <p className={styles.taglineSubtext}>
            That's not a slogan — it's an engineering decision.
          </p>
        </div>
      </div>
    </div>
  )
}
