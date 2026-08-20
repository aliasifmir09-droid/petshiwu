import { Request, Response } from 'express';
import Product from '../models/Product';
import logger from '../utils/logger';
import {
  feedFooter,
  feedHeader,
  feedItemsForProduct,
  FeedProduct,
} from '../utils/googleMerchantFeed';

/**
 * GET /api/v1/feed/google  and  /feeds/google.xml
 * Google Merchant Center RSS 2.0 product feed for free listings /
 * Popular products in Search.
 */
export const googleMerchantFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.write(feedHeader());

    const cursor = Product.find({
      isActive: true,
      deletedAt: null,
    })
      .populate('category', 'name slug')
      .select('name slug description shortDescription brand category images cloudinaryImage variants basePrice compareAtPrice petType isFeatured inStock')
      .lean()
      .cursor();

    for await (const product of cursor) {
      res.write(feedItemsForProduct(product as FeedProduct));
    }

    res.write(feedFooter());
    res.end();
  } catch (err) {
    logger.error('Google merchant feed error:', err);
    if (!res.headersSent) {
      res.status(500).send('<?xml version="1.0"?><error>Feed generation failed</error>');
      return;
    }
    res.end();
  }
};
