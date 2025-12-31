import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';

// Helper function to build SEO-friendly product URL (matches frontend format)
const buildProductUrl = (product: any, frontendUrl: string): string => {
  const productSlug = product.slug || product._id?.toString() || '';
  
  // If no category or category is just a string ID, use simple URL
  if (!product.category || typeof product.category === 'string') {
    return `${frontendUrl}/products/${productSlug}`;
  }

  const category = product.category;
  const petType = product.petType || 'products';
  
  // Build category path from hierarchy (from root to current category)
  const buildCategoryPath = (cat: any, visited = new Set<string>()): string[] => {
    const path: string[] = [];
    
    const buildPathRecursive = (current: any): void => {
      if (!current || path.length >= 3) return;
      
      const catId = current._id?.toString() || '';
      if (visited.has(catId)) return; // Prevent circular references
      visited.add(catId);
      
      // If has parent, build parent path first
      if (current.parentCategory && typeof current.parentCategory === 'object') {
        buildPathRecursive(current.parentCategory);
      }
      
      // Then add current category slug
      if (current.slug) {
        path.push(current.slug);
      }
    };
    
    buildPathRecursive(cat);
    return path;
  };

  const categoryPath = buildCategoryPath(category);
  
  // If we have category path, use SEO-friendly URL
  if (categoryPath.length > 0) {
    const validPetType = petType || 'products';
    return `${frontendUrl}/${validPetType}/${categoryPath.join('/')}/${productSlug}`;
  }
  
  // Fallback to simple URL
  return `${frontendUrl}/products/${productSlug}`;
};

// Helper function to normalize image URL to absolute URL
const normalizeImageUrl = (imageUrl: string | undefined | null, backendUrl: string): string => {
  if (!imageUrl) {
    return '';
  }

  // Already a full URL (http:// or https://) - includes Cloudinary URLs
  // In production, only allow HTTPS for security
  const isProduction = process.env.NODE_ENV === 'production';
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('http://')) {
    if (isProduction) {
      // In production, reject HTTP URLs for security (mixed content)
      logger.warn('HTTP image URL rejected in production:', imageUrl);
      return ''; // Return empty string to indicate invalid URL
    }
    // In development, allow HTTP for local testing
    return imageUrl;
  }

  // Relative path starting with /uploads
  if (imageUrl.startsWith('/uploads/')) {
    return `${backendUrl}${imageUrl}`;
  }

  // Relative path without leading slash
  if (imageUrl.startsWith('uploads/')) {
    return `${backendUrl}/${imageUrl}`;
  }

  return imageUrl;
};

// Generate social sharing links for a product
export const getProductShareLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, ''); // Remove trailing slashes
    const backendUrl = (process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, ''); // Remove /api suffix if present

    // Get current product with category populated - try slug first, then ID
    let product = await Product.findOne({ slug: identifier, deletedAt: null })
      .populate({
        path: 'category',
        select: 'name slug parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: {
            path: 'parentCategory',
            select: 'name slug'
          }
        }
      })
      .select('name slug images shortDescription category petType')
      .lean();
    
    if (!product) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        product = await Product.findById(identifier)
          .populate({
            path: 'category',
            select: 'name slug parentCategory',
            populate: {
              path: 'parentCategory',
              select: 'name slug parentCategory',
              populate: {
                path: 'parentCategory',
                select: 'name slug'
              }
            }
          })
          .select('name slug images shortDescription category petType')
          .lean();
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

    // Build SEO-friendly product URL (matches frontend format)
    // Frontend uses BrowserRouter, so clean URLs without hash
    const productUrl = buildProductUrl(product, frontendUrl);
    const productName = product.name;
    const productDescription = product.shortDescription || product.name;
    
    // Get first image and normalize to absolute URL for social media previews
    const rawImageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
    const productImage = normalizeImageUrl(rawImageUrl, backendUrl);

    // Encode for URL
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedText = encodeURIComponent(`${productName} - ${productDescription}`);
    const encodedImage = encodeURIComponent(productImage);

    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodedText}%20${encodedUrl}`,
      copyLink: productUrl // For copy to clipboard - must match frontend interface
    };

    res.status(200).json({
      success: true,
      data: {
        product: {
          name: productName,
          url: productUrl,
          image: productImage
        },
        shareLinks
      }
    });
  } catch (error) {
    next(error);
  }
};

