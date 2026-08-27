import { buildOrderStatusSms, isSmsConfigured, normalizePhoneForSms, sendSms } from '../../utils/smsService';

describe('smsService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.TWILIO_ACCOUNT_SID = originalEnv.TWILIO_ACCOUNT_SID;
    process.env.TWILIO_AUTH_TOKEN = originalEnv.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_FROM_NUMBER = originalEnv.TWILIO_FROM_NUMBER;
    jest.restoreAllMocks();
  });

  it('normalizes US phone numbers to E.164', () => {
    expect(normalizePhoneForSms('(718) 555-0199')).toBe('+17185550199');
    expect(normalizePhoneForSms('17185550199')).toBe('+17185550199');
    expect(normalizePhoneForSms('+17185550199')).toBe('+17185550199');
    expect(normalizePhoneForSms('')).toBe('');
    expect(normalizePhoneForSms('123')).toBe('');
  });

  it('builds short status texts', () => {
    expect(buildOrderStatusSms('ORD-1-1', 'cancelled')).toContain('cancelled');
    expect(buildOrderStatusSms('ORD-1-1', 'shipped', 'TRACK123')).toContain('TRACK123');
    expect(buildOrderStatusSms('ORD-1-1', 'processing')).toContain('preparing');
  });

  it('skips send when Twilio is not configured', async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    expect(isSmsConfigured()).toBe(false);
    const result = await sendSms('7185550199', 'hello');
    expect(result).toEqual({ sent: false, skippedReason: 'not_configured' });
  });

  it('posts to Twilio when configured', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_NUMBER = '+15551234567';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sid: 'SMxxx' })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSms('7185550199', 'Order update');
    expect(result).toEqual({ sent: true, messageSid: 'SMxxx' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/Accounts/ACtest/Messages.json');
    expect(options.method).toBe('POST');
    expect(options.body).toContain('To=%2B17185550199');
  });
});
