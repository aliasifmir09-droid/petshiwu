import { ORDERING_PAUSED, ORDERING_PAUSED_MESSAGE } from '../../../config/ordering';

describe('ordering hold', () => {
  test('new orders stay paused until the flag is flipped', () => {
    expect(ORDERING_PAUSED).toBe(true);
    expect(ORDERING_PAUSED_MESSAGE).toMatch(/start accepting orders soon/i);
  });
});
