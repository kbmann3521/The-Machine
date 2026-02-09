# Phase 5 Mapping Layer (A) — SyntheticNode Implementation (Corrected State Model)

## Status: ✅ COMPLETE (Revised)

The formal mapping layer is now in place. Phase 5 is **contractually** deterministic and explainable.

---

## What Was Added

### SyntheticNode Type (Internal Contract) — CORRECTED

**KEY CHANGE: Pseudo-selectors now collapse into state layers, not separate nodes.**

```typescript
type SyntheticNode = {
  id: string                          // stable, deterministic (node-{baseSelector})
  baseSelector: string                // ".button" (NO pseudo-classes)
  tag: 'div' | 'button' | 'header'   // inferred tag from baseSelector
  className: string                  // cleaned selector (no dots/hashes)
  states: {
    base: {
      ruleIndex: number               // position in rulesTree
      declarations: string[]          // ["color", "background-color"]
      loc: { startLine: number, endLine: number }
    },
    hover?: { ruleIndex, declarations, loc },
    focus?: { ruleIndex, declarations, loc },
    active?: { ruleIndex, declarations, loc },
    // ... other pseudo-classes as needed
  }
  loc: { startLine: number, endLine: number }  // source location (base rule)
}
```

**Invariant:** One `baseSelector` = exactly one `SyntheticNode`. Pseudo-classes never create new nodes; they become state layers.

### New API Signature

**Before:**
```javascript
const { rootElement, elementMap, count } = generateSyntheticDom(rulesTree)
```

**After:**
```javascript
const { nodes, html, elementCount } = generateSyntheticDom(rulesTree)
const nodeMapping = getSyntheticNodeMapping(nodes)
```

### Generated HTML Structure

Each synthetic element now includes data attributes for traceability:

```html
<div class="preview-root">
  <div class="button" 
       id="element-node-0-button"
       data-synthetic-node="node-0-button"
       data-selector=".button"
       data-rule-index="0">
    .button
  </div>
</div>
```

---

## Files Modified

1. **lib/tools/syntheticDom.js**
   - Refactored `generateSyntheticDom()` to emit SyntheticNode[]
   - Added `buildDomFromNodes()` for backwards compatibility
   - Added `getSyntheticNodeMapping()` for Phase 6 lookups
   - Now returns `{ nodes, html, elementCount }`

2. **components/CSSPreview.js**
   - Updated to use new API
   - Wires node mapping to iframe for future use
   - Stores `iframe._syntheticNodeMapping` for Phase 6 access

---

## Guarantees (Phase 5 Discipline)

✅ **1 baseSelector = 1 synthetic node** (pseudo-classes collapse into states, never separate nodes)
✅ **Deterministic ID generation** (same input = same IDs)
✅ **State layers** (base, hover, focus, active as state variants, not elements)
✅ **Explicit ruleIndex tracking** (links back to rulesTree)
✅ **Source location preserved** (for future highlighting)
✅ **Declarations recorded** (for impact analysis)
✅ **Native hover enabled** (browser's :hover works naturally on preview elements)
✅ **Forced states available** (buttons force states for debugging/touch devices)
✅ **No DOM mutation** (read-only)
✅ **No real HTML semantics** (safe defaults only)

---

## What This Enables (Downstream)

### Phase 6: Visual Editing
- Click element → highlight rule
- Modify declaration → update preview
- Undo → revert instantly

### Phase 7: Impact Analysis
- "Which elements use this property?"
- "Change this rule → affects X elements"
- "Remove this selector → X elements lose styling"

### Debug/Inspection
- Hover element → show which rule controls it
- Show specificity chain
- Trace variable resolution

---

## Pseudo-State Interaction Model (Corrected)

### How Hover Works Now ✅

**Before (Wrong):** Extra button required to see `:hover`
```
.button → element A
.button:hover → element B (separate element!)
User clicks button → toggle between A and B
```

**After (Correct):** Native hover + forced states
```
.button / .button:hover → single element
Native hover: Browser applies :hover on mouseover automatically
Forced state: Button adds .pseudo-hover class for inspection/touch devices
```

### User Interaction Flow

1. **Natural hover** (default, no action needed)
   - Move mouse over preview element
   - Browser applies native `:hover` styles automatically
   - User sees effect immediately

2. **Forced state** (advanced, for debugging)
   - Click "Force :hover" button
   - Adds `.pseudo-hover` class to all interactive elements
   - Locks state for inspection (useful on touch devices)
   - Useful when you want to see state without hovering

### CSS Cascade (Priority Order)

```css
/* Base styles */
.button { color: blue; }

/* Native hover (works automatically) */
.button:hover { color: green; }

/* Forced state (for inspection/forcing) */
.button.pseudo-hover { color: green; }
```

When both are present:
- Native `:hover` applies on mouseover (priority: browser)
- `.pseudo-hover` class applies when forced (priority: applied class)
- User sees effect immediately

---

## What This Does NOT Do (Phase 5 Discipline)

❌ No pseudo-class creates separate elements
❌ No editing in preview
❌ No dragging or moving elements
❌ No changing rule order
❌ No inferring DOM nesting
❌ No mutation of source CSS
❌ No new selectors invented

This separation keeps Phase 5 safe and boundaries clear.

---

## Implementation Notes

### ID Generation
```javascript
const generateNodeId = (selector, ruleIndex) => {
  return `node-${ruleIndex}-${selector.replace(/[^a-z0-9]/gi, '-')}`
}
```

**Why deterministic?** Same rulesTree always produces same node IDs. Enables caching, comparison, diffs.

### Mapping Context
```javascript
const mapping = getSyntheticNodeMapping(nodes)
// mapping.byId: Map<nodeId, SyntheticNode>
// mapping.bySelector: Map<selector, SyntheticNode>
// mapping.all: SyntheticNode[]
```

Stored on iframe for Phase 6 access without re-generating.

---

## Testing Phase 5(A)

To verify the mapping layer:

1. **Determinism Test**: Generate same CSS twice → same node IDs
2. **Traceability Test**: Node ruleIndex matches position in rulesTree
3. **Completeness Test**: Every rule gets exactly one node (up to maxElements limit)
4. **HTML Test**: All data attributes present in generated HTML

---

## Next Steps (B → C → D)

**B) Preview CSS Builder Hardening**
- Formalize CSS pipeline function
- Explicit isolation contract

**C) Variable Override Pipeline**
- Stub: wire variableOverrides through
- No UI yet, just plumbing

**D) Invalid CSS Guard**
- (Already implemented: preview hides on invalid input)

---

## References

- User guidance: Phase 5 "Complete" definition
- Architecture: rulesTree (Phase 3) → SyntheticNode → Preview rendering
- Future: Phase 6 will use mapping to enable interactive editing
