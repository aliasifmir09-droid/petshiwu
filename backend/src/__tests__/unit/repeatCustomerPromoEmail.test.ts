import {
  REPEAT_PROMO_CODE,
  buildRepeatCustomerPromoEmail,
} from '../../utils/repeatCustomerPromoEmail';

describe('repeat customer thank-you email', () => {
  const email = buildRepeatCustomerPromoEmail({
    firstName: 'Maya',
    email: 'maya@example.com',
  });

  test('is a professional thank-you with the live 10% reorder code', () => {
    expect(email.subject).toContain('Maya');
    expect(email.subject).toMatch(/10%/);
    expect(email.html).toContain(REPEAT_PROMO_CODE);
    expect(email.html).toContain('10% off');
    expect(email.html).toContain('max $10');
    expect(email.html).toContain('No subscription');
    expect(email.html).toContain('No autoship');
    expect(email.html).toContain('#1E3A8A');
    expect(email.html).toContain('https://www.petshiwu.com/logo.png');
    expect(email.html).toContain('/products?coupon=RESTOCK5');
    expect(email.html).toContain('/unsubscribe?email=maya%40example.com');
    expect(email.html).toContain('support@petshiwu.com');
    expect(email.html).toContain('+1 (800) 259-2605');
    expect(email.html).toContain('Packed in Queens');
    expect(email.html).toContain('For NYC pet parents');
    expect(email.html).toContain('food, litter, and everyday supplies');
    expect(email.text).toContain('RESTOCK5');
  });

  test('does not use fake urgency or a dark flash-sale layout', () => {
    expect(email.html).not.toContain('Flash Sale');
    expect(email.html).not.toContain('Ends Tonight');
    expect(email.html).not.toContain('#0a0f1e');
    expect(email.html).not.toContain('Today Only');
    expect(email.html).not.toContain('🎉');
  });
});
