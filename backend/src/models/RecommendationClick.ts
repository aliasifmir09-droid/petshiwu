import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendationClick extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  productId: mongoose.Types.ObjectId; // Product that was recommended
  sourceProductId?: mongoose.Types.ObjectId; // Product from which recommendation was shown
  recommendationType: 'frequently-bought-together' | 'customers-also-bought' | 'you-may-also-like' | 'similar-products' | 'trending' | 'personalized';
  position: number; // Position in recommendation list (0-based)
  clickedAt: Date;
  createdAt: Date;
}

const recommendationClickSchema = new Schema<IRecommendationClick>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true
    },
    sessionId: {
      type: String,
      index: true,
      sparse: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    sourceProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
      sparse: true
    },
    recommendationType: {
      type: String,
      enum: ['frequently-bought-together', 'customers-also-bought', 'you-may-also-like', 'similar-products', 'trending', 'personalized'],
      required: true,
      index: true
    },
    position: {
      type: Number,
      required: true,
      min: 0
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for analytics queries
recommendationClickSchema.index({ recommendationType: 1, clickedAt: -1 });
recommendationClickSchema.index({ productId: 1, recommendationType: 1, clickedAt: -1 });
recommendationClickSchema.index({ sourceProductId: 1, recommendationType: 1, clickedAt: -1 });
recommendationClickSchema.index({ userId: 1, clickedAt: -1 });
recommendationClickSchema.index({ sessionId: 1, clickedAt: -1 });

const RecommendationClick = mongoose.model<IRecommendationClick>('RecommendationClick', recommendationClickSchema);

export default RecommendationClick;

