import fs from 'fs';
import path from 'path';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('guest checkout login', () => {
  test('login and forgot-password explain guests never received a password', () => {
    const login = read('../../pages/Login.tsx');
    const forgot = read('../../pages/ForgotPassword.tsx');

    expect(login).toContain('Paid as a guest? There is no password yet.');
    expect(login).toContain('guestSetPasswordPath');
    expect(forgot).toContain("searchParams.get('guest') === '1'");
    expect(forgot).toContain('Create a password for your order');
    expect(forgot).toContain('Checkout never asked for a password');
  });
});
