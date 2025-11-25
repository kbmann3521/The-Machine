import React from 'react'
import { MdChevronRight } from 'react-icons/md'
import styles from '../../../styles/ip-toolkit.module.css'
import useAccordion from '../../../lib/useAccordion'

export default function BulkConfig({ configState, setConfigState }) {
  const { expanded: advancedExpanded, toggle: toggleAdvanced } = useAccordion(
    'bulk-advanced-expanded',
    false
  )

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
      <h2 className={styles.configTitle}>Bulk Processing</h2>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Input Type</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="inputType"
              value="paste"
              checked={configState.inputType !== 'upload'}
              onChange={() => handleChange('inputType', 'paste')}
              className={styles.radio}
            />
            <span>Paste IPs</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="inputType"
              value="upload"
              checked={configState.inputType === 'upload'}
              onChange={() => handleChange('inputType', 'upload')}
              className={styles.radio}
            />
            <span>Upload CSV</span>
          </label>
        </div>
      </div>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Max IPs to Process</label>
        <input
          type="number"
          min="1"
          max="10000"
          value={configState.maxIPs || 500}
          onChange={e => handleChange('maxIPs', parseInt(e.target.value))}
          className={styles.input}
        />
        <p className={styles.helperText}>Default: 500 IPs</p>
      </div>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Basic Options</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.validateAll !== false}
              onChange={() => handleCheckboxChange('validateAll')}
              className={styles.checkbox}
            />
            <span>Validate All</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.deduplicate || false}
              onChange={() => handleCheckboxChange('deduplicate')}
              className={styles.checkbox}
            />
            <span>Deduplicate</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.classifyPublicPrivate || false}
              onChange={() => handleCheckboxChange('classifyPublicPrivate')}
              className={styles.checkbox}
            />
            <span>Classify Public/Private</span>
          </label>
        </div>
      </div>

      <div className={styles.configGroup}>
        <button className={styles.accordionToggle} onClick={toggleAdvanced}>
          <span className={`${styles.accordionChevron} ${advancedExpanded ? styles.expanded : ''}`}>
            <MdChevronRight />
          </span>
          Advanced Options
        </button>

        <div className={`${styles.accordionContent} ${advancedExpanded ? styles.expanded : ''}`}>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.bulkGeo || false}
                onChange={() => handleCheckboxChange('bulkGeo')}
                className={styles.checkbox}
              />
              <span>Geo (Lite)</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.bulkAsn || false}
                onChange={() => handleCheckboxChange('bulkAsn')}
                className={styles.checkbox}
              />
              <span>ASN (Lite)</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.cidrCompression || false}
                onChange={() => handleCheckboxChange('cidrCompression')}
                className={styles.checkbox}
              />
              <span>CIDR Compression</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.maliciousHits || false}
                onChange={() => handleCheckboxChange('maliciousHits')}
                className={styles.checkbox}
              />
              <span>Malicious Hits</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.cloudProviderFlags || false}
                onChange={() => handleCheckboxChange('cloudProviderFlags')}
                className={styles.checkbox}
              />
              <span>Cloud Provider Flags</span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Output Format</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputFormat"
              value="table"
              checked={configState.outputFormat !== 'json' && configState.outputFormat !== 'csv'}
              onChange={() => handleChange('outputFormat', 'table')}
              className={styles.radio}
            />
            <span>Table</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputFormat"
              value="json"
              checked={configState.outputFormat === 'json'}
              onChange={() => handleChange('outputFormat', 'json')}
              className={styles.radio}
            />
            <span>JSON</span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="outputFormat"
              value="csv"
              checked={configState.outputFormat === 'csv'}
              onChange={() => handleChange('outputFormat', 'csv')}
              className={styles.radio}
            />
            <span>Download CSV</span>
          </label>
        </div>
      </div>
    </div>
  )
}
