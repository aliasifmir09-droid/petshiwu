import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import mongoose from 'mongoose';
import logger from '../utils/logger';

// Compare multiple products side-by-side
export const compareProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = req.query;
    const maxProducts = 5; // Maximum products to compare

    if (!productIds) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required. Provide comma-separated product IDs in query: ?productIds=id1,id2,id3'
      });
    }

    // Parse product IDs from query string
    const ids = String(productIds)
      .split(',')
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id))
      .slice(0, maxProducts); // Limit to max products

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product IDs provided'
      });
    }

    if (ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 products to compare'
      });
    }

    // Fetch all products
    const products = await Product.find({
      _id: { $in: ids },
      isActive: true
    })
      .populate({
        path: 'category',
        select: 'name slug parentCategory petType',
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        }
      })
      .lean();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found'
      });
    }

    // Structure comparison data
    const comparison = {
      products: products.map((product: any) => ({
        _id: String(product._id), // Ensure _id is always a string
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        description: product.description,
        shortDescription: product.shortDescription,
        images: product.images,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        petType: product.petType,
        category: product.category,
        tags: product.tags || [],
        features: product.features || [],
        ingredients: product.ingredients,
        variants: product.variants || [],
        inStock: product.inStock,
        totalStock: product.totalStock
      })),
      comparisonFields: {
        prices: products.map((p: any) => ({
          productId: p._id,
          basePrice: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          discount: p.compareAtPrice ? ((p.compareAtPrice - p.basePrice) / p.compareAtPrice * 100).toFixed(1) : null
        })),
        ratings: products.map((p: any) => ({
          productId: p._id,
          averageRating: p.averageRating,
          totalReviews: p.totalReviews
        })),
        stock: products.map((p: any) => ({
          productId: p._id,
          inStock: p.inStock,
          totalStock: p.totalStock
        })),
        brands: products.map((p: any) => ({
          productId: p._id,
          brand: p.brand
        })),
        categories: products.map((p: any) => ({
          productId: p._id,
          category: p.category?.name || 'N/A',
          petType: p.petType
        }))
      },
      summary: {
        cheapest: products.reduce((min: any, p: any) => 
          p.basePrice < min.basePrice ? p : min, products[0]
        )._id.toString(),
        highestRated: products.reduce((max: any, p: any) => 
          (p.averageRating || 0) > (max.averageRating || 0) ? p : max, products[0]
        )._id.toString(),
        mostReviewed: products.reduce((max: any, p: any) => 
          (p.totalReviews || 0) > (max.totalReviews || 0) ? p : max, products[0]
        )._id.toString(),
        bestValue: products.reduce((best: any, p: any) => {
          const pRating = p.averageRating || 0;
          const pReviews = p.totalReviews || 0;
          const pValue = pRating * (pReviews + 1) / (p.basePrice || 1);
          const bestRating = best.averageRating || 0;
          const bestReviews = best.totalReviews || 0;
          const bestValue = bestRating * (bestReviews + 1) / (best.basePrice || 1);
          return pValue > bestValue ? p : best;
        }, products[0])._id.toString()
      }
    };

    res.status(200).json({
      success: true,
      data: comparison,
      meta: {
        totalProducts: products.length,
        maxProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get comparison suggestions (products similar to the ones being compared)
export const getComparisonSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = req.query;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!productIds) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    const ids = String(productIds)
      .split(',')
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product IDs provided'
      });
    }

    // Get the first product (primary product for comparison)
    const firstProduct = await Product.findOne({
      _id: ids[0],
      isActive: true
    })
      .populate({
        path: 'category',
        select: 'name slug parentCategory petType',
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        }
      })
      .lean();

    if (!firstProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const firstProductCategory = firstProduct.category as any;
    const firstProductPetType = firstProduct.petType;
    const firstProductCategoryId = firstProductCategory?._id ? String(firstProductCategory._id) : null;
    const firstProductParentCategoryId = firstProductCategory?.parentCategory?._id ? String(firstProductCategory.parentCategory._id) : null;
    const firstProductGrandParentCategoryId = firstProductCategory?.parentCategory?.parentCategory?._id ? String(firstProductCategory.parentCategory.parentCategory._id) : null;

    // Build prioritized query: Same petType + category/subcategory matches
    const query: any = {
      _id: { $nin: ids },
      isActive: true,
      petType: firstProductPetType // Must match pet type
    };

    // Collect category IDs to search (category, parent, grandparent)
    const categoryIdsToSearch: mongoose.Types.ObjectId[] = [];
    if (firstProductCategoryId) {
      categoryIdsToSearch.push(new mongoose.Types.ObjectId(firstProductCategoryId));
    }
    if (firstProductParentCategoryId) {
      categoryIdsToSearch.push(new mongoose.Types.ObjectId(firstProductParentCategoryId));
    }
    if (firstProductGrandParentCategoryId) {
      categoryIdsToSearch.push(new mongoose.Types.ObjectId(firstProductGrandParentCategoryId));
    }

    // If we have category IDs, filter by them (prioritize same category/subcategory)
    if (categoryIdsToSearch.length > 0) {
      query.category = { $in: categoryIdsToSearch };
    }

    // Find similar products with same petType and category/subcategory
    let suggestions = await Product.find(query)
      .populate({
        path: 'category',
        select: 'name slug parentCategory petType'
      })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit * 2) // Get more to allow for sorting
      .lean();

    // If we don't have enough suggestions, fall back to same petType only
    if (suggestions.length < limit) {
      const fallbackQuery: any = {
        _id: { $nin: [...ids, ...suggestions.map((p: any) => p._id)] },
        isActive: true,
        petType: firstProductPetType
      };
      
      const fallbackSuggestions = await Product.find(fallbackQuery)
        .populate({
          path: 'category',
          select: 'name slug parentCategory petType'
        })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(limit - suggestions.length)
        .lean();
      
      suggestions = [...suggestions, ...fallbackSuggestions];
    }

    // Sort by relevance: exact category match > parent category match > grandparent match > other
    suggestions.sort((a: any, b: any) => {
      const aCategoryId = String(a.category?._id || '');
      const bCategoryId = String(b.category?._id || '');
      
      // Exact category match gets highest priority
      if (aCategoryId === firstProductCategoryId && bCategoryId !== firstProductCategoryId) return -1;
      if (bCategoryId === firstProductCategoryId && aCategoryId !== firstProductCategoryId) return 1;
      
      // Parent category match
      if (aCategoryId === firstProductParentCategoryId && bCategoryId !== firstProductParentCategoryId) return -1;
      if (bCategoryId === firstProductParentCategoryId && aCategoryId !== firstProductParentCategoryId) return 1;
      
      // Grandparent category match
      if (aCategoryId === firstProductGrandParentCategoryId && bCategoryId !== firstProductGrandParentCategoryId) return -1;
      if (bCategoryId === firstProductGrandParentCategoryId && aCategoryId !== firstProductGrandParentCategoryId) return 1;
      
      // Then by rating and reviews
      const aScore = (a.averageRating || 0) * (a.totalReviews || 0);
      const bScore = (b.averageRating || 0) * (b.totalReviews || 0);
      return bScore - aScore;
    });

    // Limit to requested number
    suggestions = suggestions.slice(0, limit);

    // Normalize product IDs to strings
    const normalizedSuggestions = suggestions.map((product: any) => ({
      ...product,
      _id: String(product._id)
    }));

    res.status(200).json({
      success: true,
      data: normalizedSuggestions
    });
  } catch (error) {
    next(error);
  }
};

