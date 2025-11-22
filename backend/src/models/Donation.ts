import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  donationNumber: string;
  user?: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string; // Stripe payment intent ID
  transactionId?: string; // PayPal or other gateway transaction ID
  donorEmail: string;
  donorFirstName: string;
  donorLastName: string;
  isAnonymous: boolean;
  message?: string;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donationNumber: {
      type: String,
      unique: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Donations can be from non-registered users
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentIntentId: {
      type: String,
      required: false
    },
    transactionId: {
      type: String,
      required: false
    },
    donorEmail: {
      type: String,
      required: true
    },
    donorFirstName: {
      type: String,
      required: true
    },
    donorLastName: {
      type: String,
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      maxlength: 500
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  },
  {
    timestamps: true
  }
);

// Generate donation number before saving
donationSchema.pre('save', async function (next) {
  if (!this.donationNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.donationNumber = `DON-${timestamp}-${random}`;
  }
  next();
});

// Indexes for performance
donationSchema.index({ user: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.model<IDonation>('Donation', donationSchema);

export default Donation;

