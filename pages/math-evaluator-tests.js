import React, { useState } from 'react'
import { mathEvaluator } from '../lib/tools.js'
import NumericConfig from '../components/NumericConfig.js'
import MathEvaluatorResult from '../components/MathEvaluatorResult.js'
import styles from '../styles/math-evaluator-tests.module.css'

const TEST_CASES = [
  // Phase 1: Basic Arithmetic
  { category: 'Phase 1: Basic Arithmetic', input: '2 + 3', description: 'Simple addition' },
  { category: 'Phase 1: Basic Arithmetic', input: '10 - 5', description: 'Simple subtraction' },
  { category: 'Phase 1: Basic Arithmetic', input: '4 * 5', description: 'Simple multiplication' },
  { category: 'Phase 1: Basic Arithmetic', input: '20 / 4', description: 'Simple division' },
  // Note: The ** (exponentiation) operator is intentionally unsupported in Phase 3.
  // Use the pow() function instead (e.g., pow(2, 3) for 2^3).
  // This is a deliberate choice to maintain syntax clarity and avoid ambiguity.
  { category: 'Phase 1: Basic Arithmetic', input: '2 ** 3', description: 'Exponentiation (** unsupported — use pow)' },
  { category: 'Phase 1: Basic Arithmetic', input: '(25 + 15) * 2', description: 'Parentheses and order of operations' },

  // Phase 1: Functions - Trigonometric
  { category: 'Phase 1: Trigonometric', input: 'sin(pi/2)', description: 'Sine of pi/2' },
  { category: 'Phase 1: Trigonometric', input: 'cos(0)', description: 'Cosine of 0' },
  { category: 'Phase 1: Trigonometric', input: 'tan(pi/4)', description: 'Tangent of pi/4' },
  { category: 'Phase 1: Trigonometric', input: 'asin(1)', description: 'Arcsine of 1' },
  { category: 'Phase 1: Trigonometric', input: 'sinh(0)', description: 'Hyperbolic sine' },

  // Phase 1: Functions - Logarithmic & Exponential
  { category: 'Phase 1: Logarithmic', input: 'sqrt(16)', description: 'Square root' },
  { category: 'Phase 1: Logarithmic', input: 'cbrt(27)', description: 'Cube root' },
  { category: 'Phase 1: Logarithmic', input: 'log10(100)', description: 'Base-10 logarithm' },
  { category: 'Phase 1: Logarithmic', input: 'log(e)', description: 'Natural logarithm of e' },
  { category: 'Phase 1: Logarithmic', input: 'exp(1)', description: 'e^1' },

  // Phase 1: Functions - Rounding & Misc
  { category: 'Phase 1: Rounding', input: 'floor(3.7)', description: 'Floor function' },
  { category: 'Phase 1: Rounding', input: 'ceil(3.2)', description: 'Ceiling function' },
  { category: 'Phase 1: Rounding', input: 'round(3.14159, 2)', description: 'Round to 2 decimals' },
  { category: 'Phase 1: Rounding', input: 'abs(-5)', description: 'Absolute value' },

  // Phase 1: Aggregate Functions
  { category: 'Phase 1: Aggregate', input: 'min(5, 10, 3)', description: 'Minimum' },
  { category: 'Phase 1: Aggregate', input: 'max(5, 10, 3)', description: 'Maximum' },
  { category: 'Phase 1: Aggregate', input: 'pow(2, 8)', description: 'Power function' },

  // Phase 1: Constants
  { category: 'Phase 1: Constants', input: 'pi', description: 'Pi constant' },
  { category: 'Phase 1: Constants', input: 'e', description: 'Euler number' },
  { category: 'Phase 1: Constants', input: '2 * pi', description: 'Circumference coefficient' },

  // Phase 1: Complex Expressions
  { category: 'Phase 1: Complex', input: '(25 + 15) * 2 - 10 / 2 + sqrt(16)', description: 'Mixed operations' },
  { category: 'Phase 1: Complex', input: 'sin(pi/2) + cos(0) * sqrt(16) + log10(100)', description: 'Functions + operations' },
  { category: 'Phase 1: Complex', input: '((sin(pi/4) + cos(pi/4)) * sqrt(2)) / (log10(100) - log(e))', description: 'Deeply nested' },

  // Phase 2: Implicit Multiplication - Digit + Letter
  { category: 'Phase 2: Implicit Mult (Digit+Letter)', input: '2x + 3y', description: 'Variables with implicit mult' },
  { category: 'Phase 2: Implicit Mult (Digit+Letter)', input: '5a', description: 'Single implicit mult' },

  // Phase 2: Implicit Multiplication - Digit + Paren
  { category: 'Phase 2: Implicit Mult (Digit+Paren)', input: '5(4 + 2)', description: 'Digit before parentheses' },
  { category: 'Phase 2: Implicit Mult (Digit+Paren)', input: '2(3 + 4)', description: 'Another digit-paren pattern' },

  // Phase 2: Implicit Multiplication - Paren + Paren
  { category: 'Phase 2: Implicit Mult (Paren+Paren)', input: '(2 + 3)(4 - 1)', description: 'Adjacent parentheses' },
  { category: 'Phase 2: Implicit Mult (Paren+Paren)', input: '(5)(10)', description: 'Two parenthesized numbers' },

  // Phase 2: Implicit Multiplication - Function + Number
  { category: 'Phase 2: Implicit Mult (Function+Number)', input: 'sqrt(4)2', description: 'Function result + number' },
  { category: 'Phase 2: Implicit Mult (Function+Number)', input: '5sqrt(4)', description: 'Number + function' },

  // Phase 2: Variables (Undefined)
  { category: 'Phase 2: Variables', input: 'a * b + c / 2', description: 'Multiple undefined variables' },
  { category: 'Phase 2: Variables', input: 'x + y * z', description: 'Variables with operations' },
  { category: 'Phase 2: Variables', input: '2 * x + 3', description: 'Mixed constants and variables' },

  // Phase 2: Syntax Errors
  { category: 'Phase 2: Syntax Errors', input: '((25 + 15) * 2))', description: 'Mismatched parentheses' },
  { category: 'Phase 2: Syntax Errors', input: '5 +* 3', description: 'Invalid operator sequence' },
  { category: 'Phase 2: Syntax Errors', input: '(5 + 3', description: 'Unclosed parenthesis' },

  // Phase 2: Unknown Functions
  { category: 'Phase 2: Unknown Functions', input: 'sqrt(16) + custom_func(5)', description: 'Unknown function' },
  { category: 'Phase 2: Unknown Functions', input: 'ln(e)', description: 'ln not available (use log)' },
  { category: 'Phase 2: Unknown Functions', input: 'random(10)', description: 'Function not in whitelist' },

  // Phase 2: Division by Zero
  { category: 'Phase 2: Division by Zero', input: '10 / (5 - 5)', description: 'Computed zero denominator' },
  { category: 'Phase 2: Division by Zero', input: '1 / 0', description: 'Direct division by zero' },

  // Phase 2: Edge Cases
  { category: 'Phase 2: Edge Cases', input: '42', description: 'Single number' },
  { category: 'Phase 2: Edge Cases', input: '0', description: 'Zero' },
  { category: 'Phase 2: Edge Cases', input: '-5', description: 'Negative number' },
  { category: 'Phase 2: Edge Cases', input: '3.14159', description: 'Decimal number' },
  { category: 'Phase 2: Edge Cases', input: '   (5 + 3)   ', description: 'Expression with whitespace' },

  // Phase 3: Precision Control
  { category: 'Phase 3: Precision', input: '0.1 + 0.2', description: 'Float precision test' },
  { category: 'Phase 3: Precision', input: 'tan(pi/4)', description: 'Trigonometric precision' },
  { category: 'Phase 3: Precision', input: 'pi', description: 'Pi constant precision' },
  { category: 'Phase 3: Precision', input: 'e', description: 'Euler number precision' },

  // Phase 3: Rounding Modes (Option A: config-driven)
  // These test cases explicitly use numericConfig to exercise rounding modes
  { category: 'Phase 3: Rounding', input: '2.5', description: 'Half-up: 2.5 → 3', numericConfig: { precision: 0, rounding: 'half-up' } },
  { category: 'Phase 3: Rounding', input: '2.5', description: 'Half-even: 2.5 → 2', numericConfig: { precision: 0, rounding: 'half-even' } },
  { category: 'Phase 3: Rounding', input: '3.5', description: 'Half-up: 3.5 → 4', numericConfig: { precision: 0, rounding: 'half-up' } },
  { category: 'Phase 3: Rounding', input: '3.5', description: 'Half-even: 3.5 → 4', numericConfig: { precision: 0, rounding: 'half-even' } },
  { category: 'Phase 3: Rounding', input: '1.234567', description: 'Precision: 3 decimals', numericConfig: { precision: 3 } },

  // Phase 3: Scientific Notation
  { category: 'Phase 3: Notation', input: '1000000', description: 'Large number for notation' },
  { category: 'Phase 3: Notation', input: '0.0001', description: 'Small number for notation' },
  { category: 'Phase 3: Notation', input: '2 ** 20', description: 'Million range exponent (** unsupported)' },

  // Phase 3: Float Artifacts
  { category: 'Phase 3: Float Artifacts', input: '0.1 * 3', description: 'Multiplication precision' },
  { category: 'Phase 3: Float Artifacts', input: '0.3 / 0.1', description: 'Division precision' },
  { category: 'Phase 3: Float Artifacts', input: 'sqrt(2) ** 2', description: 'Square root square precision (** unsupported)' },

  // Phase 4: Numeric Mode Selection
  { category: 'Phase 4: Numeric Mode', input: '0.1 + 0.2', description: 'Float mode (IEEE-754)', numericConfig: { mode: 'float' } },
  { category: 'Phase 4: Numeric Mode', input: '0.1 + 0.2', description: 'BigNumber mode (exact decimal)', numericConfig: { mode: 'bignumber' } },
  { category: 'Phase 4: Numeric Mode', input: 'pow(2, 100)', description: 'Float mode large number', numericConfig: { mode: 'float' } },
  { category: 'Phase 4: Numeric Mode', input: 'pow(2, 100)', description: 'BigNumber mode large number', numericConfig: { mode: 'bignumber' } },

  // Phase 4: Decimal Precision Control
  { category: 'Phase 4: Precision', input: '1.23456789', description: 'Auto (no precision)', numericConfig: { precision: null } },
  { category: 'Phase 4: Precision', input: '1.23456789', description: '0 decimal places', numericConfig: { precision: 0 } },
  { category: 'Phase 4: Precision', input: '1.23456789', description: '2 decimal places', numericConfig: { precision: 2 } },
  { category: 'Phase 4: Precision', input: '1.23456789', description: '5 decimal places', numericConfig: { precision: 5 } },
  { category: 'Phase 4: Precision', input: '3.141592653589793', description: 'Pi with 10 decimals', numericConfig: { precision: 10 } },
  { category: 'Phase 4: Precision', input: '2.718281828459045', description: 'E with 8 decimals', numericConfig: { precision: 8 } },

  // Phase 4: Rounding Modes - Half-Up (Traditional)
  { category: 'Phase 4: Rounding (Half-Up)', input: '2.5', description: 'Round 2.5 (half-up)', numericConfig: { precision: 0, rounding: 'half-up' } },
  { category: 'Phase 4: Rounding (Half-Up)', input: '3.5', description: 'Round 3.5 (half-up)', numericConfig: { precision: 0, rounding: 'half-up' } },
  { category: 'Phase 4: Rounding (Half-Up)', input: '-2.5', description: 'Round -2.5 (half-up)', numericConfig: { precision: 0, rounding: 'half-up' } },
  { category: 'Phase 4: Rounding (Half-Up)', input: '1.555', description: 'Round 1.555 to 2dp (half-up)', numericConfig: { precision: 2, rounding: 'half-up' } },

  // Phase 4: Rounding Modes - Half-Even (Banker's)
  { category: 'Phase 4: Rounding (Half-Even)', input: '2.5', description: 'Round 2.5 (half-even)', numericConfig: { precision: 0, rounding: 'half-even' } },
  { category: 'Phase 4: Rounding (Half-Even)', input: '3.5', description: 'Round 3.5 (half-even)', numericConfig: { precision: 0, rounding: 'half-even' } },
  { category: 'Phase 4: Rounding (Half-Even)', input: '4.5', description: 'Round 4.5 (half-even)', numericConfig: { precision: 0, rounding: 'half-even' } },
  { category: 'Phase 4: Rounding (Half-Even)', input: '-2.5', description: 'Round -2.5 (half-even)', numericConfig: { precision: 0, rounding: 'half-even' } },

  // Phase 4: Rounding Modes - Floor (Toward −∞)
  { category: 'Phase 4: Rounding (Floor)', input: '2.5', description: 'Floor 2.5', numericConfig: { precision: 0, rounding: 'floor' } },
  { category: 'Phase 4: Rounding (Floor)', input: '2.1', description: 'Floor 2.1', numericConfig: { precision: 0, rounding: 'floor' } },
  { category: 'Phase 4: Rounding (Floor)', input: '-2.5', description: 'Floor -2.5', numericConfig: { precision: 0, rounding: 'floor' } },
  { category: 'Phase 4: Rounding (Floor)', input: '3.99', description: 'Floor 3.99', numericConfig: { precision: 0, rounding: 'floor' } },

  // Phase 4: Rounding Modes - Ceil (Toward +∞)
  { category: 'Phase 4: Rounding (Ceil)', input: '2.1', description: 'Ceil 2.1', numericConfig: { precision: 0, rounding: 'ceil' } },
  { category: 'Phase 4: Rounding (Ceil)', input: '2.5', description: 'Ceil 2.5', numericConfig: { precision: 0, rounding: 'ceil' } },
  { category: 'Phase 4: Rounding (Ceil)', input: '-2.5', description: 'Ceil -2.5', numericConfig: { precision: 0, rounding: 'ceil' } },
  { category: 'Phase 4: Rounding (Ceil)', input: '2.01', description: 'Ceil 2.01', numericConfig: { precision: 0, rounding: 'ceil' } },

  // Phase 4: Notation - Auto (Smart)
  { category: 'Phase 4: Notation (Auto)', input: '42', description: 'Small number (auto)', numericConfig: { notation: 'auto' } },
  { category: 'Phase 4: Notation (Auto)', input: '1000000', description: 'Million (auto)', numericConfig: { notation: 'auto' } },
  { category: 'Phase 4: Notation (Auto)', input: '0.00001', description: 'Very small (auto)', numericConfig: { notation: 'auto' } },
  { category: 'Phase 4: Notation (Auto)', input: '123.456', description: 'Normal decimal (auto)', numericConfig: { notation: 'auto' } },

  // Phase 4: Notation - Standard (Full decimal)
  { category: 'Phase 4: Notation (Standard)', input: '1000000', description: 'Million (standard)', numericConfig: { notation: 'standard' } },
  { category: 'Phase 4: Notation (Standard)', input: '0.0001', description: 'Small number (standard)', numericConfig: { notation: 'standard' } },
  { category: 'Phase 4: Notation (Standard)', input: 'pow(10, 6)', description: '10^6 (standard)', numericConfig: { notation: 'standard' } },

  // Phase 4: Notation - Scientific
  { category: 'Phase 4: Notation (Scientific)', input: '1000', description: 'Thousand (scientific)', numericConfig: { notation: 'scientific' } },
  { category: 'Phase 4: Notation (Scientific)', input: '0.00001', description: 'Small number (scientific)', numericConfig: { notation: 'scientific' } },
  { category: 'Phase 4: Notation (Scientific)', input: 'pow(2, 20)', description: '2^20 (scientific)', numericConfig: { notation: 'scientific' } },

  // Phase 4: Combined - Precision + Rounding + Notation
  { category: 'Phase 4: Combined Config', input: '1.23456789', description: 'Precision 3dp + Half-Up', numericConfig: { precision: 3, rounding: 'half-up', notation: 'standard' } },
  { category: 'Phase 4: Combined Config', input: '1.23456789', description: 'Precision 3dp + Half-Even', numericConfig: { precision: 3, rounding: 'half-even', notation: 'standard' } },
  { category: 'Phase 4: Combined Config', input: '1000000', description: 'Large + Scientific notation', numericConfig: { precision: 2, notation: 'scientific' } },
  { category: 'Phase 4: Combined Config', input: '0.00123456', description: 'Small + 4dp precision', numericConfig: { precision: 4, notation: 'standard' } },

  // Phase 4: Float Artifacts Detection
  { category: 'Phase 4: Artifacts & Detection', input: '0.1 + 0.2', description: 'Classic IEEE-754 artifact', numericConfig: { mode: 'float' } },
  { category: 'Phase 4: Artifacts & Detection', input: '0.1 * 3', description: 'Multiplication artifact', numericConfig: { mode: 'float' } },
  { category: 'Phase 4: Artifacts & Detection', input: '0.3 / 0.1', description: 'Division artifact', numericConfig: { mode: 'float' } },
  { category: 'Phase 4: Artifacts & Detection', input: '0.1 + 0.2', description: 'BigNumber avoids artifact', numericConfig: { mode: 'bignumber' } },

  // Phase 4: Edge Cases
  { category: 'Phase 4: Edge Cases', input: '0', description: 'Zero with precision 5', numericConfig: { precision: 5 } },
  { category: 'Phase 4: Edge Cases', input: '-0.5', description: 'Negative half with ceil', numericConfig: { precision: 0, rounding: 'ceil' } },
  { category: 'Phase 4: Edge Cases', input: '999.9999', description: '999.9999 with floor', numericConfig: { precision: 2, rounding: 'floor' } },
  { category: 'Phase 4: Edge Cases', input: 'pi', description: 'Pi with 15 decimals', numericConfig: { precision: 15 } },
]

