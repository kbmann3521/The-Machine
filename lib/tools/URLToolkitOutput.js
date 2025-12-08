import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../../styles/tool-output.module.css'
import OutputTabs from '../../components/OutputTabs'

export default function URLToolkitOutput({ result, toolCategory, toolId }) {
  const [copiedField, setCopiedField] = useState(null)
  const [detectRedirects, setDetectRedirects] = useState(false)
  const [redirectData, setRedirectData] = useState(null)
  const [redirectLoading, setRedirectLoading] = useState(false)
  const [redirectError, setRedirectError] = useState(null)

  if (!result?.components) return null

  const { original, validation, components, searchParams, encoding, normalized, canonical, domain, tracking, punycode } = result

  const handleDetectRedirects = async () => {
    setDetectRedirects(!detectRedirects)

    if (detectRedirects) {
      // Toggle off
      setRedirectData(null)
      setRedirectError(null)
      return
    }

    // Toggle on - fetch redirect data
    setRedirectLoading(true)
    setRedirectError(null)

    try {
      const response = await fetch('/api/detect-redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: original }),
      })

      const data = await response.json()

      if (data.success) {
        setRedirectData(data)
      } else {
        setRedirectError(data.error || 'Failed to detect redirects')
      }
    } catch (error) {
      setRedirectError('Error: ' + error.message)
    } finally {
      setRedirectLoading(false)
    }
  }

  const handleCopyField = (value, field) => {
    let copySucceeded = false
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(() => {
        copySucceeded = true
      }).catch((err) => {
        console.debug('Clipboard API failed, trying fallback:', err.message)
        copySucceeded = fallbackCopy(value)
      })
    } else {
      copySucceeded = fallbackCopy(value)
    }
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const fallbackCopy = (text) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.setAttribute('readonly', '')
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch (err) {
      console.warn('Fallback copy failed:', err)
      return false
    }
  }

  const URLCard = ({ label, value, fieldId }) => (
    <div className={styles.copyCard}>
      <div className={styles.copyCardHeader}>
        <span className={styles.copyCardLabel}>{label}</span>
        <button
          type="button"
          className="copy-action"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopyField(value, fieldId)
          }}
          title="Copy to clipboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            minWidth: '32px',
            minHeight: '28px'
          }}
        >
          {copiedField === fieldId ? '✓' : <FaCopy />}
        </button>
      </div>
      <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px' }}>
        {value}
      </div>
    </div>
  )

  const SectionHeader = ({ emoji, title }) => (
    <div style={{
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--color-text)',
      marginBottom: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {emoji} {title}
    </div>
  )

  const outputContent = (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Original URL */}
      <div>
        <SectionHeader emoji="🔗" title="Original URL" />
        <URLCard label="Input URL" value={original} fieldId="original" />
      </div>

      {/* Validation */}
      <div>
        <SectionHeader emoji="✓" title="Validation" />
        <div style={{
          padding: '12px',
          backgroundColor: validation.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 83, 80, 0.1)',
          border: validation.isValid ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          color: validation.isValid ? '#4caf50' : '#ef5350',
        }}>
          {validation.isValid ? '✓' : '✗'} {validation.message}
        </div>
      </div>

      {/* URL Components */}
      <div>
        <SectionHeader emoji="📦" title="URL Components" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <URLCard label="Full URL (href)" value={components.href} fieldId="href" />
          <URLCard label="Protocol" value={components.protocol} fieldId="protocol" />
          <URLCard label="Hostname" value={components.hostname} fieldId="hostname" />
          <URLCard label="Port" value={components.port} fieldId="port" />
          <URLCard label="Path" value={components.pathname} fieldId="pathname" />
          {components.search && <URLCard label="Query String" value={components.search} fieldId="search" />}
          {components.hash && <URLCard label="Fragment/Hash" value={components.hash} fieldId="hash" />}
        </div>
      </div>

      {/* Query Parameters */}
      {Object.keys(searchParams).length > 0 && (
        <div>
          <SectionHeader emoji="⚙️" title="Query Parameters" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(searchParams).map(([key, value]) => (
              <URLCard key={key} label={key} value={value} fieldId={`param-${key}`} />
            ))}
          </div>
        </div>
      )}

      {/* Domain Analysis */}
      {domain && !domain.error && (
        <div>
          <SectionHeader emoji="🌐" title="Domain Analysis" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <URLCard label="Full Hostname" value={domain.hostname} fieldId="domain-hostname" />
            <URLCard label="Root Domain" value={domain.rootDomain} fieldId="domain-root" />
            <URLCard label="Subdomain" value={domain.subdomain} fieldId="domain-subdomain" />
            <URLCard label="TLD" value={domain.tld} fieldId="domain-tld" />
          </div>
        </div>
      )}

      {/* Normalized & Canonical */}
      <div>
        <SectionHeader emoji="🔄" title="Normalized & Canonical Forms" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {normalized && <URLCard label="Normalized" value={normalized} fieldId="normalized" />}
          {canonical && <URLCard label="Canonical" value={canonical} fieldId="canonical" />}
        </div>
      </div>

      {/* Tracking Parameters */}
      {tracking && !tracking.error && (
        <div>
          <SectionHeader emoji="🔍" title="Tracking Parameters" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: tracking.hasTrackingParams ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              border: tracking.hasTrackingParams ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '4px',
              fontSize: '12px',
              color: tracking.hasTrackingParams ? '#ff9800' : '#4caf50',
            }}>
              {tracking.hasTrackingParams ? `⚠️ Found ${tracking.removedParams.length} tracking param(s)` : '✓ No tracking parameters detected'}
            </div>
            {tracking.hasTrackingParams && <URLCard label="Cleaned URL" value={tracking.cleaned} fieldId="tracking-cleaned" />}
          </div>
        </div>
      )}

      {/* Punycode */}
      {punycode && !punycode.error && (
        <div>
          <SectionHeader emoji="🔤" title="International Domain (Punycode)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <URLCard label="Unicode (Decoded)" value={punycode.decoded} fieldId="punycode-decoded" />
            <URLCard label="ASCII (Encoded)" value={punycode.encoded} fieldId="punycode-encoded" />
          </div>
        </div>
      )}

      {/* Encoding/Decoding */}
      <div>
        <SectionHeader emoji="🔐" title="URL Encoding" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <URLCard label="Encoded" value={encoding.encoded} fieldId="url-encoded" />
          <URLCard label="Decoded" value={encoding.decoded} fieldId="url-decoded" />
        </div>
      </div>
    </div>
  )

  return <OutputTabs
    tabs={[
      {
        id: 'output',
        label: 'Analysis',
        content: outputContent,
        contentType: 'component',
      },
      {
        id: 'json',
        label: 'JSON',
        content: JSON.stringify(result, null, 2),
        contentType: 'json',
      },
    ]}
    toolCategory={toolCategory}
    toolId={toolId}
    showCopyButton={true}
  />
}
