# CSS Toolkit – Feature-Dependent Phased Roadmap

Each phase assumes the previous phase is fully implemented and reuses its data structures.

---

## PHASE 1 — Structural Foundation ✅ COMPLETE

**Concept:** "CSS as text, validated and transformed"

You've already built this. Phase 1 defines CSS as a valid, analyzable artifact.

### Capabilities
- Syntax validation (css-tree)
- Linting (stylelint)
- Beautify / Minify
- Autoprefixing
- Diagnostics (line + column aware)

### Output Tabs
- **Validation** — Syntax errors
- **Linting** — Style warnings
- **Formatted Output** — Transformed CSS

### Core Assets Created
- CSS → AST parsing capability
- Reliable error positioning
- Lazy-loaded dependency model
- CodeMirror CSS integration
- Diagnostics object model

👉 **Everything after this depends on Phase 1.**

---

## PHASE 2 — Semantic Analysis & Metadata Extraction 🚀 IN PROGRESS

**Concept:** "CSS as a structured system, not just text"

This phase does not change primary output yet — it extracts structured meaning from the AST.

### New Internal Capabilities

Using PostCSS AST (already available):

**Extract:**
- Selectors
- Declarations
- At-rules (@media, @supports, @keyframes)
- CSS variables (--custom-props)
- Rule counts & nesting depth
- Specificity scores (heuristic)

### New Output Tab

**🧠 Analysis** — Metadata dashboard

**Example Contents:**
- Total rules
- Unique selectors count
- Unique properties used
- CSS variables list (--var-name)
- Media queries detected (list with breakpoints)
- Max nesting depth
- Duplicate declarations (info-level, with locations)
- At-rule summary

### Why This Phase Matters

- Feeds every future visualization (Phase 3–7)
- Zero UI complexity at first — pure data extraction
- No performance risk — runs on parse pipeline
- Purely additive — existing tabs unchanged

### Implementation Notes

- Lives next to `lintCss()` as `analyzeCss(ast)`
- Returns structured metadata object
- Integrates into output tab system
- Lazy-loaded like other CSS dependencies

---

## PHASE 3 — Rule Explorer (Read-Only Structural UI) ✅ COMPLETE

**Concept:** "Let users see the CSS tree"

Now you visualize the semantic data from Phase 2.

### New Output Tab

**🌳 Rules** — Interactive rule tree

**Visual Structure Example:**
```
.card
 ├─ display: flex
 ├─ padding: 16px
 └─ border-radius: 8px

@media (max-width: 768px)
 └─ .card
    └─ padding: 12px
```

### Capabilities
- Expand / collapse rules
- Click rule → highlight in input editor
- Show rule location (line range)
- Show computed specificity
- Show at-rules with nesting

### Dependencies
- Phase 2 metadata extraction
- Existing CodeMirror line mapping

### Restrictions (for safety)
- 🚫 No editing yet
- 🚫 No preview yet

### Implementation Details (Phase 3 Complete)

**Data Structure:** `CssRuleNode` type
```javascript
type CssRuleNode = {
  type: 'rule' | 'atrule'
  selector?: string                    // For rules
  atRule?: { name, params }            // For at-rules
  specificity?: number                 // Heuristic score
  declarations?: { property, value, loc }[]
  children: CssRuleNode[]              // Nested rules in at-rules
  loc: { startLine, endLine }          // AST location
}
```

**Key Assets Created**
- `components/RuleExplorer.js` — Read-only tree UI component
- Enhanced `analyzeCss()` — Returns `rulesTree` with proper nesting
- CSS styling for tree visualization with expand/collapse UI
- Integration into OutputTabs with "🌳 Rules" tab

**Features Implemented**
- ✅ Tree visualization with expand/collapse triangles
- ✅ Selector display with computed specificity score
- ✅ Nested declarations under each rule
- ✅ At-rule support (@media, @supports) with nesting
- ✅ Line number display for debugging
- ✅ Syntax highlighting for CSS keywords (prop/value colors)
- ✅ Hover effects for interactivity
- ✅ Responsive indentation based on nesting level

**Design Decisions**
- No re-parsing in UI — uses Phase 2 data directly
- PostCSS `node.source.start/end` for reliable line numbers
- Specificity calculation matches CSS standard heuristic
- Component is presentation-only (no CSS manipulation)

---

## PHASE 4 — Variable & Token Intelligence

**Concept:** "CSS as a theming system"

This phase introduces controlled interactivity, but still no DOM preview.

### New Capabilities
- Extract `:root` variables
- Track variable usage locations
- Detect unused variables
- Detect overridden variables in scopes

### New Output Tab

**🎨 Variables** — Token management dashboard

