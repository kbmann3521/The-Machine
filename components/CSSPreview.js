import React, { useEffect, useRef, useState } from 'react'
import { generateSyntheticDom, buildDomFromNodes, getSyntheticNodeMapping, getAffectingRulesForSelector, togglePseudoStateOnAll } from '../lib/tools/syntheticDom'
import { buildPreviewDocument } from '../lib/tools/previewCss'
import { computeRuleImpact } from '../lib/tools/ruleImpactAnalysis'
import { useTheme } from '../lib/ThemeContext'
import RuleInspector from './RuleInspector'
import styles from '../styles/output-tabs.module.css'

/**
 * CSSPreview Component
 *
 * Renders CSS in a sandboxed iframe with synthetic DOM elements
 *
 * Props:
 *   rulesTree: CssRuleNode[] (Phase 3)
 *   declaredVariables: Variable[] (Phase 4)
 *   usedVariables: Variable[] (Phase 4)
 *   onStateChange: (state) => void
 *   variableOverrides: Object<name, value> (optional)
 *   onApplyEdits: (cssText: string) => void (Phase 6E: callback to apply staged edits to source)
 */
export default function CSSPreview({
  rulesTree = [],
  declaredVariables = [],
  usedVariables = [],
  onStateChange = null,
  variableOverrides = {},
  onApplyEdits = null,
}) {
  const { theme } = useTheme()
  const iframeRef = useRef(null)
  const [viewportWidth, setViewportWidth] = useState(1024)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [forcedStates, setForcedStates] = useState({
    hover: false,
    focus: false,
    active: false,
  })
  const [inspectedSelector, setInspectedSelector] = useState(null)
  const [affectingRules, setAffectingRules] = useState([])
  const [nodeMapping, setNodeMapping] = useState(null)
  const [previewOverrides, setPreviewOverrides] = useState({}) // Phase 6(D): Track staged edits
  const [showControls, setShowControls] = useState(false) // Collapsible controls panel
  const [selectedRuleImpact, setSelectedRuleImpact] = useState(null) // Phase 7A: Impact data for selected rule
  const [highlightedSelector, setHighlightedSelector] = useState(null) // Phase 7A Stage 4: Currently highlighted selector
  const [disabledProperties, setDisabledProperties] = useState(new Set()) // Phase 7D: Disabled properties for what-if simulation (format: "ruleIndex-property")
  const [removedRules, setRemovedRules] = useState(new Set()) // Phase 7C: Rules marked for removal (stores ruleIndex)
  const [appliedChanges, setAppliedChanges] = useState(null) // Phase 6(E): Track last applied changes for feedback (format: { count, summary })
  const [isFullscreen, setIsFullscreen] = useState(false) // Fullscreen modal state
  const [bgColorPickerHovered, setBgColorPickerHovered] = useState(false) // Track color picker hover for scale effect
  const [currentPreviewHTML, setCurrentPreviewHTML] = useState('') // Track current preview HTML for fullscreen modal

  // Helper function to determine if a hex color is light or dark
  const isColorLight = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  // Validate inputs
  if (!rulesTree || rulesTree.length === 0) {
    return (
      <div className={styles.rulesExplorerEmpty}>
        <p>No rules to preview. CSS may be empty or invalid.</p>
      </div>
    )
  }

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Generate preview HTML on mount and when dependencies change
  useEffect(() => {
    if (!iframeRef.current) return

    try {
      // Phase 5 Mapping Layer (A)
      // Generate synthetic nodes and HTML
      const { nodes, html, elementCount } = generateSyntheticDom(rulesTree)

      // Wire the mapping context (for Phase 6)
      const nodeMapping = getSyntheticNodeMapping(nodes)

      // Build complete preview document
      // Phase 7C: Filter out removed rules (but keep disabled properties for commenting)
      // Phase 7D: Disabled properties are handled via CSS comments in buildPreviewCss
      const filteredRulesTree = rulesTree
        .filter(rule => !removedRules.has(rule.ruleIndex))

      const htmlDoc = buildPreviewDocument(
        filteredRulesTree,
        declaredVariables,
        variableOverrides,
        html,
        disabledProperties
      )

      // Store current HTML for fullscreen modal
      setCurrentPreviewHTML(htmlDoc)

      // Inject into iframe using contentDocument.write()
      // This ensures reliable updates when properties are disabled
      const iframe = iframeRef.current

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(htmlDoc)
          iframeDoc.close()
        } else {
          // Fallback to srcdoc if contentDocument is not available
          iframe.srcdoc = htmlDoc
        }
      } catch (e) {
        console.warn('Error writing to iframe.contentDocument:', e)
        iframe.srcdoc = htmlDoc
      }

      // Store mapping on iframe for future reference (Phase 6)
      iframe._syntheticNodeMapping = nodeMapping
      setNodeMapping(nodeMapping)

      // Callback to handle post-load setup (apply pseudo-states, overrides, etc.)
      const setupIframeContent = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        if (!iframeDoc) return

        // Set viewport width
        const previewRoot = iframeDoc.querySelector('.preview-root')
        if (previewRoot) {
          previewRoot.style.width = `${viewportWidth}px`
          previewRoot.style.margin = '0 auto'
        }

        // Set background color and auto-detect text color based on luminance
        const body = iframeDoc.body
        if (body) {
          body.style.backgroundColor = bgColor
          body.style.color = isColorLight(bgColor) ? '#000000' : '#ffffff'
        }

        // Apply forced pseudo-states (adds .pseudo-{state} class)
        // Note: Native :hover works automatically without this
        for (const [state, isForced] of Object.entries(forcedStates)) {
          if (isForced) {
            togglePseudoStateOnAll(iframeDoc.documentElement, state, true)
          } else {
            togglePseudoStateOnAll(iframeDoc.documentElement, state, false)
          }
        }

        // Phase 6(D): Re-apply all staged overrides after iframe loads
        // This ensures edits persist across viewport changes or re-renders
        // BUT: Skip overrides for disabled properties
        Object.entries(previewOverrides).forEach(([selector, overrideProps]) => {
          try {
            const elements = iframeDoc.querySelectorAll(selector)
            elements.forEach(el => {
              Object.entries(overrideProps).forEach(([property, value]) => {
                // Find the rule that this override applies to and check if it's disabled
                const correspondingRule = rulesTree.find(r => r.selector === selector)
                if (correspondingRule) {
                  const disabledKey = `${correspondingRule.ruleIndex}-${property}`
                  if (disabledProperties.has(disabledKey)) {
                    // Skip this property since it's disabled
                    return
                  }
                }
                el.style.setProperty(property, value, 'important')
              })
            })
          } catch (e) {
            console.warn(`Could not apply overrides to ${selector}:`, e)
          }
        })

        // Phase 6(A): Wire click detection for element inspector
        iframeDoc.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()

          const clickedElement = e.target

          // Try to find the selector from data attributes (set by buildDomFromNodes)
          let selector = clickedElement.getAttribute('data-selector')

          // Fallback: derive from className if element has one
          if (!selector && clickedElement.className) {
            const classes = clickedElement.className.split(' ').filter(c => !c.startsWith('pseudo-'))
            if (classes.length > 0) {
              selector = '.' + classes.join('.')
            }
          }

          // Fallback: use tag name
          if (!selector) {
            selector = clickedElement.tagName.toLowerCase()
          }

          if (selector && nodeMapping) {
            // Get all rules affecting this selector
            const rules = getAffectingRulesForSelector(selector, rulesTree)
            setInspectedSelector(selector)
            setAffectingRules(rules)
          }
        }, true) // Use capture phase to intercept before other handlers
      }

      // Call setup immediately after writing to contentDocument
      // Also set up onload as a fallback for srcdoc cases
      setupIframeContent()
      iframe.onload = setupIframeContent
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }, [rulesTree, declaredVariables, variableOverrides, viewportWidth, bgColor, forcedStates, disabledProperties, removedRules])

  const handleForcedStateToggle = (state) => {
    setForcedStates(prev => {
      const newState = { ...prev, [state]: !prev[state] }
      if (onStateChange) {
        onStateChange(newState)
      }
      return newState
    })
  }

  // Phase 6(D): Helper to clear all staged overrides
  const handleClearOverrides = () => {
    setPreviewOverrides({})
    // Also clear from iframe if it exists
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      if (iframeDoc) {
        // Find all elements with inline styles and remove !important styles
        // (Simple approach: just set to empty, complex approach would track which props were overridden)
        const allElements = iframeDoc.querySelectorAll('*')
        allElements.forEach(el => {
          el.style.removeProperty('color')
          el.style.removeProperty('background-color')
          el.style.removeProperty('padding')
          el.style.removeProperty('padding-top')
          el.style.removeProperty('padding-right')
          el.style.removeProperty('padding-bottom')
          el.style.removeProperty('padding-left')
          el.style.removeProperty('margin')
          el.style.removeProperty('margin-top')
          el.style.removeProperty('margin-right')
          el.style.removeProperty('margin-bottom')
          el.style.removeProperty('margin-left')
          el.style.removeProperty('font-size')
          el.style.removeProperty('font-weight')
          el.style.removeProperty('line-height')
          el.style.removeProperty('border-radius')
          el.style.removeProperty('opacity')
          el.style.removeProperty('text-align')
          el.style.removeProperty('border-color')
        })
      }
    }
  }

  // Check if there are any active overrides
  const hasActiveOverrides = Object.keys(previewOverrides).length > 0

  // Phase 7A: Compute impact for a selected rule
  const handleComputeRuleImpact = (rule) => {
    if (!iframeRef.current || !rulesTree) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    if (!iframeDoc) return

    try {
      const impact = computeRuleImpact(
        rule.ruleIndex,
        rule.selector,
        rule.declarations || [],
        iframeDoc,
        rulesTree
      )
      setSelectedRuleImpact(impact)
    } catch (e) {
      console.warn('Error computing rule impact:', e)
    }
  }

  // Phase 7D: Toggle property disabled state for what-if simulation
  const handleTogglePropertyDisabled = (ruleIndex, property) => {
    const disabledKey = `${ruleIndex}-${property}`

    setDisabledProperties(prev => {
      const next = new Set(prev)
      if (next.has(disabledKey)) {
        next.delete(disabledKey)
      } else {
        next.add(disabledKey)
      }
      return next
    })

    // Also remove any preview overrides for this property to avoid conflicting styles
    // Find the rule selector to identify which elements might be affected
    const affectedRule = rulesTree.find(r => r.ruleIndex === ruleIndex)
    if (affectedRule && previewOverrides[affectedRule.selector]) {
      setPreviewOverrides(prev => {
        const next = { ...prev }
        const selector = affectedRule.selector
        if (next[selector] && next[selector][property]) {
          // Remove this specific property override
          const updatedProps = { ...next[selector] }
          delete updatedProps[property]
          if (Object.keys(updatedProps).length === 0) {
            delete next[selector]
          } else {
            next[selector] = updatedProps
          }
        }
        return next
      })
    }
  }

  // Phase 7C: Serialize rulesTree to CSS text
  const serializeRulesToCSS = (rulesToSerialize) => {
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

  // Phase 7C: Remove a rule from the stylesheet
  const handleRemoveRule = (ruleIndex, selector, lineRange) => {
    // Mark rule as removed
    const newRemovedRules = new Set(removedRules)
    newRemovedRules.add(ruleIndex)
    setRemovedRules(newRemovedRules)

    // Serialize the CSS with the rule removed and apply it
    if (onApplyEdits) {
      try {
        const filteredRulesTree = rulesTree.filter(rule => !newRemovedRules.has(rule.ruleIndex))
        const removedCSS = serializeRulesToCSS(filteredRulesTree)
        onApplyEdits(removedCSS)
      } catch (e) {
        console.error('Error serializing CSS after rule removal:', e)
      }
    }
  }

  // Phase 7A Stage 4: Handle hover interactions for affected nodes
  // Highlights or removes highlights from matching elements in the preview
  const handleAffectedNodeHover = (selector, action) => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    if (!iframeDoc) return

    try {
      const elements = iframeDoc.querySelectorAll(selector)
      elements.forEach(el => {
        if (action === 'highlight') {
          el.classList.add('_preview-highlight')
          setHighlightedSelector(selector)
        } else if (action === 'remove') {
          el.classList.remove('_preview-highlight')
          setHighlightedSelector(null)
        }
      })
    } catch (e) {
      console.warn(`Could not highlight selector ${selector}:`, e)
    }
  }

  // Phase 6(E): Apply previewOverrides to rulesTree by mutating in place (NOT creating new rules)
  // This ensures we preserve cascade structure and don't create duplicate selectors
  // Returns { mutatedRules, changeSummary } for feedback
  const applyOverridesToRulesTree = (rulesToMutate, overrides) => {
    if (!rulesToMutate || !overrides || Object.keys(overrides).length === 0) {
      return { mutatedRules: rulesToMutate, changeSummary: [] }
    }

    // Create a deep copy to avoid mutating the original
    const mutatedRules = JSON.parse(JSON.stringify(rulesToMutate))
    const changeSummary = [] // Track what was changed for feedback

    // For each selector that was edited
    Object.entries(overrides).forEach(([selector, editedProps]) => {
      if (Object.keys(editedProps).length === 0) return

      const selectorChanges = { selector, properties: [] }

      // Find all rules matching this selector (may be multiple due to media queries, etc.)
      const findAndUpdateRule = (rules) => {
        rules.forEach(rule => {
          // Update regular rules
          if (rule.type === 'rule' && rule.selector === selector) {
            // For each edited property
            Object.entries(editedProps).forEach(([property, newValue]) => {
              // Find existing declaration
              const declIdx = (rule.declarations || []).findIndex(d => d.property === property)

              if (declIdx !== -1) {
                // Case A: Property exists — update in place
                const oldValue = rule.declarations[declIdx].value
                rule.declarations[declIdx].value = newValue
                selectorChanges.properties.push({ property, oldValue, newValue, action: 'updated' })
              } else {
                // Case B: Property doesn't exist — insert it
                if (!rule.declarations) {
                  rule.declarations = []
                }
                rule.declarations.push({
                  property,
                  value: newValue,
                  loc: {
                    startLine: rule.loc?.endLine || 0,
                    endLine: rule.loc?.endLine || 0,
                  },
                })
                selectorChanges.properties.push({ property, newValue, action: 'added' })
              }
            })
          }

          // Recursively search in at-rules (media queries, etc.)
          if (rule.children && Array.isArray(rule.children)) {
            findAndUpdateRule(rule.children)
          }
        })
      }

      findAndUpdateRule(mutatedRules)

      if (selectorChanges.properties.length > 0) {
        changeSummary.push(selectorChanges)
      }
    })

    return { mutatedRules, changeSummary }
  }

  // Phase 6(E): Handle applying staged edits to the source CSS
  // Mutates the source CSS by updating declarations in their original rules (no duplication)
  const handleApplyEdits = () => {
    if (!hasActiveOverrides || !onApplyEdits) return

    try {
      // Apply overrides to rulesTree by mutating in place
      const { mutatedRules, changeSummary } = applyOverridesToRulesTree(rulesTree, previewOverrides)

      // Serialize the mutated tree back to CSS
      const editedCSS = serializeRulesToCSS(mutatedRules)

      if (editedCSS.trim()) {
        onApplyEdits(editedCSS)

        // Track changes for feedback (show brief success message)
        const totalChanges = changeSummary.reduce((sum, item) => sum + item.properties.length, 0)
        setAppliedChanges({
          count: totalChanges,
          summary: changeSummary.map(item => `${item.selector} → ${item.properties.length} property(ies)`).join(', ')
        })

        // Clear the feedback after 3 seconds
        setTimeout(() => setAppliedChanges(null), 3000)

        // Clear overrides after applying
        setPreviewOverrides({})
      }
    } catch (e) {
      console.error('Error applying staged edits:', e)
    }
  }

  // Phase 6(D): Handle property edits with override tracking
  // Saves to previewOverrides state AND applies to iframe for real-time preview
  const handlePropertyEdit = (selector, property, newValue) => {
    // 1. Track the override in state (Phase 6D)
    setPreviewOverrides(prev => {
      const next = { ...prev }
      if (!next[selector]) {
        next[selector] = {}
      }
      if (newValue === null || newValue === undefined || newValue === '') {
        // Delete override if empty
        delete next[selector][property]
        if (Object.keys(next[selector]).length === 0) {
          delete next[selector]
        }
      } else {
        next[selector][property] = newValue
      }
      return next
    })

    // 2. Apply to iframe immediately for real-time preview
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    if (!iframeDoc) return

    try {
      const elements = iframeDoc.querySelectorAll(selector)
      elements.forEach(el => {
        el.style.setProperty(property, newValue, 'important')
      })
    } catch (e) {
      console.warn(`Could not apply style to ${selector}:`, e)
    }
  }

  return (
    <div className={styles.previewContainer}>
      {/* Collapsible Controls Header */}
      <div className={styles.previewControlsHeader}>
        <button
          className={styles.controlsToggleBtn}
          onClick={() => setShowControls(!showControls)}
          title={showControls ? 'Hide preview settings' : 'Show preview settings'}
        >
          {showControls ? '▼ Preview Settings' : '▶ Preview Settings'}
        </button>
        <button
          className={styles.controlsToggleBtn}
          onClick={() => setIsFullscreen(true)}
          title="Expand preview to fullscreen"
          style={{ marginLeft: 'auto' }}
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Collapsible Controls Panel */}
      {showControls && (
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
          <label className={styles.controlLabel}>Background Color:</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              onMouseEnter={() => setBgColorPickerHovered(true)}
              onMouseLeave={() => setBgColorPickerHovered(false)}
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                border: `1px solid ${theme === 'dark' ? '#444' : 'var(--color-border, #ddd)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                flexShrink: 0,
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                transform: bgColorPickerHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              title="Click to pick a color"
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                const val = e.target.value
                // Validate hex color
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                  setBgColor(val)
                }
              }}
              placeholder="#ffffff"
              style={{
                flex: 1,
                padding: '6px 8px',
                height: '36px',
                border: `1px solid ${theme === 'dark' ? '#444' : 'var(--color-border, #ddd)'}`,
                borderRadius: '4px',
                fontFamily: "'Courier New', monospace",
                fontSize: '12px',
                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                color: theme === 'dark' ? '#e0e0e0' : 'var(--color-text-primary, #000)',
                caretColor: theme === 'dark' ? '#0ea5e9' : 'var(--color-text-primary, #000)',
                boxSizing: 'border-box',
              }}
              title="Enter hex color (e.g., #ffffff)"
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Force Pseudo-States (Advanced):</label>
          <div className={styles.pseudoButtons}>
            {['hover', 'focus', 'active'].map(state => (
              <button
                key={state}
                onClick={() => handleForcedStateToggle(state)}
                className={`${styles.pseudoBtn} ${forcedStates[state] ? styles.pseudoBtnActive : ''}`}
                title={`Force :${state} state on all interactive elements (useful for touch devices or debugging)`}
              >
                Force :{state}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary, #666)', marginTop: '8px', margin: '8px 0 0 0' }}>
            💡 Tip: Hover naturally over preview elements to see :hover, :focus states in action. Use force buttons for touch devices or to lock a state for inspection.
          </p>
        </div>

        <div className={styles.controlGroup} style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => {
              setViewportWidth(1024)
              setBgColor('#ffffff')
              setForcedStates({ hover: false, focus: false, active: false })
            }}
            className={styles.resetBtn}
          >
            Reset Preview
          </button>

          {hasActiveOverrides && (
            <button
              onClick={handleClearOverrides}
              className={styles.clearOverridesBtn}
              title={`Clear ${Object.values(previewOverrides).reduce((sum, obj) => sum + Object.keys(obj).length, 0)} staged edits`}
            >
              ✕ Clear Edits ({Object.values(previewOverrides).reduce((sum, obj) => sum + Object.keys(obj).length, 0)})
            </button>
          )}
        </div>
      </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div className={styles.previewCanvas}>
          <div className={styles.previewDisclaimer}>
            ℹ️ Synthetic preview using generated elements. Actual HTML structure may differ.
          </div>

          {appliedChanges && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              padding: '12px 16px',
              backgroundColor: '#66bb6a',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(102, 187, 106, 0.3)',
              animation: 'slideUp 0.3s ease',
              zIndex: 1000,
              maxWidth: '300px',
            }}>
              ✅ {appliedChanges.count} change{appliedChanges.count !== 1 ? 's' : ''} applied
            </div>
          )}

          <iframe
            ref={iframeRef}
            className={styles.previewIframe}
            sandbox="allow-same-origin"
            title="CSS Preview"
          />
        </div>

        {/* Phase 6(A): Rule Inspector Panel */}
        {inspectedSelector && affectingRules.length > 0 && (
          <div style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
          }}>
            <RuleInspector
              selector={inspectedSelector}
              affectingRules={affectingRules}
              onClose={() => {
                // Clear any active highlights before closing
                if (highlightedSelector && iframeRef.current) {
                  const iframe = iframeRef.current
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
                  if (iframeDoc) {
                    try {
                      const elements = iframeDoc.querySelectorAll(highlightedSelector)
                      elements.forEach(el => {
                        el.classList.remove('_preview-highlight')
                      })
                    } catch (e) {
                      console.warn(`Could not clear highlight for ${highlightedSelector}:`, e)
                    }
                  }
                }
                setInspectedSelector(null)
                setAffectingRules([])
                setSelectedRuleImpact(null)
                setHighlightedSelector(null)
              }}
              onPropertyEdit={handlePropertyEdit}
              hasActiveOverrides={hasActiveOverrides}
              onApplyEdits={handleApplyEdits}
              onRuleSelect={handleComputeRuleImpact}
              selectedRuleImpact={selectedRuleImpact}
              onAffectedNodeHover={handleAffectedNodeHover}
              disabledProperties={disabledProperties}
              onTogglePropertyDisabled={handleTogglePropertyDisabled}
              onRemoveRule={handleRemoveRule}
            />
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
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
          {/* Fullscreen Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
              borderBottom: '1px solid var(--color-border, #ddd)',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary, #000)' }}>
              CSS Preview — Fullscreen Mode
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              title="Exit fullscreen"
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border, #ddd)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--color-text-secondary, #666)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0066cc'
                e.target.style.borderColor = '#0066cc'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.borderColor = 'var(--color-border, #ddd)'
                e.target.style.color = 'var(--color-text-secondary, #666)'
              }}
            >
              ✕ Exit (ESC)
            </button>
          </div>

          {/* Fullscreen Preview */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden',
              backgroundColor: bgColor,
            }}
          >
            <iframe
              srcDoc={currentPreviewHTML}
              sandbox="allow-same-origin"
              style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
              title="CSS Preview Fullscreen"
            />
          </div>
        </div>
      )}
    </div>
  )
}
