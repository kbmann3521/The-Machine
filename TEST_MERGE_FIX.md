# CSS Merge Selectors - Patch System Fix Test Cases

## The Bug That Was Fixed

**Old Problem**: `applyMergeToSourceText()` modified `sourceLines` **inside the loop**, invalidating all subsequent line numbers for later merge groups. This caused "later duplicates get skipped" symptoms.

**Old Code**:
```javascript
for (const group of mergeGroups) {
  // ... compute edits ...
  // Update sourceLines for next iteration ❌ INVALIDATES LATER LOC VALUES
  sourceLines.length = 0
  sourceLines.push(...newSourceLines)
}
```

**New Solution**: Patch system - compute all edits first, apply them in **descending order** (bottom to top) so earlier edits don't shift later offsets.

---

## Test Case 1: Two Duplicate Selectors (Both Should Merge)

### Input CSS:
```css
.button {
  color: red;
  padding: 10px;
}

.header {
  font-size: 14px;
}

.button {
  background: blue;
}

.header {
  margin: 0;
}
```

### Expected Output:
```css
.button {
  color: red;
  padding: 10px;
  background: blue;
}

.header {
  font-size: 14px;
  margin: 0;
}
```

### What Should Happen:
1. **Detect**: findAllMergeableGroups finds:
   - `.button` group (2 occurrences)
   - `.header` group (2 occurrences)

2. **Create Patches** (in descending order by line number):
   - Patch 1: Remove line 12 (`.header { margin: 0; }`), insert `margin: 0;` at line 8
   - Patch 2: Remove line 9 (`.button { background: blue; }`), insert `background: blue;` at line 3

3. **Apply Patches** (bottom-to-top):
   - Apply Patch 1 first (higher line number) → Remove line 12, update line 8
   - Apply Patch 2 second (lower line number) → Remove line 9, update line 3

### ✅ Both selectors should be merged (NOT skipped)

---

## Test Case 2: Three Duplicate Selectors in Sequence

### Input CSS:
```css
.card { color: red; }
.card { padding: 5px; }
.card { margin: 10px; }
```

### Expected Output:
```css
.card { color: red; padding: 5px; margin: 10px; }
```

### What Should Happen:
1. **Detect**: `.card` group (3 occurrences, lines 1, 2, 3)
2. **Create Patch**:
   - Remove lines 2 and 3
   - Insert `padding: 5px;` and `margin: 10px;` at line 1

3. **Apply Patch**:
   - Remove line 3 first (descending order)
   - Remove line 2 (this is now valid because we removed line 3 first)
   - Insert at line 1 (adjusted for removed lines)

### ✅ All three should merge into one rule

---

## Test Case 3: Interleaved Duplicates (Tricky!)

### Input CSS:
```css
.button { color: red; }      /* line 1 */
.header { margin: 0; }       /* line 2 */
.button { padding: 10px; }   /* line 3 */
.header { font-size: 14px; } /* line 4 */
```

### Expected Output:
```css
.button { color: red; padding: 10px; }
.header { margin: 0; font-size: 14px; }
```

### What Should Happen:
1. **Detect**:
   - `.button` (lines 1, 3)
   - `.header` (lines 2, 4)

2. **Create Patches** (descending):
   - Patch 1: .header - remove line 4, add `font-size: 14px;` at line 2
   - Patch 2: .button - remove line 3, add `padding: 10px;` at line 1

3. **Apply**:
   - Apply .header first (higher max line) → sourceLines[3] removed, sourceLines[1] updated
   - Apply .button second (lower max line) → sourceLines[2] removed, sourceLines[0] updated

### ✅ Both should work correctly (no skipping)

---

## Test Case 4: With Blank Lines and Comments

### Input CSS:
```css
.button {
  color: red;
}

/* Style for buttons */
.button {
  padding: 10px;
}
```

### Expected Output:
```css
.button {
  color: red;
  padding: 10px;
}
```

### What Should Happen:
- Duplicate rule span is lines 6-8
- Insert at closing brace (line 3)
- After merge and blank line cleanup, should have no orphaned blank lines or comments

### ✅ Blank lines and comments should be handled correctly

---

## Test Case 5: Scoped CSS (from Markdown Preview)

### Input CSS (Scoped):
```css
.pwt-markdown-preview .button {
  color: red;
  padding: 10px;
}

.pwt-markdown-preview .button {
  font-size: 14px;
}
```

### Expected Behavior:
1. MergeSelectorConfirmation detects `.pwt-markdown-preview` prefix
2. It calls `serializeRulesToCSS(rulesTree)` to get unscoped CSS
3. Merge happens on unscoped version
4. Result is unscoped CSS (scoping will be reapplied later)

### ✅ Scoping should be stripped before merge

---

## Verification Checklist

Use this checklist when testing the fix:

- [ ] Test Case 1 passes (two selector groups merge correctly)
- [ ] Test Case 2 passes (three duplicates of same selector)
- [ ] Test Case 3 passes (interleaved selectors don't interfere)
- [ ] Test Case 4 passes (blank lines/comments handled)
- [ ] Test Case 5 passes (scoped CSS)
- [ ] No "skipped" duplicates in any test
- [ ] Output CSS is valid and maintains cascade semantics
- [ ] Indentation is preserved from original
- [ ] New properties appear before closing brace

---

## How to Debug if Still Failing

If "later duplicates still get skipped":

1. **Check patch sorting**:
   ```javascript
   console.log('Patches sorted by line number:')
   patches.forEach((p, idx) => {
     const maxLine = Math.max(...p.duplicateLineRanges.map(r => r.endLineIdx))
     console.log(`  ${idx}: max line ${maxLine}`)
   })
   ```
   
   Should be in DESCENDING order.

2. **Check line removals**:
   ```javascript
   console.log('Removing lines:', linesToRemoveArray)
   console.log('Before removal:', sourceLines.length)
   // [remove lines]
   console.log('After removal:', sourceLines.length)
   ```

3. **Check insertion**:
   ```javascript
   console.log('Adjusted insert index:', adjustedInsertAtLineIdx)
   console.log('Removed before insert:', removedCountBefore)
   console.log('Line to insert at:', sourceLines[adjustedInsertAtLineIdx])
   ```

4. **Verify final CSS**:
   ```javascript
   const final = result.join('\n').trim()
   console.log('Final CSS:\n', final)
   ```
   
   Manually verify all duplicates were merged.

---

## Expected Results After Fix

- ✅ Multiple mergeable groups all get merged (not skipped)
- ✅ Line number offsets correctly adjusted after each patch
- ✅ Properties correctly inserted
- ✅ Blank line cleanup works
- ✅ Scoped CSS handled correctly
- ✅ Output CSS is valid and readable
