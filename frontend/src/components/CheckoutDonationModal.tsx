import { useState } from 'react';
import { Heart, X } from 'lucide-react';

interface CheckoutDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const CheckoutDonationModal = ({ isOpen, onClose, onConfirm }: CheckoutDonationModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const presetAmounts = [10, 20, 100];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleConfirm = () => {
    let donationAmount = 0;
    if (selectedAmount) {
      donationAmount = selectedAmount;
    } else if (customAmount) {
      const amount = parseFloat(customAmount);
      if (!isNaN(amount) && amount > 0) {
        donationAmount = amount;
      }
    }
    onConfirm(donationAmount);
  };

  const getDonationAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const amount = parseFloat(customAmount);
      return !isNaN(amount) && amount > 0 ? amount : 0;
    }
    return 0;
  };

  if (!isOpen) return null;

  const donationAmount = getDonationAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
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
              Support Pets in Need 🐾
            </h2>
            <p className="text-gray-600">
              Would you like to add a donation to your order?
            </p>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAmountSelect(amount)}
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

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter a custom amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Selected Amount Display */}
          {donationAmount > 0 && (
            <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-pink-600">Donation amount:</span>{' '}
                <span className="text-2xl font-bold text-pink-600">${donationAmount.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                donationAmount > 0
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={donationAmount === 0}
            >
              {donationAmount > 0 ? `Add $${donationAmount.toFixed(2)}` : 'Select Amount'}
            </button>
          </div>

          {/* Message */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Your donation will be added to your order total and helps support animal shelters
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDonationModal;

