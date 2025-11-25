import React from 'react'
import { FaCheckCircle } from 'react-icons/fa6'
import styles from '../../styles/ip-toolkit.module.css'

export default function DetectionBubble({ detectedInput }) {
  if (!detectedInput) {
    return null
  }

  return (
    <div className={styles.detectionBubble}>
      <div className={styles.detectionContent}>
        <FaCheckCircle className={styles.detectionIcon} />
        <div className={styles.detectionText}>
          <span className={styles.detectionLabel}>Detected Input:</span>
          <span className={styles.detectionValue}>{detectedInput.value}</span>
          <span className={styles.detectionMeta}>{detectedInput.type}</span>
        </div>
      </div>
    </div>
  )
}
