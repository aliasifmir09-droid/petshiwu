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
