# Donation Payment Setup Guide

## Overview
The donation system is now integrated with Stripe for secure payment processing. Follow these steps to set up and receive donations in your account.

## Step 1: Install Stripe Package

In the `backend` directory, install Stripe:

```bash
cd backend
npm install stripe
npm install --save-dev @types/stripe
```

## Step 2: Get Your Stripe API Keys

1. Go to [https://stripe.com](https://stripe.com) and create an account (or log in)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
   - Use **Test keys** for development
   - Use **Live keys** for production

## Step 3: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook verification in production)
```

**Important:** Never commit your secret keys to Git!

## Step 4: How Donations Work

### Current Flow:
1. User selects donation amount and payment method
2. Frontend calls `/api/donations/create-intent` to create a Stripe Payment Intent
3. Backend creates a donation record with status "pending"
4. Payment is processed through Stripe
5. Webhook confirms payment and updates donation status to "paid"

### Money Flow:
- **Stripe** processes the payment
- Money goes to your **Stripe account**
- Stripe transfers funds to your **connected bank account** (usually within 2-7 business days)
- You can view all transactions in your Stripe Dashboard

## Step 5: Set Up Webhook (Production Only)

For production, set up Stripe webhooks to automatically confirm donations:

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-backend-url.com/api/donations/webhook`
4. Select events: `payment_intent.succeeded` and `payment_intent.payment_failed`
5. Copy the **Signing secret** and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 6: View Donations

### In Your Database:
Donations are stored in the `donations` collection with:
- `donationNumber`: Unique identifier (e.g., DON-1234567890-1234)
- `amount`: Donation amount
- `paymentStatus`: 'pending', 'paid', 'failed', or 'refunded'
- `paymentIntentId`: Stripe payment intent ID
- `donorEmail`, `donorFirstName`, `donorLastName`: Donor information

### In Stripe Dashboard:
- Go to **Payments** to see all transactions
- Go to **Customers** to see donor information
- Go to **Balance** to see your account balance and transfers

## Step 7: Frontend Stripe Integration (Optional Enhancement)

For better security, you can integrate Stripe.js Elements on the frontend:

1. Install Stripe.js:
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

2. Update `frontend/src/pages/Donate.tsx` to use Stripe Elements for card input (more secure than manual input)

## Testing

### Test Mode:
- Use Stripe test keys (start with `sk_test_`)
- Use test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Use any future expiry date and any 3-digit CVC

### Production:
- Switch to live keys (start with `sk_live_`)
- Real payments will be processed
- Funds will be transferred to your bank account

## Security Notes

1. **Never store card details** - Stripe handles all sensitive payment data
2. **Always use HTTPS** in production
3. **Validate webhook signatures** (already implemented)
4. **Keep your secret keys secure** - never expose them in frontend code

## Troubleshooting

### Payment Intent Creation Fails:
- Check your Stripe secret key is correct
- Verify the amount is valid (minimum $0.50)
- Check backend logs for error details

### Webhook Not Working:
- Verify webhook URL is accessible
- Check webhook secret matches in Stripe dashboard
- Ensure webhook endpoint is receiving POST requests

### Donations Not Confirming:
- Check Stripe dashboard for payment status
- Verify webhook is set up correctly
- Manually confirm via `/api/donations/confirm` endpoint if needed

## Admin Features

You can view all donations via the API:
- `GET /api/donations/admin/all` - List all donations (admin only)
- `GET /api/donations/admin/stats` - Get donation statistics (admin only)

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application issues, check the backend logs and error messages.

