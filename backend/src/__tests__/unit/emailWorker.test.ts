import { EMAIL_WORKER_JOB_TYPES, registerEmailProcessors } from '../../workers/emailWorker';

describe('email worker processors', () => {
  it('registers processors for every queued email job type', () => {
    const process = jest.fn();
    registerEmailProcessors({ process } as any);

    const registered = process.mock.calls.map((call) => call[0]);
    expect(registered).toEqual(expect.arrayContaining([...EMAIL_WORKER_JOB_TYPES]));
    expect(registered).toEqual(expect.arrayContaining([
      'order-cancellation',
      'order-status',
      'order-delivered',
      'welcome'
    ]));
  });
});
