import React from 'react'
import OutputTabs from '../../OutputTabs'
import styles from '../../../styles/image-toolkit.module.css'

export default function Base64Output({ result }) {
  if (!result || !result.base64Data) {
    return null
  }

  const dataUri = result.base64Data
  const base64String = dataUri.split(',')[1] || dataUri

  const tabs = [
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div className={styles.imageContainer}>
          <img src={dataUri} alt="Base64 Preview" className={styles.image} />
          <div className={styles.dimensions}>
            <div className={styles.dimensionRow}>
              <span className={styles.label}>Size:</span>
              <span className={styles.value}>{(result.length / 1024).toFixed(2)} KB</span>
            </div>
            <div className={styles.dimensionRow}>
              <span className={styles.label}>Format:</span>
              <span className={styles.value}>Data URI</span>
            </div>
          </div>
        </div>
      ),
      contentType: 'component',
    },
    {
      id: 'base64',
      label: 'Base64 String',
      content: base64String,
      contentType: 'code',
    },
    {
      id: 'data-uri',
      label: 'Data URI',
      content: dataUri,
      contentType: 'code',
    },
    {
      id: 'html-embed',
      label: 'HTML Embed',
      content: `<img src="${dataUri}" alt="Embedded Image" />`,
      contentType: 'code',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
