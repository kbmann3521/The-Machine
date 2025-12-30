# YAML Formatter: Complete Architecture & Pipeline Analysis

## Current Data Flow

```
User Input (YAML text)
    ↓
yamlFormatter(text, config)
    ↓
    ├─→ STEP 1: yamlValidate(processingText)
    │   ├─→ Split text into sourceLines[]
    │   ├─→ Parse with yaml.parseDocument() or yaml.parse()
    │   ├─→ Extract error objects from parser
    │   ├─→ For each error:
    │   │   ├─→ Call normalizeYamlErrorPosition(err, sourceLines)
    │   │   │   ├─→ Extract line/column from err
    │   │   │   ├─→ Refine position using source text analysis
    │   │   │   └─→ Return { line, column, columnEnd }
    │   │   ├─→ Clean error message
    │   │   └─→ Return { line, column, columnEnd, message }
    │   └─→ Return { valid: false, errors: [...] } or "Valid YAML syntax"
    ↓
    ├─→ STEP 2: Apply formatting (beautify/minify/convert)
    ├─→ STEP 3: Build diagnostics array from validation result
    └─→ STEP 4: Perform linting if YAML is valid
        ↓
        Return { diagnostics, formatted, isWellFormed, hideOutput }
        ↓
        ToolOutputPanel → renderYamlFormatterOutput()
        ├─→ Display OUTPUT tab (if !hideOutput)
        ├─→ Display VALIDATION tab with error details
        │   ├─→ renderValidationErrorsUnified()
        │   ├─→ For each error: "Line X, Column Y" + message
        │   └─→ Line/Column come directly from diagnostic.line/column
        └─→ Display LINTING tab (if showLinting && isWellFormed)
```

## The Problem: Line Number Mismatch

### Input YAML (as you've provided):
```
1: # Application configuration
2: app:
3:   name: My Application
4:   version: 1.0.0
5: (blank)
6: server:
7:   host: localhost
8:   port:3000          ← THE ACTUAL PROBLEM
9:   environment: development
```

### Current Issue:
- **Displayed**: "Line 7, Column 1"
- **Should be**: "Line 8, Column 3" (pointing to `port`)
- **Root cause**: The error position refinement logic is decrementing the line number when it shouldn't

## Code Pipeline: Where Errors Are Extracted

### 1. **yaml.parseDocument() error extraction** (lines 610-635 in yamlFormatter.js)
```javascript
if (doc.errors && doc.errors.length > 0) {
  const errors = doc.errors.map(err => {
    const pos = normalizeYamlErrorPosition(err, sourceLines)  // ← REFINEMENT HAPPENS HERE
    // ...
    return { line: pos.line, column: pos.column, columnEnd: pos.columnEnd, message }
  })
}
```

### 2. **normalizeYamlErrorPosition() function** (lines 461-593 in yamlFormatter.js)
This function:
- Extracts initial line/column from `err` object (various formats)
- **Attempts to refine** the position by checking source lines for patterns
- Returns the refined position

**Current refinement logic** (lines 525-581):
- Checks if message includes "Implicit"
- Looks for the pattern `(\w+):(\S+)` (e.g., `port:3000`) on the reported line
- If not found, checks the **previous line** (`line - 1`)
- If found, updates `line = problemLineNum` and recalculates column/columnEnd
- **Issue**: Might be updating to the wrong line

### 3. **Diagnostic normalization** (lines 224-260 in yamlFormatter.js)
```javascript
// Takes the refined positions from yamlValidate() and ensures they're valid numbers
diagnostics.push(...validationResult.errors.map(e => ({
  type: 'error',
  category: 'syntax',
  message: e.message,
  line: Math.max(1, Math.floor(e.line)),        // Final line
  column: Math.max(1, Math.floor(e.column)),    // Final column
  columnEnd: Math.max(e.column + 1, Math.floor(e.columnEnd))
})))
```

### 4. **Rendering** (components/ToolOutputPanel.js, lines 67-107)
```javascript
{error.line !== null && error.column !== null
  ? `Line ${error.line}, Column ${error.column}`
  : 'General Error'}
```

## The Problem: Error Position Refinement Logic

The issue is in the **normalizeYamlErrorPosition()** function, specifically:

```javascript
// Checks both reported line AND previous line for the problem
if (!problemLine && line > 1 && sourceLines[line - 2]) {
  const prevLineText = sourceLines[line - 2]
  // ... finds problem
  if (found) {
    line = line - 1  // Updates line to previous line
  }
}
```

**The bug**: When checking "previous line", we use `sourceLines[line - 2]` (which is correct for 0-indexed array), but the line number we extract and update might be off by one.

### Example with actual array indices:
```
sourceLines[0] = "# Application configuration"  (displayed as line 1)
sourceLines[1] = "app:"                         (displayed as line 2)
...
sourceLines[6] = "  host: localhost"            (displayed as line 7)
sourceLines[7] = "  port:3000"                  (displayed as line 8) ← ACTUAL PROBLEM
sourceLines[8] = "  environment: development"   (displayed as line 9) ← PARSER REPORTS HERE
```

If parser reports error at line 9:
- `line = 9`
- Check `sourceLines[9 - 1] = sourceLines[8]` → "  environment: development" (doesn't match)
- Check `sourceLines[9 - 2] = sourceLines[7]` → "  port:3000" (MATCHES!)
- Update `line = 9 - 1 = 8` ✓ CORRECT

But screenshot shows line 7, which suggests:
- Either parser reported at line 8, and we subtracted 1 again
- Or the array indexing is off
- Or the yaml library is using a different line numbering system

## What We Need To Debug:

1. **What line number does the yaml parser actually return?**
   - Add console logging to yamlValidate() to see `err.linePos` or `err.line`
   
2. **What are the source line indices?**
   - Log `sourceLines` array with indices to verify 0-indexing
   
3. **Is the yaml library using 0-based or 1-based line numbers?**
   - Most tools use 1-based for display, but internal representation varies

## Recommended Fix Strategy:

Instead of trying to be clever with line adjustment, we should:

1. **Accept the parser's line number as source of truth**
2. **Only adjust COLUMN position** (which is where the token actually starts)
3. **Don't auto-adjust the line number** unless absolutely certain it's wrong
4. **Trust that position refinement** should only improve column accuracy, not line accuracy

This means:
- Keep the line number from the parser (it knows better than us)
- Use regex refinement ONLY to find the exact column where the bad token starts
- Don't try to "move up to the previous line" because the parser made that decision for a reason
