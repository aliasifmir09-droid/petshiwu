import mongoose, { Document, Schema } from 'mongoose';

export interface IReturnItem {
  orderItem: mongoose.Types.ObjectId; // Reference to order item
  product: mongoose.Types.ObjectId;
  quantity: number;
  reason: string;
  condition: 'unopened' | 'opened' | 'damaged' | 'defective';
}

export interface IReturn extends Document {
  returnNumber: string;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: IReturnItem[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  refundStatus: 'pending' | 'processing' | 'refunded' | 'failed';
  refundAmount: number;
  refundMethod: 'original' | 'store_credit';
  rmaNumber: string; // Return Merchandise Authorization number
  returnAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  notes?: string;
  adminNotes?: string;
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>({
  orderItem: {
    type: Schema.Types.ObjectId,
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    enum: ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged', 'other']
  },
  condition: {
    type: String,
    required: true,
    enum: ['unopened', 'opened', 'damaged', 'defective']
  }
});

const returnSchema = new Schema<IReturn>(
  {
    returnNumber: {
      type: String,
      unique: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [returnItemSchema],
      required: true,
      validate: [(array: any) => array.length > 0, 'Return must have at least one item']
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'refunded', 'failed'],
      default: 'pending'
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundMethod: {
      type: String,
      enum: ['original', 'store_credit'],
      default: 'original'
    },
    rmaNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    returnAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    trackingNumber: String,
    notes: String,
    adminNotes: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

// Generate return number before saving
returnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.returnNumber = `RET-${timestamp}-${random}`;
  }
  
  // Generate RMA number when approved
  if (this.status === 'approved' && !this.rmaNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.rmaNumber = `RMA-${timestamp}-${random}`;
    this.approvedAt = new Date();
  }
  
  // Set completed date when status changes to completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Indexes
returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ order: 1 });
returnSchema.index({ status: 1, createdAt: -1 });
returnSchema.index({ rmaNumber: 1 });
returnSchema.index({ returnNumber: 1 });

export default mongoose.model<IReturn>('Return', returnSchema);

