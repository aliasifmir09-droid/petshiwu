import { Helmet } from 'react-helmet-async';

interface ProductSchema {
  name: string;
  description: string;
  image: string[];
  brand: string;
  price: number;
  currency?: string;
  availability: 'InStock' | 'OutOfStock';
  rating?: number;
  ratingCount?: number;
  url: string;
}

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
}

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website' | 'breadcrumb';
  data: ProductSchema | OrganizationSchema | any;
}

const StructuredData = ({ type, data }: StructuredDataProps) => {
  let schema: any = {};

  switch (type) {
    case 'product':
      const product = data as ProductSchema;
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: {
          '@type': 'Brand',
          name: product.brand
        },
        offers: {
          '@type': 'Offer',
          url: product.url,
          priceCurrency: product.currency || 'USD',
          price: product.price,
          availability: product.availability === 'InStock' 
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock'
        }
      };

      if (product.rating && product.ratingCount) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.ratingCount
        };
      }
      break;

    case 'organization':
      const org = data as OrganizationSchema;
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: org.name,
        url: org.url,
        logo: org.logo,
        description: org.description,
        contactPoint: org.contactPoint
      };
      break;

    case 'website':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'petshiwu',
        url: 'https://petshiwu.com',
        description: 'Everything Your Pet Needs - Quality Pet Supplies Online',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://petshiwu.com/products?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
      break;

    case 'breadcrumb':
      schema = data;
      break;

    default:
      return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default StructuredData;

