# CSS Merge Selectors System - Complete Explanation

## Overview

The CSS merge selectors system allows users in the Web Playground tool (markdown-html-formatter) to automatically consolidate duplicate CSS selectors into a single rule. This is a **Phase 7E** feature that safely removes redundant rules while preserving CSS cascade order.

**Key Insight**: When you have the same selector defined multiple times (e.g., `.header { color: red; }` and `.header { padding: 10px; }`), the merge function combines them into one rule (`.header { color: red; padding: 10px; }`), keeping the last value for any property that appears in multiple rules.

---

## Core Architecture

### 1. **Core Merging Engine** (`lib/tools/mergeSelectors.js`)

This file contains all the logic for detecting, merging, and applying CSS rule consolidation.

#### Key Functions:

##### `findAllMergeableGroups(rulesTree)`
**Purpose**: Identify which selectors appear multiple times and can be merged.

```javascript
export function findAllMergeableGroups(rulesTree = []) {
  const selectorMap = {}
  const mergeableGroups = []

  // Look at all top-level rules
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
```

**Returns**: Array of groups like:
```javascript
[
  {
    selector: ".header",
    rules: [ /* all .header rules */ ],
    count: 3,           // appears 3 times
    occurrences: [10, 25, 40],  // line numbers
    isMergeable: true
  }
]
```

---

##### `mergeRuleGroup(group)`
**Purpose**: Combine a single group of duplicate rules using CSS cascade rules.

```javascript
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
    ruleIndex: firstRule.ruleIndex,
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
```

**Algorithm**:
1. Collect ALL declarations from all rules in cascade order
2. Use a Map to keep only the LAST value for each property (CSS cascade rule)
3. Return merged rule + indices of rules to remove

**Example**:
```css
/* Input: Two .header rules */
.header { color: red; }
.header { padding: 10px; color: blue; }

/* After merge: */
.header { padding: 10px; color: blue; }
/* 'color' uses the last value (blue), padding is added */
```

---

##### `mergeSelectedGroups(rulesTree, selectedSelectors)`
**Purpose**: Merge only the selectors the user chooses (not all mergeable groups).

```javascript
export function mergeSelectedGroups(rulesTree = [], selectedSelectors = new Set()) {
  // Convert to Set if it's an array
  const selectedSet = selectedSelectors instanceof Set ? selectedSelectors : new Set(selectedSelectors)

  // Find all mergeable groups
  const allMergeableGroups = findAllMergeableGroups(rulesTree)

  // Filter to only selected groups
  const selectedMergeableGroups = allMergeableGroups.filter(g => selectedSet.has(g.selector))

  // ... process each selected group and create mutatedRulesTree ...

  // Build merge info for source text transformation
  const mergeInfo = {
    mergeGroups: selectedMergeableGroups,
  }

  return {
    mutatedRulesTree,
    summary: { totalGroupsMerged, totalRulesRemoved, affectedSelectors },
    removedIndices,
    mergeableGroups: selectedMergeableGroups,
    mergeInfo,
  }
}
```

**Returns**: 
- `mutatedRulesTree`: Updated rules with merges applied
- `mergeInfo`: Information needed to transform the source CSS text
- `summary`: Stats about what was changed

---

##### `applyMergeToSourceText(sourceText, rulesTree, mergeInfo)`
**Purpose**: Transform the original CSS source code to reflect the merges.

