import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/config/cookies';
import { initAnalytics } from '@/utils/analytics';

const CookieConsent = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!stored) setVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted');
    initAnalytics();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  const onCart = pathname === '/cart';
  const onCheckout = pathname === '/checkout';
  const positionClass = onCheckout
    ? 'top-16 bottom-auto'
    : onCart
      ? 'bottom-44 lg:bottom-0'
      : 'bottom-0';

  return (
    <div
      className={`fixed left-0 right-0 z-[9999] bg-white text-slate-700 border-t border-slate-200 shadow-lg ${positionClass}`}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <p className="flex-1 text-sm leading-relaxed">
          We use cookies to run the shop and improve your experience.{' '}
          <Link to="/cookie-policy" className="text-[#1E3A8A] underline whitespace-nowrap">
            Cookie Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-semibold bg-[#1E3A8A] hover:bg-[#163074] text-white rounded-md"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="p-1.5 text-slate-400 hover:text-slate-700"
            aria-label="Close cookie notice"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
