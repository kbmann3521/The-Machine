import { useState } from 'react'
import styles from '../styles/tool-output.module.css'

/**
 * AccordionMetric Component
 * Displays a metric with label, value, and optional expandable detail content
 * 
 * @param {string} label - The metric label (e.g., "Words", "Stop Words")
 * @param {string|number} value - The primary metric value to display
 * @param {JSX.Element} children - Optional detail content to display when expanded
 * @param {string} category - Category for color coding (e.g., 'basicCounts', 'characterAnalysis')
 * @param {boolean} hasDetails - Whether this metric has expandable details
 */
export default function AnalyzerAccordionMetric({
  label,
  value,
  children,
  category = 'basicCounts',
  hasDetails = false
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`${styles.analyzerMetricRow} ${styles[category]}`}>
      <div
        className={styles.analyzerMetricHeader}
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{ cursor: hasDetails ? 'pointer' : 'default' }}
      >
        <div className={styles.analyzerMetricLabel}>{label}</div>
        <div className={styles.analyzerMetricValue}>{value}</div>
        {hasDetails && (
          <div className={`${styles.analyzerMetricExpander} ${expanded ? styles.expanded : ''}`}>
            ▼
          </div>
        )}
      </div>
      {hasDetails && expanded && (
        <div className={styles.analyzerMetricDetail}>
          {children}
        </div>
      )}
    </div>
  )
}
