/**
 * botRenderer.ts — Dynamic Rendering for Search Engine Bots
 *
 * When a known bot (Googlebot, Bingbot, social crawlers, etc.) requests
 * a product, blog, or care guide page, this middleware intercepts the
 * catch-all SPA handler and serves pre-populated HTML instead of the
 * generic React loading shell.
 *
 * Why this matters:
 *   - React Helmet sets meta tags via JS — bots may see generic defaults
 *   - This gives every product page a unique title, description, and
 *     JSON-LD Product schema before any JS runs
 *   - Google shows rich snippets (price, rating, availability) in results
 *   - CTR improvement is typically 20–40% for pages with rich snippets
 *
 * Google explicitly endorses this pattern ("dynamic rendering"):
 * https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import Product from '../models/Product';
import Blog from '../models/Blog';
import CareGuide from '../models/CareGuide';
import Category from '../models/Category';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// Bot detection
// ---------------------------------------------------------------------------

const BOT_UA_RE =
  /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|sogou|slurp|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|discordbot|slackbot-linkexpanding|whatsapp|telegrambot|applebot|pinterestbot|rogerbot|embedly|quora\s+link\s+preview|showyoubot|outbrain|developers\.google\.com/i;

const isBot = (ua: string): boolean => BOT_UA_RE.test(ua);

// ---------------------------------------------------------------------------
// HTML template cache (read once at startup, reuse)
// ---------------------------------------------------------------------------

let _indexHtml: string | null = null;

const getIndexHtml = (distPath: string): string => {
  if (!_indexHtml) {
    try {
      _indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
    } catch {
      _indexHtml = '';
    }
  }
  return _indexHtml;
};

// ---------------------------------------------------------------------------
// HTML injection helpers
// ---------------------------------------------------------------------------

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, '');

const truncate = (s: string, n: number): string =>
  s.length > n ? s.substring(0, n).trimEnd() + '…' : s;

const escRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replace <title> tag in the HTML template
 */
const injectTitle = (html: string, title: string): string =>
  html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);

/**
 * Replace meta description content
 */