export default function MathEvaluatorTests() {
  const [expandedIndices, setExpandedIndices] = useState(new Set())
  const [copied, setCopied] = useState(false)
  const [copiedPhase4, setCopiedPhase4] = useState(false)
  const [numericConfig, setNumericConfig] = useState({
    precision: null,
    rounding: 'half-up',
    notation: 'auto',
    mode: 'float'
  })

  // Run all tests with numeric config
  // If a test case specifies its own numericConfig, merge it with UI config
  const results = useMemo(() => {
    return TEST_CASES.map((testCase, idx) => {
      const effectiveConfig = testCase.numericConfig
        ? { ...numericConfig, ...testCase.numericConfig }
        : numericConfig
      return {
        ...testCase,
        index: idx,
        result: mathEvaluator(testCase.input, effectiveConfig),
      }
    })
  }, [numericConfig])

  // Check if any result has float artifacts detected
  const hasFloatArtifacts = results.some(r =>
    r.result.diagnostics?.warnings?.some(w => w.includes('Floating-point precision artifact'))
  )

  // Group by category
  const grouped = useMemo(() => {
    const groups = {}
    results.forEach(r => {
      if (!groups[r.category]) {
        groups[r.category] = []
      }
      groups[r.category].push(r)
    })
    return groups
  }, [results])

  const categories = Object.keys(grouped).sort()

  const toggleExpanded = (idx) => {
    const newExpanded = new Set(expandedIndices)
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx)
    } else {
      newExpanded.add(idx)
    }
    setExpandedIndices(newExpanded)
  }

  const handleCopyAll = async () => {
    const allResults = results.map(r => ({
      input: r.input,
      description: r.description,
      category: r.category,
      result: r.result,
    }))

    const json = JSON.stringify(allResults, null, 2)

    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback to older document.execCommand method
      try {
        const textarea = document.createElement('textarea')
        textarea.value = json
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        document.body.removeChild(textarea)
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr)
      }
    }
  }

  const handleCopyPhase4 = async () => {
    const phase4Results = results
      .filter(r => r.category.startsWith('Phase 4:'))
      .map(r => ({
        input: r.input,
        description: r.description,
        category: r.category,
        result: r.result,
      }))

    const json = JSON.stringify(phase4Results, null, 2)

    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(json)
      setCopiedPhase4(true)
      setTimeout(() => setCopiedPhase4(false), 2000)
    } catch (err) {
      // Fallback to older document.execCommand method
      try {
        const textarea = document.createElement('textarea')
        textarea.value = json
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        setCopiedPhase4(true)
        setTimeout(() => setCopiedPhase4(false), 2000)
        document.body.removeChild(textarea)
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr)
      }
    }
  }

  const getStatusIcon = (result) => {
    if (result.error) return '❌'
    if (result.diagnostics && result.diagnostics.warnings && result.diagnostics.warnings.length > 0) return '⚠️'
    if (result.result !== undefined && result.result !== null) return '✅'
    return '❓'
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Math Expression Evaluator — Test Harness</h1>
        <p className={styles.subtitle}>
          Comprehensive test suite for Phase 1–4. {results.length} test cases total (Phase 4: Numeric Control & Precision).
        </p>
      </div>

      <NumericConfig config={numericConfig} onConfigChange={setNumericConfig} floatArtifactDetected={hasFloatArtifacts} />

      <div className={styles.controls}>
        <button className={styles.copyButton} onClick={handleCopyAll}>
          {copied ? '✓ Copied All Results!' : '📋 Copy All Results (JSON)'}
        </button>
        <button className={styles.copyButton} onClick={handleCopyPhase4}>
          {copiedPhase4 ? '✓ Copied Phase 4 Results!' : '📋 Copy Phase 4 Results (JSON)'}
        </button>
        <span className={styles.stats}>
          ✅ Valid: {results.filter(r => r.result.result !== undefined && !r.result.error).length} |
          ⚠️ Warnings: {results.filter(r => r.result.diagnostics && r.result.diagnostics.warnings && r.result.diagnostics.warnings.length > 0).length} |
          ❌ Errors: {results.filter(r => r.result.error).length}
        </span>
      </div>

      <div className={styles.testResults}>
        {categories.map(category => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              {category} ({grouped[category].length})
            </h2>

            <div className={styles.testList}>
              {grouped[category].map(testResult => (
                <div key={testResult.index} className={styles.testItem}>
                  <div
                    className={styles.testHeader}
                    onClick={() => toggleExpanded(testResult.index)}
                  >
                    <span className={styles.statusIcon}>
                      {getStatusIcon(testResult.result)}
                    </span>
                    <div className={styles.testInfo}>
                      <code className={styles.input}>{testResult.input}</code>
                      <span className={styles.description}>
                        {testResult.description}
                      </span>
                    </div>
                    <span className={styles.toggleChevron}>
                      {expandedIndices.has(testResult.index) ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedIndices.has(testResult.index) && (
                    <div className={styles.testBody}>
                      <MathEvaluatorResult
                        result={testResult.result}
                        expression={testResult.input}
                      />
                      <pre className={styles.json}>
                        {JSON.stringify(testResult.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p>
          Test harness for Math Expression Evaluator (Phase 1–4: Arithmetic, Functions, Numeric Control).
          Adjust numeric settings above to control precision, rounding, and notation. Click any test to expand and view detailed results with diagnostics.
        </p>
      </div>
    </div>
  )
}
