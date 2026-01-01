import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical resources for faster initial render */}
        <link rel="preload" href="/_next/static/chunks/main.js" as="script" />

        {/* DNS prefetch for potential future external services */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Preconnect to same-origin for faster requests */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'https://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost')} />

        {/* Icons and manifest */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Performance: Enable resource hints for smoother navigation */}
        <link rel="prefetch" href="/api/tools/run" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
