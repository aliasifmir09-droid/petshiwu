import mongoose, { Document, Schema } from 'mongoose';
import type { IShippingAddress } from './Order';
import type { NormalizedOrderItem } from '../types/common';

export type PendingPayPalCheckoutStatus = 'created' | 'creating' | 'captured' | 'finalizing' | 'finalized' | 'failed';

export interface IPendingPayPalCheckout extends Document {
  checkoutToken: string;
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  items: NormalizedOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  notes?: string;
  couponCode?: string;
  donationAmount: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  currency: string;
  paypalOrderId?: string;
  createStartedAt?: Date;
  status: PendingPayPalCheckoutStatus;
  capturedAt?: Date;
  finalizedOrder?: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const pendingCheckoutItemSchema = new Schema<NormalizedOrderItem>({
  product: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    sku: String,
    size: String
  }
}, { _id: false });

const shippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  phone: { type: String, required: true }
}, { _id: false });

const pendingPayPalCheckoutSchema = new Schema<IPendingPayPalCheckout>({
  checkoutToken: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  guestEmail: { type: String, trim: true, required: false },
  items: { type: [pendingCheckoutItemSchema], required: true },
  shippingAddress: { type: shippingAddressSchema, required: true },
  billingAddress: { type: shippingAddressSchema, required: false },
  notes: { type: String, trim: true, required: false },
  couponCode: { type: String, trim: true, required: false },
  donationAmount: { type: Number, required: true, min: 0, default: 0 },
  itemsPrice: { type: Number, required: true, min: 0 },
  shippingPrice: { type: Number, required: true, min: 0 },
  taxPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  paypalOrderId: { type: String, sparse: true, unique: true },
  createStartedAt: Date,
  status: {
    type: String,
    enum: ['created', 'creating', 'captured', 'finalizing', 'finalized', 'failed'],
    required: true,
    default: 'created'
  },
  capturedAt: Date,
  finalizedOrder: { type: Schema.Types.ObjectId, ref: 'Order', required: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model<IPendingPayPalCheckout>('PendingPayPalCheckout', pendingPayPalCheckoutSchema);