const injectDescription = (html: string, description: string): string =>
  html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${esc(description)}$2`
  );

/**
 * Replace or inject the canonical link tag
 */
const injectCanonical = (html: string, canonicalUrl: string): string => {
  const tag = `<link rel="canonical" href="${esc(canonicalUrl)}" />`;
  // Replace existing canonical if present
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag);
  }
  // Otherwise inject before </head>
  return html.replace('</head>', `${tag}\n</head>`);
};

/**
 * Inject a block of meta/script tags immediately before </head>
 */
const injectBeforeHeadClose = (html: string, tags: string): string =>
  html.replace('</head>', `${tags}\n</head>`);

/**
 * Inject an <h1> tag as the first child of <body> so crawlers that
 * don't execute JS still see the correct page heading.
 */
const injectH1 = (html: string, h1Text: string): string => {
  const tag = `<h1>${esc(h1Text)}</h1>`;
  return html.replace('<div id="root">', `<div id="root">\n${tag}`);
};

// ---------------------------------------------------------------------------
// Route pattern matching
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Static page meta — title + description for pages not backed by DB data
// ---------------------------------------------------------------------------

const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Premium Pet Food & Supplies Delivered to NYC | Petshiwu',
    description: 'Shop 10,000+ premium pet products for dogs, cats, birds, fish, and reptiles. Free delivery in Queens, Brooklyn & all NYC boroughs. Free shipping on orders over $49.',
  },
  '/products': {
    title: 'All Pet Products — Dog, Cat, Bird, Fish & More | Petshiwu',
    description: 'Browse 10,000+ pet products for dogs, cats, birds, fish, reptiles, and small animals. Top brands, fast NYC delivery. Free shipping over $49.',
  },
  '/dog': {
    title: 'Dog Food, Treats, Toys & Supplies | Petshiwu',
    description: 'Shop premium dog food, treats, toys, and accessories. Top brands — Purina, Blue Buffalo, Royal Canin. Fast NYC delivery. Free shipping over $49.',
  },
  '/cat': {
    title: 'Cat Food, Litter, Toys & Accessories | Petshiwu',
    description: 'Discover premium cat food, litter, toys, and accessories. Top brands delivered fast to Queens, Brooklyn, Manhattan & all of NYC. Free shipping over $49.',
  },
  '/bird': {
    title: 'Bird Food, Cages & Accessories | Petshiwu',
    description: 'Shop bird food, cages, perches, and accessories for all bird species. Premium brands, fast NYC delivery. Free shipping over $49.',
  },
  '/fish': {
    title: 'Fish Food, Aquarium Supplies & Tanks | Petshiwu',
    description: 'Find fish food, filters, aquarium supplies, and tanks for freshwater and saltwater fish. NYC delivery available. Free shipping over $49.',
  },
  '/reptile': {
    title: 'Reptile Food, Terrariums & Supplies | Petshiwu',
    description: 'Shop reptile food, terrariums, heating, and accessories for snakes, lizards, and turtles. Fast NYC delivery. Free shipping over $49.',
  },
  '/small-animal': {
    title: 'Small Animal Food, Cages & Accessories | Petshiwu',
    description: 'Shop food, cages, bedding, and toys for hamsters, rabbits, guinea pigs, and more. Fast NYC delivery. Free shipping over $49.',
  },
  '/about': {
    title: 'About Petshiwu — NYC Pet Supply Delivery',
    description: 'Petshiwu is your trusted NYC pet supply delivery service based in Jackson Heights, Queens. Serving all five boroughs with premium pet products.',
  },
  '/contact': {
    title: 'Contact Us | Petshiwu',
    description: 'Contact Petshiwu for questions about orders, products, or delivery. We serve Queens, Brooklyn, Manhattan, the Bronx, and Staten Island.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Petshiwu',
    description: 'Answers to common questions about ordering, shipping, returns, and products at Petshiwu. Fast NYC delivery on premium pet food and supplies.',
  },
  '/return-policy': {
    title: 'Return Policy | Petshiwu',
    description: 'Learn about Petshiwu\'s hassle-free return policy for pet food, toys, and supplies. Easy returns within 30 days on most items.',
  },
  '/returns': {
    title: 'Start a Return | Petshiwu',
    description: 'Start a return or exchange for your Petshiwu order. Our simple process makes it easy to return pet food, toys, and supplies.',
  },
  '/privacy': {
    title: 'Privacy Policy | Petshiwu',
    description: 'Read Petshiwu\'s privacy policy to understand how we collect, use, and protect your personal information.',
  },
  '/terms': {
    title: 'Terms of Service | Petshiwu',
    description: 'Review the terms and conditions for using Petshiwu\'s website and purchasing pet food, toys, and supplies.',
  },
  '/shipping': {
    title: 'Shipping Policy | Petshiwu',
    description: 'Petshiwu ships nationwide with free shipping on orders over $49. Same-day delivery available in select NYC neighborhoods.',
  },
  '/dogs': {
    title: 'Dog Food, Treats, Toys & Supplies | Petshiwu',
    description: 'Shop premium dog food, treats, toys, and accessories. Top brands — Purina, Blue Buffalo, Royal Canin. Fast NYC delivery. Free shipping over $49.',
  },
  '/cats': {
    title: 'Cat Food, Litter, Toys & Accessories | Petshiwu',
    description: 'Discover premium cat food, litter, toys, and accessories. Top brands delivered fast to Queens, Brooklyn, Manhattan & all of NYC. Free shipping over $49.',
  },
  '/birds': {
    title: 'Bird Food, Cages & Accessories | Petshiwu',
    description: 'Shop bird food, cages, perches, and accessories for all bird species. Premium brands, fast NYC delivery. Free shipping over $49.',
  },
  '/reptiles': {
    title: 'Reptile Food, Terrariums & Supplies | Petshiwu',
    description: 'Shop reptile food, terrariums, heating, and accessories for snakes, lizards, and turtles. Fast NYC delivery. Free shipping over $49.',
  },
  '/small-animals': {
    title: 'Small Animal Food, Cages & Accessories | Petshiwu',
    description: 'Shop food, cages, bedding, and toys for hamsters, rabbits, guinea pigs, and more. Fast NYC delivery. Free shipping over $49.',
  },
  '/fish-tanks': {
    title: 'Aquarium Supplies & Fish Tanks | Petshiwu',
    description: 'Shop aquariums, filters, and accessories for freshwater and saltwater fish. Fast NYC delivery. Free shipping on orders over $49.',
  },
  '/search': {
    title: 'Search Products | Petshiwu',
    description: 'Search 10,000+ pet products for dogs, cats, birds, fish, reptiles, and small animals at Petshiwu. Fast NYC delivery, free shipping over $49.',
  },
  '/donate': {
    title: 'Donate to Pet Shelters | Petshiwu',
    description: 'Help pets in need — donate pet food and supplies to NYC shelters through Petshiwu. Every donation helps animals find loving homes.',
  },
  '/learning': {
    title: 'Pet Care Blog, Guides & Tips | Petshiwu',
    description: 'Expert pet care guides, breed information, nutrition tips, and training advice for dogs, cats, birds, fish, and reptiles from the Petshiwu team.',
  },
  '/care-guides': {
    title: 'Pet Care Guides | Petshiwu',
    description: 'Comprehensive pet care guides for dogs, cats, birds, fish, reptiles, and small animals. Expert advice from the Petshiwu team.',
  },
};

/**
 * Replace og:title, og:description, and og:url content in the HTML template
 */
const injectOgTags = (html: string, title: string, description: string, url: string): string => {
  let out = html;
  out = out.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${esc(title)}$2`);
  out = out.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${esc(description)}$2`);
  out = out.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, `$1${esc(url)}$2`);
  out = out.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, `$1${esc(title)}$2`);
  out = out.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, `$1${esc(description)}$2`);
  return out;
};

/**
 * Build HTML for pages not backed by DB data — injects correct canonical,
 * title, description, AND og/twitter tags so every page shares correctly.
 */
const buildGenericPageHtml = (template: string, reqPath: string): string => {
  const cleanPath = reqPath.split('?')[0]; // strip query string from canonical
  const canonicalUrl = cleanPath === '/' ? BASE : `${BASE}${cleanPath}`;
  const meta = STATIC_PAGES[cleanPath] ?? {
    title: 'Premium Pet Food & Supplies | Petshiwu',
    description: 'Shop premium pet food, toys, and supplies for all pets at Petshiwu. Fast delivery across NYC. Free shipping on orders over $49.',
  };
  let html = template;
  html = injectTitle(html, meta.title);
  html = injectDescription(html, meta.description);
  html = injectCanonical(html, canonicalUrl);
  html = injectOgTags(html, meta.title, meta.description, canonicalUrl);
  return html;
};

type PageType =
  | { type: 'product'; slug: string }
  | { type: 'blog'; slug: string }
  | { type: 'care-guide'; slug: string }
  | { type: 'category'; slug: string }
  | null;

const matchRoute = (pathname: string): PageType => {
  // Strip leading slash
  const p = pathname.replace(/^\//, '');
  const segments = p.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  // /learning/:slug
  if (segments[0] === 'learning' && segments.length === 2)
    return { type: 'blog', slug: segments[1] };

  // /care-guides/:slug
  if (segments[0] === 'care-guides' && segments.length === 2)
    return { type: 'care-guide', slug: segments[1] };

  // /category/:slug
  if (segments[0] === 'category' && segments.length === 2)
    return { type: 'category', slug: segments[1] };

  // /products/:slug
  if (segments[0] === 'products' && segments.length === 2)
    return { type: 'product', slug: segments[1] };

  // /:petType/:categorySlug — category under petType (e.g. /dog/dog-food)
  const PET_TYPES = new Set(['dog','cat','bird','fish','reptile','small-pet','products']);
  if (segments.length === 2 && PET_TYPES.has(segments[0]))
    return { type: 'category', slug: segments[1], petType: segments[0] } as any;

  // /:petType/:categorySlug+/:productSlug — product URL (3+ segments)
  if (segments.length >= 3) {
    const productSlug = segments[segments.length - 1];
    return { type: 'product', slug: productSlug };
  }

  return null;
};

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

const fetchProduct = async (slug: string) => {
  return Product.findOne({ slug, isActive: true })
    .select('name slug description brand images basePrice compareAtPrice averageRating totalReviews inStock totalStock petType category createdAt updatedAt')
    .populate({ path: 'category', select: 'name slug' })
    .lean()
    .exec();
};

const fetchBlog = async (slug: string) => {
  return Blog.findOne({ slug, isPublished: true })
    .select('title slug excerpt content coverImage author publishedAt updatedAt')
    .lean()
    .exec();
};

const fetchCareGuide = async (slug: string) => {
  return CareGuide.findOne({ slug, isPublished: true })
    .select('title slug excerpt coverImage petType updatedAt')
    .lean()
    .exec();
};

const fetchCategory = async (slug: string) => {
  return Category.findOne({ slug, isActive: true })
    .select('name slug description petType')
    .lean()
    .exec();
};

// ---------------------------------------------------------------------------
// HTML builders
// ---------------------------------------------------------------------------

const BASE = 'https://www.petshiwu.com';

const buildProductHtml = (template: string, product: any, slug: string): string => {
  const price: number = product.basePrice ?? 0;
  const inStock: boolean = (product.totalStock ?? 0) > 0 && product.inStock !== false;
  const image: string = (product.images?.[0]) ?? `${BASE}/logo.png`;
  const images: string[] = (product.images ?? []).slice(0, 10);
  const brandName: string = product.brand?.trim() || 'PetShiwu';
  
  // Deduplicate brand from product name if it's repeated at the start
  // e.g. "Purina ONE Purina® ONE® Adult Dog Dry Food" → "Purina® ONE® Adult Dog Dry Food"
  let productName = product.name ?? '';
  // Strip plain brand prefix (e.g. "Purina ONE" before "Purina® ONE®")
  const plainBrand = brandName.replace(/[®™]/g, '').trim();
  const brandRegex = new RegExp(`^(${escRegex(plainBrand)}\\s+)+`, 'i');
  if (brandRegex.test(productName)) {
    const afterBrand = productName.replace(brandRegex, '').trim();
    if (afterBrand) productName = afterBrand;
  }
  
  const rawDesc: string = product.description
    ? stripTags(product.description)
    : `${productName} — premium pet supplies at PetShiwu.`;
  const description = truncate(rawDesc, 160);

  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const categorySlug = typeof product.category === 'object' ? product.category?.slug : undefined;
  const petType: string = product.petType ?? '';
  const petLabel = petType === 'cat' ? 'Cat' : petType === 'dog' ? 'Dog' : 'Other Animals';

  const productUrl = `${BASE}/${petType}${categorySlug ? `/${categorySlug}` : ''}/${slug}`;

  const title = `${productName} | PetShiwu`;

  // JSON-LD Product schema
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: rawDesc.substring(0, 500),
    image: images.length > 1 ? images : (images[0] ?? `${BASE}/logo.png`),
    brand: { '@type': 'Brand', name: brandName },
    sku: String(product._id),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: price.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'PetShiwu', url: BASE },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: price >= 49 ? '0' : '6',
          currency: 'USD',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
      },
    },
  };

  if ((product.averageRating ?? 0) > 0 && (product.totalReviews ?? 0) > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating.toFixed(1),
      reviewCount: product.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // BreadcrumbList
  const breadcrumbItems: unknown[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    ...(petType ? [{ '@type': 'ListItem', position: 2, name: petLabel, item: `${BASE}/${petType}` }] : []),
    ...(categoryName && categorySlug ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${BASE}/${petType}/${categorySlug}` }] : []),
    { '@type': 'ListItem', position: petType && categorySlug ? 4 : petType ? 3 : 2, name: product.name, item: productUrl },
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const injectedTags = `
  <!-- Bot renderer: product-specific meta -->
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(productUrl)}" />
  <meta property="og:type" content="product" />
  <meta property="product:price:amount" content="${price.toFixed(2)}" />
  <meta property="product:price:currency" content="USD" />
  <meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, productUrl);
  html = injectBeforeHeadClose(html, injectedTags);
  html = injectH1(html, productName);
  return html;
};

const buildBlogHtml = (template: string, blog: any): string => {
  const title = `${blog.title} | PetShiwu Learning`;
  const description = truncate(
    blog.excerpt ?? stripTags(blog.content ?? '').substring(0, 160),
    160
  );
  const image = blog.coverImage ?? `${BASE}/logo.png`;
  const url = `${BASE}/learning/${blog.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description,
    image,
    url,
    author: { '@type': 'Organization', name: blog.author ?? 'PetShiwu' },
    publisher: {
      '@type': 'Organization',
      name: 'PetShiwu',
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    datePublished: blog.publishedAt ?? blog.createdAt,
    dateModified: blog.updatedAt,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Learning', item: `${BASE}/learning` },
      { '@type': 'ListItem', position: 3, name: blog.title, item: url },
    ],
  };

  const injectedTags = `
  <!-- Bot renderer: blog-specific meta -->
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, url);
  html = injectBeforeHeadClose(html, injectedTags);
  html = injectH1(html, blog.title);
  return html;
};

const buildCareGuideHtml = (template: string, guide: any): string => {
  const title = `${guide.title} | PetShiwu Care Guides`;
  const description = truncate(guide.excerpt ?? `Care guide for ${guide.title} at PetShiwu.`, 160);
  const image = guide.coverImage ?? `${BASE}/logo.png`;
  const url = `${BASE}/care-guides/${guide.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description,
    image,
    url,
    author: { '@type': 'Organization', name: 'PetShiwu' },
    publisher: {
      '@type': 'Organization',
      name: 'PetShiwu',
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    dateModified: guide.updatedAt,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Care Guides', item: `${BASE}/care-guides` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: url },
    ],
  };

  const injectedTags = `
  <!-- Bot renderer: care-guide-specific meta -->
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, url);
  html = injectBeforeHeadClose(html, injectedTags);
  html = injectH1(html, guide.title);
  return html;
};

const buildCategoryHtml = (template: string, category: any, petType?: string): string => {
  const catName = category.name ?? '';
  const petLabel = petType === 'dog' ? 'Dog' : petType === 'cat' ? 'Cat' : petType === 'bird' ? 'Bird' : petType === 'fish' ? 'Fish' : petType === 'reptile' ? 'Reptile' : petType === 'small-pet' ? 'Small Pet' : '';
  const title = petLabel
    ? `${catName} — ${petLabel} Supplies | PetShiwu`
    : `${catName} | PetShiwu`;
  const description = truncate(
    category.description ?? `Shop ${catName} for your ${petLabel || 'pet'} at PetShiwu. Premium quality, free shipping over $49, delivered to Queens, Brooklyn, and all of NYC.`,
    160
  );

  // Use correct canonical: /:petType/:slug or /category/:slug
  const url = petType && petType !== 'all'
    ? `${BASE}/${petType}/${category.slug}`
    : `${BASE}/category/${category.slug}`;

  const breadcrumbItems: unknown[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    ...(petLabel && petType ? [{ '@type': 'ListItem', position: 2, name: `${petLabel}s`, item: `${BASE}/${petType}` }] : []),
    { '@type': 'ListItem', position: petType ? 3 : 2, name: catName, item: url },
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
  };

  const injectedTags = `
  <!-- Bot renderer: category-specific meta -->
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, url);
  html = injectBeforeHeadClose(html, injectedTags);
  html = injectH1(html, catName);
  return html;
};

