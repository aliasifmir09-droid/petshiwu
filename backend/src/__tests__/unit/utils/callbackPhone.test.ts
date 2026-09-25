import { extractCallbackPhone, formatCallbackPhone, normalizeCallbackPhone } from '../../../utils/callbackPhone';

describe('callback phone', () => {
  test('normalizes US numbers to E.164', () => {
    expect(normalizeCallbackPhone('3475550100')).toBe('+13475550100');
    expect(normalizeCallbackPhone('(347) 555-0100')).toBe('+13475550100');
    expect(normalizeCallbackPhone('+1 347 555 0100')).toBe('+13475550100');
    expect(normalizeCallbackPhone('1-347-555-0100')).toBe('+13475550100');
  });

  test('rejects junk', () => {
    expect(normalizeCallbackPhone('123')).toBeNull();
    expect(normalizeCallbackPhone('please call me')).toBeNull();
  });

  test('pulls a number out of chat text', () => {
    expect(extractCallbackPhone('please call 347-555-0100 now')).toBe('+13475550100');
    expect(extractCallbackPhone('3475550100')).toBe('+13475550100');
    expect(extractCallbackPhone('no number here')).toBeNull();
  });

  test('formats for the desk', () => {
    expect(formatCallbackPhone('+13475550100')).toBe('+1 (347) 555-0100');
  });
});
