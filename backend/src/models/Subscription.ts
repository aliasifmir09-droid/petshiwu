import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionItem {
  product: mongoose.Types.ObjectId;
  variant?: {
    size?: string;
    weight?: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  items: ISubscriptionItem[];
  shippingAddress: mongoose.Types.ObjectId;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly';
  nextDeliveryDate: Date;
  lastDeliveryDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
  discount: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionItemSchema = new Schema<ISubscriptionItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: String,
    weight: String,
    sku: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [subscriptionItemSchema],
      required: true,
      validate: [(array: any) => array.length > 0, 'Subscription must have at least one item']
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      required: true
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'],
      required: true,
      default: 'monthly'
    },
    nextDeliveryDate: {
      type: Date,
      required: true
    },
    lastDeliveryDate: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active'
    },
    discount: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);



