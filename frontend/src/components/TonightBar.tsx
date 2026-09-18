import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';
import { ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';
import {
  LAST_ZIP_STORAGE_KEY,
  formatCountdownShort,
  getCutoffCountdown,
  lookupZip,
  normalizeZip,
  type ZipLookupResult,
} from '@/utils/deliveryZip';

const TonightBar = () => {
  const [zip, setZip] = useState('');
  const [result, setResult] = useState<ZipLookupResult | null>(null);
  const [countdown, setCountdown] = useState(() => getCutoffCountdown());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_ZIP_STORAGE_KEY);
      if (saved && /^\d{5}$/.test(saved)) {
        setZip(saved);
        setResult(lookupZip(saved));
      }
    } catch {
      // Ignore private-mode storage failures
    }
  }, []);

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
        // Ignore
      }
    } else {
      setResult(null);
    }
  }, [zip]);

  const statusLine = result
    ? result.speed === 'same-day' && !countdown.passed
      ? `${result.headline} · ${formatCountdownShort(countdown)}`
      : result.headline
    : countdown.passed
      ? `Enter ZIP to check delivery · free over $49 · no autoship`
      : `Free shipping over $49 · enter ZIP to check delivery`;

  if (ORDERING_PAUSED) {
    return (
      <div className="bg-[#1E3A8A] text-white">
        <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-2">
          <MapPin size={14} className="flex-shrink-0 text-amber-200 hidden sm:block" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold leading-tight truncate">
              {ORDERING_PAUSED_HEADLINE}
            </p>
            <p className="text-[10px] sm:text-[11px] text-blue-100 leading-tight truncate">
              {result ? result.headline : 'Browse now · enter ZIP to check delivery'}
            </p>
          </div>
          <label className="sr-only" htmlFor="tonight-zip">
            Check delivery ZIP
          </label>
          <input
            id="tonight-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(normalizeZip(e.target.value))}
            placeholder="ZIP"
            aria-label="Check delivery by ZIP code"
            className="w-[4.5rem] sm:w-20 h-7 px-2 rounded-md text-gray-900 text-xs font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          />
        </div>
      </div>
    );
  }

  if (!areOrdersOpen()) {
    return (
      <div className="bg-amber-400 text-[#1E3A8A]">
        <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-2">
          <MapPin size={14} className="flex-shrink-0 hidden sm:block" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs font-bold leading-tight truncate">
              We start taking orders {ORDERS_OPEN_LABEL}
            </p>
            <p className="text-[10px] sm:text-[11px] leading-tight truncate">
              {result ? result.headline : 'Browse now · checkout and delivery open on launch day'}
            </p>
          </div>
          <label className="sr-only" htmlFor="tonight-zip">
            Check delivery ZIP
          </label>
          <input
            id="tonight-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(normalizeZip(e.target.value))}
            placeholder="ZIP"
            aria-label="Check delivery by ZIP code"
            className="w-[4.5rem] sm:w-20 h-7 px-2 rounded-md text-gray-900 text-xs font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F59E0B] text-[#1E3A8A]">
      <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-2">
        <MapPin size={14} className="flex-shrink-0 text-[#1E3A8A] hidden sm:block" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-bold leading-tight truncate">
            Free shipping over $49 · no autoship · nationwide shipping opens soon
          </p>
          <p className="text-[10px] sm:text-[11px] text-[#1E3A8A]/80 leading-tight truncate">{statusLine}</p>
        </div>
        <label className="sr-only" htmlFor="tonight-zip">
          Check delivery ZIP
        </label>
          <input
            id="tonight-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(normalizeZip(e.target.value))}
            placeholder="ZIP"
            aria-label="Check delivery by ZIP code"
            className="w-[4.5rem] sm:w-20 h-7 px-2 rounded-md text-gray-900 text-xs font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
      </div>
    </div>
  );
};

export default TonightBar;
