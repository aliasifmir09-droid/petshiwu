import mongoose, { Schema, Document } from 'mongoose';

export interface ICouponUsage extends Document {
  email: string;
  code: string;
  orderId?: string;
  usedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>({
  email:   { type: String, required: true, lowercase: true, trim: true },
  code:    { type: String, required: true, uppercase: true, trim: true },
  orderId: { type: String },
  usedAt:  { type: Date, default: Date.now },
});

// One code per email — enforce at DB level
CouponUsageSchema.index({ email: 1, code: 1 }, { unique: true });

export default mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);
