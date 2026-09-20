import { describe, expect, test } from 'vitest';
import {
  describeOrderTracking,
  expectedArrivalFromOrder,
  trackingProgressPercent,
} from '../orderTracking';

describe('order tracking copy', () => {
  test('Sunday after weekend cutoff in Queens is next-day, not a raw Pending label', () => {
    const orderedAt = new Date('2026-09-20T18:24:00Z'); // 2:24 PM EDT Sunday
    const arrival = expectedArrivalFromOrder('11374', orderedAt);
    expect(arrival.speed).toBe('next-day');
    expect(arrival.label).toMatch(/Monday, September 21/);
    expect(arrival.label).toMatch(/11 PM/);

    const view = describeOrderTracking({
      orderStatus: 'pending',
      paymentStatus: 'paid',
      createdAt: orderedAt.toISOString(),
      shippingAddress: { city: 'Forest Hills', state: 'NY', zipCode: '11374' },
    });
    expect(view.headline).toBe('We have your order');
    expect(view.detail).toMatch(/Queens/);
    expect(view.nextStep).toMatch(/Monday, September 21/);
    expect(view.steps.map((step) => step.label)).toEqual([
      'Order received',
      'Packed in Queens',
      'Out for delivery',
      'Delivered',
    ]);
    expect(view.steps[0].current).toBe(true);
    expect(view.steps[1].done).toBe(false);
    expect(view.cancelled).toBe(false);
  });

  test('weekday morning Manhattan is tonight before 11 PM', () => {
    const morning = new Date('2026-09-16T14:00:00Z'); // 10 AM EDT Wednesday
    const arrival = expectedArrivalFromOrder('10001', morning);
    expect(arrival.speed).toBe('same-day');
    expect(arrival.label).toBe('Tonight before 11 PM');
  });

  test('shipped and out_for_delivery both mean a Petshiwu driver, not a carrier', () => {
    const shipped = describeOrderTracking({
      orderStatus: 'shipped',
      paymentStatus: 'paid',
      createdAt: '2026-09-16T14:00:00Z',
      shippingAddress: { zipCode: '11372' },
    });
    expect(shipped.headline).toBe('Out for delivery');
    expect(shipped.detail).toMatch(/Petshiwü driver/);
    expect(shipped.steps.find((step) => step.id === 'out')?.current).toBe(true);

    const van = describeOrderTracking({
      orderStatus: 'processing',
      paymentStatus: 'paid',
      delivery: { status: 'out_for_delivery' },
      createdAt: '2026-09-16T14:00:00Z',
      shippingAddress: { zipCode: '11372' },
    });
    expect(van.headline).toBe('Out for delivery');
  });

  test('cancelled orders do not keep a fake progress bar', () => {
    const view = describeOrderTracking({
      orderStatus: 'cancelled',
      paymentStatus: 'paid',
      createdAt: '2026-09-16T14:00:00Z',
      shippingAddress: { zipCode: '11372' },
    });
    expect(view.headline).toMatch(/cancelled/i);
    expect(view.steps.every((step) => !step.done && !step.current)).toBe(true);
    expect(trackingProgressPercent(view)).toBe(0);
  });

  test('processing is packing in Queens, not a vague Processing label', () => {
    const view = describeOrderTracking({
      orderStatus: 'processing',
      paymentStatus: 'paid',
      createdAt: '2026-09-16T14:00:00Z',
      shippingAddress: { zipCode: '11372' },
    });
    expect(view.headline).toBe('Packing in Queens');
    expect(view.steps.find((step) => step.id === 'packing')?.current).toBe(true);
    expect(trackingProgressPercent(view)).toBe(48);
  });

  test('delivered marks the order arrived', () => {
    const view = describeOrderTracking({
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      createdAt: '2026-09-16T14:00:00Z',
      deliveredAt: '2026-09-16T22:00:00Z',
      shippingAddress: { zipCode: '11372' },
    });
    expect(view.headline).toBe('Delivered');
    expect(view.expectedLabel).toBe('Arrived');
    expect(trackingProgressPercent(view)).toBe(100);
  });
});
