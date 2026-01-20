import React, { useRef, useState, useCallback } from 'react'
import { computeRuleImpact } from '../lib/tools/ruleImpactAnalysis'
import { findAllMergeableGroups } from '../lib/tools/mergeSelectors'
import { generateSyntheticDom } from '../lib/tools/syntheticDom'
import { scopeCss } from '../lib/tools/cssScoper'
import { extractCssFromHtml, removeStyleTagsFromHtml } from '../lib/tools/cssExtractor'
import { extractSelectorsFromCSS } from '../lib/tools/selectorScanner'
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

// Note: CSS scoping is now handled by scopeCss() during serialization

// Transform CSS to simulate forced pseudo-states
// Finds rules with :hover, :focus, :active and creates duplicates
// by prepending a parent attribute selector (data-force-*) that sits outside preview
function transformCssForForcedStates(css, previewClass, forcedStates) {
  if (!css || Object.values(forcedStates).every(v => !v)) return css

  let result = css
  const duplicates = []

  // Simple regex-based approach: find any rule containing :hover/:focus/:active
  const ruleRegex = /([^{}]+)\s*\{\s*([^{}]*)\}/g
  let match

  // Collect rules to avoid modifying while iterating
  const rulesToAdd = []

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim()
    const block = match[2].trim()

    // Skip empty selectors or blocks
    if (!selector || !block) continue

    // Check if this selector has pseudo-states
    if (forcedStates.hover && selector.includes(':hover')) {
      // Remove :hover and prepend [data-force-hover] parent selector
      const forcedSelector = selector.replace(/:hover/g, '').trim()
      rulesToAdd.push(`[data-force-hover="true"] ${forcedSelector} { ${block} }`)
    }

    if (forcedStates.focus && selector.includes(':focus')) {
      const forcedSelector = selector.replace(/:focus/g, '').trim()
      rulesToAdd.push(`[data-force-focus="true"] ${forcedSelector} { ${block} }`)
    }

    if (forcedStates.active && selector.includes(':active')) {
      const forcedSelector = selector.replace(/:active/g, '').trim()
      rulesToAdd.push(`[data-force-active="true"] ${forcedSelector} { ${block} }`)
    }
  }

  // Append all duplicates to the CSS
  if (rulesToAdd.length > 0) {
    result += '\n/* Forced pseudo-state rules */\n'
    result += rulesToAdd.join('\n')
  }

  return result
}

// Serialize rulesTree back to CSS text (used only for inspector "what-if" previews with disabled properties)
/**
 * Serialize rules back to CSS, grouped by origin
 * @returns { html: string, css: string } - Separate CSS for each origin
 */
