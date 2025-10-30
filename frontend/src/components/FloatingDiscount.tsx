import { X, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';

const FloatingDiscount = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // Show after 5 seconds
    const timer = setTimeout(() => {
      if (!isClosed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isClosed]);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
  };

  if (!isVisible || isClosed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
      <div className="relative bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white rounded-2xl shadow-2xl p-6 max-w-sm animate-bounce-slow">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full animate-pulse-slow">
            <Gift size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-2">First Order Special!</h3>
            <p className="text-sm mb-3 opacity-95">
              Get <span className="text-2xl font-black">10% OFF</span> your first purchase
            </p>
            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-mono font-bold text-center mb-3 border-2 border-dashed border-yellow-300">
              FIRST10
            </div>
            <button className="w-full bg-white text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105">
              Shop Now →
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-yellow-300 rounded-full opacity-20 blur-xl animate-pulse"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-pink-300 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
};

export default FloatingDiscount;

