import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const STORAGE_KEY = 'petshiwu_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay slightly so it doesn't flash on first paint
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-900 text-white shadow-2xl border-t-2 border-blue-500"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex-1 text-sm text-gray-200 leading-relaxed">
          <span className="font-semibold text-white">🍪 We use cookies</span> to improve your experience,
          analyze site traffic, and serve personalized content. By clicking "Accept", you agree to our use
          of cookies.{' '}
          <Link to="/privacy#cookies" className="text-blue-400 hover:text-blue-300 underline whitespace-nowrap">
            Learn more
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
            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
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
