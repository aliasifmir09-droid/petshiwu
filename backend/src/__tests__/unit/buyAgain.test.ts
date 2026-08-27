import {
  aggregateBuyAgainItems,
  isValidReminderWeeks,
  isValidRestockMode,
  normalizeRestockMode,
  remindAtFromWeeks,
  restockEmailPath,
} from '../../utils/buyAgain';

describe('buyAgain helpers', () => {
  test('accepts reminder weeks 3–6 only', () => {
    expect(isValidReminderWeeks(3)).toBe(true);
    expect(isValidReminderWeeks(4)).toBe(true);
    expect(isValidReminderWeeks(2)).toBe(false);
    expect(isValidReminderWeeks(7)).toBe(false);
    expect(isValidReminderWeeks(4.5)).toBe(false);
  });

  test('ask vs autoship modes', () => {
    expect(isValidRestockMode('ask')).toBe(true);
    expect(isValidRestockMode('autoship')).toBe(true);
    expect(isValidRestockMode('silent')).toBe(false);
    expect(normalizeRestockMode(undefined)).toBe('ask');
    expect(normalizeRestockMode('autoship')).toBe('autoship');
    expect(restockEmailPath('ask')).toBe('/restock?coupon=RESTOCK7');
    expect(restockEmailPath('autoship')).toBe('/restock?mode=autoship');
    expect(restockEmailPath('autoship')).not.toMatch(/RESTOCK7/);
  });

  test('remindAt is weeks * 7 days later', () => {
    const from = new Date('2026-08-01T00:00:00.000Z');
    expect(remindAtFromWeeks(4, from).toISOString()).toBe('2026-08-29T00:00:00.000Z');
  });

  test('aggregates repeat items and skips cancelled orders', () => {
    const regulars = aggregateBuyAgainItems([
      {
        orderStatus: 'cancelled',
        createdAt: '2026-08-01',
        items: [{ product: 'p1', name: 'Cancelled bag', quantity: 2, price: 20 }],
      },
      {
        orderStatus: 'delivered',
        createdAt: '2026-07-01',
        items: [{ product: 'p1', name: 'Hill\'s', quantity: 1, price: 18, image: 'a.jpg' }],
      },
      {
        orderStatus: 'delivered',
        createdAt: '2026-08-10',
        items: [{ product: { _id: 'p1' }, name: 'Hill\'s Science', quantity: 2, price: 19, image: 'b.jpg' }],
      },
    ]);

    expect(regulars).toHaveLength(1);
    expect(regulars[0]).toMatchObject({
      productId: 'p1',
      timesOrdered: 2,
      lastQuantity: 2,
      lastPrice: 19,
      name: 'Hill\'s Science',
    });
  });
});
