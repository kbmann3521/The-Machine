import { useState } from 'react'
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

  const { original, validation, components, searchParams, encoding, canonical, domain, tracking, punycode } = result

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
      {/* URL Safety Grade */}
      {result.urlSafety && (
        <div>
          <SectionHeader emoji="🛡️" title="URL Safety Grade" />
          <div style={{
            padding: '16px',
            backgroundColor: result.urlSafety.score >= 85 ? 'rgba(76, 175, 80, 0.1)' : result.urlSafety.score >= 50 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(239, 83, 80, 0.1)',
            border: result.urlSafety.score >= 85 ? '1px solid rgba(76, 175, 80, 0.3)' : result.urlSafety.score >= 50 ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '6px',
          }}>
            {/* Grade Display */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: result.urlSafety.score >= 85 ? '#4caf50' : result.urlSafety.score >= 50 ? '#ff9800' : '#ef5350',
                minWidth: '60px',
                textAlign: 'center',
              }}>
                {result.urlSafety.grade}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--color-text)',
                  marginBottom: '4px',
                }}>
                  {result.urlSafety.category}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  Safety Score: {result.urlSafety.score}/100
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${result.urlSafety.score}%`,
                    backgroundColor: result.urlSafety.score >= 85 ? '#4caf50' : result.urlSafety.score >= 50 ? '#ff9800' : '#ef5350',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Summary Issues */}
            {result.urlSafety.summary && result.urlSafety.summary.length > 0 && (
              <div style={{
                paddingTop: '12px',
                borderTop: result.urlSafety.score >= 85 ? '1px solid rgba(76, 175, 80, 0.3)' : result.urlSafety.score >= 50 ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(239, 83, 80, 0.3)',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}>
                  Issues Detected:
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {result.urlSafety.summary.map((issue, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ minWidth: '16px' }}>•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {result.urlSafety.recommendation && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: result.urlSafety.score >= 85 ? '1px solid rgba(76, 175, 80, 0.3)' : result.urlSafety.score >= 50 ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(239, 83, 80, 0.3)',
                fontSize: '12px',
                fontStyle: 'italic',
                color: 'var(--color-text)',
              }}>
                {result.urlSafety.recommendation}
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* SEO Analysis */}
      {result.seoAnalysis && !result.seoAnalysis.error && (
        <div>
          <SectionHeader emoji="📊" title="SEO Analysis" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* SEO Score Card */}
            <div style={{
              padding: '12px',
              backgroundColor: result.seoAnalysis.seoFriendly ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
              border: result.seoAnalysis.seoFriendly ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              <div style={{
                color: result.seoAnalysis.seoFriendly ? '#4caf50' : '#ff9800',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                {result.seoAnalysis.seoFriendly ? '✓ SEO Friendly' : '⚠️ SEO Issues Detected'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>{result.seoAnalysis.usesHttps ? '✓' : '✗'} HTTPS: {result.seoAnalysis.usesHttps ? 'Yes' : 'No'}</div>
                <div>{result.seoAnalysis.hasSortedQueryParams ? '✓' : '✗'} Sorted params: {result.seoAnalysis.hasSortedQueryParams ? 'Yes' : 'No'}</div>
                <div>{!result.seoAnalysis.hasTrackingParams ? '✓' : '⚠'} Tracking params: {result.seoAnalysis.hasTrackingParams ? 'Found' : 'None'}</div>
                <div>{!result.seoAnalysis.fragmentAffectsCrawlability ? '✓' : '⚠'} Fragment: {result.seoAnalysis.fragmentAffectsCrawlability ? 'Has #hash' : 'Clean'}</div>
                <div>{!result.seoAnalysis.hasTrailingSlash ? '✓' : '⚠'} Trailing slash: {result.seoAnalysis.hasTrailingSlash ? 'Yes' : 'No'}</div>
                <div>{result.seoAnalysis.isCanonical ? '✓' : '✗'} Canonical: {result.seoAnalysis.isCanonical ? 'Standard form' : 'Non-standard'}</div>
              </div>
              {result.seoAnalysis.issues && result.seoAnalysis.issues.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 152, 0, 0.3)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#ff9800', marginBottom: '4px' }}>Issues:</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {result.seoAnalysis.issues.map((issue, idx) => (
                      <div key={idx}>• {issue}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Normalization Levels */}
      {result.normalization && !result.normalization.error && (
        <div>
          <SectionHeader emoji="🔄" title="URL Normalization Levels" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Safe Normalization */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Safe Normalize
              </div>
              <URLCard label="Safe" value={result.normalization.safe} fieldId="normalize-safe" />
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Sorts query params, removes duplicate slashes, preserves intent
              </div>
            </div>

            {/* Aggressive Normalization */}
            {result.normalization.aggressive && (
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  Aggressive Normalize
                </div>
                <URLCard label="Aggressive" value={result.normalization.aggressive} fieldId="normalize-aggressive" />
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Removes www, strips tracking/UTM, removes fragment, trailing slash (SEO-grade)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canonical (Legacy) */}
      {canonical && (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            🔗 Canonical Form
          </div>
          <URLCard label="Canonical" value={canonical} fieldId="canonical" />
        </div>
      )}

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

      {/* Redirect Detection */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)' }}>
            🔗 Redirect Detection
          </div>
          <button
            type="button"
            onClick={handleDetectRedirects}
            disabled={redirectLoading}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: detectRedirects ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
              border: detectRedirects ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid rgba(158, 158, 158, 0.3)',
              borderRadius: '4px',
              cursor: redirectLoading ? 'not-allowed' : 'pointer',
              color: detectRedirects ? '#4caf50' : 'var(--color-text-secondary)',
              opacity: redirectLoading ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {redirectLoading ? '⏳ Detecting...' : detectRedirects ? '✓ Enabled' : '○ Disabled'}
          </button>
        </div>

        {redirectError && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#ef5350',
            marginBottom: '12px',
          }}>
            ✗ {redirectError}
          </div>
        )}

        {detectRedirects && redirectData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Chain Summary */}
            <div style={{
              padding: '12px',
              backgroundColor: redirectData.hasRedirects ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              border: redirectData.hasRedirects ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '4px',
              fontSize: '12px',
              color: redirectData.hasRedirects ? '#ff9800' : '#4caf50',
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {redirectData.hasRedirects ? '⚠️ Redirects detected' : '✓ No redirects'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Chain length: {redirectData.chainLength} step{redirectData.chainLength !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Final URL */}
            <URLCard label="Final Destination" value={redirectData.finalUrl} fieldId="redirect-final" />

            {/* Redirect Chain */}
            {redirectData.redirectChain.length > 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--color-background-tertiary)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}>
                  Redirect Chain
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {redirectData.redirectChain.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '11px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        color: 'var(--color-text-secondary)',
                      }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                          Step {idx + 1}
                        </span>
                        {step.isRedirect && (
                          <span style={{ color: '#ff9800', fontSize: '10px', fontWeight: '600' }}>
                            → {step.status}
                          </span>
                        )}
                        {!step.isRedirect && (
                          <span style={{ color: '#4caf50', fontSize: '10px', fontWeight: '600' }}>
                            {step.status === 'error' || step.status === 'timeout' ? '✗ ' + step.status : '✓ ' + step.status}
                          </span>
                        )}
                      </div>
                      <div style={{
                        padding: '8px',
                        backgroundColor: 'var(--color-background-secondary)',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        color: 'var(--color-text)',
                      }}>
                        {step.url}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {detectRedirects && !redirectData && !redirectError && !redirectLoading && (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--color-background-tertiary)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
          }}>
            No data available
          </div>
        )}
      </div>

      {/* Query Parameters Deep-Dive */}
      {result.queryParamDeepDive && !result.queryParamDeepDive.error && Object.keys(searchParams).length > 0 && (
        <div>
          <SectionHeader emoji="🔎" title="Query Parameters Deep-Dive" />

          {/* Summary Stats */}
          {result.queryParamDeepDive.summary && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--color-background-tertiary)',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              marginBottom: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '12px',
              fontSize: '11px',
            }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Params</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{result.queryParamDeepDive.summary.totalParams}</div>
              </div>
              {result.queryParamDeepDive.summary.duplicateParams > 0 && (
                <div>
                  <div style={{ color: '#ff9800', marginBottom: '4px' }}>⚠️ Duplicates</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#ff9800' }}>{result.queryParamDeepDive.summary.duplicateParams}</div>
                </div>
              )}
              {result.queryParamDeepDive.summary.emptyParams > 0 && (
                <div>
                  <div style={{ color: '#2196f3', marginBottom: '4px' }}>ℹ️ Empty</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#2196f3' }}>{result.queryParamDeepDive.summary.emptyParams}</div>
                </div>
              )}
              {result.queryParamDeepDive.summary.trackingParams > 0 && (
                <div>
                  <div style={{ color: '#9c27b0', marginBottom: '4px' }}>📊 Tracking</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#9c27b0' }}>{result.queryParamDeepDive.summary.trackingParams}</div>
                </div>
              )}
              {result.queryParamDeepDive.summary.sensitiveDataDetected && (
                <div>
                  <div style={{ color: '#ef5350', marginBottom: '4px' }}>🔒 Sensitive</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#ef5350' }}>Detected</div>
                </div>
              )}
            </div>
          )}

          {/* Anomalies */}
          {result.queryParamDeepDive.anomalies && result.queryParamDeepDive.anomalies.length > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '4px',
              marginBottom: '12px',
              fontSize: '12px',
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ff9800' }}>⚠️ Anomalies Detected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.queryParamDeepDive.anomalies.map((anomaly, idx) => (
                  <div key={idx} style={{ fontSize: '11px' }}>
                    {anomaly.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.queryParamDeepDive.parameters && result.queryParamDeepDive.parameters.map((param, idx) => (
              <div key={idx} style={{
                padding: '12px',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)' }}>
                    {param.key}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}>
                    {param.isTracking && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                        color: '#9c27b0',
                        borderRadius: '3px',
                        fontWeight: '600',
                      }}>
                        📊 Tracking
                      </span>
                    )}
                    {param.riskLevel === 'high' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: 'rgba(239, 83, 80, 0.2)',
                        color: '#ef5350',
                        borderRadius: '3px',
                        fontWeight: '600',
                      }}>
                        🔴 High Risk
                      </span>
                    )}
                    {param.riskLevel === 'warning' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                        color: '#ff9800',
                        borderRadius: '3px',
                        fontWeight: '600',
                      }}>
                        🟡 Warning
                      </span>
                    )}
                  </div>
                </div>

                {/* Values */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                    Value{param.values.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {param.values.map((value, vIdx) => (
                      <div key={vIdx} style={{
                        padding: '6px',
                        backgroundColor: 'var(--color-background-tertiary)',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        color: 'var(--color-text)',
                      }}>
                        {value || '(empty)'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classifications */}
                {param.classification && param.classification.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                      Classification
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexWrap: 'wrap' }}>
                      {param.classification.map((cls, cIdx) => (
                        <div key={cIdx} style={{
                          padding: '6px 8px',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          borderRadius: '3px',
                          fontSize: '11px',
                        }}>
                          <div style={{ color: '#4caf50', fontWeight: '600' }}>
                            {cls.emoji} {cls.type}
                          </div>
                          {cls.description && (
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {cls.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {param.risks && param.risks.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                      Security Risks
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {param.risks.map((risk, rIdx) => (
                        <div key={rIdx} style={{
                          padding: '6px 8px',
                          backgroundColor: risk.severity === 'high' ? 'rgba(239, 83, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                          border: risk.severity === 'high' ? '1px solid rgba(239, 83, 80, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)',
                          borderRadius: '3px',
                          fontSize: '11px',
                        }}>
                          <div style={{
                            color: risk.severity === 'high' ? '#ef5350' : '#ff9800',
                            fontWeight: '600',
                            marginBottom: '2px',
                          }}>
                            {risk.severity === 'high' ? '🔴' : '🟡'} {risk.type}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                            {risk.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path Segments Breakdown */}
      {result.pathSegments && !result.pathSegments.error && result.pathSegments.segments && result.pathSegments.segments.length > 0 && (
        <div>
          <SectionHeader emoji="🛣️" title="Path Segments Breakdown" />

          {/* Path Analysis Summary */}
          {result.pathSegments.analysis && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--color-background-tertiary)',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              marginBottom: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
              fontSize: '11px',
            }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Segments</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{result.pathSegments.segments.length}</div>
              </div>
              {result.pathSegments.analysis.idCount > 0 && (
                <div>
                  <div style={{ color: '#2196f3', marginBottom: '4px' }}>🔢 IDs Found</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#2196f3' }}>{result.pathSegments.analysis.idCount}</div>
                </div>
              )}
              {result.pathSegments.analysis.resourceCount > 0 && (
                <div>
                  <div style={{ color: '#4caf50', marginBottom: '4px' }}>📦 Resources</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#4caf50' }}>{result.pathSegments.analysis.resourceCount}</div>
                </div>
              )}
              {result.pathSegments.analysis.hasFileExtension && (
                <div>
                  <div style={{ color: '#ff9800', marginBottom: '4px' }}>📄 File</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#ff9800' }}>Present</div>
                </div>
              )}
              {result.pathSegments.analysis.isRestStyle && (
                <div>
                  <div style={{ color: '#9c27b0', marginBottom: '4px' }}>🏗️ REST API</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#9c27b0' }}>Detected</div>
                </div>
              )}
            </div>
          )}

          {/* Segments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.pathSegments.segments.map((segment, idx) => (
              <div key={idx} style={{
                padding: '10px',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    minWidth: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-background-tertiary)',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {idx}
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    wordBreak: 'break-all',
                  }}>
                    {segment.segment}
                  </div>
                </div>

                {/* Segment Type Badge */}
                <div style={{ marginLeft: '32px', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '9px',
                    padding: '2px 6px',
                    backgroundColor: segment.type === 'id' || segment.type === 'uuid' ? 'rgba(33, 150, 243, 0.2)' : segment.type === 'file' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                    color: segment.type === 'id' || segment.type === 'uuid' ? '#2196f3' : segment.type === 'file' ? '#ff9800' : '#4caf50',
                    borderRadius: '3px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {segment.type}
                  </span>
                </div>

                {/* Classifications */}
                {segment.classification && segment.classification.length > 0 && (
                  <div style={{ marginLeft: '32px' }}>
                    {segment.classification.map((cls, cIdx) => (
                      <div key={cIdx} style={{
                        padding: '6px 8px',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: '3px',
                        marginBottom: cIdx < segment.classification.length - 1 ? '4px' : '0',
                        fontSize: '10px',
                      }}>
                        <div style={{ color: '#4caf50', fontWeight: '600' }}>
                          {cls.emoji} {cls.type}
                        </div>
                        {cls.description && (
                          <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {cls.description}
                          </div>
                        )}
                        {cls.severity && (
                          <div style={{ fontSize: '9px', color: '#ff9800', marginTop: '2px', fontWeight: '600' }}>
                            ⚠️ {cls.severity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
