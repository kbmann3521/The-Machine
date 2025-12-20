import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { runPhase5Tests, testRealJwksEndpoints } from '../lib/phase5TestRunner'
import { withSeoSettings } from '../lib/getSeoSettings'
import styles from '../styles/jwt-tests.module.css'

export default function Phase5TestSuite() {
  const [testResults, setTestResults] = useState(null)
  const [endpointResults, setEndpointResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedTests, setExpandedTests] = useState({})
  const [testMode, setTestMode] = useState('structured') // 'structured' or 'endpoints'
  const [customEndpoints, setCustomEndpoints] = useState('')

  const handleRunTests = async () => {
    setLoading(true)
    try {
      if (testMode === 'structured') {
        const results = await runPhase5Tests({
          skipRealJwksFetch: true,
          jwksEndpointsToTest: []
        })
        setTestResults(results)
        setEndpointResults(null)
      } else if (testMode === 'endpoints' && customEndpoints.trim()) {
        const endpoints = customEndpoints
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0)
        const results = await testRealJwksEndpoints(endpoints)
        setEndpointResults(results)
        setTestResults(null)
      }
    } catch (error) {
      console.error('Test execution error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTestResults(null)
    setEndpointResults(null)
  }, [testMode])

  const toggleTestExpanded = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }))
  }


  return (
    <>
      <Head>
        <title>Phase 5 - JWKS Auto-Discovery Tests</title>
        <meta name="description" content="Phase 5: JWKS auto-discovery and real JWT token validation" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🔐 Phase 5 Test Suite: JWKS Auto-Discovery</h1>
          <p className={styles.subtitle}>RSA Signature Verification and Real-World Token Structures</p>
        </div>

        {/* Test Mode Selector */}
        <div className={styles.testModeSelector}>
          <div className={styles.modeButtons}>
            <button
              className={`${styles.modeButton} ${testMode === 'structured' ? styles.active : ''}`}
              onClick={() => setTestMode('structured')}
            >
              📋 Structured Tests
            </button>
            <button
              className={`${styles.modeButton} ${testMode === 'endpoints' ? styles.active : ''}`}
              onClick={() => setTestMode('endpoints')}
            >
              🌐 Real JWKS Endpoints
            </button>
          </div>
          {!testResults && !endpointResults && (
            <button
              className={styles.runButton}
              onClick={handleRunTests}
              disabled={loading}
            >
              {loading ? '⏳ Running Tests...' : '▶ Run Tests'}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Running tests...</p>
          </div>
        )}

        {/* Structured Tests Mode - Empty State */}
        {testMode === 'structured' && !testResults && !loading && (
          <div className={styles.emptyState}>
            <p>Phase 5 includes 13 comprehensive test cases for JWKS auto-discovery and real-world token structures.</p>
            <p>Click "Run Tests" above to validate JWKS discovery logic, token structure validation, and real-world provider structures (Auth0, Firebase, Okta, Azure AD).</p>
          </div>
        )}

        {/* Structured Tests Mode - Results */}
        {testMode === 'structured' && testResults && !loading && (
          <>
            {/* Summary Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryContent}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Tests</span>
                  <span className={styles.summaryValue}>{testResults.summary.total}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Passed</span>
                  <span className={`${styles.summaryValue} ${styles.passed}`}>
                    ✓ {testResults.summary.passed}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Failed</span>
                  <span className={`${styles.summaryValue} ${testResults.summary.failed > 0 ? styles.failed : styles.passed}`}>
                    {testResults.summary.failed > 0 ? '✕' : '✓'} {testResults.summary.failed}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Pass Rate</span>
                  <span className={`${styles.summaryValue} ${testResults.summary.passRate === 100 ? styles.passed : styles.failed}`}>
                    {testResults.summary.passRate}%
                  </span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${testResults.summary.passRate}%` }}
                ></div>
              </div>
            </div>

            {/* Category Summary */}
            {Object.entries(testResults.summary.byCategory).length > 0 && (
              <div className={styles.categorySummary}>
                <h3>By Category</h3>
                <div className={styles.categoryGrid}>
                  {Object.entries(testResults.summary.byCategory).map(([category, stats]) => (
                    <div key={category} className={styles.categoryCard}>
                      <div className={styles.categoryName}>{category}</div>
                      <div className={styles.categoryStats}>
                        {stats.passed}/{stats.total} passed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results */}
            <div className={styles.testsList}>
              {testResults.results.map((test) => (
                <div key={test.id} className={`${styles.testCard} ${test.passed ? styles.testPassed : styles.testFailed}`}>
                  {/* Test Header */}
                  <div
                    className={styles.testHeader}
                    onClick={() => toggleTestExpanded(test.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.testStatus}>
                      <span className={styles.statusIcon}>
                        {test.passed ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className={styles.testInfo}>
                      <div className={styles.testId}>
                        {test.id}
                        <span className={styles.testAlgorithm}>{test.algorithm}</span>
                      </div>
                      <p className={styles.testDescription}>{test.description}</p>
                      {test.category && <span className={styles.testCategory}>{test.category}</span>}
                    </div>
                    <div className={styles.expandIcon}>
                      {expandedTests[test.id] ? '▼' : '▶'}
                    </div>
                  </div>

                  {/* Test Details (Expandable) */}
                  {expandedTests[test.id] && (
                    <div className={styles.testDetails}>
                      {/* Validation Steps */}
                      {test.validations && test.validations.length > 0 && (
                        <div className={styles.validationSection}>
                          <div className={styles.sectionTitle}>Validation Steps</div>
                          <div className={styles.validationList}>
                            {test.validations.map((validation, idx) => (
                              <div
                                key={idx}
                                className={`${styles.validationItem} ${validation.passed ? styles.validationPassed : styles.validationFailed}`}
                              >
                                <span className={styles.validationIcon}>
                                  {validation.passed ? '✓' : '✕'}
                                </span>
                                <div className={styles.validationContent}>
                                  <div className={styles.validationName}>{validation.name}</div>
                                  <div className={styles.validationComparison}>
                                    <div>Expected: <code>{JSON.stringify(validation.expected)}</code></div>
                                    <div>Actual: <code>{JSON.stringify(validation.actual)}</code></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Errors */}
                      {test.errors.length > 0 && (
                        <div className={styles.errorSection}>
                          <div className={styles.sectionTitle}>Errors</div>
                          <ul className={styles.errorList}>
                            {test.errors.map((error, idx) => (
                              <li key={idx} className={styles.errorItem}>
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Token Structure */}
                      {(test.actual.header || test.actual.payload) && (
                        <div className={styles.comparisonSection}>
                          {test.actual.header && (
                            <div className={styles.comparisonColumn}>
                              <div className={styles.sectionTitle}>Header</div>
                              <pre className={styles.jsonPre}>
                                {JSON.stringify(test.actual.header, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.actual.payload && (
                            <div className={styles.comparisonColumn}>
                              <div className={styles.sectionTitle}>Payload</div>
                              <pre className={styles.jsonPre}>
                                {JSON.stringify(test.actual.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {test.notes && (
                        <div className={styles.notesSection}>
                          <div className={styles.sectionTitle}>Notes</div>
                          <p className={styles.notesText}>{test.notes}</p>
                        </div>
                      )}

                      {/* Test Metadata */}
                      <div className={styles.metadataSection}>
                        <div className={styles.sectionTitle}>Test Details</div>
                        <div className={styles.metadataGrid}>
                          <div className={styles.metadataItem}>
                            <span className={styles.metadataLabel}>Algorithm:</span>
                            <span className={styles.metadataValue}>{test.algorithm}</span>
                          </div>
                          <div className={styles.metadataItem}>
                            <span className={styles.metadataLabel}>Category:</span>
                            <span className={styles.metadataValue}>{test.category}</span>
                          </div>
                          <div className={styles.metadataItem}>
                            <span className={styles.metadataLabel}>Status:</span>
                            <span className={`${styles.metadataValue} ${test.passed ? styles.passed : styles.failed}`}>
                              {test.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Real JWKS Endpoints Mode */}
        {testMode === 'endpoints' && (
          <>
            <div className={styles.endpointInput}>
              <div className={styles.inputSection}>
                <label htmlFor="endpoints">JWKS Endpoints (one per line)</label>
                <textarea
                  id="endpoints"
                  className={styles.endpointTextarea}
                  placeholder="https://example.auth0.com/.well-known/jwks.json&#10;https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
                  value={customEndpoints}
                  onChange={(e) => setCustomEndpoints(e.target.value)}
                />
              </div>
              <div className={styles.presets}>
                <button
                  className={styles.presetButton}
                  onClick={() => setCustomEndpoints(
                    'https://example.auth0.com/.well-known/jwks.json\n' +
                    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
                  )}
                >
                  📋 Sample Endpoints
                </button>
                <button
                  className={styles.runButton}
                  onClick={handleRunTests}
                  disabled={loading || !customEndpoints.trim()}
                >
                  {loading ? '⏳ Testing...' : '▶ Test Endpoints'}
                </button>
              </div>
            </div>

            {!endpointResults && !loading && (
              <div className={styles.emptyState}>
                <p>Enter JWKS endpoint URLs above and click "Test Endpoints" to check their accessibility.</p>
              </div>
            )}

            {endpointResults && !loading && (
              <>
                <div className={styles.endpointResults}>
                  <div className={styles.endpointSummary}>
                    <span className={styles.endpointCount}>
                      ✓ {endpointResults.filter(r => r.accessible).length}/{endpointResults.length} accessible
                    </span>
                  </div>

                  {endpointResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`${styles.endpointCard} ${result.accessible ? styles.endpointAccessible : styles.endpointFailed}`}
                    >
                      <div className={styles.endpointHeader}>
                        <span className={styles.endpointStatus}>
                          {result.accessible ? '✓' : '✗'}
                        </span>
                        <span className={styles.endpointUrl}>{result.endpoint}</span>
                      </div>

                      {result.accessible && (
                        <div className={styles.endpointInfo}>
                          <div className={styles.endpointStat}>
                            <span className={styles.statLabel}>Keys Available:</span>
                            <span className={styles.statValue}>{result.keysCount}</span>
                          </div>
                          {result.algos.length > 0 && (
                            <div className={styles.endpointStat}>
                              <span className={styles.statLabel}>Algorithms:</span>
                              <span className={styles.statValue}>{result.algos.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <div className={styles.endpointErrors}>
                          {result.errors.map((error, errIdx) => (
                            <div key={errIdx} className={styles.errorItem}>
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            Phase 5 Test Suite – JWKS Auto-Discovery and RSA Signature Verification |{' '}
            <code>lib/phase5TestPack.js</code>
          </p>
          <p className={styles.consoleHint}>
            💡 <strong>Learn More:</strong> See <code>PHASE_5_TESTING_GUIDE.md</code> for detailed
            instructions on testing with real JWT tokens from Auth0, Firebase, Okta, and Azure AD.
          </p>
          {testResults && (
            <p className={styles.timestamp}>
              Last run: {new Date(testResults.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
