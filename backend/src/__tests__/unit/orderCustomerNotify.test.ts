import { mergeCustomerContact } from '../../utils/orderCustomerNotify';

describe('mergeCustomerContact', () => {
  it('uses guest email and shipping phone when there is no account', () => {
    expect(mergeCustomerContact({
      guestEmail: 'guest.order@petshiwu.com',
      shippingAddress: { firstName: 'Asif', phone: '7185550199' }
    })).toEqual({
      email: 'guest.order@petshiwu.com',
      firstName: 'Asif',
      phone: '7185550199'
    });
  });

  it('falls back to the user account when the order has no guest fields', () => {
    expect(mergeCustomerContact(
      { shippingAddress: { lastName: 'Ali' } },
      { email: 'ada@petshiwu.com', firstName: 'Ada', phone: '+17185550199' }
    )).toEqual({
      email: 'ada@petshiwu.com',
      firstName: 'Ada',
      phone: '+17185550199'
    });
  });
});
