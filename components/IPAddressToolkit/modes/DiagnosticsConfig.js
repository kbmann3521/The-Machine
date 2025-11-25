import React from 'react'
import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function DiagnosticsConfig({ configState, setConfigState }) {
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
      <h2 className={styles.configTitle}>Diagnostics</h2>

      {/* Target IP Input */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Target IP</label>
        <input
          type="text"
          placeholder="e.g., 8.8.8.8"
          value={configState.targetIp || ''}
          onChange={e => handleChange('targetIp', e.target.value)}
          className={styles.input}
        />
      </div>

      {/* Regions Checkboxes */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Regions</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.autoRegion !== false}
              onChange={() => handleCheckboxChange('autoRegion')}
              className={styles.checkbox}
            />
            <span>Auto</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.usEast || false}
              onChange={() => handleCheckboxChange('usEast')}
              className={styles.checkbox}
            />
            <span>US-East</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.usWest || false}
              onChange={() => handleCheckboxChange('usWest')}
              className={styles.checkbox}
            />
            <span>US-West</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.euWest || false}
              onChange={() => handleCheckboxChange('euWest')}
              className={styles.checkbox}
            />
            <span>EU-West</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.asiaPacific || false}
              onChange={() => handleCheckboxChange('asiaPacific')}
              className={styles.checkbox}
            />
            <span>Asia</span>
          </label>
        </div>
      </div>

      {/* Operations Section */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Operations</label>

        {/* Ping */}
        <div className={styles.operationBlock}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.enablePing !== false}
              onChange={() => handleCheckboxChange('enablePing')}
              className={styles.checkbox}
            />
            <span>Ping</span>
          </label>
          {configState.enablePing !== false && (
            <div className={styles.operationOptions}>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={configState.pingCount || 4}
                  onChange={e => handleChange('pingCount', parseInt(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>Timeout (ms)</label>
                <input
                  type="number"
                  min="100"
                  value={configState.pingTimeout || 2000}
                  onChange={e => handleChange('pingTimeout', parseInt(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Traceroute */}
        <div className={styles.operationBlock}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.enableTraceroute || false}
              onChange={() => handleCheckboxChange('enableTraceroute')}
              className={styles.checkbox}
            />
            <span>Traceroute</span>
          </label>
          {configState.enableTraceroute && (
            <div className={styles.operationOptions}>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>Max Hops</label>
                <input
                  type="number"
                  min="1"
                  max="255"
                  value={configState.maxHops || 30}
                  onChange={e => handleChange('maxHops', parseInt(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Reverse DNS */}
        <div className={styles.operationBlock}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.enableReverseDns || false}
              onChange={() => handleCheckboxChange('enableReverseDns')}
              className={styles.checkbox}
            />
            <span>Reverse DNS</span>
          </label>
        </div>

        {/* Reputation Check */}
        <div className={styles.operationBlock}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.enableReputation || false}
              onChange={() => handleCheckboxChange('enableReputation')}
              className={styles.checkbox}
            />
            <span>Reputation Check</span>
          </label>
        </div>

        {/* ASN Full Details */}
        <div className={styles.operationBlock}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.enableAsnFull || false}
              onChange={() => handleCheckboxChange('enableAsnFull')}
              className={styles.checkbox}
            />
            <span>ASN Full Details</span>
          </label>
        </div>
      </div>

      {/* Run Button */}
      <button className={styles.runButton}>
        Run Diagnostics
      </button>
    </div>
  )
}
