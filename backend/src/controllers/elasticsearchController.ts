import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import {
  getElasticsearchClient,
  isElasticsearchAvailable,
  createProductsIndex,
  deleteProductsIndex,
  bulkIndexProducts,
  indexProduct,
  removeProductFromIndex,
  PRODUCTS_INDEX
} from '../utils/elasticsearch';
import logger from '../utils/logger';

/**
 * Reindex all products
 * POST /api/elasticsearch/reindex
 */
export const reindexAllProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isElasticsearchAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Elasticsearch is not available'
      });
    }

    // Create index if it doesn't exist
    await createProductsIndex();

    // Fetch all active products
    const products = await Product.find({
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    })
      .populate('category', 'name slug petType')
      .lean();

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products to index',
        indexed: 0
      });
    }

    // Bulk index products
    const success = await bulkIndexProducts(products);

    if (success) {
      res.status(200).json({
        success: true,
        message: `Successfully indexed ${products.length} products`,
        indexed: products.length
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to index some products. Check logs for details.'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get Elasticsearch status
 * GET /api/elasticsearch/status
 */
export const getElasticsearchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const available = isElasticsearchAvailable();
    const client = getElasticsearchClient();

    if (!available || !client) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Elasticsearch is not configured or unavailable'
      });
    }

    try {
      // Check cluster health
      const health = await client.cluster.health();
      const indexExists = await client.indices.exists({ index: PRODUCTS_INDEX });

      res.status(200).json({
        success: true,
        available: true,
        cluster: {
          status: health.status,
          numberOfNodes: health.number_of_nodes
        },
        index: {
          exists: indexExists,
          name: PRODUCTS_INDEX
        }
      });
    } catch (error: any) {
      res.status(200).json({
        success: true,
        available: false,
        message: `Elasticsearch connection error: ${error.message}`
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete and recreate index
 * POST /api/elasticsearch/reset-index
 */
export const resetIndex = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isElasticsearchAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Elasticsearch is not available'
      });
    }

    // Delete existing index
    await deleteProductsIndex();

    // Create new index
    const created = await createProductsIndex();

    if (created) {
      res.status(200).json({
        success: true,
        message: 'Index reset successfully. Use /reindex to populate it.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to reset index'
      });
    }
  } catch (error) {
    next(error);
  }
};

