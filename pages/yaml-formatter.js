import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import YamlFormatterTool from '../components/YamlFormatterTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import styles from '../styles/hub.module.css'

export default function YamlFormatterPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'YAML Formatter | Format, Validate & Convert YAML Online',
    description: 'Free online YAML formatter with beautification, validation, and conversion to JSON and other formats. Format YAML with proper indentation, validate syntax, and convert between formats. Deterministic, rule-based processing with no data retention.',
    path: '/yaml-formatter',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/yaml-formatter` || 'https://www.pioneerwebtools.com/yaml-formatter'} />
      </Head>
      <Script
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "YAML Formatter",
            "description": "Free online YAML formatter with beautification, validation, and conversion to JSON and other formats.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/yaml-formatter`,
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
              "Beautify YAML with customizable indentation",
              "Minify YAML for compact storage",
              "Validate YAML syntax and structure",
              "Detect structural issues and warnings",
              "Convert YAML to JSON and other formats",
              "Pretty print with proper formatting",
              "Support for nested objects and arrays",
              "Error reporting with details",
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
          <p>YAML Formatter</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <YamlFormatterTool />
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
