import React, { useState } from 'react'
import { validateIPAddress } from '../lib/tools.js'
import styles from '../styles/ip-toolkit-tests.module.css'

const TEST_CASES = [
  // Phase 1: Single IPv4 Addresses
  { category: 'Phase 1: IPv4', input: '192.168.1.1', description: 'Private Class C' },
  { category: 'Phase 1: IPv4', input: '10.0.0.1', description: 'Private Class A' },
  { category: 'Phase 1: IPv4', input: '172.16.0.1', description: 'Private Class B' },
  { category: 'Phase 1: IPv4', input: '8.8.8.8', description: 'Public (Google DNS)' },
  { category: 'Phase 1: IPv4', input: '127.0.0.1', description: 'Loopback' },
  { category: 'Phase 1: IPv4', input: '224.0.0.1', description: 'Multicast' },
  { category: 'Phase 1: IPv4', input: '0.0.0.0', description: 'Unspecified' },
  { category: 'Phase 1: IPv4', input: '255.255.255.255', description: 'Broadcast' },

  // Phase 1: Single IPv6 Addresses
  { category: 'Phase 1: IPv6', input: '2001:db8::1', description: 'Compressed documentation' },
  { category: 'Phase 1: IPv6', input: '::1', description: 'Loopback' },
  { category: 'Phase 1: IPv6', input: 'fe80::1', description: 'Link-local' },
  { category: 'Phase 1: IPv6', input: '2001:4860:4860::8888', description: 'Compressed Google DNS' },
  { category: 'Phase 1: IPv6', input: '2001:0db8:0000:0000:0000:0000:0000:0001', description: 'Fully expanded' },

  // Phase 2: CIDR Notation - IPv4
  { category: 'Phase 2: CIDR IPv4', input: '192.168.1.0/24', description: '/24 subnet (256 hosts)' },
  { category: 'Phase 2: CIDR IPv4', input: '10.0.0.0/8', description: '/8 subnet (16M hosts)' },
  { category: 'Phase 2: CIDR IPv4', input: '172.16.0.0/16', description: '/16 subnet (65K hosts)' },
  { category: 'Phase 2: CIDR IPv4', input: '192.168.1.0/30', description: '/30 subnet (4 hosts)' },
  { category: 'Phase 2: CIDR IPv4', input: '192.168.1.100/32', description: '/32 single host' },
  { category: 'Phase 2: CIDR IPv4', input: '10.0.0.0/31', description: '/31 point-to-point (RFC 3021)' },
  { category: 'Phase 2: CIDR IPv4', input: '0.0.0.0/0', description: '/0 entire IPv4 space' },

  // Phase 2: CIDR Notation - IPv6
  { category: 'Phase 2: CIDR IPv6', input: '2001:db8::/32', description: 'IPv6 documentation prefix' },
  { category: 'Phase 2: CIDR IPv6', input: 'fe80::/10', description: 'Link-local prefix' },
  { category: 'Phase 2: CIDR IPv6', input: 'ff00::/8', description: 'Multicast prefix' },

  // Phase 2: Range Mode
  { category: 'Phase 2: Range', input: '192.168.1.100-192.168.1.150', description: 'Range with dash' },
  { category: 'Phase 2: Range', input: '192.168.1.100 - 192.168.1.150', description: 'Range with spaced dash' },
  { category: 'Phase 2: Range', input: '192.168.1.1 to 192.168.1.255', description: 'Range with "to"' },
  { category: 'Phase 2: Range', input: '10.0.0.1 to 10.0.0.10', description: 'Small range' },
  { category: 'Phase 2: Range', input: '8.8.8.8 - 1.1.1.1', description: 'Reverse range (invalid)' },
  { category: 'Phase 2: Range', input: '192.168.1.1..192.168.1.10', description: 'Range with dots (..)' },
  { category: 'Phase 2: Range', input: '10.0.0.1…10.0.0.5', description: 'Range with ellipsis (…)' },

  // Phase 2: IPv6 Advanced Features
  { category: 'Phase 2: IPv6 Advanced', input: 'fe80::1%eth0', description: 'IPv6 with zone index' },
  { category: 'Phase 2: IPv6 Advanced', input: '::ffff:192.168.1.1', description: 'IPv4-mapped IPv6' },
  { category: 'Phase 2: IPv6 Advanced', input: '2002:c0a8:101::1', description: '6to4 address' },
  { category: 'Phase 2: IPv6 Advanced', input: 'fd00::1', description: 'ULA (Unique Local Address)' },
  { category: 'Phase 2: IPv6 Advanced', input: '2001::1', description: 'Teredo address' },

  // Phase 3: Hostnames & DNS Resolution
  { category: 'Phase 3: Hostnames', input: 'google.com', description: 'Major search engine (CDN)' },
  { category: 'Phase 3: Hostnames', input: 'example.com', description: 'Example domain (RFC 2606)' },
  { category: 'Phase 3: Hostnames', input: 'github.com', description: 'Major code hosting platform' },
  { category: 'Phase 3: Hostnames', input: 'localhost', description: 'Localhost (loopback)' },
  { category: 'Phase 3: Hostnames', input: 'api.example.com', description: 'Subdomain' },
  { category: 'Phase 3: Hostnames', input: 'my-server.internal.corp', description: 'Internal domain with hyphens' },
  { category: 'Phase 3: Hostnames', input: 'mail.google.com', description: 'Google Mail subdomain' },
  { category: 'Phase 3: Hostnames', input: 'cdn.jsdelivr.net', description: 'CDN subdomain' },

  // Edge Cases: Whitespace & Formatting
  { category: 'Edge Cases', input: '  192.168.1.1  ', description: 'Leading/trailing spaces' },
  { category: 'Edge Cases', input: '  10.0.0.0/24  ', description: 'CIDR with spaces' },
  { category: 'Edge Cases', input: '\t127.0.0.1\t', description: 'Tab characters' },

  // Edge Cases: Invalid Inputs
  { category: 'Invalid', input: 'invalid', description: 'Non-IP string' },
  { category: 'Invalid', input: '256.1.1.1', description: 'Octet > 255' },
  { category: 'Invalid', input: '192.168.1', description: 'Too few octets' },
  { category: 'Invalid', input: '192.168.1.1.1', description: 'Too many octets' },
  { category: 'Invalid', input: '192.168.1.1/33', description: 'CIDR prefix > 32' },
  { category: 'Invalid', input: 'gggg::gggg', description: 'Invalid IPv6 hex' },
  { category: 'Invalid', input: '', description: 'Empty input' },

  // Edge Cases: IPv4 Leading Zeros
  { category: 'Edge Cases: IPv4 Leading Zeros', input: '010.000.000.001', description: 'Leading zeros (potential octal interpretation)' },
  { category: 'Edge Cases: IPv4 Leading Zeros', input: '192.168.001.001', description: 'Mixed leading zeros' },
  { category: 'Edge Cases: IPv4 Leading Zeros', input: '001.002.003.004', description: 'All octets with leading zeros' },

  // Edge Cases: IPv6 Case Variations
  { category: 'Edge Cases: IPv6 Case', input: 'FE80::1', description: 'Uppercase link-local' },
  { category: 'Edge Cases: IPv6 Case', input: 'Fe80::1', description: 'Mixed case link-local' },
  { category: 'Edge Cases: IPv6 Case', input: '2001:DB8::1', description: 'Uppercase documentation' },
  { category: 'Edge Cases: IPv6 Case', input: '2001:db8::1:FFFF', description: 'Mixed case documentation' },

  // Edge Cases: IPv6 Invalid Multiple Colons
  { category: 'Edge Cases: IPv6 Invalid', input: '2001::db8::1', description: 'Multiple :: (invalid)' },
  { category: 'Edge Cases: IPv6 Invalid', input: '::1::2', description: 'Multiple :: with values (invalid)' },
  { category: 'Edge Cases: IPv6 Invalid', input: '2001:db8:::1', description: 'Triple colon (invalid)' },
  { category: 'Edge Cases: IPv6 Invalid', input: '2001:db8:0:0:0:0:0:0:1', description: 'Too many hextets' },

  // Edge Cases: Hostname Invalid Labels
  { category: 'Edge Cases: Hostnames', input: 'bad_domain.com', description: 'Underscore in hostname (invalid)' },
  { category: 'Edge Cases: Hostnames', input: '-invalid.com', description: 'Leading hyphen (invalid)' },
  { category: 'Edge Cases: Hostnames', input: 'invalid-.com', description: 'Trailing hyphen (invalid)' },
  { category: 'Edge Cases: Hostnames', input: 'valid-domain.com', description: 'Hyphen in middle (valid)' },
  { category: 'Edge Cases: Hostnames', input: '192.168.test.local', description: 'Mixed numeric/letters with local' },

  // Edge Cases: Cross-Family Ranges
  { category: 'Edge Cases: Cross-Family Ranges', input: '192.168.1.1 - fe80::1', description: 'IPv4 to IPv6 range (invalid)' },
  { category: 'Edge Cases: Cross-Family Ranges', input: '::1 - 192.168.1.1', description: 'IPv6 to IPv4 range (invalid)' },

  // Edge Cases: Weird Separators & Whitespace
  { category: 'Edge Cases: Separators', input: '10.0.0.1\t-\t10.0.0.5', description: 'Tabs around dash separator' },
  { category: 'Edge Cases: Separators', input: '10.0.0.1 -  10.0.0.5', description: 'Multiple spaces around dash' },
  { category: 'Edge Cases: Separators', input: '10.0.0.1–10.0.0.5', description: 'En-dash separator (–)' },
  { category: 'Edge Cases: Separators', input: '10.0.0.1—10.0.0.5', description: 'Em-dash separator (—)' },
  { category: 'Edge Cases: Separators', input: '10.0.0.1 ~ 10.0.0.5', description: 'Tilde separator (~)' },
  { category: 'Edge Cases: Separators', input: '10.0.0.1, 10.0.0.5', description: 'Comma separator (invalid)' },

  // Edge Cases: Special RFC Addresses
  { category: 'Edge Cases: RFC Addresses', input: '255.255.255.255', description: 'Limited broadcast (RFC 919/922)' },
  { category: 'Edge Cases: RFC Addresses', input: '0.0.0.0/0', description: 'Default route (entire IPv4 space)' },
  { category: 'Edge Cases: RFC Addresses', input: '255.255.255.254', description: 'Broadcast minus one' },
  { category: 'Edge Cases: RFC Addresses', input: '169.254.1.1', description: 'APIPA/Link-local IPv4' },
]

