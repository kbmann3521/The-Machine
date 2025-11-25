import React from 'react'
import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function CIDRConfig({ configState, setConfigState }) {
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
      <h2 className={styles.configTitle}>CIDR & Subnet</h2>

      {/* Base Network Input */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Base Network</label>
        <input
          type="text"
          placeholder="e.g., 192.168.0.0/16"
          value={configState.baseNetwork || ''}
          onChange={e => handleChange('baseNetwork', e.target.value)}
          className={styles.input}
        />
      </div>

      {/* Subnetting Mode Radio */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Subnetting Mode</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="subnetMode"
              value="by-count"
              checked={configState.subnetMode !== 'by-hosts'}
              onChange={() => handleChange('subnetMode', 'by-count')}
              className={styles.radio}
            />
            <span>Split by number of subnets</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="subnetMode"
              value="by-hosts"
              checked={configState.subnetMode === 'by-hosts'}
              onChange={() => handleChange('subnetMode', 'by-hosts')}
              className={styles.radio}
            />
            <span>Split by hosts per subnet</span>
          </label>
        </div>
      </div>

      {/* Dynamic Input Based on Mode */}
      {configState.subnetMode !== 'by-hosts' && (
        <div className={styles.configGroup}>
          <label className={styles.configLabel}>Number of Subnets</label>
          <input
            type="number"
            min="1"
            value={configState.numSubnets || 8}
            onChange={e => handleChange('numSubnets', parseInt(e.target.value))}
            className={styles.input}
          />
        </div>
      )}

      {configState.subnetMode === 'by-hosts' && (
        <div className={styles.configGroup}>
          <label className={styles.configLabel}>Hosts Per Subnet</label>
          <input
            type="number"
            min="1"
            value={configState.hostsPerSubnet || 256}
            onChange={e => handleChange('hostsPerSubnet', parseInt(e.target.value))}
            className={styles.input}
          />
        </div>
      )}

      {/* Options Checkboxes */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Options</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.showVisualizer !== false}
              onChange={() => handleCheckboxChange('showVisualizer')}
              className={styles.checkbox}
            />
            <span>Show CIDR Visualizer</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.showOverlapChecker || false}
              onChange={() => handleCheckboxChange('showOverlapChecker')}
              className={styles.checkbox}
            />
            <span>Show Overlap Checker</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.exportJson || false}
              onChange={() => handleCheckboxChange('exportJson')}
              className={styles.checkbox}
            />
            <span>Export JSON</span>
          </label>
        </div>
      </div>

      {/* Run Button */}
      <button className={styles.runButton}>
        Run Subnetting
      </button>
    </div>
  )
}
