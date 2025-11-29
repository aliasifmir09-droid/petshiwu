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
    const petType = req.query.petType ? String(req.query.petType).toLowerCase().trim() : null;
    
    // Build base query with petType filter if provided
    const buildQuery = (slugQuery: any) => {
      const query: any = { ...slugQuery, isActive: true };
      if (petType) {
        query.petType = petType;
      }
      return query;
    };
    
    // Try to find category by ID first (if it's a valid ObjectId)
    let category = null;
    
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const idQuery: any = { _id: identifier };
      if (petType) {
        idQuery.petType = petType;
      }
      category = await Category.findOne(idQuery)
        .populate('parentCategory', 'name slug')
        .lean();
    }
    
    // If not found by ID, try to find by slug (case-insensitive)
    if (!category) {
      const normalizedSlug = identifier.toLowerCase().trim();
      
      // Try exact match first (with isActive check and petType if provided)
      category = await Category.findOne(buildQuery({ slug: normalizedSlug }))
        .populate('parentCategory', 'name slug')
        .lean();
      
      // If not found, try exact match without isActive filter (but still with petType if provided)
      if (!category) {
        const query: any = { slug: normalizedSlug };
        if (petType) {
          query.petType = petType;
        }
        category = await Category.findOne(query)
          .populate('parentCategory', 'name slug')
          .lean();
      }
      
      // If still not found, try case-insensitive regex match
      if (!category) {
        category = await Category.findOne(buildQuery({
          slug: { $regex: new RegExp(`^${normalizedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }))
          .populate('parentCategory', 'name slug')
          .lean();
      }
      
      // Try partial slug match (e.g., "dry-food" matches "dog-dry-food")
      if (!category) {
        category = await Category.findOne(buildQuery({
          slug: { $regex: new RegExp(normalizedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        }))
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
          category = await Category.findOne(buildQuery({
            name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }))
            .populate('parentCategory', 'name slug')
            .lean();
          
          if (category) break;
        }
      }
      
      // Try singular/plural variations if still not found
      if (!category) {
        // Try adding/removing 's' at the end for plural/singular matching
        const singular = normalizedSlug.replace(/s$/, ''); // "horses" -> "horse"
        const plural = normalizedSlug + 's'; // "horse" -> "horses"
        
        // Try singular version
        if (singular !== normalizedSlug) {
          category = await Category.findOne(buildQuery({ slug: singular }))
            .populate('parentCategory', 'name slug')
            .lean();
        }
        
        // Try plural version if singular didn't work
        if (!category && plural !== normalizedSlug) {
          category = await Category.findOne(buildQuery({ slug: plural }))
            .populate('parentCategory', 'name slug')
            .lean();
        }
        
        // Try by name with singular/plural
        if (!category) {
          const nameBase = normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          const nameSingular = nameBase.replace(/s$/, '');
          const namePlural = nameBase + 's';
          
          for (const nameMatch of [nameSingular, namePlural].filter(n => n !== nameBase)) {
            category = await Category.findOne(buildQuery({
              name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            }))
              .populate('parentCategory', 'name slug')
              .lean();
            
            if (category) break;
          }
        }
      }
      
      // If still not found and petType was provided, try without petType filter (fallback)
      if (!category && petType) {
        // Try slug without petType filter
        category = await Category.findOne({
          slug: normalizedSlug,
          isActive: true
        })
          .populate('parentCategory', 'name slug')
          .lean();
        
        // Try singular/plural without petType filter
        if (!category) {
          const singular = normalizedSlug.replace(/s$/, '');
          const plural = normalizedSlug + 's';
          
          if (singular !== normalizedSlug) {
            category = await Category.findOne({
              slug: singular,
              isActive: true
            })
              .populate('parentCategory', 'name slug')
              .lean();
          }
          
          if (!category && plural !== normalizedSlug) {
            category = await Category.findOne({
              slug: plural,
              isActive: true
            })
              .populate('parentCategory', 'name slug')
              .lean();
          }
        }
        
        if (category) {
          console.warn(`[GET CATEGORY] Found category without petType filter: ${category.name} (slug: ${category.slug}, petType: ${category.petType}, requested: ${petType})`);
        }
      }
      
      // Final fallback: try name match without isActive filter
      if (!category) {
        const nameMatch = normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const query: any = {
          name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        };
        if (petType) {
          query.petType = petType;
        }
        category = await Category.findOne(query)
          .populate('parentCategory', 'name slug')
          .lean();
      }
    }

    if (!category) {
      // Log for debugging
      console.warn(`[GET CATEGORY] Category not found: ${identifier} (petType: ${petType || 'any'})`);
      
      // Try to find any similar categories for better error message
      const searchSlug = identifier.toLowerCase().trim();
      const singular = searchSlug.replace(/s$/, '');
      const plural = searchSlug + 's';
      
      const similarCategories = await Category.find({
        $or: [
          { slug: { $regex: new RegExp(searchSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
          { name: { $regex: new RegExp(searchSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
          ...(singular !== searchSlug ? [
            { slug: { $regex: new RegExp(singular.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
            { name: { $regex: new RegExp(singular.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
          ] : []),
          ...(plural !== searchSlug ? [
            { slug: { $regex: new RegExp(plural.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
            { name: { $regex: new RegExp(plural.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
          ] : [])
        ],
        ...(petType === 'other-animals' ? { petType: 'other-animals' } : {})
      }).select('name slug petType isActive').limit(10).lean();
      
      // Also check all active categories for other-animals if petType is other-animals
      let otherAnimalsCategories: any[] = [];
      if (petType === 'other-animals') {
        otherAnimalsCategories = await Category.find({
          petType: 'other-animals',
          isActive: true
        }).select('name slug').limit(20).lean();
      }
      
      let errorMessage = `Category not found: "${identifier}"`;
      if (petType) {
        errorMessage += ` for pet type "${petType}"`;
      }
      
      if (similarCategories.length > 0 || otherAnimalsCategories.length > 0) {
        errorMessage += '. ';
        if (similarCategories.length > 0) {
          errorMessage += `Similar categories found: ${similarCategories.map(c => `${c.name} (${c.petType}, slug: ${c.slug})`).join(', ')}. `;
        }
        if (otherAnimalsCategories.length > 0 && petType === 'other-animals') {
          errorMessage += `Available "Other Animals" categories: ${otherAnimalsCategories.map(c => `${c.name} (slug: ${c.slug})`).join(', ')}.`;
        }
      }
      
      return res.status(404).json({
        success: false,
        message: errorMessage
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



