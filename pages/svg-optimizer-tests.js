import React, { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/svg-optimizer-tests.module.css'

const TEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">

  <!-- ======================
       DEFINITIONS
  ====================== -->
  <defs>
    <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#845EC2"/>
      <stop offset="100%" stop-color="#D65DB1"/>
    </linearGradient>

    <radialGradient id="gradRadial" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFC75F"/>
      <stop offset="100%" stop-color="#FF6F91"/>
    </radialGradient>

    <filter id="blur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>

    <mask id="circleMask">
      <rect x="0" y="0" width="100%" height="100%" fill="black"/>
      <circle cx="200" cy="150" r="80" fill="white"/>
    </mask>

    <clipPath id="clipBox">
      <rect x="50" y="50" width="300" height="200"/>
    </clipPath>

    <style><![CDATA[
      .label {
        font-family: Arial, sans-serif;
        font-size: 14px;
        fill: #FFFFFF;
      }
      .outline {
        stroke: #333333;
        stroke-width: 2;
        fill: none;
      }
    ]]></style>
  </defs>

  <!-- ======================
       BACKGROUND
  ====================== -->
  <rect
    x="0"
    y="0"
    width="400"
    height="300"
    fill="url(#gradMain)"
  />

  <!-- ======================
       GROUP WITH TRANSFORM
  ====================== -->
  <g id="shapes" transform="translate(50 40)">
    <rect
      x="0"
      y="0"
      width="120"
      height="80"
      rx="8"
      fill="url(#gradRadial)"
      stroke="#000"
      stroke-width="1.5"
    />

    <circle
      cx="180"
      cy="40"
      r="35"
      fill="#4D96FF"
      opacity="0.85"
      filter="url(#blur)"
    />

    <ellipse
      cx="280"
      cy="40"
      rx="45"
      ry="25"
      fill="#00C9A7"
    />
  </g>

  <!-- ======================
       PATHS
  ====================== -->
  <path
    d="M60 200 L180 200 L220 260 L20 260 Z"
    fill="#F9F871"
    stroke="#333"
    stroke-width="2"
  />

  <path
    d="M260 190 C300 150 360 230 320 260"
    fill="none"
    stroke="#FF9671"
    stroke-width="3"
    stroke-linecap="round"
  />

  <!-- ======================
       USE / SYMBOL
  ====================== -->
  <symbol id="iconStar" viewBox="0 0 24 24">
    <path
      d="M12 2 L15 9 L22 9 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9 L9 9 Z"
      fill="#FFC75F"
    />
  </symbol>

  <use href="#iconStar" x="300" y="30" width="40" height="40"/>

  <!-- ======================
       CLIPPED & MASKED GROUP
  ====================== -->
  <g clip-path="url(#clipBox)" mask="url(#circleMask)">
    <rect
      x="50"
      y="120"
      width="300"
      height="140"
      fill="#845EC2"
    />
  </g>

  <!-- ======================
       TEXT
  ====================== -->
  <text
    x="200"
    y="280"
    text-anchor="middle"
    class="label"
  >
    SVG Pretty Mode Test
  </text>

  <!-- ======================
       LINE / POLY / META
  ====================== -->
  <line
    x1="20"
    y1="20"
    x2="380"
    y2="20"
    stroke="#FFFFFF"
    stroke-dasharray="6 4"
  />

  <polyline
    points="50,100 100,140 150,110 200,160"
    fill="none"
    stroke="#FF6F91"
    stroke-width="2"
  />

  <metadata>
    <author>Your Name</author>
    <purpose>Pretty mode formatter stress test</purpose>
  </metadata>

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
    name: 'Remove Unused IDs Only',
    config: {
      phase2: {
        enabled: true,
        level: 'safe',
        overrides: {
          idCleanup: { enabled: true, mode: 'unused-only' },
          removeEmptyGroups: true
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
            inputText: TEST_SVG,
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

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => {
        alert('All results copied to clipboard!')
      }).catch(() => {
        fallbackCopy(json)
      })
    } else {
      fallbackCopy(json)
    }
  }

  const handleDownloadAllJSON = () => {
    if (!testResults) return

    const allResults = testResults.map(({ name, config, result }) => ({
      name,
      config,
      result
    }))

    const json = JSON.stringify(allResults, null, 2)
    downloadJSON(json, 'svg-optimizer-all-results.json')
  }

  const handleCopyJSON = (index) => {
    if (!testResults || !testResults[index]) return

    const { name, config, result } = testResults[index]
    const json = JSON.stringify({ name, config, result }, null, 2)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      }).catch(() => {
        fallbackCopy(json)
      })
    } else {
      fallbackCopy(json)
    }
  }

  const handleDownloadJSON = (index) => {
    if (!testResults || !testResults[index]) return

    const { name, config, result } = testResults[index]
    const json = JSON.stringify({ name, config, result }, null, 2)
    const filename = `svg-optimizer-${name.toLowerCase().replace(/\s+/g, '-')}.json`
    downloadJSON(json, filename)
  }

  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      alert('Copied to clipboard!')
    } catch (err) {
      alert('Failed to copy to clipboard')
    }
    document.body.removeChild(textArea)
  }

  const downloadJSON = (jsonString, filename) => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                  fontSize: '13px',
                  marginRight: '8px'
                }}
              >
                📋 Copy All JSONs
              </button>

              <button
                onClick={handleDownloadAllJSON}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}
              >
                ⬇️ Download All JSONs
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

                      {testCase.config && testCase.config.phase2 && (
                        <div className={styles.stepsSection}>
                          <h4>⚙️ Configuration (Mode: {testCase.config.phase2.level})</h4>
                          <div style={{
                            backgroundColor: 'var(--color-background-tertiary)',
                            padding: '8px',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Precision Reduction:</strong> {testCase.config.phase2.overrides?.precisionReduction?.enabled ? `✓ (${testCase.config.phase2.overrides?.precisionReduction?.decimals} decimals)` : (testCase.config.phase2.level === 'safe' ? '❌' : testCase.config.phase2.level === 'balanced' ? '✓ (3 decimals)' : '✓ (2 decimals)')}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Remove Unused Defs:</strong> {testCase.config.phase2.level === 'safe' ? '❌' : '✓'}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Remove Empty Groups:</strong> ✓
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>ID Cleanup:</strong> {testCase.config.phase2.level === 'safe' ? '❌' : testCase.config.phase2.level === 'balanced' ? '✓ (unused-only)' : '✓ (minify)'}
                            </div>
                            <div>
                              <strong>Shape Conversion:</strong> {testCase.config.phase2.level === 'aggressive' ? '✓' : '❌'}
                            </div>
                          </div>
                        </div>
                      )}

                      {testCase.result && testCase.result.appliedOptimizations && testCase.result.appliedOptimizations.length > 0 && (
                        <div className={styles.stepsSection}>
                          <h4>✓ Applied Optimizations</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {testCase.result.appliedOptimizations.map((optimization, optIdx) => (
                              <span
                                key={optIdx}
                                style={{
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {optimization}
                              </span>
                            ))}
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
                                {step.warning && (
                                  <div style={{
                                    backgroundColor: '#FFF3CD',
                                    border: '1px solid #FFE69C',
                                    color: '#856404',
                                    padding: '8px',
                                    marginTop: '8px',
                                    borderRadius: '3px',
                                    fontSize: '12px'
                                  }}>
                                    ⚠️ {step.warning}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.jsonSection}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                              fontSize: '12px'
                            }}
                          >
                            {copiedIndex === index ? '✓ Copied!' : '📋 Copy JSON'}
                          </button>
                          <button
                            onClick={() => handleDownloadJSON(index)}
                            style={{
                              backgroundColor: '#FF9800',
                              color: 'white',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            ⬇️ Download
                          </button>
                        </div>
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
