import React, { useRef, useState, useCallback } from 'react'
import { computeRuleImpact } from '../lib/tools/ruleImpactAnalysis'
import { findAllMergeableGroups } from '../lib/tools/mergeSelectors'
import { generateSyntheticDom } from '../lib/tools/syntheticDom'
import { useTheme } from '../lib/ThemeContext'
import RuleInspector from './RuleInspector'
import MergeSelectorConfirmation from './MergeSelectorConfirmation'
import HTMLRenderer from './HTMLRenderer'
import MarkdownRenderer from './MarkdownRenderer'
import styles from '../styles/output-tabs.module.css'

/**
 * MarkdownPreviewWithInspector Component
 *
 * Renders Markdown/HTML with an inspector sidebar that allows editing CSS rules.
 * When rules are edited, changes are serialized back to CSS and passed to parent.
 *
 * Props:
 *   isHtml: boolean
 *   content: string (HTML or Markdown)
 *   customCss: string
 *   rulesTree: CssRuleNode[]
 *   allowHtml: boolean
 *   enableGfm: boolean
 *   isFullscreen: boolean
 *   onToggleFullscreen: (isFullscreen) => void
 *   onCssChange: (newCss: string) => void (called when inspector makes changes)
 */

function transformCssForPreview(css, previewClass) {
  if (!css) return css
  return css.replace(/\bbody\b/g, previewClass)
}

// Serialize rulesTree back to CSS text
function serializeRulesToCSS(rulesToSerialize) {
  if (!rulesToSerialize || rulesToSerialize.length === 0) return ''

  const cssLines = []

  const processRule = (rule, indent = '') => {
    if (rule.type === 'rule') {
      cssLines.push(`${indent}${rule.selector} {`)
      if (rule.declarations && rule.declarations.length > 0) {
        rule.declarations.forEach(decl => {
          cssLines.push(`${indent}  ${decl.property}: ${decl.value};`)
        })
      }
      cssLines.push(`${indent}}`)
    } else if (rule.type === 'atrule') {
      const params = rule.atRule?.params || ''
      cssLines.push(`${indent}@${rule.atRule?.name || ''} ${params} {`)
      if (rule.children && rule.children.length > 0) {
        rule.children.forEach(child => {
          processRule(child, indent + '  ')
        })
      }
      cssLines.push(`${indent}}`)
    }
  }

  rulesToSerialize.forEach(rule => {
    processRule(rule)
    cssLines.push('')
  })

  return cssLines.join('\n').trim()
}

