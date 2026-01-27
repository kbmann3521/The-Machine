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
      origin: rule.origin, // CRITICAL: Preserve origin metadata (html vs css source)
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
 * 4. Consolidation strategy:
 *    - If duplicates exist ONLY in HTML → merge in HTML
 *    - If duplicates exist ONLY in CSS → merge in CSS
 *    - If duplicates exist in BOTH → consolidate based on direction parameter (default: CSS)
 *
 * @param {Object} group - The rule group to merge
 * @param {string} preferredDirection - 'html' or 'css' (default: 'css') - which tab to consolidate cross-tab duplicates to
 * Returns { mergedRule, removedRuleIndices }
 */
export function mergeRuleGroup(group, preferredDirection = 'css') {
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

  // Determine merge destination based on which sources have duplicates
  // Step 1: Separate rules by their origin source
  const htmlRules = group.rules.filter(r => r.origin?.source === 'html')
  const cssRules = group.rules.filter(r => r.origin?.source === 'css' || !r.origin?.source)

  // Step 2: Check if each source has duplicates (more than 1 rule from that source)
  const htmlHasDuplicates = htmlRules.length > 1
  const cssHasDuplicates = cssRules.length > 1

  // Step 2b: Check for cross-tab duplicates (rules from BOTH origins)
  const hasHtmlRules = htmlRules.length > 0
  const hasCssRules = cssRules.length > 0
  const isCrossTabDuplicate = hasHtmlRules && hasCssRules

  // DEBUG: Log all merge cases
  console.log(`[mergeRuleGroup] "${group.selector}"`)
  console.log(`  Total rules: ${group.rules.length}, HTML: ${htmlRules.length}, CSS: ${cssRules.length}`)
  console.log(`  htmlHasDuplicates: ${htmlHasDuplicates}, cssHasDuplicates: ${cssHasDuplicates}, isCrossTabDuplicate: ${isCrossTabDuplicate}`)
  if (htmlRules.length > 0) {
    console.log(`  HTML rules:`, htmlRules.map((r, i) => `[${i}] idx=${r.ruleIndex}`))
  }
  if (cssRules.length > 0) {
    console.log(`  CSS rules:`, cssRules.map((r, i) => `[${i}] idx=${r.ruleIndex}`))
  }

  // Step 3: Determine merge destination
  // Rule: Use the base rule from the source that has duplicates
  // If duplicates exist in BOTH sources OR cross-tab, use preferredDirection (default: CSS)
  let baseRule = null

  if (htmlHasDuplicates && !cssHasDuplicates && !isCrossTabDuplicate) {
    // Only HTML has duplicates → merged rule stays in HTML
    baseRule = htmlRules[0]
    console.log(`  → Merging to HTML (HTML-only duplicates)`)
  } else if (cssHasDuplicates && !htmlHasDuplicates && !isCrossTabDuplicate) {
    // Only CSS has duplicates → merged rule stays in CSS
    baseRule = cssRules[0]
    console.log(`  → Merging to CSS (CSS-only duplicates)`)
  } else if ((htmlHasDuplicates && cssHasDuplicates) || isCrossTabDuplicate) {
    // Both sources have duplicates OR cross-tab duplicates → consolidate based on preferredDirection
    if (preferredDirection === 'html' && htmlRules.length > 0) {
      baseRule = htmlRules[0]
      console.log(`  → Merging to HTML (user preference for cross-tab duplicates)`)
    } else {
      baseRule = cssRules[0]
      console.log(`  → Merging to CSS (user preference or default for cross-tab duplicates)`)
    }
  } else {
    // Fallback (shouldn't happen since we require group.rules.length > 1)
    baseRule = group.rules[0]
    console.log(`  → Using first rule (fallback)`)
  }

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
    ruleIndex: baseRule.ruleIndex, // Use base rule's index
    origin: baseRule.origin || { source: 'css', containerId: 'default' }, // Use base rule's origin
  }

  // Indices to remove: depends on which source(s) have duplicates
  // CRITICAL: When merging, remove ALL rules from the group EXCEPT the one we're keeping as the merged rule
  // This includes duplicates from the same source
  let removedRuleIndices = []

  // ALWAYS remove all rules except the baseRule, regardless of source
  // The baseRule is the one we're keeping (either first HTML or first CSS, depending on direction)
  removedRuleIndices = group.rules.filter(r => r.ruleIndex !== baseRule.ruleIndex).map(r => r.ruleIndex)

  console.log(`  → Removing duplicates: ${removedRuleIndices.length} rules`)
  console.log(`    Kept baseRule: ruleIndex=${baseRule.ruleIndex}, origin=${baseRule.origin?.source}`)
  console.log(`    Removing: ${JSON.stringify(removedRuleIndices)}`)

  return {
    mergedRule,
    removedRuleIndices,
    mergedDeclarations,
    originalCount: group.rules.length,
  }
}

