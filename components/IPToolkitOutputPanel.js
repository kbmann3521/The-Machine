import React, { useState } from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import BulkOutput from './IPAddressToolkit/outputs/BulkOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import DiagnosticsOutput from './IPAddressToolkit/outputs/DiagnosticsOutput'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ activeMode = 'single-ip' }) {
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
    <div className={styles.outputPanelWrapper}>
      {renderOutputPanel()}
    </div>
  )
}
