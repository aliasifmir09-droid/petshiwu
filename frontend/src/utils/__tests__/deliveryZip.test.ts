import { describe, expect, test } from 'vitest';
import {
  formatCountdownShort,
  getCutoffCountdown,
  getNyDateParts,
  getSameDayCutoffHour,
  isCoordinateInNyc,
  isNycDeliveryZip,
  isValidZip,
  lookupZip,
  normalizeZip,
  padTime,
  tonightStatusLine,
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

  test('lookupZip offers nationwide standard shipping outside the metro', () => {
    const result = lookupZip('94105', new Date('2026-08-13T14:00:00Z'));
    expect(result?.speed).toBe('standard');
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

  test('tonightStatusLine uses ZIP for same-day before cutoff', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    expect(tonightStatusLine('11372', morning)).toMatch(/Same-day delivery in Queens/);
    expect(tonightStatusLine(null, morning)).toMatch(/Same-day NYC/);
    expect(tonightStatusLine('11372', new Date('2026-08-13T20:30:00Z'))).toMatch(/next-day/i);
  });
});
