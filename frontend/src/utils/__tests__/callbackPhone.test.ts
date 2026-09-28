import { describe, expect, test } from 'vitest';
import {
  extractCallbackPhone,
  formatCallbackPhone,
  isCallbackChatHiddenPath,
  normalizeCallbackPhone,
} from '../callbackPhone';

describe('callback phone', () => {
  test('normalizes and extracts US numbers from chat', () => {
    expect(normalizeCallbackPhone('(347) 555-0100')).toBe('+13475550100');
    expect(extractCallbackPhone('hi call me at 347-555-0100 please')).toBe('+13475550100');
    expect(formatCallbackPhone('+13475550100')).toBe('+1 (347) 555-0100');
  });

  test('stays off checkout and cart', () => {
    expect(isCallbackChatHiddenPath('/')).toBe(false);
    expect(isCallbackChatHiddenPath('/products')).toBe(false);
    expect(isCallbackChatHiddenPath('/checkout')).toBe(true);
    expect(isCallbackChatHiddenPath('/cart')).toBe(true);
    expect(isCallbackChatHiddenPath('/login')).toBe(true);
  });
});
