import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import ReorderReminder from '../models/ReorderReminder';
import { AuthRequest } from '../middleware/auth';
import { findOrderByIdentifier } from '../utils/orderIdentity';
import {
  REMINDER_WEEK_OPTIONS,
  aggregateBuyAgainItems,
  customerOrderFilter,
  isRestockConsumable,
  isValidReminderWeeks,
  isValidRestockMode,
  normalizeRestockMode,
  remindAtFromWeeks,
  sanitizeRestockItems,
  usualFromOrderItems,
  type RestockPick,
} from '../utils/buyAgain';
import { extractObjectId } from '../utils/types';
import logger from '../utils/logger';

const ownedOrderQuery = (req: AuthRequest) =>
  customerOrderFilter(req.user?._id, req.user?.email);

const serializeItems = (items: RestockPick[] | Array<{ product?: unknown; name: string; image?: string; quantity: number; sku?: string }> | undefined) =>
  (items || []).map((item) => ({
    product: item.product ? String(item.product) : '',
    name: item.name,
    image: item.image || '',
    quantity: item.quantity,
    ...(item.sku ? { sku: item.sku } : {}),
  }));

const serializeReminder = (reminder: {
  _id: unknown;
  order: unknown;
  orderNumber: string;
  weeks: number;
  mode?: string;
  remindAt: Date;
  status: string;
  items?: Array<{ product?: unknown; name: string; image?: string; quantity: number; sku?: string }>;
}) => ({
  _id: String(reminder._id),
  orderId: String(reminder.order),
  orderNumber: reminder.orderNumber,
  weeks: reminder.weeks,
  mode: normalizeRestockMode(reminder.mode),
  remindAt: reminder.remindAt,
  status: reminder.status,
  items: serializeItems(reminder.items),
});

export const getBuyAgain = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const orders = await Order.find(ownedOrderQuery(req))
      .sort({ createdAt: -1 })
      .limit(50)
      .select('orderNumber orderStatus paymentStatus createdAt totalPrice items guestEmail')
      .lean();

    const lastOrder = orders.find((order) => order.orderStatus !== 'cancelled') || null;
    const regulars = aggregateBuyAgainItems(orders)
      .map((item) => ({
        ...item,
        restockable: isRestockConsumable(item.name),
      }))
      .slice(0, 24);
    const reminder = await ReorderReminder.findOne({
      user: req.user._id,
      status: 'scheduled',
    })
      .sort({ remindAt: 1 })
      .lean();

    const usual = reminder?.items?.length
      ? serializeItems(reminder.items)
      : usualFromOrderItems(lastOrder?.items);

    res.status(200).json({
      success: true,
      data: {
        lastOrder: lastOrder
          ? {
              _id: String(lastOrder._id),
              orderNumber: lastOrder.orderNumber,
              orderStatus: lastOrder.orderStatus,
              createdAt: lastOrder.createdAt,
              totalPrice: lastOrder.totalPrice,
              items: (lastOrder.items || []).map((item) => ({
                ...item,
                restockable: isRestockConsumable(item.name || ''),
              })),
            }
          : null,
        usual,
        regulars,
        reminder: reminder ? serializeReminder(reminder) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReorderReminder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const weeks = Number(req.body?.weeks);
    if (!isValidReminderWeeks(weeks)) {
      return res.status(400).json({
        success: false,
        message: `Choose ${REMINDER_WEEK_OPTIONS.join(', ')} weeks, then pick Ask first (5% off, max $10) or Autoship (7% off, max $10).`,
      });
    }

    const mode = req.body?.mode;
    if (!isValidRestockMode(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Choose Ask first (5% off when you confirm) or Autoship (7% off on schedule). We never charge unless you pay.',
      });
    }

    const order = await findOrderByIdentifier(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userId = extractObjectId(req.user._id);
    const orderUserId = extractObjectId(order.user);
    const email = String(req.user.email || '').trim().toLowerCase();
    const guestEmail = String(order.guestEmail || '').trim().toLowerCase();
    const ownsOrder = Boolean(
      (userId && orderUserId && userId.equals(orderUserId)) ||
      (email && guestEmail && email === guestEmail)
    );
    if (!ownsOrder) {
      return res.status(403).json({ success: false, message: 'Not authorized to set a reminder for this order' });
    }
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot set a reminder on a cancelled order' });
    }

    const customItems = sanitizeRestockItems(req.body?.items);
    const items = customItems.length ? customItems : usualFromOrderItems(order.items);
    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Pick food or treats to restock. Toys and gear skip the restock list — add what they actually run out of.',
      });
    }

    await ReorderReminder.updateMany(
      { user: req.user._id, status: 'scheduled' },
      { $set: { status: 'cancelled' } }
    );

    const remindAt = remindAtFromWeeks(weeks);
    const reminder = await ReorderReminder.create({
      user: req.user._id,
      order: order._id,
      orderNumber: order.orderNumber,
      email: email || guestEmail,
      firstName: req.user.firstName || order.shippingAddress?.firstName || 'there',
      weeks,
      mode,
      remindAt,
      status: 'scheduled',
      items,
    });

    const message =
      mode === 'ask'
        ? `Ask first is on. We'll email you in ${weeks} weeks. Confirm then for 5% off (max $10). We never charge unless you confirm and pay.`
        : `Autoship is on. We'll email you in ${weeks} weeks. Ship then for 7% off (max $10). We still never charge unless you pay.`;

    res.status(200).json({
      success: true,
      message,
      data: serializeReminder(reminder),
    });
  } catch (error) {
    logger.error('Failed to create reorder reminder:', error);
    next(error);
  }
};

export const cancelReorderReminder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
    }

    const reminder = await ReorderReminder.findOne({ _id: id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    reminder.status = 'cancelled';
    await reminder.save();
    res.status(200).json({
      success: true,
      message: 'Restock plan stopped. You can pick Ask first or Autoship any time.',
    });
  } catch (error) {
    next(error);
  }
};