```javascript
export function applyMergeToSourceText(sourceText, rulesTree, mergeInfo) {
  if (!sourceText || !mergeInfo) {
    return sourceText
  }

  const sourceLines = sourceText.split('\n')
  const mergeGroups = mergeInfo.mergeGroups || []

  // For each group, find the rules in the source and merge them
  for (const group of mergeGroups) {
    if (!group || !group.rules || group.rules.length < 2) continue

    // Sort rules by line number
    const sortedRules = [...group.rules].sort((a, b) =>
      (a.loc?.startLine || 0) - (b.loc?.startLine || 0)
    )

    const firstRule = sortedRules[0]
    const duplicateRules = sortedRules.slice(1)

    // Consolidate all properties (last value wins per property)
    const consolidatedProps = {}
    sortedRules.forEach(rule => {
      if (rule.declarations) {
        rule.declarations.forEach(decl => {
          consolidatedProps[decl.property] = decl.value
        })
      }
    })

    // Properties only in later rules (to add to first rule)
    const firstRuleProps = new Set(
      (firstRule.declarations || []).map(d => d.property)
    )
    const propsToAdd = Object.entries(consolidatedProps)
      .filter(([prop]) => !firstRuleProps.has(prop))
      .map(([property, value]) => ({ property, value }))

    // Step 1: Remove all duplicate rules from source
    const linesToRemove = new Set()
    for (const dupRule of duplicateRules) {
      if (dupRule.loc?.startLine && dupRule.loc?.endLine) {
        // Convert 1-based line numbers to 0-based array indices
        for (let i = dupRule.loc.startLine - 1; i < dupRule.loc.endLine; i++) {
          linesToRemove.add(i)
        }
      }
    }

    // Step 2: Find where to insert new properties in the first rule
    let insertAtLine = -1
    let insertIndent = '  '

    if (firstRule.loc?.endLine) {
      insertAtLine = firstRule.loc.endLine - 1

      // Detect indentation
      if (firstRule.loc.startLine) {
        for (let i = firstRule.loc.startLine - 1; i < firstRule.loc.endLine; i++) {
          const line = sourceLines[i]
          if (line && !line.includes('{') && !line.includes('}') && line.trim()) {
            const match = line.match(/^(\s+)/)
            if (match) {
              insertIndent = match[1]
              break
            }
          }
        }
      }
    }

    // Step 3: Rebuild source
    const newSourceLines = []
    for (let i = 0; i < sourceLines.length; i++) {
      // Skip lines from duplicate rules
      if (linesToRemove.has(i)) {
        continue
      }

      const line = sourceLines[i]

      // If this is the closing brace of the first rule and we have new properties, insert them
      if (i === insertAtLine && propsToAdd.length > 0 && line.includes('}')) {
        const bracePos = line.indexOf('}')
        const beforeBrace = line.substring(0, bracePos).trimRight()
        const afterBrace = line.substring(bracePos)

        if (beforeBrace.length > 0) {
          newSourceLines.push(beforeBrace)
        }

        propsToAdd.forEach(prop => {
          newSourceLines.push(`${insertIndent}${prop.property}: ${prop.value};`)
        })

        newSourceLines.push(afterBrace)
      } else {
        newSourceLines.push(line)
      }
    }

    // Update sourceLines for next iteration
    sourceLines.length = 0
    sourceLines.push(...newSourceLines)
  }

  // Final cleanup: collapse blank lines
  const result = []
  let lastWasBlank = false

  for (const line of sourceLines) {
    const isBlank = line.trim() === ''
    if (isBlank) {
      if (!lastWasBlank) {
        result.push('')
        lastWasBlank = true
      }
    } else {
      result.push(line)
      lastWasBlank = false
    }
  }

  return result.join('\n').trim()
}
```

**Algorithm**:
1. For each merge group:
   - Identify which lines contain the duplicate rules
   - Find properties that only exist in later rules
   - Remove lines with duplicate rules
   - Insert missing properties before the closing brace of the first rule
2. Clean up blank lines

**This is where most bugs typically occur** because it requires:
- Correct line number mapping (1-based from AST, 0-based for arrays)
- Proper indentation detection
- Careful handling of rule boundaries

---

### 2. **UI Components**

#### `components/RuleExplorer.js`
Shows all CSS rules in a tree view. Displays a **"🧩 Merge All"** button when mergeable selectors are detected.

```javascript
// Phase 7E: Find mergeable rule groups
const mergeableGroups = findAllMergeableGroups(rules)
const canMerge = mergeableGroups && mergeableGroups.length > 0

const renderMergeButton = () => {
  if (!canMerge) return null

  const totalRulesCanBeMerged = mergeableGroups.reduce((sum, g) => sum + (g.count - 1), 0)

  return (
    <div className={styles.ruleExplorerToolbar}>
      <button
        className={styles.mergeAllButton}
        onClick={() => {
          if (onMergeClick) {
            onMergeClick(mergeableGroups)
          }
        }}
        title={`Merge ${mergeableGroups.length} group(s) of duplicate selectors (${totalRulesCanBeMerged} rules will be removed)`}
      >
        🧩 Merge All ({mergeableGroups.length})
      </button>
    </div>
  )
}
```

**Triggers**: User clicks "🧩 Merge All" button → calls `onMergeClick(mergeableGroups)`

---

#### `components/MergeSelectorConfirmation.js`
Modal dialog that shows what will be merged before confirming. Allows selective merging.

