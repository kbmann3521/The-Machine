import React from 'react'
import styles from '../styles/json-formatter.module.css'

const JsonFormatter = ({ data }) => {
  const renderValue = (val, key = null, depth = 0) => {
    const isNested = depth > 0

    if (val === null) {
      return <span className={styles.null}>null</span>
    }

    if (typeof val === 'boolean') {
      return <span className={styles.boolean}>{val.toString()}</span>
    }

    if (typeof val === 'number') {
      return <span className={styles.number}>{val}</span>
    }

    if (typeof val === 'string') {
      return <span className={styles.string}>"{val}"</span>
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span className={styles.bracket}>[]</span>
      }
      return (
        <div className={styles.array}>
          <span className={styles.bracket}>[</span>
          <div className={styles.arrayContent}>
            {val.map((item, idx) => (
              <div key={idx} className={styles.arrayItem}>
                {renderValue(item, null, depth + 1)}
                {idx < val.length - 1 && <span className={styles.comma}>,</span>}
              </div>
            ))}
          </div>
          <span className={styles.bracket}>]</span>
        </div>
      )
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val)
      if (keys.length === 0) {
        return <span className={styles.bracket}>{}</span>
      }
      return (
        <div className={styles.object}>
          <span className={styles.bracket}>{'{'}</span>
          <div className={styles.objectContent}>
            {keys.map((k, idx) => (
              <div key={k} className={styles.property}>
                <span className={styles.key}>"{k}"</span>
                <span className={styles.colon}>:</span>
                <div className={styles.value}>
                  {renderValue(val[k], k, depth + 1)}
                </div>
                {idx < keys.length - 1 && <span className={styles.comma}>,</span>}
              </div>
            ))}
          </div>
          <span className={styles.bracket}>{'}'}</span>
        </div>
      )
    }

    return <span>{String(val)}</span>
  }

  return (
    <div className={styles.jsonFormatterWrapper}>
      {renderValue(data)}
    </div>
  )
}

export default JsonFormatter
