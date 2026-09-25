import { buildCallbackEmail } from '../../../utils/callbackMail';

describe('callback mail', () => {
  test('puts a click-to-call button in the desk email', () => {
    const email = buildCallbackEmail({
      phone: '+13475550100',
      name: 'Jawed',
      message: 'please call 347-555-0100',
      pagePath: '/',
    });

    expect(email.subject).toMatch(/CALL NOW/);
    expect(email.subject).toContain('+1 (347) 555-0100');
    expect(email.html).toContain('tel:+13475550100');
    expect(email.html).toContain('Call +1 (347) 555-0100');
    expect(email.html).toContain('Jawed');
  });
});
