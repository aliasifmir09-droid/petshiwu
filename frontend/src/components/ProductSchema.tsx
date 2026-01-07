import { Helmet } from 'react-helmet-async';
import { Product } from '@/types';
import { generateProductUrl } from '@/utils/productUrl';

interface ProductSchemaProps {
  product: Product;
  selectedVariant?: {
    price?: number;
    stock?: number;
  };
  baseUrl?: string;
}

/**
 * ProductSchema Component
 * Dynamically generates JSON-LD structured data for a product page
 * Pulls data directly from the product object
 */
const ProductSchema = ({ 
  product, 
  selectedVariant,
  baseUrl = 'https://www.petshiwu.com'
}: ProductSchemaProps) => {
  // Extract product data
  const productName = product.name || '';
  const productDescription = product.description 
    ? (typeof product.description === 'string' 
        ? product.description 
        : product.description.toString())
    : '';
  
  // Get product images - normalize URLs
  const normalizeImageUrl = (image: any): string => {
    if (!image) return '';
    if (typeof image === 'string') {
      if (image.startsWith('http')) return image;
      if (image.startsWith('/')) return `${baseUrl}${image}`;
      return `${baseUrl}/${image}`;
    }
    if (image.url) {
      if (image.url.startsWith('http')) return image.url;
      if (image.url.startsWith('/')) return `${baseUrl}${image.url}`;
      return `${baseUrl}/${image.url}`;
    }
    return '';
  };

  const productImages = product.images 
    ? (Array.isArray(product.images) 
        ? product.images.map(normalizeImageUrl).filter(Boolean)
        : [normalizeImageUrl(product.images)].filter(Boolean))
    : [];

  // Get price - use selected variant price if available, otherwise base price
  const price = selectedVariant?.price ?? product.basePrice ?? 0;
  
  // Get availability
  const stock = selectedVariant?.stock ?? product.totalStock ?? 0;
  const availability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  
  // Get product URL
  const productUrl = `${baseUrl}${generateProductUrl(product)}`;
  
  // Get category name
  const categoryName = typeof product.category === 'object' && product.category?.name
    ? product.category.name
    : '';

  // Build the schema
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: productImages.length > 0 ? productImages : [`${baseUrl}/logo.png`],
    brand: {
      '@type': 'Brand',
      name: product.brand || 'PetShiwu'
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: price.toString(),
      availability: availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'PetShiwu'
      }
    }
  };

  // Add SKU if available
  if (product.sku) {
    (schema as any).sku = product.sku;
  }

  // Add MPN if available
  if (product.mpn) {
    (schema as any).mpn = product.mpn;
  }

  // Add category if available
  if (categoryName) {
    (schema as any).category = categoryName;
  }

  // Add aggregate rating if available
  if (product.averageRating && product.totalReviews && product.totalReviews > 0) {
    (schema as any).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating.toString(),
      reviewCount: product.totalReviews.toString(),
      bestRating: '5',
      worstRating: '1'
    };
  }

  // Add GTIN if available
  if (product.gtin) {
    (schema as any).gtin = product.gtin;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema, null, 2)}
      </script>
    </Helmet>
  );
};

export default ProductSchema;

