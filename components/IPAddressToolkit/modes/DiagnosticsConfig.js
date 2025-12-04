import React from 'react'
import { MdChevronRight } from 'react-icons/md'
import styles from '../../../styles/ip-toolkit.module.css'
import useAccordion from '../../../lib/useAccordion'

export default function DiagnosticsConfig({ configState, setConfigState }) {
  const { expanded: advancedExpanded, toggle: toggleAdvanced } = useAccordion(
    'diagnostics-advanced-expanded',
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
      <h2 className={styles.configTitle}>Diagnostics</h2>

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Target IP</label>
        <input
          type="text"
          placeholder=""
          value={configState.targetIp || ''}
          onChange={e => handleChange('targetIp', e.target.value)}
          className={styles.input}
        />
      </div>

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

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Basic Options</label>
        <div className={styles.checkboxGroup}>
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
                checked={configState.enableMultiRegionPing || false}
                onChange={() => handleCheckboxChange('enableMultiRegionPing')}
                className={styles.checkbox}
              />
              <span>Multi-Region Ping</span>
            </label>

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

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.enableReputation || false}
                onChange={() => handleCheckboxChange('enableReputation')}
                className={styles.checkbox}
              />
              <span>Reputation Check</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.enableThreatIntel || false}
                onChange={() => handleCheckboxChange('enableThreatIntel')}
                className={styles.checkbox}
              />
              <span>Threat Intel Query</span>
            </label>

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
      </div>
    </div>
  )
}
