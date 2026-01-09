/**
 * Preview CSS Builder for Phase 5
 *
 * Transforms rulesTree + variables into browser-ready CSS
 * suitable for iframe injection.
 *
 * Responsibilities:
 * - Resolve CSS variables (declared + used)
 * - Convert pseudo-classes to pseudo-classes for .pseudo-* simulation
 * - Handle media queries
 * - Apply variable overrides
 */

/**
 * Resolve variable value
 *
 * Resolution order:
 * 1. User override
 * 2. Declared variable value
 * 3. Fallback in var(--x, fallback)
 * 4. Browser default or unresolved
 *
 * Returns: resolved value or original var() expression
 */
function resolveVariable(
  varName,
  declaredVariables = [],
  overrides = {},
  fallback = null
) {
  // Check user overrides first
  if (overrides && overrides[varName]) {
    return overrides[varName]
  }

  // Check declared variables
  const declared = declaredVariables.find(v => v.name === varName)
  if (declared) {
    return declared.value
  }

  // Use fallback if provided
  if (fallback) {
    return fallback
  }

  // Return unresolved (let browser handle it)
  return `var(${varName})`
}

/**
 * Parse and resolve all variables in a CSS value
 *
 * Handles nested var() calls and fallbacks
 * Example: var(--primary, var(--fallback, blue))
 */
function resolveValueVariables(value, declaredVariables = [], overrides = {}) {
  if (!value || typeof value !== 'string') return value
  if (!value.includes('var(')) return value

  // Match var(--name) or var(--name, fallback)
  const varRegex = /var\s*\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]*))?\s*\)/g

  return value.replace(varRegex, (match, varName, fallback) => {
    const resolved = resolveVariable(varName, declaredVariables, overrides, fallback?.trim())
    return resolved
  })
}

/**
 * Convert pseudo-class selectors to class-based selectors
 *
 * This enables forced pseudo-state inspection (for debug/touch devices).
 * Native hover still works naturally without this.
 *
 * .button:hover → .button.pseudo-hover
 * .button:focus → .button.pseudo-focus
 * etc.
 */
function convertPseudoClasses(selector) {
  // Match pseudo-classes and pseudo-elements
  const pseudoRegex = /:([a-zA-Z-]+)/g

  return selector.replace(pseudoRegex, (match, pseudo) => {
    // Exclude pseudo-elements (::before, ::after)
    if (pseudo.startsWith(':')) return match

    return `.pseudo-${pseudo}`
  })
}

/**
 * Build CSS for a SyntheticNode with all its state layers
 *
 * Input node:
 *   {
 *     baseSelector: ".button",
 *     states: {
 *       base: { declarations: [{property, value}, ...] },
 *       hover: { declarations: [...] }
 *     }
 *   }
 *
 * Output CSS:
 *   .button { ... base declarations ... }
 *   .button:hover { ... hover declarations ... }
 *   .button.pseudo-hover { ... hover declarations ... } (for forced state)
 */
function buildCssFromSyntheticNode(node) {
  let css = ''

  for (const [stateName, stateInfo] of Object.entries(node.states || {})) {
    if (!stateInfo.declarations || stateInfo.declarations.length === 0) continue

    const selector = stateName === 'base'
      ? node.baseSelector
      : `${node.baseSelector}.pseudo-${stateName}`

    css += `${selector} {\n`

    // Reconstruct declarations (we only have property names from the node,
    // but will get full declarations from rulesTree)
    stateInfo.declarations.forEach(prop => {
      css += `  ${prop}: /* value from declaration */;\n`
    })

    css += `}\n\n`
  }

  return css
}

/**
 * Build preview CSS string from rulesTree
 *
 * Args:
 *   rulesTree: CssRuleNode[] from Phase 3
 *   declaredVariables: Variable[] from Phase 4
 *   variableOverrides: Object<varName, value> (optional)
 *   disabledProperties: Set<string> (optional, Phase 7D: "ruleIndex-property" format)
 *   propertyOverrides: Object<selector, Object<property, value>> (optional, Phase 6D: temporary staged edits)
 *
 * Returns: CSS string ready for <style> injection
 */
