import React, { useState } from 'react'
import ResizeMode from './modes/ResizeMode'
import Base64Mode from './modes/Base64Mode'
import ResizeOutput from './outputs/ResizeOutput'
import Base64Output from './outputs/Base64Output'
import styles from '../../styles/image-toolkit.module.css'

export default function ImageToolkit({ result, config, onParamsChange }) {
  const mode = config?.mode || 'resize'

  const renderMode = () => {
    switch (mode) {
      case 'resize':
        return <ResizeMode result={result} config={config} />
      case 'base64':
        return <Base64Mode result={result} config={config} />
      default:
        return null
    }
  }

  const renderOutput = () => {
    if (!result) {
      return (
        <div className={styles.placeholder}>
          <p>Configure the tool and upload an image to see results</p>
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

    switch (mode) {
      case 'resize':
        return <ResizeOutput result={result} />
      case 'base64':
        return <Base64Output result={result} />
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.modeSection}>
        {renderMode()}
      </div>
      <div className={styles.outputSection}>
        {renderOutput()}
      </div>
    </div>
  )
}
