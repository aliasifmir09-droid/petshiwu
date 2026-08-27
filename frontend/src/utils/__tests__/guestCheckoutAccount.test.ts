import { guestSetPasswordPath, rememberGuestCheckoutAccount } from '../guestCheckoutAccount';

describe('guest checkout account', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('remembers the checkout email so a guest can set a password later', () => {
    rememberGuestCheckoutAccount({
      email: '  Ada@Petshiwu.com ',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(JSON.parse(sessionStorage.getItem('petshiwu_guest_checkout') || '{}')).toMatchObject({
      email: 'Ada@Petshiwu.com',
      firstName: 'Ada',
    });
  });

  it('builds a set-password link, not a guessed password', () => {
    expect(guestSetPasswordPath('ada@petshiwu.com')).toBe(
      '/forgot-password?guest=1&email=ada%40petshiwu.com'
    );
    expect(guestSetPasswordPath()).toBe('/forgot-password?guest=1');
  });
});
