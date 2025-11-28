import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Helper function to normalize product _id to string
const normalizeProductId = (product: any): any => {
  if (!product) return product;
  
  // Convert to plain object if it's a Mongoose document
  const plainProduct = product.toObject ? product.toObject() : product;
  
  return {
    ...plainProduct,
    _id: plainProduct._id ? String(plainProduct._id) : plainProduct._id
  };
};

// Helper function to normalize array of products
const normalizeProducts = (products: any[]): any[] => {
  return products.map(normalizeProductId);
};

// CSV Import function
interface CSVRow {
  name?: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category?: string;
  basePrice?: string | number;
  compareAtPrice?: string | number;
  petType?: string;
  images?: string;
  tags?: string;
  features?: string;
  ingredients?: string;
  isActive?: string;
  isFeatured?: string;
  inStock?: string;
  stock?: string | number;
  autoshipEligible?: string;
  variants?: string;
  variantSize?: string;
  variantPrice?: string | number;
  variantCompareAtPrice?: string | number;
  variantStock?: string | number;
  variantSku?: string;
  sku?: string;
}

export const importProductsFromCSV = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let csvFilePath: string | null = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    csvFilePath = req.file.path;

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true
    }) as CSVRow[];

    if (!records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or invalid'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>
    };

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!row.name || !row.description || !row.brand || !row.category || !row.basePrice || !row.petType) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: name, description, brand, category, basePrice, or petType'
          });
          continue;
        }

        // Helper function to find or create category in hierarchy
        const findOrCreateCategory = async (categoryName: string, petType: string, parentId: mongoose.Types.ObjectId | null = null): Promise<mongoose.Types.ObjectId> => {
          const trimmedName = categoryName.trim();
          
          // Try to find existing category (check both active and inactive)
          const query: any = {
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            petType: petType.toLowerCase()
          };
          
          if (parentId) {
            query.parentCategory = parentId;
          } else {
            query.parentCategory = null;
          }
          
          let category = await Category.findOne(query);
          
          // If not found, create it
          if (!category) {
            // Calculate level based on parent
            let level = 1;
            if (parentId) {
              const parent = await Category.findById(parentId);
              if (parent) {
                level = (parent.level || 1) + 1;
                if (level > 3) {
                  throw new Error(`Maximum category depth is 3 levels. Cannot create category "${trimmedName}" at level ${level}.`);
                }
              }
            }
            
            category = await Category.create({
              name: trimmedName,
              petType: petType.toLowerCase(),
              parentCategory: parentId,
              isActive: true,
              level: level,
              description: `${trimmedName} products`
            });
          } else if (!category.isActive) {
            // If category exists but is inactive, reactivate it
            category.isActive = true;
            await category.save();
          }
          
          // Ensure we return a proper ObjectId
          if (category && category._id) {
            return category._id as mongoose.Types.ObjectId;
          }
          
          throw new Error(`Failed to find or create category: ${trimmedName}`);
        };

        // Parse hierarchical category path (e.g., "Dog > Food > Dry Food")
        let categoryId: mongoose.Types.ObjectId;
        const categoryPath = String(row.category).trim();
        
        if (categoryPath.includes('>')) {
          // Hierarchical path detected
          const categoryParts = categoryPath.split('>').map(part => part.trim()).filter(part => part.length > 0);
          
          if (categoryParts.length === 0) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: 'Invalid category path format'
            });
            continue;
          }
          
          // Validate pet type matches first category (if it's a pet type name)
          const petType = String(row.petType).toLowerCase().trim();
          const firstCategoryName = categoryParts[0].toLowerCase();
          
          // Check if first part matches pet type (optional validation)
          // We'll use the petType from CSV row instead
          
          // Build category hierarchy
          let currentParentId: mongoose.Types.ObjectId | null = null;
          
          for (let i = 0; i < categoryParts.length; i++) {
            const categoryName = categoryParts[i];
            const createdId = await findOrCreateCategory(categoryName, petType, currentParentId);
            currentParentId = createdId;
          }
          
          if (!currentParentId) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: 'Failed to resolve category hierarchy'
            });
            continue;
          }
          
          categoryId = currentParentId;
        } else {
          // Simple category name or ID
          if (mongoose.Types.ObjectId.isValid(categoryPath)) {
            // It's an ObjectId
            const foundCategory = await Category.findById(categoryPath);
            if (!foundCategory || !foundCategory._id) {
              results.failed++;
              results.errors.push({
                row: rowNumber,
                error: `Category not found: ${categoryPath}`
              });
              continue;
            }
            categoryId = foundCategory._id as mongoose.Types.ObjectId;
          } else {
            // It's a category name - find or create as root category
            const petType = String(row.petType).toLowerCase().trim();
            const createdId = await findOrCreateCategory(categoryPath, petType, null);
            categoryId = createdId;
          }
        }
        
        // Get the final category for validation and ensure it's populated
        const category = await Category.findById(categoryId).lean();
        if (!category) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Failed to resolve category with ID: ${categoryId}`
          });
          continue;
        }
        
        // Verify category is active
        if (!category.isActive) {
          // Reactivate the category if it was inactive
          await Category.findByIdAndUpdate(categoryId, { isActive: true });
        }

        // Parse images (comma-separated URLs)
        const images = row.images 
          ? String(row.images).split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0)
          : [];

        if (images.length === 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'At least one image URL is required'
          });
          continue;
        }

        // Parse variants if provided (JSON string or comma-separated)
        let variants: any[] = [];
        if (row.variants) {
          try {
            const variantsStr = String(row.variants);
            // Try to parse as JSON first
            if (variantsStr.startsWith('[') || variantsStr.startsWith('{')) {
              variants = JSON.parse(variantsStr);
            } else {
              // If not JSON, create a single variant from the row data
              variants = [{
                size: row.variantSize ? String(row.variantSize) : '',
                price: parseFloat(String(row.variantPrice || row.basePrice || '0')),
                compareAtPrice: row.variantCompareAtPrice ? parseFloat(String(row.variantCompareAtPrice)) : undefined,
                stock: parseInt(String(row.variantStock || row.stock || '0')),
                sku: row.variantSku ? String(row.variantSku) : (row.sku ? String(row.sku) : `${String(row.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`)
              }];
            }
          } catch (e) {
            // If parsing fails, create default variant
            variants = [{
              size: '',
              price: parseFloat(String(row.basePrice || '0')),
              stock: parseInt(String(row.stock || '0')),
              sku: `${String(row.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            }];
          }
        } else {
          // No variants specified, create default variant
          variants = [{
            size: '',
            price: parseFloat(String(row.basePrice || '0')),
            stock: parseInt(String(row.stock || '0')),
            sku: `${String(row.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
          }];
        }

        // Parse tags and features (comma-separated)
        const tags = row.tags 
          ? String(row.tags).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
          : [];
        
        const features = row.features
          ? String(row.features).split(',').map((feature: string) => feature.trim()).filter((feature: string) => feature.length > 0)
          : [];

        // Create product data
        const productData: any = {
          name: String(row.name).trim(),
          description: String(row.description).trim(),
          shortDescription: row.shortDescription ? String(row.shortDescription).trim() : '',
          brand: String(row.brand).trim(),
          category: categoryId,
          images: images,
          variants: variants,
          basePrice: parseFloat(String(row.basePrice || '0')),
          compareAtPrice: row.compareAtPrice ? parseFloat(String(row.compareAtPrice)) : undefined,
          petType: String(row.petType).toLowerCase().trim(),
          tags: tags,
          features: features,
          ingredients: row.ingredients ? String(row.ingredients).trim() : '',
          isActive: String(row.isActive || 'true').toLowerCase() === 'false' ? false : true,
          isFeatured: String(row.isFeatured || 'false').toLowerCase() === 'true' ? true : false,
          inStock: String(row.inStock || 'true').toLowerCase() === 'false' ? false : true,
          autoshipEligible: String(row.autoshipEligible || 'false').toLowerCase() === 'true' ? true : false
        };

        // Create product
        const product = await Product.create(productData);
        results.success++;

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error'
        });
      }
    }

    // Clean up uploaded file
    if (csvFilePath && fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }

    // Return results
    res.status(200).json({
      success: true,
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      data: {
        total: records.length,
        succeeded: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error: any) {
    // Clean up uploaded file on error
    if (csvFilePath && fs.existsSync(csvFilePath)) {
      try {
        fs.unlinkSync(csvFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    next(error);
  }
};

// Get all products with filters
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Build query - products are now permanently deleted, so no need to filter by deletedAt
    // Only filter by isActive for active/inactive products
    const query: any = { isActive: true };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by pet type
    if (req.query.petType) {
      query.petType = req.query.petType;
    }

    // Filter by brand
    if (req.query.brand) {
      query.brand = req.query.brand;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.basePrice = {};
      if (req.query.minPrice) {
        query.basePrice.$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        query.basePrice.$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    // Filter by in stock
    if (req.query.inStock !== undefined) {
      query.inStock = req.query.inStock === 'true';
    }

    // Search by name, description, brand, or tags
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search as string, 'i')] } }
      ];
    }

    // Get products with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (returns plain JS objects)

    const total = await Product.countDocuments(query);

    // Normalize _id to string for all products
    const normalizedProducts = normalizeProducts(products);

    res.status(200).json({
      success: true,
      data: normalizedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single product (by slug or ID)
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    let product;

    // Try to find by slug first, then by ID if slug doesn't match
    // Exclude soft-deleted products
    product = await Product.findOne({ slug: identifier, deletedAt: null })
      .populate('category', 'name slug')
      .lean(); // Use lean() for better performance
    
    if (!product) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        product = await Product.findOne({ _id: identifier })
          .populate('category', 'name slug')
          .lean(); // Use lean() for better performance
      } catch (err) {
        // Invalid ObjectId, product not found
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Normalize _id to string
    const normalizedProduct = normalizeProductId(product);

    res.status(200).json({
      success: true,
      data: normalizedProduct
    });
  } catch (error) {
    next(error);
  }
};

// Get related products based on category and petType
export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const limit = parseInt(req.query.limit as string) || 8;

    // First, get the current product to know its category and petType
    let currentProduct;
    currentProduct = await Product.findOne({ slug: identifier });
    
    if (!currentProduct) {
      try {
        currentProduct = await Product.findById(identifier);
      } catch (err) {
        // Invalid ObjectId
      }
    }

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find products that match both category AND petType first
    const exactMatches = await Product.find({
      isActive: true,
      _id: { $ne: currentProduct._id },
      category: currentProduct.category,
      petType: currentProduct.petType
    })
      .populate('category', 'name slug')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);

    // If we need more products, find ones that match either category OR petType
    let relatedProducts = exactMatches;
    if (exactMatches.length < limit) {
      const remainingLimit = limit - exactMatches.length;
      const partialMatches = await Product.find({
        isActive: true,
        _id: { 
          $ne: currentProduct._id,
          $nin: exactMatches.map(p => p._id)
        },
        $or: [
          { category: currentProduct.category },
          { petType: currentProduct.petType }
        ]
      })
        .populate('category', 'name slug')
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(remainingLimit);
      
      relatedProducts = [...exactMatches, ...partialMatches];
    }

    // Normalize _id to string for all related products
    const normalizedRelatedProducts = normalizeProducts(relatedProducts);

    res.status(200).json({
      success: true,
      data: normalizedRelatedProducts,
      pagination: {
        page: 1,
        limit,
        total: relatedProducts.length,
        pages: 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create product (Admin)
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate required fields before attempting to create
    if (!req.body.category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!req.body.variants || !Array.isArray(req.body.variants) || req.body.variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variant is required'
      });
    }

    if (!req.body.images || !Array.isArray(req.body.images) || req.body.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: normalizeProductId(product)
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors (e.g., duplicate slug)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    next(error);
  }
};

// Update product (Admin)
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: normalizeProductId(product)
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    next(error);
  }
};

// Delete product (Admin) - Hard delete with Cloudinary cleanup
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Fetch product to get image URLs
    const product = await Product.findById(productId);
    
    if (!product) {
      // Return success even if product doesn't exist (idempotent)
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    }

    // Extract Cloudinary public_ids from image URLs and delete from Cloudinary
    const { deleteFromCloudinary } = await import('../utils/cloudinary');
    const imageDeletionPromises = product.images.map(async (imageUrl: string) => {
      try {
        // Extract public_id from Cloudinary URL
        // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1];
          // Remove version prefix if present (v1234567890/)
          const pathWithoutVersion = pathPart.replace(/^v\d+\//, '');
          // Extract public_id (remove file extension)
          const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
          
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        }
      } catch (error) {
        // Log but don't fail the entire deletion if one image fails
        // Error is already handled in deleteFromCloudinary
      }
    });

    // Wait for all image deletions to complete (using allSettled to not fail on individual errors)
    await Promise.allSettled(imageDeletionPromises);

    // Permanently delete product from database
    const deletedProduct = await Product.findByIdAndDelete(productId);
    
    // Verify deletion was successful
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    // Double-check: Verify product is actually deleted
    const verifyDeleted = await Product.findById(productId);
    if (verifyDeleted) {
      // If still exists, try deleteOne as fallback
      await Product.deleteOne({ _id: productId });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Restore product (Admin) - No longer needed since we use hard delete
export const restoreProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  return res.status(410).json({
    success: false,
    message: 'Product restore is no longer available. Products are permanently deleted.'
  });
};

// Get product statistics (Admin)
export const getProductStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ inStock: false, isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true, isActive: true });
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $project: { categoryName: '$categoryInfo.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        outOfStockProducts,
        featuredProducts,
        productsByCategory
      }
    });
  } catch (error) {
    next(error);
  }
};
