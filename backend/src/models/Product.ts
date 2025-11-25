import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  size?: string;
  weight?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: mongoose.Types.ObjectId;
  images: string[];
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
  autoshipEligible: boolean;
  autoshipDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  size: String,
  weight: String,
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
    required: true,
    unique: true
  }
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
    autoshipEligible: {
      type: Boolean,
      default: false
    },
    autoshipDiscount: {
      type: Number,
      min: 0,
      max: 100
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
productSchema.pre('save', function (next) {
  // Always generate slug if name is modified or slug is missing/empty
  if (this.isModified('name') || !this.slug || this.slug.trim() === '') {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  
  // Calculate total stock from variants
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((total, variant) => total + variant.stock, 0);
    this.inStock = this.totalStock > 0;
  }
  
  next();
});

// Indexes for performance optimization
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' }); // Text search
productSchema.index({ category: 1, isActive: 1 }); // For filtering active products by category
productSchema.index({ petType: 1, isActive: 1 }); // For filtering by pet type
productSchema.index({ brand: 1 }); // Brand filter
productSchema.index({ totalStock: 1, isActive: 1 }); // Stock filtering
productSchema.index({ petType: 1, category: 1, isActive: 1 }); // Compound index for common queries
// Note: slug, variants.sku, basePrice, averageRating, createdAt, isFeatured+isActive indexes already exist in schema

export default mongoose.model<IProduct>('Product', productSchema);



