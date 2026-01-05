/**
 * Synthetic DOM Generator for CSS Preview (Phase 5)
 *
 * Takes a rules tree and generates synthetic HTML elements
 * based on documented selector heuristics.
 *
 * Constraints:
 * - Max 25 elements (prevents DOM bloat)
 * - No JavaScript, no event listeners
 * - No real DOM manipulation
 * - Deterministic, repeatable output
 *
 * Phase 5 Mapping Layer (A) — Corrected State Model
 *
 * Core type: SyntheticNode
 *   id: string                 // stable, deterministic
 *   baseSelector: string       // ".button" (NO pseudo-classes)
 *   tag: string                // 'div' | 'button' | 'header'
 *   className: string          // "button"
 *   states: {
 *     base: {
 *       ruleIndex: number,     // index in rulesTree
 *       declarations: string[]
 *     },
 *     hover?: { ruleIndex, declarations },
 *     focus?: { ruleIndex, declarations },
 *     active?: { ruleIndex, declarations },
 *     ...
 *   }
 *   loc: { startLine: number, endLine: number }
 *
 * KEY RULE: One selector base = one node. Pseudo-classes become state layers.
 *
 * Generator returns:
 *   { nodes: SyntheticNode[], html: string }
 */

/**
 * Documented Selector → Element Mapping
 *
 * These are explicit heuristics, not guesses.
 * They ensure consistency and allow customization later.
 */
const SELECTOR_TO_ELEMENT_MAP = {
  // Layout containers
  'body': 'div',
  '.body': 'div',
  '.container': 'div',
  '.wrapper': 'div',
  '.main': 'main',
  '.content': 'div',
  '.section': 'section',

  // Navigation
  '.navbar': 'nav',
  '.nav': 'nav',
  '.header': 'header',
  '.footer': 'footer',

  // Semantic HTML
  '.card': 'div',
  '.list': 'ul',
  '.list-item': 'li',
  '.paragraph': 'p',
  '.button': 'button',
  '.btn': 'button',
  '.link': 'a',
  '.heading': 'div',
  '.title': 'h1',
  '.subtitle': 'h2',

  // Interactive
  '.input': 'input',
  '.form': 'form',
  '.select': 'select',
  '.textarea': 'textarea',

  // Typography
  '.text': 'span',
  '.label': 'label',
  '.code': 'code',
}

/**
 * Infer HTML tag from selector
 *
 * Strategies (in order):
 * 1. Check documented map
 * 2. Extract tag hint from class name (e.g., .btn-primary → button)
 * 3. Default to div
 */
function inferTag(selector) {
  // Check documented map
  if (SELECTOR_TO_ELEMENT_MAP[selector]) {
    return SELECTOR_TO_ELEMENT_MAP[selector]
  }

  // Extract class names from selector
  const classNames = (selector.match(/\.[\w-]+/g) || []).map(c => c.slice(1))

  // Check if any class hints at a tag
  for (const className of classNames) {
    if (SELECTOR_TO_ELEMENT_MAP[`.${className}`]) {
      return SELECTOR_TO_ELEMENT_MAP[`.${className}`]
    }

    // Check for keywords
    if (className.includes('btn') || className.includes('button')) return 'button'
    if (className.includes('link')) return 'a'
    if (className.includes('header')) return 'header'
    if (className.includes('footer')) return 'footer'
    if (className.includes('nav')) return 'nav'
    if (className.includes('form')) return 'form'
    if (className.includes('input')) return 'input'
    if (className.includes('card')) return 'div'
  }

  // Default to div
  return 'div'
}

/**
 * Extract base selector from a CSS selector
 *
 * ".button:hover" → ".button"
 * ".button:focus" → ".button"
 * "div" → "div"
 */
function getBaseSelector(selector) {
  return selector.split(':')[0]
}

/**
 * Extract pseudo-class from selector
 *
 * ".button:hover" → "hover"
 * ".button" → null
 */
function getPseudoClass(selector) {
  const match = selector.match(/:([a-z-]+)/)
  return match ? match[1] : null
}

/**
 * Generate synthetic nodes and HTML from rules tree
 *
 * Phase 5 Mapping Layer (A) — State Model Corrected
 *
 * Key invariant:
 * One baseSelector = One SyntheticNode
 * Pseudo-classes become state layers, never separate nodes
 *
 * Args:
 *   rulesTree: Array of CssRuleNode (from Phase 3)
 *   maxElements: Limit to prevent DOM bloat (default: 25)
 *
 * Returns:
 *   {
 *     nodes: SyntheticNode[],
 *     html: string,
 *     elementCount: number
 *   }
 */
