import React from 'react'
import { FaLock } from 'react-icons/fa6'
import styles from '../../../styles/ip-toolkit.module.css'

export default function SingleIPConfig({ configState, setConfigState }) {
  const handleChange = (key, value) => {
    setConfigState(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleCheckboxChange = (key) => {
    setConfigState(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className={styles.configSection}>
      <h2 className={styles.configTitle}>Single IP Analysis</h2>

      {/* IP Version Select */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>IP Version</label>
        <select
          className={styles.select}
          value={configState.ipVersion || 'auto'}
          onChange={e => handleChange('ipVersion', e.target.value)}
        >
          <option value="auto">Auto Detect</option>
          <option value="ipv4">IPv4</option>
          <option value="ipv6">IPv6</option>
        </select>
      </div>

      {/* Data Level Select */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Data Level</label>
        <select
          className={styles.select}
          value={configState.dataLevel || 'basic'}
          onChange={e => handleChange('dataLevel', e.target.value)}
        >
          <option value="basic">Basic</option>
          <option value="extended">Extended</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Operations Checkboxes */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Operations</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.validateIP !== false}
              onChange={() => handleCheckboxChange('validateIP')}
              className={styles.checkbox}
            />
            <span>Validate IP</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.normalize || false}
              onChange={() => handleCheckboxChange('normalize')}
              className={styles.checkbox}
            />
            <span>Normalize / Canonicalize</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.ipToInteger || false}
              onChange={() => handleCheckboxChange('ipToInteger')}
              className={styles.checkbox}
            />
            <span>IP ↔ Integer</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.privatePublic || false}
              onChange={() => handleCheckboxChange('privatePublic')}
              className={styles.checkbox}
            />
            <span>Private/Public Check</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.asn || false}
              onChange={() => handleCheckboxChange('asn')}
              className={styles.checkbox}
            />
            <span>ASN (Lite)</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.geo || false}
              onChange={() => handleCheckboxChange('geo')}
              className={styles.checkbox}
            />
            <span>Geo (Country)</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.reverseDns || false}
              onChange={() => handleCheckboxChange('reverseDns')}
              className={styles.checkbox}
            />
            <span>Reverse DNS (PTR)</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.networkSafety || false}
              onChange={() => handleCheckboxChange('networkSafety')}
              className={styles.checkbox}
            />
            <span>Network Safety Score</span>
          </label>
        </div>

        {/* Pro Options Divider */}
        <div className={styles.proOptionsDivider}>PRO-ONLY</div>

        <div className={styles.checkboxGroup}>
          <label className={`${styles.checkboxLabel} ${styles.proOption}`}>
            <input
              type="checkbox"
              disabled
              className={styles.checkbox}
            />
            <span>Reputation Check</span>
            <FaLock className={styles.proLock} />
          </label>

          <label className={`${styles.checkboxLabel} ${styles.proOption}`}>
            <input
              type="checkbox"
              disabled
              className={styles.checkbox}
            />
            <span>Threat Intel (Lite)</span>
            <FaLock className={styles.proLock} />
          </label>

          <label className={`${styles.checkboxLabel} ${styles.proOption}`}>
            <input
              type="checkbox"
              disabled
              className={styles.checkbox}
            />
            <span>Multi-source Cross-check</span>
            <FaLock className={styles.proLock} />
          </label>
        </div>
      </div>

      {/* Output Style Radio */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Output Style</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputStyle"
              value="cards"
              checked={configState.outputStyle !== 'json' && configState.outputStyle !== 'both'}
              onChange={() => handleChange('outputStyle', 'cards')}
              className={styles.radio}
            />
            <span>Friendly Cards</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputStyle"
              value="json"
              checked={configState.outputStyle === 'json'}
              onChange={() => handleChange('outputStyle', 'json')}
              className={styles.radio}
            />
            <span>Raw JSON</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputStyle"
              value="both"
              checked={configState.outputStyle === 'both'}
              onChange={() => handleChange('outputStyle', 'both')}
              className={styles.radio}
            />
            <span>Both</span>
          </label>
        </div>
      </div>

      {/* Run Button */}
      <button className={styles.runButton}>
        Run Analysis
      </button>
    </div>
  )
}
