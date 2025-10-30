import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    images: [String],
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// One review per user per product per order
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

// Update product rating when review is saved
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const reviews = await mongoose.model('Review').find({ product: this.product, isApproved: true });
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length
  });
});

// Indexes for performance optimization
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 }); // Product reviews sorted by date
reviewSchema.index({ user: 1 }); // User's reviews
reviewSchema.index({ rating: 1 }); // Rating filtering

export default mongoose.model<IReview>('Review', reviewSchema);



