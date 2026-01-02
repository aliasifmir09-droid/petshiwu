import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

// Get intelligent product recommendations
export const getProductRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit as string) || 8;

    // PERFORMANCE FIX: Cache recommendations for 5 minutes
    const cacheKey = `recommendations:${identifier}:${limit}:${userId || 'anonymous'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    // Get current product - try slug first, then ID
    let currentProduct = await Product.findOne({ slug: identifier, deletedAt: null })
      .populate('category')
      .lean();
    
    if (!currentProduct) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        currentProduct = await Product.findById(identifier)
          .populate('category')
          .lean();
      } catch (err) {
        // Invalid ObjectId, product not found
      }
    }

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productId = currentProduct._id.toString();

    const recommendations: any[] = [];
    const productIds = new Set<string>();

    // 1. "Customers who bought this also bought" - Based on order history
    if (userId) {
      try {
        const alsoBought = await Order.aggregate([
          // Find orders that contain the current product
          {
            $match: {
              'items.product': new mongoose.Types.ObjectId(productId),
              orderStatus: { $in: ['delivered', 'shipped'] }
            }
          },
          // Unwind items to get individual products
          { $unwind: '$items' },
          // Filter out the current product
          {
            $match: {
              'items.product': { $ne: new mongoose.Types.ObjectId(productId) }
            }
          },
          // Group by product and count occurrences
          {
            $group: {
              _id: '$items.product',
              count: { $sum: 1 },
              totalQuantity: { $sum: '$items.quantity' }
            }
          },
          // Sort by count (most frequently bought together)
          { $sort: { count: -1, totalQuantity: -1 } },
          // Limit results
          { $limit: limit }
        ], { allowDiskUse: true });

        if (alsoBought.length > 0) {
          const productIdsToFetch = alsoBought.map((item: any) => item._id);
          const products = await Product.find({
            _id: { $in: productIdsToFetch },
            isActive: true
          })
            .populate('category')
            .lean();

          // Sort products by the order from aggregation
          const sortedProducts = productIdsToFetch
            .map((id: any) => products.find((p: any) => p._id.toString() === id.toString()))
            .filter(Boolean);

          sortedProducts.forEach((product: any) => {
            if (product && !productIds.has(product._id.toString())) {
              recommendations.push({
                ...product,
                recommendationType: 'customers_also_bought',
                score: alsoBought.find((item: any) => item._id.toString() === product._id.toString())?.count || 0
              });
              productIds.add(product._id.toString());
            }
          });
        }
      } catch (error: any) {
        logger.error('Error getting "also bought" recommendations:', error.message);
      }
    }

    // 2. "Frequently bought together" - Products often purchased in same orders
    try {
      const frequentlyBoughtTogether = await Order.aggregate([
        // Find orders that contain the current product
        {
          $match: {
            'items.product': new mongoose.Types.ObjectId(productId),
            orderStatus: { $in: ['delivered', 'shipped'] }
          }
        },
        // Unwind items
        { $unwind: '$items' },
        // Filter out current product
        {
          $match: {
            'items.product': { $ne: new mongoose.Types.ObjectId(productId) }
          }
        },
        // Group by product
        {
          $group: {
            _id: '$items.product',
            orderCount: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        // Sort by order count
        { $sort: { orderCount: -1 } },
        // Limit
        { $limit: limit - recommendations.length }
      ]).allowDiskUse(true);

      if (frequentlyBoughtTogether.length > 0) {
        const productIdsToFetch = frequentlyBoughtTogether
          .map((item: any) => item._id)
          .filter((id: any) => !productIds.has(id.toString()));

        if (productIdsToFetch.length > 0) {
          const products = await Product.find({
            _id: { $in: productIdsToFetch },
            isActive: true
          })
            .populate('category')
            .lean();

          products.forEach((product: any) => {
            if (!productIds.has(product._id.toString())) {
              const match = frequentlyBoughtTogether.find(
                (item: any) => item._id.toString() === product._id.toString()
              );
              recommendations.push({
                ...product,
                recommendationType: 'frequently_bought_together',
                score: match?.orderCount || 0
              });
              productIds.add(product._id.toString());
            }
          });
        }
      }
    } catch (error: any) {
      logger.error('Error getting "frequently bought together" recommendations:', error.message);
    }

    // 3. Personalized recommendations based on user's purchase history
    if (userId && recommendations.length < limit) {
      try {
        const userOrders = await Order.find({
          user: userId,
          orderStatus: { $in: ['delivered', 'shipped'] }
        }).lean();

        if (userOrders.length > 0) {
          // Get all products user has purchased
          const purchasedProductIds = new Set<string>();
          userOrders.forEach((order: any) => {
            order.items.forEach((item: any) => {
              if (item.product && item.product.toString() !== productId) {
                purchasedProductIds.add(item.product.toString());
              }
            });
          });

          if (purchasedProductIds.size > 0) {
            // Find products in same categories as user's purchases
            const userProducts = await Product.find({
              _id: { $in: Array.from(purchasedProductIds) },
              isActive: true
            })
              .select('category petType brand')
              .lean();

            const userCategories = new Set(
              userProducts.map((p: any) => p.category?.toString()).filter(Boolean)
            );
            const userPetTypes = new Set(
              userProducts.map((p: any) => p.petType).filter(Boolean)
            );
            const userBrands = new Set(
              userProducts.map((p: any) => p.brand).filter(Boolean)
            );

            // Find similar products
            const similarProducts = await Product.find({
              _id: { $ne: productId, $nin: Array.from(productIds).map(id => new mongoose.Types.ObjectId(id)) },
              isActive: true,
              $or: [
                { category: { $in: Array.from(userCategories).map(id => new mongoose.Types.ObjectId(id)) } },
                { petType: { $in: Array.from(userPetTypes) } },
                { brand: { $in: Array.from(userBrands) } }
              ]
            })
              .populate('category')
              .sort({ averageRating: -1, totalReviews: -1 })
              .limit(limit - recommendations.length)
              .lean();

            similarProducts.forEach((product: any) => {
              if (!productIds.has(product._id.toString())) {
                recommendations.push({
                  ...product,
                  recommendationType: 'personalized',
                  score: 0
                });
                productIds.add(product._id.toString());
              }
            });
          }
        }
      } catch (error: any) {
        logger.error('Error getting personalized recommendations:', error.message);
      }
    }

    // 4. "You may also like" - Based on category, petType, brand, tags
    if (recommendations.length < limit) {
      try {
        const similarProducts = await Product.find({
          _id: { $ne: productId, $nin: Array.from(productIds).map(id => new mongoose.Types.ObjectId(id)) },
          isActive: true,
          $or: [
            { category: currentProduct.category },
            { petType: currentProduct.petType },
            { brand: currentProduct.brand },
            { tags: { $in: currentProduct.tags || [] } }
          ]
        })
          .populate('category')
          .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
          .limit(limit - recommendations.length)
          .lean();

        similarProducts.forEach((product: any) => {
          if (!productIds.has(product._id.toString())) {
            recommendations.push({
              ...product,
              recommendationType: 'you_may_also_like',
              score: 0
            });
            productIds.add(product._id.toString());
          }
        });
      } catch (error: any) {
        logger.error('Error getting "you may also like" recommendations:', error.message);
      }
    }

    // Sort by recommendation type priority and score
    const typePriority: { [key: string]: number } = {
      customers_also_bought: 4,
      frequently_bought_together: 3,
      personalized: 2,
      you_may_also_like: 1
    };

    recommendations.sort((a, b) => {
      const priorityDiff = (typePriority[b.recommendationType] || 0) - (typePriority[a.recommendationType] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.score || 0) - (a.score || 0);
    });

    // Limit final results
    const finalRecommendations = recommendations.slice(0, limit);

    const response = {
      success: true,
      data: finalRecommendations,
      meta: {
        total: finalRecommendations.length,
        types: {
          customers_also_bought: finalRecommendations.filter(r => r.recommendationType === 'customers_also_bought').length,
          frequently_bought_together: finalRecommendations.filter(r => r.recommendationType === 'frequently_bought_together').length,
          personalized: finalRecommendations.filter(r => r.recommendationType === 'personalized').length,
          you_may_also_like: finalRecommendations.filter(r => r.recommendationType === 'you_may_also_like').length
        }
      }
    };

    // Cache for 5 minutes (300 seconds)
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get "Frequently Bought Together" for a product
export const getFrequentlyBoughtTogether = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const limit = parseInt(req.query.limit as string) || 4;

    // PERFORMANCE FIX: Cache frequently bought together for 5 minutes
    const cacheKey = `frequently-bought:${identifier}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    // Get current product - try slug first, then ID
    let currentProduct = await Product.findOne({ slug: identifier, deletedAt: null }).lean();
    
    if (!currentProduct) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        currentProduct = await Product.findById(identifier).lean();
      } catch (err) {
        // Invalid ObjectId, product not found
      }
    }

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productId = currentProduct._id.toString();

    const frequentlyBought = await Order.aggregate([
      {
        $match: {
          'items.product': new mongoose.Types.ObjectId(productId),
          orderStatus: { $in: ['delivered', 'shipped'] }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.product': { $ne: new mongoose.Types.ObjectId(productId) }
        }
      },
      {
        $group: {
          _id: '$items.product',
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { orderCount: -1, totalQuantity: -1 } },
      { $limit: limit }
    ]).allowDiskUse(true);

    if (frequentlyBought.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No frequently bought together products found'
      });
    }

    const productIds = frequentlyBought.map((item: any) => item._id);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    })
      .populate('category')
      .lean();

    // Sort by aggregation order
    const sortedProducts = productIds
      .map((id: any) => {
        const product = products.find((p: any) => p._id.toString() === id.toString());
        const match = frequentlyBought.find((item: any) => item._id.toString() === id.toString());
        return product ? { ...product, orderCount: match?.orderCount || 0 } : null;
      })
      .filter(Boolean);

    const response = {
      success: true,
      data: sortedProducts
    };

    // Cache for 5 minutes (300 seconds)
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

