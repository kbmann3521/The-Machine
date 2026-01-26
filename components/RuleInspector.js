import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { PropertyEditorDispatcher, getPropertyEditorType } from './PropertyEditor'
import { isRuleRedundant } from '../lib/tools/ruleImpactAnalysis'
import { generateRefactorSuggestions } from '../lib/tools/refactorSuggestions'
import { findAllMergeableGroups } from '../lib/tools/mergeSelectors'
import { getAllKeyframesFromTree } from '../lib/tools/syntheticDom'
import { classifyProperty, getImpactBadgeInfo } from '../lib/propertyClassification'
import OverriddenPropertyModal from './OverriddenPropertyModal'
import DuplicateSelectorsModal from './DuplicateSelectorsModal'
import { CSS_PROPERTIES, CSS_UNITS, CSS_COLORS } from './CSSEditorInput'
import styles from '../styles/rule-inspector.module.css'

/**
 * Helper to extract unit portion from a value string
 * For example: "10p" -> "p", "12em" -> "em", "100" -> ""
 */
function extractUnitPart(valueStr) {
  if (!valueStr) return ''
  return valueStr.replace(/^[\d.]+/, '').toLowerCase()
}

/**
 * Helper to get origin label for a rule
 * Returns formatted string like "HTML <style>" or "CSS tab"
 */
function getOriginLabel(rule) {
  if (!rule?.origin) return 'CSS'
  const source = rule.origin.source

  if (source === 'html') {
    return 'HTML <style>'
  } else if (source === 'css') {
    return 'CSS tab'
  }
  return 'CSS'
}

/**
 * Helper to get cascade status label
 * Returns "(effective)" or "(overridden)" with origin info
 */
function getCascadeStatusLabel(rule, isOverridden) {
  const origin = getOriginLabel(rule)
  const status = isOverridden ? 'overridden' : 'effective'
  return `${origin} • ${status}`
}

/**
 * AutocompleteInput Component
 * Provides a text input with dropdown suggestions and keyboard navigation
 */
function AutocompleteInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  suggestions = [],
  className,
  autoFocus = false,
  onSelectAndMove = null, // Called when user selects an item via Enter/Tab
  isUnitInput = false, // Special handling for unit input (extract unit part from value)
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const justSelectedRef = useRef(false)

  useEffect(() => {
    if (value && value.length > 0) {
      // If we just selected a suggestion, close the dropdown and don't reopen it
      if (justSelectedRef.current) {
        setIsOpen(false)
        justSelectedRef.current = false
        return
      }

      let searchTerm = value.toLowerCase()

      // For unit input, extract just the unit part (after digits)
      if (isUnitInput) {
        searchTerm = extractUnitPart(value)
      }

      const filtered = suggestions.filter(s =>
        s.toLowerCase().startsWith(searchTerm)
      )
      setFiltered(filtered)
      setIsOpen(filtered.length > 0)
      setSelectedIndex(0) // Auto-select first option
    } else {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }, [value, suggestions, isUnitInput])

  const handleSelect = (suggestion) => {
    let newValue = suggestion

    // For unit input, we need to replace just the unit part
    // For example: "10p" + select "px" -> "10px"
    if (isUnitInput && value) {
      const unitPart = extractUnitPart(value)
      // Replace the unit part with the selected suggestion
      const digitsPart = value.substring(0, value.length - unitPart.length)
      newValue = digitsPart + suggestion
    }

    // Mark that we just selected, to prevent dropdown from reopening
    justSelectedRef.current = true

    // Update the input directly via the ref and parent onChange
    onChange({ target: { value: newValue } })
    setIsOpen(false)
    setSelectedIndex(-1)

    // Call the callback to move to next input or complete action
    if (onSelectAndMove) {
      setTimeout(() => {
        onSelectAndMove()
      }, 0)
    } else {
      // Refocus the input after selection if no callback
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        width: '100%',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (isOpen && filtered.length > 0) {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSelectedIndex(prev =>
                prev < filtered.length - 1 ? prev + 1 : 0
              )
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSelectedIndex(prev =>
                prev > 0 ? prev - 1 : filtered.length - 1
              )
            } else if (e.key === 'Enter') {
              e.preventDefault()
              const selected = filtered[selectedIndex >= 0 ? selectedIndex : 0]
              if (selected) {
                handleSelect(selected)
                onSelectAndMove?.('next')
              }
            } else if (e.key === 'Tab') {
              e.preventDefault()
              const selected = filtered[selectedIndex >= 0 ? selectedIndex : 0]
              if (selected) {
                handleSelect(selected)
                onSelectAndMove?.('next')
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false)
              setSelectedIndex(-1)
              onKeyDown?.(e)
            } else {
              onKeyDown?.(e)
            }
          } else {
            onKeyDown?.(e)
          }
        }}
        onBlur={() => {
          setIsOpen(false)
          setSelectedIndex(-1)
        }}
        onFocus={() => {
          if (value && value.length > 0) {
            setIsOpen(filtered.length > 0)
          }
        }}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {isOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: 'max-content',
          minWidth: '100%',
          backgroundColor: 'var(--color-background-primary, #fff)',
          border: '1px solid var(--color-border, #ddd)',
          borderRadius: '4px',
          maxHeight: '180px',
          overflowY: 'auto',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          marginTop: '2px',
        }}>
          {filtered.slice(0, 8).map((suggestion, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect(suggestion)
              }}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                backgroundColor: idx === selectedIndex ? 'rgba(0, 102, 204, 0.2)' : 'transparent',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border, #eee)' : 'none',
                fontSize: '12px',
                transition: 'background-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              onMouseLeave={() => {}}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
 *   onHighlightSelector: (selector) => void (Phase 7F: highlight selector in preview)
 *   highlightedSelector: string | null (Phase 7F: currently highlighted selector)
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
  onHighlightSelector = null,
  highlightedSelector = null,
  availableSelectors = [],
  onAddNewSelector = null,
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
  const [selectedNewSelector, setSelectedNewSelector] = useState('') // Track the selected selector for adding new rule
  const [showSelectorDropdown, setShowSelectorDropdown] = useState(false) // Track dropdown visibility
  const [hoveredSelector, setHoveredSelector] = useState(null) // Track which selector is hovered in dropdown
  const [showDuplicatesModalFor, setShowDuplicatesModalFor] = useState(null) // Track which selector's duplicates modal is open (null or selector string)
  const selectorDropdownButtonRef = useRef(null) // Ref to the dropdown button for position calculation

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
    // The selectedRuleKey format is "{ruleIndex}::{type}::{origin}"
    const [ruleIndexStr, ruleType, origin] = selectedRuleKey.split('::')
    const ruleIndex = parseInt(ruleIndexStr)

    // Search for the matching rule by ruleIndex, type, and origin
    const updatedRule = affectingRules.find(
      rule => {
        const ruleOrigin = rule.origin?.source || 'css'
        return rule.ruleIndex === ruleIndex && rule.type === ruleType && ruleOrigin === origin
      }
    )

    // If found, update the selectedRule state with the fresh rule data
    // This syncs any content changes (new declarations, value changes) from the source
    // Always update when a fresh rule object is found, even if ruleIndex matches,
    // because the parent creates new objects each parse with potentially updated declarations
    if (updatedRule && updatedRule !== selectedRule) {
      setSelectedRule(updatedRule)
    }
  }, [affectingRules, selectedRuleKey])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!showSelectorDropdown) return

    const handleClickOutside = (e) => {
      if (selectorDropdownButtonRef.current && !selectorDropdownButtonRef.current.contains(e.target)) {
        setShowSelectorDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSelectorDropdown])

  if (!selector || !affectingRules.length) {
    return null
  }

  // Get all keyframes from the rules tree (moved to component level for global access)
  const allKeyframes = getAllKeyframesFromTree(rulesTree)

  const toggleRuleExpanded = (ruleKey, rule) => {
    const isExpanding = !expandedRules[ruleKey]
    const isKeyframeChild = ruleKey.includes('::keyframe::')

    // For keyframe children (from/to inside @keyframes), allow independent expansion
    // without affecting other rules
    if (isKeyframeChild) {
      setExpandedRules(prev => ({
        ...prev,
        [ruleKey]: !prev[ruleKey],
      }))
      return
    }

    // For regular rules and keyframe parents: use mutually exclusive behavior
    // When expanding, close all other rules
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
    // CSS specificity breakdown: (IDs × 100) + (classes × 10) + (elements × 1)
    // Reverse-engineer the components from the score
    if (score === 0) return '(universal)'

    const idCount = Math.floor(score / 100)
    const classCount = Math.floor((score % 100) / 10)
    const elementCount = score % 10

    const parts = []
    if (idCount > 0) parts.push(`${idCount} ID${idCount !== 1 ? 's' : ''}`)
    if (classCount > 0) parts.push(`${classCount} class${classCount !== 1 ? 'es' : ''}`)
    if (elementCount > 0) parts.push(`${elementCount} element${elementCount !== 1 ? 's' : ''}`)

    // If no parts (shouldn't happen), show the score
    if (parts.length === 0) return `(${score})`

    return `(${parts.join(' + ')})`
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

    // Phase 7F: Show highlight button when no direct matches (regardless of properties)
    const shouldShowHighlight = affectedNodes.length === 0
    const isHighlighted = highlightedSelector === selectedRule?.selector

    return (
      <div className={`${styles.impactInfo} ${redundancyInfo?.isRedundant ? styles.impactInfoRedundant : ''}`}>
        {redundancyInfo?.isRedundant && (
          <div className={styles.redundancyIndicator}>
            🔄 <strong>Fully Overridden</strong> — {redundancyInfo.reason}
          </div>
        )}

        {/* Show highlight button when no direct matches */}
        {shouldShowHighlight && (
          <div className={styles.impactSection}>
            <button
              className={`${styles.highlightSelectorButton} ${isHighlighted ? styles.highlightSelectorButtonActive : ''}`}
              onClick={() => onHighlightSelector?.(selectedRule.selector)}
              title={isHighlighted ? 'Click to remove highlight' : 'Show the bounding box of this selector in the preview'}
            >
              {isHighlighted ? '✓ Highlighting' : '👁 Show Bounding Box'}
            </button>
          </div>
        )}

        {/* Show properties with cascade status (only if there are properties) */}
        {propertiesWithStatus.length > 0 && (
          <div className={`${styles.impactSection} ${shouldShowHighlight ? styles.impactSectionWithButton : ''}`}>
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

      {/* Add New Selector Section - DISABLED (read-only mode) */}
      {/* {availableSelectors && availableSelectors.length > 0 && onAddNewSelector && (
        ... section hidden for read-only mode ...
      )} */}

      <div className={styles.rulesList}>
        {(() => {
          return (
            <>
              {/* Regular affecting rules section */}
              {affectingRules.map((rule, idx) => {
                // Include origin in ruleKey to distinguish rules with same selector from different sources
                const origin = rule.origin?.source || 'css'
                const ruleKey = `${rule.ruleIndex}::${rule.type}::${origin}`
                const isExpanded = expandedRules[ruleKey]

                return (
                  <div key={ruleKey} className={styles.ruleItem}>
              <div className={`${styles.ruleHeaderContainer} ${isExpanded ? styles.expanded : ''}`}>
                <button
                  className={`${styles.ruleHeader} ${isExpanded ? styles.expanded : ''}`}
                  onClick={() => toggleRuleExpanded(ruleKey, rule)}
                  onMouseEnter={() => {
                    // Show bounding box for this selector on hover
                    if (onHighlightSelector && highlightedSelector !== rule.selector) {
                      onHighlightSelector(rule.selector)
                    }
                  }}
                  onMouseLeave={() => {
                    // Remove bounding box when leaving
                    if (onHighlightSelector && highlightedSelector === rule.selector) {
                      onHighlightSelector(rule.selector)
                    }
                  }}
                  title={`Specificity: ${getSpecificityLabel(rule.specificity)}${rule.loc ? ` • Line ${rule.loc.startLine}` : ''}`}
                >
                  <div className={styles.ruleHeaderTop}>
                    <span className={styles.ruleChevron}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className={styles.ruleLabel}>
                      {getRuleTypeLabel(rule)}
                    </span>
                  </div>
                  <div className={styles.ruleHeaderBottom}>
                    <span className={styles.ruleOrigin} title={`Origin: ${getOriginLabel(rule)}`}>
                      {getOriginLabel(rule)}
                    </span>
                  </div>
                </button>
                {isDuplicateSelector(rule.selector) && (
                  <>
                    <button
                      className={styles.duplicateIndicatorButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDuplicatesModalFor(rule.selector)
                      }}
                      title="Show all duplicate selector locations"
                    >
                      🧩 DUPLICATE
                    </button>
                    {/* Merge Button - DISABLED (read-only mode) */}
                    {/* {onMergeClick && (
                      <button
                        className={styles.duplicateIndicatorButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          onMergeClick(mergeableGroups, rule.selector)
                        }}
                        title="Merge all duplicate selectors"
                      >
                        🧩 ×{getDuplicateCount(rule.selector)}
                      </button>
                    )} */}
                  </>
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
                            className={`${styles.declaration} ${styles[impactClass]} ${isOverridden ? styles.propertyOverridden : ''}`}
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
                                {!isPropertyDisabled ? '✓' : ''}
                              </button>
                            )}
                            <span className={styles.impactBadge} title={impactInfo.description}>
                              {impactInfo.emoji}
                            </span>

                            {!isEditing && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '4px',
                                  flex: 1,
                                  cursor: 'pointer',
                                  minWidth: 0,
                                  flexWrap: 'wrap',
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
                                {/* Remove Property Button - DISABLED (read-only mode) */}
                                {/* {onRemoveProperty && (
                                  <button
                                    className={styles.removeAddedPropertyButton}
                                    title={`Remove ${decl.property}`}
                                    onClick={() => {
                                      handleRemoveProperty(rule.ruleIndex, decl.property, false)
                                    }}
                                  >
                                    ✕
                                  </button>
                                )} */}
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
                            className={`${styles.declaration} ${styles[impactClass]} ${styles.addedProperty} ${isOverridden ? styles.propertyOverridden : ''}`}
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
                                {!isPropertyDisabled ? '✓' : ''}
                              </button>
                            )}
                            <span className={styles.impactBadge} title={impactInfo.description}>
                              {impactInfo.emoji}
                            </span>

                            {!isEditing && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '4px',
                                  flex: 1,
                                  cursor: 'pointer',
                                  minWidth: 0,
                                  flexWrap: 'wrap',
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
                                {/* Remove Added Property Button - DISABLED (read-only mode) */}
                                {/* <button
                                  className={styles.removeAddedPropertyButton}
                                  title={`Remove ${addedPropertyName}`}
                                  onClick={() => {
                                    handleRemoveProperty(rule.ruleIndex, addedPropertyName, true)
                                  }}
                                >
                                  ✕
                                </button> */}
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

                  {/* Add New Property Section - DISABLED (read-only mode) */}
                  {/* <div className={styles.addPropertySection}>
                    ... section hidden for read-only mode ...
                  </div> */}
                </div>
                </>
              )}
                  </div>
                )
              })}

              {/* Keyframes section - separate category */}
              {allKeyframes.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '2px solid var(--color-border, #ddd)',
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-secondary, #666)',
                    padding: '0 8px 16px 8px',
                  }}>
                    🎬 Keyframes
                  </div>
                  {allKeyframes.map((keyframeGroup, keyframeIdx) => {
                    // Use parentRuleIndex and array index to create unique key
                    const keyframeParentKey = `keyframes::${keyframeGroup.parentRuleIndex}::${keyframeGroup.name}`
                    const isKeyframeExpanded = expandedRules[keyframeParentKey]

                    // Check for duplicate keyframe names
                    const duplicateCount = allKeyframes.filter(kf => kf.name === keyframeGroup.name).length
                    const isDuplicateKeyframe = duplicateCount > 1

                    return (
                      <div key={keyframeParentKey} className={styles.ruleItem} style={{ marginBottom: '8px' }}>
                        <div className={`${styles.ruleHeaderContainer} ${isKeyframeExpanded ? styles.expanded : ''}`}>
                          <button
                            className={`${styles.ruleHeader} ${isKeyframeExpanded ? styles.expanded : ''}`}
                            onClick={() => toggleRuleExpanded(keyframeParentKey, null)}
                            title={`Keyframe animation: ${keyframeGroup.name}`}
                            style={{ padding: '12px 12px' }}
                          >
                            <div className={styles.ruleHeaderTop}>
                              <span className={styles.ruleChevron}>
                                {isKeyframeExpanded ? '▼' : '▶'}
                              </span>
                              <span className={styles.ruleLabel}>
                                @keyframes <strong>{keyframeGroup.name}</strong>
                              </span>
                            </div>
                          </button>
                          {isDuplicateKeyframe && (
                            <button
                              className={styles.duplicateIndicatorButton}
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDuplicatesModalFor(`@keyframes ${keyframeGroup.name}`)
                              }}
                              title="Show all duplicate keyframe locations"
                            >
                              🧩 DUPLICATE
                            </button>
                          )}
                        </div>

                        {isKeyframeExpanded && (
                          <div style={{
                            paddingLeft: '16px',
                            paddingRight: '8px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            borderLeft: '2px solid var(--color-border, #ddd)',
                          }}>
                            {keyframeGroup.rules.map((keyframeRule) => {
                              const keyframeInnerKey = `${keyframeRule.ruleIndex}::keyframe::${keyframeGroup.parentRuleIndex}`
                              const isKeyframeInnerExpanded = expandedRules[keyframeInnerKey]

                              // Find if this keyframe step's property is overridden by a LATER DUPLICATE keyframe instance
                              const findKeyframeOverridingRule = (property) => {
                                // Look for LATER keyframe instances with the same name that have this step and property
                                const currentKeyframeGroupIndex = allKeyframes.indexOf(keyframeGroup)
                                for (let i = currentKeyframeGroupIndex + 1; i < allKeyframes.length; i++) {
                                  const laterKeyframeGroup = allKeyframes[i]
                                  // Only check later instances of the SAME animation name
                                  if (laterKeyframeGroup.name !== keyframeGroup.name) continue

                                  // Check if this later instance has the same step with this property
                                  const matchingLaterStep = laterKeyframeGroup.rules.find(
                                    rule => rule.selector === keyframeRule.selector &&
                                            rule.declarations?.some(d => d.property === property)
                                  )

                                  if (matchingLaterStep) {
                                    return matchingLaterStep
                                  }
                                }
                                return null
                              }

                              return (
                                <div
                                  key={keyframeInnerKey}
                                  className={styles.ruleItem}
                                  style={{ marginBottom: '8px' }}
                                >
                                  <div className={`${styles.ruleHeaderContainer} ${isKeyframeInnerExpanded ? styles.expanded : ''}`}>
                                    <button
                                      className={`${styles.ruleHeader} ${isKeyframeInnerExpanded ? styles.expanded : ''}`}
                                      onClick={() => toggleRuleExpanded(keyframeInnerKey, keyframeRule)}
                                      title={`${keyframeRule.selector} in @keyframes ${keyframeGroup.name}`}
                                    >
                                      <div className={styles.ruleHeaderTop}>
                                        <span className={styles.ruleChevron}>
                                          {isKeyframeInnerExpanded ? '▼' : '▶'}
                                        </span>
                                        <span className={styles.ruleLabel}>
                                          {keyframeRule.selector}
                                        </span>
                                      </div>
                                    </button>
                                  </div>

                                  {isKeyframeInnerExpanded && (
                                    <div className={styles.declarationsContainer}>
                                      {keyframeRule.declarations && keyframeRule.declarations.length > 0 ? (
                                        <div className={styles.declarations}>
                                          {keyframeRule.declarations.map((decl, declIdx) => {
                                            const impactInfo = getImpactBadgeInfo(decl.property)
                                            const isOverriddenByLaterStep = findKeyframeOverridingRule(decl.property)

                                            return (
                                              <div key={declIdx} className={`${styles.declaration} ${isOverriddenByLaterStep ? styles.propertyOverridden : ''}`}>
                                                <span className={styles.impactBadge} title={impactInfo.description}>
                                                  {impactInfo.emoji}
                                                </span>
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '4px',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    flexWrap: 'wrap',
                                                    cursor: isOverriddenByLaterStep ? 'pointer' : 'default',
                                                  }}
                                                  onClick={() => {
                                                    if (isOverriddenByLaterStep) {
                                                      setOverriddenPropertyInfo({
                                                        property: decl.property,
                                                        ruleIndex: keyframeRule.ruleIndex,
                                                        selector: `@keyframes ${keyframeGroup.name} → ${keyframeRule.selector}`,
                                                        isKeyframeRule: true,
                                                        overridingStepName: isOverriddenByLaterStep.selector,
                                                      })
                                                    }
                                                  }}
                                                >
                                                  <span className={styles.property}>{decl.property}</span>
                                                  <span className={styles.colon}>:</span>
                                                  <span className={styles.value}>{decl.value}</span>
                                                </div>
                                                {isOverriddenByLaterStep && (
                                                  <button
                                                    className={styles.editButton}
                                                    title={`Property overridden by ${isOverriddenByLaterStep.selector}`}
                                                    onClick={() => {
                                                      setOverriddenPropertyInfo({
                                                        property: decl.property,
                                                        ruleIndex: keyframeRule.ruleIndex,
                                                        selector: `@keyframes ${keyframeGroup.name} → ${keyframeRule.selector}`,
                                                        isKeyframeRule: true,
                                                        overridingStepName: isOverriddenByLaterStep.selector,
                                                      })
                                                    }}
                                                  >
                                                    ⓘ
                                                  </button>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <div className={styles.noDeclarations}>No declarations</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )
        })()}
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

      {showDuplicatesModalFor && (
        <DuplicateSelectorsModal
          selector={showDuplicatesModalFor}
          affectingRules={affectingRules}
          keyframes={allKeyframes}
          onClose={() => setShowDuplicatesModalFor(null)}
        />
      )}
    </div>
  )
}
