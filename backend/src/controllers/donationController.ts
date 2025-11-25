import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Donation from '../models/Donation';
import { AuthRequest } from '../middleware/auth';

// Initialize Stripe (optional - only if STRIPE_SECRET_KEY is set)
let stripe: any = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Dynamic import to avoid errors if stripe package isn't installed
    // @ts-ignore - Stripe may not be installed, handled in try-catch
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
} catch (error) {
  // Stripe package not installed - donations will not work
  // This is okay if donations are not being used
}

// Create payment intent for donation
export const createDonationIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, paymentMethod, email, firstName, lastName } = req.body;

    // Validate amount
    if (!amount || amount < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Donation amount must be at least $0.50'
      });
    }

    // Validate payment method
    const validMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing not configured. Please set STRIPE_SECRET_KEY in environment variables.'
      });
    }

    // Create Stripe Payment Intent
    // Amount is in cents, so multiply by 100
    const amountInCents = Math.round(amount * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: paymentMethod === 'credit_card' 
          ? ['card'] 
          : paymentMethod === 'apple_pay' 
          ? ['card', 'apple_pay'] 
          : paymentMethod === 'google_pay'
          ? ['card', 'google_pay']
          : ['card'],
        metadata: {
          donation: 'true',
          donorEmail: email,
          donorName: `${firstName} ${lastName}`
        }
      });

      // Create donation record with pending status
      const donation = await Donation.create({
        amount,
        paymentMethod,
        paymentStatus: 'pending',
        paymentIntentId: paymentIntent.id,
        donorEmail: email,
        donorFirstName: firstName,
        donorLastName: lastName,
        user: req.user?._id || undefined,
        isPaid: false
      });

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          donationId: donation._id,
          donationNumber: donation.donationNumber
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return res.status(500).json({
        success: false,
        message: 'Payment processing error: ' + (stripeError.message || 'Unknown error')
      });
    }
  } catch (error: any) {
    console.error('Donation intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create donation intent'
    });
  }
};

// Confirm donation payment (webhook or direct confirmation)
export const confirmDonation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { donationId, paymentIntentId } = req.body;

    if (!donationId && !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Donation ID or Payment Intent ID is required'
      });
    }

    // Find donation
    const donation = await Donation.findOne({
      $or: [
        { _id: donationId },
        { paymentIntentId: paymentIntentId }
      ]
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Verify payment with Stripe
    if (donation.paymentIntentId) {
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: 'Payment processing not configured.'
        });
      }
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(donation.paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
          donation.paymentStatus = 'paid';
          donation.isPaid = true;
          donation.paidAt = new Date();
          await donation.save();

          return res.status(200).json({
            success: true,
            message: 'Donation confirmed successfully',
            data: donation
          });
        } else {
          donation.paymentStatus = 'failed';
          await donation.save();

          return res.status(400).json({
            success: false,
            message: 'Payment not completed',
            paymentStatus: paymentIntent.status
          });
        }
      } catch (stripeError: any) {
        console.error('Stripe verification error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify payment'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error: any) {
    console.error('Confirm donation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm donation'
    });
  }
};

// Get donation by ID
export const getDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Only allow user to see their own donation or admin
    if (req.user && donation.user && donation.user.toString() !== req.user._id.toString()) {
      if (!req.user.role || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this donation'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get donation'
    });
  }
};

// Get all donations (admin only)
export const getAllDonations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email');

    const total = await Donation.countDocuments();

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get donations'
    });
  }
};

// Get donation statistics
export const getDonationStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalDonations = await Donation.countDocuments({ paymentStatus: 'paid' });
    const totalAmount = await Donation.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyStats = await Donation.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDonations,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get donation statistics'
    });
  }
};

// Stripe webhook handler (for production)
export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: 'Stripe not configured'
    });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({
      success: false,
      message: 'Webhook secret not configured'
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    
    // Update donation status
    const donation = await Donation.findOne({ paymentIntentId: paymentIntent.id });
    if (donation) {
      donation.paymentStatus = 'paid';
      donation.isPaid = true;
      donation.paidAt = new Date();
      await donation.save();
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;
    
    // Update donation status to failed
    const donation = await Donation.findOne({ paymentIntentId: paymentIntent.id });
    if (donation) {
      donation.paymentStatus = 'failed';
      await donation.save();
    }
  }

  res.json({ received: true });
};

