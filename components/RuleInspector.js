import React, { useState, useEffect } from 'react'
import { PropertyEditorDispatcher, getPropertyEditorType } from './PropertyEditor'
import { isRuleRedundant } from '../lib/tools/ruleImpactAnalysis'
import { generateRefactorSuggestions } from '../lib/tools/refactorSuggestions'
import { findAllMergeableGroups } from '../lib/tools/mergeSelectors'
import { classifyProperty, getImpactBadgeInfo } from '../lib/propertyClassification'
import OverriddenPropertyModal from './OverriddenPropertyModal'
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
 *   onMergeClick: (mergeableGroups) => void (Phase 7E: callback when user clicks merge button)
 *   rulesTree: CssRuleNode[] (Phase 7E: full rules tree for detecting all mergeable selectors)
 */
export default function RuleInspector({
  selector = null,
  affectingRules = [],
  rulesTree = [],
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
  onRemoveProperty = null,
  onMergeClick = null,
  addedProperties = {},
  onAddPropertyChange = null,
  lockedDisabledProperties = new Set(),
  onLockPropertyChange = null,
  onReEnableProperty = null,
  isPropertyOverriddenByLaterRule = null,
}) {
  const [expandedRules, setExpandedRules] = useState({})
  const [selectedRuleKey, setSelectedRuleKey] = useState(null)
  const [selectedRule, setSelectedRule] = useState(null) // Track the current rule for suggestions
  const [editingProp, setEditingProp] = useState(null) // { ruleIndex, property }
  const [editValues, setEditValues] = useState({}) // Track edited values
  const [expandedSuggestions, setExpandedSuggestions] = useState({}) // Phase 7C: Track which rules have suggestions expanded
  const [confirmRemoveRule, setConfirmRemoveRule] = useState(null) // Phase 7C: Track which rule is being confirmed for removal (null or rule object)
  const [addingPropertyToRule, setAddingPropertyToRule] = useState(null) // Track which rule is in "add property" mode (ruleIndex or null)
  const [newPropertyName, setNewPropertyName] = useState('') // Track the new property name being entered
  const [newPropertyValue, setNewPropertyValue] = useState('') // Track the new property value being entered
  const [overriddenPropertyInfo, setOverriddenPropertyInfo] = useState(null) // Track which overridden property is being viewed (null or { property, ruleIndex, selector })

  // Phase 7E: Find mergeable groups at top level (from full rulesTree, not just affectingRules)
  const mergeableGroups = findAllMergeableGroups(rulesTree)

  // Helper to check if a rule is a duplicate
  const isDuplicateSelector = (ruleSelector) => {
    return mergeableGroups.some(g => g.selector === ruleSelector && g.count > 1)
  }

  // Helper to get the count of duplicates for a selector
  const getDuplicateCount = (ruleSelector) => {
    const group = mergeableGroups.find(g => g.selector === ruleSelector)
    return group ? group.count : 0
  }

  // Helper function to find the overriding rule for a given property in a rule
  // This checks both actual cascade overrides AND properties locked due to duplicates in later rules
  const findOverridingRule = (ruleIndex, selector, property) => {
    for (const rule of affectingRules) {
      // Only check rules that come AFTER this one
      if (rule.ruleIndex <= ruleIndex) continue

      // Check if this later rule has the same selector and contains this property
      if (rule.selector === selector && rule.declarations?.some(d => d.property === property)) {
        return rule
      }

      // Also check if this later rule has an added property with the same name
      // (added properties also override earlier ones)
      const addedKey = `${rule.ruleIndex}::${property}`
      if (rule.selector === selector && addedProperties[addedKey]) {
        return rule
      }
    }
    return null
  }

  // Sync selectedRule when affectingRules prop changes (from external CSS source edits)
  // This ensures the inspector always displays the latest rule content from the source
  // WITHOUT requiring the user to close and re-open the inspector
  useEffect(() => {
    if (!selectedRuleKey || !affectingRules.length) return

    // Find the currently selected rule in the updated affectingRules array
    // The selectedRuleKey format is "{ruleIndex}-{type}"
    const [ruleIndexStr, ruleType] = selectedRuleKey.split('-')
    const ruleIndex = parseInt(ruleIndexStr)

    // Search for the matching rule by ruleIndex and type
    const updatedRule = affectingRules.find(
      rule => rule.ruleIndex === ruleIndex && rule.type === ruleType
    )

    // If found, update the selectedRule state with the fresh rule data
    // This syncs any content changes (new declarations, value changes) from the source
    // Always update when a fresh rule object is found, even if ruleIndex matches,
    // because the parent creates new objects each parse with potentially updated declarations
    if (updatedRule && updatedRule !== selectedRule) {
      setSelectedRule(updatedRule)
    }
  }, [affectingRules, selectedRuleKey])


  if (!selector || !affectingRules.length) {
    return null
  }

  const toggleRuleExpanded = (ruleKey, rule) => {
    const isExpanding = !expandedRules[ruleKey]

    // When expanding, close all other rules (mutually exclusive accordions)
    // When collapsing, just toggle the current one
    if (isExpanding) {
      setExpandedRules({
        [ruleKey]: true,
      })
    } else {
      setExpandedRules(prev => ({
        ...prev,
        [ruleKey]: false,
      }))
    }

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

  // Handle removing a property from a rule
  const handleRemoveProperty = (ruleIndex, property, isAddedProperty = false) => {
    // If it's an added property, remove it from addedProperties state
    if (isAddedProperty) {
      const key = `${ruleIndex}::${property}`
      if (onAddPropertyChange) {
        onAddPropertyChange(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
    } else {
      // If it's an original property, remove it from the CSS rules tree
      const rule = affectingRules.find(r => r.ruleIndex === ruleIndex)
      if (rule && onRemoveProperty) {
        onRemoveProperty(ruleIndex, rule.selector, property)
      }
    }
  }

  const getPropertyImpactClass = (property) => {
    // Return the impact classification for styling
    const impact = classifyProperty(property)
    return `impact-${impact}`
  }

  // Handle adding a new property to a rule
  const handleAddNewProperty = (rule) => {
    if (!newPropertyName.trim() || !newPropertyValue.trim()) {
      return // Require both name and value
    }

    // Normalize property name (convert to lowercase, handle space-separated words)
    const propertyName = newPropertyName.trim().toLowerCase()
    const propertyValue = newPropertyValue.trim()

    // Track this as an added property (key: "ruleIndex::property" for line-specific scoping)
    const addedPropertyKey = `${rule.ruleIndex}::${propertyName}`

    // Check if this property already exists in this rule (in original declarations)
    const existingProperty = rule.declarations?.find(d => d.property === propertyName)

    // Update added properties via the callback
    if (onAddPropertyChange) {
      onAddPropertyChange(prev => ({
        ...prev,
        [addedPropertyKey]: propertyValue,
      }))
    }

    // Call the onPropertyEdit callback to add this as a staged edit
    if (onPropertyEdit) {
      onPropertyEdit(rule.selector, propertyName, propertyValue, true, rule.ruleIndex)
    }

    // Note: Impact recomputation is triggered by the useEffect that watches addedProperties
    // This ensures state has been fully updated before computing impact

    // Reset the form and close the add-property mode
    setAddingPropertyToRule(null)
    setNewPropertyName('')
    setNewPropertyValue('')
  }

  // Phase 7C: Render refactor suggestions for a selected rule (collapsed by default)
  const renderRefactorSuggestions = (ruleKey) => {
    if (!selectedRule || !selectedRuleImpact) return null

    const suggestions = generateRefactorSuggestions(selectedRule, selectedRuleImpact, rulesTree)
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
                {suggestion.type === 'mergeable' && onMergeClick && mergeableGroups.length > 0 && (
                  <button
                    className={styles.applyRefactorButton}
                    onClick={() => onMergeClick(mergeableGroups)}
                    title="Open confirmation to merge duplicate selectors"
                  >
                    🧩 Merge Selectors…
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
    if (!selectedRule) return null

    // Build properties list with cascade status
    const propertiesWithStatus = []

    // Add original declarations
    if (selectedRule.declarations && selectedRule.declarations.length > 0) {
      selectedRule.declarations.forEach(decl => {
        const isOverridden = isPropertyOverriddenByLaterRule?.(selectedRule.ruleIndex, selectedRule.selector, decl.property)
        propertiesWithStatus.push({
          property: decl.property,
          effective: !isOverridden,
          value: decl.value,
          isOriginal: true,
        })
      })
    }

    // Add added properties (but skip if already in original declarations)
    Object.entries(addedProperties).forEach(([key, value]) => {
      const [addedRuleIndex, propertyName] = key.split('::')
      if (parseInt(addedRuleIndex) === selectedRule.ruleIndex) {
        // Skip if this property already exists in original declarations
        // (it will be rendered above as a regular property)
        if (selectedRule.declarations?.some(d => d.property === propertyName)) {
          return
        }

        const isOverridden = isPropertyOverriddenByLaterRule?.(selectedRule.ruleIndex, selectedRule.selector, propertyName)
        propertiesWithStatus.push({
          property: propertyName,
          effective: !isOverridden,
          value: value,
          isAdded: true,
        })
      }
    })

    const { affectedNodes = [] } = selectedRuleImpact || {}

    // Phase 7B: Detect redundant rules (CSS-only analysis)
    const redundancyInfo = isRuleRedundant(selectedRuleImpact)

    if (affectedNodes.length === 0 && propertiesWithStatus.length === 0) {
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
      <div className={`${styles.impactInfo} ${redundancyInfo?.isRedundant ? styles.impactInfoRedundant : ''}`}>
        {redundancyInfo?.isRedundant && (
          <div className={styles.redundancyIndicator}>
            🔄 <strong>Fully Overridden</strong> — {redundancyInfo.reason}
          </div>
        )}

        {/* Show properties with cascade status */}
        {propertiesWithStatus.length > 0 && (
          <div className={styles.impactSection}>
            <div className={styles.impactLabel}>Affects (Direct Matches):</div>
            <div className={styles.impactProperties}>
              {propertiesWithStatus.map((prop, idx) => (
                <div key={idx} className={styles.impactProperty}>
                  <span className={styles.impactPropName}>{prop.property}</span>
                  <span className={prop.effective ? styles.impactEffective : styles.impactInert}>
                    {prop.effective ? '(effective)' : '(overridden)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show affected nodes if available */}
        {affectedNodes.map((node, idx) => (
          <div key={idx} className={styles.impactSection}>
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
              <div className={`${styles.ruleHeaderContainer} ${isExpanded ? styles.expanded : ''}`}>
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
                  {isDuplicateSelector(rule.selector) && (
                    <span className={styles.duplicateIndicator} title="This selector is defined multiple times and can be merged">
                      🧩 ×{getDuplicateCount(rule.selector)}
                    </span>
                  )}
                  <span className={styles.specificity}>
                    {getSpecificityLabel(rule.specificity)}
                  </span>
                  {rule.loc && (
                    <span className={styles.lineNumber}>
                      Line {rule.loc.startLine}
                    </span>
                  )}
                </button>
                {isDuplicateSelector(rule.selector) && onMergeClick && (
                  <button
                    className={styles.mergeButtonCompact}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMergeClick(mergeableGroups)
                    }}
                    title="Merge all duplicate selectors"
                  >
                    ⎚
                  </button>
                )}
              </div>

              {isExpanded && (
                <>
                  {selectedRuleKey === ruleKey && (
                    <>
                      {renderImpactInfo()}
                      {renderRefactorSuggestions(ruleKey)}
                    </>
                  )}
                  <div className={styles.declarationsContainer}>
                  {(() => {
                    // Check if this rule has any added properties
                    const hasAddedPropsForRule = Object.keys(addedProperties).some(key => {
                      const [ruleIndex] = key.split('::')
                      return parseInt(ruleIndex) === rule.ruleIndex
                    })
                    const hasDeclarations = rule.declarations && rule.declarations.length > 0

                    return (hasDeclarations || hasAddedPropsForRule) ? (
                    <div className={styles.declarations}>
                      {rule.declarations?.map((decl, declIdx) => {
                        const impactClass = getPropertyImpactClass(decl.property)
                        const impactInfo = getImpactBadgeInfo(decl.property)
                        const propKey = `${ruleKey}-${decl.property}`
                        const disabledKey = `${rule.ruleIndex}-${decl.property}`
                        const isPropertyDisabled = disabledProperties.has(disabledKey)
                        const isEditing = editingProp?.propKey === propKey
                        const editedValue = editValues[propKey] !== undefined ? editValues[propKey] : decl.value
                        const isOverridden = isPropertyOverriddenByLaterRule?.(rule.ruleIndex, rule.selector, decl.property)

                        return (
                          <div
                            key={declIdx}
                            className={`${styles.declaration} ${styles[impactClass]}`}
                          >
                            {onTogglePropertyDisabled && (
                              <button
                                className={`${styles.propertyToggleBtn} ${isPropertyDisabled ? styles.propertyToggleBtnActive : ''}`}
                                onClick={() => {
                                  if (isOverridden) {
                                    setOverriddenPropertyInfo({
                                      property: decl.property,
                                      ruleIndex: rule.ruleIndex,
                                      selector: rule.selector,
                                    })
                                  } else {
                                    onTogglePropertyDisabled(rule.ruleIndex, decl.property)
                                  }
                                }}
                                disabled={lockedDisabledProperties.has(`${rule.ruleIndex}-${decl.property}`)}
                                title={
                                  isOverridden
                                    ? `Click to see why ${decl.property} is overridden`
                                    : lockedDisabledProperties.has(`${rule.ruleIndex}-${decl.property}`)
                                    ? `Locked (disabled because a duplicate was added)`
                                    : isPropertyDisabled ? `Enable ${decl.property}` : `Disable ${decl.property} (what-if simulation)`
                                }
                              >
                                {isPropertyDisabled ? '✗' : '•'}
                              </button>
                            )}
                            <span className={styles.impactBadge} title={impactInfo.description}>
                              {impactInfo.emoji}
                            </span>

                            {!isEditing && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flex: 1,
                                  cursor: 'pointer',
                                  minWidth: 0,
                                }}
                                onClick={() => {
                                  if (isOverridden) {
                                    setOverriddenPropertyInfo({
                                      property: decl.property,
                                      ruleIndex: rule.ruleIndex,
                                      selector: rule.selector,
                                    })
                                  }
                                }}
                              >
                                <span className={styles.property}>{decl.property}</span>
                                <span className={styles.colon}>:</span>
                                <span className={styles.value}>{editedValue}</span>
                              </div>
                            )}

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
                                      onPropertyEdit(rule.selector, decl.property, newValue, false, rule.ruleIndex)
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
                                {isOverridden ? (
                                  <button
                                    className={styles.editButton}
                                    title={`Click to see why ${decl.property} is overridden`}
                                    onClick={() => {
                                      setOverriddenPropertyInfo({
                                        property: decl.property,
                                        ruleIndex: rule.ruleIndex,
                                        selector: rule.selector,
                                      })
                                    }}
                                  >
                                    ⓘ
                                  </button>
                                ) : (
                                  <button
                                    className={styles.editButton}
                                    title={`Edit ${decl.property}`}
                                    onClick={() => {
                                      setEditingProp({ propKey, ruleIndex: rule.ruleIndex })
                                    }}
                                  >
                                    ✎
                                  </button>
                                )}
                                {onRemoveProperty && (
                                  <button
                                    className={styles.removeAddedPropertyButton}
                                    title={`Remove ${decl.property}`}
                                    onClick={() => {
                                      handleRemoveProperty(rule.ruleIndex, decl.property, false)
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}

                      {/* Render added properties (new properties that don't exist in original rule) */}
                      {Object.entries(addedProperties).map(([key, value]) => {
                        const [addedRuleIndex, addedPropertyName] = key.split('::')

                        // Only show added properties for this rule (matched by ruleIndex)
                        if (parseInt(addedRuleIndex) !== rule.ruleIndex) return null

                        // Skip if this property already exists in the original declarations
                        // (it will be rendered above as a regular declaration, not as an added property)
                        if (rule.declarations?.some(d => d.property === addedPropertyName)) {
                          return null
                        }

                        const propKey = `${ruleKey}-${addedPropertyName}`
                        const isEditing = editingProp?.propKey === propKey
                        const editedValue = editValues[propKey] !== undefined ? editValues[propKey] : value
                        const impactClass = getPropertyImpactClass(addedPropertyName)
                        const impactInfo = getImpactBadgeInfo(addedPropertyName)
                        // Use a different key format for added properties so they don't share disabled state with originals
                        const disabledKey = `${rule.ruleIndex}::ADDED::${addedPropertyName}`
                        const isPropertyDisabled = disabledProperties.has(disabledKey)
                        // Check if the added property is overridden by a later rule
                        const isOverridden = isPropertyOverriddenByLaterRule?.(rule.ruleIndex, rule.selector, addedPropertyName)

                        return (
                          <div
                            key={key}
                            className={`${styles.declaration} ${styles[impactClass]} ${styles.addedProperty}`}
                          >
                            {onTogglePropertyDisabled && (
                              <button
                                className={`${styles.propertyToggleBtn} ${isPropertyDisabled ? styles.propertyToggleBtnActive : ''}`}
                                onClick={() => {
                                  if (isOverridden) {
                                    setOverriddenPropertyInfo({
                                      property: addedPropertyName,
                                      ruleIndex: rule.ruleIndex,
                                      selector: rule.selector,
                                    })
                                  } else {
                                    onTogglePropertyDisabled(rule.ruleIndex, addedPropertyName, true)
                                  }
                                }}
                                disabled={false}
                                title={
                                  isOverridden
                                    ? `Click to see why ${addedPropertyName} is overridden`
                                    : isPropertyDisabled ? `Enable ${addedPropertyName}` : `Disable ${addedPropertyName} (what-if simulation)`
                                }
                              >
                                {isPropertyDisabled ? '✗' : '•'}
                              </button>
                            )}
                            <span className={styles.impactBadge} title={impactInfo.description}>
                              {impactInfo.emoji}
                            </span>

                            {!isEditing && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flex: 1,
                                  cursor: 'pointer',
                                  minWidth: 0,
                                }}
                                onClick={() => {
                                  if (isOverridden) {
                                    setOverriddenPropertyInfo({
                                      property: addedPropertyName,
                                      ruleIndex: rule.ruleIndex,
                                      selector: rule.selector,
                                    })
                                  }
                                }}
                              >
                                <span className={styles.property}>{addedPropertyName}</span>
                                <span className={styles.colon}>:</span>
                                <span className={styles.value}>{editedValue}</span>
                              </div>
                            )}

                            {isEditing ? (
                              <div className={styles.editorContainer}>
                                <PropertyEditorDispatcher
                                  property={addedPropertyName}
                                  value={editedValue}
                                  onChange={(newValue) => {
                                    setEditValues(prev => ({
                                      ...prev,
                                      [propKey]: newValue,
                                    }))

                                    // Call the callback for real-time preview
                                    if (onPropertyEdit) {
                                      onPropertyEdit(rule.selector, addedPropertyName, newValue, true, rule.ruleIndex)
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
                                {isOverridden ? (
                                  <button
                                    className={styles.editButton}
                                    title={`Click to see why ${addedPropertyName} is overridden`}
                                    onClick={() => {
                                      setOverriddenPropertyInfo({
                                        property: addedPropertyName,
                                        ruleIndex: rule.ruleIndex,
                                        selector: rule.selector,
                                      })
                                    }}
                                  >
                                    ⓘ
                                  </button>
                                ) : (
                                  <button
                                    className={styles.editButton}
                                    title={`Edit ${addedPropertyName}`}
                                    onClick={() => {
                                      setEditingProp({ propKey, ruleIndex: rule.ruleIndex })
                                    }}
                                  >
                                    ✎
                                  </button>
                                )}
                                <button
                                  className={styles.removeAddedPropertyButton}
                                  title={`Remove ${addedPropertyName}`}
                                  onClick={() => {
                                    handleRemoveProperty(rule.ruleIndex, addedPropertyName, true)
                                  }}
                                >
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    ) : (
                      <div className={styles.noDeclarations}>No declarations</div>
                    )
                  })()}

                  {/* Add New Property Section */}
                  <div className={styles.addPropertySection}>
                    {addingPropertyToRule === rule.ruleIndex ? (
                      <div className={styles.addPropertyForm}>
                        <input
                          type="text"
                          className={styles.propertyInput}
                          placeholder="property name"
                          value={newPropertyName}
                          onChange={(e) => setNewPropertyName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNewProperty(rule)
                            } else if (e.key === 'Escape') {
                              setAddingPropertyToRule(null)
                              setNewPropertyName('')
                              setNewPropertyValue('')
                            }
                          }}
                          autoFocus
                        />
                        <span className={styles.colon}>:</span>
                        <input
                          type="text"
                          className={styles.valueInput}
                          placeholder="value"
                          value={newPropertyValue}
                          onChange={(e) => setNewPropertyValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNewProperty(rule)
                            } else if (e.key === 'Escape') {
                              setAddingPropertyToRule(null)
                              setNewPropertyName('')
                              setNewPropertyValue('')
                            }
                          }}
                        />
                        <button
                          className={styles.confirmAddButton}
                          onClick={() => handleAddNewProperty(rule)}
                          title="Add new property"
                        >
                          ✓
                        </button>
                        <button
                          className={styles.cancelAddButton}
                          onClick={() => {
                            setAddingPropertyToRule(null)
                            setNewPropertyName('')
                            setNewPropertyValue('')
                          }}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className={styles.addPropertyButton}
                        onClick={() => setAddingPropertyToRule(rule.ruleIndex)}
                        title="Add a new property to this rule"
                      >
                        + Add Property
                      </button>
                    )}
                  </div>
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

      {overriddenPropertyInfo && (() => {
        const { property, ruleIndex, selector } = overriddenPropertyInfo
        const overridingRule = findOverridingRule(ruleIndex, selector, property)

        return (
          <OverriddenPropertyModal
            property={property}
            ruleIndex={ruleIndex}
            selector={selector}
            overridingRuleIndex={overridingRule?.ruleIndex}
            overridingRule={overridingRule}
            affectingRules={affectingRules}
            mergeableGroups={mergeableGroups}
            onMergeClick={onMergeClick}
            onClose={() => setOverriddenPropertyInfo(null)}
          />
        )
      })()}
    </div>
  )
}