```javascript
export default function MergeSelectorConfirmation({
  mergeableGroups = [],
  rulesTree = [],
  sourceText = '',
  onConfirm = null,
  onCancel = null,
}) {
  // Initialize selectedSelectors - all are checked by default
  const [selectedSelectors, setSelectedSelectors] = useState(
    new Set(mergeableGroups.map(g => g.selector))
  )

  // Generate the merge result based on selected selectors
  const mergeResult = mergeSelectedGroups(rulesTree, selectedSelectors)
  const { summary, mergeInfo } = mergeResult

  // Apply merge to source text
  let sourceToMerge = sourceText
  if (sourceText && sourceText.includes('.pwt-markdown-preview')) {
    // Regenerate unscoped CSS from rulesTree for accurate merging
    sourceToMerge = rulesTree && rulesTree.length > 0
      ? serializeRulesToCSS(rulesTree)
      : sourceText
  }

  const mergedCSS = sourceToMerge && mergeInfo
    ? applyMergeToSourceText(sourceToMerge, rulesTree, mergeInfo)
    : ''

  // Get the currently expanded selector's group for preview
  const expandedGroup = mergeableGroups.find(g => g.selector === expandedSelector)
  const codePreview = isExpandedSelected && expandedGroup
    ? generateCodePreview(expandedGroup, rulesTree)
    : null

  const handleConfirm = () => {
    if (onConfirm && selectedSelectors.size > 0) {
      onConfirm(mergedCSS)  // Pass the merged CSS to parent
    }
  }

  return (
    <div className={styles.confirmationOverlay}>
      {/* Shows merge preview, stats, checkboxes for each selector */}
      {/* User can select which selectors to merge */}
      {/* "Apply Merge" button calls onConfirm(mergedCSS) */}
    </div>
  )
}
```

**Key Logic**:
1. Compute merge result with `mergeSelectedGroups`
2. Generate merged CSS with `applyMergeToSourceText`
3. Show preview with `generateCodePreview`
4. User confirms → `onConfirm(mergedCSS)` is called with the final merged CSS

---

#### `components/MarkdownPreviewWithInspector.js`
The main inspector component in the Web Playground tool. Orchestrates the merge flow.

```javascript
// Handle merge selectors request
const handleMergeClick = (mergeableGroups) => {
  setMergeableGroupsForModal(mergeableGroups)
}

// Confirm and apply merge
const handleMergeConfirm = (mergedCSS) => {
  if (mergedCSS && onCssChange) {
    onCssChange(mergedCSS)  // Update parent with merged CSS
    // Reset local rules tree so it syncs with the updated prop from formatter
    setLocalRulesTree(null)
    setMergeableGroupsForModal(null)
  }
}

// Cancel merge
const handleMergeCancel = () => {
  setMergeableGroupsForModal(null)
}

// In JSX, render the modal when mergeableGroupsForModal is set:
{mergeableGroupsForModal && (
  <MergeSelectorConfirmation
    mergeableGroups={mergeableGroupsForModal}
    rulesTree={effectiveRulesTree}
    sourceText={customCss}
    onConfirm={handleMergeConfirm}
    onCancel={handleMergeCancel}
  />
)}
```

**Flow**:
1. User clicks "🧩 Merge All" in RuleExplorer
2. → `handleMergeClick` sets `mergeableGroupsForModal`
3. → `MergeSelectorConfirmation` modal opens
4. → User confirms merge
5. → `handleMergeConfirm` gets merged CSS
6. → Calls `onCssChange(mergedCSS)` to update parent
7. → Parent (ToolOutputPanel) updates the markdown/html preview with merged CSS

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ MarkdownPreviewWithInspector (Inspector Panel)                  │
│                                                                 │
│  State:                                                         │
│  - effectiveRulesTree (parsed CSS rules)                        │
│  - customCss (original CSS source)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User clicks rule in RuleExplorer
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RuleExplorer Component                                          │
│                                                                 │
│  1. findAllMergeableGroups(effectiveRulesTree)                  │
│  2. Display "🧩 Merge All (N)" button                           │
│  3. User clicks button → onMergeClick(mergeableGroups)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    handleMergeClick called
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ MergeSelectorConfirmation Modal                                 │
│                                                                 │
│  1. mergeSelectedGroups(effectiveRulesTree, selectedSelectors)  │
│  2. applyMergeToSourceText(customCss, effectiveRulesTree, ...)  │
│  3. generateCodePreview() for user to review                    │
│  4. User clicks "✓ Apply Merge"                                 │
│  5. onConfirm(mergedCSS) callback                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    handleMergeConfirm called
                              ↓
                    onCssChange(mergedCSS)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Parent Component (ToolOutputPanel)                              │
