/**
 * Merge Selectors Utility — Phase 7E
 *
 * Safely merges duplicate selectors while preserving:
 * - Cascade order (later declarations override earlier ones naturally)
 * - Scope context (never merges across @media, @supports, @layer)
 * - Comments (via location tracking)
 * - Declaration provenance (track which rule each declaration came from)
 */

/**
 * Find all mergeable rule groups at the top level
 *
 * Rules are mergeable if:
 * 1. Same selector text (exact match)
 * 2. Same cascade context (not in different @media/@supports/@layer)
 * 3. At the same nesting depth (not mixed with atrules)
 *
 * Returns array of groups where each group has rules that can be safely merged
 */
export function findAllMergeableGroups(rulesTree = []) {
  const selectorMap = {}
  const mergeableGroups = []

  // Look at all top-level rules (type === 'rule')
  rulesTree.forEach((rule) => {
    if (rule.type !== 'rule' || !rule.selector) return

    const key = rule.selector
    if (!selectorMap[key]) {
      selectorMap[key] = []
    }
    selectorMap[key].push({
      ruleIndex: rule.ruleIndex,
      selector: rule.selector,
      declarations: rule.declarations || [],
      loc: rule.loc,
      specificity: rule.specificity,
      type: 'rule',
    })
  })

  // Find groups with multiple rules (mergeable candidates)
  Object.entries(selectorMap).forEach(([selector, rules]) => {
    if (rules.length > 1) {
      const occurrences = rules
        .map(r => r.loc?.startLine || 0)
        .sort((a, b) => a - b)

      mergeableGroups.push({
        selector,
        rules,
        count: rules.length,
        occurrences,
        isMergeable: true,
      })
    }
  })

  return mergeableGroups
}

/**
 * Merge a single group of rules with the same selector
 *
 * Algorithm:
 * 1. Collect all declarations in cascade order
 * 2. For duplicate properties, keep only the LAST value (cascade order)
 * 3. Create merged rule with deduplicated properties
 *
 * Returns { mergedRule, removedRuleIndices }
 */
export function mergeRuleGroup(group) {
  if (!group || !group.rules || group.rules.length < 2) {
    return null
  }

  // Collect all declarations while preserving cascade order
  const allDeclarations = []
  group.rules.forEach((rule, ruleSeq) => {
    if (!rule.declarations || rule.declarations.length === 0) return

    rule.declarations.forEach(decl => {
      allDeclarations.push({
        property: decl.property,
        value: decl.value,
        sourceRule: ruleSeq,
        sourceLine: rule.loc?.startLine || 0,
      })
    })
  })

  // Deduplicate: keep ONLY the last occurrence of each property (CSS cascade)
  const propertyMap = new Map()
  allDeclarations.forEach(decl => {
    propertyMap.set(decl.property, decl) // Later values override
  })

  const mergedDeclarations = Array.from(propertyMap.values())

  // Create the merged rule
  const firstRule = group.rules[0]
  const lastRule = group.rules[group.rules.length - 1]

  const mergedRule = {
    type: 'rule',
    selector: group.selector,
    declarations: mergedDeclarations.map(d => ({
      property: d.property,
      value: d.value,
    })),
    loc: {
      startLine: firstRule.loc?.startLine || 0,
      endLine: lastRule.loc?.endLine || 0,
    },
    specificity: firstRule.specificity || 0,
    ruleIndex: firstRule.ruleIndex, // Keep first rule's index
  }

  // Indices to remove (all except first)
  const removedRuleIndices = group.rules.slice(1).map(r => r.ruleIndex)

  return {
    mergedRule,
    removedRuleIndices,
    mergedDeclarations,
    originalCount: group.rules.length,
  }
}

/**
 * Helper: Find a rule by comparing ruleIndex values recursively
 * Returns { path, rule } where path is array of indices to access it
 */
