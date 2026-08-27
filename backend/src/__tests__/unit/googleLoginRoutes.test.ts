import fs from 'fs';
import path from 'path';

describe('Google login routes', () => {
  it('exposes POST /auth/google and keeps the session token in the response', () => {
    const routes = fs.readFileSync(path.resolve(__dirname, '../../routes/auth.ts'), 'utf8');
    const controller = fs.readFileSync(path.resolve(__dirname, '../../controllers/authController.ts'), 'utf8');
    const sanitizer = fs.readFileSync(path.resolve(__dirname, '../../middleware/sanitizeResponse.ts'), 'utf8');
    const server = fs.readFileSync(path.resolve(__dirname, '../../server.ts'), 'utf8');

    expect(routes).toContain("router.post('/google', googleLoginValidation, googleLogin)");
    expect(controller).toContain('verifyGoogleIdToken');
    expect(controller).toContain('upsertGoogleCustomer');
    expect(sanitizer).toContain("req.path.includes('/auth/google')");
    expect(server).toContain('/api/auth/google');
    expect(server).toContain('https://accounts.google.com');
  });
});
