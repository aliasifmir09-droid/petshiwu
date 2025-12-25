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
  sku?: string;
  category?: string;
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
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website' | 'breadcrumb' | 'itemList' | 'collectionPage' | 'faq' | 'review';
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
          reviewCount: product.ratingCount,
          bestRating: 5,
          worstRating: 1
        };
      }

      if (product.sku) {
        schema.sku = product.sku;
      }

      if (product.category) {
        schema.category = product.category;
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
        contactPoint: org.contactPoint ? {
          '@type': 'ContactPoint',
          telephone: org.contactPoint.telephone,
          contactType: org.contactPoint.contactType,
          areaServed: 'US',
          availableLanguage: 'English'
        } : undefined,
        address: org.address ? {
          '@type': 'PostalAddress',
          streetAddress: org.address.streetAddress,
          addressLocality: org.address.addressLocality,
          addressRegion: org.address.addressRegion,
          postalCode: org.address.postalCode,
          addressCountry: org.address.addressCountry
        } : undefined,
        sameAs: [
          'https://www.facebook.com/petshiwu',
          'https://www.instagram.com/petshiwu',
          'https://twitter.com/petshiwu'
        ]
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

    case 'itemList':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        ...data
      };
      break;

    case 'collectionPage':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        ...data
      };
      break;

    case 'faq':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: Array.isArray(data) ? data : data.mainEntity || []
      };
      break;

    case 'review':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        ...data
      };
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

