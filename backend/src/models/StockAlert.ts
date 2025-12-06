import mongoose, { Document, Schema } from 'mongoose';

export interface IStockAlert extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  email: string;
  isNotified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockAlertSchema = new Schema<IStockAlert>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    isNotified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  },
  {
    timestamps: true
  }
);

// One alert per user per product
stockAlertSchema.index({ product: 1, user: 1 }, { unique: true });
stockAlertSchema.index({ product: 1, isNotified: 1 });
stockAlertSchema.index({ user: 1 });
stockAlertSchema.index({ isNotified: 1, createdAt: 1 }); // For batch notification queries

export default mongoose.model<IStockAlert>('StockAlert', stockAlertSchema);

