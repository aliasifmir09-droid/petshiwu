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
      .sort({ position: 1, name: 1 }) // Sort by position first, then by name
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
      .sort({ position: 1, createdAt: -1 }); // Sort by position first, then by creation date

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create a map of all categories
    categories.forEach(cat => {
      const catObj: any = cat.toObject();
      catObj.subcategories = [];
      const catId = cat._id as mongoose.Types.ObjectId;
      categoryMap.set(catId.toString(), catObj);
    });

    // Second pass: build hierarchy and sort subcategories by position
    categories.forEach(cat => {
      const catId = cat._id as mongoose.Types.ObjectId;
      const catObj = categoryMap.get(catId.toString());
      if (cat.parentCategory) {
        const parentId = (cat.parentCategory as any)._id as mongoose.Types.ObjectId;
        const parent = categoryMap.get(parentId.toString());
        if (parent) {
          parent.subcategories.push(catObj);
        } else {
          rootCategories.push(catObj);
        }
      } else {
        rootCategories.push(catObj);
      }
    });

    // Sort subcategories by position for each category
    const sortByPosition = (cats: any[]) => {
      cats.sort((a, b) => {
        const posA = a.position !== undefined ? a.position : 999999;
        const posB = b.position !== undefined ? b.position : 999999;
        return posA - posB;
      });
      cats.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          sortByPosition(cat.subcategories);
        }
      });
    };
    sortByPosition(rootCategories);

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
        .populate({
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        })
        .lean();
    }
    
    // If not found by ID, try to find by slug (case-insensitive)
    if (!category) {
      const normalizedSlug = identifier.toLowerCase().trim();
      
      // Helper function to populate full parent category hierarchy
      const populateParentChain = (query: any) => {
        return query.populate({
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        });
      };
      
      // Try exact match first (with isActive check and petType if provided)
      category = await populateParentChain(
        Category.findOne(buildQuery({ slug: normalizedSlug }))
      ).lean();
      
      // If not found, try exact match without isActive filter (but still with petType if provided)
      if (!category) {
        const query: any = { slug: normalizedSlug };
        if (petType) {
          query.petType = petType;
        }
        category = await populateParentChain(Category.findOne(query)).lean();
      }
      
      // If still not found, try case-insensitive regex match
      if (!category) {
        category = await populateParentChain(
          Category.findOne(buildQuery({
            slug: { $regex: new RegExp(`^${normalizedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }))
        ).lean();
      }
      
      // Try partial slug match (e.g., "dry-food" matches "dog-dry-food")
      if (!category) {
        category = await populateParentChain(
          Category.findOne(buildQuery({
            slug: { $regex: new RegExp(normalizedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          }))
        ).lean();
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
          category = await populateParentChain(
            Category.findOne(buildQuery({
              name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            }))
          ).lean();
          
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
          category = await populateParentChain(
            Category.findOne(buildQuery({ slug: singular }))
          ).lean();
        }
        
        // Try plural version if singular didn't work
        if (!category && plural !== normalizedSlug) {
          category = await populateParentChain(
            Category.findOne(buildQuery({ slug: plural }))
          ).lean();
        }
        
        // Try by name with singular/plural
        if (!category) {
          const nameBase = normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          const nameSingular = nameBase.replace(/s$/, '');
          const namePlural = nameBase + 's';
          
          for (const nameMatch of [nameSingular, namePlural].filter(n => n !== nameBase)) {
            category = await populateParentChain(
              Category.findOne(buildQuery({
                name: { $regex: new RegExp(`^${nameMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
              }))
            ).lean();
            
            if (category) break;
          }
        }
      }
      
      // If still not found and petType was provided, try without petType filter (fallback)
      if (!category && petType) {
        // Try slug without petType filter
        category = await populateParentChain(
          Category.findOne({
            slug: normalizedSlug,
            isActive: true
          })
        ).lean();
        
        // Try singular/plural without petType filter
        if (!category) {
          const singular = normalizedSlug.replace(/s$/, '');
          const plural = normalizedSlug + 's';
          
          if (singular !== normalizedSlug) {
            category = await populateParentChain(
              Category.findOne({
                slug: singular,
                isActive: true
              })
            ).lean();
          }
          
          if (!category && plural !== normalizedSlug) {
            category = await populateParentChain(
              Category.findOne({
                slug: plural,
                isActive: true
              })
            ).lean();
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
        category = await populateParentChain(Category.findOne(query)).lean();
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
    // If position is not provided, set it to the next available position
    if (req.body.position === undefined) {
      const query: any = {
        petType: req.body.petType || 'all',
        parentCategory: req.body.parentCategory || null
      };
      const siblings = await Category.find(query).sort({ position: -1 }).limit(1);
      req.body.position = siblings.length > 0 && siblings[0].position !== undefined 
        ? siblings[0].position + 1 
        : 0;
    }
    
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
// Update category position (Admin)
export const updateCategoryPosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = String(req.params.id || '').trim();
    const { direction } = req.body; // 'up', 'down', 'left', 'right'

    console.log(`[UPDATE CATEGORY POSITION] Category ID: ${categoryId}, Direction: ${direction}`);

    if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    if (!direction || !['up', 'down', 'left', 'right'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: `Invalid direction "${direction}". Must be "up", "down", "left", or "right"`
      });
    }

    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Find categories with the same parent and petType
    // Handle parentCategory comparison correctly (can be ObjectId, string, or null)
    let parentCategoryId: any = null;
    
    // Extract parentCategory ID - handle various formats
    if (category.parentCategory) {
      if (typeof category.parentCategory === 'object') {
        // If it's an object, it might be populated or have _id
        parentCategoryId = category.parentCategory._id || category.parentCategory;
      } else {
        // Direct ObjectId or string
        parentCategoryId = category.parentCategory;
      }
      
      // Ensure it's a valid ObjectId for query
      if (typeof parentCategoryId === 'string' && mongoose.Types.ObjectId.isValid(parentCategoryId)) {
        parentCategoryId = new mongoose.Types.ObjectId(parentCategoryId);
      } else if (parentCategoryId && !(parentCategoryId instanceof mongoose.Types.ObjectId)) {
        // Convert if it's already an ObjectId-like object
        try {
          parentCategoryId = new mongoose.Types.ObjectId(String(parentCategoryId));
        } catch (e) {
          console.error('[UPDATE CATEGORY POSITION] Failed to convert parentCategoryId:', e);
        }
      }
    }

    const query: any = {
      petType: category.petType || 'all'
    };

    // For MongoDB query, handle both null and ObjectId cases
    if (parentCategoryId) {
      // Ensure parentCategoryId is an ObjectId for proper MongoDB comparison
      if (!(parentCategoryId instanceof mongoose.Types.ObjectId)) {
        parentCategoryId = new mongoose.Types.ObjectId(String(parentCategoryId));
      }
      query.parentCategory = parentCategoryId;
    } else {
      // Find categories with no parent (root categories)
      query.$or = [
        { parentCategory: null },
        { parentCategory: { $exists: false } }
      ];
    }

    console.log(`[UPDATE CATEGORY POSITION] Query:`, JSON.stringify({
      ...query,
      parentCategory: query.parentCategory ? String(query.parentCategory) : query.parentCategory
    }, null, 2));

    const siblings = await Category.find(query)
      .sort({ position: 1, createdAt: -1 })
      .lean();

    console.log(`[UPDATE CATEGORY POSITION] Found ${siblings.length} siblings`);

    if (siblings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sibling categories found'
      });
    }

    const currentIndex = siblings.findIndex(c => c._id.toString() === categoryId);
    
    if (currentIndex === -1) {
      console.error(`[UPDATE CATEGORY POSITION] Category ${categoryId} not found in siblings list`);
      return res.status(404).json({
        success: false,
        message: `Category not found in sibling list. Found ${siblings.length} siblings but category not in list.`
      });
    }

    console.log(`[UPDATE CATEGORY POSITION] Current index: ${currentIndex} of ${siblings.length - 1}`);

    let targetIndex = -1;

    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot move category ${direction}. Already at the ${direction === 'up' ? 'top' : 'bottom'}.`
      });
    }

    // Swap items in array to prepare for position recalculation
    const reorderedSiblings = [...siblings];
    [reorderedSiblings[currentIndex], reorderedSiblings[targetIndex]] = 
      [reorderedSiblings[targetIndex], reorderedSiblings[currentIndex]];

    // Recalculate all positions sequentially (0, 1, 2, 3, ...)
    // This ensures clean ordering without gaps
    const updatePromises = reorderedSiblings.map((cat, index) => {
      return Category.findByIdAndUpdate(cat._id, { position: index }, { new: false });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Category moved ${direction} successfully`
    });
  } catch (error) {
    next(error);
  }
};

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



