import mongoose, { Document, Schema } from 'mongoose';

export type ContactSubmissionType = 'investor' | 'vendor' | 'press' | 'general';

export interface IContactSubmission extends Document {
  type: ContactSubmissionType;
  name: string;
  email: string;
  company?: string;
  website?: string;
  investmentRange?: string;
  productCategory?: string;
  message: string;
  emailSent: boolean;
  emailError?: string;
  ipAddress?: string;
  userAgent?: string;
  receivedAt: Date;
  read: boolean;
  readAt?: Date;
  readBy?: string;
  notes?: string;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>({
  type: { type: String, required: true, enum: ['investor', 'vendor', 'press', 'general'], index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  company: { type: String, trim: true },
  website: { type: String, trim: true },
  investmentRange: { type: String, trim: true },
  productCategory: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  emailSent: { type: Boolean, default: false },
  emailError: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  receivedAt: { type: Date, default: Date.now, index: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  readBy: { type: String },
  notes: { type: String },
});

ContactSubmissionSchema.index({ receivedAt: -1 });
ContactSubmissionSchema.index({ type: 1, receivedAt: -1 });

export default mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);
