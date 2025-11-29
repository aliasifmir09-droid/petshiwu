import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';

// Helper function to normalize category _id to string
const normalizeCategoryId = (category: any): any => {
  if (!category) return category;
  
  // Convert to plain object if it's a Mongoose document
  const plainCategory = category.toObject ? category.toObject() : category;
  
  const normalized: any = {
    ...plainCategory,
    _id: plainCategory._id ? String(plainCategory._id) : plainCategory._id
  };
  
  // Normalize parentCategory _id if it exists
  if (normalized.parentCategory && normalized.parentCategory._id) {
    normalized.parentCategory = {
      ...normalized.parentCategory,
      _id: String(normalized.parentCategory._id)
    };
  }
  
  // Normalize subcategories recursively
  if (normalized.subcategories && Array.isArray(normalized.subcategories)) {
    normalized.subcategories = normalized.subcategories.map(normalizeCategoryId);
  }
  
  return normalized;
};

// Helper function to normalize array of categories
const normalizeCategories = (categories: any[]): any[] => {
  return categories.map(normalizeCategoryId);
};

// Get all categories (public - only active)
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = { isActive: true };

    if (req.query.petType) {
      query.petType = req.query.petType;
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ name: 1 })
      .lean(); // Use lean() for better performance

    // Normalize _id to string for all categories
    const normalizedCategories = normalizeCategories(categories);

    res.status(200).json({
      success: true,
      data: normalizedCategories
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories for admin (includes inactive)
export const getAllCategoriesAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query: any = {};

    if (req.query.petType) {
      query.petType = req.query.petType;
    }

    // Get only parent categories if requested
    if (req.query.parentOnly === 'true') {
      query.parentCategory = null;
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name slug petType')
      .sort({ createdAt: -1 });

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create a map of all categories
    categories.forEach(cat => {
      const catObj: any = cat.toObject();
      catObj.subcategories = [];
      categoryMap.set(cat._id.toString(), catObj);
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      const catObj = categoryMap.get(cat._id.toString());
      if (cat.parentCategory) {
        const parent = categoryMap.get(cat.parentCategory._id.toString());
        if (parent) {
          parent.subcategories.push(catObj);
        } else {
          rootCategories.push(catObj);
        }
      } else {
        rootCategories.push(catObj);
      }
    });

    // Normalize all category IDs to strings
    const normalizedRootCategories = normalizeCategories(rootCategories);

    res.status(200).json({
      success: true,
      data: normalizedRootCategories,
      total: categories.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single category
export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    
    // Try to find category by ID first (if it's a valid ObjectId)
    let category = null;
    
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      category = await Category.findOne({ _id: identifier })
        .populate('parentCategory', 'name slug')
        .lean();
    }
    
    // If not found by ID, try to find by slug (case-insensitive)
    if (!category) {
      const normalizedSlug = identifier.toLowerCase().trim();
      
      // Try exact match first
      category = await Category.findOne({
        slug: normalizedSlug,
        isActive: true
      })
        .populate('parentCategory', 'name slug')
        .lean();
      
      // If still not found, try case-insensitive regex match
      if (!category) {
        category = await Category.findOne({
          slug: { $regex: new RegExp(`^${normalizedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          isActive: true
        })
          .populate('parentCategory', 'name slug')
          .lean();
      }
      
      // If still not found, try to find by name (case-insensitive)
      if (!category) {
        // Try different name formats
        const nameVariations = [
          normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // "Dry Food"
          normalizedSlug.replace(/-/g, ' '), // "dry food"
          normalizedSlug.replace(/-/g, ' ').toLowerCase(), // "dry food"
        ];
        
        for (const nameMatch of nameVariations) {
          category = await Category.findOne({
            name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            isActive: true
          })
            .populate('parentCategory', 'name slug')
            .lean();
          
          if (category) break;
        }
      }
      
      // If still not found, try without isActive filter (for debugging)
      if (!category) {
        category = await Category.findOne({
          slug: normalizedSlug
        })
          .populate('parentCategory', 'name slug')
          .lean();
        
        if (category && !category.isActive) {
          console.warn(`[GET CATEGORY] Found inactive category: ${category.name} (slug: ${category.slug})`);
        }
      }
      
      // Final fallback: try name match without isActive filter
      if (!category) {
        const nameMatch = normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        category = await Category.findOne({
          name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        })
          .populate('parentCategory', 'name slug')
          .lean();
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found: ${identifier}`
      });
    }

    // Normalize _id to string
    const normalizedCategory = normalizeCategoryId(category);

    res.status(200).json({
      success: true,
      data: normalizedCategory
    });
  } catch (error) {
    next(error);
  }
};

// Create category (Admin)
export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);

    // Normalize _id to string
    const normalizedCategory = normalizeCategoryId(category);

    res.status(201).json({
      success: true,
      data: normalizedCategory
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Admin)
export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update fields
    Object.assign(category, req.body);
    
    // Save to trigger pre-save middleware
    await category.save();

    // Normalize _id to string
    const normalizedCategory = normalizeCategoryId(category);

    res.status(200).json({
      success: true,
      data: normalizedCategory
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin)
export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Ensure ID is a valid ObjectId format
    const categoryId = String(req.params.id || '').trim();
    if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    next(error);
  }
};



