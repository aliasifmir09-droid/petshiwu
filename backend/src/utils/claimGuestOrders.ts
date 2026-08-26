import crypto from 'crypto';
import Order from '../models/Order';
import User from '../models/User';
import logger from './logger';

export const normalizeAccountEmail = (email: string): string =>
  String(email || '').trim().toLowerCase();

export const guestOrderMatch = (email: string) => {
  const normalized = normalizeAccountEmail(email);
  return {
    $and: [
      { $or: [{ user: { $exists: false } }, { user: null }] },
      { guestEmail: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ],
  };
};

export const attachGuestOrdersToUser = async (
  userId: unknown,
  email: string
): Promise<number> => {
  const normalized = normalizeAccountEmail(email);
  if (!userId || !normalized) return 0;
  const result = await Order.updateMany(guestOrderMatch(normalized), {
    $set: { user: userId },
  });
  const count = result.modifiedCount || 0;
  if (count > 0) {
    logger.info(`Attached ${count} guest order(s) to ${normalized}`);
  }
  return count;
};

/**
 * If this email placed guest orders but has no login, create a customer
 * so password-reset can give them access to My Orders.
 */
export const ensureCustomerForGuestEmail = async (email: string) => {
  const normalized = normalizeAccountEmail(email);
  const existing = await User.findOne({ email: normalized }).select(
    '+passwordResetToken +passwordResetExpires'
  );
  if (existing) return existing;

  const latestGuest = await Order.findOne(guestOrderMatch(normalized)).sort({ createdAt: -1 });
  if (!latestGuest) return null;

  const firstName = latestGuest.shippingAddress?.firstName?.trim() || 'Pet';
  const lastName = latestGuest.shippingAddress?.lastName?.trim() || 'Parent';
  const tempPassword = `Tmp${crypto.randomBytes(12).toString('hex')}Aa1`;

  const user = await User.create({
    firstName,
    lastName,
    email: normalized,
    password: tempPassword,
    phone: latestGuest.shippingAddress?.phone,
    emailVerified: true,
    role: 'customer',
  });

  await attachGuestOrdersToUser(user._id, normalized);
  logger.info(`Created customer account from guest orders for ${normalized}`);
  return user;
};
