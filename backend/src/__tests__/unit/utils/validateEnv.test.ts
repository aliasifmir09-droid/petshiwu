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

    expect(() => validateEnv()).toThrow();
  });

  it('should throw error if JWT_SECRET is missing', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow();
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
});