export default function MarkdownPreviewWithInspector({
  isHtml = false,
  content = '',
  customCss = '',
  rulesTree = [],
  allowHtml = true,
  enableGfm = true,
  isFullscreen = false,
  onToggleFullscreen = null,
  onCssChange = null,
}) {
  const { theme } = useTheme()
  const previewContainerRef = useRef(null)
  const fullscreenContainerRef = useRef(null)

  // Preview settings
  const [viewportWidth, setViewportWidth] = useState(1024)
  const [forcedStates, setForcedStates] = useState({
    hover: false,
    focus: false,
    active: false,
  })
  const [showControls, setShowControls] = useState(false)
  const [showFullscreenSettings, setShowFullscreenSettings] = useState(false)

  // Inspector state
  const [showInspector, setShowInspector] = useState(false)
  const [isClosingInspector, setIsClosingInspector] = useState(false)
  const [disabledProperties, setDisabledProperties] = useState(new Set())
  const [addedProperties, setAddedProperties] = useState({})
  const [lockedDisabledProperties, setLockedDisabledProperties] = useState(new Set())
  const [selectedRule, setSelectedRule] = useState(null)
  const [selectedRuleImpact, setSelectedRuleImpact] = useState(null)
  const [mergeableGroupsForModal, setMergeableGroupsForModal] = useState(null)
  const [localRulesTree, setLocalRulesTree] = useState(null)
  const [highlightedSelector, setHighlightedSelector] = useState(null)
  const highlightStyleRef = useRef(null)
  const closeInspectorTimeoutRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // Use local rules tree if available (after modifications), otherwise use prop
  // This ensures immediate UI updates when removing/adding properties
  const effectiveRulesTree = localRulesTree !== null ? localRulesTree : rulesTree

  // Calculate responsive inspector panel width
  const getInspectorPanelWidth = () => {
    // On mobile (< 640px): full width
    if (containerWidth < 640) return '100%'
    // On tablet (640px - 1024px): 80%
    if (containerWidth < 1024) return '80%'
    // On desktop (1024px+): 65%
    return '65%'
  }

  const inspectorPanelWidth = getInspectorPanelWidth()

  // Sync localRulesTree with prop when it changes (e.g., after formatter finishes)
  React.useEffect(() => {
    setLocalRulesTree(null)
  }, [rulesTree])

  // When CSS is cleared or selectors are removed, clean up added properties for those selectors
  React.useEffect(() => {
    if (Object.keys(addedProperties).length === 0) return

    // Get all rule indices that still exist in effectiveRulesTree
    const existingRuleIndices = new Set()
    const collectRuleIndices = (rules) => {
      for (const rule of rules) {
        if (rule.type === 'rule') {
          existingRuleIndices.add(rule.ruleIndex)
        }
        if (rule.children && rule.children.length > 0) {
          collectRuleIndices(rule.children)
        }
      }
    }
    collectRuleIndices(effectiveRulesTree)

    // Remove added properties for rules that no longer exist
    setAddedProperties(prev => {
      let hasChanges = false
      const next = { ...prev }

      Object.keys(prev).forEach(key => {
        const [ruleIndexStr] = key.split('::')
        const ruleIndex = parseInt(ruleIndexStr)

        if (!existingRuleIndices.has(ruleIndex)) {
          delete next[key]
          hasChanges = true
        }
      })

      return hasChanges ? next : prev
    })
  }, [effectiveRulesTree])

  // When properties change, serialize and call onCssChange
  const applyChangesToSource = (updatedRules) => {
    if (!onCssChange) return
    const newCss = serializeRulesToCSS(updatedRules)
    onCssChange(newCss)
  }

  // Handle closing inspector with animation
  const handleCloseInspector = () => {
    setIsClosingInspector(true)
    if (closeInspectorTimeoutRef.current) {
      clearTimeout(closeInspectorTimeoutRef.current)
    }
    closeInspectorTimeoutRef.current = setTimeout(() => {
      setShowInspector(false)
      setIsClosingInspector(false)
    }, 300) // Match animation duration
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeInspectorTimeoutRef.current) {
        clearTimeout(closeInspectorTimeoutRef.current)
      }
    }
  }, [])

  // Track container width for responsive inspector panel sizing
  React.useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ESC to exit fullscreen
  React.useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onToggleFullscreen?.(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onToggleFullscreen])

  // Helper: check if property is overridden by later rule
  const isPropertyOverriddenByLaterRule = (ruleIndex, selector, property) => {
    for (const rule of effectiveRulesTree) {
      if (rule.ruleIndex <= ruleIndex) continue
      if (rule.selector === selector && rule.declarations?.some(d => d.property === property)) {
        return true
      }
    }
    return false
  }

  // Handle property edits - apply changes to rules tree and update source
  const handlePropertyEdit = (selector, property, newValue, isAddedProperty = false, ruleIndex = null) => {
    if (ruleIndex == null) return

    // Create a deep copy of effectiveRulesTree to mutate
    const mutatedRules = JSON.parse(JSON.stringify(effectiveRulesTree))

    // Find and update the rule
    const findAndUpdateRule = (rules) => {
      for (const rule of rules) {
        if (rule.type === 'rule' && rule.ruleIndex === ruleIndex && rule.selector === selector) {
          if (!rule.declarations) rule.declarations = []

          if (isAddedProperty) {
            // New property - add if not exists
            const idx = rule.declarations.findIndex(d => d.property === property)
            if (idx === -1) {
              rule.declarations.push({ property, value: newValue, loc: {} })
            } else {
              rule.declarations[idx].value = newValue
            }
          } else {
            // Existing property - update
            const idx = rule.declarations.findIndex(d => d.property === property)
            if (idx !== -1) {
              rule.declarations[idx].value = newValue
            }
          }
          return true
        }

        // Recurse into children
        if (rule.children && rule.children.length > 0) {
          if (findAndUpdateRule(rule.children)) return true
        }
      }
      return false
    }

    findAndUpdateRule(mutatedRules)
    applyChangesToSource(mutatedRules)
  }

  // Handle property disabled state - serialize and update source
  const handleTogglePropertyDisabled = (ruleIndex, property, isAddedProperty = false) => {
    const disabledKey = isAddedProperty ? `${ruleIndex}::ADDED::${property}` : `${ruleIndex}-${property}`

    // Disabled properties are UI-only state for what-if simulation
    // They should NOT modify the CSS source, only the preview rendering
    setDisabledProperties(prev => {
      const next = new Set(prev)
      if (next.has(disabledKey)) {
        next.delete(disabledKey)
      } else {
        next.add(disabledKey)
      }
      return next
    })
  }

  // Manage added properties
  const handleAddPropertyChange = (updater) => {
    setAddedProperties(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater

      // Serialize and update source when added properties change
      const mutatedRules = JSON.parse(JSON.stringify(effectiveRulesTree))

      Object.entries(next).forEach(([key, value]) => {
        const [ruleIndexStr, propertyName] = key.split('::')
        const ruleIndex = parseInt(ruleIndexStr)

        const findAndAddProperty = (rules) => {
          for (const rule of rules) {
            if (rule.type === 'rule' && rule.ruleIndex === ruleIndex) {
              if (!rule.declarations) rule.declarations = []
              const idx = rule.declarations.findIndex(d => d.property === propertyName)
              if (idx === -1) {
                rule.declarations.push({ property: propertyName, value, loc: {} })
              } else {
                rule.declarations[idx].value = value
              }
              return true
            }
            if (rule.children && rule.children.length > 0) {
              if (findAndAddProperty(rule.children)) return true
            }
          }
          return false
        }

        findAndAddProperty(mutatedRules)
      })

      applyChangesToSource(mutatedRules)
      return next
    })
  }

  const handleLockPropertyChange = (updater) => {
    setLockedDisabledProperties(prev => typeof updater === 'function' ? updater(prev) : updater)
  }

  const handleReEnableProperty = (ruleIndex, propertyName) => {
    const disabledKey = `${ruleIndex}-${propertyName}`
    setDisabledProperties(prev => {
      const next = new Set(prev)
      next.delete(disabledKey)
      return next
    })
  }

  // Compute impact analysis for a selected rule
  const handleComputeRuleImpact = useCallback((rule) => {
    setSelectedRule(rule)
    try {
      // Find the rendered preview container
      const containerRef = isFullscreen ? fullscreenContainerRef : previewContainerRef
      if (!containerRef?.current) return

      const previewElement = containerRef.current.querySelector('.pwt-html-preview') ||
                            containerRef.current.querySelector('.pwt-markdown-preview')

      if (!previewElement) return

      // Compute impact
      const impact = computeRuleImpact(
        rule.ruleIndex,
        rule.selector,
        rule.declarations || [],
        previewElement,
        effectiveRulesTree,
        addedProperties
      )

      // Enhance with added properties
      if (impact && impact.affectedNodes && Object.keys(addedProperties).length > 0) {
        impact.affectedNodes = impact.affectedNodes.map(node => ({
          ...node,
          properties: [
            ...node.properties,
            ...Object.entries(addedProperties)
              .filter(([key]) => {
                const [addedRuleIndex] = key.split('::')
                return parseInt(addedRuleIndex) === rule.ruleIndex
              })
              .map(([key, value]) => {
                const [, propertyName] = key.split('::')
                const isOverriddenByLater = isPropertyOverriddenByLaterRule(rule.ruleIndex, rule.selector, propertyName)

                let overridingRuleIndex = undefined
                if (isOverriddenByLater) {
                  for (const r of effectiveRulesTree) {
                    if (r.ruleIndex > rule.ruleIndex && r.selector === rule.selector && r.declarations?.some(d => d.property === propertyName)) {
                      overridingRuleIndex = r.ruleIndex
                      break
                    }
                  }
                }

                return {
                  property: propertyName,
                  effective: !isOverriddenByLater,
                  value: value,
                  overriddenBy: overridingRuleIndex,
                }
              })
          ],
        }))
      }

      setSelectedRuleImpact(impact)
    } catch (e) {
      console.warn('Error computing rule impact:', e)
    }
  }, [isFullscreen, effectiveRulesTree, addedProperties, fullscreenContainerRef, previewContainerRef])

  // Auto-recompute impact when properties change
  React.useEffect(() => {
    if (!selectedRule) return

    // Recompute impact when added/disabled properties change
    const timeoutId = setTimeout(() => {
      handleComputeRuleImpact(selectedRule)
    }, 0)

    return () => clearTimeout(timeoutId)
    // Note: handleComputeRuleImpact is not in dependencies because it's memoized with useCallback
    // and won't change unless its own dependencies change (which include addedProperties)
  }, [selectedRule, addedProperties, disabledProperties])

  // Handle merge selectors request
  const handleMergeClick = (mergeableGroups) => {
    setMergeableGroupsForModal(mergeableGroups)
  }

  // Confirm and apply merge
  const handleMergeConfirm = (mergedCSS) => {
    if (mergedCSS && onCssChange) {
      onCssChange(mergedCSS)
      // Reset local rules tree so it syncs with the updated prop from formatter
      setLocalRulesTree(null)
      setMergeableGroupsForModal(null)
    }
  }

  // Cancel merge
  const handleMergeCancel = () => {
    setMergeableGroupsForModal(null)
  }

  // Extract available selectors from the actual rendered preview HTML/MD
  // Groups them by type (STRUCTURE, HEADINGS, TEXT, CODE) like the CSS tab does
  const getAvailableSelectors = () => {
    const containerRef = isFullscreen ? fullscreenContainerRef : previewContainerRef
    if (!containerRef?.current) return []

    const previewElement = containerRef.current.querySelector('.pwt-html-preview') ||
                           containerRef.current.querySelector('.pwt-markdown-preview')
    if (!previewElement) return []

    // Collect all selectors from the preview
    const selectors = {
      structure: new Set(),
      headings: new Set(),
      text: new Set(),
      code: new Set(),
      other: new Set(),
    }

    const traverse = (element) => {
      const tagName = element.tagName?.toLowerCase()

      // Categorize by element type
      if (tagName === 'body' || tagName === 'html') {
        selectors.structure.add(tagName)
      } else if (tagName && tagName.match(/^h[1-6]$/)) {
        selectors.headings.add(tagName)
      } else if (['p', 'strong', 'em', 'b', 'i', 'a', 'span', 'u', 'ul', 'ol', 'li'].includes(tagName)) {
        selectors.text.add(tagName)
      } else if (['pre', 'code'].includes(tagName)) {
        selectors.code.add(tagName)
      }

      // Add class selectors with category heuristics
      if (element.classList && element.classList.length > 0) {
        Array.from(element.classList).forEach(className => {
          if (className && !className.startsWith('pwt-') && !className.includes('__')) {
            const selector = `.${className}`

            if (className.includes('code') || className.includes('pre')) {
              selectors.code.add(selector)
            } else if (className.includes('heading') || className.includes('title') || className.includes('h')) {
              selectors.headings.add(selector)
            } else if (className.includes('text') || className.includes('paragraph')) {
              selectors.text.add(selector)
            } else {
              selectors.structure.add(selector)
            }
          }
        })
      }

      // Add ID selectors
      if (element.id && !element.id.startsWith('pwt-')) {
        selectors.other.add(`#${element.id}`)
      }

      // Recurse
      for (const child of element.children) {
        traverse(child)
      }
    }

    traverse(previewElement)

    // Remove selectors that are already in rulesTree
    const existingSelectors = new Set()
    const collectSelectors = (rules) => {
      for (const rule of rules) {
        if (rule.type === 'rule' && rule.selector) {
          existingSelectors.add(rule.selector)
        }
        if (rule.children && rule.children.length > 0) {
          collectSelectors(rule.children)
        }
      }
    }
    collectSelectors(effectiveRulesTree)

    // Build grouped output
    const grouped = []

    if (selectors.structure.size > 0) {
      grouped.push({
        category: 'STRUCTURE',
        selectors: Array.from(selectors.structure).sort(),
      })
    }

    if (selectors.headings.size > 0) {
      grouped.push({
        category: 'HEADINGS',
        selectors: Array.from(selectors.headings).sort(),
      })
    }

    if (selectors.text.size > 0) {
      grouped.push({
        category: 'TEXT',
        selectors: Array.from(selectors.text).sort(),
      })
    }

    if (selectors.code.size > 0) {
      grouped.push({
        category: 'CODE',
        selectors: Array.from(selectors.code).sort(),
      })
    }

    if (selectors.other.size > 0) {
      grouped.push({
        category: 'OTHER',
        selectors: Array.from(selectors.other).sort(),
      })
    }

    // Filter out already-defined selectors
    return grouped
      .map(group => ({
        ...group,
        selectors: group.selectors.filter(s => !existingSelectors.has(s)),
      }))
      .filter(group => group.selectors.length > 0)
  }

  // Handle adding a new selector/rule
  const handleAddNewSelector = (selector) => {
    if (!selector) return

    // Create a new rule with the highest ruleIndex + 1
    let maxRuleIndex = -1
    const collectMaxIndex = (rules) => {
      for (const rule of rules) {
        if (rule.ruleIndex !== undefined && rule.ruleIndex > maxRuleIndex) {
          maxRuleIndex = rule.ruleIndex
        }
        if (rule.children && rule.children.length > 0) {
          collectMaxIndex(rule.children)
        }
      }
    }
    collectMaxIndex(effectiveRulesTree)

    const newRule = {
      type: 'rule',
      ruleIndex: maxRuleIndex + 1,
      selector: selector,
      declarations: [],
      loc: {
        startLine: effectiveRulesTree.length + 1,
        endLine: effectiveRulesTree.length + 1,
      },
      specificity: 0,
    }

    // Add the new rule to the rulesTree
    const mutatedRules = [...effectiveRulesTree, newRule]
    setLocalRulesTree(mutatedRules)
    applyChangesToSource(mutatedRules)
  }

  // Remove a rule from the stylesheet
  const handleRemoveRule = (ruleIndex, selector, lineRange) => {
    // Create mutated rules without this rule
    const mutatedRules = JSON.parse(JSON.stringify(effectiveRulesTree))

    const removeRuleRecursive = (rules) => {
      for (let i = rules.length - 1; i >= 0; i--) {
        const rule = rules[i]

        if (rule.type === 'rule' && rule.ruleIndex === ruleIndex && rule.selector === selector) {
          rules.splice(i, 1)
          return true
        }

        if (rule.children && rule.children.length > 0) {
          if (removeRuleRecursive(rule.children)) return true
        }
      }
      return false
    }

    removeRuleRecursive(mutatedRules)
    applyChangesToSource(mutatedRules)
  }

  // Highlight or unhighlight a selector in the preview
  const handleHighlightSelector = (selector) => {
    const containerRef = isFullscreen ? fullscreenContainerRef : previewContainerRef
    if (!containerRef?.current) return

    // If already highlighted and clicking same selector, toggle it off
    if (highlightedSelector === selector) {
      // Remove the highlight style tag
      if (highlightStyleRef.current && highlightStyleRef.current.parentNode) {
        highlightStyleRef.current.parentNode.removeChild(highlightStyleRef.current)
      }
      highlightStyleRef.current = null
      setHighlightedSelector(null)
      return
    }

    // Remove previous highlight if any
    if (highlightStyleRef.current && highlightStyleRef.current.parentNode) {
      highlightStyleRef.current.parentNode.removeChild(highlightStyleRef.current)
    }

    // Find the preview element to determine which class to use for scoping
    const previewElement = containerRef.current.querySelector('.pwt-html-preview') ||
                          containerRef.current.querySelector('.pwt-markdown-preview')

    if (!previewElement) return

    // Determine the preview container class
    const previewClass = previewElement.classList.contains('pwt-html-preview')
      ? '.pwt-html-preview'
      : '.pwt-markdown-preview'

    // Scope the selector to only match elements within the preview container
    // This prevents highlighting elements outside the preview area
    const scopedSelector = `${previewClass} ${selector}`

    // Create new highlight style
    const highlightStyle = document.createElement('style')
    highlightStyle.setAttribute('data-highlight', 'true')
    highlightStyle.textContent = `
      ${scopedSelector} {
        outline: 3px dashed #ff00ff !important;
        outline-offset: 2px;
      }
    `

    previewElement.appendChild(highlightStyle)
    highlightStyleRef.current = highlightStyle
    setHighlightedSelector(selector)
  }

  // Clean up highlight on unmount
  React.useEffect(() => {
    return () => {
      if (highlightStyleRef.current && highlightStyleRef.current.parentNode) {
        highlightStyleRef.current.parentNode.removeChild(highlightStyleRef.current)
      }
    }
  }, [])

  // Remove a property from a rule
  const handleRemoveProperty = (ruleIndex, selector, property) => {
    // Create mutated rules without this property
    const mutatedRules = JSON.parse(JSON.stringify(effectiveRulesTree))

    const findAndRemoveProperty = (rules) => {
      for (const rule of rules) {
        if (rule.type === 'rule' && rule.ruleIndex === ruleIndex && rule.selector === selector) {
          if (rule.declarations) {
            rule.declarations = rule.declarations.filter(d => d.property !== property)
          }
          return true
        }

        if (rule.children && rule.children.length > 0) {
          if (findAndRemoveProperty(rule.children)) return true
        }
      }
      return false
    }

    findAndRemoveProperty(mutatedRules)
    // Update local state immediately so UI reflects change right away
    setLocalRulesTree(mutatedRules)
    // Also update the CSS source
    applyChangesToSource(mutatedRules)

    // If this property was added via the inspector, remove it from addedProperties
    const addedPropertyKey = `${ruleIndex}::${property}`
    if (addedProperties[addedPropertyKey]) {
      setAddedProperties(prev => {
        const next = { ...prev }
        delete next[addedPropertyKey]
        return next
      })
    }
  }

  const renderPreviewSettings = () => (
    <div className={styles.previewControlsHeader}>
      <button
        className={styles.controlsToggleBtn}
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '▼ Preview Settings' : '▶ Preview Settings'}
      </button>
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        {effectiveRulesTree.length > 0 && (
          <button
            className={styles.controlsToggleBtn}
            onClick={() => showInspector ? handleCloseInspector() : setShowInspector(true)}
            style={{ backgroundColor: showInspector ? 'rgba(33, 150, 243, 0.2)' : 'transparent' }}
          >
            🔍 Inspector
          </button>
        )}
        <button
          className={`${styles.controlsToggleBtn} ${styles.fullscreenBtnDesktopOnly}`}
          onClick={() => onToggleFullscreen?.(true)}
        >
          ⛶ Fullscreen
        </button>
      </div>
    </div>
  )

  const renderControls = () => (
    showControls && (
      <div className={styles.previewControls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Viewport Width: {viewportWidth}px
          </label>
          <input
            type="range"
            min="320"
            max="1920"
            step="50"
            value={viewportWidth}
            onChange={(e) => setViewportWidth(parseInt(e.target.value))}
            className={styles.widthSlider}
          />
          <div className={styles.presetWidths}>
            <button onClick={() => setViewportWidth(320)} className={styles.presetBtn}>
              Mobile
            </button>
            <button onClick={() => setViewportWidth(768)} className={styles.presetBtn}>
              Tablet
            </button>
            <button onClick={() => setViewportWidth(1024)} className={styles.presetBtn}>
              Desktop
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Force Pseudo-States:</label>
          <div className={styles.pseudoButtons}>
            {['hover', 'focus', 'active'].map(state => (
              <button
                key={state}
                onClick={() => setForcedStates(prev => ({ ...prev, [state]: !prev[state] }))}
                className={`${styles.pseudoBtn} ${forcedStates[state] ? styles.pseudoBtnActive : ''}`}
              >
                Force :{state}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={() => {
              setViewportWidth(1024)
              setForcedStates({ hover: false, focus: false, active: false })
            }}
            className={styles.resetBtn}
          >
            Reset Preview
          </button>
        </div>
      </div>
    )
  )

  // Generate CSS with disabled properties filtered out for what-if preview
  const getPreviewCss = () => {
    if (!effectiveRulesTree || effectiveRulesTree.length === 0) return customCss

    // Create a deep copy and filter out disabled properties
    const rulesToSerialize = JSON.parse(JSON.stringify(effectiveRulesTree))

    const filterDisabledProps = (rules) => {
      rules.forEach(rule => {
        if (rule.type === 'rule' && rule.declarations) {
          rule.declarations = rule.declarations.filter(decl => {
            const originalKey = `${rule.ruleIndex}-${decl.property}`
            const addedKey = `${rule.ruleIndex}::ADDED::${decl.property}`
            return !disabledProperties.has(originalKey) && !disabledProperties.has(addedKey)
          })
        }
        if (rule.children && rule.children.length > 0) {
          filterDisabledProps(rule.children)
        }
      })
    }

    filterDisabledProps(rulesToSerialize)
    return serializeRulesToCSS(rulesToSerialize)
  }

  const renderPreviewContent = () => {
    const previewClass = isHtml ? '.pwt-html-preview' : '.pwt-markdown-preview'
    const previewCss = getPreviewCss()
    const transformedCss = transformCssForPreview(previewCss, previewClass)

    return (
      <div
        ref={isFullscreen ? undefined : previewContainerRef}
        style={{
          width: `${viewportWidth}px`,
          height: '100%',
          marginRight: 'auto',
          minHeight: '300px',
          position: 'relative',
        }}
      >
        {isHtml ? (
          <HTMLRenderer
            html={content}
            customCss={transformedCss}
          />
        ) : (
          <MarkdownRenderer
            markdown={content}
            customCss={transformedCss}
            allowHtml={allowHtml}
            enableGfm={enableGfm}
          />
        )}
      </div>
    )
  }

  const getAllRulesFlat = () => {
    if (!effectiveRulesTree || effectiveRulesTree.length === 0) return []

    const rules = []
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'rule') {
          rules.push(node)
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      }
    }

    traverse(effectiveRulesTree)
    return rules
  }

  const allRules = getAllRulesFlat()

  // Fullscreen layout
  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-background-primary, #fff)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
            flexShrink: 0,
            height: '40px',
            borderBottom: '1px solid var(--color-border, #ddd)',
          }}
        >
          <div style={{ position: 'relative', paddingLeft: '12px' }}>
            <button
              onClick={() => setShowFullscreenSettings(!showFullscreenSettings)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--color-text-primary, #000)',
              }}
            >
              ⚙ Settings
            </button>
            {showFullscreenSettings && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : 'var(--color-background-primary, #fff)',
                  border: `1px solid ${theme === 'dark' ? '#444' : 'var(--color-border, #ddd)'}`,
                  borderRadius: '4px',
                  padding: '12px',
                  minWidth: '280px',
                  boxShadow: theme === 'dark' ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: theme === 'dark' ? '#aaa' : 'var(--color-text-secondary, #666)', display: 'block', marginBottom: '6px' }}>
                    Viewport Width: {viewportWidth}px
                  </label>
                  <input
                    type="range"
                    min="320"
                    max="1920"
                    step="50"
                    value={viewportWidth}
                    onChange={(e) => setViewportWidth(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[320, 768, 1024].map(width => (
                      <button
                        key={width}
                        onClick={() => setViewportWidth(width)}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          border: `1px solid ${theme === 'dark' ? '#555' : 'var(--color-border, #ddd)'}`,
                          backgroundColor: viewportWidth === width ? (theme === 'dark' ? 'rgba(33, 150, 243, 0.4)' : 'rgba(0, 102, 204, 0.2)') : (theme === 'dark' ? 'transparent' : 'transparent'),
                          color: theme === 'dark' ? '#fff' : 'var(--color-text-primary, #000)',
                          fontWeight: '600',
                        }}
                      >
                        {width === 320 ? 'Mobile' : width === 768 ? 'Tablet' : 'Desktop'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: theme === 'dark' ? '#aaa' : 'var(--color-text-secondary, #666)', display: 'block', marginBottom: '6px' }}>
                    Force Pseudo-States:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['hover', 'focus', 'active'].map(state => (
                      <button
                        key={state}
                        onClick={() => setForcedStates(prev => ({ ...prev, [state]: !prev[state] }))}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          border: `1px solid ${theme === 'dark' ? '#555' : 'var(--color-border, #ddd)'}`,
                          backgroundColor: forcedStates[state] ? (theme === 'dark' ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.2)') : 'transparent',
                          color: theme === 'dark' ? '#fff' : 'var(--color-text-primary, #000)',
                          fontWeight: '600',
                        }}
                      >
                        :{state}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setViewportWidth(1024)
                    setForcedStates({ hover: false, focus: false, active: false })
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: theme === 'dark' ? '#fff' : 'var(--color-text-primary, #000)',
                  }}
                >
                  Reset Preview
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingRight: '12px' }}>
            {effectiveRulesTree.length > 0 && (
              <button
                onClick={() => showInspector ? handleCloseInspector() : setShowInspector(true)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: showInspector ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary, #000)',
                }}
              >
                🔍 Inspector
              </button>
            )}
            <button
              onClick={() => onToggleFullscreen?.(false)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border, #ddd)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--color-text-primary, #000)',
              }}
            >
              ✕ Exit (ESC)
            </button>
          </div>
        </div>

        <div
          ref={fullscreenContainerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--scrollbar-thumb, #999) transparent',
              minWidth: 0,
            }}
          >
            {renderPreviewContent()}
          </div>

          {(showInspector || isClosingInspector) && allRules.length > 0 && (
            <>
              <style>{`
                @keyframes slideInRight {
                  from {
                    right: ${containerWidth < 640 ? '-100%' : '-400px'};
                    opacity: 0;
                  }
                  to {
                    right: 0;
                    opacity: 1;
                  }
                }
                @keyframes slideOutRight {
                  from {
                    right: 0;
                    opacity: 1;
                  }
                  to {
                    right: ${containerWidth < 640 ? '-100%' : '-400px'};
                    opacity: 0;
                  }
                }
              `}</style>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: containerWidth < 640 ? '100%' : '400px',
                  right: isClosingInspector ? (containerWidth < 640 ? '-100%' : '-400px') : 0,
                  borderLeft: '1px solid var(--color-border, #ddd)',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                  overflow: 'hidden',
                  animation: isClosingInspector ? 'slideOutRight 0.3s ease-in forwards' : 'slideInRight 0.3s ease-out forwards',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border, #ddd)', fontWeight: '600', fontSize: '12px', flexShrink: 0 }}>
                CSS Rules ({allRules.length})
              </div>
              <div style={{ flex: 1, overflow: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'var(--scrollbar-thumb, #999) transparent', minHeight: 0 }}>
                <RuleInspector
                  selector="*"
                  affectingRules={allRules}
                  rulesTree={effectiveRulesTree}
                  onClose={handleCloseInspector}
                  onPropertyEdit={handlePropertyEdit}
                  disabledProperties={disabledProperties}
                  onTogglePropertyDisabled={handleTogglePropertyDisabled}
                  addedProperties={addedProperties}
                  onAddPropertyChange={handleAddPropertyChange}
                  lockedDisabledProperties={lockedDisabledProperties}
                  onLockPropertyChange={handleLockPropertyChange}
                  onReEnableProperty={handleReEnableProperty}
                  onRuleSelect={handleComputeRuleImpact}
                  selectedRuleImpact={selectedRuleImpact}
                  onRemoveRule={handleRemoveRule}
                  onRemoveProperty={handleRemoveProperty}
                  onMergeClick={handleMergeClick}
                  isPropertyOverriddenByLaterRule={isPropertyOverriddenByLaterRule}
                  onHighlightSelector={handleHighlightSelector}
                  highlightedSelector={highlightedSelector}
                  availableSelectors={getAvailableSelectors()}
                  onAddNewSelector={handleAddNewSelector}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Merge Selectors Confirmation Modal */}
      {mergeableGroupsForModal && (
          <MergeSelectorConfirmation
            mergeableGroups={mergeableGroupsForModal}
            rulesTree={effectiveRulesTree}
            sourceText={customCss}
            onConfirm={(mergedCss) => {
              // The merged CSS has unscoped selectors from rulesTree
              // Parent (ToolOutputPanel) will handle any scoping as needed
              handleMergeConfirm(mergedCss)
            }}
            onCancel={handleMergeCancel}
          />
        )}
      </div>
    )
  }

  // Normal layout
  return (
    <div className={styles.previewContainer}>
      {renderPreviewSettings()}
      {renderControls()}

      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        <div
          className={styles.previewCanvas}
          style={{
            flex: showInspector && allRules.length > 0 ? '1 1 35%' : '1 1 100%',
            overflow: 'auto',
            transition: 'flex 0.3s ease',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--scrollbar-thumb, #999) transparent',
          }}
        >
          {renderPreviewContent()}
        </div>

        {(showInspector || isClosingInspector) && allRules.length > 0 && (
          <>
            <style>{`
              @keyframes slideInRight {
                from {
                  right: calc(-1 * ${inspectorPanelWidth});
                  opacity: 0;
                }
                to {
                  right: 0;
                  opacity: 1;
                }
              }
              @keyframes slideOutRight {
                from {
                  right: 0;
                  opacity: 1;
                }
                to {
                  right: calc(-1 * ${inspectorPanelWidth});
                  opacity: 0;
                }
              }
            `}</style>
            <div
              className={styles.inspectorPanel}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: isClosingInspector ? `calc(-1 * ${inspectorPanelWidth})` : 0,
                width: inspectorPanelWidth,
                borderLeft: '1px solid var(--color-border, #ddd)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                overflow: 'hidden',
                animation: isClosingInspector ? 'slideOutRight 0.3s ease-in forwards' : 'slideInRight 0.3s ease-out forwards',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border, #ddd)',
                  fontWeight: '600',
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                CSS Rules ({allRules.length})
              </div>
              <div style={{ flex: 1, overflow: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'var(--scrollbar-thumb, #999) transparent', minHeight: 0 }}>
                <RuleInspector
                  selector="*"
                  affectingRules={allRules}
                  rulesTree={effectiveRulesTree}
                  onClose={handleCloseInspector}
                  onPropertyEdit={handlePropertyEdit}
                  disabledProperties={disabledProperties}
                  onTogglePropertyDisabled={handleTogglePropertyDisabled}
                  addedProperties={addedProperties}
                  onAddPropertyChange={handleAddPropertyChange}
                  lockedDisabledProperties={lockedDisabledProperties}
                  onLockPropertyChange={handleLockPropertyChange}
                  onReEnableProperty={handleReEnableProperty}
                  onRuleSelect={handleComputeRuleImpact}
                  selectedRuleImpact={selectedRuleImpact}
                  onRemoveRule={handleRemoveRule}
                  onRemoveProperty={handleRemoveProperty}
                  onMergeClick={handleMergeClick}
                  isPropertyOverriddenByLaterRule={isPropertyOverriddenByLaterRule}
                  onHighlightSelector={handleHighlightSelector}
                  highlightedSelector={highlightedSelector}
                  availableSelectors={getAvailableSelectors()}
                  onAddNewSelector={handleAddNewSelector}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Merge Selectors Confirmation Modal */}
      {mergeableGroupsForModal && (
        <MergeSelectorConfirmation
          mergeableGroups={mergeableGroupsForModal}
          rulesTree={effectiveRulesTree}
          sourceText={customCss}
          onConfirm={(mergedCss) => {
            // The merged CSS has unscoped selectors from rulesTree
            // Parent (ToolOutputPanel) will handle any scoping as needed
            handleMergeConfirm(mergedCss)
          }}
          onCancel={handleMergeCancel}
        />
      )}
    </div>
  )
}
