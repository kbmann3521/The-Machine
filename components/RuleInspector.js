import React, { useState } from 'react'
import { PropertyEditorDispatcher, getPropertyEditorType } from './PropertyEditor'
import { isRuleRedundant } from '../lib/tools/ruleImpactAnalysis'
import { generateRefactorSuggestions } from '../lib/tools/refactorSuggestions'
import { classifyProperty, getImpactBadgeInfo } from '../lib/propertyClassification'
import styles from '../styles/rule-inspector.module.css'

/**
 * RuleInspector Component (Phase 6 + 7A)
 *
 * Displays all CSS rules affecting a selected element,
 * ordered by CSS cascade (specificity → document order).
 *
 * Props:
 *   selector: string (e.g., ".button")
 *   affectingRules: Array of rule objects
 *   onClose: () => void
 *   onPropertyEdit: (selector, property, value) => void (Phase 6C+)
 *   hasActiveOverrides: boolean (Phase 6E: whether there are staged edits)
 *   onApplyEdits: () => void (Phase 6E: callback to apply staged edits to source)
 *   onRuleSelect: (rule) => void (Phase 7A: compute impact when rule is selected)
 *   selectedRuleImpact: RuleImpact | null (Phase 7A: impact data for currently selected rule)
 *   onAffectedNodeHover: (selector, action) => void (Phase 7A Stage 4: highlight affected elements)
 *   disabledProperties: Set<string> (Phase 7D: disabled properties for what-if simulation, format: "ruleIndex-property")
 *   onTogglePropertyDisabled: (ruleIndex, property) => void (Phase 7D: toggle property disabled state)
 *   onRemoveRule: (ruleIndex, selector, lineRange) => void (Phase 7C: remove fully overridden rule from source)
 */
