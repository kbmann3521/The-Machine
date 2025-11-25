import React, { useState } from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import BulkOutput from './IPAddressToolkit/outputs/BulkOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import DiagnosticsOutput from './IPAddressToolkit/outputs/DiagnosticsOutput'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ activeMode = 'single-ip', result }) {
  const renderOutputPanel = () => {
    switch (activeMode) {
      case 'single-ip':
        return <SingleIPOutput result={result} />
      case 'bulk':
        return <BulkOutput result={result} />
      case 'cidr-subnet':
        return <CIDROutput result={result} />
      case 'diagnostics':
        return <DiagnosticsOutput result={result} />
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
