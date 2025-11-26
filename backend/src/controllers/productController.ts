import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

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

// Get all products with filters
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build query
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
      if (req.query.minPrice) query.basePrice.$gte = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) query.basePrice.$lte = parseFloat(req.query.maxPrice as string);
    }

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    // Filter by featured
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }

    // Filter by stock status
    if (req.query.inStock === 'true') {
      query.totalStock = { $gt: 0 };
    } else if (req.query.inStock === 'false') {
      query.totalStock = { $lte: 0 };
    }

    // Filter by minimum rating
    if (req.query.minRating) {
      query.averageRating = { $gte: parseFloat(req.query.minRating as string) };
    }

    // Sort
    let sortOptions: any = {};
    switch (req.query.sort) {
      case 'price-asc':
        sortOptions = { basePrice: 1 };
        break;
      case 'price-desc':
        sortOptions = { basePrice: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
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
    product = await Product.findOne({ slug: identifier })
      .populate('category', 'name slug')
      .lean(); // Use lean() for better performance
    
    if (!product) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        product = await Product.findById(identifier)
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
    const product = await Product.create(req.body);

    // Normalize _id to string
    const normalizedProduct = normalizeProductId(product);

    res.status(201).json({
      success: true,
      data: normalizedProduct
    });
  } catch (error) {
    next(error);
  }
};

// Update product (Admin)
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    Object.assign(product, req.body);
    
    // Save to trigger pre-save middleware
    await product.save();

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

// Delete product (Admin)
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get product stats (Admin)
export const getProductStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ inStock: false });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });

    // Get total inventory value
    const products = await Product.find();
    const totalValue = products.reduce((sum, product) => sum + (product.basePrice * product.totalStock), 0);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        outOfStock,
        featuredProducts,
        totalInventoryValue: totalValue
      }
    });
  } catch (error) {
    next(error);
  }
};



