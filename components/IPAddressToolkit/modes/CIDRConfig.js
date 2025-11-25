import React from 'react'
import { MdChevronRight } from 'react-icons/md'
import styles from '../../../styles/ip-toolkit.module.css'
import useAccordion from '../../../lib/useAccordion'

export default function CIDRConfig({ configState, setConfigState }) {
  const { expanded: advancedExpanded, toggle: toggleAdvanced } = useAccordion(
    'cidr-advanced-expanded',
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
      <h2 className={styles.configTitle}>CIDR & Subnet</h2>

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

      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Basic Options</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.showSubnetTable !== false}
              onChange={() => handleCheckboxChange('showSubnetTable')}
              className={styles.checkbox}
            />
            <span>Show Subnet Table</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.showVisualizer !== false}
              onChange={() => handleCheckboxChange('showVisualizer')}
              className={styles.checkbox}
            />
            <span>Show Visualizer</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={configState.showFirstLastIP || false}
              onChange={() => handleCheckboxChange('showFirstLastIP')}
              className={styles.checkbox}
            />
            <span>Show First/Last IP</span>
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
                checked={configState.asnOwnershipPerSubnet || false}
                onChange={() => handleCheckboxChange('asnOwnershipPerSubnet')}
                className={styles.checkbox}
              />
              <span>ASN Ownership per Subnet</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.countryBreakdown || false}
                onChange={() => handleCheckboxChange('countryBreakdown')}
                className={styles.checkbox}
              />
              <span>Country Breakdown</span>
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

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.threatIntelPerSubnet || false}
                onChange={() => handleCheckboxChange('threatIntelPerSubnet')}
                className={styles.checkbox}
              />
              <span>Threat Intel per Subnet</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.reputationPerSubnet || false}
                onChange={() => handleCheckboxChange('reputationPerSubnet')}
                className={styles.checkbox}
              />
              <span>Reputation per Subnet</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={configState.multiSourceOwnershipComparison || false}
                onChange={() => handleCheckboxChange('multiSourceOwnershipComparison')}
                className={styles.checkbox}
              />
              <span>Multi-source Ownership Comparison</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
