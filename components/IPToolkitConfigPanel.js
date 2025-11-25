import React, { useState } from 'react'
import { FaNetworkWired, FaClipboard, FaServer, FaQuestion } from 'react-icons/fa6'
import SingleIPConfig from './IPAddressToolkit/modes/SingleIPConfig'
import BulkConfig from './IPAddressToolkit/modes/BulkConfig'
import CIDRConfig from './IPAddressToolkit/modes/CIDRConfig'
import DiagnosticsConfig from './IPAddressToolkit/modes/DiagnosticsConfig'
import styles from '../styles/ip-toolkit.module.css'

const MODES = [
  { id: 'single-ip', label: 'Single IP', icon: FaNetworkWired },
  { id: 'bulk', label: 'Bulk', icon: FaClipboard },
  { id: 'cidr-subnet', label: 'CIDR & Subnet', icon: FaServer },
  { id: 'diagnostics', label: 'Diagnostics', icon: FaQuestion },
]

export default function IPToolkitConfigPanel() {
  const [activeMode, setActiveMode] = useState('single-ip')
  const [configState, setConfigState] = useState({})

  const renderConfigPanel = () => {
    switch (activeMode) {
      case 'single-ip':
        return <SingleIPConfig configState={configState} setConfigState={setConfigState} />
      case 'bulk':
        return <BulkConfig configState={configState} setConfigState={setConfigState} />
      case 'cidr-subnet':
        return <CIDRConfig configState={configState} setConfigState={setConfigState} />
      case 'diagnostics':
        return <DiagnosticsConfig configState={configState} setConfigState={setConfigState} />
      default:
        return null
    }
  }

  return (
    <div className={styles.configPanelWrapper}>
      {/* Mode Tabs */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          {MODES.map(mode => {
            const IconComponent = mode.icon
            return (
              <button
                key={mode.id}
                className={`${styles.tab} ${activeMode === mode.id ? styles.tabActive : ''}`}
                onClick={() => setActiveMode(mode.id)}
                title={mode.label}
              >
                <IconComponent className={styles.tabIcon} />
                <span className={styles.tabLabel}>{mode.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode-Specific Config */}
      {renderConfigPanel()}
    </div>
  )
}
