import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import SearchHistory from '../models/SearchHistory';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';
import { cache, cacheKeys } from '../utils/cache';

// Advanced search with filters
export const advancedSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q, // search query
      category,
      petType,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Search query - Use text index for faster search
    // Text index exists on: name, description, brand, tags (see Product model)
    if (q && typeof q === 'string') {
      const searchText = q.trim();
      if (searchText.length >= 2) {
        // Use $text search (requires text index - already exists in Product model)
        // Text search is 5-10x faster than regex
        query.$text = { $search: searchText };
        // Note: $text can be combined with other query conditions
        // Text search automatically searches name, description, brand, tags
      }
    }

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.category = new mongoose.Types.ObjectId(category as string);
      } else {
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } }
          ],
          isActive: true
        }).lean();
        if (foundCategory) {
          query.category = foundCategory._id;
        }
      }
    }

    // Pet type filter
    if (petType) {
      query.petType = (petType as string).toLowerCase();
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) {
        query.basePrice.$gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        query.basePrice.$lte = parseFloat(maxPrice as string);
      }
    }

    // Rating filter
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating as string) };
    }

    // Stock filter
    const inStockStr = String(inStock || '');
    if (inStockStr.toLowerCase() === 'true') {
      query.inStock = true;
      query.totalStock = { $gt: 0 };
    }

    // Build sort
    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortOption = { basePrice: 1 };
        break;
      case 'price-desc':
        sortOption = { basePrice: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1, totalReviews: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    // When using $text search, sort by textScore for relevance, then by sortOption
    let productsQuery = Product.find(query);
    
    if (query.$text) {
      // Add text score for relevance ranking
      productsQuery = productsQuery.select({ score: { $meta: 'textScore' } });
      // Sort by text score first (relevance), then by sortOption
      productsQuery = productsQuery.sort({ score: { $meta: 'textScore' }, ...sortOption });
    } else {
      productsQuery = productsQuery.sort(sortOption);
    }
    
    const products = await productsQuery
      .populate('category')
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    // Get filter options for UI
    // Cache brands list for 5 minutes (doesn't change often)
    const brandsCacheKey = cacheKeys.brands(JSON.stringify(query));
    let brands = await cache.get<string[]>(brandsCacheKey);
    if (!brands) {
      brands = await Product.distinct('brand', { ...query, brand: { $exists: true, $ne: '' } });
      await cache.set(brandsCacheKey, brands, 300); // 5 minutes
    }

    // Cache price range aggregation for 5-10 minutes (depends on query)
    // Price ranges change less frequently than individual products
    const priceRangePipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' }
        }
      }
    ];
    
    const priceRange = await executeCachedAggregation(
      'products',
      priceRangePipeline,
      async () => {
        return await Product.aggregate(priceRangePipeline);
      },
      600, // 10 minutes cache for price ranges
      JSON.stringify(query) // Include query in cache key suffix
    );

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        availableBrands: brands.sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search autocomplete
export const searchAutocomplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          categories: []
        }
      });
    }

    // Optimize autocomplete search - use text index if available
    const searchText = q.trim();
    const searchQuery: any = {
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Use text search for autocomplete (faster than regex)
    if (searchText.length >= 2) {
      // Use $text search (text index exists on name, description, brand, tags)
      searchQuery.$text = { $search: searchText };
    }

    // Cache autocomplete results for 1-2 minutes (popular searches)
    const autocompleteCacheKey = `autocomplete:${searchText}:${limit}`;
    let products = await cache.get<any[]>(autocompleteCacheKey);
    
    if (!products) {
      products = await Product.find(searchQuery)
        .select('name slug brand images basePrice')
        .limit(limit)
        .lean();
      
      // Cache popular searches for 2 minutes
      await cache.set(autocompleteCacheKey, products, 120);
    }

    // Search categories - use text search if available, otherwise regex
    const categorySearchQuery: any = {
      isActive: true
    };
    
    if (searchText.length >= 2) {
      // Use text search if available, otherwise use optimized regex
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedText, 'i');
      categorySearchQuery.$or = [
        { $text: { $search: searchText } }, // Text search
        { name: searchRegex }, // Fallback regex
        { slug: searchRegex }
      ];
    }
    
    const categories = await Category.find(categorySearchQuery)
      .select('name slug petType')
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        products,
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};