function generateSyntheticDom(rulesTree, maxElements = 25) {
  const nodes = []
  const nodeMap = new Map() // baseSelector → node (for state attachment)
  let count = 0
  let ruleIndex = 0

  /**
   * Extract property names from declarations
   */
  const getDeclarationNames = (rule) => {
    if (!rule.declarations || !Array.isArray(rule.declarations)) {
      return []
    }
    return rule.declarations.map(decl => decl.property || '')
  }

  /**
   * Generate unique, deterministic node ID from base selector
   */
  const generateNodeId = (baseSelector) => {
    return `node-${baseSelector.replace(/[^a-z0-9]/gi, '-')}`
  }

  /**
   * Create or update a SyntheticNode with state information
   */
  const createOrUpdateNode = (rule, currentRuleIndex) => {
    if (count >= maxElements) return null

    if (rule.type !== 'rule' || !rule.selector) return null

    const baseSelector = getBaseSelector(rule.selector)
    const pseudoClass = getPseudoClass(rule.selector)
    const tag = inferTag(baseSelector)
    const className = baseSelector
      .replace(/[#.]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Check if we already have a node for this baseSelector
    let node = nodeMap.get(baseSelector)

    if (!node) {
      // First time seeing this base selector — create a new node
      node = {
        id: generateNodeId(baseSelector),
        baseSelector,
        tag,
        className,
        states: {},
        loc: rule.source ? {
          startLine: rule.source.start?.line || 0,
          endLine: rule.source.end?.line || 0,
        } : { startLine: 0, endLine: 0 },
      }
      nodes.push(node)
      nodeMap.set(baseSelector, node)
      count++
    }

    // Attach declarations to the appropriate state layer
    const stateName = pseudoClass || 'base'
    node.states[stateName] = {
      ruleIndex: currentRuleIndex,
      declarations: getDeclarationNames(rule),
      loc: rule.source ? {
        startLine: rule.source.start?.line || 0,
        endLine: rule.source.end?.line || 0,
      } : { startLine: 0, endLine: 0 },
    }

    return node
  }

  /**
   * Build HTML string from nodes
   */
  const buildHtml = () => {
    let html = '<div class="preview-root" style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">\n'

    for (const node of nodes) {
      const { tag, className, baseSelector } = node
      const elementId = `element-${node.id}`

      html += `  <${tag} class="${className}" id="${elementId}" data-synthetic-node="${node.id}" data-base-selector="${baseSelector}">`

      // Add placeholder text for readability
      if (['div', 'section', 'article', 'header', 'footer', 'main'].includes(tag)) {
        html += `<span style="color: #999; font-size: 12px;">${baseSelector}</span>`
      } else if (tag === 'button') {
        html += baseSelector || 'Button'
      } else if (tag === 'a') {
        html += 'Link'
      } else if (tag === 'input') {
        html += ''
      }

      html += `</${tag}>\n`
    }

    html += '</div>'
    return html
  }

  // Process all rules in order, collapsing pseudo-selectors into state layers
  if (rulesTree && Array.isArray(rulesTree)) {
    for (const rule of rulesTree) {
      if (count >= maxElements) break
      createOrUpdateNode(rule, ruleIndex)
      ruleIndex++
    }
  }

  return {
    nodes,
    html: buildHtml(),
    elementCount: count,
  }
}

/**
 * Apply pseudo-state class to element
 *
 * Converts :pseudo-class to .pseudo-class for preview simulation
 */
function applyPseudoState(element, pseudoState) {
  if (!element) return

  const stateClass = `pseudo-${pseudoState.replace(/^:/, '')}`
  element.classList.add(stateClass)
}

/**
 * Remove pseudo-state class from element
 */
function removePseudoState(element, pseudoState) {
  if (!element) return

  const stateClass = `pseudo-${pseudoState.replace(/^:/, '')}`
  element.classList.remove(stateClass)
}

/**
 * Toggle pseudo-state on all interactive elements
 *
 * Args:
 *   rootElement: The preview root element
 *   pseudoState: 'hover', 'focus', 'active'
 *   isOn: boolean
 */
function togglePseudoStateOnAll(rootElement, pseudoState, isOn) {
  const buttons = rootElement.querySelectorAll('button, a, input, [role="button"]')
  buttons.forEach(btn => {
    if (isOn) {
      applyPseudoState(btn, pseudoState)
    } else {
      removePseudoState(btn, pseudoState)
    }
  })
}

/**
 * Build a complete DOM tree from SyntheticNodes
 *
 * Used for backwards compatibility with iframe rendering.
 * Converts node array to actual HTMLElement tree.
 *
 * Args:
 *   nodes: SyntheticNode[]
 *
 * Returns:
 *   HTMLElement (the preview-root div)
 */
function buildDomFromNodes(nodes) {
  const root = document.createElement('div')
  root.className = 'preview-root'
  root.style.cssText = 'padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  for (const node of nodes) {
    const { tag, className, selector, id } = node
    const element = document.createElement(tag)

    element.className = className
    element.id = `element-${id}`
    element.setAttribute('data-synthetic-node', id)
    element.setAttribute('data-selector', selector)
    element.setAttribute('data-rule-index', String(node.ruleIndex))

    // Add placeholder text for readability
    if (['div', 'section', 'article', 'header', 'footer', 'main'].includes(tag)) {
      element.innerHTML = `<span style="color: #999; font-size: 12px;">${selector}</span>`
    } else if (tag === 'button') {
      element.textContent = selector || 'Button'
    } else if (tag === 'a') {
      element.href = '#'
      element.textContent = 'Link'
    } else if (tag === 'input') {
      element.placeholder = selector || 'Input'
    }

    root.appendChild(element)
  }

  return root
}

/**
 * Get the mapping context for a generated synthetic DOM
 *
 * Returns metadata that links preview elements to source rules
 * (Used by Phase 6 for interactive editing)
 */
function getSyntheticNodeMapping(nodes) {
  const mapping = new Map()
  const bySelector = new Map()

  for (const node of nodes) {
    mapping.set(node.id, node)
    bySelector.set(node.selector, node)
  }

  return {
    byId: mapping,
    bySelector,
    all: nodes,
  }
}

/**
 * Get all affecting rules for a given selector
 *
 * Phase 6(A): Element Inspector
 *
 * Finds all rules in the rulesTree that match a selector,
 * ordered by cascade (specificity + order).
 *
 * Args:
 *   selector: string (e.g., ".button")
 *   rulesTree: CssRuleNode[]
 *
 * Returns:
 *   Array of rule objects with:
 *     - selector: string
 *     - specificity: number
 *     - declarations: { property, value, loc }[]
 *     - type: 'base' | 'pseudo' | 'media'
 *     - pseudoState: string (if type === 'pseudo')
 *     - mediaQuery: string (if type === 'media')
 *     - ruleIndex: number
 *     - loc: { startLine, endLine }
 */
function getAffectingRulesForSelector(selector, rulesTree = []) {
  if (!selector || !rulesTree.length) return []

  const affectingRules = []

  // Walk through all rules in order
  rulesTree.forEach((rule, ruleIndex) => {
    // Skip rules with invalid selectors
    if (!rule || !rule.selector || typeof rule.selector !== 'string') {
      return
    }

    // Exact selector match
    if (rule.selector === selector) {
      affectingRules.push({
        selector: rule.selector,
        specificity: rule.specificity || 0,
        declarations: rule.declarations || [],
        type: 'base',
        ruleIndex,
        loc: rule.loc,
        order: ruleIndex, // preserve document order
      })
    }

    // Pseudo-class variations of this selector
    // e.g., .button:hover, .button:focus, .button::before, .button::after
    if (rule.selector.startsWith(selector + ':') || rule.selector.startsWith(selector + ':')) {
      const pseudoMatch = rule.selector.match(/:+([a-z-]+)/i)
      const pseudoState = pseudoMatch ? pseudoMatch[1] : null

      if (pseudoState) {
        affectingRules.push({
          selector: rule.selector,
          specificity: rule.specificity || 0,
          declarations: rule.declarations || [],
          type: 'pseudo',
          pseudoState,
          ruleIndex,
          loc: rule.loc,
          order: ruleIndex,
        })
      }
    }

    // Media query rules containing this selector
    if (rule.children && Array.isArray(rule.children)) {
      rule.children.forEach((childRule, childIndex) => {
        if (childRule && childRule.selector && typeof childRule.selector === 'string' && childRule.selector === selector) {
          affectingRules.push({
            selector: childRule.selector,
            specificity: childRule.specificity || 0,
            declarations: childRule.declarations || [],
            type: 'media',
            mediaQuery: rule.name || rule.params || '@media (...)',
            ruleIndex,
            childIndex,
            loc: childRule.loc,
            order: ruleIndex + (childIndex / 1000), // nested rules after parents
          })
        }
      })
    }
  })

  // Sort by: specificity (desc), then order (asc) — CSS cascade order
  affectingRules.sort((a, b) => {
    if (a.specificity !== b.specificity) {
      return b.specificity - a.specificity
    }
    return a.order - b.order
  })

  return affectingRules
}

module.exports = {
  generateSyntheticDom,
  buildDomFromNodes,
  getSyntheticNodeMapping,
  getAffectingRulesForSelector,
  applyPseudoState,
  removePseudoState,
  togglePseudoStateOnAll,
  SELECTOR_TO_ELEMENT_MAP,
  inferTag,
}