// ---------------------------------------------------------------------------
// Main middleware factory
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SSR: /products listing page — injects real product links so Google
// can discover individual product pages from the listing page.
// ---------------------------------------------------------------------------
const buildProductListHtml = async (template: string): Promise<string> => {
  const BASE_URL = 'https://www.petshiwu.com';
  const canonicalUrl = `${BASE_URL}/products`;

  // Fetch up to 60 active products for Google to crawl
  const products = await Product.find({ isActive: true })
    .select('name slug basePrice brand petType description')
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  const productLinks = products
    .filter((p: any) => p.slug)
    .map((p: any) => {
      const url = `${BASE_URL}/products/${esc(p.slug)}`;
      const price = p.basePrice ? ` — $${p.basePrice.toFixed(2)}` : '';
      const brand = p.brand ? ` by ${esc(String(p.brand))}` : '';
      const desc = p.description ? ` — ${esc(truncate(stripTags(String(p.description)), 80))}` : '';
      return `<li><a href="${url}">${esc(p.name)}${brand}${price}</a>${desc}</li>`;
    })
    .join('\n');

  const bodyContent = `
<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px">
  <h1>All Pet Products — PetShiwu</h1>
  <p>Browse 10,000+ premium pet products for dogs, cats, birds, fish, reptiles, and small animals.
     Free shipping on orders over $49. Based in Jackson Heights, NY.</p>
  <ul style="list-style:none;padding:0;columns:2">
    ${productLinks}
  </ul>
  <p><a href="${BASE_URL}">← Back to PetShiwu</a></p>
</div>`;

  const meta = STATIC_PAGES['/products'];
  let html = template;
  html = injectTitle(html, meta.title);
  html = injectDescription(html, meta.description);
  html = injectCanonical(html, canonicalUrl);
  // Inject product list into body for Google to crawl
  html = html.replace(/<div id="root">.*?<\/div>/s, `<div id="root">${bodyContent}</div>`) ||
         html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  return html;
};

