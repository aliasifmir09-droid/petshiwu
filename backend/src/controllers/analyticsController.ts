import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

/**
 * Get advanced analytics including:
 * - Customer lifetime value
 * - Product performance metrics
 * - Sales forecasting
 * - Inventory turnover
 */
export const getAdvancedAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate period in days
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // PERFORMANCE FIX: Cache analytics for 5 minutes since they're expensive to compute
    const cacheKey = `analytics:advanced:${period}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }
    
    // 1. Customer Lifetime Value (CLV) - Optimized: removed $lookup, fetch user data separately if needed
    const customerLTV = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          userId: '$_id',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1,
          firstOrderDate: 1,
          lastOrderDate: 1,
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrderDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 100
      }
    ]).allowDiskUse(true);

    // Calculate average CLV
    const avgCLV = customerLTV.length > 0
      ? customerLTV.reduce((sum, c) => sum + c.totalSpent, 0) / customerLTV.length
      : 0;

    // 2. Product Performance Metrics - Optimized: fetch product info separately to avoid expensive $lookup
    const productPerformance = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $project: {
          productId: '$_id',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          averagePrice: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 50
      }
    ]).allowDiskUse(true);
    
    // PERFORMANCE FIX: Fetch product info separately for top products only (much faster)
    const topProductIds = productPerformance.slice(0, 50).map((p: any) => p.productId);
    const productInfoMap = new Map();
    if (topProductIds.length > 0) {
      const products = await Product.find({ _id: { $in: topProductIds } })
        .select('name slug totalStock inStock')
        .lean();
      products.forEach((p: any) => {
        productInfoMap.set(p._id.toString(), p);
      });
    }
    
    // Attach product info to performance data
    const enrichedProductPerformance = productPerformance.map((p: any) => {
      const productInfo = productInfoMap.get(p.productId?.toString());
      return {
        ...p,
        productName: productInfo?.name || 'Unknown',
        productSlug: productInfo?.slug || '',
        currentStock: productInfo?.totalStock || 0,
        inStock: productInfo?.inStock || false,
        conversionRate: productInfo?.totalStock > 0
          ? p.totalSold / (productInfo.totalStock + p.totalSold)
          : 0
      };
    });

    // 3. Sales Forecasting (Simple linear regression based on recent trends)
    const salesForecast = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 }
      }
    ]).allowDiskUse(true);

    // Calculate forecast for next 30 days
    const recentWeeks = salesForecast.slice(-4); // Last 4 weeks
    const avgWeeklyRevenue = recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + w.totalRevenue, 0) / recentWeeks.length
      : 0;
    const forecastedRevenue = avgWeeklyRevenue * 4.33; // ~4.33 weeks in a month

    // 4. Inventory Turnover - PERFORMANCE FIX: Optimized to avoid expensive $lookup
    // First, get product sales from orders (more efficient)
    const productSales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' }
        }
      }
    ]).allowDiskUse(true);
    
    const salesMap = new Map();
    productSales.forEach((sale: any) => {
      salesMap.set(sale._id?.toString(), sale.totalSold);
    });
    
    // Then get products and calculate turnover
    const products = await Product.find({
      isActive: true,
      totalStock: { $gt: 0 }
    })
      .select('name totalStock')
      .limit(50)
      .lean();
    
    const inventoryTurnover = products.map((product: any) => {
      const totalSold = salesMap.get(product._id.toString()) || 0;
      const turnoverRate = product.totalStock > 0 ? totalSold / product.totalStock : 0;
      const daysToSellOut = totalSold > 0 ? product.totalStock / (totalSold / days) : 999;
      
      return {
        productId: product._id,
        productName: product.name,
        currentStock: product.totalStock,
        totalSold,
        turnoverRate,
        daysToSellOut
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 50);

    const response = {
      success: true,
      data: {
        period,
        customerLifetimeValue: {
          topCustomers: customerLTV,
          averageCLV: avgCLV,
          totalCustomers: customerLTV.length
        },
        productPerformance: {
          topProducts: enrichedProductPerformance,
          totalProducts: enrichedProductPerformance.length
        },
        salesForecast: {
          historical: salesForecast,
          forecastedRevenue30Days: forecastedRevenue,
          forecastedOrders30Days: Math.round(forecastedRevenue / (salesForecast.length > 0 ? salesForecast[salesForecast.length - 1].averageOrderValue : 50)),
          trend: recentWeeks.length >= 2
            ? ((recentWeeks[recentWeeks.length - 1].totalRevenue - recentWeeks[0].totalRevenue) / recentWeeks[0].totalRevenue) * 100
            : 0
        },
        inventoryTurnover: {
          products: inventoryTurnover,
          averageTurnoverRate: inventoryTurnover.length > 0
            ? inventoryTurnover.reduce((sum, p) => sum + p.turnoverRate, 0) / inventoryTurnover.length
            : 0,
          slowMovingProducts: inventoryTurnover.filter(p => p.turnoverRate < 0.1).length
        }
      }
    };
    
    // Cache for 5 minutes (300 seconds)
    await cache.set(cacheKey, response, 300);
    
    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Error fetching advanced analytics:', error);
    next(error);
  }
};

