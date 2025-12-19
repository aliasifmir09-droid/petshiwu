import mongoose, { Document, Schema } from 'mongoose';

export interface ICareGuide extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType: string; // References PetType slug (e.g., 'dog', 'cat', 'all')
  category: string; // Care guide category (e.g., 'Feeding', 'Grooming', 'Health', 'Training', 'Housing')
  author: mongoose.Types.ObjectId; // Reference to User
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  views: number;
  readingTime?: number; // Estimated reading time in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Difficulty level
  sections?: Array<{
    title: string;
    content: string;
    order: number;
  }>; // Structured sections for the guide
  relatedProducts?: mongoose.Types.ObjectId[]; // Related products that might help
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const careGuideSectionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const careGuideSchema = new Schema<ICareGuide>(
  {
    title: {
      type: String,
      required: [true, 'Care guide title is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Care guide content is required']
    },
    excerpt: {
      type: String,
      maxlength: 500,
      trim: true
    },
    featuredImage: {
      type: String
    },
    petType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      default: 'all'
    },
    category: {
      type: String,
      required: [true, 'Care guide category is required'],
      trim: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    readingTime: {
      type: Number,
      min: 1,
      default: 5
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    sections: [careGuideSectionSchema],
    relatedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    metaTitle: {
      type: String,
      maxlength: 60,
      trim: true
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Generate slug from title before saving
careGuideSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug || this.slug.trim() === '') {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }

  // Set publishedAt when isPublished changes to true
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Calculate reading time based on content length (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

// Indexes for performance
careGuideSchema.index({ petType: 1, category: 1, isPublished: 1, publishedAt: -1 }); // For filtering and sorting
careGuideSchema.index({ author: 1, isPublished: 1, publishedAt: -1 }); // For author-specific guides
careGuideSchema.index({ tags: 1, isPublished: 1, publishedAt: -1 }); // For tag-based filtering
careGuideSchema.index({ title: 'text', content: 'text', excerpt: 'text' }); // Full-text search
careGuideSchema.index({ difficulty: 1, isPublished: 1 }); // For difficulty filtering

export default mongoose.model<ICareGuide>('CareGuide', careGuideSchema);

