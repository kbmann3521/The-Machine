import React, { useState } from 'react'
import styles from '../styles/math-evaluator-result.module.css'

export default function MathEvaluatorResult({ result, expression }) {
  const [showDetails, setShowDetails] = useState(false)

  if (!result) {
    return null
  }

  // Determine status message and icon
  const getStatus = () => {
    if (result.error) {
      return {
        icon: '✖',
        message: result.error,
        type: 'error'
      }
    }

    const warnings = result.diagnostics?.warnings || []
    if (warnings.length > 0) {
      // Filter out metadata warnings, keep only user-facing ones
      const userWarnings = warnings.filter(w =>
        !w.includes('is undefined') &&
        !w.includes('not defined') &&
        !w.includes('precisionRounded')
      )

      if (userWarnings.length > 0) {
        return {
          icon: '⚠',
          message: userWarnings[0],
          type: 'warning',
          allWarnings: userWarnings
        }
      }
    }

    return {
      icon: '✓',
      message: 'Calculation successful',
      type: 'success'
    }
  }

  // Get human-friendly mode name
  const getModeName = (mode) => {
    if (mode === 'float') return 'Standard (Floating-Point)'
    if (mode === 'bignumber') return 'High Precision (Exact Decimal / BigNumber)'
    return mode
  }

  // Get human-friendly precision display
  const getPrecisionDisplay = (config) => {
    if (config.precision === null) return 'Automatic'
    return `${config.precision} decimal place${config.precision === 1 ? '' : 's'}`
  }

  // Get human-friendly rounding display
  const getRoundingDisplay = (rounding) => {
    switch (rounding) {
      case 'half-up':
        return 'Half-Up (Traditional)'
      case 'half-even':
        return 'Half-Even (Banker\'s)'
      case 'floor':
        return 'Floor (Toward −∞)'
      case 'ceil':
        return 'Ceil (Toward +∞)'
      default:
        return rounding
    }
  }

  // Get human-friendly notation display
  const getNotationDisplay = (notation) => {
    if (notation === 'auto') return 'Automatic'
    if (notation === 'scientific') return 'Scientific'
    if (notation === 'standard') return 'Standard'
    return notation
  }

  const status = getStatus()
  const numericConfig = result.diagnostics?.numeric
  const complexity = result.diagnostics?.complexity

  return (
    <div className={styles.container}>
      {/* 1. Primary Result - formattedResult is the user's answer */}
      {result.formattedResult !== undefined && !status.error && (
        <div className={styles.resultBlock}>
          <div className={styles.blockLabel}>Result</div>
          <div className={styles.resultValue}>{result.formattedResult}</div>
          {result.result && result.result !== result.formattedResult && (
            <div className={styles.roundingNote}>
              Formatted for display (see Raw Result below)
            </div>
          )}
        </div>
      )}

      {/* 2. Expression Summary */}
      <div className={styles.expressionBlock}>
        <div className={styles.blockLabel}>Expression</div>
        <code className={styles.expressionValue}>{expression}</code>
      </div>

      {/* 3. Status & Warnings */}
      <div className={`${styles.statusBlock} ${styles[`status-${status.type}`]}`}>
        <div className={styles.blockLabel}>Status</div>
        <div className={styles.statusContent}>
          <span className={styles.statusIcon}>{status.icon}</span>
          <span className={styles.statusMessage}>{status.message}</span>
        </div>
        {status.allWarnings && status.allWarnings.length > 1 && (
          <div className={styles.additionalWarnings}>
            {status.allWarnings.slice(1).map((warning, idx) => (
              <div key={idx} className={styles.warningItem}>
                <span className={styles.warningIcon}>⚠</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Numeric Settings Used */}
      {numericConfig && (
        <div className={styles.settingsBlock}>
          <div className={styles.blockLabel}>Numeric Settings</div>
          <ul className={styles.settingsList}>
            <li>
              <span className={styles.settingKey}>Calculation Mode:</span>
              <span className={styles.settingValue}>{getModeName(numericConfig.mode)}</span>
            </li>
            <li>
              <span className={styles.settingKey}>Decimal Precision:</span>
              <span className={styles.settingValue}>{getPrecisionDisplay(numericConfig)}</span>
            </li>
            <li>
              <span className={styles.settingKey}>Rounding Rule:</span>
              <span className={styles.settingValue}>{getRoundingDisplay(numericConfig.rounding)}</span>
            </li>
            <li>
              <span className={styles.settingKey}>Number Format:</span>
              <span className={styles.settingValue}>{getNotationDisplay(numericConfig.notation)}</span>
            </li>
          </ul>
        </div>
      )}

      {/* 5. Calculation Details (Collapsible) */}
      {complexity && (
        <div className={styles.detailsBlock}>
          <button
            className={styles.detailsToggle}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className={styles.detailsLabel}>Calculation Details</span>
            <span className={styles.toggleIcon}>{showDetails ? '▼' : '▶'}</span>
          </button>
          {showDetails && (
            <div className={styles.detailsContent}>
              <ul className={styles.detailsList}>
                <li>
                  <span className={styles.detailKey}>Functions Used:</span>
                  <span className={styles.detailValue}>
                    {result.diagnostics?.functionsUsed?.length > 0
                      ? result.diagnostics.functionsUsed.join(', ')
                      : 'None'}
                  </span>
                </li>
                <li>
                  <span className={styles.detailKey}>Variables Detected:</span>
                  <span className={styles.detailValue}>
                    {result.diagnostics?.variables?.length > 0
                      ? result.diagnostics.variables.join(', ')
                      : 'None'}
                  </span>
                </li>
                <li>
                  <span className={styles.detailKey}>Expression Size:</span>
                  <span className={styles.detailValue}>
                    {complexity.nodes} operation{complexity.nodes === 1 ? '' : 's'}
                  </span>
                </li>
                <li>
                  <span className={styles.detailKey}>Nesting Depth:</span>
                  <span className={styles.detailValue}>
                    {complexity.depth} level{complexity.depth === 1 ? '' : 's'}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
