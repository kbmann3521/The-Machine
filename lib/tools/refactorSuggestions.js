/**
 * Refactor Suggestions Engine — Phase 7C
 *
 * Analyzes CSS rules to identify safe optimization opportunities.
 * All suggestions are read-only and informational.
 *
 * Types of suggestions:
 * 1. Mergeable Rules - Same selector can be combined
 * 2. Unused Properties - Declarations that are always overridden
 * 3. Dead Properties - Properties in a rule that never take effect
 */

/**
 * Find rules with the same selector that could be merged
 *
 * Returns array of groups where each group has rules that share the same selector
 */
function findMergeableRules(rulesTree = []) {
  const selectorMap = {}

  // Group rules by selector
  rulesTree.forEach((rule, idx) => {
    if (!rule.selector) return

    const key = rule.selector
    if (!selectorMap[key]) {
      selectorMap[key] = []
    }
    selectorMap[key].push({ ruleIndex: idx, ...rule })
  })

  // Find groups with multiple rules (mergeable candidates)
  const mergeableGroups = []
  Object.entries(selectorMap).forEach(([selector, rules]) => {
    if (rules.length > 1) {
      // Extract line numbers from rules
      const occurrences = rules
        .filter(r => r.loc && r.loc.startLine)
        .map(r => r.loc.startLine)
        .sort((a, b) => a - b)

      mergeableGroups.push({
        selector,
        rules,
        count: rules.length,
        occurrences,
        description: `This selector is defined ${rules.length} times and could be merged`,
      })
    }
  })

  return mergeableGroups
}

/**
 * Identify properties that are always overridden in a rule
 *
 * Uses impact data to find declarations that never contribute to the final computed style
 */
function findUnusedPropertiesInRule(ruleImpact, rule) {
  if (!ruleImpact || !rule) return []

  const { affectedNodes = [] } = ruleImpact
  if (affectedNodes.length === 0) return []

  // For each declared property, check if it's ever effective
  const unusedProps = []
  const declarations = rule.declarations || []

  declarations.forEach(decl => {
    // Check if this property is effective in ANY affected node
    let isEffectiveAnywhere = false

    affectedNodes.forEach(node => {
      const propInfo = (node.properties || []).find(p => p.property === decl.property)
      if (propInfo && propInfo.effective) {
        isEffectiveAnywhere = true
      }
    })

    // If property is never effective, it's unused
    if (!isEffectiveAnywhere) {
      unusedProps.push({
        property: decl.property,
        value: decl.value,
        reason: 'Always overridden by later rules',
      })
    }
  })

  return unusedProps
}

/**
 * Generate refactor suggestions for a rule
 *
 * Analyzes the rule's impact and identifies optimization opportunities
 */
export function generateRefactorSuggestions(rule, ruleImpact, allRules = []) {
  const suggestions = []

  if (!rule) return suggestions

  // Suggestion 1: Rule might be mergeable with other rules
  const mergeableGroups = findMergeableRules(allRules)
  const mergeGroup = mergeableGroups.find(g => g.selector === rule.selector)
  if (mergeGroup && mergeGroup.rules.length > 1) {
    suggestions.push({
      id: `merge-${rule.selector}`,
      type: 'mergeable',
      severity: 'info',
      title: 'Mergeable Rules',
      description: 'This selector is defined multiple times and could be consolidated',
      actionable: true,
      occurrences: mergeGroup.occurrences,
      details: `Occurrences: ${mergeGroup.occurrences.map(line => `Line ${line}`).join(', ')}`,
      mergeableGroups: mergeableGroups, // Include all groups so button can use them
    })
  }

  // Suggestion 2: Rule has properties always overridden
  if (ruleImpact) {
    const overriddenProps = findUnusedPropertiesInRule(ruleImpact, rule)
    if (overriddenProps.length > 0) {
      suggestions.push({
        id: `always-overridden-${rule.ruleIndex}`,
        type: 'always-overridden',
        severity: 'info',
        title: 'Always Overridden Properties',
        description: `${overriddenProps.length} declaration(s) never win the cascade`,
        actionable: false,
        details: overriddenProps.map(p => `${p.property} (overridden by later rules)`).join('; '),
        properties: overriddenProps,
      })
    }
  }

  // Suggestion 3: Rule has all properties overridden
  if (ruleImpact && ruleImpact.affectedNodes.length > 0) {
    let totalProps = 0
    let overriddenProps = 0

    ruleImpact.affectedNodes.forEach(node => {
      ;(node.properties || []).forEach(prop => {
        totalProps++
        if (!prop.effective) overriddenProps++
      })
    })

    if (totalProps > 0 && overriddenProps === totalProps) {
      suggestions.push({
        id: `fully-overridden-${rule.ruleIndex}`,
        type: 'fully-overridden',
        severity: 'info',
        title: 'Fully Overridden Rule',
        description: 'All declarations are overridden by later rules',
        actionable: false,
        details: 'This rule does not contribute any final computed values and may be a candidate for removal',
      })
    }
  }

  return suggestions
}

/**
 * Generate global refactor suggestions for all rules
 *
 * Identifies cross-rule optimization opportunities
 */
export function generateGlobalRefactorSuggestions(rulesTree = []) {
  const suggestions = []

  // Find all mergeable rule groups
  const mergeableGroups = findMergeableRules(rulesTree)
  if (mergeableGroups.length > 0) {
    suggestions.push({
      id: 'mergeable-summary',
      type: 'global-mergeable',
      severity: 'info',
      title: 'Mergeable Rules Found',
      description: `${mergeableGroups.length} group(s) of rules with duplicate selectors`,
      actionable: false,
      groups: mergeableGroups,
    })
  }

  return suggestions
}

export default {
  generateRefactorSuggestions,
  generateGlobalRefactorSuggestions,
  findMergeableRules,
  findUnusedPropertiesInRule,
}
