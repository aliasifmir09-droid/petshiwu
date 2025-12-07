import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { extractObjectId } from '../utils/types';
import logger from '../utils/logger';

/**
 * Get products with low stock based on thresholds
 */
export const getLowStockProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId, globalThreshold } = req.query;

    // Default global threshold if not provided
    const defaultThreshold = globalThreshold ? parseInt(globalThreshold as string) : 10;

    let query: any = {
      isActive: true,
      totalStock: { $gt: 0 } // Only products with some stock
    };

    if (categoryId) {
      const categoryIdObj = extractObjectId(categoryId as string);
      if (categoryIdObj) {
        query.category = categoryIdObj;
      }
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .lean();

    // Filter products that are below their threshold
    const lowStockProducts = products
      .map(product => {
        const threshold = product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : defaultThreshold;

        return {
          ...product,
          threshold,
          isLowStock: product.totalStock <= threshold
        };
      })
      .filter(p => p.isLowStock)
      .sort((a, b) => a.totalStock - b.totalStock); // Sort by stock (lowest first)

    res.status(200).json({
      success: true,
      data: {
        products: lowStockProducts,
        count: lowStockProducts.length,
        defaultThreshold
      }
    });
  } catch (error: any) {
    logger.error('Error fetching low stock products:', error);
    next(error);
  }
};

/**
 * Update low stock threshold for a product
 */
export const updateProductThreshold = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { lowStockThreshold } = req.body;

    const productId = extractObjectId(id);
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold must be a positive number or null'
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { lowStockThreshold: lowStockThreshold === '' ? null : lowStockThreshold },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error: any) {
    logger.error('Error updating product threshold:', error);
    next(error);
  }
};

/**
 * Bulk update low stock thresholds
 */
export const bulkUpdateThresholds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productIds, lowStockThreshold, categoryId } = req.body;

    if (lowStockThreshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold is required'
      });
    }

    if (lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold must be a positive number or null'
      });
    }

    let query: any = {};

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const validIds = productIds
        .map(id => extractObjectId(id))
        .filter(id => id !== null) as any[];
      query._id = { $in: validIds };
    } else if (categoryId) {
      const categoryIdObj = extractObjectId(categoryId);
      if (categoryIdObj) {
        query.category = categoryIdObj;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either productIds or categoryId is required'
      });
    }

    const result = await Product.updateMany(
      query,
      { $set: { lowStockThreshold: lowStockThreshold === '' ? null : lowStockThreshold } }
    );

    res.status(200).json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        threshold: lowStockThreshold
      }
    });
  } catch (error: any) {
    logger.error('Error in bulk threshold update:', error);
    next(error);
  }
};

