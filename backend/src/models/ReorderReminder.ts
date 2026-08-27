import mongoose, { Document, Schema } from 'mongoose';

export interface IReorderReminder extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  email: string;
  firstName: string;
  weeks: number;
  /** ask = email then confirm/pay for 7% off. autoship = email on schedule, regular price, still no charge until they pay. */
  mode: 'ask' | 'autoship';
  remindAt: Date;
  status: 'scheduled' | 'sent' | 'cancelled';
  items: Array<{ name: string; quantity: number }>;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reorderReminderSchema = new Schema<IReorderReminder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    weeks: { type: Number, required: true, min: 2, max: 8 },
    mode: {
      type: String,
      enum: ['ask', 'autoship'],
      default: 'ask',
    },
    remindAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        _id: false,
      },
    ],
    sentAt: Date,
  },
  { timestamps: true }
);

reorderReminderSchema.index({ user: 1, order: 1, status: 1 });
reorderReminderSchema.index({ status: 1, remindAt: 1 });

export default mongoose.model<IReorderReminder>('ReorderReminder', reorderReminderSchema);
