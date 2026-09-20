import { TONIGHT } from '@/data/tonightDelivery';
import { lookupZip, type DeliverySpeed } from '@/utils/deliveryZip';

export type TrackableOrder = {
  orderStatus?: string;
  paymentStatus?: string;
  isPaid?: boolean;
  paidAt?: string | Date;
  createdAt?: string | Date;
  deliveredAt?: string | Date;
  trackingNumber?: string;
  shippingAddress?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  delivery?: {
    status?: string;
  } | null;
};

export type TrackingStepId = 'received' | 'packing' | 'out' | 'delivered';

export type TrackingStep = {
  id: TrackingStepId;
  label: string;
  hint: string;
  done: boolean;
  current: boolean;
  at?: string | Date;
};

export type OrderTrackingView = {
  headline: string;
  detail: string;
  nextStep: string;
  expectedLabel: string;
  expectedHint: string;
  speed: DeliverySpeed;
  area: string;
  paid: boolean;
  cancelled: boolean;
  failed: boolean;
  steps: TrackingStep[];
  supportPhone: string;
  isLocalDelivery: boolean;
};

const SUPPORT_PHONE = TONIGHT.phone;

const nyDateParts = (value: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'),
  };
};

const nyNoon = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 16, 0, 0));

export const addNyCalendarDays = (value: Date, days: number): Date => {
  const parts = nyDateParts(value);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 16, 0, 0));
  return shifted;
};

export const formatNyLongDate = (value: Date): string =>
  value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });

export const formatNyDateTime = (value: string | Date): string =>
  new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

export const expectedArrivalFromOrder = (zip: string, orderedAt: Date) => {
  const lookup = lookupZip(zip, orderedAt);
  const speed = lookup?.speed || 'standard';
  const sameDay = speed === 'same-day' && lookup && !lookup.cutoffPassed;
  const when = sameDay ? nyNoon(nyDateParts(orderedAt).year, nyDateParts(orderedAt).month, nyDateParts(orderedAt).day) : addNyCalendarDays(orderedAt, 1);
  const dayLabel = formatNyLongDate(when);
  if (speed === 'standard') {
    return {
      speed,
      area: lookup?.area || 'the US',
      when,
      label: 'Delivery date after nationwide shipping opens',
      hint: 'This ZIP is outside our current delivery area.',
    };
  }
  if (sameDay) {
    return {
      speed: 'same-day' as const,
      area: lookup?.area || '',
      when,
      label: `Tonight before ${TONIGHT.deliverBy}`,
      hint: `Same-day ${lookup?.area}. We aim to arrive before ${TONIGHT.deliverBy} ET.`,
    };
  }
  return {
    speed: 'next-day' as const,
    area: lookup?.area || '',
    when,
    label: `${dayLabel} before ${TONIGHT.deliverBy}`,
    hint: lookup?.area
      ? `Next-day delivery to ${lookup.area}. Packed in Queens.`
      : 'Next-day delivery. Packed in Queens.',
  };
};

const deliveryStage = (order: TrackableOrder): TrackingStepId | 'cancelled' | 'failed' => {
  const orderStatus = String(order.orderStatus || 'pending').toLowerCase();
  const deliveryStatus = String(order.delivery?.status || '').toLowerCase();
  if (orderStatus === 'cancelled' || deliveryStatus === 'cancelled') return 'cancelled';
  if (deliveryStatus === 'failed') return 'failed';
  if (orderStatus === 'delivered' || deliveryStatus === 'delivered') return 'delivered';
  if (deliveryStatus === 'out_for_delivery' || deliveryStatus === 'assigned' || orderStatus === 'shipped') {
    return 'out';
  }
  if (orderStatus === 'processing') return 'packing';
  return 'received';
};

