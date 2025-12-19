import { Request, Response, NextFunction } from 'express';
import FAQ from '../models/FAQ';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';

// Helper function to clear FAQ caches
const clearFAQCaches = async () => {
  try {
    await cache.delPattern('faqs:*');
    await cache.del(cacheKeys.faqs());
    await cache.del(cacheKeys.faqCategories());
    logger.debug('FAQ caches cleared');
  } catch (error: any) {
    logger.error('Error clearing FAQ caches:', error.message);
  }
};

// Helper function to normalize FAQ _id to string
const normalizeFAQId = (faq: any): any => {
  if (!faq) return faq;
  const plainFAQ = faq.toObject ? faq.toObject() : faq;
  return {
    ...plainFAQ,
    _id: plainFAQ._id ? String(plainFAQ._id) : plainFAQ._id
  };
};

// Helper function to normalize array of FAQs
const normalizeFAQs = (faqs: any[]): any[] => {
  return faqs.map(normalizeFAQId);
};

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: Get published FAQs
 *     tags: [FAQs]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *         description: Filter by pet type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of FAQs
 */
export const getPublishedFAQs = async (req: Request, res: Response, next: NextFunction) => {
  const { category, petType, search } = req.query;

  // Build cache key
  const cacheKey = cacheKeys.faqs(
    category as string,
    petType as string,
    search as string
  );

  // Try to get from cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  // Build query
  const query: any = {
    isPublished: true
  };

  if (category) {
    query.category = category;
  }

  if (petType && petType !== 'all') {
    query.$or = [
      { petType: petType },
      { petType: 'all' }
    ];
  }

  if (search) {
    query.$text = { $search: search as string };
  }

  // Fetch FAQs
  const faqs = await FAQ.find(query)
    .sort({ category: 1, order: 1, createdAt: -1 })
    .lean();

  const normalizedFAQs = normalizeFAQs(faqs);

  // Cache for 1 hour
  await cache.set(cacheKey, normalizedFAQs, 3600);

  res.status(200).json({
    success: true,
    data: normalizedFAQs
  });
};

/**
 * @swagger
 * /api/faqs/categories:
 *   get:
 *     summary: Get FAQ categories
 *     tags: [FAQs]
 *     responses:
 *       200:
 *         description: List of FAQ categories with counts
 */
export const getFAQCategories = async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = cacheKeys.faqCategories();

  // Try to get from cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  // Get categories with counts
  const categories = await FAQ.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);

  // Cache for 1 hour
  await cache.set(cacheKey, categories, 3600);

  res.status(200).json({
    success: true,
    data: categories
  });
};

/**
 * @swagger
 * /api/faqs/:id:
 *   get:
 *     summary: Get FAQ by ID
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ details
 */
export const getFAQById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const faq = await FAQ.findById(id).lean();

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Increment views if published
  if (faq.isPublished) {
    await FAQ.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  const normalizedFAQ = normalizeFAQId(faq);

  res.status(200).json({
    success: true,
    data: normalizedFAQ
  });
};

/**
 * @swagger
 * /api/faqs/:id/helpful:
 *   post:
 *     summary: Mark FAQ as helpful
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ marked as helpful
 */
export const markFAQHelpful = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const faq = await FAQ.findByIdAndUpdate(
    id,
    { $inc: { helpfulCount: 1 } },
    { new: true }
  ).lean();

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Clear cache
  await clearFAQCaches();

  res.status(200).json({
    success: true,
    data: normalizeFAQId(faq)
  };
};

/**
 * @swagger
 * /api/faqs/:id/not-helpful:
 *   post:
 *     summary: Mark FAQ as not helpful
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ marked as not helpful
 */
export const markFAQNotHelpful = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const faq = await FAQ.findByIdAndUpdate(
    id,
    { $inc: { notHelpfulCount: 1 } },
    { new: true }
  ).lean();

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Clear cache
  await clearFAQCaches();

  res.status(200).json({
    success: true,
    data: normalizeFAQId(faq)
  };
};

// Admin endpoints

/**
 * @swagger
 * /api/faqs/admin/all:
 *   get:
 *     summary: Get all FAQs (admin)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of all FAQs
 */
export const getAllFAQsAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    category,
    petType,
    search,
    isPublished,
    page = 1,
    limit = 20
  } = req.query;

  const query: any = {};

  if (category) {
    query.category = category;
  }

  if (petType && petType !== 'all') {
    query.petType = petType;
  }

  if (isPublished !== undefined) {
    query.isPublished = isPublished === 'true';
  }

  if (search) {
    query.$or = [
      { question: { $regex: search as string, $options: 'i' } },
      { answer: { $regex: search as string, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [faqs, total] = await Promise.all([
    FAQ.find(query)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FAQ.countDocuments(query)
  ]);

  const normalizedFAQs = normalizeFAQs(faqs);

  res.status(200).json({
    success: true,
    data: normalizedFAQs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

/**
 * @swagger
 * /api/faqs/admin:
 *   post:
 *     summary: Create FAQ (admin)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *               - category
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *               petType:
 *                 type: string
 *               order:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: FAQ created
 */
export const createFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { question, answer, category, petType, order, isPublished, tags } = req.body;

  if (!question || !answer || !category) {
    return res.status(400).json({
      success: false,
      message: 'Question, answer, and category are required'
    };
  }

  const faq = await FAQ.create({
    question,
    answer,
    category,
    petType: petType || 'all',
    order: order || 0,
    isPublished: isPublished || false,
    tags: tags || []
  };

  // Clear cache
  await clearFAQCaches();

  res.status(201).json({
    success: true,
    data: normalizeFAQId(faq)
  };
};

/**
 * @swagger
 * /api/faqs/admin/:id:
 *   put:
 *     summary: Update FAQ (admin)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: FAQ updated
 */
export const updateFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = req.body;

  const faq = await FAQ.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).lean();

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Clear cache
  await clearFAQCaches();

  res.status(200).json({
    success: true,
    data: normalizeFAQId(faq)
  };
};

/**
 * @swagger
 * /api/faqs/admin/:id:
 *   delete:
 *     summary: Delete FAQ (admin)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ deleted
 */
export const deleteFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const faq = await FAQ.findByIdAndDelete(id).lean();

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Clear cache
  await clearFAQCaches();

  res.status(200).json({
    success: true,
    message: 'FAQ deleted successfully'
  };
};

