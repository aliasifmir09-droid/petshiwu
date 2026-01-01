import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
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

interface ReorderSuggestion {
  productId: string;
  productName: string;
  productSlug: string;
  brand: string;
  currentStock: number;
  lowStockThreshold: number | null;
  averageDailySales: number;
  averageWeeklySales: number;
  averageMonthlySales: number;
  salesVelocity: number; // Units per day
  reorderPoint: number;
  suggestedReorderQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockout: number | null;
  lastOrderDate: Date | null;
  totalUnitsSold: number;
}

/**
 * Calculate sales velocity and reorder suggestions for products
 * GET /api/reorder-suggestions
 * Admin only
 */
export const getReorderSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { 
      days = 90, // Default: analyze last 90 days
      leadTimeDays = 7, // Default: 7 days lead time for restocking
      safetyStockDays = 3, // Default: 3 days of safety stock
      minSalesForSuggestion = 1, // Minimum sales to generate suggestion
      includeInStock = false, // Include products that are in stock
    } = req.query;

    const analysisDays = parseInt(days as string) || 90;
    const leadTime = parseInt(leadTimeDays as string) || 7;
    const safetyStock = parseInt(safetyStockDays as string) || 3;
    const minSales = parseInt(minSalesForSuggestion as string) || 1;
    const includeInStockProducts = includeInStock === 'true';

    // Build cache key
    const cacheKey = `reorder_suggestions:${analysisDays}:${leadTime}:${safetyStock}:${minSales}:${includeInStockProducts}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - analysisDays);

    // Get all products that are active and not deleted
    const products = await Product.find({
      isActive: true,
      deletedAt: null,
    })
      .select('_id name slug brand totalStock lowStockThreshold')
      .lean();

    // Get sales data for all products in the date range
    const salesDataPipeline: any[] = [
      {
        $match: {
          orderStatus: { $in: ['delivered', 'shipped'] }, // Only count fulfilled orders
          paymentStatus: 'paid', // Only count paid orders
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.product',
          totalUnitsSold: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ];

    const salesData = await executeCachedAggregation<any[]>(
      'orders',
      salesDataPipeline,
      () => Order.aggregate(salesDataPipeline),
      300, // 5 minutes cache
      JSON.stringify({ startDate, endDate })
    );

    // Create a map for quick lookup
    const salesMap = new Map();
    ((salesData as any[]) || []).forEach((item: any) => {
      salesMap.set(item._id.toString(), {
        totalUnitsSold: item.totalUnitsSold || 0,
        orderCount: item.orderCount || 0,
        lastOrderDate: item.lastOrderDate || null,
      });
    });

    // Calculate suggestions for each product
    const suggestions: ReorderSuggestion[] = [];

    for (const product of products) {
      const productId = product._id.toString();
      const sales = salesMap.get(productId) || {
        totalUnitsSold: 0,
        orderCount: 0,
        lastOrderDate: null,
      };

      // Skip if no sales and not including in-stock products
      if (sales.totalUnitsSold < minSales && !includeInStockProducts) {
        continue;
      }

      const currentStock = product.totalStock || 0;
      const lowStockThreshold = product.lowStockThreshold || null;

      // Calculate sales velocity (units per day)
      const averageDailySales = sales.totalUnitsSold / analysisDays;
      const averageWeeklySales = averageDailySales * 7;
      const averageMonthlySales = averageDailySales * 30;

      // Calculate reorder point
      // Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
      const reorderPoint = Math.ceil((averageDailySales * leadTime) + (averageDailySales * safetyStock));

      // Calculate days until stockout
      let daysUntilStockout: number | null = null;
      if (averageDailySales > 0) {
        daysUntilStockout = Math.floor(currentStock / averageDailySales);
      }

      // Determine urgency
      let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (currentStock <= 0) {
        urgency = 'critical';
      } else if (lowStockThreshold && currentStock <= lowStockThreshold) {
        urgency = 'critical';
      } else if (daysUntilStockout !== null && daysUntilStockout <= leadTime) {
        urgency = 'critical';
      } else if (daysUntilStockout !== null && daysUntilStockout <= leadTime + safetyStock) {
        urgency = 'high';
      } else if (currentStock <= reorderPoint) {
        urgency = 'medium';
      }

      // Calculate suggested reorder quantity
      // Suggested Quantity = Reorder Point - Current Stock + Buffer
      // Buffer = Average Daily Sales × Lead Time (to cover during restocking)
      let suggestedReorderQuantity = 0;
      if (currentStock < reorderPoint) {
        const buffer = Math.ceil(averageDailySales * leadTime);
        suggestedReorderQuantity = reorderPoint - currentStock + buffer;
        // Ensure minimum order quantity
        suggestedReorderQuantity = Math.max(suggestedReorderQuantity, Math.ceil(averageDailySales * leadTime));
      } else if (includeInStockProducts && sales.totalUnitsSold >= minSales) {
        // For in-stock products, suggest maintaining stock at reorder point level
        suggestedReorderQuantity = 0; // No reorder needed, but include in suggestions
      }

      // Only include products that need reordering or meet criteria
      if (suggestedReorderQuantity > 0 || (includeInStockProducts && sales.totalUnitsSold >= minSales)) {
        suggestions.push({
          productId,
          productName: product.name,
          productSlug: product.slug,
          brand: product.brand,
          currentStock,
          lowStockThreshold,
          averageDailySales: Math.round(averageDailySales * 100) / 100, // Round to 2 decimals
          averageWeeklySales: Math.round(averageWeeklySales * 100) / 100,
          averageMonthlySales: Math.round(averageMonthlySales * 100) / 100,
          salesVelocity: Math.round(averageDailySales * 100) / 100,
          reorderPoint,
          suggestedReorderQuantity: Math.max(0, suggestedReorderQuantity),
          urgency,
          daysUntilStockout,
          lastOrderDate: sales.lastOrderDate,
          totalUnitsSold: sales.totalUnitsSold,
        });
      }
    }

    // Sort by urgency (critical first) and then by suggested quantity
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.suggestedReorderQuantity - a.suggestedReorderQuantity;
    });

    const response = {
      success: true,
      data: suggestions,
      meta: {
        analysisDays,
        leadTimeDays: leadTime,
        safetyStockDays: safetyStock,
        minSalesForSuggestion: minSales,
        includeInStock: includeInStockProducts,
        totalSuggestions: suggestions.length,
        criticalCount: suggestions.filter(s => s.urgency === 'critical').length,
        highCount: suggestions.filter(s => s.urgency === 'high').length,
        mediumCount: suggestions.filter(s => s.urgency === 'medium').length,
        lowCount: suggestions.filter(s => s.urgency === 'low').length,
      },
    };

    // Cache for 15 minutes (reorder suggestions change slowly)
    await cache.set(cacheKey, response, 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get reorder suggestions for a specific product
 * GET /api/reorder-suggestions/:productId
 * Admin only
 */
export const getProductReorderSuggestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { productId } = req.params;
    const { 
      days = 90,
      leadTimeDays = 7,
      safetyStockDays = 3,
    } = req.query;

    const analysisDays = parseInt(days as string) || 90;
    const leadTime = parseInt(leadTimeDays as string) || 7;
    const safetyStock = parseInt(safetyStockDays as string) || 3;

    // Get product
    const product = await Product.findById(productId)
      .select('_id name slug brand totalStock lowStockThreshold')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - analysisDays);

    // Get sales data for this product
    const salesDataPipeline = [
      {
        $match: {
          orderStatus: { $in: ['delivered', 'shipped'] },
          paymentStatus: 'paid',
          'items.product': new mongoose.Types.ObjectId(productId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $match: {
          'items.product': new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: '$items.product',
          totalUnitsSold: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ];

    const salesData = await Order.aggregate(salesDataPipeline);
    const sales = salesData[0] || {
      totalUnitsSold: 0,
      orderCount: 0,
      lastOrderDate: null,
    };

    const currentStock = product.totalStock || 0;
    const lowStockThreshold = product.lowStockThreshold || null;

    // Calculate sales velocity
    const averageDailySales = sales.totalUnitsSold / analysisDays;
    const averageWeeklySales = averageDailySales * 7;
    const averageMonthlySales = averageDailySales * 30;

    // Calculate reorder point
    const reorderPoint = Math.ceil((averageDailySales * leadTime) + (averageDailySales * safetyStock));

    // Calculate days until stockout
    let daysUntilStockout: number | null = null;
    if (averageDailySales > 0) {
      daysUntilStockout = Math.floor(currentStock / averageDailySales);
    }

    // Determine urgency
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (currentStock <= 0) {
      urgency = 'critical';
    } else if (lowStockThreshold && currentStock <= lowStockThreshold) {
      urgency = 'critical';
    } else if (daysUntilStockout !== null && daysUntilStockout <= leadTime) {
      urgency = 'critical';
    } else if (daysUntilStockout !== null && daysUntilStockout <= leadTime + safetyStock) {
      urgency = 'high';
    } else if (currentStock <= reorderPoint) {
      urgency = 'medium';
    }

    // Calculate suggested reorder quantity
    let suggestedReorderQuantity = 0;
    if (currentStock < reorderPoint) {
      const buffer = Math.ceil(averageDailySales * leadTime);
      suggestedReorderQuantity = reorderPoint - currentStock + buffer;
      suggestedReorderQuantity = Math.max(suggestedReorderQuantity, Math.ceil(averageDailySales * leadTime));
    }

    const suggestion: ReorderSuggestion = {
      productId: product._id.toString(),
      productName: product.name,
      productSlug: product.slug,
      brand: product.brand,
      currentStock,
      lowStockThreshold,
      averageDailySales: Math.round(averageDailySales * 100) / 100,
      averageWeeklySales: Math.round(averageWeeklySales * 100) / 100,
      averageMonthlySales: Math.round(averageMonthlySales * 100) / 100,
      salesVelocity: Math.round(averageDailySales * 100) / 100,
      reorderPoint,
      suggestedReorderQuantity: Math.max(0, suggestedReorderQuantity),
      urgency,
      daysUntilStockout,
      lastOrderDate: sales.lastOrderDate,
      totalUnitsSold: sales.totalUnitsSold,
    };

    res.status(200).json({
      success: true,
      data: suggestion,
      meta: {
        analysisDays,
        leadTimeDays: leadTime,
        safetyStockDays: safetyStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