export default function IPToolkitTests() {
  const [expandedIndices, setExpandedIndices] = useState(new Set())
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)

  // Handle running tests manually
  const handleRunTests = () => {
    setIsRunning(true)
    setExpandedIndices(new Set())

    setTimeout(() => {
      const testResults = TEST_CASES.map((testCase, idx) => ({
        ...testCase,
        index: idx,
        result: validateIPAddress(testCase.input),
      }))
      setResults(testResults)
      setIsRunning(false)
    }, 100)
  }

  // Group by category (only if results exist)
  const grouped = results ? (() => {
    const groups = {}
    results.forEach(r => {
      if (!groups[r.category]) {
        groups[r.category] = []
      }
      groups[r.category].push(r)
    })
    return groups
  })() : {}

  const categories = Object.keys(grouped).sort()

  const toggleExpanded = (idx) => {
    const newExpanded = new Set(expandedIndices)
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx)
    } else {
      newExpanded.add(idx)
    }
    setExpandedIndices(newExpanded)
  }

  const handleCopyAll = async () => {
    if (!results) return
    const allResults = results.map(r => ({
      input: r.input,
      description: r.description,
      category: r.category,
      result: r.result,
    }))

    const json = JSON.stringify(allResults, null, 2)

    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback to older document.execCommand method
      try {
        const textarea = document.createElement('textarea')
        textarea.value = json
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        document.body.removeChild(textarea)
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr)
      }
    }
  }

  const getStatusIcon = (result) => {
    if (result.error) return '❌'
    if (result.isValid === false) return '⚠️'
    if (result.isValid === true || result.inputType === 'cidr' || result.inputType === 'range') return '✅'
    return '❓'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>IP Address Toolkit — Test Harness</h1>
        <p className={styles.subtitle}>
          Comprehensive test suite for Phase 1, 2, and edge cases. {TEST_CASES.length} test cases total.
        </p>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.copyButton}
          onClick={handleRunTests}
          disabled={isRunning}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '⏳ Running Tests...' : '▶️ Run Tests'}
        </button>
        {results && (
          <>
            <button className={styles.copyButton} onClick={handleCopyAll}>
              {copied ? '✓ Copied All Results!' : '📋 Copy All Results (JSON)'}
            </button>
            <span className={styles.stats}>
              ✅ Valid: {results.filter(r => r.result.isValid === true || r.result.inputType).length} |
              ⚠️ Invalid: {results.filter(r => r.result.isValid === false).length} |
              ❌ Errors: {results.filter(r => r.result.error).length}
            </span>
          </>
        )}
      </div>

      {!results ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '14px'
        }}>
          <p>Click "Run Tests" above to execute {TEST_CASES.length} test cases.</p>
        </div>
      ) : (
        <div className={styles.testResults}>
          {categories.map(category => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              {category} ({grouped[category].length})
            </h2>

            <div className={styles.testList}>
              {grouped[category].map(testResult => (
                <div key={testResult.index} className={styles.testItem}>
                  <div
                    className={styles.testHeader}
                    onClick={() => toggleExpanded(testResult.index)}
                  >
                    <span className={styles.statusIcon}>
                      {getStatusIcon(testResult.result)}
                    </span>
                    <div className={styles.testInfo}>
                      <code className={styles.input}>{testResult.input}</code>
                      <span className={styles.description}>
                        {testResult.description}
                      </span>
                    </div>
                    <span className={styles.toggleChevron}>
                      {expandedIndices.has(testResult.index) ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedIndices.has(testResult.index) && (
                    <div className={styles.testBody}>
                      <pre className={styles.json}>
                        {JSON.stringify(testResult.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}

      <div className={styles.footer}>
        <p>
          Test harness for IP Address Toolkit (Phase 1, 2, and edge cases).
          Click any test to expand and view detailed JSON output.
        </p>
      </div>
    </div>
  )
}
