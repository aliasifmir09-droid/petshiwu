import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { formatProductDescription } from '../utils/descriptionFormatter';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';
import { safeToString } from '../utils/types';

// Helper function to normalize product _id to string
const normalizeProductId = (product: any): any => {
  if (!product) return product;
  
  // Convert to plain object if it's a Mongoose document
  const plainProduct = product.toObject ? product.toObject() : product;
  
  // Normalize product _id
  const normalized: any = {
    ...plainProduct,
    _id: plainProduct._id ? String(plainProduct._id) : plainProduct._id
  };
  
  // Normalize category._id if category is populated
  if (normalized.category && typeof normalized.category === 'object' && normalized.category._id) {
    normalized.category = {
      ...normalized.category,
      _id: typeof normalized.category._id === 'object' && normalized.category._id.toString
        ? normalized.category._id.toString()
        : String(normalized.category._id)
    };
  }
  
  return normalized;
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

    // OPTIMIZATION: Pre-fetch all existing slugs in one query (much faster than checking one-by-one)
    const existingSlugs = new Set<string>();
    const allExistingProducts = await Product.find({}).select('slug').lean();
    allExistingProducts.forEach((p: { slug?: string }) => {
      if (p.slug) existingSlugs.add(p.slug);
    });
    logger.debug(`[CSV IMPORT] Pre-loaded ${existingSlugs.size} existing product slugs`);

    // OPTIMIZATION: Cache for categories to avoid redundant lookups
    const categoryCache = new Map<string, mongoose.Types.ObjectId>();
    const categoryNameCache = new Map<string, string>(); // categoryId -> name for slug generation

    // OPTIMIZATION: Process products in batches for better performance
    const BATCH_SIZE = 50;
    const productsToInsert: any[] = [];
    const productRowMap = new Map<number, number>(); // Maps product index to row number

    // Helper function to find or create category in hierarchy (with caching)
    const findOrCreateCategory = async (categoryName: string, petType: string, parentId: mongoose.Types.ObjectId | null = null): Promise<mongoose.Types.ObjectId> => {
      const cacheKey = `${categoryName.toLowerCase()}_${petType}_${parentId?.toString() || 'null'}`;
      
      // Check cache first
      if (categoryCache.has(cacheKey)) {
        return categoryCache.get(cacheKey)!;
      }

      const trimmedName = categoryName.trim();
      
      if (!trimmedName || trimmedName.length === 0) {
        throw new Error('Category name cannot be empty');
      }
      
      // Try to find existing category
      const query: any = {
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        petType: petType.toLowerCase()
      };
      
      if (parentId) {
        query.parentCategory = parentId;
      } else {
        query.parentCategory = null;
      }
      
      let category = await Category.findOne(query).lean();
      
      // If not found, create it
      if (!category) {
        let level = 1;
        if (parentId) {
          const parent = await Category.findById(parentId).select('level').lean();
          if (parent) {
            level = (parent.level || 1) + 1;
            if (level > 3) {
              throw new Error(`Maximum category depth is 3 levels. Cannot create category "${trimmedName}" at level ${level}.`);
            }
          }
        }
        
        try {
          const newCategory = await Category.create({
            name: trimmedName,
            petType: petType.toLowerCase(),
            parentCategory: parentId,
            isActive: true,
            level: level,
            description: `${trimmedName} products`
          });
          // Convert to plain object to match lean() return type
          const categoryObj = newCategory.toObject();
          category = categoryObj as typeof category;
        } catch (createError: unknown) {
          const error = createError as { code?: number; name?: string; message?: string };
          if (error.code === 11000 || error.name === 'MongoServerError') {
            category = await Category.findOne(query).lean();
            if (!category) {
              throw new Error(`Failed to create category "${trimmedName}": ${error.message || 'Unknown error'}`);
            }
          } else {
            throw createError;
          }
        }
      } else if (!category.isActive) {
        await Category.findByIdAndUpdate(category._id, { isActive: true });
        category.isActive = true;
      }
      
      if (category && category._id) {
        const categoryId = category._id instanceof mongoose.Types.ObjectId 
          ? category._id 
          : new mongoose.Types.ObjectId(String(category._id));
        
        // Cache the result
        categoryCache.set(cacheKey, categoryId);
        categoryNameCache.set(categoryId.toString(), category.name);
        
        return categoryId;
      }
      
      throw new Error(`Failed to find or create category: ${trimmedName}`);
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


        // Parse hierarchical category path (e.g., "Dog > Food > Dry Food" or "food > dry food")
        // IMPORTANT: Reset categoryId for each product to avoid using previous product's category
        let categoryId: mongoose.Types.ObjectId | null = null;
        const categoryPath = String(row.category || '').trim();
        
        if (!categoryPath || categoryPath.length === 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Category is required'
          });
          continue;
        }
        
        // Get pet type once for the entire category resolution
        const petType = String(row.petType).toLowerCase().trim();
        
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
          
          // Build category hierarchy - ensure each part is processed correctly
          let currentParentId: mongoose.Types.ObjectId | null = null;
          
          for (let j = 0; j < categoryParts.length; j++) {
            const categoryName = categoryParts[j].trim();
            if (!categoryName) {
              continue; // Skip empty parts
            }
            
            try {
              const createdId = await findOrCreateCategory(categoryName, petType, currentParentId);
              if (!createdId) {
                throw new Error(`Failed to create/find category: ${categoryName}`);
              }
              currentParentId = createdId;
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                row: rowNumber,
                error: `Category hierarchy error at "${categoryName}": ${error.message}`
              });
              currentParentId = null;
              break;
            }
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
        
        // Skip redundant category validation - we already validated it exists in findOrCreateCategory

        // Parse images (comma or pipe-separated URLs)
        const images = row.images 
          ? String(row.images).split(/[,|]/).map((img: string) => img.trim()).filter((img: string) => img.length > 0)
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

        // Ensure categoryId is valid and exists
        if (!categoryId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Category ID is null or undefined'
          });
          continue;
        }
        
        // categoryId is already a valid ObjectId from findOrCreateCategory
        const categoryObjectId = categoryId;
        
        // Format description with headings
        const rawDescription = String(row.description).trim();
        const formattedDescription = formatProductDescription(rawDescription);
        
        // Generate unique slug from product name (OPTIMIZED: use pre-loaded slug set instead of DB query)
        let baseSlug = String(row.name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        let uniqueSlug = baseSlug;
        let slugAttempts = 0;
        const maxSlugAttempts = 10;
        
        // Check if slug already exists using pre-loaded set (much faster than DB query)
        while (slugAttempts < maxSlugAttempts) {
          if (!existingSlugs.has(uniqueSlug)) {
            // Slug is unique, add it to set and use it
            existingSlugs.add(uniqueSlug);
            break;
          }
          
          // Slug exists, make it unique by appending brand, category, or timestamp
          slugAttempts++;
          if (slugAttempts === 1) {
            // First attempt: append brand
            const brandSlug = String(row.brand).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            uniqueSlug = `${baseSlug}-${brandSlug}`;
          } else if (slugAttempts === 2) {
            // Second attempt: append category name (use cache)
            const categoryName = categoryNameCache.get(categoryObjectId.toString()) || '';
            if (categoryName) {
              const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
              uniqueSlug = `${baseSlug}-${categorySlug}`;
            } else {
              uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}-${i}`;
            }
          } else {
            // Subsequent attempts: append timestamp and row index
            uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}-${i}-${slugAttempts}`;
          }
        }
        
        if (slugAttempts >= maxSlugAttempts) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Could not generate unique slug for product: ${row.name}`
          });
          continue;
        }

        // Create product data - use the validated ObjectId
        const productData: any = {
          name: String(row.name).trim(),
          slug: uniqueSlug, // Use the unique slug we generated
          description: formattedDescription || rawDescription,
          shortDescription: row.shortDescription ? String(row.shortDescription).trim() : '',
          brand: String(row.brand).trim(),
          category: categoryObjectId, // Use the validated ObjectId
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
          inStock: String(row.inStock || 'true').toLowerCase() === 'false' ? false : true
        };

        // Add product to batch for bulk insert
        productsToInsert.push(productData);
        productRowMap.set(productsToInsert.length - 1, rowNumber);
        
        // Insert in batches for better performance
        if (productsToInsert.length >= BATCH_SIZE) {
          try {
            const insertedProducts = await Product.insertMany(productsToInsert, { ordered: false });
            results.success += insertedProducts.length;
            productsToInsert.length = 0; // Clear array
            productRowMap.clear();
            logger.info(`[CSV IMPORT] Batch inserted ${insertedProducts.length} products`);
          } catch (batchError: any) {
            // Handle partial batch failures
            if (batchError.writeErrors) {
              // Some products failed, try inserting them one by one
              for (let j = 0; j < productsToInsert.length; j++) {
                try {
                  await Product.create(productsToInsert[j]);
                  results.success++;
                } catch (singleError: any) {
                  const originalRowNum = productRowMap.get(j) || rowNumber;
                  results.failed++;
                  results.errors.push({
                    row: originalRowNum,
                    error: singleError.message || 'Failed to create product'
                  });
                }
              }
            } else {
              // All products in batch failed
              for (let j = 0; j < productsToInsert.length; j++) {
                const originalRowNum = productRowMap.get(j) || rowNumber;
                results.failed++;
                results.errors.push({
                  row: originalRowNum,
                  error: batchError.message || 'Batch insert failed'
                });
              }
            }
            productsToInsert.length = 0;
            productRowMap.clear();
          }
        }

      } catch (error: any) {
        // Handle duplicate slug error specifically (MongoDB duplicate key error code 11000)
        if ((error.code === 11000 || error.name === 'MongoServerError') && error.keyPattern?.slug) {
          // Duplicate slug error - this shouldn't happen with our pre-check, but handle it anyway
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Product with same slug already exists. The system tried to generate a unique slug but it still conflicts. Please ensure product names are unique or include brand/category in the name. Original error: ${error.message}`
          });
        } else {
          // Other errors
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error'
          });
        }
      }
    }

    // Insert any remaining products in the final batch
    if (productsToInsert.length > 0) {
      try {
        const insertedProducts = await Product.insertMany(productsToInsert, { ordered: false });
        results.success += insertedProducts.length;
        logger.info(`[CSV IMPORT] Final batch inserted ${insertedProducts.length} products`);
      } catch (batchError: any) {
        // Handle partial batch failures
        if (batchError.writeErrors) {
          // Some products failed, try inserting them one by one
          for (let j = 0; j < productsToInsert.length; j++) {
            try {
              await Product.create(productsToInsert[j]);
              results.success++;
            } catch (singleError: any) {
              const originalRowNum = productRowMap.get(j) || 0;
              results.failed++;
              results.errors.push({
                row: originalRowNum,
                error: singleError.message || 'Failed to create product'
              });
            }
          }
        } else {
          // All products in batch failed
          for (let j = 0; j < productsToInsert.length; j++) {
            const originalRowNum = productRowMap.get(j) || 0;
            results.failed++;
            results.errors.push({
              row: originalRowNum,
              error: batchError.message || 'Batch insert failed'
            });
          }
        }
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

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *         description: Filter by pet type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price-asc, price-desc, rating]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 */
// Get all products with filters
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and sanitize pagination parameters
    const pageParam = req.query.page as string;
    const limitParam = req.query.limit as string;
    
    let page = 1;
    let limit = 20;
    
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0 && parsedPage <= 1000) {
        page = parsedPage;
      }
    }
    
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }
    
    const skip = (page - 1) * limit;

    // Generate cache key from query parameters
    const queryString = JSON.stringify({
      page,
      limit,
      category: req.query.category,
      petType: req.query.petType,
      brand: req.query.brand,
      search: req.query.search,
      sort: req.query.sort
    });
    const cacheKey = cacheKeys.products(queryString);

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }
    
    // Build query - products are now permanently deleted, so no need to filter by deletedAt
    // Only filter by isActive for active/inactive products
    // Explicitly exclude any products that might have deletedAt set (backward compatibility)
    const baseQuery: any = { 
      isActive: true,
      // Explicitly exclude any products that might have deletedAt set (backward compatibility)
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Filter by category - include subcategories
    // Support both category ID (ObjectId) and category slug/name
    if (req.query.category) {
      try {
        let categoryId: mongoose.Types.ObjectId | null = null;
        const categoryParam = String(req.query.category).trim();
        
        // Try to parse as ObjectId first
        if (mongoose.Types.ObjectId.isValid(categoryParam)) {
          categoryId = new mongoose.Types.ObjectId(categoryParam);
        } else {
          // Not a valid ObjectId, try to find by slug or name
          // Normalize slug format (replace spaces with hyphens, lowercase)
          const normalizedSlug = categoryParam.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          
          // Build query to find category by slug or name (case-insensitive)
          // Also search for partial matches (e.g., "dry food" matches "Dry Food")
          const escapedParam = categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const categoryQuery: any = {
            $or: [
              { slug: normalizedSlug },
              { slug: categoryParam.toLowerCase() }, // Also try exact lowercase
              { slug: { $regex: new RegExp(`^${normalizedSlug}`, 'i') } }, // Partial slug match
              { name: { $regex: new RegExp(`^${escapedParam}$`, 'i') } }, // Exact name match
              { name: { $regex: new RegExp(escapedParam.replace(/\s+/g, '\\s+'), 'i') } } // Match with any whitespace
            ],
            isActive: true
          };
          
          // Also filter by petType if provided to avoid cross-pet-type matches
          if (req.query.petType) {
            categoryQuery.petType = String(req.query.petType).toLowerCase().trim();
          }
          
          // Find category by slug or name (case-insensitive) - search all categories (not just root)
          const foundCategory = await Category.findOne(categoryQuery).lean();
          
          if (foundCategory && foundCategory._id) {
            categoryId = foundCategory._id as mongoose.Types.ObjectId;
            logger.debug(`[GET PRODUCTS] Found category by query: ${foundCategory.name} (ID: ${categoryId}, petType: ${foundCategory.petType}, slug: ${foundCategory.slug})`);
          } else {
            // Try one more time with more flexible matching (remove petType constraint for broader search)
            const flexibleQuery: any = {
              $or: [
                { slug: normalizedSlug },
                { name: { $regex: new RegExp(`^${escapedParam.replace(/\s+/g, '\\s*')}$`, 'i') } }
              ],
              isActive: true
            };
            
            const flexibleMatch = await Category.findOne(flexibleQuery).lean();
            if (flexibleMatch && flexibleMatch._id) {
              // Verify petType matches if provided
              if (!req.query.petType || flexibleMatch.petType === String(req.query.petType).toLowerCase().trim()) {
                categoryId = flexibleMatch._id as mongoose.Types.ObjectId;
                logger.debug(`[GET PRODUCTS] Found category by flexible query: ${flexibleMatch.name} (ID: ${categoryId}, petType: ${flexibleMatch.petType}, slug: ${flexibleMatch.slug})`);
              } else {
                logger.warn(`[GET PRODUCTS] Category found but petType mismatch: ${categoryParam} (found: ${flexibleMatch.petType}, requested: ${req.query.petType})`);
                // Still use it if petType wasn't specified
                if (!req.query.petType) {
                  categoryId = flexibleMatch._id as mongoose.Types.ObjectId;
                  logger.debug(`[GET PRODUCTS] Using category anyway since no petType filter: ${flexibleMatch.name} (ID: ${categoryId})`);
                }
              }
            } else {
              // Try to find all matching categories for debugging
              const allMatches = await Category.find({
                $or: [
                  { slug: { $regex: new RegExp(normalizedSlug, 'i') } },
                  { name: { $regex: new RegExp(escapedParam.replace(/\s+/g, '\\s*'), 'i') } }
                ],
                isActive: true
              }).select('_id name slug petType parentCategory').lean();
              
              logger.warn(`[GET PRODUCTS] Category not found: ${categoryParam} (petType: ${req.query.petType || 'any'})`);
              if (allMatches.length > 0) {
                logger.warn(`[GET PRODUCTS] But found ${allMatches.length} similar categories:`, allMatches.map(c => ({ name: c.name, slug: c.slug, petType: c.petType, id: c._id })));
              }
            }
          }
        }
        
        // If we have a valid categoryId, find all descendant subcategories recursively
        if (categoryId) {
          // Optimized: Fetch all relevant categories in one query, then build tree in memory
          const petTypeFilter = req.query.petType ? String(req.query.petType).toLowerCase().trim() : null;
          
          // Build query to fetch all categories that might be descendants
          // Since max depth is 3, we can fetch all categories with same petType or all categories
          const allCategoriesQuery: any = { isActive: true };
          if (petTypeFilter) {
            allCategoriesQuery.petType = petTypeFilter;
          }
          
          // Fetch all categories in one query (much faster than recursive queries)
          const allCategories = await Category.find(allCategoriesQuery).select('_id parentCategory').lean();
          
          // Build a map for quick parent-child lookups
          const categoryMap = new Map<string, mongoose.Types.ObjectId[]>();
          const parentMap = new Map<string, mongoose.Types.ObjectId | null>();
          
          for (const cat of allCategories) {
            const catId = cat._id.toString();
            const parentId = cat.parentCategory ? cat.parentCategory.toString() : null;
            parentMap.set(catId, cat.parentCategory as mongoose.Types.ObjectId | null);
            
            if (parentId) {
              if (!categoryMap.has(parentId)) {
                categoryMap.set(parentId, []);
              }
              categoryMap.get(parentId)!.push(cat._id as mongoose.Types.ObjectId);
            }
          }
          
          // Recursively find all descendant IDs in memory (no more DB queries)
          const findAllDescendantIds = (parentId: mongoose.Types.ObjectId, visited = new Set<string>()): mongoose.Types.ObjectId[] => {
            const parentIdStr = parentId.toString();
            
            // Prevent infinite loops
            if (visited.has(parentIdStr)) {
              return [];
            }
            visited.add(parentIdStr);
            
            const result: mongoose.Types.ObjectId[] = [parentId];
            
            // Get direct children from map
            const children = categoryMap.get(parentIdStr) || [];
            
            // Recursively find descendants of each child
            for (const childId of children) {
              const descendants = findAllDescendantIds(childId, visited);
              result.push(...descendants);
            }
            
            return result;
          };
          
          // Find all descendant categories (including the category itself) - all in memory now
          const categoryIds = findAllDescendantIds(categoryId);
          
          // Remove duplicates (in case of any circular references)
          const uniqueCategoryIds = Array.from(new Set(categoryIds.map(id => id.toString())))
            .map(id => new mongoose.Types.ObjectId(id));
          
          if (uniqueCategoryIds.length > 0) {
            // Include products in the selected category and all its descendant subcategories
            baseQuery.category = { $in: uniqueCategoryIds };
            
            // Log category filtering for debugging
            logger.debug(`[GET PRODUCTS] Filtering by category: ${categoryId} (found ${uniqueCategoryIds.length} categories including all descendants)`);
          } else {
            logger.warn(`[GET PRODUCTS] No valid category IDs found for category filter: ${categoryParam}`);
          }
        } else {
          logger.warn(`[GET PRODUCTS] Category not resolved from parameter: ${categoryParam}`);
        }
      } catch (error: any) {
        // If category lookup fails, log error but continue without category filter
        logger.error('Error filtering by category:', error.message);
      }
    }

    // Filter by pet type
    if (req.query.petType) {
      baseQuery.petType = req.query.petType;
    }

    // Filter by brand
    if (req.query.brand) {
      baseQuery.brand = req.query.brand;
    }

    // Filter by price range with validation
    if (req.query.minPrice || req.query.maxPrice) {
      baseQuery.basePrice = {};
      if (req.query.minPrice) {
        const minPrice = parseFloat(String(req.query.minPrice));
        if (!isNaN(minPrice) && minPrice >= 0 && minPrice <= 1000000) {
          baseQuery.basePrice.$gte = minPrice;
        }
      }
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(String(req.query.maxPrice));
        if (!isNaN(maxPrice) && maxPrice >= 0 && maxPrice <= 1000000) {
          baseQuery.basePrice.$lte = maxPrice;
        }
      }
    }

    // Filter by in stock
    if (req.query.inStock !== undefined) {
      baseQuery.inStock = req.query.inStock === 'true';
    }

    // Filter by featured - IMPORTANT: Only show products with isFeatured: true
    if (req.query.featured !== undefined) {
      const featuredValue = String(req.query.featured).toLowerCase() === 'true';
      if (featuredValue) {
        baseQuery.isFeatured = true;
      }
    }

    // Build final query - combine base query with search if needed
    let query: any = baseQuery;
    
    // Search by name, description, brand, or tags
    if (req.query.search) {
      // Use $and to combine base query with search conditions
      query = {
        $and: [
          baseQuery,
          {
            $or: [
              { name: { $regex: req.query.search, $options: 'i' } },
              { description: { $regex: req.query.search, $options: 'i' } },
              { brand: { $regex: req.query.search, $options: 'i' } },
              { tags: { $in: [new RegExp(req.query.search as string, 'i')] } }
            ]
          }
        ]
      };
    }

    // Determine sort order based on query parameter
    let sortOrder: any = { createdAt: -1 }; // Default to newest first
    if (req.query.sort) {
      const sortParam = String(req.query.sort).toLowerCase();
      switch (sortParam) {
        case 'price-asc':
          sortOrder = { basePrice: 1 }; // Low to high
          break;
        case 'price-desc':
          sortOrder = { basePrice: -1 }; // High to low
          break;
        case 'rating':
          sortOrder = { averageRating: -1, totalReviews: -1 }; // Highest rated first
          break;
        case 'newest':
        default:
          sortOrder = { createdAt: -1 }; // Newest first
          break;
      }
    }

    // Get products with pagination
    // Connection-level readPreference ensures we read from primary (not stale replica)
    const products = await Product.find(query)
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
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (returns plain JS objects)

    // Filter out any products that might have been deleted (extra safety check)
    // Also remove duplicates by _id (in case of database duplicates)
    const seenIds = new Set<string>();
    const activeProducts = products.filter((product: any) => {
      // Ensure product exists and is active
      if (!product || product.isActive === false) {
        return false;
      }
      
      // Remove duplicates by _id (convert to string for comparison)
      const productId = String(product._id);
      if (seenIds.has(productId)) {
        return false; // Duplicate, skip it
      }
      seenIds.add(productId);
      return true;
    });

    // Count total using countDocuments (much faster than fetching all products)
    // This uses indexes and doesn't load documents into memory
    const total = await Product.countDocuments(query);

    // Normalize _id to string for all products (use filtered products)
    const normalizedProducts = normalizeProducts(activeProducts);

    const response = {
      success: true,
      data: normalizedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache the response (5 minutes for product listings)
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get single product (by slug or ID)
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    
    // Try to get from cache
    const cacheKey = cacheKeys.product(identifier);
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    let product;

    // Try to find by slug first, then by ID if slug doesn't match
    // Exclude soft-deleted products
    product = await Product.findOne({ slug: identifier, deletedAt: null })
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
      .lean(); // Use lean() for better performance
    
    if (!product) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        product = await Product.findOne({ _id: identifier })
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

    const response = {
      success: true,
      data: normalizedProduct
    };

    // Cache the response (15 minutes for single product)
    await cache.set(cacheKey, response, 900);

    res.status(200).json(response);
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
    const userId = req.user?._id;
    const userEmail = req.user?.email;
    const userRole = req.user?.role;

    // LOG: Track all product deletions
    logger.info(`[DELETE PRODUCT] Request received:`, {
      productId,
      userId: userId?.toString(),
      userEmail,
      userRole,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      logger.warn(`[DELETE PRODUCT] Invalid product ID: ${productId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Convert to ObjectId for consistent querying
    const objectId = new mongoose.Types.ObjectId(productId);

    // Check if product exists (check by both _id and slug to catch duplicates)
    const product = await Product.findById(objectId);
    
    if (!product) {
      // Also check by slug in case there's a duplicate
      const productBySlug = await Product.findOne({ slug: productId });
      if (!productBySlug) {
        // Return success even if product doesn't exist (idempotent)
        logger.info(`[DELETE PRODUCT] Product not found: ${productId} (idempotent success)`);
        return res.status(200).json({
          success: true,
          message: 'Product deleted successfully'
        });
      }
      // Found by slug, delete it
      logger.info(`[DELETE PRODUCT] Found product by slug, deleting: ${productBySlug._id} (${productBySlug.name})`);
      await Product.deleteOne({ _id: productBySlug._id });
      logger.info(`[DELETE PRODUCT] Successfully deleted product by slug: ${productBySlug._id}`);
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    }

    // LOG: Product found, proceeding with deletion
    logger.info(`[DELETE PRODUCT] Product found: ${product._id} (${product.name}), proceeding with deletion`);

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

    // Delete images from Cloudinary in background (non-blocking)
    // Don't wait for Cloudinary deletions to complete before responding
    Promise.allSettled(imageDeletionPromises).then((results) => {
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        logger.warn(`[DELETE PRODUCT] ${failed} image(s) failed to delete from Cloudinary for product ${productId}`);
      } else {
        logger.info(`[DELETE PRODUCT] All images deleted from Cloudinary for product ${productId}`);
      }
    }).catch((error) => {
      logger.error(`[DELETE PRODUCT] Error in background Cloudinary deletion for product ${productId}:`, error);
    });

    // Permanently delete product from database
    logger.debug(`[DELETE PRODUCT] Attempting database deletion: ${objectId}`);
    const deleteResult = await Product.deleteOne({ _id: objectId });
    logger.debug(`[DELETE PRODUCT] deleteOne result: ${deleteResult.deletedCount} deleted`);
    
    // Verify deletion immediately by checking if product still exists
    if (deleteResult.deletedCount > 0) {
      // Product was deleted - verify it's actually gone
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      const verifyDeleted = await Product.findById(objectId).lean();
      
      if (verifyDeleted) {
        logger.error(`[DELETE PRODUCT] WARNING: Product ${productId} still exists after deletion! Retrying...`);
        // Retry deletion with findByIdAndDelete
        await Product.findByIdAndDelete(objectId);
        
        // Verify again after retry
        await new Promise(resolve => setTimeout(resolve, 100));
        const verifyAgain = await Product.findById(objectId).lean();
        
        if (verifyAgain) {
          logger.error(`[DELETE PRODUCT] ERROR: Product ${productId} still exists after retry!`);
          return res.status(500).json({
            success: false,
            message: 'Product deletion may not be complete. Please try again or contact support.'
          });
        }
      }
    } else {
      // deleteOne returned 0 - product might already be deleted or doesn't exist
      logger.debug(`[DELETE PRODUCT] deleteOne returned 0, checking if product exists`);
      const stillExists = await Product.findById(objectId).lean();
      
      if (!stillExists) {
        // Product doesn't exist, deletion already successful (idempotent)
        logger.info(`[DELETE PRODUCT] Product already deleted (idempotent success)`);
        return res.status(200).json({
          success: true,
          message: 'Product deleted successfully'
        });
      }
      
      // Product exists but deleteOne failed - try findByIdAndDelete
      logger.debug(`[DELETE PRODUCT] Product exists, trying findByIdAndDelete`);
      const deletedProduct = await Product.findByIdAndDelete(objectId);
      
      if (!deletedProduct) {
        logger.error(`[DELETE PRODUCT] Failed to delete product: ${productId}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete product from database'
        });
      }
      
      logger.info(`[DELETE PRODUCT] findByIdAndDelete succeeded: ${deletedProduct._id}`);
    }

    // LOG: Final success
    logger.info(`[DELETE PRODUCT] ✅ Product deleted successfully: ${productId} (${product.name})`, {
      productId,
      productName: product.name,
      userId: userId?.toString(),
      userEmail,
      userRole,
      timestamp: new Date().toISOString()
    });

    // Return success immediately - no need to wait for verification
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