function serializeRulesByOrigin(rulesToSerialize) {
  if (!rulesToSerialize || rulesToSerialize.length === 0) {
    return { html: '', css: '' }
  }

  // Separate rules by origin
  const rulesByOrigin = { html: [], css: [] }

  rulesToSerialize.forEach(rule => {
    const source = rule.origin?.source || 'css'
    if (source === 'html') {
      rulesByOrigin.html.push(rule)
    } else {
      rulesByOrigin.css.push(rule)
    }
  })

  const processRulesToCSS = (rules) => {
    if (rules.length === 0) return ''

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

    rules.forEach(rule => {
      processRule(rule)
      cssLines.push('')
    })

    return cssLines.join('\n').trim()
  }

  return {
    html: processRulesToCSS(rulesByOrigin.html),
    css: processRulesToCSS(rulesByOrigin.css),
  }
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
  onHtmlChange = null, // Called when editing embedded HTML CSS
  onSourceChange = null, // Called with { source: 'html'|'css', newContent }
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
  const [isClosingControls, setIsClosingControls] = useState(false)
  const [showFullscreenSettings, setShowFullscreenSettings] = useState(false)
  const [isClosingFullscreenSettings, setIsClosingFullscreenSettings] = useState(false)
  const [showFullscreenInputPanel, setShowFullscreenInputPanel] = useState(false)
  const [isClosingInputPanel, setIsClosingInputPanel] = useState(false)
  const [inputPanelDividerRatio, setInputPanelDividerRatio] = useState(50) // 50/50 split
  const [inputPanelContent, setInputPanelContent] = useState(content)
  const [inputPanelCss, setInputPanelCss] = useState(customCss)
  const [inputPanelWidth, setInputPanelWidth] = useState(480) // Width in pixels
  const inputPanelDividerRef = useRef(null)
  const isDraggingInputDividerRef = useRef(false)
  const isDraggingInputPanelEdgeRef = useRef(false)
  const inputPanelEdgeRef = useRef(null)
  const inputPanelEdgeHandleRef = useRef(null)

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
  const closeInputPanelTimeoutRef = useRef(null)
  const wasInspectorOpenWhenEnteringFullscreenRef = useRef(false)
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

  // When properties change, serialize by origin and call appropriate callbacks
  const applyChangesToSource = (updatedRules) => {
    const { html, css } = serializeRulesByOrigin(updatedRules)

    // Update CSS tab if CSS rules changed
    if (css && onCssChange) {
      onCssChange(css)
    }

    // Update HTML if embedded CSS rules changed
    if (html && onHtmlChange) {
      onHtmlChange(html)
    }

    // Fallback: if generic source change callback provided
    if (onSourceChange) {
      if (html) onSourceChange({ source: 'html', newContent: html })
      if (css) onSourceChange({ source: 'css', newContent: css })
    }
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

  const handleCloseInputPanel = () => {
    setIsClosingInputPanel(true)
    if (closeInputPanelTimeoutRef.current) {
      clearTimeout(closeInputPanelTimeoutRef.current)
    }
    closeInputPanelTimeoutRef.current = setTimeout(() => {
      setShowFullscreenInputPanel(false)
      setIsClosingInputPanel(false)
    }, 300) // Match animation duration
  }

  const handleInputPanelDividerMouseDown = () => {
    isDraggingInputDividerRef.current = true
  }

  const handleInputPanelEdgeMouseDown = () => {
    isDraggingInputPanelEdgeRef.current = true
  }

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingInputDividerRef.current || !inputPanelDividerRef.current) return

      const container = inputPanelDividerRef.current.parentElement
      if (!container) return

      const containerHeight = container.clientHeight
      const relativeY = e.clientY - container.getBoundingClientRect().top
      const newRatio = Math.max(20, Math.min(80, (relativeY / containerHeight) * 100))
      setInputPanelDividerRatio(newRatio)
    }

    const handleMouseUp = () => {
      isDraggingInputDividerRef.current = false
      // Re-enable text selection
      document.body.style.userSelect = 'auto'
      // Reset divider style
      if (inputPanelDividerRef.current) {
        inputPanelDividerRef.current.style.backgroundColor = 'var(--color-border, #ddd)'
      }
    }

    const handleMouseDown = (e) => {
      if (isDraggingInputDividerRef.current) {
        // Disable text selection while dragging
        document.body.style.userSelect = 'none'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousedown', handleMouseDown)
      // Clean up in case component unmounts while dragging
      document.body.style.userSelect = 'auto'
    }
  }, [])

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingInputPanelEdgeRef.current || !inputPanelEdgeRef.current) return

      const fullscreenContainer = inputPanelEdgeRef.current.parentElement
      if (!fullscreenContainer) return

      const containerWidth = fullscreenContainer.clientWidth
      const relativeX = containerWidth - (e.clientX - fullscreenContainer.getBoundingClientRect().left)
      const newWidth = Math.max(200, Math.min(800, relativeX))
      setInputPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      isDraggingInputPanelEdgeRef.current = false
      // Re-enable text selection
      document.body.style.userSelect = 'auto'
      // Reset edge handle style
      if (inputPanelEdgeHandleRef.current) {
        inputPanelEdgeHandleRef.current.style.backgroundColor = 'transparent'
      }
    }

    const handleMouseDown = (e) => {
      if (isDraggingInputPanelEdgeRef.current) {
        // Disable text selection while dragging
        document.body.style.userSelect = 'none'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousedown', handleMouseDown)
      // Clean up in case component unmounts while dragging
      document.body.style.userSelect = 'auto'
    }
  }, [])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeInspectorTimeoutRef.current) {
        clearTimeout(closeInspectorTimeoutRef.current)
      }
      if (closeInputPanelTimeoutRef.current) {
        clearTimeout(closeInputPanelTimeoutRef.current)
      }
    }
  }, [])

  // Sync local input panel content with parent content prop (for external updates only)
  React.useEffect(() => {
    setInputPanelContent(content)
  }, [content])

  // Sync local input panel CSS with parent customCss prop (for external updates only)
  React.useEffect(() => {
    setInputPanelCss(customCss)
  }, [customCss])

  // Track container width for responsive inspector panel sizing
  React.useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Track inspector state continuously in non-fullscreen mode
  React.useEffect(() => {
    if (!isFullscreen) {
      wasInspectorOpenWhenEnteringFullscreenRef.current = showInspector
    }
  }, [showInspector, isFullscreen])

  // When entering fullscreen, open edit code panel only if inspector was not open
  React.useEffect(() => {
    if (isFullscreen) {
      // Only open Edit Code panel if Inspector was NOT open when entering fullscreen
      if (!wasInspectorOpenWhenEnteringFullscreenRef.current) {
        setShowFullscreenInputPanel(true)
      }
    }
  }, [isFullscreen])

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

  // Close controls dropdown when clicking outside
  React.useEffect(() => {
    if (!showControls) return

    const handleClickOutside = (e) => {
      // Don't close if clicking on the settings button or inside the dropdown
      if (e.target.closest('[data-preview-settings]')) return
      setIsClosingControls(true)
      setTimeout(() => {
        setShowControls(false)
        setIsClosingControls(false)
      }, 150)
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [showControls])

  // Close fullscreen settings dropdown when clicking outside
  React.useEffect(() => {
    if (!showFullscreenSettings) return

    const handleClickOutside = (e) => {
      // Don't close if clicking on the settings button or inside the dropdown
      if (e.target.closest('[data-fullscreen-settings]')) return
      handleCloseFullscreenSettings()
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [showFullscreenSettings])

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
  // Also extracts selectors from embedded CSS in HTML <style> tags
  // Groups them by type (STRUCTURE, HEADINGS, TEXT, CODE) like the CSS tab does
  const getAvailableSelectors = () => {
    const containerRef = isFullscreen ? fullscreenContainerRef : previewContainerRef
    if (!containerRef?.current) return []

    const previewElement = containerRef.current.querySelector('.pwt-preview')
    if (!previewElement) return []

    // Collect all selectors from the preview
    const selectors = {
      structure: new Set(),
      headings: new Set(),
      text: new Set(),
      code: new Set(),
      other: new Set(),
    }

    // If HTML mode, extract selectors from embedded CSS first
    if (isHtml && content) {
      const embeddedCss = extractCssFromHtml(content)
      if (embeddedCss) {
        const cssSelectors = extractSelectorsFromCSS(embeddedCss)

        // Merge embedded CSS selectors into our collections
        if (cssSelectors.suggestions) {
          // Add structure selectors
          if (cssSelectors.suggestions.structure) {
            cssSelectors.suggestions.structure.forEach(sel => {
              selectors.structure.add(sel)
            })
          }
          // Add heading selectors
          if (cssSelectors.suggestions.headings) {
            cssSelectors.suggestions.headings.forEach(sel => {
              selectors.headings.add(sel)
            })
          }
          // Add text selectors
          if (cssSelectors.suggestions.text) {
            cssSelectors.suggestions.text.forEach(sel => {
              selectors.text.add(sel)
            })
          }
          // Add code selectors
          if (cssSelectors.suggestions.code) {
            cssSelectors.suggestions.code.forEach(sel => {
              selectors.code.add(sel)
            })
          }
        }
      }
    }

    // Helper to verify a selector actually matches elements in the DOM
    const selectorHasMatches = (selector) => {
      try {
        const matches = previewElement.querySelectorAll(selector)
        return matches.length > 0
      } catch {
        return false
      }
    }

    const traverse = (element) => {
      const tagName = element.tagName?.toLowerCase()

      // NEVER process body or html tags
      if (tagName === 'body' || tagName === 'html' || tagName === 'style' || tagName === 'script') {
        return
      }

      // Categorize commonly styled tags
      if (tagName && tagName.match(/^h[1-6]$/)) {
        selectors.headings.add(tagName)
      } else if (['p', 'strong', 'em', 'b', 'i', 'a', 'span', 'u', 'ul', 'ol', 'li', 'button', 'input', 'label', 'form', 'textarea', 'select', 'option', 'fieldset'].includes(tagName)) {
        selectors.text.add(tagName)
      } else if (['pre', 'code'].includes(tagName)) {
        selectors.code.add(tagName)
      } else if (['div', 'section', 'article', 'main', 'nav', 'aside', 'header', 'footer', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'hr'].includes(tagName)) {
        selectors.structure.add(tagName)
      }

      // Add class selectors with strict filtering
      if (element.classList && element.classList.length > 0) {
        Array.from(element.classList).forEach(className => {
          if (!className) return

          const selector = `.${className}`

          // Skip any language-* classes (internal syntax highlighting)
          if (className.startsWith('language-')) return

          // Skip internal framework classes (except pwt-preview which users can style)
          if (className.startsWith('pwt-') && className !== 'pwt-preview') return
          if (className.includes('__')) return

          // Skip CSS module classes (has underscore convention like "__abc123")
          if (className.match(/__[a-zA-Z0-9]+$/)) return

          // Skip common framework-generated classes
          if (className.match(/^react-|^ng-|^vue-|^_next|^__/i)) return

          // Skip if selector doesn't match any elements
          if (!selectorHasMatches(selector)) return

          // Categorize
          if (className.includes('code') || className.includes('pre')) {
            selectors.code.add(selector)
          } else if (className.includes('heading') || className.includes('title') || className.includes('h[0-6]')) {
            selectors.headings.add(selector)
          } else if (className.includes('text') || className.includes('paragraph') || className.includes('body')) {
            selectors.text.add(selector)
          } else {
            selectors.structure.add(selector)
          }
        })
      }

      // Add ID selectors (skip internal ones)
      if (element.id && !element.id.startsWith('pwt-')) {
        const idSelector = `#${element.id}`
        if (selectorHasMatches(idSelector)) {
          selectors.other.add(idSelector)
        }
      }

      // Recurse
      for (const child of element.children) {
        traverse(child)
      }
    }

    // Traverse only children of preview element
    if (previewElement && previewElement.children) {
      for (const child of previewElement.children) {
        traverse(child)
      }
    }

    // Always add the preview container selector - users always want to be able to style it
    // All renderers now have the universal .pwt-preview class
    selectors.structure.add('.pwt-preview')

    // Get existing selectors from rules tree
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

    // Filter: remove existing rules but allow preview container selector
    const finalResult = grouped
      .map(group => ({
        ...group,
        selectors: group.selectors.filter(s => {
          // Skip if already in rules
          if (existingSelectors.has(s)) return false
          return true
        }),
      }))
      .filter(group => group.selectors.length > 0)

    return finalResult
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

    // Find the preview element
    const previewElement = containerRef.current.querySelector('.pwt-preview')

    if (!previewElement) return

    // Scope the selector to only match elements within the preview container
    // If selector is .pwt-preview itself, don't double-scope it
    const scopedSelector = selector === '.pwt-preview'
      ? selector
      : `.pwt-preview ${selector}`

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

  const handleCloseControls = () => {
    setIsClosingControls(true)
    const timeoutId = setTimeout(() => {
      setShowControls(false)
      setIsClosingControls(false)
    }, 150) // Match animation duration
    return timeoutId
  }

  const handleCloseFullscreenSettings = () => {
    setIsClosingFullscreenSettings(true)
    setTimeout(() => {
      setShowFullscreenSettings(false)
      setIsClosingFullscreenSettings(false)
    }, 150) // Match animation duration
  }

  const renderPreviewSettings = () => (
    <div className={styles.previewControlsHeader}>
      <div style={{ position: 'relative' }} data-preview-settings>
        <button
          className={styles.controlsToggleBtn}
          onClick={() => {
            if (showControls) {
              handleCloseControls()
            } else {
              setShowControls(true)
            }
          }}
        >
          ⚙ Settings
        </button>
        {(showControls || isClosingControls) && (
          <>
            <style>{`
              @keyframes fadeInControls {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes fadeOutControls {
                from {
                  opacity: 1;
                }
                to {
                  opacity: 0;
                }
              }
            `}</style>
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
                animation: isClosingControls ? 'fadeOutControls 0.15s ease-in forwards' : 'fadeInControls 0.15s ease-out forwards',
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
                  setIsClosingControls(true)
                  setTimeout(() => {
                    setShowControls(false)
                    setIsClosingControls(false)
                  }, 150)
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
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        {effectiveRulesTree.length > 0 && (
          <button
            className={styles.controlsToggleBtn}
            onClick={() => showInspector ? handleCloseInspector() : setShowInspector(true)}
            style={{ backgroundColor: showInspector ? 'rgba(33, 150, 243, 0.2)' : 'transparent' }}
          >
            Inspector
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
    // Use the universal preview class for scoping (works for both HTML and Markdown)
    const previewClass = '.pwt-preview'

    // Build filtered rules tree by removing disabled properties
    const getFilteredRulesTree = (rules) => {
      if (!rules || rules.length === 0) return []

      return rules.map(rule => {
        if (rule.type === 'rule') {
          // Filter out disabled properties
          const filteredDeclarations = (rule.declarations || []).filter(decl => {
            const disabledKey = `${rule.ruleIndex}-${decl.property}`
            return !disabledProperties.has(disabledKey)
          })

          // Also add back any added properties that aren't disabled
          const enhancedDeclarations = [...filteredDeclarations]
          Object.entries(addedProperties).forEach(([key, value]) => {
            // Key format: "ruleIndex::ADDED::propertyName"
            const parts = key.split('::')
            if (parts.length >= 3) {
              const addedRuleIndex = parseInt(parts[0])
              // propertyName is everything after "::ADDED::" (in case property name has ::)
              const propertyName = parts.slice(2).join('::')

              if (addedRuleIndex === rule.ruleIndex) {
                // Check if this added property is disabled
                const disabledKey = `${rule.ruleIndex}::ADDED::${propertyName}`
                if (!disabledProperties.has(disabledKey)) {
                  enhancedDeclarations.push({ property: propertyName, value, loc: {} })
                }
              }
            }
          })

          return {
            ...rule,
            declarations: enhancedDeclarations,
          }
        } else if (rule.type === 'atrule' && rule.children) {
          // Recursively filter children of at-rules
          return {
            ...rule,
            children: getFilteredRulesTree(rule.children),
          }
        }
        return rule
      }).filter(rule => {
        // Remove rules with no declarations (after filtering)
        if (rule.type === 'rule' && (!rule.declarations || rule.declarations.length === 0)) {
          return false
        }
        return true
      })
    }

    // Serialize filtered rules back to CSS text
    const serializeRulesToCss = (rules) => {
      if (!rules || rules.length === 0) return ''

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

      rules.forEach(rule => {
        processRule(rule)
        cssLines.push('')
      })

      return cssLines.join('\n').trim()
    }

    let css = ''

    // Filter the rules tree to remove disabled properties
    const filteredRulesTree = getFilteredRulesTree(effectiveRulesTree)

    // Serialize the filtered rules back to CSS
    if (filteredRulesTree.length > 0) {
      css = serializeRulesToCss(filteredRulesTree)
    }

    // Scope the merged CSS
    if (css) {
      css = scopeCss(css, previewClass)
    }

    // Transform CSS to duplicate :hover/:focus/:active rules with attribute selectors
    // This allows user's existing :hover styles to work with forced states
    css = transformCssForForcedStates(css, previewClass, forcedStates)

    return css
  }

  const renderPreviewContent = () => {
    const previewCss = getPreviewCss()

    // Build data attributes object for forced pseudo-states
    const dataAttrs = {}
    if (forcedStates.hover) dataAttrs['data-force-hover'] = 'true'
    if (forcedStates.focus) dataAttrs['data-force-focus'] = 'true'
    if (forcedStates.active) dataAttrs['data-force-active'] = 'true'

    // For HTML mode, remove <style> tags from content (CSS is extracted and merged above)
    const contentToRender = isHtml ? removeStyleTagsFromHtml(content) : content

    return (
      <div
        ref={isFullscreen ? undefined : previewContainerRef}
        {...dataAttrs}
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
            html={contentToRender}
            customCss={previewCss}
          />
        ) : (
          <MarkdownRenderer
            markdown={content}
            customCss={previewCss}
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
          <div style={{ position: 'relative', paddingLeft: '12px' }} data-fullscreen-settings>
            <button
              onClick={() => {
                if (showFullscreenSettings) {
                  handleCloseFullscreenSettings()
                } else {
                  setShowFullscreenSettings(true)
                }
              }}
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
            {(showFullscreenSettings || isClosingFullscreenSettings) && (
              <>
                <style>{`
                  @keyframes fadeInSettings {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes fadeOutSettings {
                    from { opacity: 1; }
                    to { opacity: 0; }
                  }
                `}</style>
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
                    animation: isClosingFullscreenSettings ? 'fadeOutSettings 0.15s ease-in forwards' : 'fadeInSettings 0.15s ease-out forwards',
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
                      handleCloseFullscreenSettings()
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
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingRight: '12px' }}>
            <button
              onClick={() => {
                if (showFullscreenInputPanel) {
                  handleCloseInputPanel()
                } else {
                  setShowFullscreenInputPanel(true)
                  if (showInspector) handleCloseInspector()
                }
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: showFullscreenInputPanel ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
                border: '1px solid var(--color-border, #ddd)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--color-text-primary, #000)',
              }}
            >
              Edit Code
            </button>
            {effectiveRulesTree.length > 0 && (
              <button
                onClick={() => {
                  if (showInspector) {
                    handleCloseInspector()
                  } else {
                    setShowInspector(true)
                    if (showFullscreenInputPanel) handleCloseInputPanel()
                  }
                }}
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
                Inspector
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

        {/* Fullscreen Input Panel */}
        {(showFullscreenInputPanel || isClosingInputPanel) && (
          <>
            <style>{`
              @keyframes slideInRightInput {
                from {
                  right: ${containerWidth < 640 ? '-100%' : `-${inputPanelWidth}px`};
                  opacity: 0;
                }
                to {
                  right: 0;
                  opacity: 1;
                }
              }
              @keyframes slideOutRightInput {
                from {
                  right: 0;
                  opacity: 1;
                }
                to {
                  right: ${containerWidth < 640 ? '-100%' : `-${inputPanelWidth}px`};
                  opacity: 0;
                }
              }
              .input-panel-textarea::-webkit-scrollbar {
                width: 6px;
              }
              .input-panel-textarea::-webkit-scrollbar-track {
                background: transparent;
              }
              .input-panel-textarea::-webkit-scrollbar-thumb {
                background-color: var(--scrollbar-thumb, #ccc);
                border-radius: 3px;
              }
              .input-panel-textarea::-webkit-scrollbar-thumb:hover {
                background-color: var(--scrollbar-thumb-hover, #999);
              }
            `}</style>
            <div
              ref={inputPanelEdgeRef}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: containerWidth < 640 ? '100%' : `${inputPanelWidth}px`,
                right: isClosingInputPanel ? (containerWidth < 640 ? '-100%' : `-${inputPanelWidth}px`) : 0,
                borderLeft: '1px solid var(--color-border, #ddd)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                overflow: 'hidden',
                animation: isClosingInputPanel ? 'slideOutRightInput 0.3s ease-in forwards' : 'slideInRightInput 0.3s ease-out forwards',
                zIndex: 100,
              }}
            >
              {/* Left Edge Draggable Handle */}
              {containerWidth >= 640 && (
                <div
                  ref={inputPanelEdgeHandleRef}
                  onMouseDown={handleInputPanelEdgeMouseDown}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'col-resize',
                    backgroundColor: 'transparent',
                    zIndex: 10,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isDraggingInputPanelEdgeRef.current) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                />
              )}
              {/* HTML/MD Input Section */}
              <div style={{ flex: `${inputPanelDividerRatio}% 1 0`, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: '1px solid var(--color-border, #ddd)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', padding: '10px 12px 6px 12px', color: 'var(--color-text-secondary, #666)', flexShrink: 0 }}>
                  HTML / Markdown
                </div>
                <textarea
                  className="input-panel-textarea"
                  value={inputPanelContent}
                  onChange={(e) => {
                    setInputPanelContent(e.target.value)
                    onSourceChange?.({ source: isHtml ? 'html' : 'markdown', newContent: e.target.value })
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '0',
                    fontFamily: '"Monaco", "Courier New", monospace',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    backgroundColor: 'var(--color-background-primary, #fff)',
                    color: 'var(--color-text-primary, #000)',
                    resize: 'none',
                    overflow: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--scrollbar-thumb, #ccc) transparent',
                  }}
                />
              </div>

              {/* Draggable Divider */}
              <div
                ref={inputPanelDividerRef}
                onMouseDown={handleInputPanelDividerMouseDown}
                style={{
                  height: '6px',
                  backgroundColor: 'var(--color-border, #ddd)',
                  cursor: 'row-resize',
                  flexShrink: 0,
                  transition: isDraggingInputDividerRef.current ? 'none' : 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.3)'
                }}
                onMouseLeave={(e) => {
                  if (!isDraggingInputDividerRef.current) {
                    e.currentTarget.style.backgroundColor = 'var(--color-border, #ddd)'
                  }
                }}
              >
                <div style={{ width: '24px', height: '3px', backgroundColor: 'rgba(33, 150, 243, 0.5)', borderRadius: '1px' }} />
              </div>

              {/* CSS Input Section */}
              <div style={{ flex: `${100 - inputPanelDividerRatio}% 1 0`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', padding: '10px 12px 6px 12px', color: 'var(--color-text-secondary, #666)', flexShrink: 0 }}>
                  CSS
                </div>
                <textarea
                  className="input-panel-textarea"
                  value={inputPanelCss}
                  onChange={(e) => {
                    setInputPanelCss(e.target.value)
                    onCssChange?.(e.target.value)
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '0',
                    fontFamily: '"Monaco", "Courier New", monospace',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    backgroundColor: 'var(--color-background-primary, #fff)',
                    color: 'var(--color-text-primary, #000)',
                    resize: 'none',
                    overflow: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--scrollbar-thumb, #ccc) transparent',
                  }}
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
