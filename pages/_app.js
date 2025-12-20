import Head from 'next/head'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { ThemeProvider } from '../lib/ThemeContext'
import { generatePageMetadata, buildBaseMetadata } from '../lib/seoUtils'
import { getRobotsMetaContent, getAdminRobotsMeta } from '../lib/getRobotsMeta'

function RobotsMetaInjector() {
  const router = useRouter()

  // Inject meta tag based on current path
  const injectMetaTag = () => {
    // Get admin-level robots directive
    const adminMeta = getAdminRobotsMeta(router.pathname)
    if (adminMeta) {
      setRobotsMetaTag(adminMeta)
      return
    }

    // Get page-specific rules from localStorage
    const pageRulesStr = typeof window !== 'undefined' ? localStorage.getItem('seoPageRules') : null
    let pageRules = null
    if (pageRulesStr) {
      try {
        pageRules = JSON.parse(pageRulesStr)
      } catch (e) {
        console.error('Failed to parse seoPageRules from localStorage:', e)
      }
    }

    const metaContent = getRobotsMetaContent(router.pathname, pageRules)
    if (metaContent) {
      setRobotsMetaTag(metaContent)
      console.log(`Meta robots tag set for ${router.pathname}:`, metaContent)
    } else {
      removeRobotsMetaTag()
    }
  }

  // Run on mount and when pathname changes
  useEffect(() => {
    if (router.isReady) {
      injectMetaTag()
    }
  }, [router.isReady, router.pathname])

  // Also listen for localStorage changes (in case another tab/window saves)
  useEffect(() => {
    const handleStorageChange = () => {
      injectMetaTag()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router.pathname])

  return null
}

function setRobotsMetaTag(content) {
  let metaTag = document.querySelector('meta[name="robots"]')
  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute('name', 'robots')
    document.head.appendChild(metaTag)
  }
  metaTag.setAttribute('content', content)
}

function removeRobotsMetaTag() {
  const metaTag = document.querySelector('meta[name="robots"]')
  if (metaTag) {
    metaTag.remove()
  }
}

export default function App({ Component, pageProps }) {
  const [seoSettings, setSeoSettings] = useState(null)
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    keywords: '',
    canonical: '',
    openGraph: {},
    twitter: {},
  })

  // Fetch SEO settings on mount
  useEffect(() => {
    const fetchSeoSettings = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
        const response = await fetch(`${baseUrl}/api/seo/get-settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        })

        if (response.ok) {
          const data = await response.json()
          setSeoSettings(data)
          // Generate metadata from fetched settings
          const generatedMetadata = generatePageMetadata({ seoSettings: data })
          setMetadata(generatedMetadata)
        }
      } catch (err) {
        console.error('Failed to load SEO settings for meta tags:', err)
      }
    }

    fetchSeoSettings()
  }, [])

  const base = seoSettings ? buildBaseMetadata(seoSettings) : {}

  return (
    <>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();
          `,
        }}
      />
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="language" content="English" />
        {base.author && <meta name="author" content={base.author} />}

        {/* Open Graph */}
        <meta property="og:type" content={metadata.openGraph?.type || 'website'} />
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
        {metadata.openGraph?.url && <meta property="og:url" content={metadata.openGraph.url} />}
        {metadata.openGraph?.image && <meta property="og:image" content={metadata.openGraph.image} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
        <meta name="twitter:title" content={metadata.twitter?.title || metadata.title} />
        <meta name="twitter:description" content={metadata.twitter?.description || metadata.description} />
        {metadata.twitter?.site && <meta name="twitter:site" content={metadata.twitter.site} />}
        {metadata.twitter?.creator && <meta name="twitter:creator" content={metadata.twitter.creator} />}

        {/* Canonical */}
        {metadata.canonical && <link rel="canonical" href={metadata.canonical} />}

        {/* Favicon */}
        {seoSettings?.favicon_url ? (
          <link rel="icon" href={seoSettings.favicon_url} />
        ) : (
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        )}

        {/* Theme Color */}
        {seoSettings?.theme_color && <meta name="theme-color" content={seoSettings.theme_color} />}
      </Head>

      <ThemeProvider>
        <RobotsMetaInjector />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
