export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: Category;
  petType: 'dog' | 'cat' | 'other-animals' | 'all';
  position?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  // Legacy fields (kept for backward compatibility, deprecated)
  size?: string;
  weight?: string;
  
  // Flexible attributes system - can store any attribute (size, weight, flavor, color, material, etc.)
  attributes?: { [key: string]: string }; // e.g., { size: "5 lb", flavor: "Chicken", color: "Red" }
  
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  image?: string; // Primary variant image (optional)
  images?: string[]; // Variant image gallery (optional)
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: Category | string;
  images: string[];
  variants: ProductVariant[];
  basePrice: number;
  compareAtPrice?: number;
  averageRating: number;
  totalReviews: number;
  reviewCount?: number;
  petType: 'dog' | 'cat' | 'other-animals';
  tags: string[];
  features: string[];
  ingredients?: string;
  isActive: boolean;
  isFeatured: boolean;
  inStock: boolean;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    firstName: string;
  };
  order?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string; // Legacy field
    weight?: string; // Legacy field
    attributes?: { [key: string]: string }; // Flexible attributes
    sku: string;
  };
  isReviewed?: boolean;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}



