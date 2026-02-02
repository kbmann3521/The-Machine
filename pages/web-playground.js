import Head from 'next/head'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import WebPlaygroundTool from '../components/WebPlaygroundTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import styles from '../styles/hub.module.css'

export default function WebPlaygroundPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'Web Playground - Validate, Format & Convert HTML & Markdown',
    description: 'Free online HTML and Markdown validator, formatter, and converter. Check syntax errors, accessibility issues, validate semantic structure, and beautify code. Convert between HTML and Markdown with deterministic, rule-based processing.',
    path: '/web-playground',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/web-playground` || 'https://www.pioneerwebtools.com/web-playground'} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Web Playground",
              "description": "Free online HTML and Markdown validator, formatter, linter, and converter. Validates syntax, accessibility, and semantic structure. Converts between formats with beautification or minification options.",
              "applicationCategory": "DeveloperTool",
              "operatingSystem": "Web",
              "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/web-playground`,
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
                "HTML syntax validation",
                "Markdown syntax validation",
                "Accessibility linting and checking",
                "Semantic structure validation",
                "Deprecated tag detection",
                "HTML to Markdown conversion",
                "Markdown to HTML conversion",
                "Code beautification",
                "Code minification",
                "GitHub Flavored Markdown support",
                "Auto-detection of input type",
                "Deterministic, rule-based processing"
              ],
              "audience": {
                "@type": "Audience",
                "audienceType": "Developers"
              }
            })
          }}
        />
      </Head>

      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.headerContent}
          onClick={handleHomeClick}
          title="Go to home"
          aria-label="Go to home"
        >
          <h1>{siteName}</h1>
          <p>Web Playground</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <WebPlaygroundTool />
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
