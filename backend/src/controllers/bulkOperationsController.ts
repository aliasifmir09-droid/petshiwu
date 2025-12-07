import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';
import { extractObjectId } from '../utils/types';

/**
 * Bulk update products
 * Supports: price updates, stock updates, category assignment, activation/deactivation
 */
export const bulkUpdateProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Validate product IDs
    const validProductIds = productIds
      .map(id => extractObjectId(id))
      .filter(id => id !== null) as mongoose.Types.ObjectId[];

    if (validProductIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product IDs provided'
      });
    }

    // Build update object (only allow specific fields)
    const allowedFields = [
      'category',
      'petType',
      'isActive',
      'isFeatured',
      'inStock',
      'basePrice',
      'compareAtPrice',
      'totalStock'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Validate category if provided
    if (updateData.category) {
      const categoryId = extractObjectId(updateData.category);
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      updateData.category = categoryId;
    }

    // Perform bulk update
    const result = await Product.updateMany(
      { _id: { $in: validProductIds } },
      { $set: updateData }
    );

    // Invalidate cache for updated products
    for (const productId of validProductIds) {
      await cache.del(cacheKeys.product(productId.toString()));
    }
    await cache.delPattern('products:*');

    logger.info(`Bulk updated ${result.modifiedCount} products`);

    res.status(200).json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        productIds: validProductIds.map(id => id.toString())
      }
    });
  } catch (error: any) {
    logger.error('Error in bulk product update:', error);
    next(error);
  }
};

/**
 * Bulk assign category to products
 */
export const bulkAssignCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productIds, categoryId } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const validCategoryId = extractObjectId(categoryId);
    if (!validCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Verify category exists
    const category = await Category.findById(validCategoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate product IDs
    const validProductIds = productIds
      .map(id => extractObjectId(id))
      .filter(id => id !== null) as mongoose.Types.ObjectId[];

    if (validProductIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product IDs provided'
      });
    }

    // Perform bulk update
    const result = await Product.updateMany(
      { _id: { $in: validProductIds } },
      { $set: { category: validCategoryId } }
    );

    // Invalidate cache
    for (const productId of validProductIds) {
      await cache.del(cacheKeys.product(productId.toString()));
    }
    await cache.delPattern('products:*');

    logger.info(`Bulk assigned category to ${result.modifiedCount} products`);

    res.status(200).json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        categoryId: validCategoryId.toString(),
        categoryName: category.name,
        productIds: validProductIds.map(id => id.toString())
      }
    });
  } catch (error: any) {
    logger.error('Error in bulk category assignment:', error);
    next(error);
  }
};

