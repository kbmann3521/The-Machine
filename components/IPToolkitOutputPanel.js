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
      {detectedInput && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#4caf50',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          <span>
            Detected: <strong>{detectedInput.type}</strong>
            {detectedInput.description && ` — ${detectedInput.description}`}
          </span>
        </div>
      )}
      {renderOutput()}
    </div>
  )
}
