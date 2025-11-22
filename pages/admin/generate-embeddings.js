import React, { useState } from 'react'
import Head from 'next/head'
import styles from '../../styles/hub.module.css'

export default function GenerateEmbeddings() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState(null)
  const [secretKey, setSecretKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(true)

  const handleGenerateEmbeddings = async () => {
    if (!secretKey) {
      setStatus('Please enter the embedding secret key')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setStatus('Starting embedding generation...')
    setResults(null)

    try {
      const response = await fetch('/api/tools/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to start embedding generation')
      }

      // Stream the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)
            if (data.status === 'processing') {
              setProgress(data.progress || 0)
              setStatus(`Processing: ${data.processed}/${data.total} tools`)
            } else if (data.status === 'complete') {
              setResults(data)
              setStatus(
                `Completed: ${data.processed} processed, ${data.failed} failed, ${data.skipped} skipped`
              )
              setProgress(100)
            }
          } catch (e) {
            console.log('Could not parse line:', line)
          }
        }
      }

      setIsGenerating(false)
      setShowKeyInput(false)
    } catch (error) {
      setStatus(`Error: ${error.message}`)
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Head>
        <title>Generate Tool Embeddings - Admin</title>
      </Head>

      <div className={styles.layout}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Generate Tool Embeddings</h1>
            <p>Generate semantic embeddings for all tools in your database</p>
          </div>
        </div>

        <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--color-background-secondary)',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2>Embedding Generation</h2>

            {showKeyInput && !isGenerating && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Embedding Secret Key:
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your embedding secret key"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'monospace',
                    marginBottom: '16px',
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Get this key from your environment variables: EMBEDDING_SECRET_KEY
                </p>
              </div>
            )}

            {status && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--color-background-primary)',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                {status}
              </div>
            )}

            {progress > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                  Progress: {progress}%
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--color-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: '#0066cc',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {results && (
              <div
                style={{
                  background: 'var(--color-background-tertiary)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                <strong>Results:</strong>
                <ul style={{ marginLeft: '20px' }}>
                  <li>✓ Processed: {results.processed}</li>
                  <li>✗ Failed: {results.failed}</li>
                  <li>⊘ Skipped: {results.skipped}</li>
                  <li>Total: {results.total}</li>
                </ul>
                {results.errors && results.errors.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Errors:</strong>
                    <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                      {results.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>
                          {error.toolId}: {error.error}
                        </li>
                      ))}
                    </ul>
                    {results.errors.length > 5 && (
                      <p>... and {results.errors.length - 5} more errors</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleGenerateEmbeddings}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '12px',
                background: isGenerating ? 'var(--color-border)' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? 'Generating...' : 'Start Generation'}
            </button>

            <div style={{ marginTop: '30px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <h3>About Embeddings</h3>
              <p>
                Embeddings are numerical representations of your tool descriptions that allow semantic
                search to work. This process:
              </p>
              <ul>
                <li>Converts each tool's name and description into a 1,536-dimensional vector</li>
                <li>Uses OpenAI's text-embedding-3-small model</li>
                <li>Takes approximately 30-60ms per tool</li>
                <li>Costs ~$0.0001 per tool</li>
              </ul>
              <p>Once generated, semantic search will work instantly with no additional API calls.</p>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          main {
            padding: 20px !important;
          }
        }
      `}</style>
    </>
  )
}
