/**
 * SEO Hook
 * Custom hook for generating SEO metadata based on page context
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  generateCanonicalUrl,
  generateTitle,
  generateDescription,
  generateMetaKeywords,
  generateOGImage,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateCollectionPageSchema,
  type BreadcrumbItem
} from '@/utils/seoUtils';

interface UseSEOOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'product' | 'article' | 'collection';
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  items?: Array<{ name: string; url: string; image?: string }>;
  context?: {
    petType?: string;
    category?: string;
    brand?: string;
  };
  additionalMeta?: Record<string, string>;
}

export const useSEO = (options: UseSEOOptions = {}) => {
  const location = useLocation();
  const {
    title,
    description,
    keywords = [],
    image,
    type = 'website',
    noindex = false,
    breadcrumbs,
    items,
    context,
    additionalMeta = {}
  } = options;

  const canonicalUrl = useMemo(
    () => generateCanonicalUrl(location.pathname + location.search),
    [location.pathname, location.search]
  );

  const seoTitle = useMemo(
    () => (title ? generateTitle(title) : 'PetShiwu | Premium Pet Food, Toys & Accessories in USA'),
    [title]
  );

  const seoDescription = useMemo(() => {
    if (description) {
      return generateDescription(description);
    }
    return 'Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, fish, reptiles, and small pets. Quality products, fast shipping, great prices.';
  }, [description]);

  const seoKeywords = useMemo(() => {
    if (keywords.length > 0 || context) {
      return generateMetaKeywords(
        keywords[0] || 'pet supplies',
        keywords.slice(1),
        context
      );
    }
    return 'pet supplies, dog food, cat food, pet toys, pet accessories, pet care, online pet store, premium pet food';
  }, [keywords, context]);

  const ogImage = useMemo(() => generateOGImage(image), [image]);

  const breadcrumbSchema = useMemo(() => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    return generateBreadcrumbSchema(breadcrumbs);
  }, [breadcrumbs]);

  const itemListSchema = useMemo(() => {
    if (!items || items.length === 0) return null;
    return generateItemListSchema(items, seoTitle, seoDescription);
  }, [items, seoTitle, seoDescription]);

  const collectionPageSchema = useMemo(() => {
    if (type !== 'collection' || !items || items.length === 0) return null;
    return generateCollectionPageSchema(
      seoTitle,
      seoDescription,
      location.pathname,
      items
    );
  }, [type, items, seoTitle, seoDescription, location.pathname]);

  return {
    canonicalUrl,
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    image: ogImage,
    type,
    noindex,
    breadcrumbSchema,
    itemListSchema,
    collectionPageSchema,
    additionalMeta
  };
};

