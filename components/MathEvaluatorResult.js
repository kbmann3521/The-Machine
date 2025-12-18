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

  // Level 1: Generate human-friendly explanation from Phase 5 data
  const generateHumanExplanation = (phase5) => {
    if (!phase5) return null

    const { summary, reductions } = phase5
    const explanation = []

    // Standard arithmetic evaluation
    explanation.push('• Evaluated using standard operator precedence')

    // Parentheses handling
    if (summary?.nestingDepth > 1) {
      explanation.push('• Parentheses and nested operations were resolved first')
    }

    // Functions used
    if (summary?.functions && summary.functions.length > 0) {
      const funcList = summary.functions.join(', ')
      explanation.push(`• Function${summary.functions.length > 1 ? 's' : ''} applied: ${funcList}`)
    }

    // Float precision note
    if (reductions && reductions.length > 0) {
      const hasArtifact = reductions.some(r => r.note)
      if (hasArtifact) {
        explanation.push('• Floating-point precision effects detected (see details below)')
      }
    }

    // Final resolution
    explanation.push('• All sub-expressions evaluated independently, combined into final result')

    return explanation
  }

  // Level 3: Render expression structure tree (advanced, behind toggle)
  const renderStructureTree = (structure, level = 0, maxLevels = 4) => {
    if (!structure) return null
    if (level >= maxLevels) {
      return <div className={styles.structureNode} style={{ marginLeft: `${level * 16}px` }}>… (structure truncated)</div>
    }

    if (structure.type === 'literal') {
      return <div className={styles.structureNode} style={{ marginLeft: `${level * 16}px` }}>Literal: <code>{structure.value}</code></div>
    }

    if (structure.type === 'variable') {
      return <div className={styles.structureNode} style={{ marginLeft: `${level * 16}px` }}>Variable: <code>{structure.name}</code></div>
    }

    if (structure.type === 'unary') {
      return (
        <div style={{ marginLeft: `${level * 16}px` }}>
          <div className={styles.structureNode}>Unary {structure.operator}</div>
          <div style={{ marginLeft: '16px' }}>
            {renderStructureTree(structure.argument, level + 1, maxLevels)}
          </div>
        </div>
      )
    }

    if (structure.type === 'binary') {
      return (
        <div style={{ marginLeft: `${level * 16}px` }}>
          <div className={styles.structureNode}>Binary {structure.operator}</div>
          <div style={{ marginLeft: '16px' }}>
            {renderStructureTree(structure.left, level + 1, maxLevels)}
            {renderStructureTree(structure.right, level + 1, maxLevels)}
          </div>
        </div>
      )
    }

    if (structure.type === 'function') {
      return (
        <div style={{ marginLeft: `${level * 16}px` }}>
          <div className={styles.structureNode}>Function: <code>{structure.name}()</code></div>
          {structure.arguments && structure.arguments.length > 0 && (
            <div style={{ marginLeft: '16px' }}>
              {structure.arguments.map((arg, idx) => (
                <div key={idx}>
                  {renderStructureTree(arg, level + 1, maxLevels)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return <div className={styles.structureNode} style={{ marginLeft: `${level * 16}px` }}>Unknown: {JSON.stringify(structure)}</div>
  }

  const [showAdvancedStructure, setShowAdvancedStructure] = React.useState(false)
  const [showKeyReductions, setShowKeyReductions] = React.useState(false)

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

      {/* Phase 5: Expression Structure & Reduction (Explainability) */}
      {result.diagnostics?.phase5 && (
        <div className={styles.phase5Block}>
          <button
            className={styles.phase5Toggle}
            onClick={() => setShowPhase5(!showPhase5)}
          >
            <span className={styles.phase5Label}>Expression Structure</span>
            <span className={styles.toggleIcon}>{showPhase5 ? '▼' : '▶'}</span>
          </button>

          {showPhase5 && (
            <div className={styles.phase5Content}>
              {/* Expression Structure */}
              {result.diagnostics.phase5.structure && result.diagnostics.phase5.structure.type !== 'literal' ? (
                <div className={styles.phase5Section}>
                  <h4 className={styles.phase5SectionTitle}>Structure</h4>
                  <div className={styles.phase5Structure}>
                    {renderStructureTree(result.diagnostics.phase5.structure)}
                  </div>
                </div>
              ) : null}

              {/* Key Reductions (only if artifacts detected) */}
              {result.diagnostics.phase5.reductions && result.diagnostics.phase5.reductions.length > 0 && (
                <div className={styles.phase5Section}>
                  <h4 className={styles.phase5SectionTitle}>Key Reductions</h4>
                  <div className={styles.phase5Reductions}>
                    {result.diagnostics.phase5.reductions.map((reduction, idx) => (
                      <div key={idx} className={styles.phase5Reduction}>
                        <code className={styles.reductionExpression}>{reduction.expression}</code>
                        <span className={styles.reductionArrow}>→</span>
                        <code className={styles.reductionResult}>{reduction.result}</code>
                        {reduction.note && (
                          <div className={styles.reductionNote}>
                            <span className={styles.reductionNoteIcon}>⚠</span>
                            {reduction.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.diagnostics.phase5.summary ? (
                <div className={styles.phase5Section}>
                  <h4 className={styles.phase5SectionTitle}>Summary</h4>
                  <ul className={styles.phase5SummaryList}>
                    {result.diagnostics.phase5.summary.shape && (
                      <li>
                        <span className={styles.summaryKey}>Shape:</span>
                        <span className={styles.summaryValue}>{result.diagnostics.phase5.summary.shape}</span>
                      </li>
                    )}
                    {result.diagnostics.phase5.summary.nestingDepth !== undefined && (
                      <li>
                        <span className={styles.summaryKey}>Nesting Depth:</span>
                        <span className={styles.summaryValue}>{result.diagnostics.phase5.summary.nestingDepth}</span>
                      </li>
                    )}
                    {result.diagnostics.phase5.summary.structureNodeCount !== undefined && (
                      <li>
                        <span className={styles.summaryKey}>Structure Nodes:</span>
                        <span className={styles.summaryValue}>{result.diagnostics.phase5.summary.structureNodeCount}</span>
                      </li>
                    )}
                    {result.diagnostics.phase5.summary.functions && result.diagnostics.phase5.summary.functions.length > 0 && (
                      <li>
                        <span className={styles.summaryKey}>Functions:</span>
                        <span className={styles.summaryValue}>{result.diagnostics.phase5.summary.functions.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              ) : null}

              {/* Important Notes (Warnings) */}
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
