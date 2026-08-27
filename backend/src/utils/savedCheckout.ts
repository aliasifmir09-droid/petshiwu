import Stripe from 'stripe';
import User, { IUser } from '../models/User';
import PaymentMethod from '../models/PaymentMethod';
import { IAddress } from '../models/User';
import logger from './logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

export type SavedShipping = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
};

export const normalizeAddressKey = (street: string, zipCode: string): string =>
  `${String(street || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()}|${String(zipCode || '')
    .replace(/\s+/g, '')
    .toUpperCase()}`;

export const upsertShippingOnUser = (
  addresses: Array<Pick<IAddress, 'street' | 'city' | 'state' | 'zipCode' | 'country' | 'isDefault'>>,
  shipping: SavedShipping
): boolean => {
  if (!String(shipping.street || '').trim() || !String(shipping.zipCode || '').trim()) {
    return false;
  }

  const key = normalizeAddressKey(shipping.street, shipping.zipCode);
  const existing = addresses.find(
    (addr) => normalizeAddressKey(addr.street, addr.zipCode) === key
  );

  if (existing) {
    existing.street = shipping.street.trim();
    existing.city = shipping.city;
    existing.state = shipping.state;
    existing.zipCode = shipping.zipCode;
    existing.country = shipping.country || existing.country || 'USA';
    if (!addresses.some((addr) => addr.isDefault)) {
      existing.isDefault = true;
    }
    return true;
  }

  addresses.push({
    street: shipping.street.trim(),
    city: shipping.city,
    state: shipping.state,
    zipCode: shipping.zipCode,
    country: shipping.country || 'USA',
    isDefault: addresses.length === 0,
  } as IAddress);
  return true;
};

/**
 * Create or reuse a Stripe Customer for a logged-in shopper so cards can be
 * attached and charged again on a later visit.
 */
export const getOrCreateStripeCustomer = async (user: IUser): Promise<string> => {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing && !('deleted' in existing && existing.deleted)) {
        return user.stripeCustomerId;
      }
    } catch (err) {
      logger.warn('Stored Stripe customer was missing; creating a new one', {
        userId: String(user._id),
        stripeCustomerId: user.stripeCustomerId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    metadata: { userId: String(user._id) },
  });

  user.stripeCustomerId = customer.id;
  await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
  return customer.id;
};

/**
 * Upsert shipping onto the user profile so the next checkout can skip the form.
 */
export const rememberShippingAddress = async (
  userId: string,
  shipping: SavedShipping
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) return;
  if (!user.addresses) user.addresses = [];
  if (!upsertShippingOnUser(user.addresses, shipping)) return;
  await user.save();
};

/**
 * After a successful PaymentIntent, attach the card to the Stripe Customer and
 * store last4/brand on the user so checkout can reuse it without asking again.
 */
export const rememberPaidCardForUser = async (
  user: IUser,
  paymentIntentId: string
): Promise<void> => {
  if (!process.env.STRIPE_SECRET_KEY) return;

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    if (intent.status !== 'succeeded' && intent.status !== 'requires_capture') {
      return;
    }
    if (intent.metadata?.saveForReuse === 'false') {
      return;
    }

    const pm = intent.payment_method;
    if (!pm || typeof pm === 'string') return;
    const card = pm.card;
    if (!card?.last4 || !card.brand) return;

    const stripePmId = pm.id;
    const customerId = await getOrCreateStripeCustomer(user);

    if (typeof pm.customer !== 'string' || pm.customer !== customerId) {
      try {
        await stripe.paymentMethods.attach(stripePmId, { customer: customerId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (!/already been attached/i.test(message)) {
          logger.warn('Could not attach Stripe payment method for reuse', {
            userId: String(user._id),
            stripePmId,
            message,
          });
          return;
        }
      }
    }

    const existing = await PaymentMethod.findOne({
      user: user._id,
      stripePaymentMethodId: stripePmId,
    });
    if (existing) return;

    const hasDefault = await PaymentMethod.exists({ user: user._id, isDefault: true });
    await PaymentMethod.create({
      user: user._id,
      type: 'credit_card',
      last4: card.last4,
      brand: card.brand,
      expiryMonth: card.exp_month,
      expiryYear: card.exp_year,
      stripePaymentMethodId: stripePmId,
      isDefault: !hasDefault,
    });
  } catch (err) {
    logger.warn('Failed to remember paid card for user', {
      userId: String(user._id),
      paymentIntentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
