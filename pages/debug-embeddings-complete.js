import { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/hub.module.css'

export default function EmbeddingsDebug() {
  const [secretKey, setSecretKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const testOpenAI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-openai-direct')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkEmbeddings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tools/clear-and-regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check' }),
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const clearEmbeddings = async () => {
    if (!confirm('This will clear ALL embeddings. Are you sure?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tools/clear-and-regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const regenerateEmbeddings = async () => {
    setLoading(true)
    setResults({ status: 'streaming...' })

    try {
      const response = await fetch('/api/tools/regenerate-embeddings-fixed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        setResults(error)
        setLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              setResults(data)
            } catch (e) {
              console.error('Failed to parse:', line)
            }
          }
        }
      }
    } catch (error) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Embeddings Debugging - Admin</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1>🧠 Embeddings Debugging Dashboard</h1>

          <div style={{ marginBottom: '30px' }}>
            <h2>Step 1: Test OpenAI API</h2>
            <p>
              Click below to test if OpenAI API is working correctly and returning 1536-dimensional embeddings.
            </p>
            <button
              onClick={testOpenAI}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Testing...' : 'Test OpenAI API'}
            </button>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Step 2: Check Current Embeddings</h2>
            <p>Check the status of embeddings currently in the database.</p>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Embedding Secret Key:</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your embedding secret key"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Get this from environment variable: EMBEDDING_SECRET_KEY
              </p>
            </div>
            <button
              onClick={checkEmbeddings}
              disabled={loading || !secretKey}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !secretKey ? 'not-allowed' : 'pointer',
                opacity: loading || !secretKey ? 0.6 : 1,
              }}
            >
              {loading ? 'Checking...' : 'Check Embeddings'}
            </button>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Step 3: Clear Invalid Embeddings</h2>
            <p>
              If the check shows invalid embeddings (not 1536 dimensions), clear them and regenerate from scratch.
            </p>
            <button
              onClick={clearEmbeddings}
              disabled={loading || !secretKey}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !secretKey ? 'not-allowed' : 'pointer',
                opacity: loading || !secretKey ? 0.6 : 1,
              }}
            >
              {loading ? 'Clearing...' : 'Clear All Embeddings'}
            </button>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Step 4: Regenerate Embeddings</h2>
            <p>
              This will regenerate all embeddings using the OpenAI API. It takes about 1-2 minutes for 50+ tools.
            </p>
            <button
              onClick={regenerateEmbeddings}
              disabled={loading || !secretKey}
              style={{
                padding: '10px 20px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !secretKey ? 'not-allowed' : 'pointer',
                opacity: loading || !secretKey ? 0.6 : 1,
                marginRight: '10px',
              }}
            >
              {loading ? 'Regenerating...' : 'Regenerate Embeddings'}
            </button>
            <button
              onClick={() => debugRegenerateEmbeddings()}
              disabled={loading || !secretKey}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !secretKey ? 'not-allowed' : 'pointer',
                opacity: loading || !secretKey ? 0.6 : 1,
              }}
            >
              {loading ? 'Debugging...' : 'Debug (3 tools)'}
            </button>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Click "Debug" to test embedding generation on 3 tools. Check browser console for detailed output.
            </p>
          </div>

          {results && (
            <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h2>Results:</h2>
              <pre
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '600px',
                }}
              >
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            <h3>Troubleshooting Guide:</h3>
            <ul>
              <li>
                <strong>OpenAI API test fails:</strong> Check that OPENAI_API_KEY is valid and has quota. You may
                need to check your OpenAI account for billing issues.
              </li>
              <li>
                <strong>Embeddings show 16 dimensions:</strong> This is the fallback when OpenAI API fails. Fix the
                API test first.
              </li>
              <li>
                <strong>Some embeddings stored as strings:</strong> This is normal. They're stored as JSON strings and
                automatically parsed when read.
              </li>
              <li>
                <strong>Semantic search still not working:</strong> After regenerating embeddings, clear your browser
                cache and test at /test-semantic
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        h2 {
          margin-top: 20px;
          margin-bottom: 10px;
          color: #333;
        }

        p {
          margin: 0 0 15px 0;
          color: #666;
        }

        button {
          font-size: 14px;
          font-weight: 500;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </>
  )
}
