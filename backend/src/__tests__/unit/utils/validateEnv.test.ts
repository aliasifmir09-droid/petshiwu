import { validateEnv } from '../../../utils/validateEnv';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error if MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;

    // Mock process.exit to prevent actual exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    expect(() => validateEnv()).toThrow();
    exitSpy.mockRestore();
  });

  it('should throw error if JWT_SECRET is missing', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.JWT_SECRET;

    // Mock process.exit to prevent actual exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    expect(() => validateEnv()).toThrow();
    exitSpy.mockRestore();
  });

  it('should pass validation with required variables', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-validation';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should warn if JWT_SECRET is too short', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'short';

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    validateEnv();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('warns when production is still on PayPal sandbox', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-validation';
    process.env.PAYPAL_CLIENT_ID = 'sandbox-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'sandbox-secret';
    delete process.env.PAYPAL_ENV;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    validateEnv();
    const warned = consoleSpy.mock.calls.flat().join(' ');
    expect(warned).toContain('PAYPAL_ENV is not live');
    consoleSpy.mockRestore();
  });
});

