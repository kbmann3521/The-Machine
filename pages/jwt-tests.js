import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { runJWTTests } from '../lib/jwtTestRunner'
import styles from '../styles/jwt-tests.module.css'

export default function JWTTestSuite() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedTests, setExpandedTests] = useState({})

  useEffect(() => {
    const runTests = async () => {
      setLoading(true)
      try {
        const results = runJWTTests()
        setTestResults(results)
      } catch (error) {
        console.error('Test execution error:', error)
      } finally {
        setLoading(false)
      }
    }

    runTests()
  }, [])

  const toggleTestExpanded = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }))
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>JWT Test Suite</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Running tests...</p>
          </div>
        </div>
      </>
    )
  }

  if (!testResults) {
    return (
      <>
        <Head>
          <title>JWT Test Suite</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <p>❌ Failed to run tests</p>
          </div>
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
          <p className={styles.subtitle}>Phase 3: HS256 + alg:none Verification</p>
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
          <p className={styles.timestamp}>
            Last run: {new Date(testResults.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </>
  )
}
