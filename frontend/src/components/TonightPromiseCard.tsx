import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { ORDERING_PAUSED } from '@/config/ordering';
import { NATIONWIDE_SOON_NOTE } from '@/data/brandStories';
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
  'Free over $49',
  'No autoship',
  '365-day unused returns',
  '24/7 support',
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
    ? `When checkout opens: ${TONIGHT.weekdayCutoff} weekdays · ${TONIGHT.weekendCutoff} weekends`
    : result?.speed === 'same-day' && !countdown.passed
      ? `Order by ${countdown.isWeekend ? TONIGHT.weekendCutoff : TONIGHT.weekdayCutoff} · ${formatCountdownShort(countdown)}`
      : result
        ? result.detail
        : '';

  const status = result
    ? result.speed === 'same-day' && !countdown.passed && !ORDERING_PAUSED
      ? `${result.headline}. ${result.detail}`
      : result.headline
    : 'Enter your ZIP to check delivery.';

  if (variant === 'pdp') {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-[#1E3A8A]">
          {result?.headline || 'Check delivery for your ZIP'}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">{cutoffLine}</p>
        <p className="text-xs text-slate-500 mt-1">{status}</p>
        <label className="sr-only" htmlFor={zipId}>
          Check delivery ZIP
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
          aria-label="Check delivery by ZIP code"
          className="mt-2 w-24 h-9 px-2 rounded-lg border border-slate-300 text-sm font-semibold tracking-widest text-gray-900 placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
        />
      </div>
    );
  }

  return (
    <section className="bg-white border-y border-slate-100">
      <div className="container mx-auto px-4 lg:px-8 py-10 md:py-12">
        <div className="max-w-3xl">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-3">
            Delivery
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3 text-[#1E3A8A]">
            Check delivery for your ZIP
          </h2>
          <p className="text-base md:text-lg text-slate-600 mb-6 max-w-xl">
            {NATIONWIDE_SOON_NOTE} Free shipping over ${TONIGHT.freeOver}. No autoship.
          </p>
          {cutoffLine ? <p className="text-sm font-medium text-slate-800 mb-1">{cutoffLine}</p> : null}
          <p className="text-sm text-slate-600 mb-5">{status}</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor={zipId}>
              Check delivery ZIP
            </label>
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 h-12 border border-slate-200">
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
                aria-label="Check delivery by ZIP code"
                className="w-24 text-gray-900 text-base font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#1e40af]"
            >
              Shop now
            </Link>
            <a
              href={`tel:+18002592605`}
              className="inline-flex items-center gap-2 h-12 px-4 text-sm font-semibold text-slate-600 hover:text-[#1E3A8A]"
            >
              <Phone size={16} aria-hidden />
              {TONIGHT.phone}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {TRUST_CHIPS.map((chip) => (
              <li
                key={chip}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-slate-700"
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
