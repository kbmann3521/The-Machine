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
  const [metaTags, setMetaTags] = useState(generateMetaTags())

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
          setSiteMetadata(data)
          setMetaTags(generateMetaTags(null, data))
        }
      } catch (err) {
        console.error('Failed to load SEO settings for meta tags:', err)
        // Use defaults on error
        setMetaTags(generateMetaTags())
      }
    }

    fetchSeoSettings()
  }, [])

  const currentMetaTags = metaTags

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
        <title>{currentMetaTags.title}</title>
        <meta name="description" content={currentMetaTags.description} />
        <meta name="keywords" content={currentMetaTags.keywords} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="language" content="English" />
        <meta name="author" content={siteMetadata.author} />

        {/* Open Graph */}
        <meta property="og:type" content={seoSettings?.og_type || 'website'} />
        <meta property="og:title" content={seoSettings?.og_title || currentMetaTags.title} />
        <meta property="og:description" content={seoSettings?.og_description || currentMetaTags.description} />
        <meta property="og:url" content={siteMetadata.url} />
        {seoSettings?.og_image_url && <meta property="og:image" content={seoSettings.og_image_url} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={seoSettings?.twitter_card_type || 'summary_large_image'} />
        <meta name="twitter:title" content={seoSettings?.twitter_site ? `${currentMetaTags.title} - ${seoSettings.twitter_site}` : currentMetaTags.title} />
        <meta name="twitter:description" content={currentMetaTags.description} />
        {seoSettings?.twitter_site && <meta name="twitter:site" content={seoSettings.twitter_site} />}
        {seoSettings?.twitter_creator && <meta name="twitter:creator" content={seoSettings.twitter_creator} />}

        {/* Canonical */}
        <link rel="canonical" href={siteMetadata.url} />

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
