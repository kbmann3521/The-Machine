# CSS Merge Selectors Fix Summary

## Problem Identified

**Symptom**: "Later duplicates get skipped" when merging CSS selectors

**Root Cause** (as Kyle identified): 
- Old implementation used **Approach B** (AST detection + text surgery) **WITHOUT a patch system**
- Line-by-line modifications inside a loop invalidated subsequent line numbers
- Later merge groups tried to use outdated `loc` values → edits hit wrong lines → appeared to "skip"

**Evidence**:
```javascript
// OLD CODE - THE BUG
for (const group of mergeGroups) {
  // ... compute patches based on group.rules[i].loc ...
  
  // ❌ INVALIDATES ALL REMAINING LOC VALUES
  sourceLines.length = 0
  sourceLines.push(...newSourceLines)  // Now all subsequent groups have stale positions
}
```

---

## Solution Implemented

**New Approach**: Proper patch system with **descending order application** (bottom-to-top)

### Key Changes in `lib/tools/mergeSelectors.js`:

#### Phase 1: Compute All Patches (BEFORE modifications)
- All patches computed from **original** sourceLines
- Each patch records what to delete and where to insert
- No modifications to sourceLines yet

```javascript
const patches = []

for (const group of mergeGroups) {
  // ... compute patch based on ORIGINAL sourceLines ...
  patches.push({
    duplicateLineRanges: [ {startLineIdx, endLineIdx}, ... ],
    insertAtLineIdx,
    insertIndent,
    propsToAdd,
  })
}
```

#### Phase 2: Sort Patches Descending
```javascript
patches.sort((a, b) => {
  const aMax = Math.max(...a.duplicateLineRanges.map(r => r.endLineIdx), a.insertAtLineIdx)
  const bMax = Math.max(...b.duplicateLineRanges.map(r => r.endLineIdx), b.insertAtLineIdx)
  return bMax - aMax // DESCENDING: highest line numbers first
})
```

**Why descending matters**:
- When removing line 30, it doesn't shift lines 1-29
- When we then process edits at line 10, those line numbers are still valid
- Compare ascending order: remove line 10 → line 30 is now at 29 → later edits miss

#### Phase 3: Apply Patches Bottom-to-Top
```javascript
for (const patch of patches) {
  // Remove duplicate lines (in descending order within this patch)
  const linesToRemoveArray = Array.from(linesToRemove).sort((a, b) => b - a)
  for (const lineIdx of linesToRemoveArray) {
    sourceLines.splice(lineIdx, 1)
  }
  
  // Adjust insertion point for lines we just removed BEFORE it
  const removedCountBefore = linesToRemoveArray.filter(idx => idx < insertAtLineIdx).length
  const adjustedInsertAtLineIdx = insertAtLineIdx - removedCountBefore
  
  // Insert new properties
  sourceLines.splice(adjustedInsertAtLineIdx, 1, ...newLines)
}
```

---

## Why This Works

### Problem Scenario (Old Code):
```
Original CSS:
1: .button { color: red; }
2: .header { margin: 0; }
3: .button { padding: 10px; }
4: .header { font-size: 14px; }

Groups:
- .button (lines 1, 3)
- .header (lines 2, 4)

Process .button group:
  - sourceLines modified, lines renumbered
  
Process .header group:
  - loc values still say lines 2, 4
  - But due to .button edits, line numbers shifted!
  - Header edits fail or hit wrong lines ❌
```

### Solution (New Code):
```
Original CSS: [same as above]

Compute ALL patches FIRST:
- .button patch: remove line 3, insert at line 1
- .header patch: remove line 4, insert at line 2

Sort descending (max line):
1. .header (max line 4)
2. .button (max line 3)

Apply .header patch first:
  - Remove line 4 (does NOT shift line 3 or earlier)
  - Insert at line 2
  
Apply .button patch:
  - Remove line 3 (still valid, .header edits were above)
  - Insert at line 1 (still valid)
  
Result: Both selectors merged correctly ✅
```

---

## Technical Details

### Line Number Conversion
The code correctly handles 1-based (from CST AST) → 0-based (array index):
```javascript
// AST loc: 1-based (line 1 = first line)
// Array idx: 0-based (index 0 = first line)

const startLineIdx = rule.loc.startLine - 1  // Convert 1-based to 0-based
const endLineIdx = rule.loc.endLine - 1      // Inclusive in both systems
```

### Indentation Detection
```javascript
// Scan the first rule to detect indentation
for (let i = firstRule.loc.startLine - 1; i < firstRule.loc.endLine; i++) {
  const line = sourceLines[i]
  if (line && !line.includes('{') && !line.includes('}') && line.trim()) {
    const match = line.match(/^(\s+)/)
    if (match) {
      insertIndent = match[1]  // e.g., "  " or "\t"
      break
    }
  }
}

// Use detected indent when adding new properties
propsToAdd.forEach(prop => {
  newLines.push(`${insertIndent}${prop.property}: ${prop.value};`)
})
```

### Multiple Patches Coordination
When removing lines within a patch, we also track cumulative offsets:
```javascript
// removedCountBefore accounts for this patch's own removals
const removedCountBefore = linesToRemoveArray.filter(idx => idx < insertAtLineIdx).length
const adjustedInsertAtLineIdx = insertAtLineIdx - removedCountBefore
```

