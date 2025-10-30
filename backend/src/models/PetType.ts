import mongoose, { Document, Schema } from 'mongoose';

export interface IPetType extends Document {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const petTypeSchema = new Schema<IPetType>(
  {
    name: {
      type: String,
      required: [true, 'Pet type name is required'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    icon: {
      type: String,
      default: '🐾'
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Generate slug before validation
petTypeSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Generate slug before saving
petTypeSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug || this.slug.trim() === '') {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Indexes for performance
// Note: slug index is created automatically by unique: true
petTypeSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IPetType>('PetType', petTypeSchema);

