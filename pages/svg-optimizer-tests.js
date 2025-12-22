import React, { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/svg-optimizer-tests.module.css'

const TEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 300 300"
     width="300"
     height="300">

  <!-- =========================
       DEFINITIONS (USED + UNUSED)
       ========================= -->

  <defs>
    <!-- Used gradient -->
    <linearGradient id="gradUsed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B6B" stop-opacity="1"/>
      <stop offset="100%" stop-color="#4ECDC4" stop-opacity="1"/>
    </linearGradient>

    <!-- Unused gradient -->
    <linearGradient id="gradUnused">
      <stop offset="0%" stop-color="red"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>

    <!-- Used filter -->
    <filter id="blurFilter">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.141592653589793"/>
    </filter>

    <!-- Used mask -->
    <mask id="circleMask">
      <circle cx="150" cy="150" r="80" fill="white"/>
    </mask>
  </defs>

  <!-- =========================
       METADATA / ACCESSIBILITY
       ========================= -->

  <title>SVG Optimizer Stress Test</title>

  <!-- =========================
       BACKGROUND (DEFAULT ATTRS)
       ========================= -->

  <rect x="0" y="0"
        width="300"
        height="300"
        fill="black"
        opacity="1.0"/>

  <!-- =========================
       SHAPES (PRECISION + CONVERT)
       ========================= -->

  <!-- High-precision rectangle -->
  <rect x="10.123456789"
        y="10.987654321"
        width="120.555555555"
        height="80.333333333"
        rx="5.999999999"
        ry="5.111111111"
        fill="url(#gradUsed)"/>

  <!-- Circle with filter -->
  <circle cx="200.444444444"
          cy="80.555555555"
          r="30.999999999"
          fill="#FF6B6B"
          filter="url(#blurFilter)"/>

  <!-- Ellipse (convert candidate) -->
  <ellipse cx="80.222222222"
           cy="180.777777777"
           rx="40.888888888"
           ry="20.333333333"
           fill="#4ECDC4"/>

  <!-- =========================
       PATHS (MERGE + NO MERGE)
       ========================= -->

  <!-- Mergeable paths -->
  <path d="M 50.123456789 250.987654321 L 80.111111111 280.222222222 L 20.444444444 280.333333333 Z"
        fill="#845EC2"/>

  <path d="M 100.555555555 250.111111111 L 130.666666666 280.888888888 L 70.777777777 280.444444444 Z"
        fill="#845EC2"/>

  <!-- NOT mergeable (different stroke) -->
  <path d="M 160 250 L 190 280 L 130 280 Z"
        fill="#845EC2"
        stroke="#000000"
        stroke-width="1"/>

  <!-- =========================
       TEXT (PRESERVE / CONVERT)
       ========================= -->

  <text x="150.000000"
        y="140.000000"
        font-size="24"
        text-anchor="middle"
        fill="white">
    SVG Test
  </text>

  <text x="150"
        y="270"
        font-size="14.789456123"
        fill="#FFFFFF"
        text-anchor="middle">
    Precision • Paths • IDs
  </text>

  <!-- =========================
       GROUPS (EMPTY + UNUSED ID)
       ========================= -->

  <!-- Empty group -->
  <g id="emptyGroup"></g>

  <!-- Unused ID group -->
  <g id="unusedGroup">
    <line x1="10.5" y1="10.5"
          x2="290.5" y2="290.5"
          stroke="#FFFFFF"
          stroke-width="0.5"/>
  </g>

  <!-- =========================
       MASKED ELEMENT
       ========================= -->

  <circle cx="150"
          cy="150"
          r="100"
          fill="#96CEB4"
          mask="url(#circleMask)"/>

</svg>`

const OPTIMIZATION_CONFIGS = [
  {
    name: 'Safe Mode (Default)',
    config: {
      phase2: {
        enabled: true,
        level: 'safe'
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Balanced Mode',
    config: {
      phase2: {
        enabled: true,
        level: 'balanced'
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Aggressive Mode',
    config: {
      phase2: {
        enabled: true,
        level: 'aggressive'
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Precision Only (3 decimals)',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          precisionReduction: { enabled: true, decimals: 3 }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Shape Conversion Only',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          shapeConversion: { enabled: true }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Path Merging Only',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          pathMerging: { enabled: true }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Shape + Path Merging',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          shapeConversion: { enabled: true },
          pathMerging: { enabled: true }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'High Precision Reduction (2 decimals)',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          precisionReduction: { enabled: true, decimals: 2 }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'ID Minification Only',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          idCleanup: { enabled: true, mode: 'minify' }
        }
      },
      outputFormat: 'compact'
    }
  },
  {
    name: 'Pretty Format (Balanced)',
    config: {
      phase2: {
        enabled: true,
        level: 'balanced'
      },
      outputFormat: 'pretty'
    }
  }
]

export default function SVGOptimizerTestSuite() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [expandedResults, setExpandedResults] = useState({})

  const handleRunTests = async () => {
    setLoading(true)
    try {
      const results = []

      for (const { name, config } of OPTIMIZATION_CONFIGS) {
        const response = await fetch('/api/tools/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            toolId: 'svg-optimizer',
            input: TEST_SVG,
            config
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        results.push({
          name,
          config,
          result
        })
      }

      setTestResults(results)
      setExpandedResults({})
    } catch (error) {
      console.error('Test execution error:', error)
      alert('Error running tests: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAllJSON = () => {
    if (!testResults) return

    const allResults = testResults.map(({ name, config, result }) => ({
      name,
      config,
      result
    }))

    const json = JSON.stringify(allResults, null, 2)
    navigator.clipboard.writeText(json).then(() => {
      alert('All results copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy to clipboard')
    })
  }

  const handleCopyJSON = (index) => {
    if (!testResults || !testResults[index]) return

    const { name, config, result } = testResults[index]
    const json = JSON.stringify({ name, config, result }, null, 2)

    navigator.clipboard.writeText(json).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }).catch(() => {
      alert('Failed to copy to clipboard')
    })
  }

  const toggleExpanded = (index) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <>
      <Head>
        <title>SVG Optimizer Test Suite</title>
        <meta name="description" content="SVG Optimizer comprehensive test harness with all optimization modes" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🎨 SVG Optimizer Test Suite</h1>
          <p className={styles.subtitle}>Comprehensive testing of all optimization modes and configurations</p>
        </div>

        {!testResults && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '14px'
          }}>
            <p style={{ marginBottom: '20px' }}>This test harness runs the SVG optimizer through all modes:</p>
            <ul style={{ fontSize: '13px', display: 'inline-block', textAlign: 'left', marginBottom: '20px' }}>
              <li>Safe, Balanced, Aggressive presets</li>
              <li>Precision reduction (3 & 2 decimals)</li>
              <li>Shape conversion</li>
              <li>Path merging</li>
              <li>ID minification</li>
              <li>Output formatting</li>
            </ul>
            <p style={{ marginBottom: '20px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Total test cases: {OPTIMIZATION_CONFIGS.length}
            </p>
            {loading ? (
              <div style={{ marginTop: '20px' }}>
                <div className={styles.spinner}></div>
                <p>Running {OPTIMIZATION_CONFIGS.length} test cases...</p>
              </div>
            ) : (
              <button
                onClick={handleRunTests}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                ▶️ Run All Tests
              </button>
            )}
          </div>
        )}

        {testResults && (
          <>
            <div className={styles.controls}>
              <button
                onClick={handleRunTests}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginRight: '8px'
                }}
              >
                ▶️ Re-run Tests
              </button>

              <button
                onClick={handleCopyAllJSON}
                style={{
                  backgroundColor: '#FF9800',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}
              >
                📋 Copy All JSONs
              </button>
            </div>

            <div className={styles.resultsGrid}>
              {testResults.map((testCase, index) => (
                <div key={index} className={styles.resultCard}>
                  <div
                    className={styles.resultHeader}
                    onClick={() => toggleExpanded(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span>{expandedResults[index] ? '▼' : '▶'}</span>
                      <h3 style={{ margin: 0 }}>{testCase.name}</h3>
                    </div>
                    {testCase.result && testCase.result.optimizationResult && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          backgroundColor: testCase.result.optimizationResult === 'changes_applied' ? '#4CAF50' : '#2196F3',
                          color: 'white',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {testCase.result.optimizationResult === 'changes_applied' ? '✓ Changes Applied' : 'ℹ No Changes'}
                      </span>
                    )}
                  </div>

                  {expandedResults[index] && (
                    <div className={styles.resultContent}>
                      {testCase.result && testCase.result.stats && (
                        <div className={styles.statsSection}>
                          <h4>📊 Statistics</h4>
                          <div className={styles.statGrid}>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Original Size:</span>
                              <span className={styles.statValue}>{testCase.result.stats.originalSize} bytes</span>
                            </div>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Optimized Size:</span>
                              <span className={styles.statValue}>{testCase.result.stats.optimizedSize} bytes</span>
                            </div>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Reduction:</span>
                              <span className={styles.statValue} style={{ color: '#4CAF50' }}>
                                {testCase.result.stats.bytesRemoved} bytes ({testCase.result.stats.reductionPercent}%)
                              </span>
                            </div>
                            {testCase.result.stats.precision && testCase.result.stats.precision.reduced && (
                              <div className={styles.statItem}>
                                <span className={styles.statLabel}>Precision:</span>
                                <span className={styles.statValue}>
                                  {testCase.result.stats.precision.originalDecimals} → {testCase.result.stats.precision.optimizedDecimals}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {testCase.result && testCase.result.stepResults && testCase.result.stepResults.length > 0 && (
                        <div className={styles.stepsSection}>
                          <h4>⚙️ Optimization Steps</h4>
                          <div className={styles.stepsList}>
                            {testCase.result.stepResults.map((step, stepIdx) => (
                              <div
                                key={stepIdx}
                                className={styles.stepItem}
                                style={{
                                  borderLeft: step.executed ? '3px solid #4CAF50' : '3px solid #ccc'
                                }}
                              >
                                <div className={styles.stepName}>
                                  {step.executed ? '✓' : '○'} {step.step}
                                </div>
                                <div className={styles.stepReason}>{step.reason}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.jsonSection}>
                        <button
                          onClick={() => handleCopyJSON(index)}
                          style={{
                            backgroundColor: copiedIndex === index ? '#4CAF50' : '#2196F3',
                            color: 'white',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            marginBottom: '8px'
                          }}
                        >
                          {copiedIndex === index ? '✓ Copied!' : '📋 Copy JSON'}
                        </button>
                        <pre className={styles.jsonOutput}>
                          {JSON.stringify(
                            {
                              name: testCase.name,
                              config: testCase.config,
                              result: testCase.result
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
