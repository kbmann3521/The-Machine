import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Apply dark theme CSS variables immediately to prevent flash */}
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --color-background-primary: #1a1a1a;
            --color-background-secondary: #2d2d2d;
            --color-background-tertiary: #3a3a3a;
            --color-text-primary: #e4e4e4;
            --color-text-secondary: #a8a8a8;
            --color-border: #404040;
            --color-border-hover: #505050;
            --color-header-gradient-start: #2d2d2d;
            --color-header-gradient-end: #1f1f1f;
            --color-shadow: rgba(0, 0, 0, 0.3);
            --scrollbar-track: #2d2d2d;
            --scrollbar-thumb: #505050;
            --scrollbar-thumb-hover: #656565;
          }
        `}} />

        {/* Preload critical resources for faster initial render */}
        <link rel="preload" href="/_next/static/chunks/main.js" as="script" />

        {/* DNS prefetch for potential future external services */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Icons and manifest */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
