const mockSave = jest.fn();
const mockCreate = jest.fn();
const mockFind = jest.fn();

jest.mock('../../models/ReorderReminder', () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockFind(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

jest.mock('../../utils/emailService', () => ({
  sendReorderReminderEmail: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { sendReorderReminderEmail } from '../../utils/emailService';
import { processDueReorderReminders } from '../../workers/reorderReminderWorker';

describe('reorder reminder worker', () => {
  beforeEach(() => {
    mockSave.mockReset();
    mockCreate.mockReset();
    mockFind.mockReset();
    (sendReorderReminderEmail as jest.Mock).mockReset();
  });

  test('Ask first due reminders send RESTOCK5 confirm email and reschedule', async () => {
    const reminder = {
      email: 'sam@example.com',
      firstName: 'Sam',
      orderNumber: 'PW-1',
      weeks: 4,
      mode: 'ask',
      items: [{ name: 'Food', quantity: 1 }],
      user: 'u1',
      order: 'o1',
      status: 'scheduled',
      save: mockSave,
    };
    mockFind.mockReturnValue({
      limit: jest.fn().mockResolvedValue([reminder]),
    });
    mockSave.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({});
    (sendReorderReminderEmail as jest.Mock).mockResolvedValue({ messageId: 'm1' });

    const sent = await processDueReorderReminders(new Date('2026-08-27T12:00:00.000Z'));

    expect(sent).toBe(1);
    expect(sendReorderReminderEmail).toHaveBeenCalledWith(
      'sam@example.com',
      'Sam',
      'PW-1',
      expect.objectContaining({
        mode: 'ask',
        buyAgainUrlPath: '/restock?coupon=RESTOCK5',
      })
    );
    expect(reminder.status).toBe('sent');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'ask',
        status: 'scheduled',
        weeks: 4,
        intervalDays: 28,
      })
    );
  });

  test('Autoship due reminders send RESTOCK7 ship-now email', async () => {
    const reminder = {
      email: 'sam@example.com',
      firstName: 'Sam',
      orderNumber: 'PW-2',
      weeks: 3,
      mode: 'autoship',
      items: [{ name: 'Food', quantity: 1 }],
      user: 'u1',
      order: 'o1',
      status: 'scheduled',
      save: mockSave,
    };
    mockFind.mockReturnValue({
      limit: jest.fn().mockResolvedValue([reminder]),
    });
    mockSave.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({});
    (sendReorderReminderEmail as jest.Mock).mockResolvedValue({ messageId: 'm2' });

    await processDueReorderReminders(new Date('2026-08-27T12:00:00.000Z'));

    expect(sendReorderReminderEmail).toHaveBeenCalledWith(
      'sam@example.com',
      'Sam',
      'PW-2',
      expect.objectContaining({
        mode: 'autoship',
        buyAgainUrlPath: '/restock?coupon=RESTOCK7&mode=autoship',
      })
    );
    const payload = (sendReorderReminderEmail as jest.Mock).mock.calls[0][3];
    expect(payload.buyAgainUrlPath).toMatch(/RESTOCK7/);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ mode: 'autoship', intervalDays: 21 }));
  });
});
