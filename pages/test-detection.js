import { useEffect, useState } from 'react'
import styles from '../styles/test-detection.module.css'

const DEFAULT_TEST_CASES = [
  { input: 'please rewrite this to sound more professional', expected: 'text-toolkit' },
  { input: '   Hello    world! This   has   extra spaces.   ', expected: 'clean-text' },
  { input: '<p>Hello <b>world</b></p>', expected: 'plain-text-stripper' },
  { input: '🔥', expected: 'ascii-unicode-converter' },
  { input: 'uryyb jbeyq', expected: 'rot13-cipher' },
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
  { input: 'https://example.com/products?id=22&color=red', expected: 'url-parser' },
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
  { input: '1100101011110001', expected: 'binary-converter' },
  { input: '(5 + 3) * 12 / 4', expected: 'math-evaluator' },
  { input: 'Hello world', expected: 'checksum-calculator' },
  { input: '1024 KB', expected: 'file-size-converter' },
  { input: '1672531200', expected: 'timestamp-converter' },
  { input: '2024-01-15T14:30:00Z', expected: 'timezone-converter' },
  { input: 'name,age\njohn,30', expected: 'csv-json-converter' },
  { input: 'pdf', expected: 'mime-type-lookup' },
  { input: '100inches', expected: 'unit-converter' },
  { input: '550e8400-e29b-41d4-a716-446655440000', expected: 'uuid-validator' },
  { input: 'john@example.com', expected: 'email-validator' },
  { input: 'application/json', expected: 'mime-type-lookup' },
  { input: '# Hello World', expected: 'markdown-html-converter' },
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

  // Load test cases from database on mount
  useEffect(() => {
    loadTestCases()
  }, [])

  const loadTestCases = async () => {
    try {
      setLoadingCases(true)
      const response = await fetch('/api/test-detection/cases')
      const data = await response.json()

      if (data.cases && data.cases.length > 0) {
        // Convert database cases (with id field) to local format
        const formattedCases = data.cases.map(c => ({
          id: c.id,
          input: c.input,
          expected: c.expected,
        }))
        setTestCases(formattedCases)
      }
    } catch (error) {
      console.error('Error loading test cases:', error)
      // Fallback to default cases
    } finally {
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
        const response = await fetch('/api/tools/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputText: testCase.input }),
        })

        const data = await response.json()
        const detectedTool = data.predictedTools?.[0]?.toolId || 'unknown'
        const passed = detectedTool === testCase.expected

        testResults.push({
          input: testCase.input,
          expected: testCase.expected,
          detected: detectedTool,
          passed,
        })
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

  const handleAddOrUpdate = () => {
    if (!formData.input.trim() || !formData.expected.trim()) {
      alert('Please fill in both fields')
      return
    }

    if (editingIndex !== null) {
      const updated = [...testCases]
      updated[editingIndex] = formData
      setTestCases(updated)
      setEditingIndex(null)
    } else {
      setTestCases([...testCases, formData])
    }

    setFormData({ input: '', expected: '' })
    setShowAddForm(false)
  }

  const handleEdit = (index) => {
    setFormData(testCases[index])
    setEditingIndex(index)
    setShowAddForm(true)
  }

  const handleDelete = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    setFormData({ input: '', expected: '' })
    setEditingIndex(null)
    setShowAddForm(false)
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

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          {!loading ? (
            <button className={styles.startButton} onClick={runTests}>
              ▶ Start Tests
            </button>
          ) : (
            <button className={styles.startButton} disabled>
              Running...
            </button>
          )}
          <span className={styles.caseCount}>{testCases.length} test cases</span>
        </div>
        <button className={styles.addButton} onClick={() => setShowAddForm(true)} disabled={loading}>
          + Add Test Case
        </button>
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
                  <tr key={idx}>
                    <td className={styles.indexCol}>{idx + 1}</td>
                    <td className={styles.inputCol}>
                      <code>{truncateString(testCase.input, 50)}</code>
                    </td>
                    <td className={styles.expectedCol}>
                      <code>{testCase.expected}</code>
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
