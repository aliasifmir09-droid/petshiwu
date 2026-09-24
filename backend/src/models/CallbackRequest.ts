import mongoose, { Document, Schema } from 'mongoose';

export type CallbackRequestStatus = 'open' | 'called' | 'closed';

export interface ICallbackRequest extends Document {
  phone: string;
  displayPhone: string;
  name?: string;
  message?: string;
  pagePath?: string;
  emailSent: boolean;
  emailError?: string;
  status: CallbackRequestStatus;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const CallbackRequestSchema = new Schema<ICallbackRequest>({
  phone: { type: String, required: true, trim: true, index: true },
  displayPhone: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  message: { type: String, trim: true },
  pagePath: { type: String, trim: true },
  emailSent: { type: Boolean, default: false },
  emailError: { type: String },
  status: { type: String, enum: ['open', 'called', 'closed'], default: 'open', index: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

CallbackRequestSchema.index({ createdAt: -1 });
CallbackRequestSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.model<ICallbackRequest>('CallbackRequest', CallbackRequestSchema);
