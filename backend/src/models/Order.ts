import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryProof {
  photoUrl?: string;
  photoData?: Buffer;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
  recipientName?: string;
  handoffMethod: 'handed_to_customer' | 'handed_to_household_member' | 'left_at_door' | 'left_with_doorman' | 'other';
  notes?: string;
  storageKey?: string;
  storageProvider?: 'bunny' | 'local' | 'mongodb';
  mimeType?: string;
}

export interface IDeliveryProofNotification {
  status: 'queued' | 'sent' | 'failed' | 'skipped_no_email';
  attempts: number;
  queuedAt?: Date;
  sentAt?: Date;
  messageId?: string;
  lastError?: string;
}

export interface IDeliveryLocation {
  address: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  provider?: string;
}

export interface IDelivery {
  origin?: {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  destination?: IDeliveryLocation;
  distanceMeters?: number;
  durationSeconds?: number;
  calculatedAt?: Date;
  routingProvider?: string;
  navigationUrl?: string;
  status?: 'ready' | 'assigned' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';
  runId?: mongoose.Types.ObjectId;
  stopOrder?: number;
  notes?: string;
  proof?: IDeliveryProof;
  proofNotification?: IDeliveryProofNotification;
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    weight?: string;
    attributes?: { [key: string]: string };
    sku: string;
  };
  isReviewed?: boolean;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId; // Optional — null for guest orders
  guestEmail?: string;            // Email for guest orders
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  paymentIntentId?: string;
  paypalOrderId?: string;
  paypalCheckoutToken?: string;
  delivery?: IDelivery;
  isDelivered: boolean;
  deliveredAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  image: {
    type: String,
    required: false,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: {
    size: String,
    weight: String,
    attributes: {
      type: Map,
      of: String,
      default: undefined
    },
    sku: String
  },
  isReviewed: {
    type: Boolean,
    default: false
  }
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  phone: { type: String, required: true }
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    // GUEST CHECKOUT: user is now optional
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    // GUEST CHECKOUT: email stored for guest orders
    guestEmail: {
      type: String,
      required: false,
      trim: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(array: any) => array.length > 0, 'Order must have at least one item']
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    billingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'cod'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    donationAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paymentIntentId: String,
    paypalOrderId: String,
    paypalCheckoutToken: String,
    delivery: {
      origin: {
        label: String,
        address: String,
        latitude: Number,
        longitude: Number
      },
      destination: {
        address: String,
        formattedAddress: String,
        latitude: Number,
        longitude: Number,
        placeId: String,
        provider: String
      },
      distanceMeters: Number,
      durationSeconds: Number,
      calculatedAt: Date,
      routingProvider: String,
      navigationUrl: String,
      status: {
        type: String,
        enum: ['ready', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
        default: 'ready'
      },
      runId: { type: Schema.Types.ObjectId, ref: 'DeliveryRun' },
      stopOrder: Number,
      notes: String,
      // Optional nested schema: leftover empty proof from routing must not fail later saves.
      // A handoff method is only required once actual proof media exists.
      proof: {
        type: new Schema({
          photoUrl: { type: String, required: false, select: false },
          photoData: { type: Buffer, required: false, select: false },
          uploadedAt: { type: Date, required: false },
          uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
          recipientName: String,
          handoffMethod: {
            type: String,
            enum: ['handed_to_customer', 'handed_to_household_member', 'left_at_door', 'left_with_doorman', 'other'],
            required: function (this: { photoUrl?: string; photoData?: Buffer; storageKey?: string }) {
              return Boolean(this.photoUrl || this.photoData || this.storageKey);
            },
            set: (value: unknown) => {
              if (typeof value !== 'string') return value;
              const trimmed = value.trim();
              return trimmed === '' ? undefined : trimmed;
            }
          },
          notes: String,
          storageKey: { type: String, select: false },
          storageProvider: { type: String, enum: ['bunny', 'local', 'mongodb'], select: false },
          mimeType: { type: String, select: false }
        }, { _id: false }),
        required: false,
        default: undefined
      },
      proofNotification: {
        status: { type: String, enum: ['queued', 'sent', 'failed', 'skipped_no_email'] },
        attempts: { type: Number, default: 0 },
        queuedAt: Date,
        sentAt: Date,
        messageId: String,
        lastError: String
      }
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    trackingNumber: String,
    notes: String
  },
  {
    timestamps: true
  }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ paypalOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ paypalCheckoutToken: 1 }, { unique: true, sparse: true });
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ 'items.product': 1, orderStatus: 1 });
orderSchema.index({ orderStatus: 1, 'items.product': 1 });
orderSchema.index({ createdAt: -1, orderStatus: 1 });
orderSchema.index({ user: 1, paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ isPaid: 1, isDelivered: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1 }); // Index for guest order lookups

export default mongoose.model<IOrder>('Order', orderSchema);
