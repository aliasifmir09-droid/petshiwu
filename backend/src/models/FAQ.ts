import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string; // FAQ category (e.g., 'Shipping', 'Returns', 'Products', 'Orders', 'Account', 'Payment')
  petType?: string; // Optional: Filter by pet type (e.g., 'dog', 'cat', 'all')
  order: number; // Display order within category
  isPublished: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true,
      maxlength: 500
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'FAQ category is required'],
      trim: true,
      enum: ['Shipping', 'Returns', 'Products', 'Orders', 'Account', 'Payment', 'General', 'Autoship', 'Gift Cards', 'Pet Care']
    },
    petType: {
      type: String,
      lowercase: true,
      trim: true,
      default: 'all'
    },
    order: {
      type: Number,
      default: 0,
      min: 0
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for performance
faqSchema.index({ category: 1, petType: 1, isPublished: 1, order: 1 }); // For filtering and sorting
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' }); // Full-text search
faqSchema.index({ category: 1, order: 1 }); // For category ordering

export default mongoose.model<IFAQ>('FAQ', faqSchema);

