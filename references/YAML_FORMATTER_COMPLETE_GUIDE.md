# YAML Formatter: Complete Architecture & Pipeline Explanation

## 🏗️ System Overview

The YAML Formatter is a **sophisticated AST-based document transformation system** that validates, beautifies, minifies, and converts YAML files. It's designed to work like professional IDEs (VS Code, IntelliJ), with precise error reporting and real-time linting.

### Core Philosophy:
```
Input YAML → Validate (AST Parse) → Transform (Beautify/Minify/Convert) 
  → Lint (Style Check) → Output + Diagnostics → UI Display
```

---

## 🔄 The Complete Pipeline (Step-by-Step)

### **ENTRY POINT: `yamlFormatter(text, config)`**
Located in: `lib/tools/yamlFormatter.js:160`

```javascript
function yamlFormatter(text, config) {
  // text = raw YAML string from user
  // config = { mode, indentSize, showLinting, removeComments, showValidation }
}
```

**This is the main orchestrator that:**
1. Pre-processes the input (tabs → spaces)
2. Calls validation
3. Applies formatting
4. Performs linting
5. Returns formatted output + diagnostics

---

## 📋 STEP 1: PRE-PROCESSING

### Location: Lines 173-179

```javascript
// Auto-convert tabs to spaces (consistent indentation)
processingText = processingText.replace(/\t/g, ' '.repeat(indentSize))

// Optional: Remove all comments if user selected
if (removeComments) {
  processingText = yamlRemoveComments(processingText)
}
```

**What happens:**
- Tab characters → spaces (YAML requires spaces, not tabs)
- Optionally strips all `#` comments
- Result stored in `processingText` for downstream steps

**Why:** YAML is whitespace-sensitive. Normalizing tabs prevents parsing errors.

---

## ✅ STEP 2: VALIDATION (The Core Logic)

### Location: Lines 181-186

```javascript
const validationResult = yamlValidate(processingText)
const isWellFormed = typeof validationResult === 'string'
```

### What is `yamlValidate()`?

**Function signature:** `yamlValidate(text) → { valid: boolean, errors: Array } | "Valid YAML syntax"`

**Flow inside yamlValidate():**

```
Input: YAML text
  ↓
1. Split into lines: sourceLines = text.split('\n')
  ↓
2. Initialize yaml parser (tries 'yaml' library, fallback to 'js-yaml')
  ↓
3. Parse document: yaml.parseDocument(text, options)
  ↓
4. Check for errors: if (doc.errors && doc.errors.length > 0)
  ↓
5. For each error:
   a. Extract position: normalizeYamlErrorPosition(err, sourceLines)
   b. Clean message: remove code snippets, keep first line only
   c. Build error object: { line, column, columnEnd, message }
  ↓
6. Return:
   - If errors found: { valid: false, errors: [...] }
   - If valid: "Valid YAML syntax" (just a string)
```

### **CRITICAL FUNCTION: `normalizeYamlErrorPosition(err, sourceLines)`**

**Purpose:** Convert parser error objects into standardized format

**Input:** 
- `err` = raw error object from yaml parser (format varies!)
- `sourceLines` = array of text lines (for context)

**Process:**

```javascript
// 1. Extract initial line/column from error (multiple possible formats)
if (Array.isArray(err.linePos)) {
  line = err.linePos[0]  // Format: [line, col]
  column = err.linePos[1]
} else if (err.line?.line !== undefined) {
  line = err.line.line    // Format: { line: 9, col: 3 }
  column = err.line.col
} else if (typeof err.line === 'number') {
  line = err.line         // Format: just a number
  column = err.column || 1
}

// 2. Validate extracted values (no NaN, undefined, etc.)
if (!line || isNaN(line)) line = 1
if (!column || isNaN(column)) column = 1

// 3. REFINE COLUMN POSITION (only column, NEVER line)
// Look at the actual source line to find the problematic token
if (err.message && sourceLines[line - 1]) {
  const lineText = sourceLines[line - 1]
  
  if (err.message.includes('Implicit')) {
    // Look for pattern: "key:value" (missing space)
    const match = lineText.match(/(\w+):(\S+)/)
    if (match) {
      column = match.index + 1      // Point to the 'k' in key
      columnEnd = match.index + match[0].length + 1  // Include all of "key:value"
    }
  }
}

// 4. Ensure all are integers and return
return {
  line: Math.max(1, Math.floor(line)),
  column: Math.max(1, Math.floor(column)),
  columnEnd: Math.max(column + 1, Math.floor(columnEnd))
}
```

