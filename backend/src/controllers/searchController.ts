import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import {
  getElasticsearchClient,
  isElasticsearchAvailable,
  PRODUCTS_INDEX
} from '../utils/elasticsearch';

// Advanced search with filters - uses Elasticsearch if available, falls back to MongoDB
export const advancedSearch = async (req: Request, res: Response, next: NextFunction) => {
  // Try Elasticsearch first, fallback to MongoDB
  if (isElasticsearchAvailable()) {
    return advancedSearchElasticsearch(req, res, next);
  } else {
    return advancedSearchMongoDB(req, res, next);
  }
};

// Elasticsearch-based advanced search
const advancedSearchElasticsearch = async (req: Request, res: Response, next: NextFunction) => {
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
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const esClient = getElasticsearchClient();
    if (!esClient) {
      // Fallback to MongoDB if client is null
      return advancedSearchMongoDB(req, res, next);
    }

    // Build Elasticsearch query
    const must: any[] = [];
    const should: any[] = [];
    const filters: any[] = [];

    // Base filter: only active, non-deleted products
    filters.push({ term: { isActive: true } });

    // Search query
    if (q && typeof q === 'string' && q.trim().length > 0) {
      should.push(
        {
          multi_match: {
            query: q,
            fields: ['name^3', 'description^2', 'brand^2', 'tags', 'shortDescription'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or'
          }
        },
        {
          match_phrase: {
            name: {
              query: q,
              boost: 4
            }
          }
        }
      );
    } else {
      // If no search query, match all
      must.push({ match_all: {} });
    }

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        filters.push({
          term: { 'category._id': category }
        });
      } else {
        // Try to find category by slug
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } }
          ],
          isActive: true
        }).lean();
        if (foundCategory) {
          filters.push({
            term: { 'category._id': String(foundCategory._id) }
          });
        }
      }
    }

    // Pet type filter
    if (petType) {
      filters.push({
        term: { petType: (petType as string).toLowerCase() }
      });
    }

    // Brand filter
    if (brand) {
      filters.push({
        term: { 'brand.keyword': brand }
      });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceRange: any = {};
      if (minPrice) {
        priceRange.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        priceRange.lte = parseFloat(maxPrice as string);
      }
      filters.push({ range: { basePrice: priceRange } });
    }

    // Rating filter
    if (minRating) {
      filters.push({
        range: { averageRating: { gte: parseFloat(minRating as string) } }
      });
    }

    // Stock filter
    const inStockStr = String(inStock || '');
    if (inStockStr.toLowerCase() === 'true') {
      filters.push({ term: { inStock: true } });
      filters.push({ range: { totalStock: { gt: 0 } } });
    }

    // Build sort
    let sortOption: any[] = [];
    switch (sort) {
      case 'price-asc':
        sortOption = [{ basePrice: { order: 'asc' } }, { _id: { order: 'asc' } }];
        break;
      case 'price-desc':
        sortOption = [{ basePrice: { order: 'desc' } }, { _id: { order: 'asc' } }];
        break;
      case 'rating':
        sortOption = [
          { averageRating: { order: 'desc' } },
          { totalReviews: { order: 'desc' } },
          { _id: { order: 'asc' } }
        ];
        break;
      case 'newest':
        sortOption = [{ createdAt: { order: 'desc' } }, { _id: { order: 'asc' } }];
        break;
      case 'name-asc':
        sortOption = [{ 'name.keyword': { order: 'asc' } }, { _id: { order: 'asc' } }];
        break;
      case 'name-desc':
        sortOption = [{ 'name.keyword': { order: 'desc' } }, { _id: { order: 'asc' } }];
        break;
      default:
        sortOption = [{ createdAt: { order: 'desc' } }, { _id: { order: 'asc' } }];
    }

    // Build Elasticsearch query
    const query: any = {
      bool: {
        must: must.length > 0 ? must : undefined,
        should: should.length > 0 ? should : undefined,
        filter: filters.length > 0 ? filters : undefined,
        minimum_should_match: should.length > 0 ? 1 : undefined
      }
    };

    // Execute search
    const searchResult = await esClient.search({
      index: PRODUCTS_INDEX,
      body: {
        query,
        sort: sortOption,
        from: skip,
        size: limitNum,
        _source: {
          excludes: ['variants'] // Exclude variants to reduce response size
        }
      }
    });

    // Get total count
    const total = searchResult.hits.total;
    const totalCount = typeof total === 'number' ? total : total?.value || 0;

    // Extract products from hits
    const products = searchResult.hits.hits.map((hit: any) => {
      const source = hit._source;
      return {
        ...source,
        _id: source._id,
        score: hit._score
      };
    });

    // Get aggregations for filters
    const aggregationsResult = await esClient.search({
      index: PRODUCTS_INDEX,
      body: {
        query,
        size: 0,
        aggs: {
          brands: {
            terms: {
              field: 'brand.keyword',
              size: 100
            }
          },
          priceRange: {
            stats: {
              field: 'basePrice'
            }
          },
          petTypes: {
            terms: {
              field: 'petType',
              size: 20
            }
          }
        }
      }
    });

    const aggs = aggregationsResult.aggregations;
    const availableBrands = aggs?.brands?.buckets?.map((b: any) => b.key) || [];
    const priceRange = aggs?.priceRange || { min: 0, max: 0 };

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      filters: {
        availableBrands: availableBrands.sort(),
        priceRange: {
          minPrice: priceRange.min || 0,
          maxPrice: priceRange.max || 0
        }
      }
    });
  } catch (error: any) {
    logger.error('Elasticsearch search error:', error);
    // Fallback to MongoDB on error
    return advancedSearchMongoDB(req, res, next);
  }
};

