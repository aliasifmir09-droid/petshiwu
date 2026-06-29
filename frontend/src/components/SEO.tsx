import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock';
  noindex?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  brand?: string;
  sku?: string;
  rating?: number;
  ratingCount?: number;
}

const SITE_URL = 'https://www.petshiwu.com';
const SITE_NAME = 'Petshiwu';

const SEO = ({
  title = 'Petshiwu | Premium Pet Food, Toys & Accessories in USA',
  description = 'Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, fish, reptiles, and small pets. Quality products, fast shipping, great prices. Free shipping on orders over $49.',
  keywords = 'pet supplies, dog food, cat food, pet toys, pet accessories, pet care, online pet store, premium pet food, dog treats, cat treats, pet bedding, pet grooming, pet health, pet nutrition, pet shop online, buy pet food online, pet supplies near me',
  image = `${SITE_URL}/logo.png`,
  url,
  type = 'website',
  price,
  currency = 'USD',
  availability = 'instock',
  noindex = false,
  author,
  publishedTime,
  modifiedTime,
  category,
  brand,
  sku,
  rating,
  ratingCount,
}: SEOProps) => {
  // FIX 1: Auto-detect current page URL when url prop is not provided.
  // Every page gets its own correct canonical automatically,
  // even if the page component forgot to pass the url prop.
  const resolvedUrl = (() => {
    if (url) {
      if (url.startsWith('https://')) return url;
      return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    }
    if (typeof window !== 'undefined') {
      return `${SITE_URL}${window.location.pathname}`;
    }
    return SITE_URL;
  })();

  const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  // FIX 2: Case-insensitive check prevents double-branding like
  // "Petshiwu — Premium Pet Food | petshiwu"
  const fullTitle = title.toLowerCase().includes('petshiwu')
    ? title
    : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || SITE_NAME} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Geographic targeting */}
      <meta name="geo.region" content="US-NY" />
      <meta name="geo.placename" content="Jackson Heights" />
      <meta name="geo.position" content="40.7489;-73.8850" />
      <meta name="ICBM" content="40.7489, -73.8850" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {category && <meta property="article:section" content={category} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@petshiwu" />
      <meta name="twitter:creator" content="@petshiwu" />

      {/* Product-specific meta tags */}
      {type === 'product' && (
        <>
          {price && (
            <>
              <meta property="product:price:amount" content={price.toString()} />
              <meta property="product:price:currency" content={currency} />
            </>
          )}
          <meta property="product:availability" content={availability === 'instock' ? 'in stock' : 'out of stock'} />
          {brand && <meta property="product:brand" content={brand} />}
          {category && <meta property="product:category" content={category} />}
          {sku && <meta property="product:retailer_item_id" content={sku} />}
          {rating && <meta property="product:rating" content={rating.toString()} />}
          {ratingCount && <meta property="product:rating_count" content={ratingCount.toString()} />}
        </>
      )}

      {/* Business/Contact Information */}
      <meta name="contact" content="support@petshiwu.com" />
      <meta name="phone" content="+1-800-259-2605" />

      {/* FIX 3: Canonical now uses resolvedUrl — unique per page, never hardcoded homepage */}
      <link rel="canonical" href={resolvedUrl} />

      {/* Alternate URLs — site is US-only, so en-US is the only declared locale.
          x-default mirrors en-US so Google doesn't infer a global default we don't serve. */}
      <link rel="alternate" hrefLang="en-US" href={resolvedUrl} />
      <link rel="alternate" hrefLang="x-default" href={resolvedUrl} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* App meta */}
      <meta name="theme-color" content="#1E3A8A" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content={SITE_NAME} />

      {/* Product JSON-LD schema (Google rich snippets: price, availability, star ratings) */}
      {type === 'product' && price && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: title,
            description,
            image: ogImage,
            brand: brand ? { '@type': 'Brand', name: brand } : { '@type': 'Brand', name: SITE_NAME },
            sku: sku || '',
            category: category || '',
            offers: {
              '@type': 'Offer',
              url: resolvedUrl,
              priceCurrency: currency || 'USD',
              price: price.toFixed(2),
              availability: availability === 'instock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            },
            ...(rating && ratingCount ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating.toFixed(1),
                reviewCount: ratingCount,
                bestRating: 5,
                worstRating: 1,
              }
            } : {}),
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