**Example:**
```
Input YAML line 8: "  port:3000"
Parser says: error at line 8, column 1
normalizeYamlErrorPosition() refines to:
  → line: 8 (unchanged, parser is correct)
  → column: 3 (points to 'p' in 'port')
  → columnEnd: 12 (after '0' in '3000')
```

---

## 🎨 STEP 3: FORMATTING (Mode-Specific)

### Location: Lines 188-213

```javascript
switch (mode) {
  case 'beautify':
    formatted = yamlBeautify(processingText, indentSize)
  case 'minify':
    formatted = yamlMinify(processingText)
  case 'to-json':
    formatted = yamlToJson(processingText)
  case 'to-toml':
    formatted = yamlToToml(processingText)
  // ... etc
}
```

### Each Mode Does Something Different:

#### **`beautify(text, indentSize)`**
- Parse with `yaml.parseDocument()`
- Stringify with options: `{ indent: indentSize, lineWidth: 0 }`
- Result: Pretty-printed, readable YAML

#### **`minify(text)`**
- Parse document
- Stringify with compact settings
- Remove blank lines and comments
- Result: Compressed but valid YAML

#### **`to-json(text)`**
- Parse YAML to JS object
- `JSON.stringify(parsed, null, 2)`
- Result: JSON equivalent

#### **`to-toml(text)`**
- Parse YAML to JS object
- Convert to TOML string
- Result: TOML format

#### **`to-env(text)`**
- Parse YAML to JS object
- Flatten keys with `_` separators
- Result: `.env` format (KEY=value)

---

## 🔍 STEP 4: BUILD DIAGNOSTICS ARRAY

### Location: Lines 217-261

After validation, we normalize and consolidate all errors into a standardized diagnostic format:

```javascript
const diagnostics = []

// Add validation errors (from yamlValidate)
if (!isWellFormed && validationResult.errors) {
  diagnostics.push(...validationResult.errors.map(e => ({
    type: 'error',
    category: 'syntax',
    message: e.message,
    line: e.line,           // Now guaranteed to be a valid integer
    column: e.column,       // Now guaranteed to be a valid integer
    columnEnd: e.columnEnd  // Optional, for precise underline span
  })))
}
```

**Why this step?**
- Ensures all diagnostics have consistent structure
- Validates that line/column are numbers (not objects or strings)
- Prepares data for editor display

---

## 📝 STEP 5: LINTING (Optional Style Checks)

### Location: Lines 263-292

```javascript
if (showLinting && isWellFormed) {
  const warnings = performStyleLinting(processingText)
  diagnostics.push(...warnings.map(w => ({
    type: 'warning',
    category: 'lint',
    message: w.message,
    line: w.line,
    column: w.column
  })))
}
```

### What `performStyleLinting()` checks:

1. **Trailing whitespace** - spaces at end of lines
2. **Indentation consistency** - multiples of 2 or 4
3. **Spacing around colons** - single space after colon, no spaces before
4. **Array item formatting** - space after hyphen
5. **Multiple spaces** - between key and value

---

## 📊 STEP 6: RETURN RESULT OBJECT

### Location: Lines 294-296

```javascript
result.diagnostics = diagnostics     // All errors + warnings
result.hideOutput = !isWellFormed    // Don't show output if invalid
result.isWellFormed = isWellFormed   // Was validation successful?
result.showValidation = true         // Display validation tab
result.showLinting = showLinting     // Display linting tab
result.formatted = formatted         // The output text

return result
```

---

## 🎯 COMPLETE RETURN VALUE STRUCTURE

```javascript
{
  // Core results
  formatted: string,                  // The output (beautified/minified/converted)
  isWellFormed: boolean,              // Did validation pass?
  hideOutput: boolean,                // Show output only if no errors
  
  // Diagnostics for editor display
  diagnostics: [
    {
      type: 'error' | 'warning',
      category: 'syntax' | 'lint',
      message: string,
      line: number,                   // 1-based
      column: number,                 // 1-based
      columnEnd?: number              // Optional, for precise highlight
    },
    // ...more errors
  ],
  
  // UI flags
  showValidation: boolean,            // Display validation tab?
  showLinting: boolean                // Display linting tab?
}
```

---

## 🖥️ STEP 7: UI CONSUMPTION (ToolOutputPanel)

### Location: `components/ToolOutputPanel.js:2105-2230`

The result object is passed to `renderYamlFormatterOutput()` which:

```javascript
// 1. Display OUTPUT tab (if !hideOutput and formatted exists)
if (!hideOutput && formatted) {
  tabs.push({
    id: 'output',
    label: 'Output',
    content: formatted,
    contentType: 'code'
  })
}

// 2. Display VALIDATION tab
if (diagnostics) {
  const validationErrors = diagnostics.filter(d => d.type === 'error')
  
  if (validationErrors.length > 0) {
    // For each error, display:
    // "Line {error.line}, Column {error.column}"
    // {error.message}
  }
}

// 3. Display LINTING tab
if (showLinting) {
  const lintingWarnings = diagnostics.filter(d => d.type === 'warning')
  // Same rendering as validation
}
```

