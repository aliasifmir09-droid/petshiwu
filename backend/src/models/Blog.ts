import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType: string; // References PetType slug (e.g., 'dog', 'cat', 'all')
  category: string; // Blog category (e.g., 'Dog Care', 'Cat Care', 'Fish Care', 'New Pet')
  author: mongoose.Types.ObjectId; // Reference to User
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
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
      required: [true, 'Blog content is required']
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
      required: [true, 'Blog category is required'],
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
blogSchema.pre('save', function (next) {
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

  next();
});

// Indexes for performance
// Note: slug index is automatically created by unique: true, so we don't need to define it again
blogSchema.index({ petType: 1, isPublished: 1, publishedAt: -1 }); // Filter by pet type and published status
blogSchema.index({ category: 1, isPublished: 1, publishedAt: -1 }); // Filter by category
blogSchema.index({ petType: 1, category: 1, isPublished: 1 }); // Compound index for common queries
blogSchema.index({ author: 1, createdAt: -1 }); // Author's blogs
blogSchema.index({ tags: 1, isPublished: 1 }); // Tag-based queries
blogSchema.index({ isPublished: 1, publishedAt: -1 }); // Published blogs sorted by date
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' }); // Full-text search

export default mongoose.model<IBlog>('Blog', blogSchema);

