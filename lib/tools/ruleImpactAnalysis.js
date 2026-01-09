/**
 * Rule Impact Analysis — Phase 7A
 *
 * Observes which preview elements and properties are actually affected by a rule.
 *
 * Core principle: A rule affects a node iff the node matches the rule's selector
 * (direct matches only — no inheritance, no pseudo-elements in Phase 7A).
 *
 * Algorithm:
 * 1. For each synthetic node in the preview
 * 2. Get getComputedStyle(node) BEFORE
 * 3. Temporarily inject CSS that negates the rule (using !important)
 * 4. Get getComputedStyle(node) AFTER
 * 5. Diff to find affected properties
 * 6. Remove temporary CSS
 * 7. Determine if each property is overridden by a later rule
 * 8. Return RuleImpact data
 *
 * type RuleImpact = {
 *   ruleIndex: number
 *   selector: string
 *   affectedNodes: {
 *     nodeId: string
 *     element: string (e.g., ".button")
 *     properties: {
 *       property: string
 *       effective: boolean
 *       overriddenBy?: number (ruleIndex of overriding rule)
 *     }[]
 *   }[]
 * }
 */

/**
 * Extract base selector from a selector that may contain pseudo-classes or pseudo-elements
 * Examples:
 *   .button → .button
 *   .button:hover → .button
 *   .button::before → .button
 *   button:focus → button
 *   .parent > .child:hover → .parent > .child
 */
function extractBaseSelector(selector) {
  if (!selector) return selector
  // Find the first colon (: or ::) and split there
  const colonIndex = selector.indexOf(':')
  return colonIndex === -1 ? selector : selector.substring(0, colonIndex)
}

/**
 * Create a temporary CSS override to negate a rule's effect
 *
 * For each declaration in the rule, inject !important override
 * that reverts the property to its browser/cascade default.
 *
 * Special handling for pseudo-elements:
 * - For pseudo-elements like ::before, ::after, we need to use the full selector
 *   since pseudo-elements have their own computed styles
 * - For pseudo-classes like :hover, we use the base selector since the state doesn't exist in static DOM
 *
 * Example:
 *   Rule: .button { background-color: red; padding: 10px; }
 *   Override: .button { background-color: initial !important; padding: initial !important; }
 *
 *   Rule: .header::before { content: "x"; color: blue; }
 *   Override: .header::before { content: initial !important; color: initial !important; }
 *
 * This allows us to measure the delta by comparing styles before/after.
 */
function createRuleNegationCSS(selector, declarations = []) {
  if (!declarations || declarations.length === 0) {
    return null
  }

  const negations = declarations
    .map(decl => {
      // For pseudo-elements with 'content' property, use 'initial' to reset
      // For other properties, try 'inherit' or 'initial' depending on context
      if (decl.property === 'content' && selector.includes('::')) {
        return `${decl.property}: none !important`
      }
      return `${decl.property}: initial !important`
    })
    .join('; ')

  return `${selector} { ${negations}; }`
}

/**
 * Convert CSS property name to camelCase for getComputedStyle access
 * Examples:
 *   font-family → fontFamily
 *   margin-top → marginTop
 *   display → display
 *   animation → animation
 */
