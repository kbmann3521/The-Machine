import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import MimeTypeLookupTool from '../components/MimeTypeLookupTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import { TOOLS } from '../lib/tool-metadata'
import styles from '../styles/hub.module.css'

export default function MimeTypeLookupPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const toolMetadata = TOOLS['mime-type-lookup']

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'MIME Type Lookup | Convert Extensions, MIME Types & Headers Online',
    description: 'Free online MIME type lookup tool. Convert between file extensions, MIME types, filenames, and Content-Type headers. Get security notes, category classification, and rich metadata. Bulk processing with fuzzy matching. Deterministic, rule-based lookup with no data retention.',
    path: '/mime-type-lookup',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/mime-type-lookup` || 'https://www.pioneerwebtools.com/mime-type-lookup'} />

        {/* Open Graph Tags for social sharing */}
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/mime-type-lookup`} />
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
            "name": "MIME Type Lookup",
            "description": "Free online MIME type lookup with extension/MIME conversion, metadata, and security analysis.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/mime-type-lookup`,
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
              "Comprehensive database with 50+ MIME types and rich metadata",
              "Auto-detect mode (extension, MIME, filename, or Content-Type header)",
              "Multiple lookup modes: Extension → MIME, MIME → Extension, Filename, Header",
              "Bulk processing: paste multiple items, one per line",
              "Fuzzy matching with suggestions for typos",
              "Security notes for each MIME type",
              "Category classification (document, image, video, audio, archive, code, font)",
              "Binary vs text detection and compressibility",
              "Charset information and common applications",
              "Case normalization and smart parsing",
              "Deterministic, rule-based lookup",
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
          <p>MIME Type Lookup</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <MimeTypeLookupTool />
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
