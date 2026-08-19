import { SUPPORT_INBOX, escapeHtml } from '../../../utils/contactMail';

describe('contactMail', () => {
  it('always delivers to support@petshiwu.com', () => {
    expect(SUPPORT_INBOX).toBe('support@petshiwu.com');
  });

  it('escapes HTML in form fields', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('Jane "A" O\'Neil')).toBe('Jane &quot;A&quot; O&#39;Neil');
  });
});
