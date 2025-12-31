import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category, { ICategory } from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { formatProductDescription } from '../utils/descriptionFormatter';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';
import { safeToString } from '../utils/types';

// Helper function to recalculate stock from variants
const recalculateStock = (product: any): { totalStock: number; inStock: boolean } => {
  let calculatedTotalStock = 0;
  
  // Calculate total stock from variants
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    calculatedTotalStock = product.variants.reduce((total: number, variant: any) => {
      const variantStock = variant.stock || 0;
      return total + variantStock;
    }, 0);
  } else {
    // If no variants, use existing totalStock or default to 0
    calculatedTotalStock = product.totalStock || 0;
  }
  
  const calculatedInStock = calculatedTotalStock > 0;
  
  return {
    totalStock: calculatedTotalStock,
    inStock: calculatedInStock
  };
};

// Helper function to normalize product _id to string and convert Maps to objects
const normalizeProductId = (product: any): any => {
  if (!product) return product;
  
  // Convert to plain object if it's a Mongoose document
  const plainProduct = product.toObject ? product.toObject() : product;
  
  // Recalculate stock from variants to ensure accuracy
  const stockData = recalculateStock(plainProduct);
  
  // Normalize product _id
  const normalized: any = {
    ...plainProduct,
    _id: plainProduct._id ? String(plainProduct._id) : plainProduct._id,
    totalStock: stockData.totalStock,
    inStock: stockData.inStock
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
  
  // Convert variant attributes Maps to plain objects for JSON serialization
  if (normalized.variants && Array.isArray(normalized.variants)) {
    normalized.variants = normalized.variants.map((variant: any) => {
      const variantCopy = { ...variant };
      // Convert Map to plain object if it's a Map
      if (variantCopy.attributes instanceof Map) {
        const attributesObj: { [key: string]: string } = {};
        variantCopy.attributes.forEach((value: string, key: string) => {
          attributesObj[key] = value;
        });
        variantCopy.attributes = attributesObj;
      }
      return variantCopy;
    });
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
      
      // Type for lean category document - matches what Category.findOne().lean() returns
      interface CategoryLean {
        _id: mongoose.Types.ObjectId;
        name: string;
        slug: string;
        description?: string;
        image?: string;
        parentCategory?: mongoose.Types.ObjectId;
        petType: string;
        level: number;
        position: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        __v?: number;
      }
      let category: CategoryLean | null = await Category.findOne(query).lean() as unknown as CategoryLean | null;
      
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
          // Type assertion: toObject() returns a plain object similar to lean()
          category = categoryObj as unknown as CategoryLean;
        } catch (createError: unknown) {
          const error = createError as { code?: number; name?: string; message?: string };
          if (error.code === 11000 || error.name === 'MongoServerError') {
            const foundCategory = await Category.findOne(query).lean();
            if (!foundCategory) {
              throw new Error(`Failed to create category "${trimmedName}": ${error.message || 'Unknown error'}`);
            }
            category = foundCategory as unknown as CategoryLean;
          } else {
            throw createError;
          }
        }
      } else if (category && !category.isActive) {
        await Category.findByIdAndUpdate(category._id, { isActive: true });
        category.isActive = true;
      }
      
      if (category && category._id) {
        const categoryId = category._id instanceof mongoose.Types.ObjectId 
          ? category._id 
          : new mongoose.Types.ObjectId(String(category._id));
        
        // Cache the result
        categoryCache.set(cacheKey, categoryId);
        if (category.name) {
          categoryNameCache.set(categoryId.toString(), category.name);
        }
        
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

// JSON Import function
interface JSONProduct {
  name: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: string; // Category name or path like "Dog > Food > Dry Food"
  basePrice: number;
  compareAtPrice?: number;
  petType: string;
  images: string | string[]; // Array or comma-separated string
  tags?: string | string[];
  features?: string | string[];
  ingredients?: string;
  isActive?: boolean | string;
  isFeatured?: boolean | string;
  inStock?: boolean | string;
  stock?: number;
  lowStockThreshold?: number;
  variants?: Array<{
    attributes?: { [key: string]: string };
    size?: string; // Legacy
    weight?: string; // Legacy
    price: number;
    compareAtPrice?: number;
    stock: number;
    sku: string;
    image?: string;
    images?: string[];
  }>;
  // Legacy variant fields (for single variant)
  variantSize?: string;
  variantPrice?: number;
  variantCompareAtPrice?: number;
  variantStock?: number;
  variantSku?: string;
  sku?: string;
}

export const importProductsFromJSON = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let jsonFilePath: string | null = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'JSON file is required'
      });
    }

    jsonFilePath = req.file.path;

    // Read and parse JSON file
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    let products: JSONProduct[];
    
    try {
      const parsed = JSON.parse(jsonContent);
      // Handle both array format and object with products array
      if (Array.isArray(parsed)) {
        products = parsed;
      } else if (parsed.products && Array.isArray(parsed.products)) {
        products = parsed.products;
      } else {
        return res.status(400).json({
          success: false,
          message: 'JSON must be an array of products or an object with a "products" array'
        });
      }
    } catch (parseError: any) {
      return res.status(400).json({
        success: false,
        message: `Invalid JSON format: ${parseError.message}`
      });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'JSON file is empty or contains no products'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    // OPTIMIZATION: Pre-fetch all existing slugs in one query
    const existingSlugs = new Set<string>();
    const allExistingProducts = await Product.find({}).select('slug').lean();
    allExistingProducts.forEach((p: { slug?: string }) => {
      if (p.slug) existingSlugs.add(p.slug);
    });
    logger.debug(`[JSON IMPORT] Pre-loaded ${existingSlugs.size} existing product slugs`);

    // OPTIMIZATION: Cache for categories
    const categoryCache = new Map<string, mongoose.Types.ObjectId>();
    const categoryNameCache = new Map<string, string>();

    // Helper function to find or create category (same as CSV import)
    const findOrCreateCategory = async (categoryName: string, petType: string, parentId: mongoose.Types.ObjectId | null = null): Promise<mongoose.Types.ObjectId> => {
      const cacheKey = `${categoryName.toLowerCase()}_${petType}_${parentId?.toString() || 'null'}`;
      
      if (categoryCache.has(cacheKey)) {
        return categoryCache.get(cacheKey)!;
      }

      const trimmedName = categoryName.trim();
      
      if (!trimmedName || trimmedName.length === 0) {
        throw new Error('Category name cannot be empty');
      }
      
      const query: any = {
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        petType: petType.toLowerCase()
      };
      
      if (parentId) {
        query.parentCategory = parentId;
      } else {
        query.parentCategory = null;
      }
      
      interface CategoryLean {
        _id: mongoose.Types.ObjectId;
        name: string;
        slug: string;
        petType: string;
        level: number;
        isActive: boolean;
      }
      
      let category: CategoryLean | null = await Category.findOne(query).lean() as unknown as CategoryLean | null;
      
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
          category = newCategory.toObject() as unknown as CategoryLean;
        } catch (createError: any) {
          if (createError.code === 11000 || createError.name === 'MongoServerError') {
            const foundCategory = await Category.findOne(query).lean();
            if (!foundCategory) {
              throw new Error(`Failed to create category "${trimmedName}": ${createError.message || 'Unknown error'}`);
            }
            category = foundCategory as unknown as CategoryLean;
          } else {
            throw createError;
          }
        }
      } else if (category && !category.isActive) {
        await Category.findByIdAndUpdate(category._id, { isActive: true });
        category.isActive = true;
      }
      
      if (category && category._id) {
        const categoryId = category._id instanceof mongoose.Types.ObjectId 
          ? category._id 
          : new mongoose.Types.ObjectId(String(category._id));
        
        categoryCache.set(cacheKey, categoryId);
        if (category.name) {
          categoryNameCache.set(categoryId.toString(), category.name);
        }
        
        return categoryId;
      }
      
      throw new Error(`Failed to find or create category: ${trimmedName}`);
    };

    // OPTIMIZATION: Process products in batches
    const BATCH_SIZE = 50;
    const productsToInsert: any[] = [];
    const productIndexMap = new Map<number, number>();

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const index = i + 1; // 1-based index for error reporting

      try {
        // Validate required fields
        if (!product.name || !product.description || !product.brand || !product.category || !product.basePrice || !product.petType) {
          results.failed++;
          results.errors.push({
            index,
            error: 'Missing required fields: name, description, brand, category, basePrice, or petType'
          });
          continue;
        }

        // Parse category (same logic as CSV)
        let categoryId: mongoose.Types.ObjectId | null = null;
        const categoryPath = String(product.category || '').trim();
        const petType = String(product.petType).toLowerCase().trim();
        
        if (categoryPath.includes('>')) {
          const categoryParts = categoryPath.split('>').map(part => part.trim()).filter(part => part.length > 0);
          
          if (categoryParts.length === 0) {
            results.failed++;
            results.errors.push({
              index,
              error: 'Invalid category path format'
            });
            continue;
          }
          
          let currentParentId: mongoose.Types.ObjectId | null = null;
          
          for (let j = 0; j < categoryParts.length; j++) {
            const categoryName = categoryParts[j].trim();
            if (!categoryName) continue;
            
            try {
              const createdId = await findOrCreateCategory(categoryName, petType, currentParentId);
              if (!createdId) {
                throw new Error(`Failed to create/find category: ${categoryName}`);
              }
              currentParentId = createdId;
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                index,
                error: `Category hierarchy error at "${categoryName}": ${error.message}`
              });
              currentParentId = null;
              break;
            }
          }
          
          if (!currentParentId) {
            results.failed++;
            results.errors.push({
              index,
              error: 'Failed to resolve category hierarchy'
            });
            continue;
          }
          
          categoryId = currentParentId;
        } else {
          if (mongoose.Types.ObjectId.isValid(categoryPath)) {
            const foundCategory = await Category.findById(categoryPath);
            if (!foundCategory || !foundCategory._id) {
              results.failed++;
              results.errors.push({
                index,
                error: `Category not found: ${categoryPath}`
              });
              continue;
            }
            categoryId = foundCategory._id as mongoose.Types.ObjectId;
          } else {
            categoryId = await findOrCreateCategory(categoryPath, petType, null);
          }
        }

        // Parse images
        let images: string[] = [];
        if (product.images) {
          if (Array.isArray(product.images)) {
            images = product.images.filter(img => img && img.trim().length > 0);
          } else {
            images = String(product.images).split(/[,|]/).map((img: string) => img.trim()).filter((img: string) => img.length > 0);
          }
        }

        if (images.length === 0) {
          results.failed++;
          results.errors.push({
            index,
            error: 'At least one image URL is required'
          });
          continue;
        }

        // Parse variants
        let variants: any[] = [];
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          variants = product.variants.map(v => ({
            attributes: v.attributes || (v.size ? { size: v.size } : {}),
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock || 0,
            sku: v.sku || `${String(product.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            image: v.image,
            images: v.images
          }));
        } else if (product.variantPrice || product.variantSku) {
          // Legacy single variant format
          variants = [{
            size: product.variantSize || '',
            price: product.variantPrice || product.basePrice,
            compareAtPrice: product.variantCompareAtPrice,
            stock: product.variantStock || product.stock || 0,
            sku: product.variantSku || product.sku || `${String(product.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
          }];
        } else {
          // Default variant
          variants = [{
            size: '',
            price: product.basePrice,
            stock: product.stock || 0,
            sku: product.sku || `${String(product.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
          }];
        }

        // Parse tags and features
        const tags = product.tags 
          ? (Array.isArray(product.tags) ? product.tags : String(product.tags).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0))
          : [];
        
        const features = product.features
          ? (Array.isArray(product.features) ? product.features : String(product.features).split(',').map((feature: string) => feature.trim()).filter((feature: string) => feature.length > 0))
          : [];

        // Generate unique slug
        let baseSlug = String(product.name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        let uniqueSlug = baseSlug;
        let slugAttempts = 0;
        const maxSlugAttempts = 10;
        
        while (slugAttempts < maxSlugAttempts) {
          if (!existingSlugs.has(uniqueSlug)) {
            existingSlugs.add(uniqueSlug);
            break;
          }
          
          slugAttempts++;
          if (slugAttempts === 1) {
            const brandSlug = String(product.brand).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            uniqueSlug = `${baseSlug}-${brandSlug}`;
          } else if (slugAttempts === 2) {
            const categoryName = categoryNameCache.get(categoryId.toString()) || '';
            if (categoryName) {
              const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
              uniqueSlug = `${baseSlug}-${categorySlug}`;
            } else {
              uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}-${i}`;
            }
          } else {
            uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}-${i}-${slugAttempts}`;
          }
        }
        
        if (slugAttempts >= maxSlugAttempts) {
          results.failed++;
          results.errors.push({
            index,
            error: `Could not generate unique slug for product: ${product.name}`
          });
          continue;
        }

        // Format description
        const rawDescription = String(product.description).trim();
        const formattedDescription = formatProductDescription(rawDescription);

        // Create product data
        const productData: any = {
          name: String(product.name).trim(),
          slug: uniqueSlug,
          description: formattedDescription || rawDescription,
          shortDescription: product.shortDescription ? String(product.shortDescription).trim() : '',
          brand: String(product.brand).trim(),
          category: categoryId,
          images: images,
          variants: variants,
          basePrice: parseFloat(String(product.basePrice || '0')),
          compareAtPrice: product.compareAtPrice ? parseFloat(String(product.compareAtPrice)) : undefined,
          petType: petType,
          tags: tags,
          features: features,
          ingredients: product.ingredients ? String(product.ingredients).trim() : '',
          isActive: typeof product.isActive === 'boolean' ? product.isActive : String(product.isActive || 'true').toLowerCase() !== 'false',
          isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : String(product.isFeatured || 'false').toLowerCase() === 'true',
          inStock: typeof product.inStock === 'boolean' ? product.inStock : String(product.inStock || 'true').toLowerCase() !== 'false',
          lowStockThreshold: product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : undefined
        };

        productsToInsert.push(productData);
        productIndexMap.set(productsToInsert.length - 1, index);
        
        // Insert in batches
        if (productsToInsert.length >= BATCH_SIZE) {
          try {
            const insertedProducts = await Product.insertMany(productsToInsert, { ordered: false });
            results.success += insertedProducts.length;
            productsToInsert.length = 0;
            productIndexMap.clear();
            logger.info(`[JSON IMPORT] Batch inserted ${insertedProducts.length} products`);
          } catch (batchError: any) {
            if (batchError.writeErrors) {
              for (let j = 0; j < productsToInsert.length; j++) {
                try {
                  await Product.create(productsToInsert[j]);
                  results.success++;
                } catch (singleError: any) {
                  const originalIndex = productIndexMap.get(j) || index;
                  results.failed++;
                  results.errors.push({
                    index: originalIndex,
                    error: singleError.message || 'Failed to create product'
                  });
                }
              }
            } else {
              for (let j = 0; j < productsToInsert.length; j++) {
                const originalIndex = productIndexMap.get(j) || index;
                results.failed++;
                results.errors.push({
                  index: originalIndex,
                  error: batchError.message || 'Batch insert failed'
                });
              }
            }
            productsToInsert.length = 0;
            productIndexMap.clear();
          }
        }

      } catch (error: any) {
        if ((error.code === 11000 || error.name === 'MongoServerError') && error.keyPattern?.slug) {
          results.failed++;
          results.errors.push({
            index,
            error: `Product with same slug already exists: ${error.message}`
          });
        } else {
          results.failed++;
          results.errors.push({
            index,
            error: error.message || 'Unknown error'
          });
        }
      }
    }

    // Insert any remaining products
    if (productsToInsert.length > 0) {
      try {
        const insertedProducts = await Product.insertMany(productsToInsert, { ordered: false });
        results.success += insertedProducts.length;
        logger.info(`[JSON IMPORT] Final batch inserted ${insertedProducts.length} products`);
      } catch (batchError: any) {
        if (batchError.writeErrors) {
          for (let j = 0; j < productsToInsert.length; j++) {
            try {
              await Product.create(productsToInsert[j]);
              results.success++;
            } catch (singleError: any) {
              const originalIndex = productIndexMap.get(j) || 0;
              results.failed++;
              results.errors.push({
                index: originalIndex,
                error: singleError.message || 'Failed to create product'
              });
            }
          }
        } else {
          for (let j = 0; j < productsToInsert.length; j++) {
            const originalIndex = productIndexMap.get(j) || 0;
            results.failed++;
            results.errors.push({
              index: originalIndex,
              error: batchError.message || 'Batch insert failed'
            });
          }
        }
      }
    }

    // Clean up uploaded file
    if (jsonFilePath && fs.existsSync(jsonFilePath)) {
      fs.unlinkSync(jsonFilePath);
    }

    // Return results
    res.status(200).json({
      success: true,
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      data: {
        total: products.length,
        succeeded: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error: any) {
    // Clean up uploaded file on error
    if (jsonFilePath && fs.existsSync(jsonFilePath)) {
      try {
        fs.unlinkSync(jsonFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    next(error);
  }
};

// Download JSON template
export const downloadJSONTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templatePath = path.join(__dirname, '../../uploads/json/product-import-template.json');
    
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      // If file doesn't exist, create a default template
      const defaultTemplate = [
        {
          "name": "Example Product",
          "description": "Product description here. This is a detailed description of the product.",
          "shortDescription": "Short description",
          "brand": "Brand Name",
          "category": "Dog > Food > Dry Food",
          "basePrice": 29.99,
          "compareAtPrice": 39.99,
          "petType": "dog",
          "images": ["https://example.com/image.jpg"],
          "tags": ["tag1", "tag2"],
          "features": ["feature1", "feature2"],
          "ingredients": "Ingredients list",
          "isActive": true,
          "isFeatured": false,
          "inStock": true,
          "stock": 100,
          "lowStockThreshold": 10,
          "variants": [
            {
              "attributes": {
                "size": "5 lb",
                "flavor": "Chicken"
              },
              "price": 29.99,
              "compareAtPrice": 39.99,
              "stock": 50,
              "sku": "PRODUCT-SKU-001"
            }
          ]
        }
      ];
      
      // Ensure directory exists
      const templateDir = path.dirname(templatePath);
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }
      
      // Write default template
      fs.writeFileSync(templatePath, JSON.stringify(defaultTemplate, null, 2), 'utf-8');
    }
    
    // Send the template file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.json"');
    res.sendFile(templatePath);
  } catch (error: any) {
    logger.error('Error serving JSON template:', error);
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
      // PERFORMANCE FIX: Enforce maximum page size to prevent large result sets
      // Use MAX_PAGE_SIZE constant from config
      const { MAX_PAGE_SIZE } = require('../config/constants');
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= MAX_PAGE_SIZE) {
        limit = parsedLimit;
      } else if (parsedLimit > MAX_PAGE_SIZE) {
        // If limit exceeds max, use max and log warning
        limit = MAX_PAGE_SIZE;
        logger.warn(`Pagination limit ${parsedLimit} exceeds maximum ${MAX_PAGE_SIZE}, using ${MAX_PAGE_SIZE}`);
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
    
    // Check if this is an admin request (user is authenticated and has admin role)
    // Note: GET /products doesn't require auth, but we check if user is authenticated
    const isAdminRequest = (req as any).user && 
      ((req as any).user.role === 'admin' || (req as any).user.permissions?.canManageProducts);
    
    // Build query - products are now permanently deleted, so no need to filter by deletedAt
    // Admin can see inactive products, public can only see active products
    // Explicitly exclude any products that might have deletedAt set (backward compatibility)
    const baseQuery: any = { 
      // Explicitly exclude any products that might have deletedAt set (backward compatibility)
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };
    
    // Only filter by isActive for non-admin requests
    if (!isAdminRequest) {
      baseQuery.isActive = true;
    } else if (req.query.isActive !== undefined) {
      // Admin can filter by isActive if specified
      baseQuery.isActive = req.query.isActive === 'true';
    }

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
          
          // Optimized: Try exact match first (fastest), then regex if needed
          // Use index-friendly queries when possible
          let foundCategory = await Category.findOne({
            slug: normalizedSlug,
            isActive: true,
            ...(req.query.petType && { petType: String(req.query.petType).toLowerCase().trim() })
          }).select('_id name slug petType').lean();
          
          // If not found, try case-insensitive name match (slower, but needed for flexibility)
          if (!foundCategory) {
            foundCategory = await Category.findOne({
              name: { $regex: new RegExp(`^${escapedParam}$`, 'i') },
              isActive: true,
              ...(req.query.petType && { petType: String(req.query.petType).toLowerCase().trim() })
            }).select('_id name slug petType').lean();
          }
          
          if (foundCategory && foundCategory._id) {
            categoryId = foundCategory._id as mongoose.Types.ObjectId;
            logger.debug(`[GET PRODUCTS] Found category: ${foundCategory.name} (ID: ${categoryId})`);
          } else {
            // Only log warning in development to avoid performance impact
            if (process.env.NODE_ENV === 'development') {
              logger.warn(`[GET PRODUCTS] Category not found: ${categoryParam}`);
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

    // Optimize field selection and category population based on request type
    const isFeaturedQuery = req.query.featured === 'true' && limit <= 12;
    
    // Admin queries: simplified category (1 level), select essential fields (exclude heavy fields)
    // Featured queries: minimal fields for product cards
    // Regular queries: optimized fields for frontend (exclude unnecessary heavy fields)
    let selectFields: string | undefined;
    if (isAdminRequest) {
      // Admin needs essential fields for management, exclude description and other heavy fields
      // IMPORTANT: Always include isActive for admin to see product status
      selectFields = 'name slug images basePrice compareAtPrice averageRating totalReviews brand category petType isActive isFeatured inStock totalStock variants createdAt updatedAt tags';
    } else if (isFeaturedQuery) {
      // Featured products for home page - minimal fields
      selectFields = 'name slug images basePrice compareAtPrice averageRating totalReviews brand category petType isFeatured inStock totalStock variants';
    } else {
      // Frontend regular queries: exclude heavy fields like full description, ingredients, features
      // These are only needed on product detail page
      selectFields = 'name slug shortDescription images basePrice compareAtPrice averageRating totalReviews brand category petType isFeatured inStock totalStock variants tags createdAt';
    }

    // Get products with pagination
    // Connection-level readPreference ensures we read from primary (not stale replica)
    const productsQuery = Product.find(query)
      .maxTimeMS(5000); // 5 second timeout to prevent slow queries

    // Optimize category population based on request type
    if (isAdminRequest) {
      // Admin: simplified 1-level category population (faster)
      productsQuery.populate({
        path: 'category',
        select: 'name slug petType' // Admin doesn't need full hierarchy
      });
    } else if (isFeaturedQuery) {
      // Featured: minimal category info
      productsQuery.populate({
        path: 'category',
        select: 'name slug petType' // Simplified - don't need deep nesting for home page
      });
    } else {
      // PERFORMANCE FIX: Optimize category population to reduce N+1 queries
      // Instead of nested populate (which can cause multiple queries),
      // we'll fetch categories separately and build hierarchy in memory
      // This is more efficient for large result sets
      productsQuery.populate({
        path: 'category',
        select: 'name slug parentCategory petType',
        // Note: Nested populate is kept for now but could be optimized further
        // by fetching all categories first and building hierarchy in memory
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        }
      });
      // TODO: Further optimization - fetch all categories in one query and build hierarchy in memory
      // This would eliminate N+1 queries completely
    }

    // Conditionally apply select() only if selectFields is defined
    if (selectFields) {
      productsQuery.select(selectFields);
    }

    const products = await productsQuery
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (returns plain JS objects)

    // Filter out any products that might have been deleted (extra safety check)
    // Also remove duplicates by _id (in case of database duplicates)
    const seenIds = new Set<string>();
    const activeProducts = products.filter((product: any) => {
      // Ensure product exists
      if (!product) {
        return false;
      }
      
      // For non-admin requests, filter out inactive products
      // Admin should see all products (active and inactive)
      if (!isAdminRequest && product.isActive === false) {
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
    const total = await Product.countDocuments(query).maxTimeMS(5000);

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

/**
 * Cursor-based pagination for products (optimized for large datasets)
 * Better performance than offset-based pagination for 10,000+ products
 * @swagger
 * /api/products/cursor:
 *   get:
 *     summary: Get products using cursor-based pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Product ID cursor (from previous response)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 */
export const getProductsCursor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit = '20', petType, category, brand, search, sort } = req.query;
    
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    
    // Build base query (same as getProducts)
    const baseQuery: any = { 
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Add cursor to query if provided
    if (cursor) {
      try {
        baseQuery._id = { $gt: cursor };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cursor format'
        });
      }
    }

    // Apply filters (same logic as getProducts)
    if (petType) {
      baseQuery.petType = (petType as string).toLowerCase();
    }

    // Category filtering - simplified for cursor-based pagination
    if (category) {
      try {
        const categoryParam = String(category).trim();
        if (mongoose.Types.ObjectId.isValid(categoryParam)) {
          const categoryId = new mongoose.Types.ObjectId(categoryParam);
          // For cursor-based, use direct category match (can be enhanced later)
          baseQuery.category = categoryId;
        } else {
          // Try to find by slug
          const foundCategory = await Category.findOne({
            $or: [
              { slug: categoryParam.toLowerCase() },
              { name: { $regex: new RegExp(`^${categoryParam}$`, 'i') } }
            ],
            isActive: true
          }).lean();
          if (foundCategory && foundCategory._id) {
            baseQuery.category = foundCategory._id;
          }
        }
      } catch (error) {
        // Invalid category, skip filter
        logger.debug('Invalid category in cursor pagination:', error);
      }
    }

    if (brand) {
      baseQuery.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    if (search) {
      baseQuery.$text = { $search: search as string };
    }

    // Build sort
    let sortOption: any = { _id: 1 }; // Cursor-based requires _id sort
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { basePrice: 1, _id: 1 };
          break;
        case 'price-desc':
          sortOption = { basePrice: -1, _id: 1 };
          break;
        case 'rating':
          sortOption = { averageRating: -1, totalReviews: -1, _id: 1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1, _id: 1 };
          break;
        default:
          sortOption = { _id: 1 };
      }
    }

    // Fetch one extra to check if more exists
    const products = await Product.find(baseQuery)
      .maxTimeMS(5000) // 5 second timeout
      .select('name slug images basePrice averageRating totalReviews brand category petType inStock totalStock')
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(limitNum + 1)
      .lean();

    const hasMore = products.length > limitNum;
    const nextCursor = hasMore ? String(products[products.length - 1]._id) : null;
    
    // Return only the requested number of products
    const resultProducts = products.slice(0, limitNum);
    const normalizedProducts = normalizeProducts(resultProducts);

    res.status(200).json({
      success: true,
      data: normalizedProducts,
      pagination: {
        hasMore,
        nextCursor,
        limit: limitNum
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
      .maxTimeMS(5000) // 5 second timeout
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
          .maxTimeMS(5000) // 5 second timeout
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
    currentProduct = await Product.findOne({ slug: identifier })
      .maxTimeMS(3000)
      .select('category petType')
      .lean();
    
    if (!currentProduct) {
      try {
        currentProduct = await Product.findById(identifier)
          .maxTimeMS(3000)
          .select('category petType')
          .lean();
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
      .maxTimeMS(5000) // 5 second timeout
      .select('name slug images basePrice compareAtPrice averageRating totalReviews brand category petType isFeatured inStock totalStock variants')
      .populate({
        path: 'category',
        select: 'name slug petType' // Simplified for related products
      })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit)
      .lean();

    // If we need more products, find ones that match either category OR petType
    let relatedProducts = exactMatches;
    if (exactMatches.length < limit) {
      const remainingLimit = limit - exactMatches.length;
      const partialMatches = await Product.find({
        isActive: true,
        _id: { 
          $ne: currentProduct._id,
          $nin: exactMatches.map((p: any) => p._id)
        },
        $or: [
          { category: currentProduct.category },
          { petType: currentProduct.petType }
        ]
      })
        .maxTimeMS(5000) // 5 second timeout
        .select('name slug images basePrice compareAtPrice averageRating totalReviews brand category petType isFeatured inStock totalStock variants')
        .populate({
        path: 'category',
        select: 'name slug petType' // Simplified for related products
        })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(remainingLimit)
        .lean();
      
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

    // Convert attributes objects to Maps for variants if present
    const productData = { ...req.body };
    if (productData.variants && Array.isArray(productData.variants)) {
      productData.variants = productData.variants.map((variant: any) => {
        const variantData = { ...variant };
        // Convert attributes object to Map if it exists
        if (variantData.attributes && typeof variantData.attributes === 'object' && !(variantData.attributes instanceof Map)) {
          const attributesMap = new Map<string, string>();
          Object.entries(variantData.attributes).forEach(([key, value]) => {
            if (key && value && typeof value === 'string') {
              attributesMap.set(key, value);
            }
          });
          variantData.attributes = attributesMap.size > 0 ? attributesMap : undefined;
        }
        return variantData;
      });
    }

    const product = await Product.create(productData);
    
    // Populate category for response
    await product.populate('category', 'name slug');

    // Invalidate cache for product lists (new product affects lists)
    // Do this in parallel with response to not block the request
    const cacheInvalidationPromises = [
      cache.delPattern('products:*') // Invalidate all product list caches
    ];
    
    // Don't await - let it run in background
    Promise.all(cacheInvalidationPromises).catch(err => {
      logger.error('Error invalidating product cache:', err);
    });

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
    const productId = req.params.id;
    
    // Convert attributes objects to Maps for variants if present
    const updateData = { ...req.body };
    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((variant: any) => {
        const variantData = { ...variant };
        // Convert attributes object to Map if it exists
        if (variantData.attributes && typeof variantData.attributes === 'object' && !(variantData.attributes instanceof Map)) {
          const attributesMap = new Map<string, string>();
          Object.entries(variantData.attributes).forEach(([key, value]) => {
            if (key && value && typeof value === 'string') {
              attributesMap.set(key, value);
            }
          });
          variantData.attributes = attributesMap.size > 0 ? attributesMap : undefined;
        }
        return variantData;
      });
    }

    // Use findById + save instead of findByIdAndUpdate to trigger pre-save hooks
    // This ensures totalStock and inStock are recalculated from variants
    const product = await Product.findById(productId).lean(false); // Don't use lean() - we need the document instance

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== '__v' && updateData[key] !== undefined) {
        (product as any)[key] = updateData[key];
      }
    });

    // Save to trigger pre-save hooks (which will recalculate totalStock and inStock)
    await product.save();

    // Populate category after save (only needed fields for response)
    await product.populate('category', 'name slug');

    // Invalidate cache for this product and all product lists
    // Do this in parallel with response to not block the request
    const cacheInvalidationPromises = [
      cache.del(cacheKeys.product(productId)),
      cache.del(cacheKeys.product(product.slug)),
      cache.delPattern('products:*') // Invalidate all product list caches
    ];
    
    // Don't await - let it run in background
    Promise.all(cacheInvalidationPromises).catch(err => {
      logger.error('Error invalidating product cache:', err);
    });

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
