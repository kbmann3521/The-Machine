export let siteMetadata = {
  name: '',
  description: '',
  url: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || '',
  author: '',
  keywords: '',
}

// Update siteMetadata with database settings
export function setSiteMetadata(dbSettings) {
  if (dbSettings) {
    siteMetadata = {
      name: dbSettings.site_name || '',
      description: dbSettings.default_description || '',
      url: dbSettings.canonical_base_url || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''),
      author: dbSettings.author || '',
      keywords: dbSettings.keywords || '',
    }
  }
}

export function generateMetaTags(tool = null, seoSettings = null) {
  // Update metadata if SEO settings provided
  if (seoSettings) {
    setSiteMetadata(seoSettings)
  }

  if (tool) {
    return {
      title: `${tool.name} - Free Online Tool${siteMetadata.name ? ' | ' + siteMetadata.name : ''}`,
      description: tool.description,
      keywords: `${tool.name.toLowerCase()}, ${tool.category}, online tool`,
    }
  }

  return {
    title: seoSettings?.default_title || '',
    description: siteMetadata.description,
    keywords: siteMetadata.keywords,
  }
}

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

export function generateBreadcrumbSchema(items = [], dbSettings = null) {
  const metadata = dbSettings ? { ...siteMetadata, url: dbSettings.canonical_base_url || siteMetadata.url } : siteMetadata

  const breadcrumbs = [
    { position: 1, name: 'Home', item: metadata.url },
    ...items,
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  }
}

export function generateSoftwareAppSchema(dbSettings = null) {
  const metadata = dbSettings ? { ...siteMetadata, name: dbSettings.site_name || siteMetadata.name, description: dbSettings.default_description || siteMetadata.description } : siteMetadata

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: metadata.name,
    description: metadata.description,
    url: metadata.url,
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

export function generateToolSchema(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'Utility',
    url: `${siteMetadata.url}/?tool=${tool.toolId}`,
    operatingSystem: 'Web',
  }
}
