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

/**
 * PETSHIWU ULTIMATE SEO COMPONENT
 * Optimized for: High-ranking pet industry keywords
 * Competitor Strategy: Targets Petco, Chewy, and PetSmart audience
 */
const SEO = ({
  title = 'PetShiwu | Premium Pet Food, Toys & Accessories in USA',
  description = 'Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, fish, reptiles, and small pets. Quality products, fast shipping, great prices. Free shipping on orders over $75.',
  keywords = 'premium pet food, dog food online, cat food delivery, reptile supplies USA, bird food, pet toys, pet accessories, online pet store, PetShiwu, best dog treats, organic cat food, grain-free pet food',
  image = 'https://www.petshiwu.com/logo.png',
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
  const canonicalUrl = url.startsWith('https://') ? url : `https://www.petshiwu.com${url.startsWith('/') ? url : '/' + url}`;
  const ogImage = image.startsWith('http') ? image : `https://www.petshiwu.com${image.startsWith('/') ? image : '/' + image}`;
  
  // Smart Title Logic: Ensures brand name is always present but keywords come first
  const fullTitle = title.toLowerCase().includes('petshiwu') 
    ? title 
    : `${title} | PetShiwu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || 'PetShiwu'} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="3 days" /> {/* Faster revisit for updates */}
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Geographic targeting - Jackson Heights, NY */}
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
      <meta property="og:site_name" content="PetShiwu" />
      <meta property="og:locale" content="en_US" />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {category && <meta property="article:section" content={category} />}

      {/* Twitter Card - Enhanced for E-commerce */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@petshiwu" />
      <meta name="twitter:creator" content="@petshiwu" />

      {/* Product-specific meta tags for Rich Snippets */}
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
          <meta property="product:condition" content="new" />
        </>
      )}

      {/* Business/Contact Information */}
      <meta name="contact" content="support@petshiwu.com" />
      <meta name="phone" content="+1-626-342-0419" />

      {/* Canonical URL - Critical for preventing duplicate content */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate URLs */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Robots meta tag - Optimized for crawling */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Mobile & App Tags */}
      <meta name="theme-color" content="#1E3A8A" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="PetShiwu" />
      
      {/* DNS Prefetch for faster loading */}
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
    </Helmet>
  );
};

export default SEO;
