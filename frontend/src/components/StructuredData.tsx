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

interface LocalBusinessSchema {
  name: string;
  url: string;
  logo?: string;
  image?: string;
  description?: string;
  telephone: string;
  email?: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  priceRange?: string;
  servesCuisine?: string;
  areaServed?: string | string[];
  businessType?: string | string[];
  hasMap?: string;
  paymentAccepted?: string;
  currenciesAccepted?: string;
  sameAs?: string[];
}

interface ArticleSchema {
  headline: string;
  description?: string;
  image?: string | string[];
  author?: { name: string; byline?: string; profileUrl?: string; jobTitle?: string; knowsAbout?: string[] };
  datePublished?: string;
  dateModified?: string;
  url: string;
  publisher?: { name: string; logo?: string };
  speakable?: boolean;
}

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website' | 'breadcrumb' | 'itemList' | 'collectionPage' | 'faq' | 'review' | 'localBusiness' | 'article';
  data: ProductSchema | OrganizationSchema | LocalBusinessSchema | ArticleSchema | any;
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
        '@context': 'https://schema.org/',
        '@type': 'Organization',
        name: org.name,
        url: org.url,
        logo: {
          '@type': 'ImageObject',
          url: org.logo,
          width: 512,
          height: 512,
        },
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
        '@context': 'https://schema.org/',
        '@type': 'WebSite',
        name: 'Petshiwu',
        url: 'https://www.petshiwu.com',
        description: 'Premium pet food, toys and supplies delivered to Queens, Brooklyn and all of NYC. 10,000+ products, free shipping over $49.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.petshiwu.com/products?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
      break;

    case 'breadcrumb':
      schema = data;
      break;

    case 'itemList':
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'ItemList',
        ...data
      };
      break;

    case 'collectionPage':
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'CollectionPage',
        ...data
      };
      break;

    case 'faq':
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'FAQPage',
        mainEntity: Array.isArray(data) ? data : data.mainEntity || []
      };
      break;

    case 'review':
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        ...data
      };
      break;

    case 'article':
      const article = data as ArticleSchema;
      schema = {
        '@context': 'https://schema.org/',
        '@type': 'Article',
        headline: article.headline,
        description: article.description || article.headline,
        url: article.url,
        author: article.author ? {
          '@type': 'Person',
          name: article.author.byline || article.author.name,
          ...(article.author.byline ? { alternateName: article.author.name } : {}),
          ...(article.author.jobTitle ? { jobTitle: article.author.jobTitle } : { jobTitle: 'Pet Care Specialist' }),
          ...(article.author.profileUrl ? { url: article.author.profileUrl } : { url: 'https://www.petshiwu.com/about' }),
          worksFor: {
            '@type': 'Organization',
            name: 'Petshiwu',
            url: 'https://www.petshiwu.com'
          },
          knowsAbout: article.author.knowsAbout || [
            'Dog nutrition',
            'Cat nutrition',
            'Pet health',
            'Veterinary diets',
            'NYC pet care'
          ]
        } : undefined,
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        publisher: article.publisher ? {
          '@type': 'Organization',
          name: article.publisher.name,
          logo: article.publisher.logo ? {
            '@type': 'ImageObject',
            url: article.publisher.logo
          } : undefined
        } : {
          '@type': 'Organization',
          name: 'Petshiwu',
          logo: { '@type': 'ImageObject', url: 'https://www.petshiwu.com/logo.png' }
        }
      };
      if (article.image) {
        schema.image = Array.isArray(article.image) ? article.image : [article.image];
      }
      // Speakable schema — enables AI Overview / voice assistant citation
      if (article.speakable) {
        (schema as any).speakable = {
          '@type': 'SpeakableSpecification',
          xpath: [
            '/html/head/title',
            '/html/body//h1',
            '/html/body//article//p[1]'
          ]
        };
      }
      break;

    case 'localBusiness':
      const business = data as LocalBusinessSchema;
      schema = {
        '@context': 'https://schema.org/',
        '@type': business.businessType || 'PetStore',
        name: business.name,
        url: business.url,
        description: business.description || 'Premium Pet Food, Toys & Accessories delivered in NYC',
        telephone: business.telephone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address.streetAddress,
          addressLocality: business.address.addressLocality,
          addressRegion: business.address.addressRegion,
          postalCode: business.address.postalCode,
          addressCountry: business.address.addressCountry
        }
      };

      if (business.logo) (schema as any).logo = business.logo;
      if (business.image) (schema as any).image = business.image;
      if (business.email) (schema as any).email = business.email;
      if (business.hasMap) (schema as any).hasMap = business.hasMap;
      if (business.paymentAccepted) (schema as any).paymentAccepted = business.paymentAccepted;
      if (business.currenciesAccepted) (schema as any).currenciesAccepted = business.currenciesAccepted;

      if (business.geo) {
        (schema as any).geo = {
          '@type': 'GeoCoordinates',
          latitude: business.geo.latitude,
          longitude: business.geo.longitude
        };
      }

      if (business.openingHoursSpecification && business.openingHoursSpecification.length > 0) {
        (schema as any).openingHoursSpecification = business.openingHoursSpecification.map(hours => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: hours.dayOfWeek,
          opens: hours.opens,
          closes: hours.closes
        }));
      }

      if (business.priceRange) (schema as any).priceRange = business.priceRange;
      if (business.areaServed) (schema as any).areaServed = business.areaServed;

      (schema as any).sameAs = business.sameAs || [
        'https://www.facebook.com/petshiwu',
        'https://www.instagram.com/petshiwu',
        'https://twitter.com/petshiwu'
      ];
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

