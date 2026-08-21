import { Request, Response } from 'express';
import Product from '../models/Product';
import logger from '../utils/logger';
import {
  assembleMerchantFeed,
  FeedProduct,
} from '../utils/googleMerchantFeed';

const FEED_TTL_MS = 60 * 60 * 1000;
const FEED_SELECT =
  'name slug shortDescription description brand category images cloudinaryImage variants.price variants.compareAtPrice variants.stock variants.sku variants.size variants.weight variants.label variants.flavor variants.image basePrice compareAtPrice petType isFeatured inStock';

let cachedFeed: { xml: string; builtAt: number } | null = null;
let inflightFeed: Promise<string> | null = null;

export function resetMerchantFeedCache(): void {
  cachedFeed = null;
  inflightFeed = null;
}

async function buildMerchantFeedXml(): Promise<string> {
  const products = await Product.find({
    isActive: true,
    deletedAt: null,
  })
    .select(FEED_SELECT)
    .populate('category', 'name slug')
    .limit(10000)
    .maxTimeMS(45000)
    .lean()
    .exec();

  const xml = assembleMerchantFeed(products as FeedProduct[]);
  const items = (xml.match(/<item>/g) || []).length;
  logger.info(`Google merchant feed built: ${items} items, ${xml.length} bytes`);
  return xml;
}

export async function getMerchantFeedXml(): Promise<string> {
  if (cachedFeed && Date.now() - cachedFeed.builtAt < FEED_TTL_MS) {
    return cachedFeed.xml;
  }
  if (!inflightFeed) {
    inflightFeed = buildMerchantFeedXml()
      .then((xml) => {
        cachedFeed = { xml, builtAt: Date.now() };
        return xml;
      })
      .finally(() => {
        inflightFeed = null;
      });
  }
  return inflightFeed;
}

export function warmMerchantFeedCache(): void {
  getMerchantFeedXml().catch((err) => {
    logger.warn('Merchant feed warmup failed (non-fatal):', err instanceof Error ? err.message : err);
  });
}

/**
 * GET /api/v1/feed/google  and  /feeds/google.xml
 * Google Merchant Center RSS 2.0 product feed for free listings /
 * Popular products in Search.
 *
 * The previous streaming write never flushed under gzip, so Google's
 * scheduled fetch timed out with 0 bytes and Merchant Center showed
 * 0 products. Serve a complete cached document instead.
 */
export const googleMerchantFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const xml = await getMerchantFeedXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.status(200).send(xml);
  } catch (err) {
    logger.error('Google merchant feed error:', err);
    if (!res.headersSent) {
      res.status(503).type('application/xml').send('<?xml version="1.0"?><error>Feed generation failed</error>');
      return;
    }
    res.end();
  }
};
