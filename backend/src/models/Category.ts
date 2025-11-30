import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: mongoose.Types.ObjectId;
  petType: string; // Dynamic pet type (references PetType slug or 'all')
  level: number; // 1 = Main Category, 2 = Subcategory, 3 = Sub-subcategory
  position: number; // Position/order for sorting in navbar (higher = appears later)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    slug: {
      type: String,
      lowercase: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    petType: {
      type: String,
      required: true,
      default: 'all',
      lowercase: true,
      trim: true
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    },
    position: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create slug from name and calculate level before saving
categorySchema.pre('save', async function (next) {
  // Always generate slug if name is modified or slug is missing/empty
  if (this.isModified('name') || !this.slug || this.slug.trim() === '') {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  // Calculate level based on parent category
  if (this.parentCategory) {
    try {
      const CategoryModel = mongoose.model<ICategory>('Category');
      const parent = await CategoryModel.findById(this.parentCategory);
      
      if (!parent) {
        return next(new Error('Parent category not found'));
      }

      const parentLevel = parent.level || 1;
      this.level = parentLevel + 1;
      
      // Enforce maximum 3 levels
      if (this.level > 3) {
        return next(new Error(`Maximum category depth is 3 levels. The selected parent category is at level ${parentLevel}, which would create a level ${this.level} category.`));
      }
    } catch (error: any) {
      return next(error);
    }
  } else {
    this.level = 1; // Root category
  }
  
  next();
});

// Indexes for performance optimization
categorySchema.index({ petType: 1, isActive: 1 }); // Pet type filtering
categorySchema.index({ parentCategory: 1 }); // Subcategory queries
categorySchema.index({ level: 1 }); // Level-based queries
categorySchema.index({ petType: 1, parentCategory: 1, position: 1 }); // Position sorting
// Compound unique indexes: Allow same name/slug for different petType or parentCategory combinations
// This allows "Food" to exist under both Dog and Cat categories
categorySchema.index({ name: 1, petType: 1, parentCategory: 1 }, { unique: true });
categorySchema.index({ slug: 1, petType: 1, parentCategory: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', categorySchema);



