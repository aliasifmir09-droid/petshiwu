import { Request, Response, NextFunction } from 'express';
import RecommendationClick from '../models/RecommendationClick';
import Product from '../models/Product';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';
import { cache } from '../utils/cache';

interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email?: string;
    role?: string;
  };
}

/**
 * Track recommendation click
 * POST /api/recommendations/track
 */
export const trackRecommendationClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?._id;
    const sessionId = (req as any).sessionID || (req.headers['x-session-id'] as string);
    const { productId, sourceProductId, recommendationType, position } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    if (!recommendationType) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation type is required',
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate source product if provided
    if (sourceProductId) {
      const sourceProduct = await Product.findById(sourceProductId);
      if (!sourceProduct) {
        return res.status(404).json({
          success: false,
          message: 'Source product not found',
        });
      }
    }

    // Don't require user or session - allow anonymous tracking
    const recommendationClick = await RecommendationClick.create({
      userId: userId || undefined,
      sessionId: userId ? undefined : sessionId,
      productId,
      sourceProductId: sourceProductId || undefined,
      recommendationType,
      position: position || 0,
      clickedAt: new Date(),
    });

    // Invalidate analytics cache
    await cache.del('recommendation_analytics:*');

    res.status(201).json({
      success: true,
      data: recommendationClick,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommendation analytics
 * GET /api/recommendations/analytics
 * Admin only
 */
export const getRecommendationAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { startDate, endDate, recommendationType, limit = 20 } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) {
        dateFilter.clickedAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.clickedAt.$lte = new Date(endDate as string);
      }
    }

    if (recommendationType) {
      dateFilter.recommendationType = recommendationType;
    }

    // Get click-through rates by recommendation type
    const clickThroughRatePipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$recommendationType',
          totalClicks: { $sum: 1 },
          uniqueProducts: { $addToSet: '$productId' },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
          avgPosition: { $avg: '$position' },
        },
      },
      {
        $project: {
          recommendationType: '$_id',
          totalClicks: 1,
          uniqueProductsCount: { $size: '$uniqueProducts' },
          uniqueUsersCount: { $size: { $filter: { input: '$uniqueUsers', as: 'user', cond: { $ne: ['$$user', null] } } } },
          uniqueSessionsCount: { $size: { $filter: { input: '$uniqueSessions', as: 'session', cond: { $ne: ['$$session', null] } } } },
          avgPosition: { $round: ['$avgPosition', 2] },
        },
      },
      { $sort: { totalClicks: -1 } },
    ];

    const clickThroughRates = await executeCachedAggregation<any[]>(
      'recommendationclicks',
      clickThroughRatePipeline,
      () => RecommendationClick.aggregate(clickThroughRatePipeline),
      300, // 5 minutes cache
      JSON.stringify(dateFilter)
    );

    // Get most clicked products
    const mostClickedProductsPipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$productId',
          totalClicks: { $sum: 1 },
          recommendationTypes: { $addToSet: '$recommendationType' },
          avgPosition: { $avg: '$position' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productSlug: '$product.slug',
          totalClicks: 1,
          recommendationTypes: 1,
          avgPosition: { $round: ['$avgPosition', 2] },
        },
      },
      { $sort: { totalClicks: -1 } },
      { $limit: parseInt(limit as string) || 20 },
    ];

    const mostClickedProducts = await executeCachedAggregation<any[]>(
      'recommendationclicks',
      mostClickedProductsPipeline,
      () => RecommendationClick.aggregate(mostClickedProductsPipeline),
      300, // 5 minutes cache
      JSON.stringify(dateFilter)
    );

    // Get clicks by position
    const clicksByPositionPipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$position',
          totalClicks: { $sum: 1 },
        },
      },
      {
        $project: {
          position: '$_id',
          totalClicks: 1,
        },
      },
      { $sort: { position: 1 } },
    ];

    const clicksByPosition = await executeCachedAggregation<any[]>(
      'recommendationclicks',
      clicksByPositionPipeline,
      () => RecommendationClick.aggregate(clicksByPositionPipeline),
      300, // 5 minutes cache
      JSON.stringify(dateFilter)
    );

    // Get overall statistics
    const overallStatsPipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          uniqueProducts: { $addToSet: '$productId' },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          totalClicks: 1,
          uniqueProductsCount: { $size: '$uniqueProducts' },
          uniqueUsersCount: { $size: { $filter: { input: '$uniqueUsers', as: 'user', cond: { $ne: ['$$user', null] } } } },
          uniqueSessionsCount: { $size: { $filter: { input: '$uniqueSessions', as: 'session', cond: { $ne: ['$$session', null] } } } },
        },
      },
    ];

    const overallStats = await executeCachedAggregation<any[]>(
      'recommendationclicks',
      overallStatsPipeline,
      () => RecommendationClick.aggregate(overallStatsPipeline),
      300, // 5 minutes cache
      JSON.stringify(dateFilter)
    );

    const response = {
      success: true,
      data: {
        clickThroughRates: (clickThroughRates || []) as any[],
        mostClickedProducts: (mostClickedProducts || []) as any[],
        clicksByPosition: (clicksByPosition || []) as any[],
        overallStats: (Array.isArray(overallStats) && overallStats.length > 0) ? overallStats[0] : {
          totalClicks: 0,
          uniqueProductsCount: 0,
          uniqueUsersCount: 0,
          uniqueSessionsCount: 0,
        },
      },
      meta: {
        startDate: startDate || null,
        endDate: endDate || null,
        recommendationType: recommendationType || null,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

