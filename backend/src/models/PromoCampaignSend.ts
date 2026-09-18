import mongoose, { Document, Schema } from 'mongoose';

export interface IPromoCampaignSend extends Document {
  campaignId: string;
  email: string;
  firstName?: string;
  status: 'sent' | 'failed' | 'skipped';
  messageId?: string;
  error?: string;
  sentAt: Date;
}

const promoCampaignSendSchema = new Schema<IPromoCampaignSend>(
  {
    campaignId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], required: true },
    messageId: { type: String },
    error: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

promoCampaignSendSchema.index({ campaignId: 1, email: 1 }, { unique: true });

export default mongoose.model<IPromoCampaignSend>('PromoCampaignSend', promoCampaignSendSchema);
