import { useState } from 'react'

export default function TestSemantic() {
  const [input, setInput] = useState('this is a sentence')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const testDebugSemantic = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/tools/debug-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: input }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Error ${response.status}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Semantic Search Debugger</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Test Input:
          <br />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: '100%', height: '100px' }}
          />
        </label>
      </div>

      <button
        onClick={testDebugSemantic}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Testing...' : 'Test Semantic Pipeline'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '20px', whiteSpace: 'pre-wrap' }}>
          ❌ Error: {error}
        </div>
      )}

      {results && (
        <div style={{ marginTop: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
          <h2>Results</h2>
          
          <h3>📊 Classification</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.results.classification, null, 2)}
          </pre>

          <h3>🎯 Intent</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.results.intent, null, 2)}
          </pre>

          <h3>🧠 Embedding Info</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.results.embeddingGenerated, null, 2)}
          </pre>

          <h3>🔍 Semantic Prediction (Top 5)</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.results.semanticPredictionResults, null, 2)}
          </pre>

          <h3>💾 Database Status</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.results.embeddingStats, null, 2)}
          </pre>

          <h3>✅ Debug Info</h3>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results.debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
