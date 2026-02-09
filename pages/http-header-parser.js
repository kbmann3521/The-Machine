import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import HttpHeaderParserTool from '../components/HttpHeaderParserTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import styles from '../styles/hub.module.css'

export default function HttpHeaderParserPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'HTTP Header Parser | Validate, Analyze & Debug HTTP Headers',
    description: 'Free online HTTP header parser with security analysis, validation, and performance insights. Analyze request/response headers, detect vulnerabilities, simulate cache behavior, and export in multiple formats. Deterministic, rule-based processing with no data retention.',
    path: '/http-header-parser',
  })

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  }

  const handleHomeClick = () => {
    window.location.href = '/'
  }

  return (
    <div className={styles.layout} style={containerStyle}>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/http-header-parser` || 'https://www.pioneerwebtools.com/http-header-parser'} />

        {/* Open Graph Tags for social sharing */}
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/http-header-parser`} />
        <meta property="og:type" content={metadata.openGraph?.type || 'website'} />
        {metadata.openGraph?.image && <meta property="og:image" content={metadata.openGraph.image} />}

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
        <meta name="twitter:title" content={metadata.twitter?.title || metadata.title} />
        <meta name="twitter:description" content={metadata.twitter?.description || metadata.description} />
        {metadata.twitter?.site && <meta name="twitter:site" content={metadata.twitter.site} />}
        {metadata.twitter?.creator && <meta name="twitter:creator" content={metadata.twitter.creator} />}
      </Head>
      <Script
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "HTTP Header Parser",
            "description": "Free online HTTP header parser with security analysis, validation, and performance insights. Analyze request/response headers, detect vulnerabilities, simulate cache behavior, and export in multiple formats.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/http-header-parser`,
            "isAccessibleForFree": true,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "publisher": {
              "@type": "Organization",
              "name": siteName,
              "url": props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'
            },
            "featureList": [
              "Parse request and response headers automatically",
              "RFC 7230/7231/9110 compliance validation",
              "Security analysis and vulnerability detection",
              "Cache behavior simulation (browser vs CDN)",
              "Heuristic freshness calculation",
              "Compression validity analysis",
              "HTTP/2 & HTTP/3 compatibility checking",
              "Performance and compression analysis",
              "JWT format detection",
              "Header conflict detection",
              "Missing security header warnings",
              "Multi-format export (canonical, cURL, JSON, fetch)",
              "Organized header grouping",
              "Strict RFC Mode for backend engineers",
              "Deterministic, rule-based processing",
              "Runs entirely in your browser"
            ],
            "audience": {
              "@type": "Audience",
              "audienceType": "Developers"
            }
          })
        }}
      />

      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.headerContent}
          onClick={handleHomeClick}
          title="Go to home"
          aria-label="Go to home"
        >
          <h1>{siteName}</h1>
          <p>HTTP Header Parser</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <HttpHeaderParserTool />
          </div>
        </main>
      </div>

      {/* Footer */}
      <PageFooter showBackToTools={true} />
    </div>
  )
}

export async function getStaticProps() {
  const result = await withSeoSettings({
    siteName: null,
  })

  return {
    props: {
      ...result.props,
      siteName: result.props.seoSettings?.site_name || 'Pioneer Web Tools',
    },
    revalidate: 3600,
  }
}
