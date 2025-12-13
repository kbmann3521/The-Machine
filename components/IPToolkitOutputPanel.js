import React from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ result }) {
  // Route to appropriate output component based on input type
  const renderOutput = () => {
    if (!result) {
      return <SingleIPOutput result={result} />
    }

    switch (result.inputType) {
      case 'cidr':
        return <CIDROutput result={result} />
      case 'range':
        return <SingleIPOutput result={result} />
      default:
        return <SingleIPOutput result={result} />
    }
  }

  return (
    <div className={styles.outputPanelWrapper}>
      {renderOutput()}
    </div>
  )
}
