import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  body: string;
  variables: string[]; // Available variables like {{customerName}}, {{orderNumber}}, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true
    },
    body: {
      type: String,
      required: [true, 'Email body is required']
    },
    variables: {
      type: [String],
      default: []
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

// Indexes
// Note: name field already has unique: true which creates an index automatically
emailTemplateSchema.index({ isActive: 1 });

export default mongoose.model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);