// Get unique brands (optimized - no need to fetch all products)
export const getUniqueBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Build filter query
    const filterQuery: any = {
      isActive: true,
      brand: { $exists: true, $nin: [null, ''] },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Filter by category if provided
    if (req.query.category) {
      try {
        let categoryId: mongoose.Types.ObjectId | null = null;
        const categoryParam = String(req.query.category).trim();
        
        if (mongoose.Types.ObjectId.isValid(categoryParam)) {
          categoryId = new mongoose.Types.ObjectId(categoryParam);
        } else {
          // Try to find by slug or name
          const normalizedSlug = categoryParam.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          const escapedParam = categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          const categoryQuery: any = {
            $or: [
              { slug: normalizedSlug },
              { name: { $regex: new RegExp(`^${escapedParam.replace(/\s+/g, '\\s*')}$`, 'i') } }
            ],
            isActive: true
          };
          
          if (req.query.petType) {
            categoryQuery.petType = String(req.query.petType).toLowerCase().trim();
          }
          
          const foundCategory = await Category.findOne(categoryQuery).lean();
          if (foundCategory?._id) {
            categoryId = foundCategory._id as mongoose.Types.ObjectId;
            
            // Optimized: Fetch all relevant categories in one query, then build tree in memory
            const petTypeFilter = req.query.petType ? String(req.query.petType).toLowerCase().trim() : null;
            
            // Build query to fetch all categories that might be descendants
            const allCategoriesQuery: any = { isActive: true };
            if (petTypeFilter) {
              allCategoriesQuery.petType = petTypeFilter;
            }
            
            // Fetch all categories in one query (much faster than recursive queries)
            const allCategories = await Category.find(allCategoriesQuery).select('_id parentCategory').lean();
            
            // Build a map for quick parent-child lookups
            const categoryMap = new Map<string, mongoose.Types.ObjectId[]>();
            
            for (const cat of allCategories) {
              const parentId = cat.parentCategory ? cat.parentCategory.toString() : null;
              if (parentId) {
                if (!categoryMap.has(parentId)) {
                  categoryMap.set(parentId, []);
                }
                categoryMap.get(parentId)!.push(cat._id as mongoose.Types.ObjectId);
              }
            }
            
            // Recursively find all descendant IDs in memory (no more DB queries)
            const findAllDescendantIds = (parentId: mongoose.Types.ObjectId, visited = new Set<string>()): mongoose.Types.ObjectId[] => {
              const parentIdStr = parentId.toString();
              
              // Prevent infinite loops
              if (visited.has(parentIdStr)) {
                return [];
              }
              visited.add(parentIdStr);
              
              const result: mongoose.Types.ObjectId[] = [parentId];
              
              // Get direct children from map
              const children = categoryMap.get(parentIdStr) || [];
              
              // Recursively find descendants of each child
              for (const childId of children) {
                const descendants = findAllDescendantIds(childId, visited);
                result.push(...descendants);
              }
              
              return result;
            };
            
            // Find all descendant categories (including the category itself) - all in memory now
            const categoryIds = findAllDescendantIds(categoryId);
            
            // Remove duplicates
            const uniqueCategoryIds = Array.from(new Set(categoryIds.map(id => id.toString())))
              .map(id => new mongoose.Types.ObjectId(id));
            
            filterQuery.category = { $in: uniqueCategoryIds };
          }
        }
        
        if (!filterQuery.category && categoryId) {
          filterQuery.category = categoryId;
        }
      } catch (error) {
        logger.error('[GET UNIQUE BRANDS] Error processing category filter:', error);
      }
    }

    // Filter by petType if provided
    if (req.query.petType) {
      filterQuery.petType = String(req.query.petType).toLowerCase().trim();
    }

    // Use distinct to get unique brands efficiently - much faster than fetching all products
    const brands = await Product.distinct('brand', filterQuery);
    
    // Filter out null/empty and sort
    const uniqueBrands = brands
      .filter(brand => brand && typeof brand === 'string' && brand.trim().length > 0)
      .map(brand => brand.trim())
      .sort();

    res.status(200).json({
      success: true,
      data: uniqueBrands
    });
  } catch (error) {
    next(error);
  }
};
