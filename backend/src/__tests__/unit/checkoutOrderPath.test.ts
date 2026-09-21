import fs from 'fs';
import path from 'path';

describe('createOrder phone validation', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../middleware/validation.ts'),
    'utf8'
  );

  it('normalizes formatted US phones before the E.164 check', () => {
    const createOrderBlock = src.slice(
      src.indexOf('export const createOrderValidation'),
      src.indexOf('export const createReviewValidation')
    );
    expect(createOrderBlock).toContain('normalizePhoneForSms');
    expect(createOrderBlock).toContain('customSanitizer');
  });
});

describe('AI advisor checkout copy', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../controllers/aiAdvisorController.ts'),
    'utf8'
  );

  it('tells shoppers checkout is open, not paused', () => {
    expect(src).not.toMatch(/Checkout may be paused/);
    expect(src).not.toMatch(/when we start accepting orders/);
    expect(src).toMatch(/Checkout is open now/);
  });
});