// MongoDB-based advanced search (fallback)
const advancedSearchMongoDB = async (req: Request, res: Response, next: NextFunction) => {
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

    // Search query
    const searchConditions: any[] = [];
    if (q && typeof q === 'string') {
      const searchRegex = new RegExp(q, 'i');
      searchConditions.push(
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { tags: { $in: [searchRegex] } }
      );
    }
    
    // Add deletedAt filter
    searchConditions.push(
      { deletedAt: null },
      { deletedAt: { $exists: false } }
    );
    
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
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
    const products = await Product.find(query)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    // Get filter options for UI
    const brands = await Product.distinct('brand', { ...query, brand: { $exists: true, $ne: '' } });
    const priceRange = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' }
        }
      }
    ]);

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

// Search autocomplete - uses Elasticsearch if available, falls back to MongoDB
export const searchAutocomplete = async (req: Request, res: Response, next: NextFunction) => {
  // Try Elasticsearch first, fallback to MongoDB
  if (isElasticsearchAvailable()) {
    return searchAutocompleteElasticsearch(req, res, next);
  } else {
    return searchAutocompleteMongoDB(req, res, next);
  }
};

// Elasticsearch-based autocomplete
const searchAutocompleteElasticsearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          categories: []
        }
      });
    }

    const esClient = getElasticsearchClient();
    if (!esClient) {
      return searchAutocompleteMongoDB(req, res, next);
    }

    // Search products using Elasticsearch
    const productResult = await esClient.search({
      index: PRODUCTS_INDEX,
      body: {
        query: {
          bool: {
            must: [
              { term: { isActive: true } }
            ],
            should: [
              {
                match: {
                  'name.suggest': {
                    query: q,
                    fuzziness: 'AUTO'
                  }
                }
              },
              {
                prefix: {
                  'name.keyword': {
                    value: q,
                    boost: 2
                  }
                }
              },
              {
                match: {
                  brand: {
                    query: q,
                    fuzziness: 'AUTO'
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        size: limit,
        _source: ['name', 'slug', 'brand', 'images', 'basePrice']
      }
    });

    const products = productResult.hits.hits.map((hit: any) => hit._source);

    // Search categories (still using MongoDB for now)
    const searchRegex = new RegExp(q, 'i');
    const categories = await Category.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { slug: searchRegex }
      ]
    })
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
  } catch (error: any) {
    logger.error('Elasticsearch autocomplete error:', error);
    return searchAutocompleteMongoDB(req, res, next);
  }
};

// MongoDB-based autocomplete (fallback)
const searchAutocompleteMongoDB = async (req: Request, res: Response, next: NextFunction) => {
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

    const searchRegex = new RegExp(q, 'i');

    // Search products
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { brand: searchRegex },
        { tags: { $in: [searchRegex] } }
      ],
      $and: [
        {
          $or: [
            { deletedAt: null },
            { deletedAt: { $exists: false } }
          ]
        }
      ]
    })
      .select('name slug brand images basePrice')
      .limit(limit)
      .lean();

    // Search categories
    const categories = await Category.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { slug: searchRegex }
      ]
    })
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

