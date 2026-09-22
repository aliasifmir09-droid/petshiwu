import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import Product from '../models/Product';
import logger from '../utils/logger';
import {
  assembleMerchantFeed,
  FeedProduct,
} from '../utils/googleMerchantFeed';

const FEED_TTL_MS = 60 * 60 * 1000;
const FEED_SELECT =
  'name slug shortDescription description brand category images cloudinaryImage bunnyImage variants.price variants.compareAtPrice variants.stock variants.sku variants.size variants.weight variants.label variants.flavor variants.image basePrice compareAtPrice petType isFeatured inStock';

const DISK_CACHE_PATH =
  process.env.MERCHANT_FEED_CACHE_PATH ||
  path.join('/tmp', 'petshiwu-google-merchant-feed.xml');

let cachedFeed: { xml: string; builtAt: number } | null = null;
let inflightFeed: Promise<string> | null = null;

export const MERCHANT_FEED_CONTENT_TYPE = 'application/xml; charset=utf-8';

export function resetMerchantFeedCache(): void {
  cachedFeed = null;
  inflightFeed = null;
}

export function seedMerchantFeedCacheForTests(xml: string, builtAt = Date.now()): void {
  cachedFeed = { xml, builtAt };
}

export function isReusableMerchantFeed(xml: string): boolean {
  return Boolean(xml && xml.includes('<item>') && xml.includes('</rss>'));
}

export function applyMerchantFeedHeaders(res: Response): void {
  res.setHeader('Content-Type', MERCHANT_FEED_CONTENT_TYPE);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  // Merchant Center scheduled fetch treats X-Robots-Tag: noindex as a blocked
  // file and keeps Products at 0 with Last updated blank.
  res.removeHeader('X-Robots-Tag');
}

function readDiskCache(): { xml: string; builtAt: number } | null {
  try {
    const stat = fs.statSync(DISK_CACHE_PATH);
    const xml = fs.readFileSync(DISK_CACHE_PATH, 'utf8');
    if (!isReusableMerchantFeed(xml)) return null;
    return { xml, builtAt: stat.mtimeMs };
  } catch {
    return null;
  }
}

function writeDiskCache(xml: string): void {
  try {
    fs.writeFileSync(DISK_CACHE_PATH, xml, 'utf8');
  } catch (err) {
    logger.warn(
      'Merchant feed disk cache write failed (non-fatal):',
      err instanceof Error ? err.message : err
    );
  }
}

export function getCachedMerchantFeed(): { xml: string; builtAt: number } | null {
  if (cachedFeed && isReusableMerchantFeed(cachedFeed.xml)) return cachedFeed;
  const disk = readDiskCache();
  if (disk) {
    cachedFeed = disk;
    return disk;
  }
  return null;
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

export async function getMerchantFeedXml(
  builder: () => Promise<string> = buildMerchantFeedXml
): Promise<string> {
  const cached = getCachedMerchantFeed();
  if (cached && Date.now() - cached.builtAt < FEED_TTL_MS) {
    return cached.xml;
  }
  if (!inflightFeed) {
    inflightFeed = builder()
      .then((xml) => {
        if (!isReusableMerchantFeed(xml)) {
          throw new Error('Merchant feed build produced no items');
        }
        cachedFeed = { xml, builtAt: Date.now() };
        writeDiskCache(xml);
        return xml;
      })
      .finally(() => {
        inflightFeed = null;
      });
  }
  // Stale-while-revalidate: Google's midnight fetch must not wait on Mongo.
  if (cached) return cached.xml;
  return inflightFeed;
}

let refreshTimer: NodeJS.Timeout | null = null;

export function warmMerchantFeedCache(): void {
  getMerchantFeedXml().catch((err) => {
    logger.warn('Merchant feed warmup failed (non-fatal):', err instanceof Error ? err.message : err);
  });
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      getMerchantFeedXml().catch((err) => {
        logger.warn(
          'Merchant feed refresh failed (non-fatal):',
          err instanceof Error ? err.message : err
        );
      });
    }, FEED_TTL_MS);
    refreshTimer.unref?.();
  }
}

/**
 * GET /api/v1/feed/google  and  /feeds/google.xml
 * Google Merchant Center RSS 2.0 product feed for free listings /
 * Popular products in Search.
 *
 * Serve a complete cached document. A previous streaming/gzip write and
 * X-Robots-Tag: noindex made Merchant Center keep this file at 0 products.
 */
export const googleMerchantFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const xml = await getMerchantFeedXml();
    applyMerchantFeedHeaders(res);
    res.setHeader('Content-Length', Buffer.byteLength(xml, 'utf8'));
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
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
