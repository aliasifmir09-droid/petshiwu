import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';

// Generate social sharing links for a product
export const getProductShareLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Get current product - try slug first, then ID
    let product = await Product.findOne({ slug: identifier, deletedAt: null })
      .select('name slug images shortDescription')
      .lean();
    
    if (!product) {
      // Try finding by ID if it's a valid MongoDB ObjectId
      try {
        product = await Product.findById(identifier)
          .select('name slug images shortDescription')
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

    const productUrl = `${frontendUrl}/product/${product.slug || id}`;
    const productName = product.name;
    const productDescription = product.shortDescription || product.name;
    const productImage = product.images && product.images.length > 0 ? product.images[0] : '';

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
      copy: productUrl // For copy to clipboard
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