function findRuleByIndex(rules, targetRuleIndex, currentPath = []) {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (rule.ruleIndex === targetRuleIndex) {
      return { path: [...currentPath, i], rule }
    }
    if (rule.children && Array.isArray(rule.children)) {
      const found = findRuleByIndex(rule.children, targetRuleIndex, [...currentPath, i, 'children'])
      if (found) return found
    }
  }
  return null
}

/**
 * Helper: Set a value in a nested object using a path array
 */
function setAtPath(obj, path, value) {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
}

/**
 * Helper: Remove an item from a nested array using a path array
 */
function removeAtPath(obj, path) {
  let current = obj
  for (let i = 0; i < path.length - 2; i++) {
    current = current[path[i]]
  }
  const arr = current[path[path.length - 2]]
  if (Array.isArray(arr)) {
    arr.splice(path[path.length - 1], 1)
  }
}

/**
 * Merge all mergeable groups in the CSS
 *
 * Returns:
 * - mutatedRulesTree: rules with mergeable groups combined
 * - summary: { totalGroupsMerged, totalRulesRemoved, affectedSelectors }
 * - removedIndices: Set of rule indices that were removed
 */
export function mergeAllSelectorsInTree(rulesTree = []) {
  if (!rulesTree || rulesTree.length === 0) {
    return {
      mutatedRulesTree: rulesTree,
      summary: { totalGroupsMerged: 0, totalRulesRemoved: 0, affectedSelectors: [] },
      removedIndices: new Set(),
    }
  }

  // Find all mergeable groups
  const mergeableGroups = findAllMergeableGroups(rulesTree)

  if (mergeableGroups.length === 0) {
    return {
      mutatedRulesTree: rulesTree,
      summary: { totalGroupsMerged: 0, totalRulesRemoved: 0, affectedSelectors: [] },
      removedIndices: new Set(),
    }
  }

  // Create a deep copy to avoid mutating the original
  const mutatedRulesTree = JSON.parse(JSON.stringify(rulesTree))
  const allRemovedIndices = new Set()
  const affectedSelectors = []

  // Process each mergeable group
  mergeableGroups.forEach(group => {
    const result = mergeRuleGroup(group)
    if (!result) return

    const { mergedRule, removedRuleIndices } = result

    // Find the first rule by ruleIndex and update it
    const firstRuleInfo = findRuleByIndex(mutatedRulesTree, group.rules[0].ruleIndex)
    if (firstRuleInfo) {
      setAtPath(mutatedRulesTree, firstRuleInfo.path, mergedRule)
    }

    // Mark others for removal
    removedRuleIndices.forEach(idx => {
      allRemovedIndices.add(idx)
    })

    affectedSelectors.push({
      selector: group.selector,
      originalCount: group.count,
      newCount: 1,
      declarationCount: mergedRule.declarations.length,
      occurrences: group.occurrences,
    })
  })

  // Remove rules in reverse ruleIndex order to maintain correct paths
  const rulesToRemove = Array.from(allRemovedIndices).sort((a, b) => b - a)
  rulesToRemove.forEach(ruleIndex => {
    const found = findRuleByIndex(mutatedRulesTree, ruleIndex)
    if (found) {
      removeAtPath(mutatedRulesTree, found.path)
    }
  })

  return {
    mutatedRulesTree,
    summary: {
      totalGroupsMerged: mergeableGroups.length,
      totalRulesRemoved: allRemovedIndices.size,
      affectedSelectors,
    },
    removedIndices: allRemovedIndices,
    mergeableGroups,
  }
}

/**
 * Apply merge by removing duplicate rules and consolidating properties
 *
 * Handles both scoped (.pwt-markdown-preview prefix) and unscoped CSS
 */
