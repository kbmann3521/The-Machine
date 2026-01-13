# CSS Merge Fix - Detailed Code Changes

## File: `lib/tools/mergeSelectors.js`

Function: `applyMergeToSourceText()`

### BEFORE (❌ Buggy - Modified sourceLines Inside Loop)

```javascript
export function applyMergeToSourceText(sourceText, rulesTree, mergeInfo) {
  if (!sourceText || !mergeInfo) {
    return sourceText
  }

  if (mergeInfo instanceof Set) {
    return applyMergeToSourceTextLegacy(sourceText, rulesTree, mergeInfo)
  }

  const sourceLines = sourceText.split('\n')
  const mergeGroups = mergeInfo.mergeGroups || []

  if (mergeGroups.length === 0) {
    return sourceText
  }

  // ❌ PROBLEM: Loop modifies sourceLines
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

    // Properties only in later rules
    const firstRuleProps = new Set(
      (firstRule.declarations || []).map(d => d.property)
    )
    const propsToAdd = Object.entries(consolidatedProps)
      .filter(([prop]) => !firstRuleProps.has(prop))
      .map(([property, value]) => ({ property, value }))

    // Step 1: Remove all duplicate rules
    const linesToRemove = new Set()
    for (const dupRule of duplicateRules) {
      if (dupRule.loc?.startLine && dupRule.loc?.endLine) {
        for (let i = dupRule.loc.startLine - 1; i < dupRule.loc.endLine; i++) {
          linesToRemove.add(i)
        }
      }
    }

    // Step 2: Find where to insert new properties
    let insertAtLine = -1
    let insertIndent = '  '

    if (firstRule.loc?.endLine) {
      insertAtLine = firstRule.loc.endLine - 1

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
      if (linesToRemove.has(i)) {
        continue
      }

      const line = sourceLines[i]

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

    // ❌ INVALIDATES ALL REMAINING loc VALUES
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

---

### AFTER (✅ Fixed - Patch System with Descending Order)

```javascript
export function applyMergeToSourceText(sourceText, rulesTree, mergeInfo) {
  if (!sourceText || !mergeInfo) {
    return sourceText
  }

  if (mergeInfo instanceof Set) {
    return applyMergeToSourceTextLegacy(sourceText, rulesTree, mergeInfo)
  }

  const sourceLines = sourceText.split('\n')
  const mergeGroups = mergeInfo.mergeGroups || []

  if (mergeGroups.length === 0) {
    return sourceText
  }

  /**
   * ✅ FIX: Use a patch system to avoid position invalidation.
   * 
   * APPROACH: Compute all edits first, then apply in DESCENDING order (bottom to top)
   * This ensures earlier edits don't shift offsets for later edits.
   * 
   * Each patch is: { startLineIdx, endLineIdx, insertLines, insertAtLineIdx }
   */
  const patches = []

  // Phase 1: Compute all patches from ORIGINAL source (no modifications yet)
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

    if (propsToAdd.length === 0) continue // No new properties to add, skip

    // Detect indentation from first rule
    let insertIndent = '  '
    if (firstRule.loc?.startLine && firstRule.loc?.endLine) {
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

    // Collect duplicate rule line ranges to remove (1-based → 0-based)
    const duplicateLineRanges = []
    for (const dupRule of duplicateRules) {
      if (dupRule.loc?.startLine && dupRule.loc?.endLine) {
        duplicateLineRanges.push({
          startLineIdx: dupRule.loc.startLine - 1,
          endLineIdx: dupRule.loc.endLine - 1, // inclusive
        })
      }
    }

    // Build patch: remove duplicate rules + insert new properties
    patches.push({
      duplicateLineRanges,      // Which lines to remove
      insertAtLineIdx: firstRule.loc?.endLine ? firstRule.loc.endLine - 1 : -1,
      insertIndent,
      propsToAdd,
    })
  }

  // Phase 2: Apply patches in DESCENDING order (bottom to top)
  // Sort patches by highest removal position first to ensure earlier patches don't shift later indices
  patches.sort((a, b) => {
    const aMax = Math.max(...a.duplicateLineRanges.map(r => r.endLineIdx), a.insertAtLineIdx)
    const bMax = Math.max(...b.duplicateLineRanges.map(r => r.endLineIdx), b.insertAtLineIdx)
    return bMax - aMax // Descending: process bottom patches first
  })

  // Apply each patch to sourceLines
  // When patches are applied in descending order, earlier patches don't invalidate later indices
  for (const patch of patches) {
    const { duplicateLineRanges, insertAtLineIdx, insertIndent, propsToAdd } = patch

    // Step 1: Remove duplicate rule lines in descending order of line index
    // This preserves indices of unaffected lines
    const linesToRemove = new Set()
    for (const range of duplicateLineRanges) {
      for (let i = range.startLineIdx; i <= range.endLineIdx; i++) {
        linesToRemove.add(i)
      }
    }

    // Remove in descending order so we don't shift indices of earlier lines
    const linesToRemoveArray = Array.from(linesToRemove).sort((a, b) => b - a)

    for (const lineIdx of linesToRemoveArray) {
      sourceLines.splice(lineIdx, 1)
    }

    // Step 2: Insert new properties at the closing brace of the first rule
    // Calculate how many lines were removed before insertAtLineIdx
    const removedCountBefore = linesToRemoveArray.filter(idx => idx < insertAtLineIdx).length
    const adjustedInsertAtLineIdx = insertAtLineIdx - removedCountBefore

    if (adjustedInsertAtLineIdx >= 0 && adjustedInsertAtLineIdx < sourceLines.length) {
      const line = sourceLines[adjustedInsertAtLineIdx]

      if (line.includes('}')) {
        const bracePos = line.indexOf('}')
        const beforeBrace = line.substring(0, bracePos).trimRight()
        const afterBrace = line.substring(bracePos)

        // Build new lines to insert
        const newLines = []

        if (beforeBrace.length > 0) {
          newLines.push(beforeBrace)
        }

        propsToAdd.forEach(prop => {
          newLines.push(`${insertIndent}${prop.property}: ${prop.value};`)
        })

        newLines.push(afterBrace)

        // Replace the brace line with expanded version
        sourceLines.splice(adjustedInsertAtLineIdx, 1, ...newLines)
      }
    }
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

---

## Key Differences Summary

| Aspect | Before ❌ | After ✅ |
|--------|---------|--------|
| **Loop Behavior** | Modifies sourceLines inside loop | Computes all patches first, modifies separately |
| **Order of Application** | Forward (ascending line numbers) | Descending (bottom to top) |
| **Line Number Validity** | Invalidated after 1st iteration | Always valid because processed bottom-to-top |
| **Patch Storage** | None - edits applied immediately | Stored in `patches` array |
| **Sorting** | N/A | Patches sorted by highest line number descending |
| **Risk of Skipped Rules** | High - later loc values become stale | None - all positions computed from original |
| **Code Structure** | Single loop, rebuild on each iteration | Two phases: compute, then apply |
| **Comments** | "Step 1, 2, 3" within messy loop | Clear "Phase 1" and "Phase 2" separation |

---

## Why The Old Code Failed

```javascript
// Iteration 1 (process .button group):
sourceLines = ['line1', 'line2', 'line3', 'line4']
sourceLines.length = 0
sourceLines.push(...newSourceLines)  // sourceLines is now ['line1', 'line2a', 'line3a']

// Iteration 2 (process .header group):
// .header's loc.startLine still says "line 4"
// But sourceLines[3] doesn't exist anymore!
// Edit misses target or crashes
```

## Why The New Code Works

```javascript
// Phase 1: Compute patches based on ORIGINAL sourceLines
patches = [
  { duplicateLineRanges: [{startLineIdx: 3, endLineIdx: 3}], insertAtLineIdx: 2, ... },
  { duplicateLineRanges: [{startLineIdx: 1, endLineIdx: 1}], insertAtLineIdx: 0, ... },
]

// Phase 2: Sort descending
patches = [
  { max: 3, ... },  // Process first (higher line number)
  { max: 1, ... },  // Process second (lower line number)
]

// Apply:
// - Remove line 3 (doesn't affect lines 0-2)
// - Remove line 1 (lines 0-2 still valid, line 3 already gone)
// ✅ All patches succeed
```

---

## Testing the Change

### Quick Verification

```javascript
// Before fix:
const css = `.a { x: 1; }\n.b { y: 2; }\n.a { x: 3; }\n.b { y: 4; }`
const result = applyMergeToSourceText(css, rulesTree, mergeInfo)
// Would only merge .b (or .a), but not both

// After fix:
const result = applyMergeToSourceText(css, rulesTree, mergeInfo)
// Merges both .a and .b ✅
```

### Comprehensive Test

See `TEST_MERGE_FIX.md` for full test cases including:
- Two groups (both should merge)
- Three duplicates of same selector
- Interleaved selectors
- With blank lines/comments
- Scoped CSS
