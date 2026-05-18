import { Helmet } from 'react-helmet-async';
import { ProductVariant } from '@/types';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { generateProductUrl } from '@/utils/productUrl';

interface ProductSchemaProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  images?: string[];
  basePrice?: number;
  compareAtPrice?: number;
  averageRating?: number;
  totalReviews?: number;
  reviewCount?: number;
  inStock?: boolean;
  totalStock?: number;
  variants?: ProductVariant[];
  category?: { name?: string; slug?: string } | string;
  petType?: string;
  tags?: string[];
}

interface ProductSchemaProps {
  product: ProductSchemaProduct;
  selectedVariant?: ProductVariant;
}

/**
 * Injects JSON-LD Product schema (schema.org/Product).
 * This is what unlocks Google rich snippets: price, availability, and
 * star ratings shown directly in search results — significant CTR boost.
 */
const ProductSchema = ({ product, selectedVariant }: ProductSchemaProps) => {
  if (!product) return null;

  const price = selectedVariant?.price ?? product.basePrice ?? 0;
  const stock = selectedVariant?.stock ?? product.totalStock ?? 0;
  const inStock = stock > 0 && (product.inStock !== false);
  const sku = selectedVariant?.sku ?? product._id;

  // Collect all product images, normalised
  const rawImages = product.images ?? [];
  const images = rawImages
    .map((img) => {
      try { return normalizeImageUrl(img); } catch { return img; }
    })
    .filter(Boolean)
    .slice(0, 10); // Google accepts up to 10

  const productUrl = `https://www.petshiwu.com${generateProductUrl(product as Parameters<typeof generateProductUrl>[0])}`;

  const description = product.description
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 500)
    : `${product.name} - premium pet supplies at PetShiwu`;

  const brandName = product.brand?.trim() || 'PetShiwu';

  // Build the Product JSON-LD
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: images.length > 0 ? (images.length === 1 ? images[0] : images) : 'https://www.petshiwu.com/logo.png',
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    sku,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: price.toFixed(2),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'PetShiwu',
        url: 'https://www.petshiwu.com',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: price >= 49 ? '0' : '6',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  // Add compareAtPrice as highPrice if present
  const comparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  if (comparePrice && comparePrice > price) {
    (schema.offers as Record<string, unknown>)['@type'] = 'AggregateOffer';
    (schema.offers as Record<string, unknown>).lowPrice = price.toFixed(2);
    (schema.offers as Record<string, unknown>).highPrice = comparePrice.toFixed(2);
    delete (schema.offers as Record<string, unknown>).price;
  }

  // Aggregate rating — only include if we have real data
  const ratingValue = product.averageRating ?? 0;
  const reviewCount = product.totalReviews ?? product.reviewCount ?? 0;
  if (ratingValue > 0 && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // BreadcrumbList schema
  const petTypeLabel = product.petType === 'cat' ? 'Cat' : product.petType === 'dog' ? 'Dog' : 'Other Animals';
  const petTypePath = product.petType === 'other-animals' ? 'other-animals' : product.petType;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const categorySlug = typeof product.category === 'object' ? product.category?.slug : undefined;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.petshiwu.com',
      },
      ...(petTypePath ? [{
        '@type': 'ListItem',
        position: 2,
        name: petTypeLabel,
        item: `https://www.petshiwu.com/${petTypePath}`,
      }] : []),
      ...(categoryName && categorySlug ? [{
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `https://www.petshiwu.com/${petTypePath}/${categorySlug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: petTypePath && categoryName ? 4 : petTypePath ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  );
};

export default ProductSchema;
