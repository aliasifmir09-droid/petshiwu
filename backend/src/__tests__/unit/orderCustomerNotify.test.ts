import { mergeCustomerContact } from '../../utils/orderCustomerContact';
import { notifyCustomerOfOrderStatusChange } from '../../utils/orderCustomerNotify';
import * as jobQueue from '../../utils/jobQueue';
import * as emailService from '../../utils/emailService';
import * as smsService from '../../utils/smsService';

jest.mock('../../utils/jobQueue', () => {
  const actual = jest.requireActual('../../utils/jobQueue');
  return {
    ...actual,
    addEmailJob: jest.fn(async (_type: string, _data: unknown, executeFn: () => Promise<void>) => {
      await executeFn();
    })
  };
});

const guestOrder = {
  guestEmail: 'guest.order@petshiwu.com',
  orderNumber: 'ORD-1787684558761-8401',
  totalPrice: 18.69,
  items: [{ name: 'Cat litter', quantity: 1, price: 18.69, image: 'https://cdn.example.com/litter.jpg' }],
  shippingAddress: {
    firstName: 'Asif',
    lastName: 'Ali',
    street: '37-68 74th St',
    city: 'Jackson Heights',
    state: 'NY',
    zipCode: '11372',
    country: 'USA',
    phone: '7185550199'
  },
  createdAt: new Date('2026-08-27T12:00:00.000Z')
};

describe('mergeCustomerContact', () => {
  it('uses guest email and shipping phone when there is no account', () => {
    expect(mergeCustomerContact({
      guestEmail: 'guest.order@petshiwu.com',
      shippingAddress: { firstName: 'Asif', phone: '7185550199' }
    })).toEqual({
      email: 'guest.order@petshiwu.com',
      firstName: 'Asif',
      phone: '7185550199'
    });
  });

  it('falls back to the user account when the order has no guest fields', () => {
    expect(mergeCustomerContact(
      { shippingAddress: { lastName: 'Ali' } },
      { email: 'ada@petshiwu.com', firstName: 'Ada', phone: '+17185550199' }
    )).toEqual({
      email: 'ada@petshiwu.com',
      firstName: 'Ada',
      phone: '+17185550199'
    });
  });
});

describe('notifyCustomerOfOrderStatusChange', () => {
  const addEmailJob = jobQueue.addEmailJob as jest.MockedFunction<typeof jobQueue.addEmailJob>;

  beforeEach(() => {
    addEmailJob.mockReset();
    addEmailJob.mockImplementation(async (_type, _data, executeFn) => {
      await executeFn();
    });
    jest.spyOn(smsService, 'sendSms').mockResolvedValue({ sent: false, skippedReason: 'not_configured' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a cancellation email immediately so it does not depend on the Redis worker', async () => {
    const emailSpy = jest.spyOn(emailService, 'sendOrderCancellationEmail').mockResolvedValue({ messageId: 'test' } as any);
    addEmailJob.mockImplementation(async () => undefined);

    const result = await notifyCustomerOfOrderStatusChange(guestOrder, 'pending', 'cancelled', {
      cancellationReason: 'Updated by Petshiwu'
    });

    expect(result.email).toBe(true);
    expect(emailSpy).toHaveBeenCalledWith(
      'guest.order@petshiwu.com',
      'Asif',
      'ORD-1787684558761-8401',
      expect.objectContaining({ cancellationReason: 'Updated by Petshiwu' })
    );
    expect(addEmailJob).not.toHaveBeenCalled();
  });

  it('queues a cancellation retry if the direct send fails', async () => {
    jest.spyOn(emailService, 'sendOrderCancellationEmail')
      .mockRejectedValueOnce(new Error('SMTP unavailable'))
      .mockResolvedValue({ messageId: 'retry' } as any);
    addEmailJob.mockImplementation(async (_type, _data, executeFn) => {
      await executeFn();
    });

    const result = await notifyCustomerOfOrderStatusChange(guestOrder, 'pending', 'cancelled', {
      cancellationReason: 'Updated by Petshiwu'
    });

    expect(result.email).toBe(true);
    expect(addEmailJob).toHaveBeenCalledWith(
      'order-cancellation',
      expect.objectContaining({
        email: 'guest.order@petshiwu.com',
        orderNumber: 'ORD-1787684558761-8401'
      }),
      expect.any(Function)
    );
  });

  it('queues processing updates as order-status jobs, not cancellation jobs', async () => {
    jest.spyOn(emailService, 'sendOrderStatusEmail').mockResolvedValue({ messageId: 'test' } as any);

    await notifyCustomerOfOrderStatusChange(guestOrder, 'pending', 'processing');

    expect(addEmailJob).toHaveBeenCalledWith(
      'order-status',
      expect.objectContaining({
        email: 'guest.order@petshiwu.com',
        orderData: expect.objectContaining({ status: 'processing' })
      }),
      expect.any(Function)
    );
  });
});
