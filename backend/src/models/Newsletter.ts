import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  source: string; // 'popup' | 'footer' | 'homepage'
  discountCodeSent: boolean;
  subscribedAt: Date;
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  ipAddress?: string;
}

const NewsletterSchema = new Schema<INewsletter>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  source: { type: String, default: 'homepage', enum: ['popup', 'footer', 'homepage', 'checkout'] },
  discountCodeSent: { type: Boolean, default: false },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribed: { type: Boolean, default: false },
  unsubscribedAt: { type: Date },
  ipAddress: { type: String },
});

NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ subscribedAt: -1 });

export default mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
