import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import UniversalInput from '../components/UniversalInput'
import ToolOutputPanel from '../components/ToolOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import styles from '../styles/single-tool-page.module.css'

export default function JWTDecoderPage() {
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [configOptions, setConfigOptions] = useState({})

  const toolId = 'jwt-decoder'

  const handleInputChange = useCallback((text) => {
    setInputText(text)
    handleRunTool(text)
  }, [])

  const handleRunTool = useCallback(async (textToUse) => {
    if (!textToUse || !textToUse.trim()) {
      setOutputResult(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // JWT Decoder uses client-side decoding
      const { jwtDecoderClient } = await import('../lib/jwtDecoderClient.js')
      const result = jwtDecoderClient(textToUse, configOptions)
      setOutputResult(result)
    } catch (err) {
      console.error('Error decoding JWT:', err)
      setError(err.message || 'Failed to decode JWT')
      setOutputResult(null)
    } finally {
      setLoading(false)
    }
  }, [configOptions])

  const handleConfigChange = useCallback((newConfig) => {
    setConfigOptions(newConfig)
    handleRunTool(inputText)
  }, [inputText, handleRunTool])

  return (
    <>
      <Head>
        <title>JWT Decoder Tool</title>
        <meta name="description" content="Decode and analyze JSON Web Tokens with signature verification and JWE decryption support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>JWT Decoder</h1>
            <p className={styles.description}>Decode and analyze JSON Web Tokens, verify signatures, and decrypt JWE tokens</p>
          </div>
          <ThemeToggle />
        </header>

        <div className={styles.mainContent}>
          <section className={styles.inputSection}>
            <h2 className={styles.sectionTitle}>Input</h2>
            <UniversalInput
              placeholder="Paste your JWT token here..."
              value={inputText}
              onChange={handleInputChange}
              supportedFileTypes={['text/plain', 'application/json']}
            />
          </section>

          <section className={styles.outputSection}>
            <h2 className={styles.sectionTitle}>Output</h2>
            {error && (
              <div className={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            )}
            {loading && (
              <div className={styles.loadingBox}>
                <p>Processing...</p>
              </div>
            )}
            {!loading && !error && (
              <ToolOutputPanel
                result={outputResult}
                loading={loading}
                error={error}
                toolId={toolId}
                configOptions={configOptions}
                onConfigChange={handleConfigChange}
                inputText={inputText}
              />
            )}
          </section>
        </div>
      </div>
    </>
  )
}
