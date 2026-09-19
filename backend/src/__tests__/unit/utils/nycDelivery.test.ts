import {
  isDeliverableShippingAddress,
  isNewJerseyState,
  isNewYorkState,
  isNextDayDeliveryZip,
  isNycDeliveryZip,
  isNycShippingAddress,
  normalizeShippingState,
  normalizeZip,
  OUT_OF_AREA_DELIVERY_MESSAGE,
} from '../../../utils/nycDelivery';

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

  test('Hicksville NY is next-day metro; Hillside NJ is not a delivery ZIP', () => {
    expect(isNycDeliveryZip('11801')).toBe(false);
    expect(isNycDeliveryZip('07205')).toBe(false);
    expect(isNextDayDeliveryZip('11801')).toBe(true);
    expect(isNextDayDeliveryZip('11803')).toBe(true);
    expect(isNextDayDeliveryZip('07205')).toBe(false);
    expect(isNycShippingAddress('NY', '11801')).toBe(false);
    expect(isDeliverableShippingAddress('NY', '11801')).toBe(true);
    expect(isDeliverableShippingAddress('New York', '11804')).toBe(true);
    expect(isDeliverableShippingAddress('NJ', '07205')).toBe(false);
    expect(isDeliverableShippingAddress('New Jersey', '07205')).toBe(false);
    expect(isNewJerseyState('NJ')).toBe(true);
    expect(normalizeShippingState('new jersey')).toBe('NJ');
    expect(isDeliverableShippingAddress('NJ', '11801')).toBe(false);
    expect(isDeliverableShippingAddress('CA', '94105')).toBe(false);
    expect(OUT_OF_AREA_DELIVERY_MESSAGE).toMatch(/Hicksville/);
    expect(OUT_OF_AREA_DELIVERY_MESSAGE).toMatch(/Queens Hillside/);
    expect(OUT_OF_AREA_DELIVERY_MESSAGE).not.toMatch(/Hicksville and Hillside/);
  });

  test('Queens Hillside 11432 stays NYC same-day', () => {
    expect(isNycDeliveryZip('11432')).toBe(true);
    expect(isNycDeliveryZip('11423')).toBe(true);
    expect(isDeliverableShippingAddress('NY', '11432')).toBe(true);
    expect(isNextDayDeliveryZip('11432')).toBe(false);
  });
});
