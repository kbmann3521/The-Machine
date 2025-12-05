import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function SingleIPConfig({ configState = {}, setConfigState }) {
  const handleToggle = (key) => {
    const newConfig = {
      ...configState,
      [key]: !configState[key],
    }
    if (typeof setConfigState === 'function') {
      setConfigState(newConfig)
    }
  }

  return (
    <div className={styles.configSection}>
      <h2 className={styles.configTitle}>Single IP Analysis</h2>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Options</label>
        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.validateIP !== false}
              onChange={() => handleToggle('validateIP')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>Validate IP</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.normalize !== false}
              onChange={() => handleToggle('normalize')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>Normalize / Canonicalize</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.ipToInteger !== false}
              onChange={() => handleToggle('ipToInteger')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>IP ↔ Integer</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.privatePublic !== false}
              onChange={() => handleToggle('privatePublic')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>Classify (public/private/reserved)</span>
          </label>
        </div>
      </div>
    </div>
  )
}
