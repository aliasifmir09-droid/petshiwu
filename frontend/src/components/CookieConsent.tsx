import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/config/cookies';
import { initAnalytics } from '@/utils/analytics';

const CookieConsent = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay slightly so it doesn't flash on first paint
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
      className={`fixed left-0 right-0 z-[9999] bg-[#0B1F4A] text-white shadow-2xl border-t-2 border-[#F59E0B] ${positionClass}`}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex-1 text-sm text-gray-200 leading-relaxed">
          <span className="font-semibold text-white">We use cookies</span> to improve your experience,
          analyze site traffic, and serve personalized content. By clicking Accept, you agree to our use
          of cookies.{' '}
          <Link to="/cookie-policy" className="text-[#F59E0B] hover:text-amber-200 underline whitespace-nowrap">
            Cookie Policy
          </Link>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-extrabold bg-[#F59E0B] hover:bg-[#D97706] text-[#1E3A8A] hover:text-white rounded-lg transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
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
