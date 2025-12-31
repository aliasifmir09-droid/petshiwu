import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentMethod extends Document {
  user: mongoose.Types.ObjectId;
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  stripePaymentMethodId?: string; // Stripe Payment Method ID (for credit cards, Apple Pay, Google Pay)
  paypalAccountId?: string; // PayPal account ID (if applicable)
  last4?: string; // Last 4 digits of card
  brand?: string; // Card brand (visa, mastercard, etc.)
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const billingAddressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' }
}, { _id: false });

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    stripePaymentMethodId: {
      type: String,
      sparse: true, // Allows null values while still indexing
      index: true
    },
    paypalAccountId: {
      type: String,
      sparse: true
    },
    last4: {
      type: String,
      maxlength: 4
    },
    brand: {
      type: String
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      min: new Date().getFullYear()
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    billingAddress: billingAddressSchema
  },
  {
    timestamps: true
  }
);

// Compound index for user and default payment method
paymentMethodSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Unset other default payment methods for this user
    await mongoose.model<IPaymentMethod>('PaymentMethod').updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;

