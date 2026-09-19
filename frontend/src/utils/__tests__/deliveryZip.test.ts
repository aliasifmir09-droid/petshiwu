import { describe, expect, test } from 'vitest';
import {
  formatCountdownShort,
  getCutoffCountdown,
  getNyDateParts,
  getSameDayCutoffHour,
  isCoordinateInNyc,
  isDeliverableShippingAddress,
  isNewJerseyState,
  isNewYorkState,
  isNextDayDeliveryZip,
  isNycDeliveryZip,
  normalizeShippingState,
  isValidZip,
  lookupZip,
  normalizeZip,
  padTime,
  saveLastZip,
  tonightStatusLine,
  LAST_ZIP_EVENT,
} from '../deliveryZip';

describe('deliveryZip', () => {
  test('normalizeZip keeps only the first five digits', () => {
    expect(normalizeZip('11372-1234')).toBe('11372');
    expect(normalizeZip('abc10001')).toBe('10001');
    expect(normalizeZip('12')).toBe('12');
  });

  test('isValidZip requires exactly five digits', () => {
    expect(isValidZip('11372')).toBe(true);
    expect(isValidZip('1137')).toBe(false);
    expect(isValidZip('1137a')).toBe(false);
  });

  test('lookupZip returns same-day for Jackson Heights before cutoff', () => {
    const morning = new Date('2026-08-13T14:00:00Z'); // 10:00 AM EDT
    const result = lookupZip('11372', morning);
    expect(result?.area).toBe('Queens');
    expect(result?.speed).toBe('same-day');
    expect(result?.cutoffPassed).toBe(false);
  });

  test('lookupZip falls back to next-day after NYC cutoff', () => {
    const evening = new Date('2026-08-13T20:30:00Z'); // 4:30 PM EDT weekday
    const result = lookupZip('10001', evening);
    expect(result?.area).toBe('Manhattan');
    expect(result?.speed).toBe('next-day');
    expect(result?.cutoffPassed).toBe(true);
  });

  test('lookupZip covers Astoria 11101 which checkout historically missed', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    expect(lookupZip('11101', morning)?.area).toBe('Queens');
  });

  test('lookupZip marks Hoboken as next-day', () => {
    const result = lookupZip('07030', new Date('2026-08-13T14:00:00Z'));
    expect(result?.area).toBe('Hoboken');
    expect(result?.speed).toBe('next-day');
  });

  test('lookupZip marks Hicksville and Hillside as next-day metro', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    const hicksville = lookupZip('11801', morning);
    expect(hicksville?.area).toBe('Hicksville');
    expect(hicksville?.speed).toBe('next-day');
    expect(hicksville?.headline).toMatch(/Next-day delivery to Hicksville/);

    const hillside = lookupZip('07205', morning);
    expect(hillside?.area).toBe('Hillside');
    expect(hillside?.speed).toBe('next-day');

    expect(lookupZip('11803', morning)?.area).toBe('Plainview');
    expect(isNextDayDeliveryZip('11801')).toBe(true);
    expect(isNextDayDeliveryZip('07205')).toBe(true);
  });

  test('Queens Hillside Avenue stays NYC same-day, not the NJ Hillside ZIP', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    const jamaicaHillside = lookupZip('11432', morning);
    expect(jamaicaHillside?.area).toBe('Queens');
    expect(jamaicaHillside?.speed).toBe('same-day');
    expect(isNycDeliveryZip('11432')).toBe(true);
    expect(isNextDayDeliveryZip('11432')).toBe(false);
  });

  test('isDeliverableShippingAddress accepts Hicksville NY and Hillside NJ', () => {
    expect(isDeliverableShippingAddress('NY', '11801')).toBe(true);
    expect(isDeliverableShippingAddress('New York', '11802')).toBe(true);
    expect(isDeliverableShippingAddress('NJ', '07205')).toBe(true);
    expect(isDeliverableShippingAddress('New Jersey', '07205')).toBe(true);
    expect(isNewJerseyState('n.j.')).toBe(true);
    expect(normalizeShippingState('New Jersey')).toBe('NJ');
    expect(isDeliverableShippingAddress('NY', '07205')).toBe(false);
    expect(isDeliverableShippingAddress('NJ', '11801')).toBe(false);
    expect(isDeliverableShippingAddress('NY', '94105')).toBe(false);
    expect(isDeliverableShippingAddress('CA', '94105')).toBe(false);
    expect(isDeliverableShippingAddress('NY', '11372')).toBe(true);
  });

  test('lookupZip offers nationwide shipping-soon outside the metro', () => {
    const result = lookupZip('94105', new Date('2026-08-13T14:00:00Z'));
    expect(result?.speed).toBe('standard');
    expect(result?.headline).toMatch(/nationwide shipping opens soon/i);
  });

  test('lookupZip returns null for incomplete input', () => {
    expect(lookupZip('113')).toBeNull();
  });

  test('weekend cutoff is 1 PM Eastern', () => {
    const saturdayMorning = new Date('2026-08-15T14:00:00Z'); // Saturday 10 AM EDT
    expect(getNyDateParts(saturdayMorning).isWeekend).toBe(true);
    expect(getSameDayCutoffHour(saturdayMorning)).toBe(13);
    expect(getCutoffCountdown(saturdayMorning).passed).toBe(false);
  });

  test('weekday cutoff is 3 PM Eastern', () => {
    const thursday = new Date('2026-08-13T14:00:00Z');
    expect(getSameDayCutoffHour(thursday)).toBe(15);
  });

  test('isCoordinateInNyc detects Jackson Heights and rejects San Francisco', () => {
    expect(isCoordinateInNyc(40.7489, -73.885)).toBe(true);
    expect(isCoordinateInNyc(37.7749, -122.4194)).toBe(false);
  });

  test('isNycDeliveryZip includes Astoria and excludes Hoboken', () => {
    expect(isNycDeliveryZip('11101')).toBe(true);
    expect(isNycDeliveryZip('07030')).toBe(false);
  });

  test('isNewYorkState accepts NY and New York for Queens ZIPs', () => {
    expect(isNewYorkState('new york')).toBe(true);
    expect(isNewYorkState('NY')).toBe(true);
    expect(isNewYorkState('N.Y.')).toBe(true);
    expect(normalizeShippingState('New York')).toBe('NY');
    expect(isNycDeliveryZip('11372')).toBe(true);
  });

  test('padTime zero-pads', () => {
    expect(padTime(4)).toBe('04');
    expect(padTime(12)).toBe('12');
  });

  test('formatCountdownShort shows hours when remaining, then minutes', () => {
    const morning = getCutoffCountdown(new Date('2026-08-13T14:00:00Z')); // 10 AM EDT, 5h to 3 PM
    expect(morning.passed).toBe(false);
    expect(formatCountdownShort(morning)).toMatch(/^\d+h \d{2}m left$/);

    const afterCutoff = getCutoffCountdown(new Date('2026-08-13T20:30:00Z'));
    expect(formatCountdownShort(afterCutoff)).toBe('cutoff passed');
  });

  test('saveLastZip broadcasts so hub and header stay in sync', () => {
    const seen: string[] = [];
    const handler = (event: Event) => seen.push(String((event as CustomEvent<string>).detail));
    window.addEventListener(LAST_ZIP_EVENT, handler);
    saveLastZip('11372');
    window.removeEventListener(LAST_ZIP_EVENT, handler);
    expect(seen).toEqual(['11372']);
    expect(window.localStorage.getItem('petshiwu_last_zip')).toBe('11372');
  });

  test('tonightStatusLine uses ZIP for same-day before cutoff', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    expect(tonightStatusLine('11372', morning)).toMatch(/Same-day delivery in Queens/);
    expect(tonightStatusLine(null, morning)).toMatch(/Enter ZIP to check delivery/);
    expect(tonightStatusLine('11372', new Date('2026-08-13T20:30:00Z'))).toMatch(/next-day/i);
  });
});
