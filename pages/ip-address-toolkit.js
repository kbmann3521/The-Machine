import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import IpAddressToolkitTool from '../components/IpAddressToolkitTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import { TOOLS } from '../lib/tool-metadata'
import styles from '../styles/hub.module.css'

export default function IpAddressToolkitPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const toolMetadata = TOOLS['ip-address-toolkit']

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'IP Address Toolkit | Validate, Analyze & Convert IPv4/IPv6 Online',
    description: 'Free comprehensive IP address toolkit with validation, geolocation, CIDR calculation, bulk processing, and network diagnostics for IPv4 and IPv6. Analyze IP ranges, compare addresses, detect threats, and plan subnets. Deterministic, rule-based analysis with no data retention.',
    path: '/ip-address-toolkit',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/ip-address-toolkit` || 'https://www.pioneerwebtools.com/ip-address-toolkit'} />

        {/* Open Graph Tags for social sharing */}
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/ip-address-toolkit`} />
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
            "name": "IP Address Toolkit",
            "description": "Free comprehensive IP address toolkit for validation, analysis, conversion, and network diagnostics of IPv4 and IPv6 addresses.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/ip-address-toolkit`,
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
              "Validate IPv4 and IPv6 addresses",
              "Analyze IP geolocation and regional data",
              "ASN (Autonomous System Number) lookup",
              "Convert IPs to integer, binary, and hexadecimal formats",
              "Public/Private classification and reserved range detection",
              "Reverse DNS (PTR) lookup and network safety scoring",
              "Process bulk IP lists with filtering and deduplication",
              "Compare 2 IPs side-by-side or analyze 3+ IPs for patterns",
              "CIDR subnet calculation and visualization",
              "Network diagnostics: Ping, Traceroute, Reverse DNS",
              "Smart outlier detection in bulk mode",
              "Export results to JSON or CSV",
              "Deterministic, rule-based analysis",
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
          <p>IP Address Toolkit</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <IpAddressToolkitTool />
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
