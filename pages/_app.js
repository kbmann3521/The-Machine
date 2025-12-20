import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { ThemeProvider } from '../lib/ThemeContext'
import { generateMetaTags, siteMetadata } from '../lib/seoUtils'
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
  const metaTags = generateMetaTags()

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
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="keywords" content={metaTags.keywords} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="language" content="English" />
        <meta name="author" content={siteMetadata.author} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTags.title} />
        <meta property="og:description" content={metaTags.description} />
        <meta property="og:url" content={siteMetadata.url} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTags.title} />
        <meta name="twitter:description" content={metaTags.description} />

        {/* Canonical */}
        <link rel="canonical" href={siteMetadata.url} />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <ThemeProvider>
        <RobotsMetaInjector />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
