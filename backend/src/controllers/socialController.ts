import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';

// Generate social sharing links for a product
export const getProductShareLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const product = await Product.findById(id)
      .select('name slug images shortDescription')
      .lean();

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