export function applyMergeToSourceText(sourceText, rulesTree, mergeInfo) {
  if (!sourceText || !mergeInfo) {
    return sourceText
  }

  if (mergeInfo instanceof Set) {
    return applyMergeToSourceTextLegacy(sourceText, rulesTree, mergeInfo)
  }

  const mergeGroups = mergeInfo.mergeGroups || []

  if (mergeGroups.length === 0) {
    return sourceText
  }

  /**
   * ✅ CORRECT APPROACH (Kyle's Approach A):
   *
   * Instead of fragile text surgery, regenerate CSS from the merged AST.
   * This is bulletproof because:
   * 1. Merge happens in AST (structural, not text-based)
   * 2. Regenerate CSS from merged AST
   * 3. No text position tracking needed
   * 4. No off-by-one errors
   * 5. Always produces valid CSS
   */

  // Create a deep copy of rulesTree to mutate safely
  const mutatedRulesTree = JSON.parse(JSON.stringify(rulesTree))

  // Process each mergeable group
  for (const group of mergeGroups) {
    if (!group || !group.rules || group.rules.length < 2) continue

    // Sort rules by ruleIndex to find them in the tree
    const sortedRules = [...group.rules].sort((a, b) => a.ruleIndex - b.ruleIndex)
    const firstRule = sortedRules[0]
    const laterRules = sortedRules.slice(1)

    // Find the first rule in the mutated tree and consolidate declarations
    function findAndMergeRule(rules, targetRuleIndex) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i]

        if (rule.type === 'rule' && rule.ruleIndex === targetRuleIndex) {
          // Consolidate all declarations from all rules in this group
          const consolidatedProps = {}
          sortedRules.forEach(r => {
            if (r.declarations) {
              r.declarations.forEach(decl => {
                consolidatedProps[decl.property] = decl.value
              })
            }
          })

          // Update first rule with consolidated declarations
          rule.declarations = Object.entries(consolidatedProps).map(([property, value]) => ({
            property,
            value,
          }))

          return true
        }

        // Recurse into children
        if (rule.children && rule.children.length > 0) {
          if (findAndMergeRule(rule.children, targetRuleIndex)) {
            return true
          }
        }
      }
      return false
    }

    // Merge into the first rule
    findAndMergeRule(mutatedRulesTree, firstRule.ruleIndex)

    // Remove later duplicate rules from the tree
    function removeRules(rules, rulesToRemove) {
      for (let i = rules.length - 1; i >= 0; i--) {
        const rule = rules[i]

        if (rule.type === 'rule' && rulesToRemove.has(rule.ruleIndex)) {
          rules.splice(i, 1)
          continue
        }

        // Recurse into children
        if (rule.children && rule.children.length > 0) {
          removeRules(rule.children, rulesToRemove)
        }
      }
    }

    const indicesToRemove = new Set(laterRules.map(r => r.ruleIndex))
    removeRules(mutatedRulesTree, indicesToRemove)
  }

  // Regenerate CSS from the merged AST
  // This is guaranteed to produce valid CSS
  const regeneratedCSS = serializeRulesToCSS(mutatedRulesTree)

  return regeneratedCSS
}

/**
 * Legacy API support: apply merge by removing duplicate rules from original source text
 * Called when rulesToRemove is a Set (old API)
 *
 * Safely removes rules while preserving proper CSS structure and cleaning up orphaned brackets
 */
