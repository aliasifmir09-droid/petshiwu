import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { ORDERING_PAUSED } from '@/config/ordering';
import { TONIGHT } from '@/data/tonightDelivery';
import {
  LAST_ZIP_STORAGE_KEY,
  formatCountdownShort,
  getCutoffCountdown,
  lookupZip,
  normalizeZip,
  type ZipLookupResult,
} from '@/utils/deliveryZip';

interface TonightPromiseCardProps {
  variant?: 'hero' | 'pdp';
}

const TRUST_CHIPS = [
  'Packed in Jackson Heights',
  `Before ${TONIGHT.deliverBy}`,
  `Free over $${TONIGHT.freeOver}`,
  '365-day unused returns',
  'No autoship',
];

const loadSavedZip = (): string => {
  try {
    const saved = localStorage.getItem(LAST_ZIP_STORAGE_KEY);
    return saved && /^\d{5}$/.test(saved) ? saved : '';
  } catch {
    return '';
  }
};

const TonightPromiseCard = ({ variant = 'hero' }: TonightPromiseCardProps) => {
  const zipId = useId();
  const [zip, setZip] = useState(loadSavedZip);
  const [result, setResult] = useState<ZipLookupResult | null>(() => {
    const saved = loadSavedZip();
    return saved ? lookupZip(saved) : null;
  });
  const [countdown, setCountdown] = useState(() => getCutoffCountdown());

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(getCutoffCountdown()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (zip.length === 5) {
      const next = lookupZip(zip);
      setResult(next);
      try {
        if (next) localStorage.setItem(LAST_ZIP_STORAGE_KEY, zip);
      } catch {
        // Ignore private-mode storage failures
      }
    } else {
      setResult(null);
    }
  }, [zip]);

  const cutoffLine = ORDERING_PAUSED
    ? `When checkout opens: ${TONIGHT.weekdayCutoff} weekdays · ${TONIGHT.weekendCutoff} weekends · before ${TONIGHT.deliverBy}`
    : countdown.passed
      ? `Same-day cutoff passed · next-day NYC`
      : `Order by ${countdown.isWeekend ? TONIGHT.weekendCutoff : TONIGHT.weekdayCutoff} · ${formatCountdownShort(countdown)}`;

  const status = result
    ? result.speed === 'same-day' && !countdown.passed && !ORDERING_PAUSED
      ? `${result.headline}. ${result.detail}`
      : result.headline
    : `Enter your ZIP. We pack in Queens and bring it to your door.`;

  if (variant === 'pdp') {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-[#1E3A8A]">
          {ORDERING_PAUSED
            ? result?.area
              ? `Same-day in ${result.area} when checkout opens`
              : 'Same-day NYC when checkout opens'
            : result?.speed === 'same-day' && !countdown.passed
              ? `Tonight in ${result.area}`
              : 'Tonight in NYC'}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">{cutoffLine}</p>
        <p className="text-xs text-slate-500 mt-1">{status}</p>
        <label className="sr-only" htmlFor={zipId}>
          Check same-day delivery ZIP
        </label>
        <input
          id={zipId}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(normalizeZip(e.target.value))}
          placeholder="ZIP"
          aria-label="Check same-day delivery by ZIP code"
          className="mt-2 w-24 h-9 px-2 rounded-lg border border-slate-300 text-sm font-semibold tracking-widest text-gray-900 placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
        />
      </div>
    );
  }

  return (
    <section className="bg-[#0B1F4A] text-white">
      <div className="h-1.5 w-full bg-[#D97706]" />
      <div className="container mx-auto px-4 lg:px-8 py-10 md:py-14">
        <div className="max-w-3xl">
          <p className="text-amber-200 text-xs font-semibold tracking-widest uppercase mb-3">
            Packed in New York · ships nationwide
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            {ORDERING_PAUSED ? 'Same-day NYC when checkout opens.' : 'Tonight in NYC. Two days anywhere.'}
          </h2>
          <p className="text-base md:text-lg text-blue-100 mb-6 max-w-xl">
            {ORDERING_PAUSED
              ? 'Check your ZIP, add a bag in one tap, and save the cart. Checkout opens as soon as we are ready.'
              : 'Check your ZIP. Same-day in the five boroughs. Two-day shipping to every other U.S. state.'}
          </p>
          <p className="text-sm font-medium text-white mb-1">{cutoffLine}</p>
          <p className="text-sm text-blue-100 mb-5">{status}</p>
          <p className="text-sm text-amber-100/90 mb-5">Outside NYC? Two-day shipping to every U.S. state.</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor={zipId}>
              Check same-day delivery ZIP
            </label>
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 h-12">
              <MapPin size={16} className="text-[#1E3A8A]" aria-hidden />
              <input
                id={zipId}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(normalizeZip(e.target.value))}
                placeholder="ZIP"
                aria-label="Check same-day delivery by ZIP code"
                className="w-24 text-gray-900 text-base font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-amber-300 text-[#0B1F4A] font-bold hover:bg-amber-200"
            >
              Shop now
            </Link>
            <a
              href={`tel:+18002592605`}
              className="inline-flex items-center gap-2 h-12 px-4 text-sm font-semibold text-blue-100 hover:text-white"
            >
              <Phone size={16} aria-hidden />
              {TONIGHT.phone}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {TRUST_CHIPS.map((chip) => (
              <li
                key={chip}
                className="text-xs font-medium bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-blue-50"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default TonightPromiseCard;
