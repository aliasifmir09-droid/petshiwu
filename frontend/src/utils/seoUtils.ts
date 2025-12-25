/**
 * SEO Utility Functions
 * Centralized utilities for generating SEO-friendly metadata, URLs, and content
 */

const BASE_URL = 'https://www.petshiwu.com';

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Generate SEO-friendly title
 */
export const generateTitle = (title: string, includeBrand = true): string => {
  const brandSuffix = includeBrand ? ' | petshiwu' : '';
  if (title.includes('petshiwu')) {
    return title;
  }
  return `${title}${brandSuffix}`;
};

/**
 * Generate SEO-friendly description
 */
export const generateDescription = (
  content: string,
  maxLength = 160
): string => {
  if (content.length <= maxLength) {
    return content;
  }
  // Truncate at word boundary
  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0
    ? `${truncated.substring(0, lastSpace)}...`
    : `${truncated}...`;
};

/**
 * Generate keywords from array or string
 */
export const generateKeywords = (
  keywords: string[] | string,
  additional: string[] = []
): string => {
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  const allKeywords = [...keywordArray, ...additional].filter(Boolean);
  return [...new Set(allKeywords)].join(', ');
};

/**
 * Generate breadcrumb schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const generateBreadcrumbSchema = (
  items: BreadcrumbItem[]
): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: generateCanonicalUrl(item.url)
    }))
  };
};

/**
 * Generate ItemList schema for product collections
 */
export const generateItemListSchema = (
  items: Array<{ name: string; url: string; image?: string }>,
  name: string,
  description?: string
): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: generateCanonicalUrl(item.url),
      ...(item.image && { image: item.image })
    }))
  };
};

/**
 * Generate CollectionPage schema
 */
export const generateCollectionPageSchema = (
  name: string,
  description: string,
  url: string,
  items: Array<{ name: string; url: string }>
): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: generateCanonicalUrl(url),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: generateCanonicalUrl(item.url)
      }))
    }
  };
};

/**
 * Generate FAQ schema
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const generateFAQSchema = (faqs: FAQItem[]): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

/**
 * Generate Review/Rating schema
 */
export const generateReviewSchema = (
  reviews: Array<{
    author: string;
    rating: number;
    reviewBody: string;
    datePublished?: string;
  }>,
  averageRating?: number,
  reviewCount?: number
): object => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating || 0,
      reviewCount: reviewCount || reviews.length,
      bestRating: 5,
      worstRating: 1
    }
  };

  if (reviews.length > 0) {
    schema.review = reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author
      },
      datePublished: review.datePublished || new Date().toISOString(),
      reviewBody: review.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      }
    }));
  }

  return schema;
};

/**
 * Generate internal linking suggestions
 */
export interface InternalLink {
  text: string;
  url: string;
  description?: string;
}

export const generateInternalLinks = (
  category?: string,
  petType?: string,
  relatedProducts?: Array<{ name: string; slug: string }>
): InternalLink[] => {
  const links: InternalLink[] = [];

  // Category links
  if (category) {
    links.push({
      text: `View all ${category} products`,
      url: `/category/${category}`,
      description: `Browse our complete selection of ${category}`
    });
  }

  // Pet type links
  if (petType) {
    links.push({
      text: `${petType.charAt(0).toUpperCase() + petType.slice(1)} products`,
      url: `/${petType}`,
      description: `Shop all ${petType} supplies and accessories`
    });
  }

  // Related product links
  if (relatedProducts && relatedProducts.length > 0) {
    relatedProducts.slice(0, 5).forEach((product) => {
      links.push({
        text: product.name,
        url: `/products/${product.slug}`,
        description: `View ${product.name} details`
      });
    });
  }

  return links;
};

/**
 * Generate meta keywords from product/category data
 */
export const generateMetaKeywords = (
  primary: string,
  secondary: string[] = [],
  context?: {
    petType?: string;
    category?: string;
    brand?: string;
  }
): string => {
  const keywords: string[] = [primary, ...secondary];

  // Add context-specific keywords
  if (context?.petType) {
    keywords.push(`${context.petType} products`, `${context.petType} supplies`);
  }
  if (context?.category) {
    keywords.push(context.category);
  }
  if (context?.brand) {
    keywords.push(context.brand);
  }

  // Add common pet-related keywords
  keywords.push(
    'pet supplies',
    'online pet store',
    'pet food',
    'pet accessories',
    'pet care'
  );

  return [...new Set(keywords)].join(', ');
};

/**
 * Generate Open Graph image URL
 */
export const generateOGImage = (image?: string): string => {
  if (!image) {
    return `${BASE_URL}/logo.png`;
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

/**
 * Generate structured data for organization
 */
export const generateOrganizationSchema = (): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'petshiwu',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'Everything Your Pet Needs - Quality Pet Supplies Online',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-626-342-0419',
      contactType: 'Customer Service',
      areaServed: 'US',
      availableLanguage: 'English'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jackson Heights',
      addressRegion: 'NY',
      addressCountry: 'US'
    },
    sameAs: [
      'https://www.facebook.com/petshiwu',
      'https://www.instagram.com/petshiwu',
      'https://twitter.com/petshiwu'
    ]
  };
};