export const describeOrderTracking = (order: TrackableOrder): OrderTrackingView => {
  const zip = order.shippingAddress?.zipCode || '';
  const orderedAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const arrival = expectedArrivalFromOrder(zip, orderedAt);
  const paid = order.paymentStatus === 'paid' || Boolean(order.isPaid) || Boolean(order.paidAt);
  const stage = deliveryStage(order);
  const cancelled = stage === 'cancelled';
  const failed = stage === 'failed';
  const stageOrder: TrackingStepId[] = ['received', 'packing', 'out', 'delivered'];
  const currentId: TrackingStepId = cancelled || failed ? 'received' : stage;
  const currentIndex = stageOrder.indexOf(currentId);

  const steps: TrackingStep[] = [
    {
      id: 'received',
      label: 'Order received',
      hint: paid ? 'Paid. It’s in our Queens warehouse.' : 'We have the order ticket.',
      done: !cancelled && !failed,
      current: currentId === 'received' && !cancelled && !failed,
      at: order.paidAt || order.createdAt,
    },
    {
      id: 'packing',
      label: 'Packed in Queens',
      hint: 'Pulled and checked at the warehouse.',
      done: currentIndex >= 1,
      current: currentId === 'packing',
    },
    {
      id: 'out',
      label: 'Out for delivery',
      hint: 'Our driver to your door — not UPS.',
      done: currentIndex >= 2,
      current: currentId === 'out',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      hint: 'At your door.',
      done: currentId === 'delivered',
      current: currentId === 'delivered',
      at: order.deliveredAt,
    },
  ];

  if (cancelled) {
    return {
      headline: 'This order was cancelled',
      detail: 'Nothing is on the way. If you were charged, the refund follows the original payment method.',
      nextStep: 'Call us if you did not mean to cancel, or place a new order.',
      expectedLabel: 'Not delivering',
      expectedHint: '',
      speed: arrival.speed,
      area: arrival.area,
      paid,
      cancelled: true,
      failed: false,
      steps: steps.map((step) => ({ ...step, done: false, current: false })),
      supportPhone: SUPPORT_PHONE,
      isLocalDelivery: arrival.speed !== 'standard',
    };
  }

  if (failed) {
    return {
      headline: 'Delivery did not complete',
      detail: 'The driver could not finish this drop-off. We will call or retry — you will not be left guessing.',
      nextStep: `Call ${SUPPORT_PHONE}. A person answers 24/7.`,
      expectedLabel: 'Needs a quick call',
      expectedHint: '',
      speed: arrival.speed,
      area: arrival.area,
      paid,
      cancelled: false,
      failed: true,
      steps,
      supportPhone: SUPPORT_PHONE,
      isLocalDelivery: arrival.speed !== 'standard',
    };
  }

  const copy: Record<TrackingStepId, { headline: string; detail: string; nextStep: string }> = {
    received: {
      headline: 'We have your order',
      detail: paid
        ? 'Payment is in. We are lining this up to pack in Queens — that is our warehouse, not a walk-in store.'
        : 'We received the order. Payment still needs to clear before we pack.',
      nextStep: `Next: we pack in Queens, then a driver comes to your door. Expected ${arrival.label}.`,
    },
    packing: {
      headline: 'Packing in Queens',
      detail: 'Your items are being pulled and checked. No carrier tracking number — this leaves on our own van.',
      nextStep: `Next: out for delivery. Expected ${arrival.label}.`,
    },
    out: {
      headline: 'Out for delivery',
      detail: 'A Petshiwü driver has the order. Stay near the door if you can; we do not leave you hunting a UPS truck.',
      nextStep: `Expected ${arrival.label}.`,
    },
    delivered: {
      headline: 'Delivered',
      detail: 'This order is at your door. If something is missing, call us and we will make it right.',
      nextStep: 'Keep the order number if you need a return or a reorder.',
    },
  };

  const active = copy[currentId];
  return {
    headline: active.headline,
    detail: active.detail,
    nextStep: active.nextStep,
    expectedLabel: currentId === 'delivered' ? 'Arrived' : arrival.label,
    expectedHint: currentId === 'delivered' ? '' : arrival.hint,
    speed: arrival.speed,
    area: arrival.area,
    paid,
    cancelled: false,
    failed: false,
    steps,
    supportPhone: SUPPORT_PHONE,
    isLocalDelivery: arrival.speed !== 'standard',
  };
};

export const trackingProgressPercent = (view: OrderTrackingView): number => {
  if (view.cancelled) return 0;
  if (view.steps.find((step) => step.id === 'delivered')?.done) return 100;
  const current = view.steps.findIndex((step) => step.current);
  if (current < 0) return view.failed ? 75 : 0;
  return [22, 48, 76, 100][current] ?? 22;
};
