import { Request, Response, NextFunction } from 'express';
import SearchHistory from '../models/SearchHistory';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';

/**
 * Get search analytics
 * GET /api/search/analytics
 * Admin only
 */
export const getSearchAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Get popular searches
    const popularSearchesPipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
          avgResultsCount: { $avg: '$resultsCount' },
          totalClicks: { $sum: { $size: { $ifNull: ['$clickedResults', []] } } },
        },
      },
      {
        $project: {
          query: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueSessions: { $size: '$uniqueSessions' },
          avgResultsCount: { $round: ['$avgResultsCount', 2] },
          totalClicks: 1,
          clickThroughRate: {
            $cond: {
              if: { $gt: ['$count', 0] },
              then: { $round: [{ $divide: ['$totalClicks', '$count'] }, 4] },
              else: 0,
            },
          },
        },
      },
      { $sort: { count: -1 as const } },
      { $limit: parseInt(limit as string) },
    ];

    // Get search trends (by day)
    const searchTrendsPipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueSessions: { $size: '$uniqueSessions' },
        },
      },
      { $sort: { date: 1 as const } },
    ];

    // Get zero-result searches (searches with no results)
    const zeroResultSearchesPipeline = [
      { $match: { ...dateFilter, resultsCount: 0 } },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 as const } },
      { $limit: parseInt(limit as string) },
    ];

    // Execute aggregations with caching
    const [popularSearches, searchTrends, zeroResultSearches] = await Promise.all([
      executeCachedAggregation(
        'searchhistories',
        popularSearchesPipeline,
        () => SearchHistory.aggregate(popularSearchesPipeline),
        300 // 5 minutes cache
      ),
      executeCachedAggregation(
        'searchhistories',
        searchTrendsPipeline,
        () => SearchHistory.aggregate(searchTrendsPipeline),
        300 // 5 minutes cache
      ),
      executeCachedAggregation(
        'searchhistories',
        zeroResultSearchesPipeline,
        () => SearchHistory.aggregate(zeroResultSearchesPipeline),
        300 // 5 minutes cache
      ),
    ]);

    // Get overall statistics
    const totalSearches = await SearchHistory.countDocuments(dateFilter);
    const totalUniqueQueries = await SearchHistory.distinct('query', dateFilter).then((queries) => queries.length);
    const totalUsers = await SearchHistory.distinct('userId', { ...dateFilter, userId: { $exists: true } }).then(
      (users) => users.length
    );
    const totalSessions = await SearchHistory.distinct('sessionId', dateFilter).then((sessions) => sessions.length);

    // Calculate average results per search
    const avgResultsPipeline = [
      { $match: { ...dateFilter, resultsCount: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgResults: { $avg: '$resultsCount' },
        },
      },
    ];
    const avgResultsData = await SearchHistory.aggregate(avgResultsPipeline);
    const avgResults = avgResultsData[0]?.avgResults || 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSearches,
          totalUniqueQueries,
          totalUsers,
          totalSessions,
          avgResultsPerSearch: Math.round(avgResults * 100) / 100,
        },
        popularSearches,
        searchTrends,
        zeroResultSearches,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions based on analytics
 * GET /api/search/suggestions
 */
export const getSearchSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get popular searches that match the query
    const suggestionsPipeline = [
      {
        $match: {
          query: { $regex: q, $options: 'i' },
        },
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 as const } },
      { $limit: limit },
    ];

    const suggestions = await executeCachedAggregation(
      'searchhistories',
      suggestionsPipeline,
      () => SearchHistory.aggregate(suggestionsPipeline),
      600 // 10 minutes cache
    );

    res.status(200).json({
      success: true,
      data: suggestions.map((s: any) => ({
        query: s._id,
        count: s.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

