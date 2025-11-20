export const siteMetadata = {
  name: 'All-in-One Internet Tools',
  description: 'Free AI-powered tools for text transformation, image processing, encoding, formatting, and more. Get instant tool recommendations based on your input.',
  url: 'https://your-domain.com',
  author: 'Your Name',
  keywords: 'online tools, text tools, image tools, converters, formatters, generators, ai tools',
}

export function generateMetaTags(tool = null) {
  if (tool) {
    return {
      title: `${tool.name} - Free Online Tool | All-in-One Tools`,
      description: tool.description,
      keywords: `${tool.name.toLowerCase()}, ${tool.category}, online tool`,
    }
  }

  return {
    title: `All-in-One Internet Tools - Free Online Utilities`,
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

export function generateBreadcrumbSchema(items = []) {
  const breadcrumbs = [
    { position: 1, name: 'Home', item: siteMetadata.url },
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

export function generateSoftwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteMetadata.name,
    description: siteMetadata.description,
    url: siteMetadata.url,
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
