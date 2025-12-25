import React, { useEffect, useState } from 'react'
import { withSeoSettings } from '../lib/getSeoSettings'
import styles from '../styles/test-detection.module.css'

const DEFAULT_TEST_CASES = [
  { input: 'please rewrite this to sound more professional', expected: 'text-toolkit' },
  { input: '   Hello    world! This   has   extra spaces.   ', expected: 'clean-text' },
  { input: '🔥', expected: 'ascii-unicode-converter' },
  { input: 'Khoor Zruog', expected: 'caesar-cipher' },
  { input: 'apple banana apple orange banana apple', expected: 'word-frequency-counter' },
  { input: 'const x={name:"john",age:30};function hi(){console.log("hello")}', expected: 'js-formatter' },
  { input: '<div><p>Hello</p></div>', expected: 'html-formatter' },
  { input: '# Hello\n<div>hi</div>', expected: 'markdown-html-formatter' },
  { input: '<root><item>1</item></root>', expected: 'xml-formatter' },
  { input: 'server:\n  port: 3000', expected: 'yaml-formatter' },
  { input: 'select * from users where id=3', expected: 'sql-formatter' },
  { input: '^[A-Za-z0-9_.+-]+@[A-Za-z0-9-]+\\.[A-Za-z0-9-.]+$', expected: 'regex-tester' },
  { input: '$.store.book[0].title', expected: 'json-path-extractor' },
  { input: 'SGVsbG8gd29ybGQ=', expected: 'base64-converter' },
  { input: 'hello world?', expected: 'url-converter' },
  { input: 'Tom & Jerry > Mickey & Minnie', expected: 'html-entities-converter' },
  {
    input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiJ9.sig',
    expected: 'jwt-decoder',
  },
  { input: '404', expected: 'http-status-lookup' },
  { input: 'Content-Type: application/json', expected: 'http-header-parser' },
  { input: '192.168.0.1', expected: 'ip-validator' },
  { input: '3232235521', expected: 'ip-integer-converter' },
  { input: '192.168.0.0/24', expected: 'ip-range-calculator' },
  { input: '#FF5733', expected: 'color-converter' },
  { input: '<svg width="100" height="100"><rect width="100" height="100"/></svg>', expected: 'svg-optimizer' },
  { input: '1234567.89123', expected: 'number-formatter' },
  { input: '101011', expected: 'base-converter' },
  { input: '(5 + 3) * 12 / 4', expected: 'math-evaluator' },
  { input: 'Hello world', expected: 'checksum-calculator' },
  { input: '1024 KB', expected: 'file-size-converter' },
  { input: '2024-01-15T14:30:00Z', expected: 'time-normalizer' },
  { input: 'name,age\njohn,30', expected: 'csv-json-converter' },
  { input: 'pdf', expected: 'mime-type-lookup' },
  { input: '100inches', expected: 'unit-converter' },
  { input: '550e8400-e29b-41d4-a716-446655440000', expected: 'uuid-validator' },
  { input: 'john@example.com', expected: 'email-validator' },
  { input: 'application/json', expected: 'mime-type-lookup' },
  { input: '# Hello World', expected: 'markdown-html-formatter' },
]

