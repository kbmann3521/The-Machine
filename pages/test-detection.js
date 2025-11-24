import { useEffect, useState } from 'react'
import styles from '../styles/test-detection.module.css'

const TEST_CASES = [
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
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 })

  useEffect(() => {
    const runTests = async () => {
      setLoading(true)
      const testResults = []

      for (const testCase of TEST_CASES) {
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

    runTests()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Detection Pipeline Test Suite</h1>
        {!loading && (
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

      {loading ? (
        <div className={styles.loading}>Running tests...</div>
      ) : (
        <div className={styles.resultsTable}>
          <table>
            <thead>
              <tr>
                <th className={styles.resultCol}>Result</th>
                <th className={styles.inputCol}>Input</th>
                <th className={styles.expectedCol}>Expected</th>
                <th className={styles.detectedCol}>Detected</th>
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
                </tr>
              ))}
            </tbody>
          </table>
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
