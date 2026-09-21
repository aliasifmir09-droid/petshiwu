import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { NEWSLETTER_CODE, NEWSLETTER_CODE_COPY } from '@/config/constants';
import { useAuthStore } from '@/stores/authStore';
import {
  EMAIL_POPUP_DELAY_MS,
  EMAIL_POPUP_STORAGE_KEY,
  shouldOfferEmailPopup,
} from '@/utils/emailPopup';

const API_URL = import.meta.env.VITE_API_URL || 'https://www.petshiwu.com/api';

const EmailPopup = () => {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(EMAIL_POPUP_STORAGE_KEY) === 'true';
    const canOffer = shouldOfferEmailPopup({
      pathname,
      dismissed,
      isAuthenticated,
    });

    if (!canOffer) {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, EMAIL_POPUP_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, isAuthenticated]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(EMAIL_POPUP_STORAGE_KEY, 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'popup' }),
      });
      const data = await res.json();

      if (data.success || data.alreadySubscribed) {
        setSubmitted(true);
        setCode(data.code || NEWSLETTER_CODE);
        localStorage.setItem(EMAIL_POPUP_STORAGE_KEY, 'true');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-popup-title"
        className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-white/80 hover:text-white sm:text-stone-500 sm:hover:text-stone-800"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="hidden w-1/2 bg-[#F4F1EA] sm:flex sm:items-center sm:justify-center">
          <img
            src="/pets/cat.jpg"
            alt="Cat stretching toward a first-order offer"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="w-full bg-[#0F3D2E] px-7 py-10 text-white sm:w-1/2 sm:px-8">
          {!submitted ? (
            <>
              <h2 id="email-popup-title" className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Unlock 20% off on your first order.
              </h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block text-sm font-medium text-white/90" htmlFor="email-popup-input">
                  Enter your email
                </label>
                <input
                  id="email-popup-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-md border-0 px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none ring-2 ring-transparent focus:ring-[#F5C518]"
                />
                {error ? <p className="text-sm text-amber-200">{error}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-[#F5C518] py-3.5 text-base font-bold text-[#0F3D2E] hover:bg-[#ffd84a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Email me 20% off'}
                </button>
              </form>
              <button
                type="button"
                onClick={dismiss}
                className="mt-4 block w-full text-center text-sm text-white/80 underline-offset-2 hover:underline"
              >
                No, thank you
              </button>
              <p className="mt-6 text-xs leading-relaxed text-white/60">
                We’ll email your FREEDOM20 code (20% off, max $10) and occasional offers. Unsubscribe anytime.
              </p>
            </>
          ) : (
            <div className="py-4 text-center">
              <h2 id="email-popup-title" className="text-3xl font-black">
                You’re in
              </h2>
              <p className="mt-2 text-sm text-white/80">Your first-order code:</p>
              <p className="mt-4 text-4xl font-black tracking-widest text-[#F5C518]">{code}</p>
              <p className="mt-1 text-sm text-white/70">{NEWSLETTER_CODE_COPY}</p>
              <a
                href="/products"
                onClick={dismiss}
                className="mt-8 inline-block w-full rounded-md bg-[#F5C518] py-3.5 text-base font-bold text-[#0F3D2E] hover:bg-[#ffd84a]"
              >
                Shop now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPopup;