**UI Components:**
- Variable name (--my-color)
- Default value (e.g., `#3498db`)
- Usage count (where it's referenced)
- Editable value field (live update in preview)

### Live Behavior

Changing a variable updates:
- **Preview CSS output** (if Phase 5 enabled)
- **Formatted Output tab** (live CSS)
- Does NOT mutate original unless explicitly exported

### Notes

- 🔄 This is your first "live editing" feature, but it's scoped and safe
- Variable overrides are non-destructive
- Original CSS unchanged until export

---

## PHASE 5 — Synthetic Preview (CSS → Visual Representation)

**Concept:** "Show what the CSS would do"

This is the first true visualization phase.

### Core Idea

Generate synthetic DOM elements automatically, apply parsed CSS, show representative preview.

### New Output Tab

**👁 Preview** — Visual CSS demonstration

### Capabilities

**Auto-generated elements:**
- `.button` → `<button>`
- `.card` → `<div>`
- `.input` → `<input>`
- Generic classes → appropriate elements

**Simulated states:**
- `:hover` state toggle
- `:focus` state toggle
- Dark/light background toggle
- Media query width slider (responsive preview)

### Important Guardrail (must be explicit)

> "Preview uses synthetic elements. Actual HTML structure may differ."

This sets user expectations — preview is illustrative, not definitive.

### Dependencies
- Phase 2 selectors
- Phase 4 variable overrides
- Zero reliance on real HTML

---

## PHASE 6 — Interactive Style Controls (CSS → UI → CSS)

**Concept:** "Visual editing without breaking determinism"

This is the power phase, and it only works because of everything before it.

### New Capabilities

**Property → UI mapping:**
- `color` → color picker
- `padding` / `margin` → box model editor
- `border-radius` → slider controls
- `font-size` → number input

**Scoped editing:**
- Edit one rule at a time
- Changes reflect into:
  - **Preview** (Phase 5)
  - **Output CSS** (generated, formatted)

### New Output Tab

**🛠 Style Editor** — Visual property controls

### Safety Rules

These keep the tool deterministic and non-invasive:

- Never infer new selectors
- Never auto-add properties
- Only edit existing declarations unless user explicitly opts in to "add property"
- Generated CSS is always valid
- Original input preserved until export

---

## PHASE 7 — Optimization & Impact Analysis

**Concept:** "What happens if I remove or change this?"

Final pro-level phase for CSS professionals.

### Capabilities

- **Rule impact analysis** — Which elements depend on this rule?
- **Dead rule detection** — Heuristic-based, never fully deterministic
- **Redundant declaration detection** — `color: red; color: red;`
- **Selector complexity warnings** — Very deeply nested or overly specific
- **Unused variable detection** — Variables declared but never used

### Output Tabs

- **Optimization** — Recommended removals / consolidations
- **Impact** — What changes if I remove X?

### Notes

- Optional but highly differentiating
- Heuristic-based, suitable for guidance (not rules)
- Helps users learn CSS best practices

---

## Dependency Chain Summary

```
Phase 1: Validation & Formatting
   ↓
Phase 2: Semantic Analysis & Metadata Extraction
   ↓
Phase 3: Rule Explorer (Read-Only Tree UI)
   ↓
Phase 4: Variables & Token Intelligence
   ↓
Phase 5: Synthetic Preview
   ↓
Phase 6: Interactive Style Controls
   ↓
Phase 7: Optimization & Impact Analysis
```

---

## Why This Fits the Current Architecture Perfectly

✅ Uses existing AST parsing (PostCSS)
✅ Uses existing diagnostics system
✅ Uses output tabs (no UI rewrite needed)
✅ Lazy-load friendly (no bundle bloat)
✅ Deterministic, non-AI driven
✅ Each phase is shippable independently

---

## Implementation Status

| Phase | Status | Key File(s) | Notes |
|-------|--------|-------------|-------|
| 1 | ✅ Complete | `lib/tools/cssFormatter.js`, `components/OutputTabs.js` | Core validation, linting, formatting |
| 2 | ✅ Complete | `lib/tools/cssFormatter.js` | `analyzeCss()` with metadata extraction |
| 3 | ✅ Complete | `components/RuleExplorer.js`, `lib/tools/cssFormatter.js` | Interactive rule tree with expand/collapse |
| 4 | ⏳ Pending | — | Variable extraction & editing |
| 5 | ⏳ Pending | — | Synthetic DOM preview |
| 6 | ⏳ Pending | — | Interactive property controls |
| 7 | ⏳ Pending | — | Optimization insights |

---

## Architecture Principles

- **Additive, never destructive** — Each phase builds on previous without breaking them
- **Lazy-loaded** — Heavy dependencies load only when feature is used
- **Output-tab based** — All visualizations reuse existing tab framework
- **Deterministic** — Logic is rule-based, not AI/heuristic guessing
- **Data-driven** — Phase N outputs become Phase N+1 inputs