export default function RuleInspector({
  selector = null,
  affectingRules = [],
  onClose = null,
  onPropertyEdit = null,
  hasActiveOverrides = false,
  onApplyEdits = null,
  onRuleSelect = null,
  selectedRuleImpact = null,
  onAffectedNodeHover = null,
  disabledProperties = new Set(),
  onTogglePropertyDisabled = null,
  onRemoveRule = null,
}) {
  const [expandedRules, setExpandedRules] = useState({})
  const [selectedRuleKey, setSelectedRuleKey] = useState(null)
  const [selectedRule, setSelectedRule] = useState(null) // Track the current rule for suggestions
  const [editingProp, setEditingProp] = useState(null) // { ruleIndex, property }
  const [editValues, setEditValues] = useState({}) // Track edited values
  const [expandedSuggestions, setExpandedSuggestions] = useState({}) // Phase 7C: Track which rules have suggestions expanded
  const [confirmRemoveRule, setConfirmRemoveRule] = useState(null) // Phase 7C: Track which rule is being confirmed for removal (null or rule object)

  if (!selector || !affectingRules.length) {
    return null
  }

  const toggleRuleExpanded = (ruleKey, rule) => {
    const isExpanding = !expandedRules[ruleKey]
    setExpandedRules(prev => ({
      ...prev,
      [ruleKey]: !prev[ruleKey],
    }))

    // Phase 7A: Compute impact when rule is expanded
    if (isExpanding && onRuleSelect) {
      setSelectedRuleKey(ruleKey)
      setSelectedRule(rule) // Phase 7C: Track rule for suggestions
      onRuleSelect(rule)
    }
  }

  const getSpecificityLabel = (score) => {
    // CSS specificity is typically (a, b, c) where:
    // a = ID selectors, b = class selectors, c = element selectors
    // For simplicity, we show the total score
    return `(${score})`
  }

  const getRuleTypeLabel = (rule) => {
    if (rule.type === 'pseudo') {
      return `${rule.selector} — :${rule.pseudoState}`
    }
    if (rule.type === 'media') {
      return `${rule.selector} in ${rule.mediaQuery}`
    }
    return rule.selector
  }

  const getPropertyImpactClass = (property) => {
    // Return the impact classification for styling
    const impact = classifyProperty(property)
    return `impact-${impact}`
  }

  // Phase 7C: Render refactor suggestions for a selected rule (collapsed by default)
  const renderRefactorSuggestions = (ruleKey) => {
    if (!selectedRule || !selectedRuleImpact) return null

    const suggestions = generateRefactorSuggestions(selectedRule, selectedRuleImpact, affectingRules)
    if (suggestions.length === 0) return null

    const isExpanded = expandedSuggestions[ruleKey]

    return (
      <div className={styles.suggestionsPanelCollapsible}>
        <button
          className={`${styles.suggestionsToggle} ${isExpanded ? styles.suggestionsToggleExpanded : ''}`}
          onClick={() => setExpandedSuggestions(prev => ({
            ...prev,
            [ruleKey]: !prev[ruleKey],
          }))}
          title={isExpanded ? 'Hide refactor suggestions' : 'Show refactor suggestions'}
        >
          <span className={styles.suggestionsChevron}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className={styles.suggestionsLabel}>
            💡 Refactor Suggestions ({suggestions.length})
          </span>
        </button>

        {isExpanded && (
          <div className={styles.suggestionsPanel}>
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className={`${styles.suggestionItem} ${styles[`severity-${suggestion.severity}`]}`}>
                <div className={styles.suggestionTitle}>{suggestion.title}</div>
                <div className={styles.suggestionDescription}>{suggestion.description}</div>
                {suggestion.details && (
                  <div className={styles.suggestionDetails}>{suggestion.details}</div>
                )}
                {suggestion.properties && suggestion.properties.length > 0 && (
                  <div className={styles.suggestionProperties}>
                    {suggestion.properties.map((prop, pIdx) => (
                      <div key={pIdx} className={styles.suggestionProperty}>
                        <span className={styles.suggestionPropName}>{prop.property}</span>
                        <span className={styles.suggestionPropValue}>{prop.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {suggestion.type === 'fully-overridden' && onRemoveRule && (
                  <button
                    className={styles.applyRefactorButton}
                    onClick={() => setConfirmRemoveRule(selectedRule)}
                    title="Open confirmation to remove this fully overridden rule from the stylesheet"
                  >
                    🔧 Apply Refactor…
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Phase 7A: Render impact information for a selected rule
  const renderImpactInfo = () => {
    if (!selectedRuleImpact) return null

    const { affectedNodes = [] } = selectedRuleImpact

    // Phase 7B: Detect redundant rules (CSS-only analysis)
    const redundancyInfo = isRuleRedundant(selectedRuleImpact)

    if (affectedNodes.length === 0) {
      return (
        <div className={styles.impactInfo}>
          <div className={styles.impactSection}>
            <div className={styles.impactLabel}>Affects (Direct Matches):</div>
            <div className={styles.impactDetail} style={{ color: 'var(--color-text-secondary, #999)' }}>
              No direct matches in preview
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`${styles.impactInfo} ${redundancyInfo.isRedundant ? styles.impactInfoRedundant : ''}`}>
        {redundancyInfo.isRedundant && (
          <div className={styles.redundancyIndicator}>
            🔄 <strong>Fully Overridden</strong> — {redundancyInfo.reason}
          </div>
        )}
        {affectedNodes.map((node, idx) => (
          <div key={idx} className={styles.impactSection}>
            <div className={styles.impactLabel}>Affects (Direct Matches):</div>
            <div
              className={styles.impactElement}
              onMouseEnter={() => {
                if (onAffectedNodeHover) {
                  onAffectedNodeHover(node.element, 'highlight')
                }
              }}
              onMouseLeave={() => {
                if (onAffectedNodeHover) {
                  onAffectedNodeHover(node.element, 'remove')
                }
              }}
            >
              ✔ {node.element}
            </div>
            <div className={styles.impactProperties}>
              {node.properties.map((prop, pIdx) => (
                <div key={pIdx} className={styles.impactProperty}>
                  <span className={styles.impactPropName}>{prop.property}</span>
                  <span className={prop.effective ? styles.impactEffective : styles.impactInert}>
                    {prop.effective ? '(effective)' : '(overridden)'}
                  </span>
                  {prop.overriddenBy !== undefined && (
                    <span className={styles.impactOverriddenBy}>
                      → rule {prop.overriddenBy}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.inspectorPanel}>
      <div className={styles.inspectorHeader}>
        <h3 className={styles.inspectorTitle}>
          Affecting Rules: <code>{selector}</code>
        </h3>
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close inspector"
            aria-label="Close rule inspector"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.rulesList}>
        {affectingRules.map((rule, idx) => {
          const ruleKey = `${rule.ruleIndex}-${rule.type}`
          const isExpanded = expandedRules[ruleKey]

          return (
            <div key={ruleKey} className={styles.ruleItem}>
              <button
                className={`${styles.ruleHeader} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => toggleRuleExpanded(ruleKey, rule)}
                title={`Click to ${isExpanded ? 'collapse' : 'expand'}`}
              >
                <span className={styles.ruleChevron}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className={styles.ruleLabel}>
                  {getRuleTypeLabel(rule)}
                </span>
                <span className={styles.specificity}>
                  {getSpecificityLabel(rule.specificity)}
                </span>
                {rule.loc && (
                  <span className={styles.lineNumber}>
                    Line {rule.loc.startLine}
                  </span>
                )}
              </button>

              {isExpanded && (
                <>
                  {selectedRuleKey === ruleKey && (
                    <>
                      {renderImpactInfo()}
                      {renderRefactorSuggestions(ruleKey)}
                    </>
                  )}
                  <div className={styles.declarationsContainer}>
                  {rule.declarations && rule.declarations.length > 0 ? (
                    <div className={styles.declarations}>
                      {rule.declarations.map((decl, declIdx) => {
                        const impactClass = getPropertyImpactClass(decl.property)
                        const impactInfo = getImpactBadgeInfo(decl.property)
                        const propKey = `${ruleKey}-${decl.property}`
                        const disabledKey = `${rule.ruleIndex}-${decl.property}`
                        const isPropertyDisabled = disabledProperties.has(disabledKey)
                        const isEditing = editingProp?.propKey === propKey
                        const editedValue = editValues[propKey] !== undefined ? editValues[propKey] : decl.value

                        return (
                          <div
                            key={declIdx}
                            className={`${styles.declaration} ${styles[impactClass]} ${isPropertyDisabled ? styles.declarationDisabled : ''}`}
                          >
                            {onTogglePropertyDisabled && (
                              <button
                                className={`${styles.propertyToggleBtn} ${isPropertyDisabled ? styles.propertyToggleBtnActive : ''}`}
                                onClick={() => onTogglePropertyDisabled(rule.ruleIndex, decl.property)}
                                title={isPropertyDisabled ? `Enable ${decl.property}` : `Disable ${decl.property} (what-if simulation)`}
                              >
                                {isPropertyDisabled ? '✗' : '•'}
                              </button>
                            )}
                            <span className={styles.impactBadge} title={impactInfo.description}>
                              {impactInfo.emoji}
                            </span>
                            <span className={styles.property}>{decl.property}</span>
                            <span className={styles.colon}>:</span>

                            {isEditing ? (
                              <div className={styles.editorContainer}>
                                <PropertyEditorDispatcher
                                  property={decl.property}
                                  value={editedValue}
                                  onChange={(newValue) => {
                                    setEditValues(prev => ({
                                      ...prev,
                                      [propKey]: newValue,
                                    }))

                                    // Call the callback for real-time preview
                                    if (onPropertyEdit) {
                                      onPropertyEdit(rule.selector, decl.property, newValue)
                                    }
                                  }}
                                />
                                <button
                                  className={styles.confirmEditButton}
                                  onClick={() => setEditingProp(null)}
                                  title="Confirm edit"
                                >
                                  ✓
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={styles.value}>{editedValue}</span>
                                <button
                                  className={styles.editButton}
                                  title={`Edit ${decl.property}`}
                                  onClick={() => {
                                    setEditingProp({ propKey, ruleIndex: rule.ruleIndex })
                                  }}
                                >
                                  ✎
                                </button>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className={styles.noDeclarations}>No declarations</div>
                  )}
                </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.inspectorFooter}>
        <p className={styles.disclaimer}>
          💡 Click any property to edit. Impact badges: 🟢 Visual · 🟡 Layout · 🔵 Interactive · 🔴 Structural
        </p>
        {hasActiveOverrides && onApplyEdits && (
          <button
            className={styles.applyEditsButton}
            onClick={onApplyEdits}
            title="Apply staged edits to the source CSS"
          >
            📋 Apply to CSS
          </button>
        )}
      </div>

      {confirmRemoveRule && (
        <div className={styles.confirmationOverlay} onClick={() => setConfirmRemoveRule(null)}>
          <div className={styles.confirmationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmationHeader}>
              <h3 className={styles.confirmationTitle}>Remove Fully Overridden Rule?</h3>
            </div>
            <div className={styles.confirmationContent}>
              <p className={styles.confirmationWarning}>
                ⚠ This action removes code from your stylesheet and may affect other contexts that are not visible in this preview.
              </p>
              <div className={styles.confirmationDetails}>
                <div className={styles.confirmationDetailItem}>
                  <span className={styles.confirmationDetailLabel}>Selector:</span>
                  <span className={styles.confirmationDetailValue}>{confirmRemoveRule.selector}</span>
                </div>
                {confirmRemoveRule.loc && (
                  <div className={styles.confirmationDetailItem}>
                    <span className={styles.confirmationDetailLabel}>Lines:</span>
                    <span className={styles.confirmationDetailValue}>{confirmRemoveRule.loc.startLine}–{confirmRemoveRule.loc.endLine}</span>
                  </div>
                )}
                <div className={styles.confirmationDetailItem}>
                  <span className={styles.confirmationDetailLabel}>Reason:</span>
                  <span className={styles.confirmationDetailValue}>All declarations are overridden by later rules</span>
                </div>
              </div>
            </div>
            <div className={styles.confirmationActions}>
              <button
                className={styles.confirmationCancelButton}
                onClick={() => setConfirmRemoveRule(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmationRemoveButton}
                onClick={() => {
                  if (onRemoveRule) {
                    const lineRange = confirmRemoveRule.loc ? `${confirmRemoveRule.loc.startLine}–${confirmRemoveRule.loc.endLine}` : null
                    onRemoveRule(confirmRemoveRule.ruleIndex, confirmRemoveRule.selector, lineRange)
                  }
                  setConfirmRemoveRule(null)
                }}
              >
                Remove Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
