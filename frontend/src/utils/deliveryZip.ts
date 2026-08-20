/**
 * Instant delivery lookup for NYC ZIP codes.
 * Same-day cutoff matches ShippingPolicy: 3 PM EST weekdays, 1 PM EST weekends.
 */

export type DeliverySpeed = 'same-day' | 'next-day' | 'standard';

export interface ZipLookupResult {
  zip: string;
  area: string;
  speed: DeliverySpeed;
  headline: string;
  detail: string;
  cutoffPassed: boolean;
}

export interface CutoffCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
  cutoffHour: number;
  cutoffLabel: string;
  isWeekend: boolean;
}

const NYC_RANGES: Array<{ start: number; end: number; area: string }> = [
  { start: 10001, end: 10282, area: 'Manhattan' },
  { start: 10301, end: 10314, area: 'Staten Island' },
  { start: 10451, end: 10475, area: 'the Bronx' },
  { start: 11004, end: 11005, area: 'Queens' },
  { start: 11101, end: 11109, area: 'Queens' },
  { start: 11201, end: 11256, area: 'Brooklyn' },
  { start: 11351, end: 11697, area: 'Queens' },
];

const NEXT_DAY_ZIPS: Record<string, string> = {
  '07030': 'Hoboken',
  '07086': 'Weehawken',
  '07302': 'Jersey City',
  '07304': 'Jersey City',
  '07305': 'Jersey City',
  '07306': 'Jersey City',
  '07307': 'Jersey City',
  '07310': 'Jersey City',
  '07311': 'Jersey City',
  '10528': 'Harrison',
  '10550': 'Mount Vernon',
  '10552': 'Mount Vernon',
  '10553': 'Mount Vernon',
  '10583': 'Scarsdale',
  '10601': 'White Plains',
  '10603': 'White Plains',
  '10604': 'White Plains',
  '10605': 'White Plains',
  '10606': 'White Plains',
  '10701': 'Yonkers',
  '10703': 'Yonkers',
  '10704': 'Yonkers',
  '10705': 'Yonkers',
  '10708': 'Bronxville',
  '10801': 'New Rochelle',
};

const NYC_BOUNDS = {
  minLat: 40.49,
  maxLat: 40.92,
  minLng: -74.26,
  maxLng: -73.7,
};

export function normalizeZip(input: string): string {
  return input.replace(/\D/g, '').slice(0, 5);
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function getNyDateParts(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0';

  const weekday = get('weekday');
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  return {
    weekday,
    isWeekend,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

export function getSameDayCutoffHour(now: Date = new Date()): number {
  return getNyDateParts(now).isWeekend ? 13 : 15;
}

export function getCutoffCountdown(now: Date = new Date()): CutoffCountdown {
  const { isWeekend, hour, minute, second } = getNyDateParts(now);
  const cutoffHour = getSameDayCutoffHour(now);
  const remaining =
    cutoffHour * 3600 - (hour * 3600 + minute * 60 + second);
  const passed = remaining <= 0;
  const abs = Math.abs(remaining);

  return {
    hours: Math.floor(abs / 3600),
    minutes: Math.floor((abs % 3600) / 60),
    seconds: abs % 60,
    passed,
    cutoffHour,
    cutoffLabel: isWeekend ? '1:00 PM EST' : '3:00 PM EST',
    isWeekend,
  };
}

function findNycArea(zipNum: number): string | null {
  const match = NYC_RANGES.find((range) => zipNum >= range.start && zipNum <= range.end);
  return match?.area ?? null;
}

export function isNycDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  if (!isValidZip(zip)) return false;
  return findNycArea(Number(zip)) !== null;
}

/** Accept NY, N.Y., New York, and New York State. */
export function isNewYorkState(state: string): boolean {
  const normalized = String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  return normalized === 'NY' || normalized === 'NEW YORK' || normalized === 'NEW YORK STATE';
}

export function normalizeShippingState(state: string): string {
  const trimmed = String(state || '').trim();
  return isNewYorkState(trimmed) ? 'NY' : trimmed;
}

export function lookupZip(input: string, now: Date = new Date()): ZipLookupResult | null {
  const zip = normalizeZip(input);
  if (!isValidZip(zip)) return null;

  const countdown = getCutoffCountdown(now);
  const nycArea = findNycArea(Number(zip));

  if (nycArea) {
    if (!countdown.passed) {
      return {
        zip,
        area: nycArea,
        speed: 'same-day',
        headline: `Same-day delivery in ${nycArea}`,
        detail: `Order by ${countdown.cutoffLabel} and we deliver before 11 PM tonight.`,
        cutoffPassed: false,
      };
    }
    return {
      zip,
      area: nycArea,
      speed: 'next-day',
      headline: `You're in ${nycArea} — next-day delivery`,
      detail: `Today's same-day cutoff (${countdown.cutoffLabel}) has passed. Order now for delivery tomorrow.`,
      cutoffPassed: true,
    };
  }

  const nearby = NEXT_DAY_ZIPS[zip];
  if (nearby) {
    return {
      zip,
      area: nearby,
      speed: 'next-day',
      headline: `Next-day delivery to ${nearby}`,
      detail: 'We deliver to Jersey City, Hoboken, and select Westchester addresses the next business day.',
      cutoffPassed: countdown.passed,
    };
  }

  return {
    zip,
    area: 'the US',
    speed: 'standard',
    headline: '2-day nationwide shipping',
    detail: 'Free shipping on orders over $49. Same-day is currently NYC + nearby metro.',
    cutoffPassed: countdown.passed,
  };
}

export function isCoordinateInNyc(lat: number, lng: number): boolean {
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

export const LAST_ZIP_STORAGE_KEY = 'petshiwu_last_zip';

export function padTime(value: number): string {
  return String(value).padStart(2, '0');
}

/** Compact remaining-time label for the sticky tonight bar. */
export function formatCountdownShort(countdown: CutoffCountdown): string {
  if (countdown.passed) return 'cutoff passed';
  if (countdown.hours > 0) {
    return `${countdown.hours}h ${padTime(countdown.minutes)}m left`;
  }
  return `${countdown.minutes}m ${padTime(countdown.seconds)}s left`;
}

/** One line for photo-search results: tonight ETA from a saved ZIP. */
export function tonightStatusLine(zip: string | null, now: Date = new Date()): string {
  const countdown = getCutoffCountdown(now);
  if (zip && isValidZip(zip)) {
    const result = lookupZip(zip, now);
    if (result?.speed === 'same-day' && !countdown.passed) {
      return `${result.headline} · ${formatCountdownShort(countdown)}`;
    }
    if (result) return result.headline;
  }
  if (!countdown.passed) {
    return `Same-day NYC · ${formatCountdownShort(countdown)} · enter ZIP above`;
  }
  return 'Same-day cutoff passed · next-day NYC';
}