│                                                                 │
│  Updates customCss state → triggers re-render of preview        │
│  New CSS is formatted and parsed → effectiveRulesTree updated   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Potential Issues and Common Bugs

### 1. **Line Number Off-by-One Errors**
- CSS AST uses 1-based line numbers (line 1 = first line)
- JavaScript arrays are 0-based (index 0 = first element)
- `applyMergeToSourceText` must convert correctly

**Fix in code**: 
```javascript
// Line numbers are 1-based in loc, array indices are 0-based
for (let i = dupRule.loc.startLine - 1; i < dupRule.loc.endLine; i++) {
  linesToRemove.add(i)
}
```

### 2. **Scoped CSS Issues**
When CSS is scoped with `.pwt-markdown-preview` prefix, the merge function needs to work on unscoped CSS.

**Fix in code** (in MergeSelectorConfirmation):
```javascript
let sourceToMerge = sourceText
if (sourceText && sourceText.includes('.pwt-markdown-preview')) {
  // Regenerate unscoped CSS from rulesTree for accurate merging
  sourceToMerge = rulesTree && rulesTree.length > 0
    ? serializeRulesToCSS(rulesTree)
    : sourceText
}
```

### 3. **Indentation Detection**
If the source CSS uses inconsistent indentation, the merge might produce incorrectly indented output.

**Current approach**:
```javascript
// Detect indentation from existing rules
for (let i = firstRule.loc.startLine - 1; i < firstRule.loc.endLine; i++) {
  const line = sourceLines[i]
  if (line && !line.includes('{') && !line.includes('}') && line.trim()) {
    const match = line.match(/^(\s+)/)
    if (match) {
      insertIndent = match[1]
      break
    }
  }
}
```

### 4. **Property Ordering**
When merging, properties might end up in a different order. The current code uses a Map which preserves insertion order in JavaScript.

### 5. **Rules in @media Queries**
The current implementation only merges top-level rules. Selectors inside @media queries are NOT merged (intentionally, to avoid cross-context merging).

---

## Testing the Merge Function

### Example Input:
```css
.header {
  color: red;
  padding: 10px;
}

.button {
  background: blue;
}

.header {
  font-size: 16px;
}

.button {
  color: white;
}
```

### Expected Output:
```css
.header {
  color: red;
  padding: 10px;
  font-size: 16px;
}

.button {
  background: blue;
  color: white;
}
```

### What Gets Removed:
- The second `.header` rule (lines 10-12)
- The second `.button` rule (lines 14-16)

### What Gets Added:
- `font-size: 16px` gets added to first `.header` rule
- `color: white` gets added to first `.button` rule

---

## Key Functions Reference

| Function | Purpose | Takes | Returns |
|----------|---------|-------|---------|
| `findAllMergeableGroups()` | Detect duplicate selectors | rulesTree | Array of mergeable groups |
| `mergeRuleGroup()` | Combine one group of rules | group | mergedRule + removedIndices |
| `mergeSelectedGroups()` | Merge selected groups only | rulesTree, selectedSelectors | mutatedRulesTree + mergeInfo |
| `applyMergeToSourceText()` | Transform source CSS text | sourceText, rulesTree, mergeInfo | Merged CSS string |
| `serializeRulesToCSS()` | Convert rules tree to CSS text | rulesToSerialize | CSS string |
| `generateCodePreview()` | Create visual preview of merge | group, rulesTree | Formatted code string |
| `applyPropertyEditsToSourceText()` | Apply property value changes | sourceText, rulesTree, overrides | Edited CSS string |

---

## Where to Fix Issues

If there are bugs in the merge system, check these files in order:

1. **`lib/tools/mergeSelectors.js`** - Core algorithm (most likely source of issues)
2. **`components/MergeSelectorConfirmation.js`** - Modal/confirmation logic
3. **`components/MarkdownPreviewWithInspector.js`** - Integration with inspector
4. **`components/RuleExplorer.js`** - UI trigger point
5. **Line number handling** - Verify 1-based ↔ 0-based conversion
6. **CSS source parsing** - Ensure rulesTree has correct loc data

