import mongoose, { Document, Schema } from 'mongoose';

export interface ISlideshow extends Document {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  backgroundColor?: string;
  theme: 'holiday' | 'product' | 'wellness' | 'treats' | 'custom';
  isActive: boolean;
  order: number; // For ordering slides
  createdAt: Date;
  updatedAt: Date;
}

const slideshowSchema = new Schema<ISlideshow>(
  {
    title: {
      type: String,
      required: false,
      trim: true,
      default: 'Banner',
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    subtitle: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [150, 'Subtitle cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    buttonText: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [50, 'Button text cannot exceed 50 characters']
    },
    buttonLink: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    backgroundColor: {
      type: String,
      trim: true,
      default: 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    },
    theme: {
      type: String,
      enum: ['holiday', 'product', 'wellness', 'treats', 'custom'],
      default: 'product'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for ordering and active status
slideshowSchema.index({ order: 1, isActive: 1 });

// Index for active slides only
slideshowSchema.index({ isActive: 1, order: 1 });

const Slideshow = mongoose.model<ISlideshow>('Slideshow', slideshowSchema);

export default Slideshow;

