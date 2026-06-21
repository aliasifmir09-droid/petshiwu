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

/** Decode HTML entities so DB-stored descriptions don't get double-encoded by esc() */
const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));

// Run twice — DB descriptions are double-encoded (e.g. &amp;amp; needs two passes to become &)
const clean = (s: string): string => decodeEntities(decodeEntities(stripTags(s)));

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
 * Inject an <h1> tag for crawlers.
 * Replaces the existing <h1> in the static template (if any) so there is
 * never more than one H1 — Google reads the first one it encounters,
 * which was previously the generic homepage tagline for every page.
 */
const injectH1 = (html: string, h1Text: string): string => {
  const tag = `<h1>${esc(h1Text)}</h1>`;
  // Replace the first existing H1 found in the document (avoids duplicate H1s)
  if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, tag);
  }
  // Fallback: inject inside root div if no H1 found
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

  // ── High-value SEO landing pages ──────────────────────────────────────────
  // Titles are keyword-exact matches to top GSC queries with 0 clicks

  '/high-protein-dog-food-picky-eaters': {
    title: 'Best Dog Food for Picky Eaters — High Protein Picks | Petshiwu',
    description: 'Find the best dog food for picky eaters. High-protein formulas dogs actually love — Blue Buffalo, Royal Canin, Purina Pro Plan. Free delivery NYC. Free shipping over $49.',
  },
  '/best-dog-food-sensitive-stomach-diarrhea': {
    title: 'Best Dog Food for Sensitive Stomach & Diarrhea | Petshiwu',
    description: 'Vet-recommended dog food for sensitive stomachs. Easy-to-digest formulas that soothe digestive issues. Hill\'s Science Diet, Royal Canin, Purina EN. Free shipping over $49.',
  },
  '/durable-dog-toys-aggressive-chewers': {
    title: 'Best Dog Toys for Aggressive Chewers — Extra Durable | Petshiwu',
    description: 'Heavy-duty dog toys built for aggressive chewers. KONG, Benebone, Nylabone, and more. Free delivery in NYC, free shipping on orders over $49.',
  },
  '/dog-food-delivery-nyc': {
    title: 'Dog Food Delivery NYC — Same-Day & Next-Day | Petshiwu',
    description: 'Get dog food delivered anywhere in NYC. 1,000+ dog food options from top brands. Serving Queens, Brooklyn, Manhattan, Bronx & Staten Island. Free shipping over $49.',
  },
  '/pet-supplies-delivery-nyc': {
    title: 'Pet Supplies Delivery NYC — Free Shipping Over $49 | Petshiwu',
    description: 'Get pet supplies delivered anywhere in NYC. Dogs, cats, birds, fish, reptiles — 10,000+ products from top brands. Free delivery on orders over $49. Queens, Brooklyn, Manhattan, Bronx, Staten Island.',
  },
  '/cat-food-delivery-nyc': {
    title: 'Cat Food Delivery NYC — Premium Brands | Petshiwu',
    description: 'Get premium cat food delivered anywhere in NYC. Wet food, dry food, prescription diets. Royal Canin, Blue Buffalo, Hill\'s Science Diet. Free shipping over $49.',
  },
  '/online-pet-store-nyc': {
    title: 'Online Pet Store for NYC — 10,000+ Products | Petshiwu',
    description: 'NYC\'s online pet store with 10,000+ products for dogs, cats, birds, fish & more. Fast delivery across all 5 boroughs. Free shipping on orders over $49.',
  },
  '/affordable-pet-food-nyc': {
    title: 'Affordable Pet Food & Supplies NYC — Free Delivery Over $49 | Petshiwu',
    description: 'Get quality pet food at great prices delivered in NYC. Premium brands without the premium markup. Free delivery on orders over $49. Queens, Brooklyn, Manhattan, Bronx, Staten Island.',
  },
  '/raw-dog-food-nyc': {
    title: 'Raw Dog Food NYC — Freeze-Dried & Air-Dried Raw Delivery | Petshiwu',
    description: 'Raw dog food delivered to all NYC boroughs. Freeze-dried raw, air-dried raw, and raw-inspired formulas. No frozen storage required. Free delivery on orders over $49.',
  },
  '/organic-cat-food-nyc': {
    title: 'Organic Cat Food NYC — Natural & Non-GMO Delivery | Petshiwu',
    description: 'Organic and natural cat food delivered to all NYC boroughs. No artificial preservatives, no by-products. Wellness, Blue Buffalo, Orijen and more. Free delivery over $49.',
  },
  '/luxury-pet-accessories-nyc': {
    title: 'Luxury Pet Accessories NYC — Premium Supplies Delivered | Petshiwu',
    description: 'Premium and luxury pet accessories delivered to NYC. Orthopedic beds, gourmet treats, designer collars, high-end grooming tools. Free delivery over $49 to all 5 boroughs.',
  },
  '/pet-food-delivery-nyc': {
    title: 'Pet Food Delivery NYC — Never Run Out of Your Pet\'s Favorites | Petshiwu',
    description: 'Keep your pet stocked with their favorite food delivered in NYC. Easy reordering, no subscription traps. Free delivery over $49. Queens, Brooklyn, Manhattan, Bronx, Staten Island.',
  },
  '/pet-store-queens-ny': {
    title: 'Pet Store Queens NY — Delivery to Jackson Heights, Flushing & All of Queens | Petshiwu',
    description: 'Queens\' premier online pet store. Free delivery throughout Queens — Jackson Heights, Flushing, Astoria, Forest Hills, Jamaica and more. 10,000+ products for dogs, cats, birds, fish and more.',
  },
  '/pet-supplies-near-me-nyc': {
    title: 'Pet Supplies Near Me — NYC Delivery to Your Door | Petshiwu',
    description: 'Looking for pet supplies near you in NYC? Petshiwu delivers to your door — Queens, Brooklyn, Manhattan, Bronx, Staten Island. 10,000+ products, free delivery over $49.',
  },
  '/investors': {
    title: 'Invest in Petshiwu — NYC Pet Delivery Startup',
    description: 'Petshiwu is building the premier pet supply delivery brand for NYC and beyond. Learn about our growth strategy, market opportunity, and how to invest.',
  },
  '/sell-with-us': {
    title: 'Sell With Us — Partner with Petshiwu',
    description: 'List your pet products on Petshiwu and reach thousands of NYC pet owners. Join our growing marketplace of premium pet brands.',
  },

  // ── NYC Borough Landing Pages ─────────────────────────────────────────────
  '/pet-supplies-queens-ny': {
    title: 'Pet Supplies Queens NY — Delivery to Flushing, Astoria, Jackson Heights & All of Queens | Petshiwu',
    description: "Queens' online pet store, based in Jackson Heights. Fast delivery to Flushing, Astoria, Forest Hills, Jamaica, Bayside & every Queens neighborhood. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-brooklyn-ny': {
    title: 'Pet Supplies Brooklyn NY — Delivery to Williamsburg, Park Slope & All of Brooklyn | Petshiwu',
    description: "Brooklyn's online pet store. Fast delivery to Williamsburg, Park Slope, Bushwick, Flatbush, Bay Ridge & every Brooklyn neighborhood. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-manhattan-ny': {
    title: 'Pet Supplies Manhattan NYC — Delivery to Upper West Side, Harlem & All of Manhattan | Petshiwu',
    description: "Manhattan pet supply delivery. Upper West Side, Upper East Side, Harlem, Hell's Kitchen, Chelsea, Tribeca & more. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-bronx-ny': {
    title: 'Pet Supplies Bronx NY — Delivery to Fordham, Riverdale, Hunts Point & All of the Bronx | Petshiwu',
    description: 'Bronx pet supply delivery. Fordham, Riverdale, Hunts Point, Mott Haven, Pelham Bay & more. 10,000+ products from top brands. Free shipping on orders over $49.',
  },
  '/pet-supplies-staten-island-ny': {
    title: 'Pet Supplies Staten Island NY — Delivery to St. George, Tottenville & All of Staten Island | Petshiwu',
    description: 'Staten Island pet supply delivery. St. George, Tottenville, New Dorp, Stapleton & all neighborhoods. 10,000+ products from top brands. Free shipping on orders over $49.',
  },
  '/pet-supplies-jackson-heights-ny': {
    title: "Pet Supplies Jackson Heights NY — Local Delivery from Your Neighborhood Pet Store | Petshiwu",
    description: "Petshiwu is based in Jackson Heights, Queens. Local pet supply delivery to Jackson Heights, Elmhurst, Woodside & surrounding neighborhoods. 10,000+ products. Free shipping over $49.",
  },
  '/pet-supplies-williamsburg-brooklyn-ny': {
    title: "Pet Supplies Williamsburg Brooklyn NY — Same-Day Delivery | Petshiwu",
    description: "Pet supply delivery to Williamsburg, Brooklyn. Dog food, cat food, pet accessories delivered to North Side, South Side, East Williamsburg & Greenpoint. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-park-slope-brooklyn-ny': {
    title: "Pet Supplies Park Slope Brooklyn NY — Delivery to Your Door | Petshiwu",
    description: "Pet supply delivery to Park Slope, Brooklyn. Premium dog food, cat food, organic and natural pet products delivered to your Park Slope home. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-upper-west-side-nyc': {
    title: "Pet Supplies Upper West Side NYC — Delivery to Your Manhattan Apartment | Petshiwu",
    description: "Pet supply delivery to the Upper West Side, Manhattan. Premium dog food, cat food, and pet accessories delivered to your UWS apartment. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-dumbo-brooklyn-ny': {
    title: "Pet Supplies DUMBO Brooklyn NY — Delivery to Your Apartment | Petshiwu",
    description: "Pet supply delivery to DUMBO, Brooklyn Heights, and Vinegar Hill. Premium dog food, cat food, and pet accessories delivered fast. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-long-island-city-queens-ny': {
    title: "Pet Supplies Long Island City Queens NY — Fast Delivery | Petshiwu",
    description: "Pet supply delivery to Long Island City, Queens. Dog food, cat food, and pet supplies delivered to LIC, Hunters Point, Sunnyside & Woodside. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-soho-nyc': {
    title: "Pet Supplies SoHo NYC — Premium Delivery to Your Manhattan Loft | Petshiwu",
    description: "Pet supply delivery to SoHo, Tribeca, NoHo, and Lower Manhattan. Luxury and premium dog food, cat food, and pet accessories delivered to your SoHo loft. 10,000+ products, free shipping over $49.",
  },
  '/pet-supplies-astoria-queens-ny': {
    title: "Pet Supplies Astoria Queens NY — Local Delivery | Petshiwu",
    description: "Pet supply delivery to Astoria, Queens. Dog food, cat food, and pet accessories delivered to Astoria, Long Island City, Ditmars, and Steinway. Queens-based service. 10,000+ products, free shipping over $49.",
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
/**
 * Converts a URL slug into a human-readable product name.
 * "hills-science-diet-adult-dog-food" → "Hills Science Diet Adult Dog Food"
 */
const slugToTitle = (slug: string): string =>
  slug
    .split('-')
    .map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');

const buildGenericPageHtml = (template: string, reqPath: string): string => {
  const cleanPath = reqPath.split('?')[0]; // strip query string from canonical
  const canonicalUrl = cleanPath === '/' ? BASE : `${BASE}${cleanPath}`;

  // For product URLs (3+ segments like /:petType/:category/:product-slug),
  // generate a unique title from the slug rather than the generic site title.
  // This means even if MongoDB is unreachable, every product page gets a distinct
  // title that Google can use for indexing.
  const segments = cleanPath.replace(/^\//, '').split('/').filter(Boolean);
  const PET_TYPES = new Set(['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet']);
  const isProductPath = segments.length >= 3 && PET_TYPES.has(segments[0]);

  let meta = STATIC_PAGES[cleanPath];

  if (!meta && isProductPath) {
    const productSlug = segments[segments.length - 1];
    const productName = slugToTitle(productSlug);
    const petType = segments[0];
    const petLabel = petType === 'cat' ? 'cat' : petType === 'dog' ? 'dog' : 'pet';
    meta = {
      title: `${productName} | Petshiwu`,
      description: `Shop ${productName} — premium ${petLabel} supplies delivered across NYC. Free shipping on orders over $49 at Petshiwu.`,
    };
  }

  const finalMeta = meta ?? {
    title: 'Premium Pet Food & Supplies | Petshiwu',
    description: 'Shop premium pet food, toys, and supplies for all pets at Petshiwu. Fast delivery across NYC. Free shipping on orders over $49.',
  };

  let html = template;
  html = injectTitle(html, finalMeta.title);
  html = injectDescription(html, finalMeta.description);
  html = injectCanonical(html, canonicalUrl);
  html = injectOgTags(html, finalMeta.title, finalMeta.description, canonicalUrl);
  return html;
};

type PageType =
  | { type: 'product'; slug: string }
  | { type: 'blog'; slug: string }
  | { type: 'care-guide'; slug: string }
  | { type: 'category'; slug: string }
  | { type: 'neighborhood'; slug: string; categorySlug: string; neighborhoodName: string; borough: string; nearbyAreas: string }
  | null;

// Neighborhood × Category page slug lookup (50 neighborhoods × 4 categories = 200 pages)
// Maps full page slug → { categorySlug, neighborhoodName, borough, nearbyAreas }
const NEIGHBORHOOD_PAGE_REGISTRY = (() => {
  const CATEGORIES: Record<string, string> = {
    'dog-food-delivery': 'Dog Food Delivery',
    'cat-food-delivery': 'Cat Food Delivery',
    'pet-supplies-delivery': 'Pet Supplies Delivery',
    'dog-treats-delivery': 'Dog Treats & Accessories Delivery',
  };
  const NEIGHBORHOODS: Array<{ slug: string; name: string; borough: string; nearbyAreas: string }> = [
    { slug: 'flushing-queens', name: 'Flushing', borough: 'Queens', nearbyAreas: 'Whitestone, College Point, and Murray Hill' },
    { slug: 'jackson-heights-queens', name: 'Jackson Heights', borough: 'Queens', nearbyAreas: 'Elmhurst, Woodside, and Corona' },
    { slug: 'astoria-queens', name: 'Astoria', borough: 'Queens', nearbyAreas: 'Long Island City, Ditmars, and Steinway' },
    { slug: 'forest-hills-queens', name: 'Forest Hills', borough: 'Queens', nearbyAreas: 'Rego Park, Kew Gardens, and Austin Street' },
    { slug: 'long-island-city-queens', name: 'Long Island City', borough: 'Queens', nearbyAreas: 'Astoria, Sunnyside, and Hunter\'s Point' },
    { slug: 'jamaica-queens', name: 'Jamaica', borough: 'Queens', nearbyAreas: 'Hollis, St. Albans, and Springfield Gardens' },
    { slug: 'bayside-queens', name: 'Bayside', borough: 'Queens', nearbyAreas: 'Whitestone, Oakland Gardens, and Fresh Meadows' },
    { slug: 'woodside-queens', name: 'Woodside', borough: 'Queens', nearbyAreas: 'Sunnyside, Jackson Heights, and Maspeth' },
    { slug: 'sunnyside-queens', name: 'Sunnyside', borough: 'Queens', nearbyAreas: 'Woodside, LIC, and Maspeth' },
    { slug: 'elmhurst-queens', name: 'Elmhurst', borough: 'Queens', nearbyAreas: 'Jackson Heights, Corona, and Rego Park' },
    { slug: 'corona-queens', name: 'Corona', borough: 'Queens', nearbyAreas: 'Elmhurst, Jackson Heights, and Flushing' },
    { slug: 'rego-park-queens', name: 'Rego Park', borough: 'Queens', nearbyAreas: 'Forest Hills, Elmhurst, and Woodhaven' },
    { slug: 'ridgewood-queens', name: 'Ridgewood', borough: 'Queens', nearbyAreas: 'Bushwick, Glendale, and Middle Village' },
    { slug: 'fresh-meadows-queens', name: 'Fresh Meadows', borough: 'Queens', nearbyAreas: 'Bayside, Flushing, and Jamaica' },
    { slug: 'howard-beach-queens', name: 'Howard Beach', borough: 'Queens', nearbyAreas: 'Ozone Park, Richmond Hill, and Broad Channel' },
    { slug: 'williamsburg-brooklyn', name: 'Williamsburg', borough: 'Brooklyn', nearbyAreas: 'Greenpoint, Bushwick, and Bedford-Stuyvesant' },
    { slug: 'park-slope-brooklyn', name: 'Park Slope', borough: 'Brooklyn', nearbyAreas: 'Prospect Heights, Carroll Gardens, and Gowanus' },
    { slug: 'sunset-park-brooklyn', name: 'Sunset Park', borough: 'Brooklyn', nearbyAreas: 'Bay Ridge, Greenwood Heights, and Borough Park' },
    { slug: 'crown-heights-brooklyn', name: 'Crown Heights', borough: 'Brooklyn', nearbyAreas: 'Prospect Heights, Flatbush, and Brownsville' },
    { slug: 'flatbush-brooklyn', name: 'Flatbush', borough: 'Brooklyn', nearbyAreas: 'Crown Heights, Midwood, and East Flatbush' },
    { slug: 'bay-ridge-brooklyn', name: 'Bay Ridge', borough: 'Brooklyn', nearbyAreas: 'Fort Hamilton, Dyker Heights, and Bensonhurst' },
    { slug: 'bushwick-brooklyn', name: 'Bushwick', borough: 'Brooklyn', nearbyAreas: 'Ridgewood, East Williamsburg, and Bed-Stuy' },
    { slug: 'greenpoint-brooklyn', name: 'Greenpoint', borough: 'Brooklyn', nearbyAreas: 'Williamsburg, Long Island City, and Astoria' },
    { slug: 'bed-stuy-brooklyn', name: 'Bed-Stuy', borough: 'Brooklyn', nearbyAreas: 'Crown Heights, Bushwick, and Fort Greene' },
    { slug: 'fort-greene-brooklyn', name: 'Fort Greene', borough: 'Brooklyn', nearbyAreas: 'Clinton Hill, Boerum Hill, and Downtown Brooklyn' },
    { slug: 'carroll-gardens-brooklyn', name: 'Carroll Gardens', borough: 'Brooklyn', nearbyAreas: 'Cobble Hill, Red Hook, and Gowanus' },
    { slug: 'cobble-hill-brooklyn', name: 'Cobble Hill', borough: 'Brooklyn', nearbyAreas: 'Carroll Gardens, Boerum Hill, and Red Hook' },
    { slug: 'red-hook-brooklyn', name: 'Red Hook', borough: 'Brooklyn', nearbyAreas: 'Carroll Gardens, Gowanus, and Sunset Park' },
    { slug: 'brighton-beach-brooklyn', name: 'Brighton Beach', borough: 'Brooklyn', nearbyAreas: 'Coney Island, Manhattan Beach, and Sheepshead Bay' },
    { slug: 'bensonhurst-brooklyn', name: 'Bensonhurst', borough: 'Brooklyn', nearbyAreas: 'Bay Ridge, Dyker Heights, and Sunset Park' },
    { slug: 'upper-west-side-manhattan', name: 'Upper West Side', borough: 'Manhattan', nearbyAreas: 'Morningside Heights, Lincoln Square, and Riverside Drive' },
    { slug: 'upper-east-side-manhattan', name: 'Upper East Side', borough: 'Manhattan', nearbyAreas: 'Carnegie Hill, Yorkville, and East Harlem' },
    { slug: 'chelsea-manhattan', name: 'Chelsea', borough: 'Manhattan', nearbyAreas: 'Hell\'s Kitchen, Flatiron, and West Village' },
    { slug: 'tribeca-manhattan', name: 'Tribeca', borough: 'Manhattan', nearbyAreas: 'SoHo, Financial District, and Hudson Square' },
    { slug: 'hells-kitchen-manhattan', name: 'Hell\'s Kitchen', borough: 'Manhattan', nearbyAreas: 'Midtown, Chelsea, and Lincoln Center' },
    { slug: 'harlem-manhattan', name: 'Harlem', borough: 'Manhattan', nearbyAreas: 'East Harlem, Washington Heights, and Morningside Heights' },
    { slug: 'washington-heights-manhattan', name: 'Washington Heights', borough: 'Manhattan', nearbyAreas: 'Inwood, Harlem, and Fort George' },
    { slug: 'midtown-manhattan', name: 'Midtown', borough: 'Manhattan', nearbyAreas: 'Hell\'s Kitchen, Murray Hill, and Gramercy' },
    { slug: 'east-village-manhattan', name: 'East Village', borough: 'Manhattan', nearbyAreas: 'Lower East Side, NoHo, and Gramercy' },
    { slug: 'inwood-manhattan', name: 'Inwood', borough: 'Manhattan', nearbyAreas: 'Washington Heights, Fort George, and Hudson Heights' },
    { slug: 'riverdale-bronx', name: 'Riverdale', borough: 'Bronx', nearbyAreas: 'Fieldston, Kingsbridge, and Spuyten Duyvil' },
    { slug: 'fordham-bronx', name: 'Fordham', borough: 'Bronx', nearbyAreas: 'Belmont, Kingsbridge, and University Heights' },
    { slug: 'pelham-bay-bronx', name: 'Pelham Bay', borough: 'Bronx', nearbyAreas: 'Throggs Neck, Co-op City, and City Island' },
    { slug: 'mott-haven-bronx', name: 'Mott Haven', borough: 'Bronx', nearbyAreas: 'Hunts Point, Port Morris, and Melrose' },
    { slug: 'concourse-bronx', name: 'Concourse', borough: 'Bronx', nearbyAreas: 'Highbridge, Mount Eden, and Fordham' },
    { slug: 'throgs-neck-bronx', name: 'Throgs Neck', borough: 'Bronx', nearbyAreas: 'Pelham Bay, Edgewater Park, and Country Club' },
    { slug: 'st-george-staten-island', name: 'St. George', borough: 'Staten Island', nearbyAreas: 'Tompkinsville, New Brighton, and Stapleton' },
    { slug: 'tottenville-staten-island', name: 'Tottenville', borough: 'Staten Island', nearbyAreas: 'Charleston, Woodrow, and Great Kills' },
    { slug: 'great-kills-staten-island', name: 'Great Kills', borough: 'Staten Island', nearbyAreas: 'Eltingville, Bay Terrace, and Annadale' },
    { slug: 'stapleton-staten-island', name: 'Stapleton', borough: 'Staten Island', nearbyAreas: 'St. George, Clifton, and Tompkinsville' },
  ];
  const map = new Map<string, { categorySlug: string; categoryName: string; neighborhoodName: string; borough: string; nearbyAreas: string }>();
  for (const [catSlug, catName] of Object.entries(CATEGORIES)) {
    for (const n of NEIGHBORHOODS) {
      map.set(`${catSlug}-${n.slug}`, { categorySlug: catSlug, categoryName: catName, neighborhoodName: n.name, borough: n.borough, nearbyAreas: n.nearbyAreas });
    }
  }
  return map;
})();

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

  // Neighborhood × Category pages — /[category]-[neighborhood]-[borough]
  // Must check before /:petType catch-all
  if (segments.length === 1) {
    const neighborhoodEntry = NEIGHBORHOOD_PAGE_REGISTRY.get(segments[0]);
    if (neighborhoodEntry) {
      return {
        type: 'neighborhood',
        slug: segments[0],
        categorySlug: neighborhoodEntry.categorySlug,
        neighborhoodName: neighborhoodEntry.neighborhoodName,
        borough: neighborhoodEntry.borough,
        nearbyAreas: neighborhoodEntry.nearbyAreas,
      };
    }
  }

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

/** Races a DB query against a timeout so bots fail fast if MongoDB is unreachable */
const withTimeout = <T>(promise: Promise<T>, ms = 3000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`DB timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

const fetchProduct = async (slug: string) => {
  return withTimeout(
    Product.findOne({ slug, isActive: true })
      .select('name slug description brand images basePrice compareAtPrice averageRating totalReviews inStock totalStock petType category createdAt updatedAt')
      .populate({ path: 'category', select: 'name slug' })
      .lean()
      .exec()
  );
};

const fetchBlog = async (slug: string) => {
  return withTimeout(
    Blog.findOne({ slug, isPublished: true })
      .select('title slug excerpt content coverImage author publishedAt updatedAt')
      .lean()
      .exec()
  );
};

const fetchCareGuide = async (slug: string) => {
  return withTimeout(
    CareGuide.findOne({ slug, isPublished: true })
      .select('title slug excerpt coverImage petType updatedAt')
      .lean()
      .exec()
  );
};

const fetchCategory = async (slug: string) => {
  return withTimeout(
    Category.findOne({ slug, isActive: true })
      .select('name slug description petType')
      .lean()
      .exec()
  );
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
  
  // Deduplicate brand from product name ONLY if the brand is literally repeated twice
  // e.g. "Purina ONE Purina® ONE® Adult Dog Dry Food" → "Purina® ONE® Adult Dog Dry Food"
  // Do NOT strip "Whisker City® Black Mesh..." → brand appears once, keep it in the title
  let productName = decodeEntities(decodeEntities(product.name ?? ''));
  if (brandName && productName.length > brandName.length * 2) {
    // Only strip when the brand name appears at the very start AND also again right after
    const dupPattern = new RegExp(`^${escRegex(brandName)}\\s+${escRegex(brandName)}`, 'i');
    if (dupPattern.test(productName)) {
      productName = productName.substring(brandName.length).trim();
    }
  }
  
  const rawDesc: string = product.description
    ? clean(product.description)
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
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        applicableCountry: 'US',
      },
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

  const stockLabel = inStock ? '✓ In Stock' : 'Out of Stock';
  const stockColor = inStock ? '#2e7d32' : '#c62828';
  const priceDisplay = price > 0 ? `$${price.toFixed(2)}` : '';
  const compareDisplay = (product.compareAtPrice ?? 0) > price && price > 0
    ? `<s style="color:#888;font-size:0.9em">$${Number(product.compareAtPrice).toFixed(2)}</s> ` : '';
  const ratingDisplay = (product.averageRating ?? 0) > 0
    ? `<p style="margin:8px 0;color:#f5a623">★ ${Number(product.averageRating).toFixed(1)} / 5 (${product.totalReviews ?? 0} reviews)</p>`
    : '';

  const breadcrumbHtml = [
    `<a href="${BASE}" style="color:#1976d2;text-decoration:none">Home</a>`,
    petType ? `<a href="${BASE}/${petType}" style="color:#1976d2;text-decoration:none">${petLabel}</a>` : '',
    categoryName && categorySlug ? `<a href="${BASE}/${petType}/${categorySlug}" style="color:#1976d2;text-decoration:none">${esc(categoryName)}</a>` : '',
    `<span style="color:#555">${esc(productName)}</span>`,
  ].filter(Boolean).join(' &rsaquo; ');

  const bodyContent = `
<div style="font-family:sans-serif;max-width:960px;margin:0 auto;padding:20px">
  <nav style="font-size:0.85em;margin-bottom:16px;color:#555">${breadcrumbHtml}</nav>
  <div style="display:flex;gap:32px;flex-wrap:wrap">
    ${image ? `<img src="${esc(image)}" alt="${esc(productName)}" style="max-width:320px;max-height:320px;object-fit:contain;border-radius:8px;border:1px solid #eee" loading="lazy" />` : ''}
    <div style="flex:1;min-width:240px">
      <h1 style="font-size:1.4em;margin:0 0 8px">${esc(productName)}</h1>
      ${brandName ? `<p style="margin:4px 0;color:#555">Brand: <strong>${esc(brandName)}</strong></p>` : ''}
      ${priceDisplay ? `<p style="margin:8px 0;font-size:1.5em;font-weight:700">${compareDisplay}${esc(priceDisplay)}</p>` : ''}
      <p style="margin:4px 0;color:${stockColor};font-weight:600">${stockLabel}</p>
      ${ratingDisplay}
      <p style="margin:12px 0;line-height:1.6;color:#333">${esc(rawDesc.substring(0, 500))}</p>
      <a href="${esc(productUrl)}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View Product</a>
    </div>
  </div>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
  <p style="color:#555;font-size:0.9em">
    Delivered to your door anywhere in NYC. Free shipping on orders over $49.
    ${petType ? `<a href="${BASE}/${petType}" style="color:#1976d2">Browse more ${petLabel} products</a> &bull;` : ''}
    ${categoryName && categorySlug ? `<a href="${BASE}/${petType}/${categorySlug}" style="color:#1976d2">${esc(categoryName)}</a>` : ''}
    <a href="${BASE}" style="color:#1976d2">Petshiwu — NYC&rsquo;s Local Pet Store</a>
  </p>
</div>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, productUrl);
  html = injectBeforeHeadClose(html, injectedTags);
  // Replace entire root div with full crawlable body content (includes H1)
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${bodyContent}</div>`);
  if (!html.includes(bodyContent)) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  }
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

  const blogExcerpt = blog.excerpt ?? stripTags(blog.content ?? '').substring(0, 400);
  const blogBodyContent = `
<div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
  <nav style="font-size:0.85em;margin-bottom:16px;color:#555">
    <a href="${BASE}" style="color:#1976d2;text-decoration:none">Home</a> &rsaquo;
    <a href="${BASE}/learning" style="color:#1976d2;text-decoration:none">Learning</a> &rsaquo;
    <span style="color:#555">${esc(blog.title)}</span>
  </nav>
  ${image !== `${BASE}/logo.png` ? `<img src="${esc(image)}" alt="${esc(blog.title)}" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:16px" loading="lazy" />` : ''}
  <h1 style="font-size:1.6em;margin:0 0 12px">${esc(blog.title)}</h1>
  <p style="color:#555;font-size:0.9em;margin-bottom:16px">${blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
  <p style="line-height:1.7;color:#333;font-size:1.05em">${esc(blogExcerpt)}</p>
  <a href="${esc(url)}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Read Full Article</a>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
  <p style="color:#555;font-size:0.9em"><a href="${BASE}/learning" style="color:#1976d2">More Pet Care Articles</a> &bull; <a href="${BASE}" style="color:#1976d2">Petshiwu — NYC&rsquo;s Local Pet Store</a></p>
</div>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, url);
  html = injectBeforeHeadClose(html, injectedTags);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${blogBodyContent}</div>`);
  if (!html.includes(blogBodyContent)) {
    html = html.replace('<div id="root"></div>', `<div id="root">${blogBodyContent}</div>`);
  }
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

  const guideExcerpt = guide.excerpt ?? `Complete care guide for ${guide.title} — tips, advice, and expert information for pet owners.`;
  const guideBodyContent = `
<div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
  <nav style="font-size:0.85em;margin-bottom:16px;color:#555">
    <a href="${BASE}" style="color:#1976d2;text-decoration:none">Home</a> &rsaquo;
    <a href="${BASE}/care-guides" style="color:#1976d2;text-decoration:none">Care Guides</a> &rsaquo;
    <span style="color:#555">${esc(guide.title)}</span>
  </nav>
  ${image !== `${BASE}/logo.png` ? `<img src="${esc(image)}" alt="${esc(guide.title)}" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:16px" loading="lazy" />` : ''}
  <h1 style="font-size:1.6em;margin:0 0 12px">${esc(guide.title)}</h1>
  <p style="line-height:1.7;color:#333;font-size:1.05em">${esc(guideExcerpt)}</p>
  <a href="${esc(url)}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Read Full Guide</a>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
  <p style="color:#555;font-size:0.9em"><a href="${BASE}/care-guides" style="color:#1976d2">All Care Guides</a> &bull; <a href="${BASE}" style="color:#1976d2">Petshiwu — NYC&rsquo;s Local Pet Store</a></p>
</div>`;

  let html = injectTitle(template, title);
  html = injectDescription(html, description);
  html = injectCanonical(html, url);
  html = injectBeforeHeadClose(html, injectedTags);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${guideBodyContent}</div>`);
  if (!html.includes(guideBodyContent)) {
    html = html.replace('<div id="root"></div>', `<div id="root">${guideBodyContent}</div>`);
  }
  return html;
};

