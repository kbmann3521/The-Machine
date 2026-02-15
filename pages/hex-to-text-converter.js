import Head from 'next/head'
import dynamic from 'next/dynamic'
import { generatePageMetadata } from '../lib/seoUtils'
import { withSeoSettings } from '../lib/getSeoSettings'

const HexToTextConverterTool = dynamic(() => import('../components/HexToTextConverterTool'), { ssr: true })

export default function HexToTextConverterPage(props) {
  const toolMetadata = {
    title: 'Hexadecimal Converter',
    description: 'Free, deterministic hexadecimal to text conversion with multiple encoding support, auto-detection, and batch processing',
  }

  const metadata = generatePageMetadata({
    seoSettings: props?.seoSettings || {},
    title: 'Hexadecimal Converter | Convert Between Hex and Text',
    description: 'Convert hex strings to readable text with support for UTF-8, ASCII, and UTF-16 encodings. Auto-detects hex formats (compact, space-separated, 0x prefix, C format).',
    path: '/hexadecimal-converter',
    toolMetadata: toolMetadata,
  })

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
        <link rel="canonical" href={metadata.canonical || `${props?.seoSettings?.canonical_base_url}/hex-to-text-converter`} />
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        <meta property="og:url" content={metadata.openGraph?.url || `${props?.seoSettings?.canonical_base_url}/hex-to-text-converter`} />
        <meta property="og:type" content="website" />
        {metadata.openGraph?.image && <meta property="og:image" content={metadata.openGraph.image} />}
        <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
        {metadata.twitter?.title && <meta name="twitter:title" content={metadata.twitter.title} />}
        {metadata.twitter?.description && <meta name="twitter:description" content={metadata.twitter.description} />}
        {metadata.twitter?.image && <meta name="twitter:image" content={metadata.twitter.image} />}
      </Head>
      <HexToTextConverterTool />
    </>
  )
}

export const getServerSideProps = withSeoSettings(async (context) => {
  return {
    props: {
      seoSettings: context.seoSettings || {},
    },
  }
})
