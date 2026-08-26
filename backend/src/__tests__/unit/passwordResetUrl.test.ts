import { buildPasswordResetUrl } from '../../utils/emailService';

describe('password reset email links', () => {
  const previous = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.FRONTEND_URL = previous;
  });

  it('uses BrowserRouter /reset-password, not a HashRouter #/ path', () => {
    process.env.FRONTEND_URL = 'https://www.petshiwu.com';
    expect(buildPasswordResetUrl('tok_abc')).toBe(
      'https://www.petshiwu.com/reset-password?token=tok_abc'
    );
    expect(buildPasswordResetUrl('tok_abc')).not.toContain('#/');
  });
});
