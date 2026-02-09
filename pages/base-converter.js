import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import BaseConverterTool from '../components/BaseConverterTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import { TOOLS } from '../lib/tool-metadata'
import styles from '../styles/hub.module.css'

export default function BaseConverterPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const toolMetadata = TOOLS['base-converter']

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'Base Converter | Convert Between Binary, Octal, Decimal & Hex',
    description: 'Free online base converter for converting numbers between binary, octal, decimal, and hexadecimal. Auto-detect input base, convert with full precision, and view results in all bases. Deterministic, rule-based processing with no data retention.',
    path: '/base-converter',
    toolMetadata: toolMetadata,
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/base-converter` || 'https://www.pioneerwebtools.com/base-converter'} />

        {/* Open Graph Tags for social sharing */}
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/base-converter`} />
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
            "name": "Base Converter",
            "description": "Free online base converter for converting numbers between binary, octal, decimal, and hexadecimal.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/base-converter`,
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
              "Convert between binary, octal, decimal, and hexadecimal",
              "Auto-detect input base automatically",
              "Full precision number conversion",
              "View results in all supported bases",
              "Support for large numbers",
              "Clear error messages for invalid input",
              "Real-time conversion results",
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
          <p>Base Converter</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <BaseConverterTool />
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
