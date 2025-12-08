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

    // Get the products being compared
    const comparedProducts = await Product.find({
      _id: { $in: ids },
      isActive: true
    })
      .select('category petType brand tags')
      .lean();

    if (comparedProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found'
      });
    }

    // Collect common attributes
    const categories = new Set(comparedProducts.map((p: any) => p.category?.toString()).filter(Boolean));
    const petTypes = new Set(comparedProducts.map((p: any) => p.petType).filter(Boolean));
    const brands = new Set(comparedProducts.map((p: any) => p.brand).filter(Boolean));
    const allTags = new Set(comparedProducts.flatMap((p: any) => p.tags || []));

    // Find similar products
    const suggestions = await Product.find({
      _id: { $nin: ids },
      isActive: true,
      $or: [
        { category: { $in: Array.from(categories).map(id => new mongoose.Types.ObjectId(id)) } },
        { petType: { $in: Array.from(petTypes) } },
        { brand: { $in: Array.from(brands) } },
        { tags: { $in: Array.from(allTags) } }
      ]
    })
      .populate('category')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit)
      .lean();

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

