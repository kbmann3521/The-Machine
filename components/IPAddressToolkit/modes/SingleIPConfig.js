import React from 'react'
import { MdChevronRight } from 'react-icons/md'
import styles from '../../../styles/ip-toolkit.module.css'
import useAccordion from '../../../lib/useAccordion'

export default function SingleIPConfig({ configState, setConfigState }) {
  const { expanded: advancedExpanded, toggle: toggleAdvanced } = useAccordion(
    'singleip-advanced-expanded',
    false
  )

  const handleCheckboxChange = (key) => {
    setConfigState(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleChange = (key, value) => {
    setConfigState(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className={styles.configSection}>
      <h2 className={styles.configTitle}>Single IP Analysis</h2>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Basic Options</label>
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
            <span>Classify (public/private/reserved)</span>
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
                checked={configState.asn || false}
                onChange={() => handleCheckboxChange('asn')}
                className={styles.checkbox}
              />
              <span>ASN Lookup</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.geo || false}
                onChange={() => handleCheckboxChange('geo')}
                className={styles.checkbox}
              />
              <span>Geo Lookup</span>
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

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.cloudProviderDetection || false}
                onChange={() => handleCheckboxChange('cloudProviderDetection')}
                className={styles.checkbox}
              />
              <span>Cloud Provider Detection</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.reputationScore || false}
                onChange={() => handleCheckboxChange('reputationScore')}
                className={styles.checkbox}
              />
              <span>Reputation Score</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.threatIntel || false}
                onChange={() => handleCheckboxChange('threatIntel')}
                className={styles.checkbox}
              />
              <span>Threat Intel Check</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.multiSourceCheck || false}
                onChange={() => handleCheckboxChange('multiSourceCheck')}
                className={styles.checkbox}
              />
              <span>Multi-Source Cross-Check</span>
            </label>
          </div>
        </div>
      </div>

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
    </div>
  )
}
