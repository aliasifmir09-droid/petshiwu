import User from '../models/User';
import logger from './logger';
import { addEmailJob } from './jobQueue';
import * as emailService from './emailService';
import * as smsService from './smsService';
import { mergeCustomerContact, OrderNotifySource } from './orderCustomerContact';

export type { OrderNotifySource, CustomerContact } from './orderCustomerContact';
export { mergeCustomerContact } from './orderCustomerContact';

export const resolveOrderCustomerContact = async (order: OrderNotifySource) => {
  let user: { email?: string; firstName?: string; phone?: string } | null = null;
  if (order.user) {
    try {
      user = await User.findById(order.user).select('email firstName phone').lean();
    } catch (error) {
      logger.warn('Could not load order customer user for notification', error);
    }
  }
  return mergeCustomerContact(order, user);
};

const shippingForEmail = (order: OrderNotifySource) => ({
  firstName: order.shippingAddress?.firstName || 'Customer',
  lastName: order.shippingAddress?.lastName || '',
  street: order.shippingAddress?.street || '',
  city: order.shippingAddress?.city || '',
  state: order.shippingAddress?.state || '',
  zipCode: order.shippingAddress?.zipCode || '',
  country: order.shippingAddress?.country || 'USA'
});

const itemsForEmail = (order: OrderNotifySource) =>
  (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    image: item.image
  }));

export const notifyCustomerOfOrderStatusChange = async (
  order: OrderNotifySource,
  previousStatus: string | undefined,
  newStatus: string,
  options?: { cancellationReason?: string; refundAmount?: number }
): Promise<{ email: boolean; sms: boolean }> => {
  if (!newStatus || newStatus === previousStatus) {
    return { email: false, sms: false };
  }

  const contact = await resolveOrderCustomerContact(order);
  const orderNumber = order.orderNumber || '';
  let emailSent = false;
  let smsSent = false;

  if (contact.email) {
    try {
      await addEmailJob(
        'order-status',
        { email: contact.email, orderNumber, status: newStatus },
        async () => {
          if (newStatus === 'cancelled') {
            await emailService.sendOrderCancellationEmail(contact.email, contact.firstName, orderNumber, {
              items: itemsForEmail(order),
              totalPrice: order.totalPrice || 0,
              cancellationReason: options?.cancellationReason || 'Updated by Petshiwu',
              refundAmount: options?.refundAmount,
              createdAt: order.createdAt || new Date()
            });
            return;
          }
          if (newStatus === 'delivered') {
            await emailService.sendOrderDeliveredEmail(contact.email, contact.firstName, orderNumber, {
              items: itemsForEmail(order),
              totalPrice: order.totalPrice || 0,
              trackingNumber: order.trackingNumber || undefined,
              deliveredAt: order.deliveredAt || new Date(),
              shippingAddress: shippingForEmail(order)
            });
            return;
          }
          await emailService.sendOrderStatusEmail(contact.email, contact.firstName, orderNumber, {
            status: newStatus,
            trackingNumber: order.trackingNumber,
            totalPrice: order.totalPrice || 0,
            shippingAddress: shippingForEmail(order)
          });
        }
      );
      emailSent = true;
    } catch (error) {
      logger.error(`Failed to send status email for order ${orderNumber}:`, error);
    }
  } else {
    logger.warn(`No customer email on order ${orderNumber}; skipped status email`);
  }

  if (contact.phone) {
    try {
      const result = await smsService.sendSms(
        contact.phone,
        smsService.buildOrderStatusSms(orderNumber, newStatus, order.trackingNumber)
      );
      smsSent = result.sent;
      if (!result.sent && result.skippedReason && result.skippedReason !== 'not_configured') {
        logger.warn(`SMS not sent for order ${orderNumber}: ${result.skippedReason}`);
      }
    } catch (error) {
      logger.error(`Failed to send status SMS for order ${orderNumber}:`, error);
    }
  }

  return { email: emailSent, sms: smsSent };
};
