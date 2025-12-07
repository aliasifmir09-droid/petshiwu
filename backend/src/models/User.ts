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
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  addresses: IAddress[];
  wishlist: mongoose.Types.ObjectId[];
  passwordChangedAt?: Date;
  passwordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordExpired(): boolean;
  getDaysUntilPasswordExpires(): number;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
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
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false // Don't include in queries by default
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false // Don't include in queries by default
    },
    passwordResetExpires: {
      type: Date,
      select: false
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
    // Auto-verify admin and staff emails (they're created by admins)
    this.emailVerified = true;
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

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 1 hour
  const { PASSWORD_RESET_EXPIRY_HOURS } = require('../config/constants');
  this.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
  
  return token;
};

// Performance indexes
userSchema.index({ role: 1, isActive: 1 }); // For filtering users by role
userSchema.index({ createdAt: -1 }); // For sorting by registration date
userSchema.index({ email: 1, emailVerified: 1 }); // Email verification queries
userSchema.index({ 'addresses._id': 1 }); // Address lookups
// Note: email index is created automatically by unique: true

export default mongoose.model<IUser>('User', userSchema);



