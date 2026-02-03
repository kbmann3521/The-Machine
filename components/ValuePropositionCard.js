import React from 'react'
import { FaShieldHalved, FaLock, FaGaugeHigh, FaUsers, FaChevronDown, FaCopy } from 'react-icons/fa6'
import styles from '../styles/value-proposition-card.module.css'
import outputTabsStyles from '../styles/output-tabs.module.css'

export default function ValuePropositionCard() {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>Free Online Tools</h1>

        <div className={styles.header}>
          <h2 className={styles.title}>How to Use Tools</h2>
        </div>

        <div className={styles.section}>
          <div className={styles.tipsContainer}>
            <div className={styles.tip}>
              <h3 className={styles.tipTitle}>
                Select a Tool & Enter Your Data
              </h3>
              <p className={styles.tipDesc}>
                Choose any tool from the sidebar on the left, then paste or type your data into the input field. You'll see instant, live output results in real-time. Just start typing—the tool does the rest automatically.
              </p>
            </div>

            <div className={styles.tip}>
              <h3 className={styles.tipTitle}>
                <span className={outputTabsStyles.settingsIcon} style={{ margin: 0 }}>⚙</span>
                Configure Options
              </h3>
              <p className={styles.tipDesc}>
                Click the <strong>gear icon</strong> in the top toolbar to open the options modal. Here you can customize tool settings like separators, formatting styles, case types, and more. Options apply instantly and persist for your session.
              </p>
            </div>

            <div className={styles.tip}>
              <h3 className={styles.tipTitle}>
                <FaChevronDown size={12} /> Use the Chevron Dropdown
              </h3>
              <p className={styles.tipDesc}>
                Click the <strong>chevron icon <FaChevronDown size={12} style={{display: 'inline', marginLeft: '4px', marginRight: '4px'}} /></strong> next to the INPUT tab to open a dropdown menu with quick action results. When you select a result, it automatically copies that value back to your input field using the <strong>"Replace with output"</strong> button. This lets you chain operations together—process your text, grab a result, modify it again, and process again.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.header}>
          <h2 className={styles.title}>How We Build Tools</h2>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaGaugeHigh />
            </div>
            <div>
              <h3 className={styles.featureName}>100% Deterministic</h3>
              <p className={styles.featureDesc}>Same input always produces the same output</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaLock />
            </div>
            <div>
              <h3 className={styles.featureName}>100% Private</h3>
              <p className={styles.featureDesc}>No sensitive data ever touches our servers</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaShieldHalved />
            </div>
            <div>
              <h3 className={styles.featureName}>100% Predictable</h3>
              <p className={styles.featureDesc}>Results you can trust, every single time</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaUsers />
            </div>
            <div>
              <h3 className={styles.featureName}>Built for Everyone</h3>
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
