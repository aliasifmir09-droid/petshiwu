import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Loader2, Sparkles, Navigation } from 'lucide-react';
import {
  LAST_ZIP_STORAGE_KEY,
  getCutoffCountdown,
  isCoordinateInNyc,
  lookupZip,
  normalizeZip,
  padTime,
  type ZipLookupResult,
} from '@/utils/deliveryZip';

const SameDayChecker = () => {
  const [zip, setZip] = useState('');
  const [result, setResult] = useState<ZipLookupResult | null>(null);
  const [countdown, setCountdown] = useState(() => getCutoffCountdown());
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'denied' | 'outside' | 'nyc'>('idle');

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

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isCoordinateInNyc(position.coords.latitude, position.coords.longitude)) {
          setGeoStatus('nyc');
        } else {
          setGeoStatus('outside');
        }
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const tone =
    result?.speed === 'same-day'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : result?.speed === 'next-day'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : result?.speed === 'unavailable'
          ? 'border-rose-200 bg-rose-50 text-rose-950'
          : '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(normalizeZip(e.target.value))}
            placeholder="Enter your ZIP"
            aria-label="Check same-day delivery by ZIP code"
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/40 bg-white text-gray-900 font-semibold tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <button
          type="button"
          onClick={handleGeo}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/15 border border-white/30 text-white font-semibold hover:bg-white/25 transition-colors"
        >
          {geoStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          Use my location
        </button>
      </div>

      {!result && !countdown.passed && (
        <p className="mt-3 text-sm text-white/80 flex items-center gap-2">
          <Sparkles size={14} />
          Same-day NYC cutoff in{' '}
          <span className="font-mono font-bold text-yellow-200">
            {padTime(countdown.hours)}:{padTime(countdown.minutes)}:{padTime(countdown.seconds)}
          </span>
        </p>
      )}

      {geoStatus === 'nyc' && !result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <p className="font-bold">You&apos;re in NYC — same-day delivery is available</p>
          <p className="text-sm mt-1 opacity-90">
            {countdown.passed
              ? `Today's cutoff (${countdown.cutoffLabel}) has passed. Enter your ZIP for the exact neighborhood window, or order now for tomorrow.`
              : `Order by ${countdown.cutoffLabel} and we deliver before 11 PM tonight. Enter your ZIP for a neighborhood-specific ETA.`}
          </p>
        </div>
      )}
      {geoStatus === 'outside' && (
        <p className="mt-2 text-xs text-white/70">
          You appear to be outside NYC. We currently deliver only in the 5 boroughs — New York State and nationwide shipping are coming soon.
        </p>
      )}

      {result && (
        <div className={`mt-4 rounded-xl border px-4 py-3 ${tone}`}>
          <p className="font-bold">{result.headline}</p>
          <p className="text-sm mt-1 opacity-90">{result.detail}</p>
          {result.speed === 'same-day' && !countdown.passed && (
            <p className="text-sm mt-2 font-semibold">
              Order in {padTime(countdown.hours)}:{padTime(countdown.minutes)}:{padTime(countdown.seconds)} for tonight.
            </p>
          )}
          {result.speed !== 'unavailable' && (
            <Link
              to="/products"
              className="inline-flex mt-3 text-sm font-bold underline underline-offset-2 hover:opacity-80"
            >
              Shop now →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default SameDayChecker;