---

## 🎨 EDITOR INTEGRATION (CodeMirror)

### Location: `lib/codemirrorLinting.js`

The diagnostics are consumed by CodeMirror's linting system:

```javascript
export function createFormatterLinter(diagnosticsArray) {
  return linter((view) => {
    const cmDiagnostics = []
    
    for (const d of diagnosticsArray) {
      // Convert line/column to document offset (CodeMirror uses flat offsets)
      const from = lineColToOffset(view.state, d.line, d.column)
      
      // Determine underline end position
      let to
      if (d.columnEnd) {
        // Use precise column end from YAML validator
        to = lineColToOffset(view.state, d.line, d.columnEnd)
      } else {
        // Expand to word boundaries for other validators
        to = expandToWord(view.state, from).to
      }
      
      // Add CodeMirror diagnostic
      cmDiagnostics.push({
        from: from,
        to: to,
        severity: d.type === 'error' ? 'error' : 'warning',
        message: d.message
      })
    }
    
    return cmDiagnostics
  })
}
```

**What this does:**
- Converts 1-based line/column → 0-based document offset
- Creates red squiggly underlines in the editor
- Shows error message on hover

---

## 📈 Complete Data Flow Example

### User enters:
```yaml
# Application
app:
  name: My App
  version: 1.0.0

server:
  host: localhost
  port:3000
  env: dev
```

### Pipeline execution:

1. **Pre-process:** Tab → space conversion (none here)

2. **Validate:**
   - `yaml.parseDocument()` detects error at line 9 ("env: dev")
   - Parser says: "Implicit keys need to be on a single line at line 9, column 1"
   - `normalizeYamlErrorPosition()` examines line 8: "  port:3000"
   - Finds pattern `port:3000`, refines to column 3
   - Returns: `{ line: 8, column: 3, columnEnd: 12 }`

3. **Format:**
   - Attempted, but suppressed because `isWellFormed = false`

4. **Linting:**
   - Skipped because YAML is invalid

5. **Diagnostics:**
   ```javascript
   [
     {
       type: 'error',
       category: 'syntax',
       message: 'Implicit keys need to be on a single line',
       line: 8,
       column: 3,
       columnEnd: 12
     }
   ]
   ```

6. **UI Display:**
   - OUTPUT tab: Hidden
   - VALIDATION tab: Shows "Line 8, Column 3" + error message
   - Editor: Red squiggle under "port:3000"

---

## 🔧 Key Design Decisions

### 1. **AST-Based (not regex-based)**
- Respects YAML semantics and structure
- Preserves comments and formatting intent
- Handles nested objects, arrays, scalars correctly

### 2. **Error Position Refinement**
- Parser's line number is **trusted as authoritative**
- Only the column is refined using regex analysis
- Prevents off-by-one errors from over-clever logic

### 3. **Diagnostic Normalization**
- All position data converted to integers before storage
- Prevents `[object Object]` or `NaN` in UI
- Ensures editor can render correctly

### 4. **Dual Validation Path**
- Primary: `yaml.parseDocument()` (eemeli/yaml) - best error messages
- Fallback: `yaml.parse()` or js-yaml - if primary fails
- Graceful degradation if parser unavailable

### 5. **Conditional Linting**
- Only runs if YAML is valid (prevents cascading errors)
- Checks 8 specific style rules
- Returns warnings (not errors) to help users improve code quality

---

## 🚀 Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Parse document | O(n) | n = length of YAML text |
| Validation | O(n) | AST creation + error extraction |
| Beautification | O(n) | Stringify with options |
| Minification | O(n) | Stringify + filter lines |
| Conversion (YAML→JSON) | O(n) | Parse + stringify |
| Linting | O(n) | Line-by-line regex checks |

**Total time:** Typically 5-50ms for reasonable YAML documents (< 100KB)

---

## 📚 Summary

The YAML Formatter is a **multi-stage document transformation pipeline** that:

1. ✅ **Validates** YAML syntax with precise error reporting
2. ✅ **Transforms** content (beautify, minify, convert formats)
3. ✅ **Lints** style issues when YAML is valid
4. ✅ **Integrates** with CodeMirror for real-time feedback
5. ✅ **Displays** errors/warnings with IDE-grade precision

All components work together to provide a professional editing experience similar to VS Code or IntelliJ IDEA.
