import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import TimeNormalizerTool from '../components/TimeNormalizerTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import styles from '../styles/hub.module.css'

export default function TimeNormalizerPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'Time Normalizer - Parse, Normalize & Convert Dates Between Timezones',
    description: 'Free online time normalizer supporting Unix timestamps, ISO 8601, and human-readable dates. Auto-detect date formats, normalize to standard formats, and convert between 30+ timezones. Deterministic, rule-based processing with no data retention.',
    path: '/time-normalizer',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/time-normalizer` || 'https://www.pioneerwebtools.com/time-normalizer'} />
      </Head>
      <Script
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Time Normalizer",
            "description": "Free online time normalizer supporting Unix timestamps, ISO 8601, and human-readable dates. Auto-detect date formats and convert between 30+ timezones.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/time-normalizer`,
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
              "Automatic date format detection",
              "Unix timestamp support (seconds and milliseconds)",
              "ISO 8601 parsing",
              "Human-readable date parsing",
              "Timezone conversion (30+ timezones)",
              "Explicit timezone context for input and output",
              "Daylight saving time handling",
              "UTC offset calculation",
              "ISO week date support",
              "Multiple output formats",
              "Timezone metadata display",
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
          <p>Time Normalizer</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <TimeNormalizerTool />
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
