# SEO Quick Reference Guide

## Quick Start

### Adding SEO to a New Page

1. **Import required components:**
```typescript
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useSEO } from '@/hooks/useSEO';
```

2. **Use the SEO hook:**
```typescript
const seoData = useSEO({
  title: 'Page Title',
  description: 'Page description (150-160 chars)',
  keywords: ['keyword1', 'keyword2'],
  type: 'website', // or 'product', 'article', 'collection'
  context: { petType: 'dog', category: 'food' },
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Current Page', url: '/current' }
  ]
});
```

3. **Render SEO components:**
```typescript
return (
  <>
    <SEO
      title={seoData.title}
      description={seoData.description}
      keywords={seoData.keywords}
      url={seoData.canonicalUrl}
    />
    {seoData.breadcrumbSchema && (
      <StructuredData type="breadcrumb" data={seoData.breadcrumbSchema} />
    )}
    {/* Your page content */}
  </>
);
```

## Common Patterns

### Product Page
```typescript
const seoData = useSEO({
  title: product.name,
  description: product.description.substring(0, 160),
  keywords: [product.name, product.brand, product.category],
  type: 'product',
  context: {
    petType: product.petType,
    category: product.category?.name,
    brand: product.brand
  },
  breadcrumbs: buildBreadcrumbs(product)
});

<SEO {...seoData} type="product" price={product.price} />
<StructuredData type="product" data={productData} />
```

### Collection Page (Category/PetType)
```typescript
const seoData = useSEO({
  title: `${category.name} for ${petType}`,
  description: `Shop ${category.name} for ${petType}...`,
  type: 'collection',
  context: { petType, category: category.name },
  items: products.map(p => ({
    name: p.name,
    url: `/products/${p.slug}`,
    image: p.images[0]
  }))
});

<SEO {...seoData} />
{seoData.collectionPageSchema && (
  <StructuredData type="collectionPage" data={seoData.collectionPageSchema} />
)}
```

### FAQ Page
```typescript
import { generateFAQSchema } from '@/utils/seoUtils';

const faqSchema = generateFAQSchema([
  { question: 'Q1?', answer: 'A1' },
  { question: 'Q2?', answer: 'A2' }
]);

<StructuredData type="faq" data={faqSchema} />
```

## Utility Functions

### Generate Canonical URL
```typescript
import { generateCanonicalUrl } from '@/utils/seoUtils';
const url = generateCanonicalUrl('/products/dog-food');
// Returns: https://www.petshiwu.com/products/dog-food
```

### Generate Keywords
```typescript
import { generateMetaKeywords } from '@/utils/seoUtils';
const keywords = generateMetaKeywords('dog food', ['premium', 'natural'], {
  petType: 'dog',
  category: 'food'
});
```

### Generate Breadcrumbs
```typescript
import { generateBreadcrumbSchema } from '@/utils/seoUtils';
const schema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Products', url: '/products' }
]);
```

## Internal Linking

### Using InternalLinks Component
```typescript
import InternalLinks from '@/components/InternalLinks';

<InternalLinks
  category="dog-food"
  petType="dog"
  relatedProducts={relatedProducts}
/>
```

### Programmatic Internal Links
```typescript
import { generateInternalLinks } from '@/utils/seoUtils';

const links = generateInternalLinks('dog-food', 'dog', relatedProducts);
// Returns array of link objects
```

## Structured Data Types

### Available Types
- `product` - Product schema with ratings, prices
- `organization` - Business information
- `website` - Site-wide schema
- `breadcrumb` - Navigation breadcrumbs
- `itemList` - List of items (products)
- `collectionPage` - Collection/category page
- `faq` - FAQ page
- `review` - Product reviews

## Best Practices

1. **Titles**: Keep under 60 characters, include brand name
2. **Descriptions**: 150-160 characters, include call-to-action
3. **Keywords**: 5-10 relevant keywords, avoid keyword stuffing
4. **Images**: Use high-quality images (1200x630 for OG images)
5. **URLs**: Keep clean and descriptive, use hyphens
6. **Breadcrumbs**: Always include for navigation pages
7. **Structured Data**: Validate with Google Rich Results Test

## Testing

### Validate Structured Data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

### Check Meta Tags
- View page source
- Use browser dev tools
- Check Open Graph with: https://www.opengraph.xyz/

### Sitemap
- Access at: `/sitemap.xml`
- Submit to Google Search Console
- Check for errors

## Common Issues

### Issue: Meta tags not showing
**Solution**: Ensure HelmetProvider wraps your app in `main.tsx`

### Issue: Structured data not validating
**Solution**: Check JSON syntax, ensure all required fields are present

### Issue: Sitemap not updating
**Solution**: Clear cache, check database queries, verify model imports

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

