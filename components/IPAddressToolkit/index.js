import React, { useState } from 'react'
import { FaNetworkWired, FaClipboard, FaServer, FaQuestion } from 'react-icons/fa6'
import DetectionBubble from './DetectionBubble'
import SingleIPConfig from './modes/SingleIPConfig'
import BulkConfig from './modes/BulkConfig'
import CIDRConfig from './modes/CIDRConfig'
import DiagnosticsConfig from './modes/DiagnosticsConfig'
import SingleIPOutput from './outputs/SingleIPOutput'
import BulkOutput from './outputs/BulkOutput'
import CIDROutput from './outputs/CIDROutput'
import DiagnosticsOutput from './outputs/DiagnosticsOutput'
import styles from '../../styles/ip-toolkit.module.css'

const MODES = [
  { id: 'single-ip', label: 'Single IP', icon: FaNetworkWired },
  { id: 'bulk', label: 'Bulk', icon: FaClipboard },
  { id: 'cidr-subnet', label: 'CIDR & Subnet', icon: FaProjectDiagram },
  { id: 'diagnostics', label: 'Diagnostics', icon: FaQuestion },
]

export default function IPAddressToolkit() {
  const [activeMode, setActiveMode] = useState('single-ip')
  const [detectedInput, setDetectedInput] = useState(null)
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

  const renderOutputPanel = () => {
    switch (activeMode) {
      case 'single-ip':
        return <SingleIPOutput />
      case 'bulk':
        return <BulkOutput />
      case 'cidr-subnet':
        return <CIDROutput />
      case 'diagnostics':
        return <DiagnosticsOutput />
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>IP Toolkit</h1>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>🌐</span>
            <span>Network · IP</span>
          </div>
          <p className={styles.description}>
            Validate, convert, analyze IPv4/IPv6 and CIDR ranges with advanced diagnostic tools.
          </p>
        </div>
      </div>

      {/* Detection Bubble */}
      <DetectionBubble detectedInput={detectedInput} />

      {/* Mode Tabs */}
      <div className={styles.tabsContainer}>
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

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Config Panel (Left) */}
        <div className={styles.configPanel}>
          {renderConfigPanel()}
        </div>

        {/* Output Panel (Right) */}
        <div className={styles.outputPanel}>
          {renderOutputPanel()}
        </div>
      </div>
    </div>
  )
}
