import React, { useEffect, useRef, useState } from 'react'
import { generateSyntheticDom, buildDomFromNodes, getSyntheticNodeMapping, getAffectingRulesForSelector, togglePseudoStateOnAll } from '../lib/tools/syntheticDom'
import { buildPreviewDocument } from '../lib/tools/previewCss'
import { computeRuleImpact } from '../lib/tools/ruleImpactAnalysis'
import { applyPropertyEditsToSourceText, applyMergeToSourceText } from '../lib/tools/mergeSelectors'
import { useTheme } from '../lib/ThemeContext'
import RuleInspector from './RuleInspector'
import MergeSelectorConfirmation from './MergeSelectorConfirmation'
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
  isFullscreen = false,
  onToggleFullscreen = null,
  sourceText = '',
}) {
  const { theme } = useTheme()
  const iframeRef = useRef(null)
  const fullscreenIframeRef = useRef(null)
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
  const [addedProperties, setAddedProperties] = useState({}) // Phase 6(F): Track new properties (format: "ruleIndex::propertyName" => value)
  const [lockedDisabledProperties, setLockedDisabledProperties] = useState(new Set()) // Phase 6(F): Lock disabled properties to prevent re-enabling (format: "ruleIndex-propertyName")

  const [bgColorPickerHovered, setBgColorPickerHovered] = useState(false) // Track color picker hover for scale effect
  const [currentPreviewHTML, setCurrentPreviewHTML] = useState('') // Track current preview HTML for fullscreen modal
  const [mergeableGroupsForModal, setMergeableGroupsForModal] = useState(null) // Track mergeable groups for merge confirmation modal
  const [showFullscreenSettings, setShowFullscreenSettings] = useState(false) // Track if fullscreen settings dropdown is open

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
        onToggleFullscreen?.(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onToggleFullscreen])

  // Wire up click detection for fullscreen iframe
  useEffect(() => {
    if (!isFullscreen || !fullscreenIframeRef.current || !nodeMapping) return

    let clickHandler = null

    const setupFullscreenIframe = () => {
      const iframe = fullscreenIframeRef.current
      if (!iframe) return

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      if (!iframeDoc) return

      try {
        // Remove previous click handler if it exists
        if (clickHandler) {
          iframeDoc.removeEventListener('click', clickHandler, true)
          iframeDoc.removeEventListener('touchend', clickHandler, true)
          iframeDoc.removeEventListener('pointerdown', clickHandler, true)
        }

        // Phase 6(A): Wire click detection for element inspector
        // Helper function to extract selector from element
        const extractSelector = (element) => {
          // Try to find the selector from data attributes (set by buildDomFromNodes)
          let selector = element.getAttribute('data-selector')

          // Fallback: derive from className if element has one
          if (!selector && element.className) {
            const classes = element.className.split(' ').filter(c => !c.startsWith('pseudo-'))
            if (classes.length > 0) {
              selector = '.' + classes.join('.')
            }
          }

          // Fallback: use tag name
          if (!selector) {
            selector = element.tagName.toLowerCase()
          }

          return selector
        }

        // Helper function to handle element selection
        const handleElementSelection = (element) => {
          const selector = extractSelector(element)
          if (selector && nodeMapping) {
            // Get all rules affecting this selector
            const rules = getAffectingRulesForSelector(selector, rulesTree)
            setInspectedSelector(selector)
            setAffectingRules(rules)
          }
        }

        clickHandler = (e) => {
          e.preventDefault()
          e.stopPropagation()
          handleElementSelection(e.target)
        }

        // Add multiple event listeners for better mobile/desktop support
        iframeDoc.addEventListener('click', clickHandler, true) // Use capture phase to intercept before other handlers
        iframeDoc.addEventListener('touchend', clickHandler, true) // Add touch support for mobile
        iframeDoc.addEventListener('pointerdown', clickHandler, true) // Add pointer support for better touch/mouse handling
      } catch (e) {
        console.warn('Error setting up fullscreen iframe click detection:', e)
      }
    }

    // Set up click detection when iframe content is loaded
    setupFullscreenIframe()
    if (fullscreenIframeRef.current) {
      fullscreenIframeRef.current.onload = setupFullscreenIframe
    }

    // Cleanup
    return () => {
      if (fullscreenIframeRef.current && clickHandler) {
        try {
          const iframeDoc = fullscreenIframeRef.current.contentDocument || fullscreenIframeRef.current.contentWindow.document
          if (iframeDoc) {
            iframeDoc.removeEventListener('click', clickHandler, true)
            iframeDoc.removeEventListener('touchend', clickHandler, true)
            iframeDoc.removeEventListener('pointerdown', clickHandler, true)
          }
        } catch (e) {
          console.warn('Error cleaning up fullscreen iframe click detection:', e)
        }
      }
    }
  }, [isFullscreen, nodeMapping, rulesTree])

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
        disabledProperties,
        previewOverrides
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
        // Override keys are in format "ruleIndex::selector"
        Object.entries(previewOverrides).forEach(([overrideKey, overrideProps]) => {
          try {
            // Parse the override key to extract selector (ruleIndex is informational)
            const [, ...selectorParts] = overrideKey.split('::')
            const selector = selectorParts.join('::')

            const elements = iframeDoc.querySelectorAll(selector)
            elements.forEach(el => {
              Object.entries(overrideProps).forEach(([property, value]) => {
                el.style.setProperty(property, value, 'important')
              })
            })
          } catch (e) {
            console.warn(`Could not apply overrides to ${overrideKey}:`, e)
          }
        })

        // Phase 6(A): Wire click detection for element inspector
        // Helper function to extract selector from element
        const extractSelector = (element) => {
          // Try to find the selector from data attributes (set by buildDomFromNodes)
          let selector = element.getAttribute('data-selector')

          // Fallback: derive from className if element has one
          if (!selector && element.className) {
            const classes = element.className.split(' ').filter(c => !c.startsWith('pseudo-'))
            if (classes.length > 0) {
              selector = '.' + classes.join('.')
            }
          }

          // Fallback: use tag name
          if (!selector) {
            selector = element.tagName.toLowerCase()
          }

          return selector
        }

        // Helper function to handle element selection
        const handleElementSelection = (element) => {
          const selector = extractSelector(element)
          if (selector && nodeMapping) {
            // Get all rules affecting this selector
            const rules = getAffectingRulesForSelector(selector, rulesTree)
            setInspectedSelector(selector)
            setAffectingRules(rules)
          }
        }

        // Create unified handler for all interaction events
        const interactionHandler = (e) => {
          e.preventDefault()
          e.stopPropagation()
          handleElementSelection(e.target)
        }

        // Add multiple event listeners for better mobile/desktop support
        iframeDoc.addEventListener('click', interactionHandler, true) // Desktop clicks
        iframeDoc.addEventListener('touchend', interactionHandler, true) // Mobile touch
        iframeDoc.addEventListener('pointerdown', interactionHandler, true) // Pointer events for hybrid devices
      }

      // Call setup immediately after writing to contentDocument
      // Also set up onload as a fallback for srcdoc cases
      setupIframeContent()
      iframe.onload = setupIframeContent
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }, [rulesTree, declaredVariables, variableOverrides, viewportWidth, bgColor, forcedStates, disabledProperties, removedRules, previewOverrides])

  // Re-calculate affectingRules when rulesTree changes and inspector is showing a selector
  // This ensures the inspector panel updates in real-time when CSS source is edited
  useEffect(() => {
    if (!inspectedSelector || !rulesTree.length) return

    // Re-calculate rules affecting the currently inspected selector from the fresh rulesTree
    const updatedRules = getAffectingRulesForSelector(inspectedSelector, rulesTree)
    setAffectingRules(updatedRules)
  }, [inspectedSelector, rulesTree])

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
        // Collect all properties that were overridden and clear them
        const propertiesToClear = new Set()
        Object.entries(previewOverrides).forEach(([overrideKey, overrideProps]) => {
          Object.keys(overrideProps).forEach(property => {
            propertiesToClear.add(property)
          })
        })

        // Remove all overridden properties from all elements
        const allElements = iframeDoc.querySelectorAll('*')
        allElements.forEach(el => {
          propertiesToClear.forEach(property => {
            el.style.removeProperty(property)
          })
        })
      }
    }
  }

  // Check if there are any active overrides
  const hasActiveOverrides = Object.keys(previewOverrides).length > 0 || Object.keys(addedProperties).length > 0

  // Helper function to check if a property is overridden by a later rule in the cascade
  // If overridden, the property is not visible in the preview, so editing/disabling it does nothing
  const isPropertyOverriddenByLaterRule = (ruleIndex, selector, property) => {
    for (const rule of rulesTree) {
      // Only check rules that come AFTER this one
      if (rule.ruleIndex <= ruleIndex) continue

      // Check if this later rule has the same selector and contains this property
      if (rule.selector === selector && rule.declarations?.some(d => d.property === property)) {
        return true
      }

      // For at-rules, recurse into children
      if (rule.type === 'atrule' && rule.children?.length) {
        const checkChildren = (children) => {
          for (const child of children) {
            if (child.ruleIndex > ruleIndex && child.selector === selector && child.declarations?.some(d => d.property === property)) {
              return true
            }
            if (child.type === 'atrule' && child.children?.length && checkChildren(child.children)) {
              return true
            }
          }
          return false
        }
        if (checkChildren(rule.children)) return true
      }
    }
    return false
  }

  // Phase 6(F): Callbacks for managing added properties and locked state
  const handleAddPropertyChange = (updater) => {
    setAddedProperties(prev => typeof updater === 'function' ? updater(prev) : updater)
  }

  const handleLockPropertyChange = (updater) => {
    setLockedDisabledProperties(prev => typeof updater === 'function' ? updater(prev) : updater)
  }

  const handleReEnableProperty = (ruleIndex, propertyName) => {
    // Auto-re-enable the original property by removing it from disabledProperties
    const disabledKey = `${ruleIndex}-${propertyName}`
    setDisabledProperties(prev => {
      const next = new Set(prev)
      next.delete(disabledKey)
      return next
    })
  }

  // Phase 7A: Compute impact for a selected rule
  // Also include added properties in the impact analysis
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
        rulesTree,
        addedProperties
      )

      // Enhance impact with added properties for this rule
      if (impact && impact.affectedNodes && Object.keys(addedProperties).length > 0) {
        impact.affectedNodes = impact.affectedNodes.map(node => ({
          ...node,
          properties: [
            ...node.properties,
            // Add properties that were added to this rule
            ...Object.entries(addedProperties)
              .filter(([key]) => {
                const [addedRuleIndex] = key.split('::')
                return parseInt(addedRuleIndex) === rule.ruleIndex
              })
              .map(([key, value]) => {
                const [, propertyName] = key.split('::')
                // Check if this added property is overridden by a later rule
                const isOverriddenByLater = isPropertyOverriddenByLaterRule(rule.ruleIndex, rule.selector, propertyName)

                // Find the overriding rule index
                let overridingRuleIndex = undefined
                if (isOverriddenByLater) {
                  for (const r of rulesTree) {
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
  }

  // Phase 7D: Toggle property disabled state for what-if simulation
  // Parameters:
  //   ruleIndex: The rule's index
  //   property: The property name
  //   isAddedProperty: Boolean indicating if this is an added (new) property
  const handleTogglePropertyDisabled = (ruleIndex, property, isAddedProperty = false) => {
    // Use different key format for added vs. original properties
    const disabledKey = isAddedProperty ? `${ruleIndex}::ADDED::${property}` : `${ruleIndex}-${property}`

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
    if (affectedRule) {
      const overrideKey = `${ruleIndex}::${affectedRule.selector}`
      if (previewOverrides[overrideKey]) {
        setPreviewOverrides(prev => {
          const next = { ...prev }
          if (next[overrideKey] && next[overrideKey][property]) {
            // Remove this specific property override
            const updatedProps = { ...next[overrideKey] }
            delete updatedProps[property]
            if (Object.keys(updatedProps).length === 0) {
              delete next[overrideKey]
            } else {
              next[overrideKey] = updatedProps
            }
          }
          return next
        })
      }
    }

    // Note: Do NOT remove from addedProperties when disabling an added property
    // The property should remain in the list but be visually disabled
    // This is just marking it as disabled in the disabledProperties set
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

  // Phase 7E: Handle merge selectors request - open confirmation modal
  const handleMergeClick = (mergeableGroups) => {
    setMergeableGroupsForModal(mergeableGroups)
  }

  // Phase 7E: Confirm and apply merge operation
  const handleMergeConfirm = (mergedCSS) => {
    if (onApplyEdits && mergedCSS) {
      try {
        onApplyEdits(mergedCSS)
        setMergeableGroupsForModal(null) // Close the modal
      } catch (e) {
        console.error('Error applying merged CSS:', e)
      }
    }
  }

  // Phase 7E: Cancel merge operation
  const handleMergeCancel = () => {
    setMergeableGroupsForModal(null)
  }

  // Phase 7A Stage 4: Handle hover interactions for affected nodes
  // Highlights or removes highlights from matching elements in the preview
  const handleAffectedNodeHover = (selector, action) => {
    // Use fullscreen iframe if in fullscreen mode, otherwise use regular iframe
    const iframeToUse = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
    if (!iframeToUse) return

    const iframe = iframeToUse
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    if (!iframeDoc) return

    try {
      let elements = null

      // Extract base selector from pseudo-classes/pseudo-elements
      // Handle pseudo-element selectors (.header::before, .button::after, etc.)
      // and pseudo-class selectors (.button:hover, .header:focus, etc.)
      // Pseudo-elements and pseudo-classes aren't real DOM elements, so we highlight the base element instead
      if (selector.includes(':')) {
        // Find the first colon and extract everything before it
        const colonIndex = selector.indexOf(':')
        const baseSelector = selector.substring(0, colonIndex)
        if (baseSelector && baseSelector.trim()) {
          try {
            elements = iframeDoc.querySelectorAll(baseSelector.trim())
          } catch (selectorError) {
            // Fallback: try to extract just the class/tag name
            const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/)
            if (classMatch) {
              elements = iframeDoc.querySelectorAll('.' + classMatch[1])
            } else {
              const tagMatch = selector.match(/^([a-zA-Z]+)/)
              if (tagMatch) {
                elements = iframeDoc.querySelectorAll(tagMatch[1])
              }
            }
          }
        }
      } else {
        // Regular selector without pseudo-classes/elements (.button, .header, etc.)
        try {
          elements = iframeDoc.querySelectorAll(selector)
        } catch (selectorError) {
          console.warn(`Invalid selector "${selector}":`, selectorError)
        }
      }

      if (elements && elements.length > 0) {
        elements.forEach(el => {
          if (action === 'highlight') {
            el.classList.add('_preview-highlight')
            setHighlightedSelector(selector)
          } else if (action === 'remove') {
            el.classList.remove('_preview-highlight')
            setHighlightedSelector(null)
          }
        })
      }
    } catch (e) {
      console.warn(`Could not highlight selector ${selector}:`, e)
    }
  }

  // Phase 6(E): Apply previewOverrides to rulesTree by mutating in place (NOT creating new rules)
  // This ensures we preserve cascade structure and don't create duplicate selectors
  // Overrides are keyed by "ruleIndex::selector" to ensure edits are rule-specific
  // Returns { mutatedRules, changeSummary } for feedback
  const applyOverridesToRulesTree = (rulesToMutate, overrides) => {
    if (!rulesToMutate || !overrides || Object.keys(overrides).length === 0) {
      return { mutatedRules: rulesToMutate, changeSummary: [] }
    }

    // Create a deep copy to avoid mutating the original
    const mutatedRules = JSON.parse(JSON.stringify(rulesToMutate))
    const changeSummary = [] // Track what was changed for feedback

    // For each override (keyed by "ruleIndex::selector")
    Object.entries(overrides).forEach(([overrideKey, editedProps]) => {
      if (Object.keys(editedProps).length === 0) return

      // Parse the override key to extract ruleIndex and selector
      const [ruleIndexStr, ...selectorParts] = overrideKey.split('::')
      const ruleIndex = parseInt(ruleIndexStr)
      const selector = selectorParts.join('::') // Rejoin in case selector contains "::"

      const selectorChanges = { selector, properties: [] }

      // Find the specific rule matching both ruleIndex and selector
      const findAndUpdateRule = (rules) => {
        rules.forEach(rule => {
          // Update only the rule that matches both ruleIndex and selector
          if (rule.type === 'rule' && rule.ruleIndex === ruleIndex && rule.selector === selector) {
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

  // Phase 6(E) + 6(F): Handle applying staged edits to the source CSS
  // Mutates the source CSS by updating declarations in their original rules (no duplication)
  // Also includes added properties via surgical injection
  const handleApplyEdits = () => {
    const hasEdits = hasActiveOverrides || Object.keys(addedProperties).length > 0
    if (!hasEdits || !onApplyEdits) return

    try {
      // Step 1: Apply overrides to rulesTree by mutating in place
      const { mutatedRules, changeSummary: overrideSummary } = applyOverridesToRulesTree(rulesTree, previewOverrides)

      // Step 2: Merge added properties into the mutated rules
      const finalMutatedRules = JSON.parse(JSON.stringify(mutatedRules))
      const addedPropertySummary = []

      Object.entries(addedProperties).forEach(([key, value]) => {
        const [ruleIndexStr, propertyName] = key.split('::')
        const ruleIndex = parseInt(ruleIndexStr)

        // Find the rule by ruleIndex
        const findAndAddProperty = (rules) => {
          for (const rule of rules) {
            if (rule.type === 'rule' && rule.ruleIndex === ruleIndex) {
              if (!rule.declarations) {
                rule.declarations = []
              }

              // Check if this property already exists (from overrides)
              const existingIdx = rule.declarations.findIndex(d => d.property === propertyName)
              if (existingIdx === -1) {
                // Add new property
                rule.declarations.push({
                  property: propertyName,
                  value: value,
                  loc: {
                    startLine: rule.loc?.endLine || 0,
                    endLine: rule.loc?.endLine || 0,
                  },
                })
              }
              // If it already exists, it was already handled by the override step
              addedPropertySummary.push({ selector: rule.selector, property: propertyName, action: 'added' })
              return true
            }
            // Recursively search in at-rules (media queries, etc.)
            if (rule.children && Array.isArray(rule.children)) {
              if (findAndAddProperty(rule.children)) return true
            }
          }
          return false
        }

        findAndAddProperty(finalMutatedRules)
      })

      // Step 3: Serialize the final mutated tree back to CSS
      const editedCSS = serializeRulesToCSS(finalMutatedRules)

      if (editedCSS.trim()) {
        onApplyEdits(editedCSS)

        // Track changes for feedback (show brief success message)
        const totalChanges = overrideSummary.reduce((sum, item) => sum + item.properties.length, 0) + addedPropertySummary.length
        const summaryItems = [
          ...overrideSummary.map(item => `${item.selector} → ${item.properties.length} property(ies)`),
          ...addedPropertySummary.length > 0 ? [`${addedPropertySummary.length} new property(ies)`] : []
        ]
        setAppliedChanges({
          count: totalChanges,
          summary: summaryItems.join(', ')
        })

        // Clear the feedback after 3 seconds
        setTimeout(() => setAppliedChanges(null), 3000)

        // Clear overrides and added properties after applying
        setPreviewOverrides({})
        setAddedProperties({})
      }
    } catch (e) {
      console.error('Error applying staged edits:', e)
    }
  }

  // Phase 6(D): Handle property edits with override tracking
  // Saves to previewOverrides state AND applies to iframe for real-time preview
  // Parameters:
  //   selector: CSS selector string
  //   property: CSS property name
  //   newValue: New property value
  //   isAddedProperty: Boolean indicating if this is a newly added property
  //   ruleIndex: Numeric index of the rule being edited (used for surgical injection)
  const handlePropertyEdit = (selector, property, newValue, isAddedProperty = false, ruleIndex = null) => {
    // Track in addedProperties state if it's a newly added property
    if (isAddedProperty && ruleIndex !== null) {
      const addedKey = `${ruleIndex}::${property}`
      if (newValue === null || newValue === undefined || newValue === '') {
        // Delete if empty
        setAddedProperties(prev => {
          const next = { ...prev }
          delete next[addedKey]
          return next
        })
      } else {
        setAddedProperties(prev => ({
          ...prev,
          [addedKey]: newValue,
        }))
      }
    }

    // Check if property is overridden FIRST before adding to previewOverrides
    // This prevents overridden properties from being applied to the preview at all
    const isPropertyOverridden = isPropertyOverriddenByLaterRule(ruleIndex, selector, property)

    // ALWAYS track in previewOverrides for real-time preview
    // (applies to both original properties and newly added ones)
    // Key format: "ruleIndex::selector" to ensure edits are rule-specific, not selector-wide
    // BUT: Don't track properties that are overridden, since they have no visual effect
    if (ruleIndex === null) return // Require ruleIndex for proper scoping

    if (!isPropertyOverridden) {
      const overrideKey = `${ruleIndex}::${selector}`
      setPreviewOverrides(prev => {
        const next = { ...prev }
        if (!next[overrideKey]) {
          next[overrideKey] = {}
        }
        if (newValue === null || newValue === undefined || newValue === '') {
          // Delete override if empty
          delete next[overrideKey][property]
          if (Object.keys(next[overrideKey]).length === 0) {
            delete next[overrideKey]
          }
        } else {
          next[overrideKey][property] = newValue
        }
        return next
      })
    }

    // Apply to iframe immediately for real-time preview
    if (!iframeRef.current || isPropertyOverridden) return

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
          className={`${styles.controlsToggleBtn} ${styles.fullscreenBtnDesktopOnly}`}
          onClick={() => onToggleFullscreen?.(true)}
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

      <div className={styles.previewMainLayout}>
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
          <div className={styles.inspectorPanel}>
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
              onMergeClick={handleMergeClick}
              rulesTree={rulesTree}
              addedProperties={addedProperties}
              onAddPropertyChange={handleAddPropertyChange}
              lockedDisabledProperties={lockedDisabledProperties}
              onLockPropertyChange={handleLockPropertyChange}
              onReEnableProperty={handleReEnableProperty}
              isPropertyOverriddenByLaterRule={isPropertyOverriddenByLaterRule}
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
            backgroundColor: 'var(--color-background-primary, #fff)',
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
              padding: '8px 16px',
              backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              height: '40px',
              borderBottom: 'none',
            }}
          >
            <div style={{ position: 'relative' }}>
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
                    minWidth: '320px',
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
                            backgroundColor: viewportWidth === width ? (theme === 'dark' ? 'rgba(33, 150, 243, 0.4)' : 'rgba(0, 102, 204, 0.2)') : 'transparent',
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
                      Background Color:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        style={{ width: '40px', height: '28px', padding: '2px', borderRadius: '2px', border: `1px solid ${theme === 'dark' ? '#555' : 'var(--color-border, #ddd)'}`, cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        style={{ flex: 1, padding: '4px 6px', fontSize: '11px', borderRadius: '2px', border: `1px solid ${theme === 'dark' ? '#555' : 'var(--color-border, #ddd)'}`, backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }}
                        placeholder="#ffffff"
                      />
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
                      setBgColor('#ffffff')
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
            <button
              onClick={() => onToggleFullscreen?.(false)}
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
          <div className={styles.fullscreenPreviewLayout}>
            <div className={styles.fullscreenPreviewCanvas}>
              <iframe
                ref={fullscreenIframeRef}
                srcDoc={currentPreviewHTML}
                sandbox="allow-same-origin"
                style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                title="CSS Preview Fullscreen"
              />
            </div>

            {/* Fullscreen Inspector Panel */}
            {inspectedSelector && affectingRules.length > 0 && (
              <div className={styles.inspectorPanelFullscreen}>
                <RuleInspector
                  selector={inspectedSelector}
                  affectingRules={affectingRules}
                  onClose={() => {
                    // Clear any active highlights before closing
                    if (highlightedSelector && fullscreenIframeRef.current) {
                      const iframe = fullscreenIframeRef.current
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
                  onMergeClick={handleMergeClick}
                  rulesTree={rulesTree}
                  addedProperties={addedProperties}
                  onAddPropertyChange={handleAddPropertyChange}
                  lockedDisabledProperties={lockedDisabledProperties}
                  onLockPropertyChange={handleLockPropertyChange}
                  onReEnableProperty={handleReEnableProperty}
                  isPropertyOverriddenByLaterRule={isPropertyOverriddenByLaterRule}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 7E: Merge Selectors Confirmation Modal */}
      {mergeableGroupsForModal && (
        <MergeSelectorConfirmation
          mergeableGroups={mergeableGroupsForModal}
          rulesTree={rulesTree}
          sourceText={sourceText}
          onConfirm={handleMergeConfirm}
          onCancel={handleMergeCancel}
        />
      )}
    </div>
  )
}
