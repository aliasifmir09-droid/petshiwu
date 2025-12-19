import { Request, Response, NextFunction } from 'express';
import CareGuide from '../models/CareGuide';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';

// Helper to normalize care guide _id to string
const normalizeCareGuideId = (guide: any): any => {
  if (!guide) return guide;
  
  const plainGuide = guide.toObject ? guide.toObject() : guide;
  
  return {
    ...plainGuide,
    _id: plainGuide._id ? String(plainGuide._id) : plainGuide._id,
    author: plainGuide.author && typeof plainGuide.author === 'object' && plainGuide.author._id
      ? {
          _id: String(plainGuide.author._id),
          name: plainGuide.author.firstName && plainGuide.author.lastName
            ? `${plainGuide.author.firstName} ${plainGuide.author.lastName}`
            : plainGuide.author.email,
          email: plainGuide.author.email
        }
      : plainGuide.author
  };
};

// Get all published care guides with filters
export const getPublishedCareGuides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const petType = req.query.petType as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const difficulty = req.query.difficulty as string;

    // Build cache key
    const cacheKey = `careGuides:${page}:${limit}:${petType || 'all'}:${category || 'all'}:${search || 'none'}:${difficulty || 'all'}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    // Build query
    const query: any = {
      isPublished: true,
      $or: [
        { publishedAt: { $lte: new Date() } },
        { publishedAt: { $exists: false } }
      ]
    };

    if (petType && petType !== 'all') {
      query.petType = petType.toLowerCase();
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Get total count
    const total = await CareGuide.countDocuments(query);

    // Get care guides
    let guides = await CareGuide.find(query)
      .populate('author', 'firstName lastName email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Normalize IDs
    const normalizedGuides = guides.map(normalizeCareGuideId);

    const response = {
      success: true,
      data: normalizedGuides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get single care guide by slug
export const getCareGuideBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    // Try cache first
    const cacheKey = cacheKeys.careGuide(slug);
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      // Increment views (async, don't wait)
      CareGuide.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec().catch(() => {});
      return res.status(200).json(cached);
    }

    const guide = await CareGuide.findOne({ slug, isPublished: true })
      .populate('author', 'firstName lastName email')
      .populate('relatedProducts', 'name slug images basePrice inStock')
      .lean();

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Care guide not found'
      });
    }

    // Increment views
    await CareGuide.findByIdAndUpdate(guide._id, { $inc: { views: 1 } });

    const normalizedGuide = normalizeCareGuideId(guide);

    const response = {
      success: true,
      data: normalizedGuide
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, response, 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get care guide categories
export const getCareGuideCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const petType = req.query.petType as string;

    // Try cache first
    const cacheKey = `careGuideCategories:${petType || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    const query: any = { isPublished: true };
    if (petType && petType !== 'all') {
      query.petType = petType.toLowerCase();
    }

    const categories = await CareGuide.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    const response = {
      success: true,
      data: categories
    };

    // Cache for 1 hour
    await cache.set(cacheKey, response, 3600);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all care guides (published and unpublished)
export const getAllCareGuidesAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const petType = req.query.petType as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const isPublished = req.query.isPublished as string;

    const query: any = {};

    if (petType && petType !== 'all') {
      query.petType = petType.toLowerCase();
    }

    if (category) {
      query.category = category;
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const total = await CareGuide.countDocuments(query);

    const guides = await CareGuide.find(query)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const normalizedGuides = guides.map(normalizeCareGuideId);

    res.status(200).json({
      success: true,
      data: normalizedGuides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get single care guide by ID
export const getCareGuideById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guide = await CareGuide.findById(id)
      .populate('author', 'firstName lastName email')
      .populate('relatedProducts', 'name slug images basePrice')
      .lean();

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Care guide not found'
      });
    }

    const normalizedGuide = normalizeCareGuideId(guide);

    res.status(200).json({
      success: true,
      data: normalizedGuide
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create care guide
export const createCareGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const guideData = {
      ...req.body,
      author: req.user!._id
    };

    const guide = await CareGuide.create(guideData);
    await guide.populate('author', 'firstName lastName email');

    // Clear cache
    await cache.delPattern('careGuides:*');
    await cache.delPattern('careGuideCategories:*');

    const normalizedGuide = normalizeCareGuideId(guide);

    res.status(201).json({
      success: true,
      data: normalizedGuide
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A care guide with this slug already exists'
      });
    }
    next(error);
  }
};

// Admin: Update care guide
export const updateCareGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guide = await CareGuide.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('author', 'firstName lastName email')
      .populate('relatedProducts', 'name slug images basePrice');

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Care guide not found'
      });
    }

    // Clear cache
    await cache.delPattern('careGuides:*');
    await cache.delPattern('careGuideCategories:*');
    await cache.del(cacheKeys.careGuide(guide.slug));

    const normalizedGuide = normalizeCareGuideId(guide);

    res.status(200).json({
      success: true,
      data: normalizedGuide
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A care guide with this slug already exists'
      });
    }
    next(error);
  }
};

// Admin: Delete care guide
export const deleteCareGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guide = await CareGuide.findById(id);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Care guide not found'
      });
    }

    await CareGuide.findByIdAndDelete(id);

    // Clear cache
    await cache.delPattern('careGuides:*');
    await cache.delPattern('careGuideCategories:*');
    await cache.del(cacheKeys.careGuide(guide.slug));

    res.status(200).json({
      success: true,
      data: null,
      message: 'Care guide deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

