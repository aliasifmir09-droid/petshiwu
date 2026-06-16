import { useState, useEffect, useRef } from 'react';
import { X, Gift, Truck, Shield, Star } from 'lucide-react';

const STORAGE_KEY = 'petshiwu_popup_dismissed';
const API_URL = import.meta.env.VITE_API_URL || 'https://www.petshiwu.com/api';

const EmailPopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't show if already dismissed or submitted this session
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Show after 12 seconds on the page
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, 12000);

    // Also show on exit intent (mouse leaves top of window)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !localStorage.getItem(STORAGE_KEY)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
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

      if (data.success) {
        setSubmitted(true);
        setCode(data.code || 'WELCOME10');
        localStorage.setItem(STORAGE_KEY, 'true');
      } else if (data.alreadySubscribed) {
        setSubmitted(true);
        setCode('WELCOME10');
        localStorage.setItem(STORAGE_KEY, 'true');
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800 px-8 py-8 text-center">
          <div className="text-5xl mb-3">🐾</div>
          <h2 className="text-white text-2xl font-black leading-tight">
            Get <span className="text-yellow-300">10% Off</span> Your First Order
          </h2>
          <p className="text-white/80 text-sm mt-2">
            Join NYC pet parents getting the best deals delivered.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {!submitted ? (
            <>
              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center">
                  <Truck size={18} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Free delivery over $49</p>
                </div>
                <div className="text-center">
                  <Gift size={18} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Exclusive deals</p>
                </div>
                <div className="text-center">
                  <Shield size={18} className="mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-gray-600 font-medium">No spam, ever</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed text-base"
                >
                  {loading ? 'Sending...' : 'Get My 10% Off Code →'}
                </button>
              </form>
              <p className="text-center text-gray-400 text-xs mt-3">
                No spam. Unsubscribe anytime. NYC pet parents only 🗽
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">You're in!</h3>
              <p className="text-gray-600 text-sm mb-4">Check your inbox. Your code:</p>
              <div className="bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl py-4 px-6 mb-4">
                <p className="text-3xl font-black text-blue-800 tracking-widest">{code}</p>
                <p className="text-sm text-gray-500 mt-1">10% off your entire order</p>
              </div>
              <a
                href="/products"
                onClick={dismiss}
                className="inline-block w-full bg-gradient-to-r from-blue-700 to-purple-700 text-white font-bold py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                Shop Now →
              </a>
            </div>
          )}
        </div>

        {/* Rating strip */}
        {!submitted && (
          <div className="px-8 pb-5">
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <span className="text-gray-500 text-xs ml-2">Loved by NYC pet parents</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPopup;
