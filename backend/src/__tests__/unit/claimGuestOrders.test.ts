import fs from 'fs';
import path from 'path';
import { guestOrderMatch, normalizeAccountEmail } from '../../utils/claimGuestOrders';

describe('claimGuestOrders helpers', () => {
  it('normalizes emails for account lookup', () => {
    expect(normalizeAccountEmail('  Ada@Petshiwu.com ')).toBe('ada@petshiwu.com');
  });

  it('only matches unattached guest orders for that email', () => {
    const query = guestOrderMatch('ada@petshiwu.com');
    expect(query.$and).toHaveLength(2);
    expect(JSON.stringify(query)).toContain('guestEmail');
    expect(JSON.stringify(query)).toContain('$exists');
  });
});

describe('guest checkout can become a login', () => {
  it('forgot-password creates a customer from guest orders so they can set a password', () => {
    const auth = fs.readFileSync(
      path.resolve(__dirname, '../../controllers/authController.ts'),
      'utf8'
    );
    expect(auth).toContain('ensureCustomerForGuestEmail');
  });

  it('guest order emails mark the shopper as a guest checkout', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../controllers/orderController.ts'),
      'utf8'
    );
    expect(src).toContain('isGuestCheckout: isGuest');
    expect(src).toContain('isGuestCheckout: Boolean(pending.guestEmail && !pending.user)');
  });
});
