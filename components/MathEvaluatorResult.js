import React from 'react'
import styles from '../styles/math-evaluator-result.module.css'

export default function MathEvaluatorResult({ result, expression, showPhase5ByDefault = false }) {
  const [showPhase5, setShowPhase5] = React.useState(showPhase5ByDefault)
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
    if (mode === 'bignumber') return 'High-Precision (BigNumber)'
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

  // Generate rounding note based on precision and rounding mode
  const getRoundingNote = () => {
    const numericConfig = result.diagnostics?.numeric
    if (!numericConfig || numericConfig.precision === null) {
      return null
    }

    const didRound = result.diagnostics?.precisionRounded
    if (didRound) {
      // Vary message based on rounding mode
      const roundingText = getRoundingDisplay(numericConfig.rounding)
      return `Rounded to ${numericConfig.precision} decimal place${numericConfig.precision === 1 ? '' : 's'} using ${roundingText}`
    } else {
      // Precision applied but no visible change
      return 'Precision applied (no visible change)'
    }
  }

  const status = getStatus()
  const numericConfig = result.diagnostics?.numeric
  const complexity = result.diagnostics?.complexity

  return (
    <div className={styles.container}>
      {/* 1. Primary Result - formattedResult is the user's answer (only show if no error) */}
      {result.formattedResult !== undefined && !status.error && (
        <div className={styles.resultBlock}>
          <div className={styles.blockLabel}>Result</div>
          <div className={styles.resultValue}>{result.formattedResult}</div>
          {getRoundingNote() && (
            <div className={styles.roundingNote}>
              {getRoundingNote()}
            </div>
          )}
        </div>
      )}

      {/* 2. Expression Summary - always show */}
      {expression && (
        <div className={styles.expressionBlock}>
          <div className={styles.blockLabel}>Evaluated Expression</div>
          <code className={styles.expressionValue}>{expression}</code>
        </div>
      )}

      {/* 3. Status & Warnings - always show */}
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

      {/* 4. Calculation Details (show if we have any diagnostic data) */}
      {(result.result !== undefined || numericConfig || result.diagnostics?.functionsUsed?.length > 0 || result.diagnostics?.variables?.length > 0 || complexity) && (
        <div className={styles.detailsBlock}>
          <div className={styles.detailsLabel}>Calculation Details</div>
          <ul className={styles.detailsList}>
            {result.result !== undefined && (
              <li>
                <span className={styles.detailKey}>Raw Result:</span>
                <span className={styles.detailValue}>
                  {typeof result.result === 'string' ? result.result : String(result.result)}
                </span>
              </li>
            )}
            {numericConfig?.mode && (
              <li>
                <span className={styles.detailKey}>Numeric Mode:</span>
                <span className={styles.detailValue}>{getModeName(numericConfig.mode)}</span>
              </li>
            )}
            {numericConfig && (
              <li>
                <span className={styles.detailKey}>Precision Applied:</span>
                <span className={styles.detailValue}>{getPrecisionDisplay(numericConfig)}</span>
              </li>
            )}
            {numericConfig?.rounding && (
              <li>
                <span className={styles.detailKey}>Rounding Rule:</span>
                <span className={styles.detailValue}>{getRoundingDisplay(numericConfig.rounding)}</span>
              </li>
            )}
            {result.diagnostics?.functionsUsed?.length > 0 && (
              <li>
                <span className={styles.detailKey}>Functions Used:</span>
                <span className={styles.detailValue}>
                  {result.diagnostics.functionsUsed.join(', ')}
                </span>
              </li>
            )}
            {result.diagnostics?.variables?.length > 0 && (
              <li>
                <span className={styles.detailKey}>Variables Detected:</span>
                <span className={styles.detailValue}>
                  {result.diagnostics.variables.join(', ')}
                </span>
              </li>
            )}
            {complexity?.nodes !== undefined && (
              <li>
                <span className={styles.detailKey}>Expression Size:</span>
                <span className={styles.detailValue}>
                  {complexity.nodes} operation{complexity.nodes === 1 ? '' : 's'}
                </span>
              </li>
            )}
            {complexity?.depth !== undefined && (
              <li>
                <span className={styles.detailKey}>Nesting Depth:</span>
                <span className={styles.detailValue}>
                  {complexity.depth} level{complexity.depth === 1 ? '' : 's'}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Phase 5: How This Was Calculated (Explainability) */}
      {result.diagnostics?.phase5 && (
        <div className={styles.phase5Block}>
          <button
            className={styles.phase5Toggle}
            onClick={() => setShowPhase5(!showPhase5)}
          >
            <span className={styles.phase5Label}>How This Was Calculated</span>
            <span className={styles.toggleIcon}>{showPhase5 ? '▼' : '▶'}</span>
          </button>

          {showPhase5 && (
            <div className={styles.phase5Content}>
              {/* Evaluation Summary */}
              <div className={styles.phase5Section}>
                <h4 className={styles.phase5SectionTitle}>Evaluation Summary</h4>
                <p className={styles.phase5SectionText}>
                  {result.diagnostics.phase5.evaluationSummary}
                </p>
              </div>

              {/* Step-by-Step Breakdown */}
              {result.diagnostics.phase5.evaluationTrace && result.diagnostics.phase5.evaluationTrace.length > 0 && (
                <div className={styles.phase5Section}>
                  <h4 className={styles.phase5SectionTitle}>Step-by-Step Breakdown</h4>
                  <div className={styles.phase5Steps}>
                    {result.diagnostics.phase5.evaluationTrace.map((step, idx) => (
                      <div key={idx} className={styles.phase5Step}>
                        <span className={styles.phase5StepNumber}>Step {step.step}:</span>
                        <span className={styles.phase5StepText}>{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Precision & Artifact Explanation (Conditional) */}
              {result.diagnostics?.warnings && result.diagnostics.warnings.length > 0 && (
                <div className={styles.phase5Section}>
                  <h4 className={styles.phase5SectionTitle}>Important Notes</h4>
                  <div className={styles.phase5Notes}>
                    {result.diagnostics.warnings.map((warning, idx) => (
                      <div key={idx} className={styles.phase5Note}>
                        <span className={styles.phase5NoteIcon}>ℹ</span>
                        <span className={styles.phase5NoteText}>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
