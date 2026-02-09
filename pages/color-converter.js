import Head from 'next/head'
import Script from 'next/script'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import ColorConverterTool from '../components/ColorConverterTool'
import { withSeoSettings } from '../lib/getSeoSettings'
import { generatePageMetadata } from '../lib/seoUtils'
import { TOOLS } from '../lib/tool-metadata'
import styles from '../styles/hub.module.css'

export default function ColorConverterPage(props) {
  const siteName = props?.siteName || 'Pioneer Web Tools'

  const toolMetadata = TOOLS['color-converter']

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'Color Converter | Convert Between RGB, HEX, HSL, CMYK & More',
    description: 'Free online color converter supporting 10+ formats (HEX, RGB, HSL, CMYK, LAB, LCH, HSV, XYZ). Convert colors, compare with Delta-E, generate gradients, simulate color blindness, and export palettes. Deterministic, rule-based processing with no data retention.',
    path: '/color-converter',
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
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/color-converter` || 'https://www.pioneerwebtools.com/color-converter'} />

        {/* Open Graph Tags for social sharing */}
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/color-converter`} />
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
            "name": "Color Converter",
            "description": "Free online color converter supporting 10+ formats (HEX, RGB, HSL, CMYK, LAB, LCH, HSV, XYZ). Convert colors, compare with Delta-E, generate gradients, and simulate color blindness.",
            "applicationCategory": "DeveloperTool",
            "operatingSystem": "Web",
            "url": `${props?.seoSettings?.canonical_base_url || 'https://www.pioneerwebtools.com'}/color-converter`,
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
              "Auto-detect color format (HEX, RGB, HSL, CMYK, CSS names)",
              "Convert between 10+ color formats simultaneously",
              "CMYK profiles for printing (Simple, FOGRA)",
              "Delta-E color comparison (CIE76, CIE94, CIEDE2000)",
              "Color harmony generation (complementary, triadic, tetradic)",
              "Gradient generation with interpolation modes",
              "Color blindness simulation (Deuteranopia, Protanopia, Tritanopia)",
              "Tint and shade generation",
              "Luminance and contrast calculation",
              "Accessibility compliance checking",
              "Palette export as JSON or SVG",
              "Deterministic, rule-based processing",
              "Runs entirely in your browser"
            ],
            "audience": {
              "@type": "Audience",
              "audienceType": "Designers and Developers"
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
          <p>Color Converter</p>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className={styles.bodyContainer} style={{ flex: 1, display: 'flex' }}>
        <main className={styles.mainContent}>
          <div className={styles.content}>
            <ColorConverterTool />
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
