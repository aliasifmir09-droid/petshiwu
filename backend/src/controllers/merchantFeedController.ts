import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import logger from '../utils/logger';

const BASE_URL = 'https://www.petshiwu.com';
const MERCHANT_ID = '5791232179';
const STORE_NAME = 'PetShiwu';

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

// Strip HTML tags and decode common entities
function stripHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
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
      const title = x(product.name.slice(0, 150));
      const description = x(stripHtml(product.shortDescription || product.description || product.name).slice(0, 5000));
      const brand = x(product.brand || STORE_NAME);
      const productType = x(buildProductType(product.petType, catName));
      const label = x(petTypeLabel(product.petType));

      // If product has variants, emit one item per variant
      const variants = product.variants || [];
      if (variants.length > 1) {
        let isFirst = true;
        for (const v of variants) {
          const vPrice = (v.salePrice && v.salePrice > 0 && v.salePrice < v.price)
            ? v.salePrice
            : v.price;
          if (!vPrice) continue;

          const variantId = `petshiwu-${product._id}-${v.sku || v.label?.replace(/\s+/g, '-')}`;
          const variantTitle = v.label ? `${product.name} - ${v.label}` : product.name;
          const variantImg = (v as any).image || imageUrl;

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
      ${v.label ? `<g:size>${x(v.label)}</g:size>` : ''}
      ${isFirst ? '<g:is_bundle>no</g:is_bundle>' : ''}
    </item>\n`;
          isFirst = false;
        }
      } else {
        // Single-variant product
        const v = variants[0];
        const price = v?.salePrice && v.salePrice > 0 && v.salePrice < v.price
          ? v.salePrice
          : (v?.price || product.basePrice);
        if (!price) continue;

        const id = `petshiwu-${product._id}`;

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
