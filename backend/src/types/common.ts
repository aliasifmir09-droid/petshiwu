/**
 * Common TypeScript types to replace 'as any' usages
 */

import type mongoose from 'mongoose';

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

// Express handler types
export type AsyncRequestHandler = (
  req: AuthRequest | Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// Error types
export interface ApiError extends Error {
  statusCode?: number;
  code?: string | number;
  errors?: Record<string, { message: string }>;
}

export interface MongooseValidationError extends Error {
  errors?: Record<string, { message: string }>;
  code?: number;
}

// Stripe types (when Stripe is optional)
export interface StripeInstance {
  paymentIntents: {
    create: (params: StripePaymentIntentParams) => Promise<StripePaymentIntent>;
    retrieve: (id: string) => Promise<StripePaymentIntent>;
    confirm: (id: string, params?: { payment_method?: string }) => Promise<StripePaymentIntent>;
  };
  refunds: {
    create: (params: StripeRefundParams) => Promise<StripeRefund>;
  };
}

export interface StripePaymentIntentParams {
  amount: number;
  currency: string;
  payment_method_types: string[];
  metadata?: Record<string, string>;
}

export interface StripePaymentIntent {
  id: string;
  client_secret: string | null;
  status: string;
  amount: number;
  currency: string;
}

export interface StripeRefundParams {
  payment_intent: string;
  amount?: number;
  reason?: string;
}

export interface StripeRefund {
  id: string;
  amount: number;
  status: string;
}

// Order item types
export interface OrderItemInput {
  product: string | { _id: string; name?: string; [key: string]: unknown };
  variant?: {
    sku: string;
    size?: string;
    [key: string]: unknown;
  };
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface NormalizedOrderItem {
  product: string;
  variant?: {
    sku: string;
    size?: string;
  };
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Order types
export interface OrderInput {
  items: OrderItemInput[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  notes?: string;
  paymentIntentId?: string;
  paypalOrderId?: string;
}

export interface NormalizedOrder {
  _id: string;
  orderNumber: string;
  user: string;
  items: NormalizedOrderItem[];
  shippingAddress: Record<string, unknown>;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// Sanitization types
export interface SanitizedObject {
  [key: string]: string | number | boolean | null | SanitizedObject | SanitizedObject[];
}

// Product types for CSV import
export interface ProductInput {
  name: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  basePrice: number;
  compareAtPrice?: number;
  petType: string;
  images?: string[];
  tags?: string[];
  features?: string[];
  ingredients?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  stock?: number;
  variantSize?: string;
  variantPrice?: number;
  variantStock?: number;
  variantSku?: string;
}

// Category cache types
export interface CategoryCacheEntry {
  id: mongoose.Types.ObjectId;
  name: string;
}

