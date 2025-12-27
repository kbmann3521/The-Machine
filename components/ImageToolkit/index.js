import React from 'react'
import ResizeOutput from './outputs/ResizeOutput'
import styles from '../../styles/image-toolkit.module.css'

export default function ImageToolkit({ result, config }) {
  const renderOutput = () => {
    if (!result) {
      return (
        <div className={styles.placeholder}>
          <p>No results yet</p>
        </div>
      )
    }

    if (result.error) {
      return (
        <div className={styles.error}>
          <p>{result.error}</p>
        </div>
      )
    }

    return <ResizeOutput result={result} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.outputSection}>
        {renderOutput()}
      </div>
    </div>
  )
}