function buildPreviewCss(
  rulesTree = [],
  declaredVariables = [],
  variableOverrides = {},
  disabledProperties = new Set(),
  propertyOverrides = {}
) {
  let css = ''

  // Helper: Check if a property is overridden by a later rule in the cascade
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

  // Helper: Build CSS from rule node
  const ruleToCSS = (rule, depth = 0) => {
    const indent = '  '.repeat(depth)

    if (rule.type === 'rule' && rule.selector) {
      // Build the declaration block (shared between native and forced versions)
      let declarationBlock = ''
      if (rule.declarations && Array.isArray(rule.declarations)) {
        for (const decl of rule.declarations) {
          // Phase 7D: Skip disabled properties entirely
          const disabledKey = `${rule.ruleIndex}-${decl.property}`
          const isDisabled = disabledProperties.has(disabledKey)

          // If property is disabled, skip it entirely
          if (isDisabled) {
            continue
          }

          // Phase 6D: Check for property override (temporary edit)
          // BUT: Don't apply the override if the property is overridden by a later rule in the cascade
          let resolvedValue
          const overriddenValue = propertyOverrides[rule.selector]?.[decl.property]
          const isOverriddenByCascade = isPropertyOverriddenByLaterRule(rule.ruleIndex, rule.selector, decl.property)

          if (overriddenValue !== undefined && !isOverriddenByCascade) {
            // Use the override only if it's not overridden by the cascade
            resolvedValue = overriddenValue
          } else {
            // Use the original value (resolved with variables)
            resolvedValue = resolveValueVariables(
              decl.value,
              declaredVariables,
              variableOverrides
            )
          }

          declarationBlock += `${indent}  ${decl.property}: ${resolvedValue};\n`
        }
      }

      // Output 1: Native selector (for browser's automatic hover/focus/active)
      css += `${indent}${rule.selector} {\n${declarationBlock}${indent}}\n\n`

      // Output 2: Simulated class version (for forced states via Force buttons)
      // Only needed if there are pseudo-classes
      if (rule.selector.includes(':')) {
        const simulatedSelector = convertPseudoClasses(rule.selector)
        css += `${indent}${simulatedSelector} {\n${declarationBlock}${indent}}\n\n`
      }
    } else if (rule.type === 'atrule') {
      // Handle at-rules like @media
      if (rule.atRule?.name === 'media') {
        css += `${indent}@media ${rule.atRule.params} {\n`

        // Recursively process nested rules
        if (rule.children && Array.isArray(rule.children)) {
          for (const child of rule.children) {
            ruleToCSS(child, depth + 1)
          }
        }

        css += `${indent}}\n\n`
      } else {
        // Generic at-rule handling (@supports, @keyframes, etc.)
        css += `${indent}@${rule.atRule?.name}`
        if (rule.atRule?.params) {
          css += ` ${rule.atRule.params}`
        }
        css += ' {\n'

        if (rule.children && Array.isArray(rule.children)) {
          for (const child of rule.children) {
            ruleToCSS(child, depth + 1)
          }
        }

        css += `${indent}}\n\n`
      }
    }
  }

  // Process all rules
  for (const rule of rulesTree) {
    ruleToCSS(rule)
  }

  // Add base styles for preview readability
  css = `
    * {
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(128, 128, 128, 0.5) transparent;
    }

    /* WebKit scrollbar styling (Chrome, Safari, Edge) */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background-color: rgba(128, 128, 128, 0.5);
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: rgba(128, 128, 128, 0.7);
    }

    .preview-root {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      height: 100%;
    }

    /* Pseudo-state styles for preview simulation */
    button.pseudo-hover,
    a.pseudo-hover,
    input.pseudo-hover {
      outline: 2px dashed #0066cc;
    }

    button.pseudo-focus,
    a.pseudo-focus,
    input.pseudo-focus {
      outline: 2px solid #0066cc;
    }

    button.pseudo-active,
    a.pseudo-active,
    input.pseudo-active {
      opacity: 0.8;
    }

    ${css}
  `

  return css
}

/**
 * Build a complete HTML document for preview iframe
 *
 * Returns: HTML string ready for srcdoc
 */
function buildPreviewDocument(
  rulesTree = [],
  declaredVariables = [],
  variableOverrides = {},
  domHTML = '',
  disabledProperties = new Set(),
  propertyOverrides = {}
) {
  const css = buildPreviewCss(rulesTree, declaredVariables, variableOverrides, disabledProperties, propertyOverrides)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSS Preview</title>
      <style>
        /* Base scrollbar styling - hide horizontal unless needed, match dark mode */
        html, body {
          overflow-x: auto;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(153, 153, 153, 0.5) transparent;
        }

        /* Webkit scrollbar styling for light/dark mode compatibility */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(153, 153, 153, 0.5);
          border-radius: 3px;
        }

        /* Phase 7A Stage 4: Preview Highlight for Affected Elements */
        ._preview-highlight {
          outline: 2px solid #66bb6a !important;
          outline-offset: 1px;
          box-shadow: inset 0 0 0 1px rgba(102, 187, 106, 0.3) !important;
          transition: outline 0.15s ease !important;
        }

        ${css}
      </style>
    </head>
    <body style="margin: 0; padding: 0; background: white;">
      ${domHTML}
    </body>
    </html>
  `
}

module.exports = {
  buildPreviewCss,
  buildPreviewDocument,
  resolveVariable,
  resolveValueVariables,
  convertPseudoClasses,
}
