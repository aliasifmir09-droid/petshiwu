import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

// Get reviews for a product
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { product: req.params.productId, isApproved: true };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating as string);
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName')  // Only show firstName (username)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
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

// Create review
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { product, orderId, rating, title, comment, images } = req.body;

    // Check if order exists and is delivered
    const order = await Order.findOne({
      _id: orderId,
      user: req.user?._id,
      orderStatus: 'delivered'
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or not delivered yet'
      });
    }

    // Check if product is in the order
    const orderItem = order.items.find((item: any) => item.product.toString() === product);
    
    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Check if already reviewed for this order
    const existingReview = await Review.findOne({
      product,
      user: req.user?._id,
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    const review = await Review.create({
      product,
      user: req.user?._id,
      order: orderId,
      rating,
      title: title || undefined,
      comment: comment || undefined,
      images,
      verifiedPurchase: true  // Always true for order-based reviews
    });

    // Mark order item as reviewed
    const itemIndex = order.items.findIndex((item: any) => item.product.toString() === product);
    if (itemIndex !== -1) {
      (order.items[itemIndex] as any).isReviewed = true;
      await order.save();
    }

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Update review
export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns the review
    if (review.user.toString() !== (req.user?._id as any)?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, title, comment, images } = req.body;

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns the review or is admin
    if (review.user.toString() !== (req.user?._id as any)?.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};



