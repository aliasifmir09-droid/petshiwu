import { upsertShippingOnUser, normalizeAddressKey } from '../../utils/savedCheckout';

describe('saved checkout addresses', () => {
  it('normalizes street and zip so the same home is not stored twice', () => {
    expect(normalizeAddressKey('37-68  74th St', '11372')).toBe(
      normalizeAddressKey('37-68 74th st', '11372')
    );
  });

  it('upserts a first address as default', () => {
    const addresses: Array<{
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      isDefault?: boolean;
    }> = [];

    expect(
      upsertShippingOnUser(addresses, {
        street: '37-68 74th St',
        city: 'Queens',
        state: 'NY',
        zipCode: '11372',
        country: 'USA',
      })
    ).toBe(true);

    expect(addresses).toHaveLength(1);
    expect(addresses[0].isDefault).toBe(true);
    expect(addresses[0].street).toBe('37-68 74th St');
  });

  it('updates the existing street+zip instead of duplicating the cardholder address', () => {
    const addresses = [
      {
        street: '37-68 74th St',
        city: 'Queens',
        state: 'NY',
        zipCode: '11372',
        country: 'USA',
        isDefault: true,
      },
    ];

    upsertShippingOnUser(addresses, {
      street: '37-68  74th st',
      city: 'Jackson Heights',
      state: 'NY',
      zipCode: '11372',
      country: 'USA',
    });

    expect(addresses).toHaveLength(1);
    expect(addresses[0].city).toBe('Jackson Heights');
    expect(addresses[0].isDefault).toBe(true);
  });
});
