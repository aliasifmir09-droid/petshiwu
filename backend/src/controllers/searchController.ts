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
    let query: any = {
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Search query - Use AND logic for better relevance (all terms must be present)
    // Text index exists on: name, description, brand, tags (see Product model)
    if (q && typeof q === 'string') {
      const searchText = q.trim();
      if (searchText.length >= 1) {
        // Split search text into terms
        const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
        
        if (searchText.length >= 2) {
          if (searchTerms.length > 1) {
            // Multiple terms: Use AND logic - all terms must be present
            // This ensures we only show relevant products, not all products
            const escapedTerms = searchTerms.map(term => 
              term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            
            // Build AND conditions - all terms must appear in name OR description
            const andConditions = escapedTerms.map(term => ({
              $or: [
                { name: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } },
                { brand: { $regex: term, $options: 'i' } },
                { tags: { $in: [new RegExp(term, 'i')] } }
              ]
            }));
            
            // Also try exact match in product name (highest priority)
            const exactNameRegex = new RegExp(
              searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
              'i'
            );
            
            query = {
              isActive: true,
              $and: [
                {
                  $or: [
                    { deletedAt: null },
                    { deletedAt: { $exists: false } }
                  ]
                },
                {
                  $or: [
                    // Exact name match (highest priority)
                    { name: exactNameRegex },
                    // All terms must be present (AND logic) - combine all AND conditions
                    {
                      $and: andConditions
                    }
                  ]
                }
              ]
            };
          } else {
            // Single term: use text search for better performance
            query.$text = { $search: searchText };
          }
        } else {
          // For single character, use regex search for better matching
          const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query = {
            isActive: true,
            $and: [
              {
                $or: [
                  { deletedAt: null },
                  { deletedAt: { $exists: false } }
                ]
              },
              {
                $or: [
                  { name: searchRegex },
                  { description: searchRegex },
                  { brand: searchRegex },
                  { tags: { $in: [searchRegex] } }
                ]
              }
            ]
          };
        }
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

    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          categories: []
        }
      });
    }

    // Optimize autocomplete search - use text index if available, fallback to regex
    const searchText = q.trim();
    const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Cache autocomplete results for 1-2 minutes (popular searches)
    const autocompleteCacheKey = `autocomplete:${searchText}:${limit}`;
    let products = await cache.get<any[]>(autocompleteCacheKey);
    
    if (!products) {
      // Try text search first (faster if index exists)
      const baseQuery: any = {
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } }
        ]
      };

      // Initialize products array
      products = [];
      
      try {
        // Try $text search first (requires text index) - only for 2+ characters
        if (searchText.length >= 2) {
          const textSearchQuery = {
            ...baseQuery,
            $text: { $search: searchText }
          };
          
          products = await Product.find(textSearchQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
        
        // If text search returns no results or query is too short, use regex search
        // Regex search works better for single characters and partial matches in descriptions
        if (products.length === 0) {
          const regexSearchQuery = {
            isActive: true,
            $or: [
              { deletedAt: null },
              { deletedAt: { $exists: false } }
            ],
            $and: [
              {
                $or: [
                  { name: searchRegex },
                  { description: searchRegex },
                  { brand: searchRegex },
                  { tags: { $in: [searchRegex] } }
                ]
              }
            ]
          };
          
          products = await Product.find(regexSearchQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
      } catch (error: any) {
        // If $text search fails (e.g., text index doesn't exist), use regex fallback
        logger.debug(`Text search failed, using regex fallback: ${error.message}`);
        
        const regexSearchQuery = {
          isActive: true,
          $or: [
            { deletedAt: null },
            { deletedAt: { $exists: false } }
          ],
          $and: [
            {
              $or: [
                { name: searchRegex },
                { description: searchRegex },
                { brand: searchRegex },
                { tags: { $in: [searchRegex] } }
              ]
            }
          ]
        };
        
        products = await Product.find(regexSearchQuery)
          .select('name slug brand images basePrice')
          .limit(limit)
          .lean();
      }
      
      // Cache popular searches for 2 minutes
      await cache.set(autocompleteCacheKey, products, 120);
    }

    // Search categories - use text search if available, fallback to regex
    const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const categorySearchRegex = new RegExp(escapedText, 'i');
    
    let categories: any[] = [];
    
    try {
      // Try text search first
      const textCategoryQuery = {
        isActive: true,
        $text: { $search: searchText }
      };
      
      categories = await Category.find(textCategoryQuery)
        .select('name slug petType')
        .limit(5)
        .lean();
      
      // If no results, fallback to regex
      if (categories.length === 0) {
        const regexCategoryQuery = {
          isActive: true,
          $or: [
            { name: categorySearchRegex },
            { slug: categorySearchRegex }
          ]
        };
        
        categories = await Category.find(regexCategoryQuery)
          .select('name slug petType')
          .limit(5)
          .lean();
      }
    } catch (error: any) {
      // If text search fails, use regex fallback
      logger.debug(`Category text search failed, using regex fallback: ${error.message}`);
      
      const regexCategoryQuery = {
        isActive: true,
        $or: [
          { name: categorySearchRegex },
          { slug: categorySearchRegex }
        ]
      };
      
      categories = await Category.find(regexCategoryQuery)
        .select('name slug petType')
        .limit(5)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        products: products || [],
        categories: categories || []
      }
    });
  } catch (error: any) {
    logger.error('Error in searchAutocomplete:', error);
    // Return empty results on error instead of failing
    res.status(200).json({
      success: true,
      data: {
        products: [],
        categories: []
      }
    });
  }
};
