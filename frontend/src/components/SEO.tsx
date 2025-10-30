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
}

const SEO = ({
  title = 'petshiwu - Everything Your Pet Needs',
  description = 'Shop the best pet supplies for dogs, cats, birds, fish, and more. Quality products, great prices, and fast shipping. Your one-stop shop for all pet needs.',
  keywords = 'pet supplies, dog food, cat food, pet toys, pet accessories, pet care, online pet store',
  image = '/og-image.jpg',
  url = 'https://petshiwu.com',
  type = 'website',
  price,
  currency = 'USD',
  availability = 'instock'
}: SEOProps) => {
  const fullTitle = title === 'petshiwu - Everything Your Pet Needs' ? title : `${title} | petshiwu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="petshiwu" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Product-specific meta tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;

