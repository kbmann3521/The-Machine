# Phase 3: Precision & Numeric Control — LOCKED SPECIFICATION

**Status**: ✅ FROZEN (December 18, 2025 — FINAL: Semantic Refinement: result = raw | formattedResult = presentation)

This document locks the Phase 3 numeric control specification. These decisions are stable and will not be revisited without major version change.

---

## Locked Design Decisions

### 1️⃣ Result vs FormattedResult (IMMUTABLE)

```javascript
{
  "result": 0.30000000000000004,           // Raw numeric value (truth)
  "formattedResult": "0.3",                // Presentation (user-facing)
}
```

**Why This Matters**:
- Preserves numeric integrity for downstream operations
- Enables future exports, step tracing, and symbolic phases
- Prevents lossy transformations at the output boundary

**Lock Decision**: Do NOT collapse these fields. Ever.

---

### 2️⃣ Numeric Metadata Schema (IMMUTABLE)

All diagnostic blocks MUST include:

```javascript
"numeric": {
  "mode": "float" | "big",              // Computation mode
  "precision": null | number,           // Display/rounding precision
  "rounding": "half-up" | "half-even" | "floor" | "ceil",  // Rounding mode
  "notation": "auto" | "scientific",    // Presentation format
  "precisionRounded": boolean           // Did output differ from internal result?
}
```

**Requirements**:
- ✅ Present in ALL diagnostic blocks (success and error)
- ✅ `precisionRounded` always included (even if false)
- ✅ Same schema for valid and invalid expressions
- ✅ Schema is stable across configuration changes

**Lock Decision**: This schema does not change for Phase 4, 5, 6+. Future enhancements add fields, never remove or restructure.

---

### 3️⃣ Floating-Point Artifact Detection (ADVISORY ONLY)

Warnings fire when float mode detects:
- ✅ Excessive trailing decimals (>15 places)
- ✅ Repeating decimal patterns
- ✅ Precision drift artifacts

**Examples** (warnings emit):
- `0.1 + 0.2` → warns: "Floating-point precision artifact detected..."
- `0.3 / 0.1` → warns
- `tan(pi/4)` → warns
- `0.1 * 3` → warns

**Examples** (no warnings):
- `42` (integer)
- `sqrt(16)` (exact)
- `pi` (constants are trusted)
- `1 + 1` (clean)

**Lock Decision**: These warnings are ADVISORY, not errors. They guide users to BigNumber mode but do not block evaluation.

---

### 4️⃣ Precision Defaults (IMMUTABLE)

```javascript
const defaultConfig = {
  precision: null,              // Full precision output
  rounding: "half-up",          // Traditional rounding
  notation: "auto",             // Standard notation by default
  mode: "float"                 // JavaScript native by default
}
```

**Why**:
- `precision: null` = display-only control, not evaluation precision
- `mode: "float"` = fast, default behavior preserved
- No silent rounding without explicit user intent
- Preserves numeric contract for existing code

**Lock Decision**: Do NOT change defaults. Do NOT add implicit rounding. Users must explicitly set `precision` to enable output rounding.

---

### 5️⃣ Rounding is Config-Driven (IMMUTABLE)

Rounding only occurs when:
- User explicitly sets `precision` to a number
- AND `rounding` mode determines behavior

**Does NOT happen implicitly**:
- ❌ No "smart" rounding based on expression type
- ❌ No hidden precision truncation
- ❌ No automatic decimal place detection

Test cases reflect this:
- `2.5` with `precision: 0, rounding: "half-up"` → 3
- `2.5` with `precision: 0, rounding: "half-even"` → 2
- `2.5` (no precision set) → 2.5 (unchanged)

**Lock Decision**: Rounding is explicit and auditable. No implicit behavior.

---

### 6️⃣ No Silent Syntax Expansion (IMMUTABLE)

**Operators NOT supported** (intentionally):
- ❌ `**` (JavaScript exponentiation)
- ❌ Bitwise operators
- ❌ Custom functions

**Why**:
- mathjs uses `^` for exponentiation, not `**`
- Syntax support is a Phase 4 decision
- You have NOT declared `**` as supported
- Silently adding support violates the deterministic contract

**Current Behavior**:
- `2 ** 3` → error: "Value expected"
- `sqrt(2) ** 2` → error: "Value expected"

**Lock Decision**: DO NOT add `**` support without explicit Phase 4 syntax extension specification.

---

## What Phase 3 Does (Complete List)

✅ **Decimal precision selector** (display-only by default)
✅ **Rounding modes** (half-up, half-even, floor, ceil)
✅ **Scientific notation toggle** (presentation only)
✅ **BigNumber mode** (arbitrary precision infrastructure)
✅ **Float artifact detection** (advisory warnings)
✅ **Numeric metadata** (complete, auditable diagnostics)
✅ **Result separation** (raw vs formatted)

---

## What Phase 3 Does NOT Do

❌ Change syntax parsing
❌ Add new operators
❌ Add symbolic math
❌ Add variables substitution
❌ Provide BigNumber mode UI (yet)
❌ Implement step tracing

These belong in Phase 4+.

---

## Schema Stability Promise

This schema is locked. When Phase 4, 5, 6 ship:

- ✅ New fields may be added
- ✅ Numeric metadata expands (more detail)
- ✅ Warnings expand (more cases caught)
- ❌ Existing fields never removed
- ❌ Existing fields never restructured
- ❌ Default behavior never changes without major version

---

## Test Coverage

**Phase 3 test cases validate**:

1. **Precision control**: results with different precision levels
2. **Rounding modes**: half-up vs half-even behavior
3. **Scientific notation**: large number formatting
4. **Float artifacts**: warnings on problematic operations
5. **BigNumber readiness**: mode flag, infrastructure in place
6. **Error cases**: complete numeric metadata even on errors

Test cases are **semantically accurate**:
- Rounding tests only run when precision is explicitly set
- Float artifact tests show advisory warnings only
- Metadata is present and complete in all cases

---

## Sign-Off

**Decision Owner**: Kyle Mann (@admin)
**Implementation**: Phase 3 Core Numeric Contract
**Locked**: 2025-12-17
**Next Phase**: Phase 4 (Syntax Extensions)

This specification is FROZEN for 3+ phases. Do not modify without explicit approval.