export default function TestDetection() {
  const [testCases, setTestCases] = useState(DEFAULT_TEST_CASES)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ input: '', expected: '' })
  const [loadingCases, setLoadingCases] = useState(true)
  const [singleTestResult, setSingleTestResult] = useState(null)
  const [singleTestLoading, setSingleTestLoading] = useState(false)
  const [testResultIndex, setTestResultIndex] = useState(null)
  const [regeneratingCases, setRegeneratingCases] = useState(false)

  // Load test cases from database on mount
  useEffect(() => {
    loadTestCases()
  }, [])

  const loadTestCases = async () => {
    try {
      setLoadingCases(true)

      // Use Promise.race for timeout instead of AbortController to be more reliable
      const fetchPromise = fetch('/api/test-detection/cases')
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 2000)
      )

      let response
      try {
        response = await Promise.race([fetchPromise, timeoutPromise])
      } catch (fetchErr) {
        // Fetch failed or timed out - silently use defaults
        console.debug('Test cases fetch unavailable:', fetchErr?.message)
        setLoadingCases(false)
        return
      }

      if (!response?.ok) {
        // Bad response - silently use defaults
        console.debug('Test cases API returned error:', response?.status)
        setLoadingCases(false)
        return
      }

      let data
      try {
        data = await response.json()
      } catch (jsonErr) {
        console.debug('Failed to parse test cases response')
        setLoadingCases(false)
        return
      }

      if (data?.cases && Array.isArray(data.cases) && data.cases.length > 0) {
        // Convert database cases (with id field) to local format
        const formattedCases = data.cases.map(c => ({
          id: c.id,
          input: c.input,
          expected: c.expected,
        }))
        setTestCases(formattedCases)
      }

      setLoadingCases(false)
    } catch (error) {
      // Last resort fallback - silently fail
      console.debug('Unexpected error in loadTestCases:', error?.message)
      setLoadingCases(false)
    }
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])
    setProgress(0)
    const testResults = []

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      try {
        const fetchPromise = fetch('/api/tools/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputText: testCase.input }),
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )

        let response
        try {
          response = await Promise.race([fetchPromise, timeoutPromise])
        } catch (err) {
          // Fetch failed or timed out
          testResults.push({
            input: testCase.input,
            expected: testCase.expected,
            detected: 'error',
            passed: false,
          })
          setProgress(((i + 1) / testCases.length) * 100)
          continue
        }

        if (!response?.ok) {
          testResults.push({
            input: testCase.input,
            expected: testCase.expected,
            detected: 'error',
            passed: false,
          })
        } else {
          try {
            const data = await response.json()
            const detectedTool = data.predictedTools?.[0]?.toolId || 'unknown'
            const passed = detectedTool === testCase.expected

            testResults.push({
              input: testCase.input,
              expected: testCase.expected,
              detected: detectedTool,
              passed,
            })
          } catch (jsonErr) {
            testResults.push({
              input: testCase.input,
              expected: testCase.expected,
              detected: 'error',
              passed: false,
            })
          }
        }
      } catch (error) {
        testResults.push({
          input: testCase.input,
          expected: testCase.expected,
          detected: 'error',
          passed: false,
        })
      }

      setProgress(((i + 1) / testCases.length) * 100)
    }

    setResults(testResults)
    const passed = testResults.filter(r => r.passed).length
    setStats({
      total: testResults.length,
      passed,
      failed: testResults.length - passed,
    })
    setLoading(false)
  }

  const handleAddOrUpdate = async () => {
    if (!formData.input.trim() || !formData.expected.trim()) {
      alert('Please fill in both fields')
      return
    }

    try {
      if (editingId !== null) {
        // Update existing case
        const fetchPromise = fetch('/api/test-detection/cases', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            input: formData.input,
            expected: formData.expected,
          }),
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )

        let response
        try {
          response = await Promise.race([fetchPromise, timeoutPromise])
        } catch (err) {
          alert('Failed to update case. Database may be temporarily unavailable.')
          return
        }

        if (!response?.ok) {
          alert('Failed to update case. Database may be temporarily unavailable.')
          return
        }

        try {
          const { case: updatedCase } = await response.json()
          const updated = testCases.map(c =>
            c.id === editingId ? updatedCase : c
          )
          setTestCases(updated)
        } catch (jsonErr) {
          alert('Failed to process update. Please try again.')
          return
        }

        setEditingIndex(null)
        setEditingId(null)
      } else {
        // Add new case
        const fetchPromise = fetch('/api/test-detection/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: formData.input,
            expected: formData.expected,
          }),
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )

        let response
        try {
          response = await Promise.race([fetchPromise, timeoutPromise])
        } catch (err) {
          alert('Failed to add case. Database may be temporarily unavailable.')
          return
        }

        if (!response?.ok) {
          alert('Failed to add case. Database may be temporarily unavailable.')
          return
        }

        try {
          const { case: newCase } = await response.json()
          setTestCases([...testCases, newCase])
        } catch (jsonErr) {
          alert('Failed to process response. Please try again.')
          return
        }
      }

      setFormData({ input: '', expected: '' })
      setShowAddForm(false)
    } catch (error) {
      console.debug('Error saving test case:', error?.message)
      alert('Failed to save test case. Please try again.')
    }
  }

  const handleEdit = (index) => {
    const testCase = testCases[index]
    setFormData({ input: testCase.input, expected: testCase.expected })
    setEditingIndex(index)
    setEditingId(testCase.id || null)
    setShowAddForm(true)
  }

  const handleDelete = async (index) => {
    const testCaseId = testCases[index].id

    if (!testCaseId) {
      // Local-only test case, just remove it
      setTestCases(testCases.filter((_, i) => i !== index))
      return
    }

    try {
      const fetchPromise = fetch('/api/test-detection/cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testCaseId }),
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      let response
      try {
        response = await Promise.race([fetchPromise, timeoutPromise])
      } catch (err) {
        alert('Failed to delete case. Database may be temporarily unavailable.')
        return
      }

      if (!response?.ok) {
        alert('Failed to delete case. Database may be temporarily unavailable.')
        return
      }

      setTestCases(testCases.filter((_, i) => i !== index))
    } catch (error) {
      console.debug('Error deleting test case:', error?.message)
      alert('Failed to delete test case. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData({ input: '', expected: '' })
    setEditingIndex(null)
    setEditingId(null)
    setShowAddForm(false)
  }

  const testSingleCase = async (testCase, index) => {
    try {
      setSingleTestLoading(true)
      setSingleTestResult(null)
      setTestResultIndex(index)

      const fetchPromise = fetch('/api/tools/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: testCase.input }),
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )

      let response
      try {
        response = await Promise.race([fetchPromise, timeoutPromise])
      } catch (fetchErr) {
        setSingleTestResult({
          input: testCase.input,
          expected: testCase.expected,
          detected: 'error',
          passed: false,
          error: 'Service unavailable',
        })
        setSingleTestLoading(false)
        return
      }

      if (!response?.ok) {
        setSingleTestResult({
          input: testCase.input,
          expected: testCase.expected,
          detected: 'error',
          passed: false,
          error: 'Prediction failed',
        })
        setSingleTestLoading(false)
        return
      }

      let data
      try {
        data = await response.json()
      } catch (jsonErr) {
        setSingleTestResult({
          input: testCase.input,
          expected: testCase.expected,
          detected: 'error',
          passed: false,
          error: 'Invalid response',
        })
        setSingleTestLoading(false)
        return
      }

      const { predictedTools } = data
      const bestMatch = predictedTools?.[0]

      const passed = bestMatch?.toolId === testCase.expected
      setSingleTestResult({
        input: testCase.input,
        expected: testCase.expected,
        detected: bestMatch?.toolId || 'unknown',
        passed,
        confidence: bestMatch?.similarity || 0,
      })
      setSingleTestLoading(false)
    } catch (error) {
      console.debug('Single test error:', error?.message)
      setSingleTestResult({
        input: testCase.input,
        expected: testCase.expected,
        detected: 'error',
        passed: false,
        error: 'Test failed',
      })
      setSingleTestLoading(false)
    }
  }

  const seedDefaultCases = async () => {
    const message = testCases.length > 0
      ? 'This will replace all test cases with the default 42 test cases. Continue?'
      : 'This will add all 42 default test cases. Continue?'

    if (!window.confirm(message)) {
      return
    }

    try {
      setLoadingCases(true)

      // If cases exist, delete them first
      if (testCases.length > 0) {
        for (const testCase of testCases) {
          if (testCase.id) {
            try {
              const fetchPromise = fetch('/api/test-detection/cases', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: testCase.id }),
              })

              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
              )

              await Promise.race([fetchPromise, timeoutPromise])
            } catch (err) {
              console.debug('Failed to delete case during seeding:', err?.message)
              // Continue with next case
            }
          }
        }
      }

      // Add each default case
      for (const defaultCase of DEFAULT_TEST_CASES) {
        try {
          const fetchPromise = fetch('/api/test-detection/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: defaultCase.input,
              expected: defaultCase.expected,
            }),
          })

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )

          const response = await Promise.race([fetchPromise, timeoutPromise])

          if (!response?.ok) {
            console.debug('Failed to add default case:', defaultCase.input)
          }
        } catch (err) {
          console.debug('Error adding default case:', err?.message)
          // Continue with next case
        }
      }

      // Reload cases
      await loadTestCases()
      alert('Default test cases loaded successfully!')
    } catch (error) {
      console.debug('Error seeding defaults:', error?.message)
      alert('Failed to load default cases. Please try again.')
    } finally {
      setLoadingCases(false)
    }
  }

  const handleRegenerateCases = async () => {
    const confirmMessage = 'This will generate new test inputs for all available tools using OpenAI. This will replace all current test cases. Continue?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setRegeneratingCases(true)

      const fetchPromise = fetch('/api/test-detection/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 60000)
      )

      let response
      try {
        response = await Promise.race([fetchPromise, timeoutPromise])
      } catch (err) {
        alert('Failed to regenerate cases. Request timed out. Please try again.')
        setRegeneratingCases(false)
        return
      }

      if (!response?.ok) {
        alert('Failed to regenerate test cases. Please try again.')
        setRegeneratingCases(false)
        return
      }

      try {
        const data = await response.json()

        if (!data.success) {
          alert(`Failed to regenerate: ${data.error}`)
          setRegeneratingCases(false)
          return
        }

        if (data.cases && Array.isArray(data.cases)) {
          setTestCases(data.cases)
          const message = data.failed && data.failed > 0
            ? `Successfully regenerated ${data.generated} test cases (${data.failed} tools failed)`
            : `Successfully regenerated ${data.generated} test cases for all tools!`
          alert(message)
        }
      } catch (jsonErr) {
        alert('Failed to process regeneration response. Please try again.')
      }
    } catch (error) {
      console.debug('Error regenerating cases:', error?.message)
      alert('Failed to regenerate test cases. Please try again.')
    } finally {
      setRegeneratingCases(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Detection Pipeline Test Suite</h1>
        {results.length > 0 && !loading && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Total:</span>
              <span className={styles.value}>{stats.total}</span>
            </div>
            <div className={`${styles.stat} ${styles.passed}`}>
              <span className={styles.label}>Passed:</span>
              <span className={styles.value}>{stats.passed}</span>
            </div>
            <div className={`${styles.stat} ${styles.failed}`}>
              <span className={styles.label}>Failed:</span>
              <span className={styles.value}>{stats.failed}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Success Rate:</span>
              <span className={styles.value}>
                {((stats.passed / stats.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {loadingCases && (
        <div className={styles.loadingMessage}>Loading test cases...</div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          {!loading ? (
            <button className={styles.startButton} onClick={runTests} disabled={loadingCases}>
              ▶ Start Tests
            </button>
          ) : (
            <button className={styles.startButton} disabled>
              Running...
            </button>
          )}
          <span className={styles.caseCount}>{testCases.length} test cases</span>
        </div>
        <div className={styles.controlsRight}>
          <button className={styles.seedButton} onClick={seedDefaultCases} disabled={loadingCases}>
            📋 Reset to Defaults
          </button>
          <button className={styles.addButton} onClick={() => setShowAddForm(true)} disabled={loading || loadingCases}>
            + Add Test Case
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>
            {Math.floor(progress)}% ({Math.floor((progress / 100) * testCases.length)} / {testCases.length})
          </span>
        </div>
      )}

      <div className={styles.testCasesSection}>
        <h2>Test Cases</h2>
        <div className={styles.testCasesList}>
          {testCases.length === 0 ? (
            <p className={styles.emptyMessage}>No test cases. Click "Add Test Case" to get started.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className={styles.indexCol}>#</th>
                  <th className={styles.inputCol}>Input</th>
                  <th className={styles.expectedCol}>Expected Tool</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testCases.map((testCase, idx) => (
                  <React.Fragment key={`case-${testCase.id || idx}`}>
                    <tr>
                      <td className={styles.indexCol}>{idx + 1}</td>
                      <td className={styles.inputCol}>
                        <code>{truncateString(testCase.input, 50)}</code>
                      </td>
                      <td className={styles.expectedCol}>
                        <code>{testCase.expected}</code>
                      </td>
                      <td className={styles.actionsCol}>
                        <button
                          className={styles.testIcon}
                          onClick={() => testSingleCase(testCase, idx)}
                          disabled={singleTestLoading}
                          title="Test this case"
                        >
                          ▶
                        </button>
                        <button
                          className={styles.editIcon}
                          onClick={() => handleEdit(idx)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className={styles.deleteIcon}
                          onClick={() => handleDelete(idx)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    {singleTestResult && testResultIndex === idx && (
                      <tr className={styles.resultRow}>
                        <td colSpan="4">
                          <div className={`${styles.singleResult} ${singleTestResult.passed ? styles.resultPassed : styles.resultFailed}`}>
                            <div className={styles.resultInlineRow}>
                              <span className={styles.resultInlineLabel}>Expected:</span>
                              <code className={styles.resultInlineValue}>{singleTestResult.expected}</code>
                            </div>
                            <div className={styles.resultInlineRow}>
                              <span className={styles.resultInlineLabel}>Detected:</span>
                              <code className={styles.resultInlineValue}>{singleTestResult.detected}</code>
                            </div>
                            <div className={styles.resultInlineRow}>
                              <span className={styles.resultInlineLabel}>Confidence:</span>
                              <span className={styles.resultInlineValue}>{(singleTestResult.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className={styles.resultInlineRow}>
                              <span className={styles.resultInlineLabel}>Result:</span>
                              <span className={styles.resultInlineValue}>
                                {singleTestResult.passed ? (
                                  <span className={styles.checkmark}>✓ PASS</span>
                                ) : (
                                  <span className={styles.cross}>✗ FAIL</span>
                                )}
                              </span>
                            </div>
                            <button className={styles.closeInlineResultButton} onClick={() => setSingleTestResult(null)}>
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingIndex !== null ? 'Edit Test Case' : 'Add Test Case'}</h2>
            <div className={styles.formGroup}>
              <label>Input:</label>
              <textarea
                value={formData.input}
                onChange={e => setFormData({ ...formData, input: e.target.value })}
                placeholder="Enter test input"
                rows="4"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Expected Tool ID:</label>
              <input
                type="text"
                value={formData.expected}
                onChange={e => setFormData({ ...formData, expected: e.target.value })}
                placeholder="e.g., text-toolkit"
              />
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.saveButton} onClick={handleAddOrUpdate}>
                {editingIndex !== null ? 'Update' : 'Add'}
              </button>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className={styles.resultsTable}>
          <table>
            <thead>
              <tr>
                <th className={styles.resultCol}>Result</th>
                <th className={styles.inputCol}>Input</th>
                <th className={styles.expectedCol}>Expected</th>
                <th className={styles.detectedCol}>Detected</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx} className={result.passed ? styles.rowPassed : styles.rowFailed}>
                  <td className={styles.resultCol}>
                    <span className={result.passed ? styles.checkmark : styles.cross}>
                      {result.passed ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className={styles.inputCol}>
                    <code>{truncateString(result.input, 50)}</code>
                  </td>
                  <td className={styles.expectedCol}>
                    <code>{result.expected}</code>
                  </td>
                  <td className={styles.detectedCol}>
                    <code>{result.detected}</code>
                  </td>
                  <td className={styles.actionsCol}>
                    <button
                      className={styles.editIcon}
                      onClick={() => handleEdit(idx)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className={styles.deleteIcon}
                      onClick={() => handleDelete(idx)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className={styles.noResults}>
          <p>Click "Start Tests" to run the detection pipeline on {testCases.length} test cases</p>
        </div>
      )}
    </div>
  )
}

function truncateString(str, maxLength) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...'
  }
  return str
}

export async function getServerSideProps() {
  return withSeoSettings()
}