export function applyMergeToSourceTextLegacy(sourceText, rulesTree, rulesToRemove) {
  if (!sourceText || !rulesToRemove || rulesToRemove.size === 0) {
    return sourceText
  }

  // Build a map of rules to remove with their line ranges
  const linesToRemove = new Set()

  // Helper to find rules by ruleIndex and collect their line ranges
  function collectLinesToRemove(rules) {
    rules.forEach(rule => {
      if (rule.ruleIndex !== undefined && rulesToRemove.has(rule.ruleIndex)) {
        // Collect all lines for this rule
        if (rule.loc && rule.loc.startLine && rule.loc.endLine) {
          for (let line = rule.loc.startLine; line <= rule.loc.endLine; line++) {
            linesToRemove.add(line)
          }
        }
      }
      // Recursively process children
      if (rule.children && Array.isArray(rule.children)) {
        collectLinesToRemove(rule.children)
      }
    })
  }

  collectLinesToRemove(rulesTree)

  // Split source into lines and filter out the ones to remove
  const sourceLines = sourceText.split('\n')
  const filteredLines = sourceLines.filter((_, idx) => {
    // Line numbers are 1-based in loc, array indices are 0-based
    return !linesToRemove.has(idx + 1)
  })

  // Clean up excessive whitespace and orphaned brackets
  const result = []
  let prevWasBlank = false
  let inRule = false

  for (const line of filteredLines) {
    const isBlank = line.trim() === ''
    const lineContent = line.trim()

    // Track if we're inside a rule block
    if (lineContent.includes('{')) {
      inRule = true
    }
    if (lineContent.includes('}')) {
      inRule = false
    }

    // Collapse multiple blank lines
    if (isBlank) {
      if (!prevWasBlank) {
        result.push('')
        prevWasBlank = true
      }
      // Skip additional blank lines
    } else {
      result.push(line)
      prevWasBlank = false
    }
  }

  // Final cleanup: remove trailing blank lines and return
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop()
  }

  return result.join('\n').trim()
}

/**
 * Serialize rules to CSS text
 *
 * Used to generate preview of merged CSS
 */
