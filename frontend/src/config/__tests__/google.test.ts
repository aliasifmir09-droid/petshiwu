import { describe, test, expect, vi, beforeEach } from 'vitest';
import { resolveGoogleClientId, resetGoogleClientIdCache } from '../google';
import { authService } from '@/services/auth';

vi.mock('@/services/auth', () => ({
  authService: {
    getGoogleConfig: vi.fn(),
  },
}));

describe('resolveGoogleClientId', () => {
  beforeEach(() => {
    resetGoogleClientIdCache();
    vi.clearAllMocks();
  });

  test('uses the runtime client id from the API', async () => {
    (authService.getGoogleConfig as any).mockResolvedValue({
      enabled: true,
      clientId: 'runtime.apps.googleusercontent.com',
    });

    await expect(resolveGoogleClientId()).resolves.toBe('runtime.apps.googleusercontent.com');
  });

  test('caches the resolved client id', async () => {
    (authService.getGoogleConfig as any).mockResolvedValue({
      enabled: true,
      clientId: 'runtime.apps.googleusercontent.com',
    });

    await resolveGoogleClientId();
    await resolveGoogleClientId();

    expect(authService.getGoogleConfig).toHaveBeenCalledTimes(1);
  });
});
