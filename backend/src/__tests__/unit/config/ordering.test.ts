import { ORDERING_PAUSED, ORDERING_PAUSED_MESSAGE } from '../../../config/ordering';

describe('ordering hold', () => {
  test('new orders are accepted', () => {
    expect(ORDERING_PAUSED).toBe(false);
    expect(ORDERING_PAUSED_MESSAGE).toMatch(/start accepting orders soon/i);
  });
});
