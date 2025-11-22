import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const presetAmounts = [10, 20, 100];

  const handleDonate = (amount: number) => {
    navigate(`/donate?amount=${amount}`);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart className="text-white" size={32} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You for Your Order! 🎉
            </h2>
            <p className="text-gray-600">
              Would you like to make a donation to help pets in need?
            </p>
          </div>

          {/* Donation Amounts */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleDonate(amount)}
                className={`py-4 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedAmount === amount
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Custom Amount Button */}
          <button
            onClick={() => {
              navigate('/donate');
              onClose();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
          >
            Choose Custom Amount
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            No thanks, maybe later
          </button>

          {/* Message */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Your donation helps us support animal shelters and rescue organizations
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;