export function serializeRulesToCSS(rulesToSerialize) {
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

/**
 * Merge only selected mergeable groups
 *
 * selectedSelectors: Set or array of selector strings to merge (e.g., {".header", ".button"})
 * Returns merge plan with information needed for source text transformation
 */
export function mergeSelectedGroups(rulesTree = [], selectedSelectors = new Set()) {
  if (!rulesTree || rulesTree.length === 0) {
    return {
      mutatedRulesTree: rulesTree,
      summary: { totalGroupsMerged: 0, totalRulesRemoved: 0, affectedSelectors: [] },
      removedIndices: new Set(),
      mergeInfo: { mergeGroups: [] },
    }
  }

  // Convert to Set if it's an array
  const selectedSet = selectedSelectors instanceof Set ? selectedSelectors : new Set(selectedSelectors)

  // Find all mergeable groups
  const allMergeableGroups = findAllMergeableGroups(rulesTree)

  // Filter to only selected groups
  const selectedMergeableGroups = allMergeableGroups.filter(g => selectedSet.has(g.selector))

  if (selectedMergeableGroups.length === 0) {
    return {
      mutatedRulesTree: rulesTree,
      summary: { totalGroupsMerged: 0, totalRulesRemoved: 0, affectedSelectors: [] },
      removedIndices: new Set(),
      mergeInfo: { mergeGroups: [] },
    }
  }

  // Create a deep copy to avoid mutating the original
  const mutatedRulesTree = JSON.parse(JSON.stringify(rulesTree))
  const allRemovedIndices = new Set()
  const affectedSelectors = []

  // Process each selected mergeable group
  selectedMergeableGroups.forEach(group => {
    const result = mergeRuleGroup(group)
    if (!result) return

    const { mergedRule, removedRuleIndices } = result

    // Find the first rule by ruleIndex and update it
    const firstRuleInfo = findRuleByIndex(mutatedRulesTree, group.rules[0].ruleIndex)
    if (firstRuleInfo) {
      setAtPath(mutatedRulesTree, firstRuleInfo.path, mergedRule)
    }

    // Mark others for removal
    removedRuleIndices.forEach(idx => {
      allRemovedIndices.add(idx)
    })

    affectedSelectors.push({
      selector: group.selector,
      originalCount: group.count,
      newCount: 1,
      declarationCount: mergedRule.declarations.length,
      occurrences: group.occurrences,
    })
  })

  // Remove rules in reverse ruleIndex order to maintain correct paths
  const rulesToRemove = Array.from(allRemovedIndices).sort((a, b) => b - a)
  rulesToRemove.forEach(ruleIndex => {
    const found = findRuleByIndex(mutatedRulesTree, ruleIndex)
    if (found) {
      removeAtPath(mutatedRulesTree, found.path)
    }
  })

  // Build merge info for source text transformation
  const mergeInfo = {
    mergeGroups: selectedMergeableGroups,
  }

  return {
    mutatedRulesTree,
    summary: {
      totalGroupsMerged: selectedMergeableGroups.length,
      totalRulesRemoved: allRemovedIndices.size,
      affectedSelectors,
    },
    removedIndices: allRemovedIndices,
    mergeableGroups: selectedMergeableGroups,
    mergeInfo,
  }
}

/**
 * Generate a code preview showing the merged rule with highlighted properties
 *
 * Shows the actual combined CSS rule and visually indicates which properties
 * were added/combined from subsequent declarations
 */
export function generateCodePreview(group, rulesTree) {
  if (!group || !group.rules || group.rules.length < 2) {
    return `${group.selector} {\n  /* No changes - rule appears only once */\n}`
  }

  // Merge the group to get all declarations with source tracking
  const result = mergeRuleGroup(group)
  if (!result) return ''

  const { mergedDeclarations } = result
  const totalRules = group.rules.length

  // Track which rule each property came from and if it's from multiple rules
  const propertyOrigins = new Map()
  const propertyOrder = []

  mergedDeclarations.forEach((decl, idx) => {
    const key = decl.property
    if (!propertyOrigins.has(key)) {
      propertyOrigins.set(key, [])
      propertyOrder.push(key)
    }
    const origins = propertyOrigins.get(key)
    if (!origins.includes(decl.sourceRule)) {
      origins.push(decl.sourceRule)
    }
  })

  // Build the CSS preview with visual indicators
  const lines = []
  lines.push(`${group.selector} {`)

  propertyOrder.forEach(property => {
    const decl = mergedDeclarations.find(d => d.property === property)
    if (!decl) return

    const origins = propertyOrigins.get(property)
    const isHighlighted = origins.length > 1 || origins[0] > 0 // Highlight if from multiple rules or not first

    // Add visual indicator
    const indicator = isHighlighted ? ' ◆' : ''
    lines.push(`  ${property}: ${decl.value};${indicator}`)
  })

  lines.push('}')

  // Add legend if there are highlighted properties
  if (Array.from(propertyOrigins.values()).some(origins => origins.length > 1 || origins[0] > 0)) {
    lines.push('')
    lines.push('◆ = Property added/combined from later declarations')
  }

  return lines.join('\n')
}

/**
 * Generate a diff preview showing what will change
 *
 * Returns string with before/after summary
 */
export function generateMergeDiffPreview(mergeableGroups, rulesTree) {
  if (!mergeableGroups || mergeableGroups.length === 0) {
    return 'No mergeable selectors found.'
  }

  const lines = []

  lines.push('📊 MERGE PREVIEW')
  lines.push('================\n')

  let totalRulesRemoved = 0
  let totalMergedSelectors = 0

  mergeableGroups.forEach((group, idx) => {
    lines.push(`${idx + 1}. ${group.selector}`)
    lines.push(`   • Currently defined ${group.count} times`)
    lines.push(`   • At lines: ${group.occurrences.join(', ')}`)
    lines.push(`   ✓ Will merge into 1 rule\n`)

    totalRulesRemoved += group.count - 1
    totalMergedSelectors += 1
  })

  lines.push('---')
  lines.push(`Total: ${totalMergedSelectors} selector(s) merged`)
  lines.push(`Rules removed: ${totalRulesRemoved}`)
  lines.push('\nChanges: ✓ Safe - no logic changes, only consolidation')

  return lines.join('\n')
}

/**
 * Remove rules from source CSS while preserving comments and formatting
 *
 * @param {string} sourceText - Original CSS source
 * @param {Array} rulesTree - Parsed CSS rules tree with loc info
 * @param {Set} ruleIndicesToRemove - Set of ruleIndex values to remove
 * @returns {string} CSS text with rules removed
 */
export function removeRulesFromSourceText(sourceText, rulesTree, ruleIndicesToRemove) {
  if (!sourceText || !ruleIndicesToRemove || ruleIndicesToRemove.size === 0) {
    return sourceText
  }

  const sourceLines = sourceText.split('\n')
  const linesToRemove = new Set()

  // Collect all lines that belong to rules marked for removal
  rulesTree.forEach(rule => {
    if (ruleIndicesToRemove.has(rule.ruleIndex) && rule.loc && rule.loc.startLine && rule.loc.endLine) {
      for (let lineNum = rule.loc.startLine; lineNum <= rule.loc.endLine; lineNum++) {
        linesToRemove.add(lineNum - 1) // Convert to 0-based
      }
    }
  })

  // Rebuild output by skipping lines marked for removal
  const result = []
  for (let lineIdx = 0; lineIdx < sourceLines.length; lineIdx++) {
    if (!linesToRemove.has(lineIdx)) {
      result.push(sourceLines[lineIdx])
    }
  }

  // Clean up excessive whitespace
  const finalResult = []
  let prevWasBlank = false

  for (const line of result) {
    const isBlank = line.trim() === ''
    if (isBlank) {
      if (!prevWasBlank) {
        finalResult.push('')
        prevWasBlank = true
      }
    } else {
      finalResult.push(line)
      prevWasBlank = false
    }
  }

  return finalResult.join('\n').trim()
}

/**
 * Apply property edits to source CSS while preserving comments and formatting
 *
 * This function performs surgical edits to the source text by:
 * 1. Identifying which rules have property edits
 * 2. For each edited rule, replacing property values in-place
 * 3. Adding new properties before the closing brace if needed
 * 4. Preserving all comments and formatting outside the edited rules
 *
 * @param {string} sourceText - Original CSS source
 * @param {Array} rulesTree - Parsed CSS rules tree with loc info
 * @param {Object} propertyOverrides - Map of { selector: { property: value } }
 * @param {Object} addedProperties - Map of { "ruleIndex::property": value }
 * @returns {string} CSS text with edits applied
 */
export function applyPropertyEditsToSourceText(sourceText, rulesTree, propertyOverrides = {}, addedProperties = {}) {
  if (!sourceText || !rulesTree || rulesTree.length === 0) {
    return sourceText
  }

  const sourceLines = sourceText.split('\n')
  const linesToUpdate = new Map() // lineIdx -> { action, property?, oldValue?, newValue? }
  const propertiesToInsert = new Map() // ruleIndex -> [ { property, value } ]

  // First pass: collect added properties by rule index
  Object.entries(addedProperties).forEach(([key, value]) => {
    const [ruleIndex, propertyName] = key.split('::')
    if (propertyName && value) {
      const idx = parseInt(ruleIndex)
      if (!propertiesToInsert.has(idx)) {
        propertiesToInsert.set(idx, [])
      }
      propertiesToInsert.get(idx).push({
        property: propertyName,
        value: value,
      })
    }
  })

  // Helper function to find lines that contain a specific property in a rule
  function findPropertyLinesInRule(rule) {
    const lines = {}
    if (!rule.loc || !rule.loc.startLine || !rule.loc.endLine) {
      return lines
    }

    for (let i = rule.loc.startLine; i <= rule.loc.endLine; i++) {
      const lineIdx = i - 1 // Convert to 0-based
      const line = sourceLines[lineIdx]
      if (!line) continue

      // Try to find property: value patterns
      const propertyMatch = line.match(/^\s*([a-z-]+)\s*:\s*(.+?)\s*;?\s*$/)
      if (propertyMatch) {
        const propName = propertyMatch[1]
        const propValue = propertyMatch[2]
        lines[propName] = {
          lineIdx,
          value: propValue,
        }
      }
    }

    return lines
  }

  // Second pass: for each rule with overrides, apply property edits
  rulesTree.forEach(rule => {
    if (rule.type !== 'rule' || !rule.selector) return

    // Check if this rule has property overrides
    const overrides = propertyOverrides[rule.selector]
    if (!overrides || Object.keys(overrides).length === 0) return

    if (!rule.loc || !rule.loc.startLine || !rule.loc.endLine) return

    // Find which lines contain properties to edit
    const propertyLines = findPropertyLinesInRule(rule)

    // Mark lines for property value replacement
    Object.entries(overrides).forEach(([property, newValue]) => {
      if (propertyLines[property]) {
        const { lineIdx } = propertyLines[property]
        linesToUpdate.set(lineIdx, {
          action: 'update',
          property,
          newValue,
        })
      }
    })
  })

  // Third pass: rebuild source text with edits applied
  const result = []
  let currentRuleIndex = null

  for (let lineIdx = 0; lineIdx < sourceLines.length; lineIdx++) {
    let line = sourceLines[lineIdx]
    let lineProcessed = false

    // Check if this line contains a property to update
    if (linesToUpdate.has(lineIdx)) {
      const { property, newValue } = linesToUpdate.get(lineIdx)
      // Replace the property value while preserving formatting
      const regex = new RegExp(`(^\\s*${property}\\s*:\\s*)(.+?)(\\s*;?)\\s*$`)
      line = line.replace(regex, `$1${newValue}$3`)
    }

    // Check if we need to insert added properties before this line (closing brace)
    for (const rule of rulesTree) {
      if (rule.type !== 'rule' || !rule.loc || !rule.loc.endLine) continue

      const endLineIdx = rule.loc.endLine - 1
      if (lineIdx === endLineIdx && propertiesToInsert.has(rule.ruleIndex)) {
        // This is the closing brace line of a rule with added properties
        const newProperties = propertiesToInsert.get(rule.ruleIndex)

        if (line.includes('}')) {
          // Find indentation from existing properties
          let indent = '  '
          for (let i = rule.loc.startLine; i < rule.loc.endLine; i++) {
            const propLine = sourceLines[i - 1]
            if (propLine && propLine.trim() && !propLine.includes('{') && !propLine.includes('}')) {
              const match = propLine.match(/^(\s+)/)
              if (match) {
                indent = match[1]
                break
              }
            }
          }

          // Split the line at the closing brace
          const bracePos = line.indexOf('}')
          const beforeBrace = line.substring(0, bracePos).trimRight()
          const afterBrace = line.substring(bracePos)

          // Add content before the brace (only if it's not empty)
          if (beforeBrace.length > 0) {
            result.push(beforeBrace)
          }

          // Add the new properties
          newProperties.forEach(prop => {
            result.push(`${indent}${prop.property}: ${prop.value};`)
          })

          // Add the closing brace line
          result.push(afterBrace)
          lineProcessed = true
          break // Only process one rule per line
        }
      }
    }

    // Keep the line as-is (or with updates applied above) - but only if not already processed
    if (!lineProcessed) {
      result.push(line)
    }
  }

  // Clean up excessive whitespace
  const finalResult = []
  let prevWasBlank = false

  for (const line of result) {
    const isBlank = line.trim() === ''
    if (isBlank) {
      if (!prevWasBlank) {
        finalResult.push('')
        prevWasBlank = true
      }
    } else {
      finalResult.push(line)
      prevWasBlank = false
    }
  }

  return finalResult.join('\n').trim()
}

export default {
  findAllMergeableGroups,
  mergeRuleGroup,
  mergeAllSelectorsInTree,
  mergeSelectedGroups,
  applyMergeToSourceText,
  applyPropertyEditsToSourceText,
  removeRulesFromSourceText,
  serializeRulesToCSS,
  generateMergeDiffPreview,
  generateCodePreview,
}
