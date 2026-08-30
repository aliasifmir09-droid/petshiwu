import { isNycDeliveryZip, isNycShippingAddress, isNewYorkState, normalizeShippingState, normalizeZip, outsideDeliveryRangeMessage } from '../../../utils/nycDelivery';

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

  test('accepts New York spelled out, which checkout users type for Queens', () => {
    expect(isNewYorkState('new york')).toBe(true);
    expect(isNewYorkState('New York')).toBe(true);
    expect(isNewYorkState('N.Y.')).toBe(true);
    expect(isNewYorkState('NY')).toBe(true);
    expect(isNewYorkState('NJ')).toBe(false);
    expect(normalizeShippingState('new york')).toBe('NY');
    expect(isNycShippingAddress('new york', '11372')).toBe(true);
    expect(isNycShippingAddress('New York', '11372')).toBe(true);
  });

  test('outsideDeliveryRangeMessage explains NYC now and NY/nationwide later', () => {
    expect(outsideDeliveryRangeMessage('CA', '94105')).toMatch(/5 boroughs/);
    expect(outsideDeliveryRangeMessage('CA', '94105')).toMatch(/coming soon/);
    expect(outsideDeliveryRangeMessage('NY', '12207')).toMatch(/New York State/);
    expect(outsideDeliveryRangeMessage('NY', '12207')).toMatch(/can't complete checkout/);
  });
});