function propertyToCamelCase(prop) {
  if (!prop) return prop
  return prop.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

/**
 * Temporarily disable a rule in the iframe and measure style delta
 *
 * Returns map of property → { before, after } for comparison
 */
function measureRuleImpact(selector, declarations, iframeDoc) {
  if (!iframeDoc || !declarations || declarations.length === 0) {
    return null
  }

  try {
    // Extract base selector from pseudo-classes/pseudo-elements for DOM querying
    // .button:hover → .button
    // .header::before → .header
    const baseSelector = extractBaseSelector(selector)

    // Query using base selector (pseudo-classes/pseudo-elements don't exist in static DOM)
    const elements = iframeDoc.querySelectorAll(baseSelector.trim())

    if (!elements || elements.length === 0) {
      return null
    }

    // For simplicity, measure impact on the first matching element
    // (more comprehensive: could measure all and aggregate)
    const testElement = elements[0]

    // Get computed styles BEFORE
    const styleBefore = {}
    declarations.forEach(decl => {
      // For pseudo-elements, we can't directly measure computed styles
      // since pseudo-elements are not real DOM nodes. For now, assume effective.
      if (selector.includes('::')) {
        // For pseudo-elements, rely on CSS validity rather than computed style measurement
        styleBefore[decl.property] = decl.value || 'initial'
      } else {
        // Convert property name to camelCase for correct getComputedStyle access
        // font-family → fontFamily, margin-top → marginTop, etc.
        const camelCaseProp = propertyToCamelCase(decl.property)
        styleBefore[decl.property] = iframeDoc.defaultView.getComputedStyle(testElement)[camelCaseProp]
      }
    })

    // Inject temporary negation CSS
    const negationCSS = createRuleNegationCSS(selector, declarations)
    if (!negationCSS) return null

    const styleElement = iframeDoc.createElement('style')
    styleElement.innerHTML = negationCSS
    styleElement.setAttribute('data-rule-impact-test', 'true')
    iframeDoc.head.appendChild(styleElement)

    // Allow browser to recalculate styles
    // (force reflow by accessing computed style)
    const _ = testElement.offsetHeight

    // Get computed styles AFTER negation
    const styleAfter = {}
    declarations.forEach(decl => {
      if (selector.includes('::')) {
        // For pseudo-elements, check if negation CSS was valid
        // If the selector is valid, assume the rule had an effect
        styleAfter[decl.property] = 'initial'
      } else {
        // Convert property name to camelCase for correct getComputedStyle access
        const camelCaseProp = propertyToCamelCase(decl.property)
        styleAfter[decl.property] = iframeDoc.defaultView.getComputedStyle(testElement)[camelCaseProp]
      }
    })

    // Remove temporary CSS
    styleElement.remove()

    // Determine which properties actually changed
    const impact = {}

    declarations.forEach(decl => {
      const before = styleBefore[decl.property]
      const after = styleAfter[decl.property]

      // Special case: for pseudo-elements, assume effective unless property is invalid
      if (selector.includes('::')) {
        // For pseudo-elements like ::before and ::after, assume rule is effective
        // unless the property is clearly invalid (like width on ::before)
        const isPseudoElementOnlyProp = ['content'].includes(decl.property)
        impact[decl.property] = {
          before,
          after,
          isEffective: true, // Pseudo-element rules are assumed effective
        }
      } else {
        // For regular selectors and pseudo-classes, rely on computed style delta
        // A property is effective if the computed style changed after negating the rule
        const isEffective = before !== undefined && after !== undefined && before !== after

        impact[decl.property] = {
          before,
          after,
          isEffective,
        }
      }
    })

    return impact
  } catch (e) {
    console.warn('Error measuring rule impact:', e)
    return null
  }
}

/**
 * Flatten rules tree into a linear array with (ruleIndex, rule) pairs
 * This allows us to properly search for later rules by actual ruleIndex
 */
function flattenRulesTree(rulesTree = []) {
  const flattened = []

  const traverse = (rules) => {
    rules.forEach(rule => {
      if (rule) {
        flattened.push(rule)
      }
      // Add nested rules (from @media, @supports, etc.)
      if (rule.children && Array.isArray(rule.children)) {
        traverse(rule.children)
      }
    })
  }

  traverse(rulesTree)
  return flattened
}

/**
 * Extract the "base" part of a selector (without pseudo-classes/pseudo-elements)
 * Examples:
 *   .button:hover → .button
 *   .button:active → .button
 *   .button::before → .button
 *   .button → .button
 */
function getBaseSelectorPart(selector) {
  if (!selector) return selector
  // Find first : (which marks start of pseudo-class or pseudo-element)
  const colonIndex = selector.indexOf(':')
  return colonIndex === -1 ? selector : selector.substring(0, colonIndex)
}

/**
 * Check if a selector has a pseudo-state (:hover, :focus, :active, :visited, etc.)
 * but NOT pseudo-elements (::before, ::after, ::selection, etc.)
 */
function hasPseudoState(selector) {
  if (!selector) return false
  // Pseudo-states are :something (single colon)
  // Pseudo-elements are ::something (double colon)
  // This regex checks for :word but not ::word
  return /:[^:]/.test(selector)
}

/**
 * Check if a property is overridden by any later rule
 *
 * Walks the flattened rules tree from ruleIndex+1 onwards to see if any later rule
 * also declares the same property for the same or higher specificity.
 *
 * IMPORTANT:
 * - Pseudo-states (:hover, :active, :focus) DO NOT override each other — they are
 *   different conditional states and should coexist.
 * - Base rules are only overridden by exact base rule matches.
 * - Pseudo-element rules (::before, ::after) are only overridden by exact matches.
 *
 * Phase 8B:
 * - Also checks addedProperties for overriding rules (properties staged via "+ Add Property")
 * - Format of addedProperties: { "ruleIndex::propertyName": value }
 */
function findOverridingRule(selector, property, ruleIndex, rulesTree = [], currentSpecificity = 0, addedProperties = {}) {
  if (!rulesTree || rulesTree.length === 0) return null

  // Flatten the tree so we can search by actual ruleIndex
  const flatRules = flattenRulesTree(rulesTree)

  // Find the rule with the given ruleIndex to get its specificity
  let currentRule = null
  for (const rule of flatRules) {
    if (rule.ruleIndex === ruleIndex) {
      currentRule = rule
      break
    }
  }

  if (!currentRule) return null
  const currentRuleSpecificity = currentRule.specificity || 0

  // Determine if current selector has a pseudo-state
  const currentHasPseudoState = hasPseudoState(selector)

  // Search through later rules (by ruleIndex, not array position)
  for (const laterRule of flatRules) {
    // Skip rules that come before or at the current rule
    if ((laterRule.ruleIndex || 0) <= ruleIndex) {
      continue
    }

    // Skip rules that are not actual stylesheet rules
    // This includes keyframe frames (0%, 50%, 100%, etc.) which don't participate in the cascade
    if (laterRule.type !== 'rule' || !laterRule.selector) {
      continue
    }

    // Skip keyframe frames (selectors like "0%", "50%", "100%")
    // These are animation keyframes, not CSS selectors
    if (/^(\d+%|from|to)$/i.test(laterRule.selector)) {
      continue
    }

    // For rules with pseudo-states (:hover, :active, etc.):
    // Only override if the LATER rule has the EXACT SAME selector
    // Different pseudo-states are independent and don't override each other
    if (currentHasPseudoState) {
      // Only exact selector match counts for pseudo-state rules
      if (laterRule.selector === selector) {
        // Check both original declarations and added properties
        const hasPropertyInDeclarations = (laterRule.declarations || []).some(d => d.property === property)
        const hasPropertyInAdded = Object.keys(addedProperties).some(key => {
          const [laterRuleIndex, propName] = key.split('::')
          return parseInt(laterRuleIndex) === laterRule.ruleIndex && propName === property
        })
        const hasProperty = hasPropertyInDeclarations || hasPropertyInAdded

        if (hasProperty && (laterRule.specificity || 0) >= currentRuleSpecificity) {
          return {
            ruleIndex: laterRule.ruleIndex,
            selector: laterRule.selector,
            type: 'pseudo-state',
          }
        }
      }
      // Different pseudo-states don't count as overrides
      continue
    }

    // For base rules (no pseudo-states):
    // Only exact base selector matches count as overrides
    if (laterRule.selector === selector) {
      // Check both original declarations and added properties
      const hasPropertyInDeclarations = (laterRule.declarations || []).some(d => d.property === property)
      const hasPropertyInAdded = Object.keys(addedProperties).some(key => {
        const [laterRuleIndex, propName] = key.split('::')
        return parseInt(laterRuleIndex) === laterRule.ruleIndex && propName === property
      })
      const hasProperty = hasPropertyInDeclarations || hasPropertyInAdded

      if (hasProperty) {
        // Check specificity: later rule must have equal or higher specificity
        const laterSpecificity = laterRule.specificity || 0
        if (laterSpecificity >= currentRuleSpecificity) {
          return {
            ruleIndex: laterRule.ruleIndex,
            selector: laterRule.selector,
            type: 'base',
          }
        }
      }
    }
  }

  return null
}

/**
 * Compute impact of a single rule
 *
 * Returns RuleImpact: which nodes match, which properties are effective, which are overridden
 *
 * Special handling for pseudo-states (:hover, :active, :focus, etc.):
 * - Pseudo-states can't be measured in static DOM (the state never occurs)
 * - Instead, we assume all valid properties in pseudo-state rules are "effective"
 *   since they apply in their specific context
 * - Only exact duplicate pseudo-state rules can override them
 *
 * Phase 8B:
 * - addedProperties: Map of "ruleIndex::propertyName" -> value for newly added properties
 *   This is used to check if later rules have added properties that override this rule
 */
export function computeRuleImpact(ruleIndex, selector, declarations, iframeDoc, rulesTree = [], addedProperties = {}) {
  if (!iframeDoc || !selector || !declarations || declarations.length === 0) {
    return null
  }

  try {
    // Extract base selector from pseudo-classes/pseudo-elements
    // .button:hover → .button
    // .button::before → .button
    // .parent > .child:hover → .parent > .child
    const baseSelector = extractBaseSelector(selector)
    const hasPseudoStateRule = hasPseudoState(selector)

    // Get all elements that match the BASE selector in the preview
    // (pseudo-classes don't exist in the DOM, but the base element does)
    let elements = null
    try {
      elements = baseSelector.trim() ? iframeDoc.querySelectorAll(baseSelector) : null
    } catch (selectorError) {
      // If selector fails to parse, try fallback approaches
      // Extract just the last class name as fallback
      const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/)
      if (classMatch && classMatch[1]) {
        try {
          elements = iframeDoc.querySelectorAll('.' + classMatch[1])
        } catch (e2) {
          // Fallback failed, mark as no matches
          return {
            ruleIndex,
            selector,
            affectedNodes: [],
          }
        }
      } else {
        // No class found and selector invalid, mark as no matches
        return {
          ruleIndex,
          selector,
          affectedNodes: [],
        }
      }
    }

    if (!elements || elements.length === 0) {
      return {
        ruleIndex,
        selector,
        affectedNodes: [],
      }
    }

    // For pseudo-state rules, don't measure impact (pseudo-states don't apply in static DOM)
    // Instead, assume all properties are effective in their context
    if (hasPseudoStateRule) {
      const affectedNodes = []
      elements.forEach(el => {
        const nodeId = el.getAttribute('data-synthetic-id') || `node-${el.className}`
        const properties = []

        declarations.forEach(decl => {
          const effectiveProperty = {
            property: decl.property,
            effective: true, // Pseudo-state properties are always effective in their context
            value: decl.value,
          }

          // Only check for exact duplicate pseudo-state rules that override
          const overridingRule = findOverridingRule(selector, decl.property, ruleIndex, rulesTree, 0, addedProperties)
          if (overridingRule) {
            effectiveProperty.overriddenBy = overridingRule.ruleIndex
            effectiveProperty.effective = false
          }

          properties.push(effectiveProperty)
        })

        if (properties.length > 0) {
          affectedNodes.push({
            nodeId,
            element: selector,
            properties,
          })
        }
      })

      return {
        ruleIndex,
        selector,
        affectedNodes,
      }
    }

    // For non-pseudo-state rules, measure actual impact in the DOM
    // Measure the impact of this rule
    const impactMap = measureRuleImpact(selector, declarations, iframeDoc)

    if (!impactMap) {
      return {
        ruleIndex,
        selector,
        affectedNodes: [],
      }
    }

    // For each matching element, record which properties are affected
    const affectedNodes = []

    elements.forEach(el => {
      const nodeId = el.getAttribute('data-synthetic-id') || `node-${el.className}`
      const properties = []

      declarations.forEach(decl => {
        const impact = impactMap[decl.property]

        // Check if this property is overridden by a later rule in the cascade
        // This is the authoritative check for whether a property "wins" the cascade
        const overridingRule = findOverridingRule(selector, decl.property, ruleIndex, rulesTree, 0, addedProperties)
        const isOverriddenByCascade = !!overridingRule

        // A property is effective if it's not overridden by a later rule
        // (cascade detection is more reliable than DOM measurement for some properties)
        const isEffective = !isOverriddenByCascade
        const value = impact ? impact.before : decl.value

        properties.push({
          property: decl.property,
          effective: isEffective,
          value: value,
          overriddenBy: overridingRule ? overridingRule.ruleIndex : undefined,
        })
      })

      if (properties.length > 0) {
        affectedNodes.push({
          nodeId,
          element: selector,
          properties,
        })
      }
    })

    return {
      ruleIndex,
      selector,
      affectedNodes,
    }
  } catch (e) {
    console.warn('Error computing rule impact:', e)
    return {
      ruleIndex,
      selector,
      affectedNodes: [],
    }
  }
}

