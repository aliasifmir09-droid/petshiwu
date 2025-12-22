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

const SEO = ({
  title = 'petshiwu - Everything Your Pet Needs | Premium Pet Food & Supplies',
  description = 'Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, fish, reptiles, and small pets. Quality products, fast shipping, great prices. Free shipping on orders over $75.',
  keywords = 'pet supplies, dog food, cat food, pet toys, pet accessories, pet care, online pet store, premium pet food, dog treats, cat treats, pet bedding, pet grooming, pet health, pet nutrition, pet shop online, buy pet food online, pet supplies near me',
  image = 'https://petshiwu.com/logo.png',
  url = 'https://www.petshiwu.com',
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
  ratingCount
}: SEOProps) => {
  // Ensure URL uses www subdomain for consistency
  const canonicalUrl = url.startsWith('https://') ? url : `https://www.petshiwu.com${url}`;
  const ogImage = image.startsWith('http') ? image : `https://www.petshiwu.com${image}`;
  
  const fullTitle = title.includes('petshiwu') ? title : `${title} | petshiwu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || 'petshiwu'} />
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
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="petshiwu" />
      <meta property="og:locale" content="en_US" />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {category && <meta property="article:section" content={category} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
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
        </>
      )}

      {/* Business/Contact Information */}
      <meta name="contact" content="support@petshiwu.com" />
      <meta name="phone" content="+1-626-342-0419" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate URLs (www and non-www) */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Robots meta tag */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Additional SEO tags */}
      <meta name="theme-color" content="#1E3A8A" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

export default SEO;

