import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

// Get reviews for a product with sorting
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || 'newest';

    const query: any = { product: req.params.productId, isApproved: true };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating as string);
    }

    // Build sort
    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'most_helpful':
        sortOption = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName')  // Show firstName and lastName
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      ratingDistribution: ratingDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};

// Vote on review helpfulness
export const voteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    const hasVotedHelpful = review.helpfulUsers?.some((id: any) => id.toString() === userId.toString());
    const hasVotedNotHelpful = review.notHelpfulUsers?.some((id: any) => id.toString() === userId.toString());

    if (helpful === true) {
      if (hasVotedHelpful) {
        // Remove helpful vote
        review.helpfulUsers = review.helpfulUsers?.filter((id: any) => id.toString() !== userId.toString()) || [];
        review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
      } else {
        // Add helpful vote, remove not helpful if exists
        if (hasVotedNotHelpful) {
          review.notHelpfulUsers = review.notHelpfulUsers?.filter((id: any) => id.toString() !== userId.toString()) || [];
          review.notHelpfulCount = Math.max(0, (review.notHelpfulCount || 0) - 1);
        }
        if (!review.helpfulUsers) review.helpfulUsers = [];
        review.helpfulUsers.push(userId as any);
        review.helpfulCount = (review.helpfulCount || 0) + 1;
      }
    } else if (helpful === false) {
      if (hasVotedNotHelpful) {
        // Remove not helpful vote
        review.notHelpfulUsers = review.notHelpfulUsers?.filter((id: any) => id.toString() !== userId.toString()) || [];
        review.notHelpfulCount = Math.max(0, (review.notHelpfulCount || 0) - 1);
      } else {
        // Add not helpful vote, remove helpful if exists
        if (hasVotedHelpful) {
          review.helpfulUsers = review.helpfulUsers?.filter((id: any) => id.toString() !== userId.toString()) || [];
          review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
        }
        if (!review.notHelpfulUsers) review.notHelpfulUsers = [];
        review.notHelpfulUsers.push(userId as any);
        review.notHelpfulCount = (review.notHelpfulCount || 0) + 1;
      }
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded',
      data: {
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount,
        userVoted: helpful === true ? 'helpful' : helpful === false ? 'not_helpful' : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create review
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { product, orderId, rating, title, comment, images, videos } = req.body;

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
      images: images || undefined,
      videos: videos || undefined,
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

    const { rating, title, comment, images, videos } = req.body;

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images !== undefined ? images : review.images;
    review.videos = videos !== undefined ? videos : review.videos;

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



