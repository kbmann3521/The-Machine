import React from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ result }) {
  return (
    <div className={styles.outputPanelWrapper}>
      <SingleIPOutput result={result} />
    </div>
  )
}
