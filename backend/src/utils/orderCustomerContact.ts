export type OrderNotifySource = {
  _id?: unknown;
  user?: unknown;
  guestEmail?: string;
  orderNumber?: string;
  orderStatus?: string;
  totalPrice?: number;
  trackingNumber?: string | null;
  isPaid?: boolean;
  createdAt?: Date;
  deliveredAt?: Date;
  items?: Array<{ name: string; quantity: number; price: number; image?: string }>;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

export type CustomerContact = {
  email: string;
  firstName: string;
  phone: string;
};

export const mergeCustomerContact = (
  order: OrderNotifySource,
  user?: { email?: string; firstName?: string; phone?: string } | null
): CustomerContact => {
  const email = (order.guestEmail || user?.email || '').trim().toLowerCase();
  const firstName = (order.shippingAddress?.firstName || user?.firstName || '').trim() || 'Customer';
  const phone = (order.shippingAddress?.phone || user?.phone || '').trim();
  return { email, firstName, phone };
};
