import React, { useMemo } from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import { detectIPInputType } from '../lib/ipInputDetection'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ result, inputText }) {
  const detectedInput = useMemo(() => {
    if (!inputText) return null
    return detectIPInputType(inputText)
  }, [inputText])

  // Route to appropriate output component based on input type
  const renderOutput = () => {
    if (!result) {
      return <SingleIPOutput result={result} detectedInput={detectedInput} />
    }

    switch (result.inputType) {
      case 'cidr':
        return <CIDROutput result={result} detectedInput={detectedInput} />
      case 'range':
        return <SingleIPOutput result={result} detectedInput={detectedInput} />
      default:
        return <SingleIPOutput result={result} detectedInput={detectedInput} />
    }
  }

  return (
    <div className={styles.outputPanelWrapper}>
      {renderOutput()}
    </div>
  )
}
