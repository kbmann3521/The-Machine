/**
 * Pure SEO utilities module
 * NO mutable global state - all functions accept inputs and return outputs
 * Safe for concurrent requests and deterministic
 */

/**
 * Build base metadata from database SEO settings
 * @param {object} seoSettings - SEO settings from database
 * @returns {object} Base metadata object
 */
export function buildBaseMetadata(seoSettings) {
  if (!seoSettings) {
    return {
      siteName: '',
      defaultTitle: '',
      description: '',
      canonicalBaseUrl: '',
      author: '',
      keywords: '',
    }
  }

  return {
    siteName: seoSettings.site_name || '',
    defaultTitle: seoSettings.default_title || '',
    description: seoSettings.default_description || '',
    canonicalBaseUrl: seoSettings.canonical_base_url || '',
    author: seoSettings.author || '',
    keywords: seoSettings.keywords || '',
  }
}

/**
 * Generate page metadata for Next.js
 * @param {object} options - { seoSettings, title, description, path, tool, toolMetadata }
 * toolMetadata = { name, description } for tool pages (for template replacement)
 * @returns {object} Next.js metadata object
 */
export function generatePageMetadata({ seoSettings, title, description, path, tool, toolMetadata }) {
  const base = buildBaseMetadata(seoSettings)

  let finalTitle = title
  if (tool) {
    finalTitle = `${tool.name} - Free Online Tool${base.siteName ? ' | ' + base.siteName : ''}`
  } else if (!finalTitle) {
    finalTitle = base.defaultTitle
  } else if (base.siteName) {
    finalTitle = `${title} | ${base.siteName}`
  }

  const finalDescription = description || base.description

  // Build OG title and description
  let ogTitle = seoSettings?.og_title || finalTitle
  let ogDescription = seoSettings?.og_description || finalDescription

  // If toolMetadata is provided, use tool-specific templates for OG tags
  if (toolMetadata) {
    const { replaceToolPlaceholders } = require('./seo-template-utils')

    if (seoSettings?.tool_og_title_template) {
      ogTitle = replaceToolPlaceholders(seoSettings.tool_og_title_template, toolMetadata)
    }
    if (seoSettings?.tool_og_description_template) {
      ogDescription = replaceToolPlaceholders(seoSettings.tool_og_description_template, toolMetadata)
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: base.keywords,
    canonical: base.canonicalBaseUrl && path ? `${base.canonicalBaseUrl}${path}` : base.canonicalBaseUrl,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: base.canonicalBaseUrl && path ? `${base.canonicalBaseUrl}${path}` : base.canonicalBaseUrl,
      type: seoSettings?.og_type || 'website',
      ...(seoSettings?.og_image_url && { image: seoSettings.og_image_url }),
    },
    twitter: {
      card: seoSettings?.twitter_card_type || 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      ...(seoSettings?.twitter_site && { site: seoSettings.twitter_site }),
      ...(seoSettings?.twitter_creator && { creator: seoSettings.twitter_creator }),
    },
  }
}

/**
 * Generate FAQ schema
 * @param {object} seoSettings - SEO settings from database (for dynamic site name)
 * @returns {object} FAQ schema
 */
export function generateFAQSchema(seoSettings = {}) {
  const base = buildBaseMetadata(seoSettings)
  const siteName = base.siteName || 'Pioneer Web Tools'

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${siteName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${siteName} is a collection of free, fast utilities for text transformation, data conversion, image processing, encoding, formatting, and analysis. It includes tools for working with text, data formats, cryptography, colors, images, code, and more.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Are these tools free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, all tools on ${siteName} are completely free to use. No registration, account, or payment is required.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How does tool detection work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${siteName} uses 100% deterministic detection algorithms to analyze your input and recommend the most relevant tools. The detection is rule-based and pattern-matching, not AI-powered. Paste any text or upload an image, and the system instantly identifies what tools can help.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Is my data private and secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all processing happens locally in your browser. No data is sent to servers, stored in databases, or shared with third parties. Your privacy is completely protected.',
        },
      },
      {
        '@type': 'Question',
        name: 'What types of tools are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${siteName} offers utilities across multiple categories: Text Tools (case conversion, reversal, trimming), Encoders/Decoders (Base64, URL, HTML, escape sequences), Data Converters (JSON, CSV, XML, YAML), Image Tools (resizing, compression, format conversion), Code Formatters (JavaScript, CSS, SQL, HTML), Cryptographic Tools (hashing, checksums, encryption), and many more.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need an internet connection?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You need an internet connection to access ${siteName} initially, but once loaded, most operations work offline in your browser. No live server calls are required for tool execution.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use these tools offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After the page loads, the tools function entirely in your browser and do not require internet connectivity for processing. You can continue using the tools offline until you refresh the page.',
        },
      },
      {
        '@type': 'Question',
        name: 'What browsers are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${siteName} works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. For the best experience, keep your browser updated to the latest version.`,
        },
      },
    ],
  }
}

/**
 * Generate breadcrumb schema
 * @param {object} seoSettings - SEO settings from database
 * @param {array} items - Array of { name, path } breadcrumb items
 * @returns {object} Breadcrumb schema
 */
export function generateBreadcrumbSchema(seoSettings, items = []) {
  const base = buildBaseMetadata(seoSettings)

  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: base.canonicalBaseUrl,
    },
    ...items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 2,
      name: item.name,
      item: base.canonicalBaseUrl && item.path ? `${base.canonicalBaseUrl}${item.path}` : item.path,
    })),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  }
}

/**
 * Generate software app schema
 * @param {object} seoSettings - SEO settings from database
 * @returns {object} Schema.org SoftwareApplication schema
 */
export function generateSoftwareAppSchema(seoSettings) {
  const base = buildBaseMetadata(seoSettings)

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: base.siteName,
    description: base.description,
    url: base.canonicalBaseUrl,
    applicationCategory: 'Utility',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      name: 'User Rating',
      ratingValue: '4.8',
      ratingCount: '500',
    },
  }
}

/**
 * Generate tool schema
 * @param {object} tool - Tool object with name, description, category, toolId
 * @param {object} seoSettings - SEO settings from database
 * @returns {object} Schema.org SoftwareApplication schema for tool
 */
export function generateToolSchema(tool, seoSettings) {
  const base = buildBaseMetadata(seoSettings)

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'Utility',
    url: base.canonicalBaseUrl ? `${base.canonicalBaseUrl}/?tool=${tool.toolId}` : `/?tool=${tool.toolId}`,
    operatingSystem: 'Web',
  }
}

/**
 * Build next.js Head meta tags (for manual Head injection if needed)
 * @param {object} metadata - Metadata object from generatePageMetadata
 * @returns {object} Object with title, description, etc. for use in Head
 */
export function buildHeadTags(metadata) {
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    canonical: metadata.canonical,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
  }
}
