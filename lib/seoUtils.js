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
 * @param {object} options - { seoSettings, title, description, path, tool }
 * @returns {object} Next.js metadata object
 */
export function generatePageMetadata({ seoSettings, title, description, path, tool }) {
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

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: base.keywords,
    canonical: base.canonicalBaseUrl && path ? `${base.canonicalBaseUrl}${path}` : base.canonicalBaseUrl,
    openGraph: {
      title: seoSettings?.og_title || finalTitle,
      description: seoSettings?.og_description || finalDescription,
      url: base.canonicalBaseUrl && path ? `${base.canonicalBaseUrl}${path}` : base.canonicalBaseUrl,
      type: seoSettings?.og_type || 'website',
      ...(seoSettings?.og_image_url && { image: seoSettings.og_image_url }),
    },
    twitter: {
      card: seoSettings?.twitter_card_type || 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      ...(seoSettings?.twitter_site && { site: seoSettings.twitter_site }),
      ...(seoSettings?.twitter_creator && { creator: seoSettings.twitter_creator }),
    },
  }
}

/**
 * Generate FAQ schema
 * Hardcoded FAQ content - customize as needed
 */
export function generateFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are all-in-one internet tools?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All-in-one internet tools are a collection of free utilities designed to help you perform common text transformations, image processing, encoding, formatting, and data conversions without needing separate applications.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are these tools free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all our tools are completely free to use. No registration or payment required.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get tool recommendations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply start typing your input text or upload an image, and our AI will automatically recommend the best tools for your task.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you store my data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, all processing happens locally in your browser. We do not store or access any of your data.',
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
    { position: 1, name: 'Home', item: base.canonicalBaseUrl },
    ...items.map((item, idx) => ({
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
