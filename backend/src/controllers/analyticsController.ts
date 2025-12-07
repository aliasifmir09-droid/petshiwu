import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import logger from '../utils/logger';

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
    
    // 1. Customer Lifetime Value (CLV)
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
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          userId: '$_id',
          email: '$userInfo.email',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
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
    ]);

    // Calculate average CLV
    const avgCLV = customerLTV.length > 0
      ? customerLTV.reduce((sum, c) => sum + c.totalSpent, 0) / customerLTV.length
      : 0;

    // 2. Product Performance Metrics
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
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          productId: '$_id',
          productName: '$productInfo.name',
          productSlug: '$productInfo.slug',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          averagePrice: 1,
          currentStock: '$productInfo.totalStock',
          inStock: '$productInfo.inStock',
          conversionRate: {
            $cond: [
              { $gt: ['$productInfo.totalStock', 0] },
              { $divide: ['$totalSold', { $add: ['$productInfo.totalStock', '$totalSold'] }] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 50
      }
    ]);

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
    ]);

    // Calculate forecast for next 30 days
    const recentWeeks = salesForecast.slice(-4); // Last 4 weeks
    const avgWeeklyRevenue = recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + w.totalRevenue, 0) / recentWeeks.length
      : 0;
    const forecastedRevenue = avgWeeklyRevenue * 4.33; // ~4.33 weeks in a month

    // 4. Inventory Turnover
    const inventoryTurnover = await Product.aggregate([
      {
        $match: {
          isActive: true,
          totalStock: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $unwind: { path: '$orders', preserveNullAndEmptyArrays: true }
      },
      {
        $match: {
          'orders.paymentStatus': 'paid',
          'orders.createdAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$_id',
          productName: { $first: '$name' },
          currentStock: { $first: '$totalStock' },
          totalSold: {
            $sum: {
              $let: {
                vars: {
                  item: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$orders.items',
                          as: 'item',
                          cond: { $eq: ['$$item.product', '$_id'] }
                        }
                      },
                      0
                    ]
                  }
                },
                in: '$$item.quantity'
              }
            }
          }
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: 1,
          currentStock: 1,
          totalSold: { $ifNull: ['$totalSold', 0] },
          turnoverRate: {
            $cond: [
              { $gt: ['$currentStock', 0] },
              { $divide: [{ $ifNull: ['$totalSold', 0] }, '$currentStock'] },
              0
            ]
          },
          daysToSellOut: {
            $cond: [
              { $gt: [{ $ifNull: ['$totalSold', 0] }, 0] },
              { $divide: ['$currentStock', { $divide: [{ $ifNull: ['$totalSold', 0] }, days] }] },
              999
            ]
          }
        }
      },
      {
        $sort: { turnoverRate: -1 }
      },
      {
        $limit: 50
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        customerLifetimeValue: {
          topCustomers: customerLTV,
          averageCLV: avgCLV,
          totalCustomers: customerLTV.length
        },
        productPerformance: {
          topProducts: productPerformance,
          totalProducts: productPerformance.length
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
    });
  } catch (error: any) {
    logger.error('Error fetching advanced analytics:', error);
    next(error);
  }
};