/**
 * Determine if a rule is redundant within the stylesheet
 *
 * A rule is redundant if:
 * All its declarations are overridden by later rules (100% ineffective)
 *
 * This is CSS-only analysis. No HTML context required.
 *
 * Returns object: { isRedundant: boolean, reason: string }
 */
export function isRuleRedundant(ruleImpact) {
  if (!ruleImpact) {
    return { isRedundant: false, reason: null }
  }

  const { affectedNodes = [] } = ruleImpact

  // Empty impact means no direct matches in preview
  // This is informational but not redundant within CSS itself
  if (affectedNodes.length === 0) {
    return { isRedundant: false, reason: null }
  }

  // Check if all properties are overridden
  // This makes the rule redundant within the stylesheet
  let totalProperties = 0
  let overriddenProperties = 0

  affectedNodes.forEach(node => {
    const nodeProps = node.properties || []
    nodeProps.forEach(prop => {
      totalProperties++
      if (!prop.effective) {
        overriddenProperties++
      }
    })
  })

  if (totalProperties > 0 && overriddenProperties === totalProperties) {
    return { isRedundant: true, reason: 'All properties overridden by later rules' }
  }

  // Rule is not redundant
  return { isRedundant: false, reason: null }
}

export default {
  computeRuleImpact,
  isRuleRedundant,
}
