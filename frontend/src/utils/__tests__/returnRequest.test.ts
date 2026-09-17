import { describe, expect, test } from 'vitest';
import { buildReturnIntakeMessage, createReturnReference } from '@/utils/returnRequest';

describe('return request intake', () => {
  test('issues a RET reference with the calendar day', () => {
    expect(createReturnReference(new Date('2026-09-17T12:00:00Z'))).toMatch(/^RET-20260917-[A-Z0-9]{4}$/);
  });

  test('packs order number, reason, and reference into the support message', () => {
    const message = buildReturnIntakeMessage({
      reference: 'RET-20260917-ABCD',
      orderNumber: 'ORD-1787843707561-4371',
      reason: 'Damaged in delivery',
      details: 'Bag torn',
    });
    expect(message).toContain('RET-20260917-ABCD');
    expect(message).toContain('ORD-1787843707561-4371');
    expect(message).toContain('Damaged in delivery');
    expect(message).toContain('Bag torn');
  });
});
