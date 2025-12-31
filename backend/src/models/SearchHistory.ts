import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchHistory extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string; // For anonymous users
  query: string;
  filters?: {
    category?: string;
    petType?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  };
  resultsCount?: number;
  clickedResults?: Array<{
    productId: mongoose.Types.ObjectId;
    position: number;
    clickedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    query: {
      type: String,
      required: true,
      index: true,
    },
    filters: {
      category: String,
      petType: String,
      brand: String,
      minPrice: Number,
      maxPrice: Number,
      minRating: Number,
      inStock: Boolean,
    },
    resultsCount: {
      type: Number,
    },
    clickedResults: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        position: Number,
        clickedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ sessionId: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1, createdAt: -1 });
searchHistorySchema.index({ createdAt: -1 }); // For cleanup queries

// TTL index to auto-delete old search history (90 days)
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema);

export default SearchHistory;

