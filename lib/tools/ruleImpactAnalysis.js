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
        styleBefore[decl.property] = iframeDoc.defaultView.getComputedStyle(testElement)[decl.property]
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
        styleAfter[decl.property] = iframeDoc.defaultView.getComputedStyle(testElement)[decl.property]
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
        impact[decl.property] = {
          before,
          after,
          isEffective: before !== after,
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
 * Check if a property is overridden by any later rule
 *
 * Walks the flattened rules tree from ruleIndex+1 onwards to see if any later rule
 * also declares the same property for the same or higher specificity.
 */
function findOverridingRule(selector, property, ruleIndex, rulesTree = [], currentSpecificity = 0) {
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

  // Search through later rules (by ruleIndex, not array position)
  for (const laterRule of flatRules) {
    // Skip rules that come before or at the current rule
    if ((laterRule.ruleIndex || 0) <= ruleIndex) {
      continue
    }

    // Check base rule (exact selector match)
    if (laterRule.selector === selector) {
      const hasProperty = (laterRule.declarations || []).some(d => d.property === property)
      if (hasProperty && (laterRule.specificity || 0) >= currentRuleSpecificity) {
        return {
          ruleIndex: laterRule.ruleIndex,
          selector: laterRule.selector,
          type: 'base',
        }
      }
    }

    // Check pseudo-class variations (same base selector, higher specificity)
    if (laterRule.selector && laterRule.selector.startsWith(selector + ':')) {
      const hasProperty = (laterRule.declarations || []).some(d => d.property === property)
      if (hasProperty && (laterRule.specificity || 0) > currentRuleSpecificity) {
        return {
          ruleIndex: laterRule.ruleIndex,
          selector: laterRule.selector,
          type: 'pseudo',
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
 */
export function computeRuleImpact(ruleIndex, selector, declarations, iframeDoc, rulesTree = []) {
  if (!iframeDoc || !selector || !declarations || declarations.length === 0) {
    return null
  }

  try {
    // Extract base selector from pseudo-classes/pseudo-elements
    // .button:hover → .button
    // .button::before → .button
    // .parent > .child:hover → .parent > .child
    const baseSelector = extractBaseSelector(selector)

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
        if (!impact) return

        const effectiveProperty = {
          property: decl.property,
          effective: impact.isEffective,
          value: impact.before, // The value this rule contributes
        }

        // Check if overridden by a later rule
        if (impact.isEffective) {
          const overridingRule = findOverridingRule(selector, decl.property, ruleIndex, rulesTree)
          if (overridingRule) {
            effectiveProperty.overriddenBy = overridingRule.ruleIndex
            effectiveProperty.effective = false // Marked as ineffective if overridden
          }
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
