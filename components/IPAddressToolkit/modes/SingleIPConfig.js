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
        <label className={styles.configLabel}>Validation & Normalization</label>
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
              checked={configState.diagnostics !== false}
              onChange={() => handleToggle('diagnostics')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>Input Diagnostics</span>
          </label>
        </div>
      </div>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Conversions</label>
        <div className={styles.toggleGroup}>
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
              checked={configState.ipToHex !== false}
              onChange={() => handleToggle('ipToHex')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>IP ↔ Hexadecimal</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.ipToBinary !== false}
              onChange={() => handleToggle('ipToBinary')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>IP ↔ Binary</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.ptrRecord !== false}
              onChange={() => handleToggle('ptrRecord')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>PTR (Reverse DNS)</span>
          </label>
        </div>
      </div>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Classification & Analysis</label>
        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.classification !== false}
              onChange={() => handleToggle('classification')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>RFC Classification</span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={configState.privatePublic !== false}
              onChange={() => handleToggle('privatePublic')}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch}></span>
            <span className={styles.toggleText}>Public/Private Detection</span>
          </label>
        </div>
      </div>
    </div>
  )
}