/**
 * Helper: Find a rule by comparing ruleIndex and optionally selector
 * Returns { path, rule } where path is array of indices to access it
 * If selector is provided, matches on BOTH ruleIndex AND selector to disambiguate
 */
function findRuleByIndex(rules, targetRuleIndex, currentPath = [], depth = 0, targetSelector = null) {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (rule.ruleIndex === targetRuleIndex) {
      // If selector is provided, require it to match too (for disambiguation)
      if (targetSelector !== null && rule.selector !== targetSelector) {
        // This rule has matching ruleIndex but different selector, skip it
        continue
      }
      const path = [...currentPath, i]
      console.log(`    [findRuleByIndex] FOUND ruleIndex ${targetRuleIndex}${targetSelector ? ` selector "${targetSelector}"` : ''} at path ${JSON.stringify(path)}`)
      return { path, rule }
    }
    if (rule.children && Array.isArray(rule.children)) {
      const found = findRuleByIndex(rule.children, targetRuleIndex, [...currentPath, i, 'children'], depth + 1, targetSelector)
      if (found) return found
    }
  }
  if (depth === 0) {
    console.log(`    [findRuleByIndex] NOT FOUND ruleIndex ${targetRuleIndex}${targetSelector ? ` selector "${targetSelector}"` : ''} in rules tree`)
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
 * Path format: [arrayIndex] for top-level, [parentIndex, 'children', childIndex] for nested
 */
function removeAtPath(obj, path) {
  if (path.length === 1) {
    // Top-level removal: path is just [index]
    if (Array.isArray(obj)) {
      obj.splice(path[0], 1)
    }
  } else {
    // Nested removal: navigate to parent, then splice
    let current = obj
    for (let i = 0; i < path.length - 2; i++) {
      current = current[path[i]]
    }
    const arr = current[path[path.length - 2]]
    if (Array.isArray(arr)) {
      arr.splice(path[path.length - 1], 1)
    }
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

  // Remove rules in REVERSE ARRAY INDEX order to maintain correct paths
  // CRITICAL: We must sort by array position (path), not by ruleIndex!
  // Removing a rule from position [5] affects positions [6+], but not [0-4]
  // So we remove from highest index to lowest to avoid index shifting issues
  const pathsToRemove = []
  allRemovedIndices.forEach(ruleIndex => {
    const found = findRuleByIndex(mutatedRulesTree, ruleIndex)
    if (found) {
      pathsToRemove.push({ path: found.path, ruleIndex })
    }
  })

  // Sort by the first element of the path (array index) in DESCENDING order
  pathsToRemove.sort((a, b) => {
    const indexA = a.path[0]
    const indexB = b.path[0]
    return indexB - indexA // Descending order: highest first
  })

  // Remove rules starting from highest index to lowest
  pathsToRemove.forEach(({ path, ruleIndex }) => {
    console.log(`  [mergeAllSelectorsInTree] Removing rule at path ${JSON.stringify(path)} (ruleIndex=${ruleIndex})`)
    removeAtPath(mutatedRulesTree, path)
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
 * Serialize merged rules tree back to CSS by origin
 * Returns { html: string, css: string } with rules separated by their source
 * Used after merging to apply changes back to both HTML and CSS sources
 */
export function serializeMergedRulesByOrigin(mergedRulesTree = []) {
  if (!mergedRulesTree || mergedRulesTree.length === 0) {
    console.log(`[serializeMergedRulesByOrigin] Input tree is empty`)
    return { html: '', css: '' }
  }

  console.log(`[serializeMergedRulesByOrigin] Input tree has ${mergedRulesTree.length} rules`)

  const rulesByOrigin = { html: [], css: [] }

  // Separate rules by origin
  mergedRulesTree.forEach((rule, idx) => {
    const source = rule.origin?.source || 'css'
    console.log(`  [${idx}] selector="${rule.selector}", origin="${source}", ruleIndex=${rule.ruleIndex}`)
    if (source === 'html') {
      rulesByOrigin.html.push(rule)
    } else {
      rulesByOrigin.css.push(rule)
    }
  })

  console.log(`[serializeMergedRulesByOrigin] After separation: ${rulesByOrigin.html.length} HTML rules, ${rulesByOrigin.css.length} CSS rules`)

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

/**
 * Merge only selected mergeable groups
 *
 * @param {Array} rulesTree - The full rules tree from both sources
 * @param {Set|Array} selectedSelectors - Set or array of selector strings to merge (e.g., {".header", ".button"})
 * @param {string} preferredDirection - 'html' or 'css' (default: 'css') - which tab to consolidate cross-tab duplicates to
 * Returns merge plan with information needed for source text transformation
 */
export function mergeSelectedGroups(rulesTree = [], selectedSelectors = new Set(), preferredDirection = 'css') {
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

  console.log(`[mergeSelectedGroups] INPUT STATE:`)
  console.log(`  Input rulesTree has ${rulesTree.length} rules:`)
  rulesTree.forEach((r, i) => {
    console.log(`    [${i}] ruleIndex=${r.ruleIndex}, selector=${r.selector}, origin=${r.origin?.source}`)
  })
  console.log(`  mutatedRulesTree has ${mutatedRulesTree.length} rules (after deep copy):`)
  mutatedRulesTree.forEach((r, i) => {
    console.log(`    [${i}] ruleIndex=${r.ruleIndex}, selector=${r.selector}, origin=${r.origin?.source}`)
  })
  console.log(`  selectedMergeableGroups: ${selectedMergeableGroups.length} groups to merge`)
  selectedMergeableGroups.forEach(g => {
    console.log(`    - "${g.selector}": ${g.count} rules`)
    g.rules.forEach((r, i) => {
      console.log(`        [${i}] ruleIndex=${r.ruleIndex}, origin=${r.origin?.source}`)
    })
  })

  // Track rules to remove as objects with both ruleIndex AND selector for disambiguation
  const rulesToRemove = []

  // Process each selected mergeable group
  selectedMergeableGroups.forEach(group => {
    const result = mergeRuleGroup(group, preferredDirection)
    if (!result) return

    const { mergedRule, removedRuleIndices } = result

    console.log(`[mergeSelectedGroups] Processing selector: "${group.selector}"`)
    console.log(`  mergedRule.ruleIndex=${mergedRule.ruleIndex}, mergedRule.origin=${mergedRule.origin?.source}`)
    console.log(`  removedRuleIndices=${JSON.stringify(removedRuleIndices)}`)

    // Find the merged rule by its ruleIndex AND selector (to avoid matching wrong rule if duplicate ruleIndices exist)
    // The mergedRule.ruleIndex tells us which source the merged rule belongs to
    const mergedRuleInfo = findRuleByIndex(mutatedRulesTree, mergedRule.ruleIndex, [], 0, mergedRule.selector)
    if (mergedRuleInfo) {
      console.log(`  Found merged rule at path: ${JSON.stringify(mergedRuleInfo.path)}`)
      setAtPath(mutatedRulesTree, mergedRuleInfo.path, mergedRule)
      console.log(`  Updated merged rule in tree`)
    } else {
      console.log(`  WARNING: Could not find merged rule with ruleIndex=${mergedRule.ruleIndex} selector="${mergedRule.selector}" in tree!`)
    }

    // Mark others for removal - track as {ruleIndex, selector} pairs for disambiguation
    removedRuleIndices.forEach(idx => {
      // Find the rule to get its selector so we can remove the RIGHT one
      const ruleToRemove = group.rules.find(r => r.ruleIndex === idx)
      if (ruleToRemove) {
        rulesToRemove.push({ ruleIndex: idx, selector: ruleToRemove.selector })
        allRemovedIndices.add(idx)
        console.log(`  Adding ruleIndex ${idx} (selector="${ruleToRemove.selector}") to removal list`)
      }
    })

    affectedSelectors.push({
      selector: group.selector,
      originalCount: group.count,
      newCount: 1,
      declarationCount: mergedRule.declarations.length,
      occurrences: group.occurrences,
    })
  })

  // Remove rules in REVERSE ARRAY INDEX order to maintain correct paths
  // CRITICAL: We must sort by array position (path), not by ruleIndex!
  // Removing a rule from position [5] affects positions [6+], but not [0-4]
  // So we remove from highest index to lowest to avoid index shifting issues
  console.log(`[mergeSelectedGroups] Preparing to remove ${allRemovedIndices.size} rules`)
  console.log(`  allRemovedIndices: ${JSON.stringify(Array.from(allRemovedIndices))}`)

  const pathsToRemove = []
  rulesToRemove.forEach(({ ruleIndex, selector }) => {
    // Find the rule by BOTH ruleIndex AND selector to avoid removing wrong rule
    const found = findRuleByIndex(mutatedRulesTree, ruleIndex, [], 0, selector)
    if (found) {
      console.log(`  Found ruleIndex ${ruleIndex} (selector="${selector}") at path: ${JSON.stringify(found.path)}`)
      pathsToRemove.push({ path: found.path, ruleIndex, selector })
    } else {
      console.log(`  WARNING: Could not find ruleIndex ${ruleIndex} (selector="${selector}") in mutatedRulesTree!`)
      console.log(`  mutatedRulesTree has ${mutatedRulesTree.length} rules at top level`)
      mutatedRulesTree.forEach((r, i) => {
        console.log(`    [${i}] ruleIndex=${r.ruleIndex}, selector=${r.selector}, origin=${r.origin?.source}`)
      })
    }
  })

  console.log(`[mergeSelectedGroups] Found ${pathsToRemove.length} paths to remove`)

  // Sort by the first element of the path (array index) in DESCENDING order
  pathsToRemove.sort((a, b) => {
    const indexA = a.path[0]
    const indexB = b.path[0]
    return indexB - indexA // Descending order: highest first
  })

  console.log(`[mergeSelectedGroups] Removal order (highest index first):`)
  pathsToRemove.forEach(item => {
    console.log(`  Path: ${JSON.stringify(item.path)}, ruleIndex: ${item.ruleIndex}, selector: "${item.selector}"`)
  })

  // Remove rules starting from highest index to lowest
  pathsToRemove.forEach(({ path, ruleIndex, selector }) => {
    console.log(`[mergeSelectedGroups] REMOVING rule at path ${JSON.stringify(path)} (ruleIndex=${ruleIndex}, selector="${selector}")`)
    removeAtPath(mutatedRulesTree, path)
  })

  console.log(`[mergeSelectedGroups] After removal, mutatedRulesTree has ${mutatedRulesTree.length} rules`)
  mutatedRulesTree.forEach((r, i) => {
    console.log(`  [${i}] ruleIndex=${r.ruleIndex}, selector=${r.selector}, origin=${r.origin?.source}`)
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
