import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/jwt-tests.module.css'

export default function JWTTestSuite() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedTests, setExpandedTests] = useState({})

  const handleRunTests = async () => {
    setLoading(true)
    try {
      // Call server-side API endpoint to run tests with Node.js crypto available
      const response = await fetch('/api/jwt-tests')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      console.error('Test execution error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTestExpanded = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }))
  }

  if (!testResults) {
    return (
      <>
        <Head>
          <title>JWT Test Suite</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>🔐 JWT Crypto Test Suite</h1>
            <p className={styles.subtitle}>Phase 3-4B: HS256/384/512, RS256/384/512 + alg:none Verification</p>
          </div>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Running tests...</p>
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px'
            }}>
              <p style={{ marginBottom: '20px' }}>Click the button below to run the JWT test suite.</p>
              <button
                onClick={handleRunTests}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ▶️ Run Tests
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  const { summary, results } = testResults

  return (
    <>
      <Head>
        <title>JWT Crypto Test Suite - Phase 3</title>
        <meta name="description" content="JWT HS256 and alg:none test harness" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🔐 JWT Crypto Test Suite</h1>
          <p className={styles.subtitle}>Phase 3-4B: HS256/384/512, RS256/384/512 + alg:none Verification</p>
          <button
            onClick={handleRunTests}
            disabled={loading}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: 'bold',
              marginTop: '15px'
            }}
          >
            {loading ? '⏳ Running Tests...' : '▶️ Run Tests'}
          </button>
        </div>

        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Tests</span>
              <span className={styles.summaryValue}>{summary.total}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Passed</span>
              <span className={`${styles.summaryValue} ${styles.passed}`}>
                ✓ {summary.passed}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Failed</span>
              <span className={`${styles.summaryValue} ${summary.failed > 0 ? styles.failed : styles.passed}`}>
                {summary.failed > 0 ? '✕' : '✓'} {summary.failed}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pass Rate</span>
              <span className={`${styles.summaryValue} ${summary.passRate === 100 ? styles.passed : styles.failed}`}>
                {summary.passRate}%
              </span>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${summary.passRate}%` }}
            ></div>
          </div>
        </div>

        {/* Test Results */}
        <div className={styles.testsList}>
          {results.map((test) => (
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

                  {/* Expected vs Actual */}
                  {Object.keys(test.expected).length > 0 && (
                    <div className={styles.comparisonSection}>
                      <div className={styles.comparisonColumn}>
                        <div className={styles.sectionTitle}>Expected</div>
                        <pre className={styles.jsonPre}>
                          {JSON.stringify(test.expected, null, 2)}
                        </pre>
                      </div>
                      <div className={styles.comparisonColumn}>
                        <div className={styles.sectionTitle}>Actual</div>
                        <pre className={styles.jsonPre}>
                          {JSON.stringify(test.actual, null, 2)}
                        </pre>
                      </div>
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

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            JWT Crypto Test Pack – Phase 3 (HS256 + alg:none) |{' '}
            <code>lib/jwtTestPack.js</code>
          </p>
          <p className={styles.consoleHint}>
            💡 <strong>Verify Integrity:</strong> Press F12 or Ctrl+Shift+J to open DevTools → Console tab.
            Each test logs detailed validation steps. Look for checkmarks (✓) or crosses (✕) to confirm validation logic.
          </p>
          <p className={styles.timestamp}>
            Last run: {new Date(testResults.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </>
  )
}