Note: Since patches are applied bottom-to-top, earlier patches have already modified sourceLines, so indices below the current patch are still valid.

---

## Testing Strategy

### Minimal Test
```javascript
const css = `
.button { color: red; }
.button { padding: 10px; }
.header { margin: 0; }
.header { font-size: 14px; }
`

const rulesTree = [
  { selector: '.button', declarations: [ ... ], loc: { startLine: 1, endLine: 1 }, ... },
  { selector: '.button', declarations: [ ... ], loc: { startLine: 2, endLine: 2 }, ... },
  { selector: '.header', declarations: [ ... ], loc: { startLine: 3, endLine: 3 }, ... },
  { selector: '.header', declarations: [ ... ], loc: { startLine: 4, endLine: 4 }, ... },
]

const mergeableGroups = findAllMergeableGroups(rulesTree)
// Should find 2 groups

const mergeInfo = { mergeGroups: mergeableGroups }
const result = applyMergeToSourceText(css, rulesTree, mergeInfo)

// Both .button and .header should be merged
console.assert(result.match(/\.button/g).length === 1, 'Two .button rules should merge to one')
console.assert(result.match(/\.header/g).length === 1, 'Two .header rules should merge to one')
```

### Verification Checklist
- [ ] No "skipped" rules in multi-group merges
- [ ] Properties correctly consolidated
- [ ] Indentation preserved
- [ ] Blank line cleanup works
- [ ] Comments handled (don't break parse)
- [ ] Scoped CSS (with `.pwt-markdown-preview` prefix) works

---

## Remaining Considerations

### What This Fix Does NOT Address (These are "Harder Problems")

#### 1. **!important flags** (Kyle mentioned)
Current code doesn't account for `!important` when determining "last declaration wins":
```css
.button { color: red !important; }
.button { color: blue; }  /* This doesn't override due to !important */
```

The merge assumes last value wins, which is wrong if !important is involved.

**Fix Needed**: Track `important` flag on each declaration and use cascade rules correctly.

#### 2. **Shorthand vs longhand properties**
```css
.button { margin: 10px; }
.button { margin-left: 0; }  /* Conflicts with shorthand */
```

Simple deduplication isn't safe here.

**Fix Needed**: Use proper CSS cascade resolution (or switch to full AST merge).

#### 3. **Multiple selectors in one rule**
```css
.button, .btn { color: red; }
.button, .btn { padding: 10px; }  /* Same as above, but formatted differently */
```

Current code uses raw selector text which might not match.

**Fix Needed**: Normalize selector text or use selector AST for comparison.

#### 4. **Nested at-rules** (currently not merged, by design)
The code only merges top-level rules, intentionally skipping rules inside `@media`, `@supports`, etc.

This is correct behavior (don't merge across scope boundaries).

---

## Files Modified

- **`lib/tools/mergeSelectors.js`**: 
  - Rewrote `applyMergeToSourceText()` to use patch system
  - Changed from forward-order + inline modifications to compute-then-apply-descending approach
  - Line counts: ~260-410 (original), still ~260-410 (new - similar size, better structure)

---

## Deployment Notes

### What Tests to Run
1. Test Case 1: Two different duplicated selectors
2. Test Case 2: Three occurrences of same selector
3. Test Case 3: Interleaved duplicates
4. Test Case 4: With blank lines/comments
5. Test Case 5: Scoped CSS from markdown preview

### Breaking Changes
- None. API is unchanged.
- Output CSS is logically equivalent but may have properties in slightly different order.
- This is acceptable because "Apply Merge" already modifies the user's CSS.

### Performance Impact
- Negligible. O(n) pass to compute patches + O(n) pass to apply patches = still O(n).
- Actually slightly faster: compute once instead of N iterations of rebuild.

---

## How to Verify the Fix Works

In the Web Playground tool:

1. Enter CSS with multiple duplicate selectors:
   ```css
   .button { color: red; }
   .header { margin: 0; }
   .button { padding: 10px; }
   .header { font-size: 14px; }
   ```

2. Open Rules tab → should see "🧩 Merge All (2)" button

3. Click "🧩 Merge All" → modal opens

4. Confirm merge

5. **✅ Expected**: Both `.button` and `.header` rules are merged
   ```css
   .button { color: red; padding: 10px; }
   .header { margin: 0; font-size: 14px; }
   ```

6. **❌ Old bug**: Only one group merges, the other is skipped

---

## Next Steps

### Immediate (Use Current Fix)
- Deploy the patch system fix
- Run Test Cases 1-5 to verify
- Monitor for reports of skipped rules

### Future (Long-term)
Consider migrating to **Approach A** (full AST merge):
1. Parse CSS into AST
2. Merge nodes in AST (properly handles !important, shorthand, etc.)
3. Regenerate CSS from AST
4. Optionally beautify

**Pros**:
- Completely robust
- Handles !important correctly
- Handles shorthand vs longhand
- Formatting-independent

**Cons**:
- Output formatting changes
- Requires more refactoring
- But: can beautify after merge, so not a real downside

---

## Reference

Kyle's Original Analysis:
> "You're applying edits using positions that are no longer valid after earlier edits."
> "Apply patches from bottom to top (descending source position)"

This fix implements exactly that recommendation.
