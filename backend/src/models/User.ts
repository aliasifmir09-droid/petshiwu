import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface IPermissions {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManageCategories: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
  permissions?: IPermissions;
  isActive: boolean;
  addresses: IAddress[];
  wishlist: mongoose.Types.ObjectId[];
  passwordChangedAt?: Date;
  passwordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordExpired(): boolean;
  getDaysUntilPasswordExpires(): number;
}

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      default: 'customer'
    },
    permissions: {
      canManageProducts: { type: Boolean, default: false },
      canManageOrders: { type: Boolean, default: false },
      canManageCustomers: { type: Boolean, default: false },
      canManageCategories: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addresses: [addressSchema],
    wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    passwordChangedAt: {
      type: Date
    },
    passwordExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Only set password change date for admin and staff users
  if (this.role === 'admin' || this.role === 'staff') {
    this.passwordChangedAt = new Date();
    // Set expiration to 30 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    this.passwordExpiresAt = expirationDate;
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password is expired (only for admin and staff)
userSchema.methods.isPasswordExpired = function (): boolean {
  if (this.role !== 'admin' && this.role !== 'staff') {
    return false; // Customers don't have password expiry
  }
  
  if (!this.passwordExpiresAt) {
    return true; // If no expiration date set, force password change
  }
  
  return new Date() > this.passwordExpiresAt;
};

// Get days until password expires
userSchema.methods.getDaysUntilPasswordExpires = function (): number {
  if (this.role !== 'admin' && this.role !== 'staff') {
    return Infinity; // Customers don't have password expiry
  }
  
  if (!this.passwordExpiresAt) {
    return 0; // Already expired
  }
  
  const now = new Date();
  const diffTime = this.passwordExpiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

// Performance indexes
userSchema.index({ email: 1 }); // Index for email lookups (unique already creates index)
userSchema.index({ role: 1, isActive: 1 }); // For filtering users by role
userSchema.index({ createdAt: -1 }); // For sorting by registration date

export default mongoose.model<IUser>('User', userSchema);