export const createBotRenderer = (distPath: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only intercept GET requests for HTML pages
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();

    const ua = req.headers['user-agent'] ?? '';
    const bot = isBot(ua);

    const template = getIndexHtml(distPath);
    if (!template) return next();

    const page = matchRoute(req.path);

    try {
      let html: string | null = null;

      // DB-backed page enrichment — bots only (keeps non-bot requests fast with no DB queries)
      if (bot) {
        if (page?.type === 'product') {
          const product = await fetchProduct(page.slug);
          if (product) html = buildProductHtml(template, product, page.slug);
        } else if (page?.type === 'blog') {
          const blog = await fetchBlog(page.slug);
          if (blog) html = buildBlogHtml(template, blog);
        } else if (page?.type === 'care-guide') {
          const guide = await fetchCareGuide(page.slug);
          if (guide) html = buildCareGuideHtml(template, guide);
        } else if (page?.type === 'category') {
          const category = await fetchCategory(page.slug);
          if (category) html = buildCategoryHtml(template, category, (page as any).petType);
        } else if (req.path === '/products' || req.path === '/products/') {
          // SSR product listing for Google — inject real product links
          html = await buildProductListHtml(template);
        }
      }

      // Serve ALL requests (bot or not) with page-specific canonical + title + description.
      // This fixes "all pages same canonical / same title / same meta description" for
      // non-bot auditing tools and regular browsers alike.
      if (!html) {
        html = buildGenericPageHtml(template, req.path);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (bot) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Bot-Rendered', '1');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      res.send(html);
      return;
    } catch (err: any) {
      logger.warn(`[botRenderer] Error rendering ${req.path}:`, err?.message);
      // Even on error, try to serve correct canonical rather than raw index.html
      try {
        const fallback = buildGenericPageHtml(template, req.path);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        if (bot) res.setHeader('X-Bot-Rendered', 'fallback');
        res.send(fallback);
        return;
      } catch {
        return next();
      }
    }
  };
};
