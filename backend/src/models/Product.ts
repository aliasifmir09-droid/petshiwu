import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  // Legacy fields (kept for backward compatibility, deprecated)
  size?: string;
  weight?: string;
  
  // Flexible attributes system - can store any attribute (size, weight, flavor, color, material, etc.)
  attributes?: { [key: string]: string }; // e.g., { size: "5 lb", flavor: "Chicken", color: "Red" }
  
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  image?: string; // Primary variant image (optional)
  images?: string[]; // Variant image gallery (optional)
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: mongoose.Types.ObjectId;
  images: string[];
  video?: string; // Optional product video URL (Cloudinary supports video uploads)
  variants: IProductVariant[];
  basePrice: number;
  compareAtPrice?: number;
  averageRating: number;
  totalReviews: number;
  petType: string; // Dynamic pet type (references PetType slug)
  tags: string[];
  features: string[];
  ingredients?: string;
  isActive: boolean;
  isFeatured: boolean;
  inStock: boolean;
  totalStock: number;
  lowStockThreshold?: number; // Alert when stock falls below this number
  viewCount: number; // Track product views for trending calculation
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  // Legacy fields (kept for backward compatibility)
  size: String,
  weight: String,
  
  // Flexible attributes - can store any key-value pairs
  // Using Schema.Types.Mixed instead of Map for better JSON serialization
  attributes: {
    type: Map,
    of: String,
    default: undefined
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    required: true
    // Note: unique constraint removed - will create sparse unique index manually below
  },
  image: String, // Primary variant image URL (optional)
  images: [String] // Variant image gallery (optional)
});

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    shortDescription: {
      type: String,
      maxlength: 200
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    images: [{
      type: String,
      required: true
    }],
    video: {
      type: String,
      default: undefined // Optional product video URL (Cloudinary supports video uploads)
    },
    variants: [productVariantSchema],
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    petType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    tags: [String],
    features: [String],
    ingredients: String,
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    inStock: {
      type: Boolean,
      default: true
    },
    totalStock: {
      type: Number,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: null // null means use category default or global default
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Generate slug before validation
productSchema.pre('validate', function (next) {
  // Always generate slug if name exists and slug is missing/empty
  if (this.name && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Create slug from name before saving
// Import Elasticsearch utilities (at top of file, but adding here for context)
// import { indexProduct, removeProductFromIndex } from '../utils/elasticsearch';

productSchema.pre('save', function (next) {
  // Always generate slug if name is modified or slug is missing/empty
  if (this.isModified('name') || !this.slug || this.slug.trim() === '') {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  // Normalize petType to slug format (replace spaces with hyphens) for consistency
  if (this.isModified('petType') && this.petType) {
    this.petType = this.petType.toLowerCase().trim().replace(/\s+/g, '-');
  }
  
  // Always calculate total stock from variants (if variants exist)
  // This ensures totalStock and inStock are always in sync
  if (this.variants && this.variants.length > 0) {
    const calculatedTotalStock = this.variants.reduce((total, variant) => {
      const variantStock = variant.stock || 0;
      return total + variantStock;
    }, 0);
    this.totalStock = calculatedTotalStock;
    this.inStock = calculatedTotalStock > 0;
  } else {
    // If no variants, ensure inStock matches totalStock
    // If totalStock is set directly (e.g., during import), use it
    if (this.totalStock !== undefined && this.totalStock !== null) {
      this.inStock = this.totalStock > 0;
    } else {
      // If totalStock is not set and no variants, default to 0
      this.totalStock = 0;
      this.inStock = false;
    }
  }
  
  next();
});

// Indexes for performance optimization
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' }); // Text search
productSchema.index({ category: 1, isActive: 1, deletedAt: 1 }); // For filtering active products by category
productSchema.index({ petType: 1, isActive: 1, deletedAt: 1 }); // For filtering by pet type
// PERFORMANCE FIX: Add compound index for petType + sort=newest queries
// This optimizes queries like /api/products?petType=dog&sort=newest
productSchema.index({ petType: 1, isActive: 1, createdAt: -1, deletedAt: 1 }); // For petType + newest sorting
productSchema.index({ brand: 1, deletedAt: 1 }); // Brand filter
productSchema.index({ totalStock: 1, isActive: 1, deletedAt: 1 }); // Stock filtering
productSchema.index({ petType: 1, category: 1, isActive: 1, deletedAt: 1 }); // Compound index for common queries
productSchema.index({ deletedAt: 1 }); // For soft delete queries
productSchema.index({ isActive: 1, deletedAt: 1, createdAt: -1 }); // For default sorting with active filter
productSchema.index({ isActive: 1, deletedAt: 1, basePrice: 1 }); // For price sorting
productSchema.index({ isActive: 1, deletedAt: 1, averageRating: -1 }); // For rating sorting
productSchema.index({ slug: 1, isActive: 1, deletedAt: 1 }); // Slug lookup optimization
productSchema.index({ inStock: 1, isActive: 1 }); // In-stock filtering
productSchema.index({ averageRating: 1, totalReviews: 1 }); // Rating-based queries
productSchema.index({ brand: 1, isActive: 1 }); // Brand filtering with active status

// Additional compound indexes for optimized query patterns
productSchema.index({ 
  petType: 1, 
  category: 1, 
  isActive: 1, 
  inStock: 1 
}); // For filtered product listings with stock filter

productSchema.index({ 
  brand: 1, 
  petType: 1, 
  isActive: 1 
}); // For brand + pet type filtering

productSchema.index({ 
  averageRating: -1, 
  totalReviews: -1, 
  isActive: 1 
}); // For rating-based sorting (enhanced)

productSchema.index({ 
  basePrice: 1, 
  isActive: 1, 
  inStock: 1 
}); // For price-based sorting with stock filter

productSchema.index({ 
  createdAt: -1, 
  isActive: 1, 
  isFeatured: 1 
}); // For newest/featured products

// Optimized index for home page featured products query
productSchema.index({ 
  isFeatured: 1, 
  isActive: 1, 
  createdAt: -1 
}); // For featured products on home page (isFeatured=true, isActive=true)

// Create sparse unique index for variants.sku (only indexes non-null values)
// This allows multiple products with no variants (null SKUs) without duplicate key errors
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

// Indexes for aggregation queries optimization
productSchema.index({ basePrice: 1, category: 1, isActive: 1 }); // For price range aggregations
productSchema.index({ basePrice: 1, rating: 1 }); // For price and rating aggregations
productSchema.index({ category: 1, basePrice: 1 }); // For category-based price aggregations

// Note: slug, basePrice, averageRating, createdAt, isFeatured+isActive indexes already exist in schema

export default mongoose.model<IProduct>('Product', productSchema);



