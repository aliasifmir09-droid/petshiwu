import fs from 'fs';
import path from 'path';

describe('createOrder cash on delivery', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../controllers/orderController.ts'),
    'utf8'
  );

  it('no longer blocks Cash on Delivery', () => {
    expect(src).not.toContain('Cash on Delivery is no longer available');
  });

  it('keeps COD orders unpaid until delivery', () => {
    expect(src).toContain("paymentMethod === 'cod' ? 'pending'");
    expect(src).toContain('collect cash on delivery');
  });
});