const buildCategoryHtml = (template: string, category: any, petType?: string, canonicalPath?: string): string => {
  const catName = category.name ?? '';
  const petLabel = petType === 'dog' ? 'Dog' : petType === 'cat' ? 'Cat' : petType === 'bird' ? 'Bird' : petType === 'fish' ? 'Fish' : petType === 'reptile' ? 'Reptile' : petType === 'small-pet' ? 'Small Pet' : '';
  const title = petLabel
    ? `${catName} — ${petLabel} Supplies Delivered NYC | PetShiwu`
    : `${catName} | PetShiwu`;
  const description = truncate(
    category.description ?? `Shop ${catName} for your ${petLabel || 'pet'} at PetShiwu. 340+ products, top brands, free delivery on orders over $49. Serving Queens, Brooklyn, Manhattan & all NYC.`,
    160
  );

  // Use the actual request path as canonical when available (avoids mismatch
  // between nested URLs like /dog/food--treats/puppy-food and slug-only form)
  const url = canonicalPath
    ? `${BASE}${canonicalPath}`
    : petType && petType !== 'all'
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
// Neighborhood × Category page HTML builder (200 programmatic local SEO pages)
// ---------------------------------------------------------------------------
const buildNeighborhoodHtml = (
  template: string,
  slug: string,
  categorySlug: string,
  neighborhoodName: string,
  borough: string,
  nearbyAreas: string
): string => {
  const CATEGORY_LABELS: Record<string, { label: string; petLabel: string }> = {
    'dog-food-delivery': { label: 'Dog Food Delivery', petLabel: 'dog food' },
    'cat-food-delivery': { label: 'Cat Food Delivery', petLabel: 'cat food' },
    'pet-supplies-delivery': { label: 'Pet Supplies Delivery', petLabel: 'pet supplies' },
    'dog-treats-delivery': { label: 'Dog Treats & Accessories Delivery', petLabel: 'dog treats' },
  };
  const cat = CATEGORY_LABELS[categorySlug] ?? { label: 'Pet Supplies Delivery', petLabel: 'pet supplies' };
  const title = `${cat.label} in ${neighborhoodName}, ${borough} | Petshiwu`;
  const description = `Shop premium ${cat.petLabel} and get delivered to ${neighborhoodName}, ${borough}. Free shipping on orders over $49. Queens-based NYC delivery. 10,000+ products.`;
  const pageUrl = `${BASE}/${slug}`;
  const h1 = `${cat.label} in ${neighborhoodName}, ${borough}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: pageUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
        { '@type': 'ListItem', position: 2, name: `${cat.label} NYC`, item: `${BASE}/${categorySlug}-nyc` },
        { '@type': 'ListItem', position: 3, name: `${neighborhoodName}, ${borough}`, item: pageUrl },
      ],
    },
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Petshiwu',
    description: `Pet supply store delivering ${cat.petLabel} to ${neighborhoodName}, ${borough} and nearby ${nearbyAreas}.`,
    url: BASE,
    telephone: '+18002592605',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jackson Heights',
      addressRegion: 'NY',
      postalCode: '11372',
      addressCountry: 'US',
    },
    areaServed: [
      { '@type': 'City', name: 'New York City' },
      { '@type': 'Neighborhood', name: neighborhoodName },
    ],
    priceRange: '$',
    openingHours: 'Mo-Su 09:00-20:00',
  };

  const injectedTags = `
  <!-- Bot renderer: neighborhood-category page meta -->
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">${JSON.stringify(pageSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(localBusinessSchema)}</script>`;

  const bodyContent = `
  <nav style="font-size:0.85em;color:#777;margin-bottom:12px">
    <a href="${BASE}" style="color:#1976d2">Home</a> &rsaquo;
    <span>${esc(cat.label)} NYC</span> &rsaquo;
    <span>${esc(neighborhoodName)}, ${esc(borough)}</span>
  </nav>
  <h1 style="font-size:1.7em;font-weight:700;margin:0 0 12px">${esc(h1)}</h1>
  <p style="color:#444;line-height:1.7;margin-bottom:16px">Petshiwu delivers premium ${cat.petLabel} to every address in ${esc(neighborhoodName)}, ${esc(borough)} — including nearby ${esc(nearbyAreas)}. We're Queens-based with 10,000+ products and free shipping on orders over $49.</p>
  <a href="${BASE}/products" style="display:inline-block;padding:10px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-bottom:20px">Shop ${esc(cat.petLabel)} →</a>
  <p style="color:#555;font-size:0.9em"><a href="${BASE}/learning" style="color:#1976d2">Pet Care Blog</a> &bull; <a href="${BASE}" style="color:#1976d2">Petshiwu — NYC&rsquo;s Local Pet Store</a></p>`;

  let html = template;
  html = injectOrReplaceCanonical(html, pageUrl);
  html = injectOrReplaceTitle(html, title);
  html = injectOrReplaceMeta(html, description);
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${injectedTags}\n</head>`);
  }
  html = injectOrReplaceH1(html, `<h1 style="font-size:1.7em;font-weight:700;margin:0 0 12px">${esc(h1)}</h1>`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${bodyContent}</div>`);
  if (!html.includes(bodyContent)) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  }
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
          if (product) {
            html = buildProductHtml(template, product, page.slug);
          } else {
            // URL had 3+ segments but no product matched — likely a nested category URL
            // e.g. /dog/food--treats/puppy-food where "puppy-food" is a category slug
            const category = await fetchCategory(page.slug);
            if (category) {
              // Derive petType from first URL segment, pass actual path as canonical
              const petTypeFromPath = req.path.split('/').filter(Boolean)[0] ?? '';
              html = buildCategoryHtml(template, category, petTypeFromPath, req.path);
            }
          }
        } else if (page?.type === 'blog') {
          const blog = await fetchBlog(page.slug);
          if (blog) html = buildBlogHtml(template, blog);
        } else if (page?.type === 'care-guide') {
          const guide = await fetchCareGuide(page.slug);
          if (guide) html = buildCareGuideHtml(template, guide);
        } else if (page?.type === 'category') {
          const category = await fetchCategory(page.slug);
          if (category) html = buildCategoryHtml(template, category, (page as any).petType);
        } else if (page?.type === 'neighborhood') {
          html = buildNeighborhoodHtml(
            template,
            page.slug,
            page.categorySlug,
            page.neighborhoodName,
            page.borough,
            page.nearbyAreas,
          );
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
