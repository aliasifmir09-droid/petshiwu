import { Request, Response, NextFunction } from 'express';
import SearchHistory from '../models/SearchHistory';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

/**
 * Save search history
 * POST /api/search/history
 */
export const saveSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;
    const { query, filters, resultsCount } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Don't save if user is not authenticated and no session ID
    if (!userId && !sessionId) {
      return res.status(200).json({
        success: true,
        message: 'Search history not saved (no user or session)',
      });
    }

    const searchHistory = await SearchHistory.create({
      userId: userId || undefined,
      sessionId: userId ? undefined : sessionId,
      query: query.trim(),
      filters: filters || {},
      resultsCount: resultsCount || 0,
    });

    // Invalidate search history cache
    const cacheKey = userId ? `search_history:${userId}` : `search_history:${sessionId}`;
    await cache.del(cacheKey);

    res.status(201).json({
      success: true,
      data: searchHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search history for current user
 * GET /api/search/history
 */
export const getSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId && !sessionId) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Try to get from cache
    const cacheKey = userId ? `search_history:${userId}` : `search_history:${sessionId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    // Build query
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else {
      query.sessionId = sessionId;
    }

    const searchHistory = await SearchHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Cache for 5 minutes
    await cache.set(cacheKey, searchHistory, 300);

    res.status(200).json({
      success: true,
      data: searchHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete search history
 * DELETE /api/search/history/:id
 */
export const deleteSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;
    const { id } = req.params;

    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    } else {
      query.sessionId = sessionId;
    }

    const searchHistory = await SearchHistory.findOneAndDelete(query);

    if (!searchHistory) {
      return res.status(404).json({
        success: false,
        message: 'Search history not found',
      });
    }

    // Invalidate cache
    const cacheKey = userId ? `search_history:${userId}` : `search_history:${sessionId}`;
    await cache.del(cacheKey);

    res.status(200).json({
      success: true,
      message: 'Search history deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all search history for current user
 * DELETE /api/search/history
 */
export const clearSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User or session ID required',
      });
    }

    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else {
      query.sessionId = sessionId;
    }

    await SearchHistory.deleteMany(query);

    // Invalidate cache
    const cacheKey = userId ? `search_history:${userId}` : `search_history:${sessionId}`;
    await cache.del(cacheKey);

    res.status(200).json({
      success: true,
      message: 'Search history cleared',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track search result click
 * POST /api/search/history/:id/click
 */
export const trackSearchClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;
    const { id } = req.params;
    const { productId, position } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    } else {
      query.sessionId = sessionId;
    }

    const searchHistory = await SearchHistory.findOneAndUpdate(
      query,
      {
        $push: {
          clickedResults: {
            productId,
            position: position || 0,
            clickedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!searchHistory) {
      return res.status(404).json({
        success: false,
        message: 'Search history not found',
      });
    }

    // Invalidate cache
    const cacheKey = userId ? `search_history:${userId}` : `search_history:${sessionId}`;
    await cache.del(cacheKey);

    res.status(200).json({
      success: true,
      data: searchHistory,
    });
  } catch (error) {
    next(error);
  }
};

