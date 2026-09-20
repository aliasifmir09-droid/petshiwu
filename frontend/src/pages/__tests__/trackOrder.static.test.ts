import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));

describe('customer order tracking copy', () => {
  test('public tracking uses the honest shipping card instead of a raw Pending timeline', () => {
    const source = readFileSync(join(dir, '../TrackOrder.tsx'), 'utf8');
    expect(source).toContain('OrderShippingStatus');
    expect(source).toContain('Track your delivery');
    expect(source).toContain('Need a person?');
    expect(source).not.toContain("['pending', 'processing', 'shipped', 'delivered']");
    expect(source).not.toContain('Current Status');
    expect(source).not.toContain('getStatusIcon');
  });

  test('signed-in order pages reuse the same shipping status', () => {
    const detail = readFileSync(join(dir, '../OrderDetail.tsx'), 'utf8');
    const list = readFileSync(join(dir, '../MyOrders.tsx'), 'utf8');
    expect(detail).toContain('OrderShippingStatus');
    expect(detail).not.toContain("['pending', 'processing', 'shipped', 'delivered']");
    expect(list).toContain('describeOrderTracking');
    expect(list).not.toContain('Order is being processed');
    expect(list).not.toContain("order.orderStatus === 'shipped'");
  });
});
