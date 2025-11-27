import { Request, Response, NextFunction } from 'express';
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
    const category = await Category.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }]
    })
      .populate('parentCategory', 'name slug')
      .lean(); // Use lean() for better performance

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
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
    const category = await Category.findByIdAndDelete(req.params.id);

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
  } catch (error) {
    next(error);
  }
};



