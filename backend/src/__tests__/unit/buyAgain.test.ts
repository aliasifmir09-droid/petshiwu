import {
  aggregateBuyAgainItems,
  cadenceLabel,
  intervalFromReminder,
  isRestockConsumable,
  isValidIntervalDays,
  isValidReminderWeeks,
  isValidRestockMode,
  nextRemindAt,
  normalizeRestockMode,
  parseRemindAt,
  remindAtFromInterval,
  remindAtFromWeeks,
  resolveIntervalDays,
  restockEmailPath,
  sanitizeRestockItems,
  usualFromOrderItems,
  weeksFromInterval,
} from '../../utils/buyAgain';

describe('buyAgain helpers', () => {
  test('accepts cadence from every day through every 8 weeks', () => {
    expect(isValidIntervalDays(1)).toBe(true);
    expect(isValidIntervalDays(7)).toBe(true);
    expect(isValidIntervalDays(56)).toBe(true);
    expect(isValidIntervalDays(10)).toBe(false);
    expect(resolveIntervalDays({ intervalDays: 7 })).toBe(7);
    expect(resolveIntervalDays({ weeks: 4 })).toBe(28);
    expect(resolveIntervalDays({})).toBe(7);
    expect(resolveIntervalDays({ intervalDays: 99 })).toBeNull();
    expect(cadenceLabel(7)).toBe('Every week');
    expect(weeksFromInterval(1)).toBe(0);
    expect(weeksFromInterval(28)).toBe(4);
    expect(intervalFromReminder({ weeks: 4 })).toBe(28);
    expect(intervalFromReminder({ intervalDays: 1 })).toBe(1);
  });

  test('legacy week validator still accepts 3–6', () => {
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
    expect(restockEmailPath('ask')).toBe('/restock?coupon=RESTOCK5');
    expect(restockEmailPath('autoship')).toBe('/restock?coupon=RESTOCK7&mode=autoship');
    expect(restockEmailPath('ask')).not.toMatch(/RESTOCK7/);
  });

  test('remindAt is interval days later and parseRemindAt rejects past or far-future', () => {
    const from = new Date('2026-08-01T00:00:00.000Z');
    expect(remindAtFromWeeks(4, from).toISOString()).toBe('2026-08-29T00:00:00.000Z');
    expect(remindAtFromInterval(7, from).toISOString()).toBe('2026-08-08T00:00:00.000Z');
    expect(nextRemindAt(7, from, new Date('2026-08-20T00:00:00.000Z')).toISOString()).toBe(
      '2026-08-22T00:00:00.000Z'
    );
    const fallback = new Date('2026-09-03T13:00:00.000Z');
    expect(parseRemindAt('2026-09-10T09:00:00.000Z', fallback).toISOString()).toBe(
      '2026-09-10T09:00:00.000Z'
    );
    expect(parseRemindAt('2020-01-01T00:00:00.000Z', fallback).toISOString()).toBe(fallback.toISOString());
    expect(parseRemindAt('not-a-date', fallback).toISOString()).toBe(fallback.toISOString());
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

  test('restock list keeps food and drops toys', () => {
    expect(isRestockConsumable("McLovin's Pet Premium Dog Meal Topper")).toBe(true);
    expect(isRestockConsumable("Hill's Science Diet")).toBe(true);
    expect(isRestockConsumable('Kong Classic Dog Toy')).toBe(false);
    expect(isRestockConsumable('Moana Pua the Pig Costume')).toBe(false);

    const usual = usualFromOrderItems([
      { product: 'toy1', name: 'Kong Classic Dog Toy', quantity: 1, image: 't.jpg' },
      { product: 'food1', name: "McLovin's Salmon Meal Topper", quantity: 2, image: 'f.jpg' },
    ]);
    expect(usual).toEqual([
      expect.objectContaining({ product: 'food1', quantity: 2, name: "McLovin's Salmon Meal Topper" }),
    ]);

    expect(sanitizeRestockItems([
      { product: 'toy1', name: 'Squeaky toy', quantity: 1 },
      { product: 'food1', name: 'Royal Canin wet food', quantity: 3 },
    ])).toEqual([
      expect.objectContaining({ product: 'food1', quantity: 3 }),
    ]);
  });
});
