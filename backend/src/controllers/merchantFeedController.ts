import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import logger from '../utils/logger';

const BASE_URL = 'https://www.petshiwu.com';
const MERCHANT_ID = '5791232179';
const STORE_NAME = 'Petshiwu';

// Map petType + category to Google product_type string
function buildProductType(petType: string, categoryName: string): string {
  const pet = petType
    ? petType.charAt(0).toUpperCase() + petType.slice(1).replace(/-/g, ' ')
    : 'Pet';
  return `${pet} Supplies > ${categoryName}`;
}

// Map petType to Google custom_label for segmentation
function petTypeLabel(petType: string): string {
  const map: Record<string, string> = {
    dog: 'Dog',
    cat: 'Cat',
    bird: 'Bird',
    fish: 'Fish',
    reptile: 'Reptile',
    'small-animal': 'Small Animal',
  };
  return map[petType?.toLowerCase()] || 'Pet';
}

// Escape XML special chars
function x(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strip HTML tags and fully decode entities (handles double-encoded too)
function stripHtml(str: string): string {
  if (!str) return '';
  let s = str;
  // Decode up to 3 levels of encoding
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n)));
  }
  // Strip HTML tags
  s = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return s.slice(0, 5000);
}

// Clean text for XML — decode first, then re-escape only what XML needs
function cleanText(str: string): string {
  if (!str) return '';
  // Fully decode any existing HTML entities first
  let s = str;
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n)));
  }
  // Now XML-escape cleanly (single pass)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * GET /api/v1/feed/google
 * Google Merchant Center RSS2 / Atom product feed
 * Streams all active in-stock products as Google Shopping XML
 */
export const googleMerchantFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all active products with populated category
    const products = await Product.find({
      isActive: true,
      inStock: true,
      deletedAt: null,
    })
      .populate('category', 'name slug')
      .select('name slug description shortDescription brand category images cloudinaryImage variants basePrice petType tags isFeatured inStock')
      .lean();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hr cache

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${x(STORE_NAME)}</title>
    <link>${BASE_URL}</link>
    <description>Premium pet supplies delivered in NYC — food, toys, treats and more for dogs, cats, birds, fish and small animals.</description>\n`;

    for (const product of products) {
      const cat = product.category as any;
      const catName = cat?.name || 'Pet Supplies';
      const imageUrl = product.cloudinaryImage
        || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '');

      if (!imageUrl) continue; // Google requires an image

      const productUrl = `${BASE_URL}/products/${product.slug}`;
      const title = cleanText(product.name.slice(0, 150));
      const description = cleanText(stripHtml(product.shortDescription || product.description || product.name).slice(0, 5000));
      const brand = cleanText(product.brand || STORE_NAME);
      const productType = cleanText(buildProductType(product.petType, catName));
      const label = cleanText(petTypeLabel(product.petType));

      // If product has variants, emit one item per variant
      const variants = product.variants || [];
      if (variants.length > 1) {
        let isFirst = true;
        for (let vi = 0; vi < variants.length; vi++) {
          const v = variants[vi];
          const vAny = v as any;
          const vPrice = v.price;
          if (!vPrice) continue;

          const vLabel: string = vAny.label || vAny.size || vAny.flavor || vAny.weight || '';
          // Use index-based ID to guarantee uniqueness across all variants
          const variantId = `ps-${String(product._id).slice(-12)}-${vi}`;
          const variantTitle = vLabel ? `${product.name} - ${vLabel}` : product.name;
          const variantImg = vAny.image || imageUrl;

          xml += `    <item>
      <g:id>${x(variantId.slice(0, 50))}</g:id>
      <g:title>${x(variantTitle.slice(0, 150))}</g:title>
      <g:description>${description}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${x(variantImg)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${vPrice.toFixed(2)} USD</g:price>
      <g:brand>${brand}</g:brand>
      <g:product_type>${productType}</g:product_type>
      <g:custom_label_0>${label}</g:custom_label_0>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>${vPrice >= 49 ? '0.00' : '6.00'} USD</g:price>
      </g:shipping>
      ${vLabel ? `<g:size>${x(vLabel)}</g:size>` : ''}
      ${isFirst ? '<g:is_bundle>no</g:is_bundle>' : ''}
    </item>\n`;
          isFirst = false;
        }
      } else {
        // Single-variant product
        const v = variants[0];
        const vAny0 = v as any;
        const price = v?.price || product.basePrice;
        if (!price) continue;

        const id = `ps-${String(product._id).slice(-12)}`;

        xml += `    <item>
      <g:id>${x(id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${x(imageUrl)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price.toFixed(2)} USD</g:price>
      <g:brand>${brand}</g:brand>
      <g:product_type>${productType}</g:product_type>
      <g:custom_label_0>${label}</g:custom_label_0>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>${price >= 49 ? '0.00' : '6.00'} USD</g:price>
      </g:shipping>
    </item>\n`;
      }
    }

    xml += `  </channel>\n</rss>`;
    res.send(xml);

  } catch (err) {
    logger.error('Google merchant feed error:', err);
    res.status(500).send('<?xml version="1.0"?><error>Feed generation failed</error>');
  }
};
