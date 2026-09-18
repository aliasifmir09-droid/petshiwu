const mockOrderLean = jest.fn();
const mockUnsubLean = jest.fn();
const mockSentLean = jest.fn();
const mockUpdateOne = jest.fn();
const mockSendHtmlEmail = jest.fn();

jest.mock('../../models/Order', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      select: jest.fn(() => ({
        populate: jest.fn(() => ({
          lean: mockOrderLean,
        })),
      })),
    })),
  },
}));

jest.mock('../../models/Newsletter', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      select: jest.fn(() => ({
        lean: mockUnsubLean,
      })),
    })),
  },
}));

jest.mock('../../models/PromoCampaignSend', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      select: jest.fn(() => ({
        lean: mockSentLean,
      })),
    })),
    updateOne: (...args: unknown[]) => mockUpdateOne(...args),
  },
}));

jest.mock('../../utils/emailService', () => ({
  sendHtmlEmail: (...args: unknown[]) => mockSendHtmlEmail(...args),
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { collectRepeatPromoRecipients, sendRepeatCustomerPromo } from '../../services/repeatCustomerPromo';

describe('repeat customer promo send', () => {
  beforeEach(() => {
    mockOrderLean.mockReset();
    mockUnsubLean.mockReset();
    mockSentLean.mockReset();
    mockUpdateOne.mockReset();
    mockSendHtmlEmail.mockReset();
    mockUnsubLean.mockResolvedValue([]);
    mockSentLean.mockResolvedValue([]);
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
  });

  test('includes guest and registered order emails, skips cancelled, admin, unsubscribed, and already sent', async () => {
    mockUnsubLean.mockResolvedValue([{ email: 'optout@example.com' }]);
    mockSentLean.mockResolvedValue([{ email: 'already@example.com' }]);
    mockOrderLean.mockResolvedValue([
      { guestEmail: 'guest@example.com', shippingAddress: { firstName: 'Gia' }, user: null },
      { guestEmail: '', shippingAddress: { firstName: 'Sam' }, user: { email: 'sam@example.com', firstName: 'Sam', role: 'customer' } },
      { guestEmail: 'GUEST@example.com', shippingAddress: { firstName: 'Gia2' }, user: null },
      { guestEmail: 'optout@example.com', shippingAddress: { firstName: 'No' }, user: null },
      { guestEmail: 'already@example.com', shippingAddress: { firstName: 'Done' }, user: null },
      { guestEmail: '', shippingAddress: { firstName: 'Boss' }, user: { email: 'owner@petshiwu.com', firstName: 'Boss', role: 'admin' } },
      { guestEmail: 'bad', shippingAddress: { firstName: 'Bad' }, user: null },
    ]);

    const result = await collectRepeatPromoRecipients();
    expect(result.recipients).toEqual([
      { email: 'guest@example.com', firstName: 'Gia' },
      { email: 'sam@example.com', firstName: 'Sam' },
    ]);
    expect(result.alreadySent).toBe(1);
    expect(result.unsubscribed).toBe(1);
  });

  test('dry run counts recipients and does not send', async () => {
    mockOrderLean.mockResolvedValue([
      { guestEmail: 'guest@example.com', shippingAddress: { firstName: 'Gia' }, user: null },
    ]);

    const result = await sendRepeatCustomerPromo({ dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.total).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendHtmlEmail).not.toHaveBeenCalled();
  });

  test('treats a missing email provider as a failed send', async () => {
    mockOrderLean.mockResolvedValue([
      { guestEmail: 'guest@example.com', shippingAddress: { firstName: 'Gia' }, user: null },
    ]);
    mockSendHtmlEmail.mockResolvedValue({ messageId: 'no-provider', accepted: ['guest@example.com'] });

    const result = await sendRepeatCustomerPromo({ dryRun: false, delayMs: 0 });
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'guest@example.com' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'failed' }) }),
      { upsert: true }
    );
  });

  test('records a real send against RESTOCK5 campaign', async () => {
    mockOrderLean.mockResolvedValue([
      { guestEmail: 'guest@example.com', shippingAddress: { firstName: 'Gia' }, user: null },
    ]);
    mockSendHtmlEmail.mockResolvedValue({ messageId: 'resend-1', accepted: ['guest@example.com'] });

    const result = await sendRepeatCustomerPromo({ dryRun: false, delayMs: 0 });
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.code).toBe('RESTOCK5');
    expect(mockSendHtmlEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest@example.com',
        subject: expect.stringContaining('Gia'),
      })
    );
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'guest@example.com' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'sent', messageId: 'resend-1' }) }),
      { upsert: true }
    );
  });
});
