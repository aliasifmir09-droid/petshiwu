import { buildReorderReminderEmail } from '../../utils/emailService';

describe('reorder reminder emails', () => {
  const previous = process.env.FRONTEND_URL;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://www.petshiwu.com';
  });

  afterEach(() => {
    process.env.FRONTEND_URL = previous;
  });

  const items = [{ name: 'Hill\'s Science Diet', quantity: 2 }];

  test('Ask first email is confirm-to-pay with RESTOCK7 and no silent charge', () => {
    const email = buildReorderReminderEmail('Sam', 'PW-100', {
      weeks: 4,
      items,
      mode: 'ask',
      buyAgainUrlPath: '/restock?coupon=RESTOCK7',
    });

    expect(email.subject).toMatch(/7% off/i);
    expect(email.html).toContain('Confirm now');
    expect(email.html).toContain('/restock?coupon=RESTOCK7');
    expect(email.html).toMatch(/will not charge your card/i);
    expect(email.html).not.toMatch(/we will charge/i);
  });

  test('Autoship email is ship-now at regular price and still no silent charge', () => {
    const email = buildReorderReminderEmail('Sam', 'PW-100', {
      weeks: 4,
      items,
      mode: 'autoship',
      buyAgainUrlPath: '/restock?mode=autoship',
    });

    expect(email.subject).toMatch(/autoship/i);
    expect(email.html).toContain('Ship now');
    expect(email.html).toContain('/restock?mode=autoship');
    expect(email.html).not.toContain('RESTOCK7');
    expect(email.html).toMatch(/will not charge your card/i);
    expect(email.html).toMatch(/Ask first is the better deal/i);
  });
});
