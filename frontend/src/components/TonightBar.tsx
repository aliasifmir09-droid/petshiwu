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

const zipInputClass =
  'w-[4.5rem] sm:w-20 h-7 px-2 rounded border-0 text-[#1E3A8A] text-xs font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/70';

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
    : 'Free shipping over $49 · no autoship · nationwide shipping opens soon';

  const zipField = (
    <>
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
        className={zipInputClass}
      />
    </>
  );

  if (ORDERING_PAUSED) {
    return (
      <div className="bg-[#1E3A8A] text-white">
        <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-3">
          <p className="flex-1 min-w-0 text-[11px] sm:text-xs font-medium leading-tight truncate">
            {ORDERING_PAUSED_HEADLINE}
            {result ? ` · ${result.headline}` : ''}
          </p>
          {zipField}
        </div>
      </div>
    );
  }

  if (!areOrdersOpen()) {
    return (
      <div className="bg-[#1E3A8A] text-white">
        <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-3">
          <p className="flex-1 min-w-0 text-[11px] sm:text-xs font-medium leading-tight truncate">
            We start taking orders {ORDERS_OPEN_LABEL}
            {result ? ` · ${result.headline}` : ''}
          </p>
          {zipField}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E3A8A] text-white">
      <div className="container mx-auto px-3 lg:px-4 py-1.5 flex items-center gap-3">
        <MapPin size={14} className="flex-shrink-0 hidden sm:block opacity-80" aria-hidden />
        <p className="flex-1 min-w-0 text-[11px] sm:text-xs font-medium leading-tight truncate">
          {statusLine}
        </p>
        {zipField}
      </div>
    </div>
  );
};

export default TonightBar;
