import React, { useRef, useState, useCallback } from 'react'
import { computeRuleImpact } from '../lib/tools/ruleImpactAnalysis'
import { findAllMergeableGroups } from '../lib/tools/mergeSelectors'
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

  // Inspector state
  const [showInspector, setShowInspector] = useState(false)
  const [disabledProperties, setDisabledProperties] = useState(new Set())
  const [addedProperties, setAddedProperties] = useState({})
  const [lockedDisabledProperties, setLockedDisabledProperties] = useState(new Set())
  const [selectedRule, setSelectedRule] = useState(null)
  const [selectedRuleImpact, setSelectedRuleImpact] = useState(null)
  const [mergeableGroupsForModal, setMergeableGroupsForModal] = useState(null)
  const [localRulesTree, setLocalRulesTree] = useState(null)

  // Use local rules tree if available (after modifications), otherwise use prop
  // This ensures immediate UI updates when removing/adding properties
  const effectiveRulesTree = localRulesTree !== null ? localRulesTree : rulesTree

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
    if (!ruleIndex) return

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

    setDisabledProperties(prev => {
      const next = new Set(prev)
      if (next.has(disabledKey)) {
        next.delete(disabledKey)
      } else {
        next.add(disabledKey)
      }

      // Create mutated rules with disabled properties filtered out
      const mutatedRules = JSON.parse(JSON.stringify(effectiveRulesTree))

      const filterDisabledProps = (rules) => {
        rules.forEach(rule => {
          if (rule.type === 'rule' && rule.declarations) {
            // Filter out declarations that are in disabledProperties
            rule.declarations = rule.declarations.filter(decl => {
              const key = `${rule.ruleIndex}-${decl.property}`
              return !next.has(key)
            })
          }
          if (rule.children && rule.children.length > 0) {
            filterDisabledProps(rule.children)
          }
        })
      }

      filterDisabledProps(mutatedRules)
      applyChangesToSource(mutatedRules)

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
            onClick={() => setShowInspector(!showInspector)}
            style={{ backgroundColor: showInspector ? 'rgba(33, 150, 243, 0.2)' : 'transparent' }}
          >
            🔍 Inspector
          </button>
        )}
        <button
          className={styles.controlsToggleBtn}
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

  const renderPreviewContent = () => {
    const previewClass = isHtml ? '.pwt-html-preview' : '.pwt-markdown-preview'
    const transformedCss = transformCssForPreview(customCss, previewClass)

    return (
      <div
        ref={isFullscreen ? undefined : previewContainerRef}
        style={{
          width: `${viewportWidth}px`,
          margin: '0 auto',
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
          backgroundColor: 'transparent',
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
            padding: '12px 16px',
            backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
            borderBottom: '1px solid var(--color-border, #ddd)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '600' }}>
            Preview — Fullscreen Mode
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {allRules.length > 0 && (
              <button
                className={styles.controlsToggleBtn}
                onClick={() => setShowInspector(!showInspector)}
                style={{ backgroundColor: showInspector ? 'rgba(33, 150, 243, 0.2)' : 'transparent' }}
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
          }}
        >
          <div
            style={{
              flex: showInspector ? '1 1 35%' : '1 1 100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--scrollbar-thumb, #999) transparent',
            }}
          >
            {renderPreviewContent()}
          </div>

          {showInspector && allRules.length > 0 && (
            <div
              style={{
                flex: '0 0 auto',
                width: '400px',
                maxWidth: '400px',
                borderLeft: '1px solid var(--color-border, #ddd)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border, #ddd)', fontWeight: '600', fontSize: '12px', flexShrink: 0 }}>
                CSS Rules ({allRules.length})
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <RuleInspector
                  selector="*"
                  affectingRules={allRules}
                  rulesTree={effectiveRulesTree}
                  onClose={() => setShowInspector(false)}
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
                />
              </div>
            </div>
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

      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
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

        {showInspector && allRules.length > 0 && (
          <div
            className={styles.inspectorPanel}
            style={{
              flex: '0 0 65%',
              borderLeft: '1px solid var(--color-border, #ddd)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
              overflow: 'hidden',
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
            <div style={{ flex: 1, overflow: 'auto' }}>
              <RuleInspector
                selector="*"
                affectingRules={allRules}
                rulesTree={effectiveRulesTree}
                onClose={() => setShowInspector(false)}
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
              />
            </div>
          </div>
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
