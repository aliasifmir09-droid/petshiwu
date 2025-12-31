import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  variant?: {
    sku?: string;
    size?: string;
    weight?: string;
    attributes?: Map<string, string>;
  };
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface ICart extends Document {
  user?: mongoose.Types.ObjectId; // Optional - can be null for guest carts
  sessionId?: string; // For guest carts
  shareId?: string; // Unique ID for cart sharing
  items: ICartItem[];
  lastUpdated: Date;
  abandonedAt?: Date; // When cart was marked as abandoned
  recoveryEmailSent?: boolean; // Whether recovery email was sent
  recoveryEmailSentAt?: Date; // When recovery email was sent
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    sku: String,
    size: String,
    weight: String,
    attributes: {
      type: Map,
      of: String
    }
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
  },
  name: {
    type: String,
    required: true
  },
  image: String
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true
    },
    abandonedAt: Date,
    recoveryEmailSent: {
      type: Boolean,
      default: false
    },
    recoveryEmailSentAt: Date
  },
  {
    timestamps: true
  }
);

// Generate share ID before saving if not present
cartSchema.pre('save', function (next) {
  if (!this.shareId && this.items.length > 0) {
    // Generate a unique share ID
    this.shareId = `cart_${this._id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  this.lastUpdated = new Date();
  next();
});

// Index for finding abandoned carts
cartSchema.index({ abandonedAt: 1, recoveryEmailSent: 1 });
cartSchema.index({ lastUpdated: 1 }); // For finding old carts

const Cart = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;

