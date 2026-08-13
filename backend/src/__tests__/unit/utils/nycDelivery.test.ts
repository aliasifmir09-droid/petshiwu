import { isNycDeliveryZip, isNycShippingAddress, normalizeZip } from '../../../utils/nycDelivery';

describe('nycDelivery', () => {
  test('normalizeZip keeps the first five digits', () => {
    expect(normalizeZip('11101-1234')).toBe('11101');
  });

  test('accepts Astoria / LIC 11101', () => {
    expect(isNycDeliveryZip('11101')).toBe(true);
  });

  test('accepts Jackson Heights 11372 and Manhattan 10001', () => {
    expect(isNycDeliveryZip('11372')).toBe(true);
    expect(isNycDeliveryZip('10001')).toBe(true);
  });

  test('rejects Hoboken and incomplete zips', () => {
    expect(isNycDeliveryZip('07030')).toBe(false);
    expect(isNycDeliveryZip('1137')).toBe(false);
  });

  test('isNycShippingAddress requires NY state', () => {
    expect(isNycShippingAddress('NY', '11101')).toBe(true);
    expect(isNycShippingAddress('NJ', '11101')).toBe(false);
  });
});
