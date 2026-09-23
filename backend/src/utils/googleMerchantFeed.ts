/**
 * Google Merchant Center product feed helpers.
 *
 * Popular products / free listings in Google Search come from Merchant Center,
 * not from schema.org alone. This module builds RSS 2.0 + Google namespace
 * items that match the live product pages (canonical URL, price, image).
 */

import { DEFAULT_OG_IMAGE, SITE_ORIGIN, resolveShareImage } from '../seo/ogTags';
import {
  HILLS_CD_OCEAN_FISH_IMAGE,
  HILLS_CD_OCEAN_FISH_SLUG,
} from '../services/launchCatalogRepair';

export const STORE_NAME = 'Petshiwu';
export const FEED_TITLE = 'Petshiwu — NYC same-day pet supplies';

export type FeedCategory = { name?: string; slug?: string } | string | null | undefined;

export interface FeedVariant {
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  size?: string;
  weight?: string;
  label?: string;
  flavor?: string;
  image?: string;
  attributes?: Record<string, string> | Map<string, string>;
}

export interface FeedProduct {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category?: FeedCategory;
  images?: unknown[];
  cloudinaryImage?: string;
  bunnyImage?: string;
  variants?: FeedVariant[];
  basePrice?: number;
  compareAtPrice?: number;
  petType?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

/** XML 1.0 forbids most C0 control characters; one bad name would fail the whole feed. */
export function stripInvalidXmlChars(str: string): string {
  return String(str || '').replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');
}

export function xmlEscape(str: string): string {
  if (!str) return '';
  return stripInvalidXmlChars(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function stripHtml(str: string): string {
  if (!str) return '';
  let s = str;
  for (let i = 0; i < 4; i++) {
    const next = s
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&#x0*27;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (next === s) break;
    s = next;
  }
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function cleanText(str: string, max = 5000): string {
  return xmlEscape(stripHtml(str).slice(0, max));
}

export function categoryName(category: FeedCategory): string {
  if (!category) return 'Pet Supplies';
  if (typeof category === 'string') return category || 'Pet Supplies';
  return category.name || 'Pet Supplies';
}

export function categorySlug(category: FeedCategory): string | undefined {
  if (!category || typeof category === 'string') return undefined;
  const slug = category.slug?.trim();
  return slug || undefined;
}

export function canonicalProductUrl(product: FeedProduct): string {
  const slug = (product.slug || '').trim();
  const pet = (product.petType || '').trim().toLowerCase().replace(/\s+/g, '-');
  const cat = categorySlug(product.category);
  if (slug && pet && cat) {
    return `${SITE_ORIGIN}/${pet}/${cat}/${slug}`;
  }
  return `${SITE_ORIGIN}/products/${slug}`;
}

export function productImages(product: FeedProduct): string[] {
  // Match storefront priority: images[] (real Bunny /products files) first.
  // bunnyImage is often a host-swapped Cloudinary path that 404s on Bunny.
  const raw: unknown[] = [];
  if (product.slug === HILLS_CD_OCEAN_FISH_SLUG) {
    raw.push(HILLS_CD_OCEAN_FISH_IMAGE);
  }
  if (Array.isArray(product.images)) raw.push(...product.images);
  if (product.bunnyImage) raw.push(product.bunnyImage);
  if (product.cloudinaryImage) raw.push(product.cloudinaryImage);

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let value: unknown = item;
    if (item && typeof item === 'object' && 'url' in (item as object)) {
      value = (item as { url?: unknown }).url;
    }
    if (typeof value !== 'string' || !value.trim()) continue;
    const resolved = resolveShareImage(value);
    if (!resolved || resolved === DEFAULT_OG_IMAGE) continue;
    if (!/^https?:\/\//i.test(resolved)) continue;
    // Hotlinked PetSmart / Scene7 files get rejected and pull the offer down.
    if (/s7d2\.scene7\.com/i.test(resolved) || /petsmart/i.test(resolved)) continue;
    if (/res\.cloudinary\.com/i.test(resolved)) continue;
    if (/\/dtmes0dha\//i.test(resolved) || /\/image\/upload\//i.test(resolved)) continue;
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    urls.push(resolved);
    if (urls.length >= 10) break;
  }
  return urls;
}

export function googleProductCategory(petType: string, catName: string): string {
  const pet = (petType || '').toLowerCase();
  const cat = (catName || '').toLowerCase();
  const isTreat = /treat|chew|biscuit|dental/.test(cat);
  const isFood = /food|diet|kibble|wet|dry|prescription/.test(cat);
  const isToy = /toy|play/.test(cat);
  const isLitter = /litter/.test(cat);

  if (pet === 'dog') {
    if (isTreat) return 'Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Treats';
    if (isFood) return 'Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Food';
    if (isToy) return 'Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Toys';
    return 'Animals & Pet Supplies > Pet Supplies > Dog Supplies';
  }
  if (pet === 'cat') {
    if (isLitter) return 'Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Litter';
    if (isTreat) return 'Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Treats';
    if (isFood) return 'Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Food';
    if (isToy) return 'Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Toys';
    return 'Animals & Pet Supplies > Pet Supplies > Cat Supplies';
  }
  if (pet === 'bird') return 'Animals & Pet Supplies > Pet Supplies > Bird Supplies';
  if (pet === 'fish') return 'Animals & Pet Supplies > Pet Supplies > Fish Supplies';
  if (pet === 'reptile') return 'Animals & Pet Supplies > Pet Supplies > Reptile & Amphibian Supplies';
  if (pet === 'small-animal' || pet === 'small-pet') {
    return 'Animals & Pet Supplies > Pet Supplies > Small Animal Supplies';
  }
  return 'Animals & Pet Supplies > Pet Supplies';
}

export function petTypeLabel(petType: string): string {
  const map: Record<string, string> = {
    dog: 'Dog',
    cat: 'Cat',
    bird: 'Bird',
    fish: 'Fish',
    reptile: 'Reptile',
    'small-animal': 'Small Animal',
    'small-pet': 'Small Animal',
  };
  return map[(petType || '').toLowerCase()] || 'Pet';
}

function attrMap(variant?: FeedVariant): Record<string, string> {
  if (!variant?.attributes) return {};
  if (variant.attributes instanceof Map) {
    return Object.fromEntries(variant.attributes);
  }
  return variant.attributes;
}

export function variantLabel(variant?: FeedVariant): string {
  if (!variant) return '';
  const attrs = attrMap(variant);
  return (
    variant.label ||
    variant.size ||
    variant.weight ||
    attrs.size ||
    attrs.weight ||
    attrs.flavor ||
    variant.flavor ||
    ''
  );
}

export function parseUnitPricing(label: string): { measure: string; base: string } | null {
  const match = String(label || '').match(/(\d+(?:\.\d+)?)\s*-?\s*(lb|lbs|pound|pounds|oz|ounce|ounces|kg|g)\b/i);
  if (!match) return null;
  const amount = match[1];
  const unitRaw = match[2].toLowerCase();
  const unit =
    unitRaw.startsWith('lb') || unitRaw.startsWith('pound') ? 'lb' :
    unitRaw.startsWith('oz') || unitRaw.startsWith('ounce') ? 'oz' :
    unitRaw === 'kg' ? 'kg' : 'g';
  return {
    measure: `${amount} ${unit}`,
    base: `1 ${unit}`,
  };
}

export function looksLikeGtin(sku: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(String(sku || '').trim());
}

/** Google Merchant MPN must be 1–70 characters. Omit anything else. */
export function merchantMpn(sku?: string): string | undefined {
  const value = String(sku || '').trim();
  if (value.length < 1 || value.length > 70) return undefined;
  return value;
}

function shippingService(
  region: string,
  service: string,
  minTransit: number,
  maxTransit: number,
  shipPrice: string
): string {
  return `      <g:shipping>
        <g:country>US</g:country>
        <g:region>${region}</g:region>
        <g:service>${service}</g:service>
        <g:price>${shipPrice} USD</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>0</g:max_handling_time>
        <g:min_transit_time>${minTransit}</g:min_transit_time>
        <g:max_transit_time>${maxTransit}</g:max_transit_time>
      </g:shipping>`;
}

/** Checkout delivers NYC same-day plus the 50-mile NY/NJ/CT metro. Not nationwide. */
function shippingXml(price: number): string {
  const shipPrice = price >= 49 ? '0.00' : '6.00';
  return [
    shippingService('NY', 'Same-day NYC', 0, 1, shipPrice),
    shippingService('NJ', 'Next-day metro', 1, 1, shipPrice),
    shippingService('CT', 'Next-day metro', 1, 1, shipPrice),
  ].join('\n');
}

export function buildMerchantItemXml(opts: {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  extraImages?: string[];
  price: number;
  salePrice?: number;
  availability: 'in stock' | 'out of stock';
  brand: string;
  mpn?: string;
  gtin?: string;
  productType: string;
  googleCategory: string;
  petLabel: string;
  size?: string;
  itemGroupId?: string;
  featured?: boolean;
}): string {
  const extra = (opts.extraImages || [])
    .filter((url) => url && url !== opts.image)
    .slice(0, 9)
    .map((url) => `      <g:additional_image_link>${xmlEscape(url)}</g:additional_image_link>`)
    .join('\n');

  const unit = parseUnitPricing(opts.size || opts.title);
  const identifier = opts.gtin
    ? `      <g:gtin>${xmlEscape(opts.gtin)}</g:gtin>`
    : opts.mpn
      ? `      <g:mpn>${xmlEscape(opts.mpn)}</g:mpn>`
      : '      <g:identifier_exists>no</g:identifier_exists>';

  const lines = [
    '    <item>',
    `      <g:id>${xmlEscape(opts.id.slice(0, 50))}</g:id>`,
    `      <g:title>${cleanText(opts.title, 150)}</g:title>`,
    `      <g:description>${opts.description}</g:description>`,
    `      <g:link>${xmlEscape(opts.link)}</g:link>`,
    `      <g:canonical_link>${xmlEscape(opts.link)}</g:canonical_link>`,
    `      <g:image_link>${xmlEscape(opts.image)}</g:image_link>`,
    extra,
    '      <g:condition>new</g:condition>',
    `      <g:availability>${opts.availability}</g:availability>`,
    `      <g:price>${opts.price.toFixed(2)} USD</g:price>`,
    opts.salePrice && opts.salePrice < opts.price
      ? `      <g:sale_price>${opts.salePrice.toFixed(2)} USD</g:sale_price>`
      : '',
    `      <g:brand>${cleanText(opts.brand, 70)}</g:brand>`,
    identifier,
    `      <g:product_type>${cleanText(opts.productType, 750)}</g:product_type>`,
    `      <g:google_product_category>${xmlEscape(opts.googleCategory)}</g:google_product_category>`,
    `      <g:custom_label_0>${xmlEscape(opts.petLabel)}</g:custom_label_0>`,
    `      <g:custom_label_1>${opts.featured ? 'Featured' : 'Catalog'}</g:custom_label_1>`,
    '      <g:custom_label_2>NYC same-day</g:custom_label_2>',
    '      <g:included_destination>Free_listings</g:included_destination>',
    '      <g:included_destination>Shopping_ads</g:included_destination>',
    opts.itemGroupId ? `      <g:item_group_id>${xmlEscape(opts.itemGroupId.slice(0, 50))}</g:item_group_id>` : '',
    opts.size ? `      <g:size>${xmlEscape(opts.size.slice(0, 100))}</g:size>` : '',
    unit ? `      <g:unit_pricing_measure>${unit.measure}</g:unit_pricing_measure>` : '',
    unit ? `      <g:unit_pricing_base_measure>${unit.base}</g:unit_pricing_base_measure>` : '',
    shippingXml(opts.salePrice && opts.salePrice < opts.price ? opts.salePrice : opts.price),
    '    </item>',
  ];

  return `${lines.filter(Boolean).join('\n')}\n`;
}

const LIVE_ANIMAL_RE =
  /\blive\b.+\b(cricket|waxworm|superworm|mealworm|hornworm|dubia|roach|mice|mouse|rat|feeder fish|feeder insect)s?\b|\b(cricket|waxworm|superworm|mealworm|hornworm|dubia roach)s?\b.+\blive\b/i;
const PRESERVED_FEEDER_RE = /\b(freeze[-\s]?dried|dehydrated|oven[-\s]?dried|canned|dried)\b/i;

/** Google Shopping disallows live animals, including feeder insects. */
export function isLiveAnimalOffer(product: FeedProduct, variantTitle?: string): boolean {
  const haystack = [product.name, variantTitle, product.shortDescription, product.description]
    .filter(Boolean)
    .join(' ');
  if (PRESERVED_FEEDER_RE.test(haystack) && !/\blive\b/i.test(product.name)) return false;
  return LIVE_ANIMAL_RE.test(haystack);
}

export function feedItemsForProduct(product: FeedProduct): string {
  if (isLiveAnimalOffer(product)) return '';
  const images = productImages(product);
  if (images.length === 0) return '';

  const link = canonicalProductUrl(product);
  const catName = categoryName(product.category);
  const description = cleanText(product.shortDescription || product.description || product.name, 5000);
  const brand = product.brand?.trim() || STORE_NAME;
  const productType = `${petTypeLabel(product.petType || '')} Supplies > ${catName}`;
  const googleCategory = googleProductCategory(product.petType || '', catName);
  const petLabel = petTypeLabel(product.petType || '');
  const groupId = `ps-${String(product._id).slice(-12)}`;
  const extraImages = images.slice(1);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const emitVariant = variants.length > 1;

  if (emitVariant) {
    let xml = '';
    variants.forEach((variant, index) => {
      const price = Number(variant.price);
      if (!price || price <= 0) return;
      const label = variantLabel(variant);
      const title = label ? `${product.name} - ${label}` : product.name;
      const variantImage = variant.image ? productImages({ ...product, cloudinaryImage: variant.image, images: [] })[0] : images[0];
      if (!variantImage) return;
      const sku = String(variant.sku || '').trim();
      const compare = Number(variant.compareAtPrice || 0);
      const stock = variant.stock ?? 0;
      const available = product.inStock !== false && stock > 0;

      xml += buildMerchantItemXml({
        id: `${groupId}-${index}`,
        title,
        description,
        link,
        image: variantImage,
        extraImages,
        price: compare > price ? compare : price,
        salePrice: compare > price ? price : undefined,
        availability: available ? 'in stock' : 'out of stock',
        brand,
        mpn: merchantMpn(sku),
        gtin: looksLikeGtin(sku) ? sku : undefined,
        productType,
        googleCategory,
        petLabel,
        size: label || undefined,
        itemGroupId: groupId,
        featured: Boolean(product.isFeatured),
      });
    });
    return xml;
  }

  const variant = variants[0];
  const price = Number(variant?.price || product.basePrice || 0);
  if (!price) return '';
  const sku = String(variant?.sku || '').trim();
  const compare = Number(variant?.compareAtPrice || product.compareAtPrice || 0);
  const stock = variant?.stock;
  const available = product.inStock !== false && (stock === undefined || stock > 0);
  const label = variantLabel(variant);

  return buildMerchantItemXml({
    id: groupId,
    title: product.name,
    description,
    link,
    image: images[0],
    extraImages,
    price: compare > price ? compare : price,
    salePrice: compare > price ? price : undefined,
    availability: available ? 'in stock' : 'out of stock',
    brand,
    mpn: merchantMpn(sku),
    gtin: looksLikeGtin(sku) ? sku : undefined,
    productType,
    googleCategory,
    petLabel,
    size: label || undefined,
    featured: Boolean(product.isFeatured),
  });
}

export function feedHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(FEED_TITLE)}</title>
    <link>${SITE_ORIGIN}</link>
    <description>NYC same-day pet food and supplies from Petshiwu. Order by 3 PM for delivery tonight.</description>
`;
}

export function feedFooter(): string {
  return `  </channel>
</rss>
`;
}

export function assembleMerchantFeed(products: FeedProduct[]): string {
  const items = products.map((product) => feedItemsForProduct(product)).join('');
  return `${feedHeader()}${items}${feedFooter()}`;
}
