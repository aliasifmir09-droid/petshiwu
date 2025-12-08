import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const PaymentForm = ({ clientSecret, amount, onSuccess, onError, onCancel }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: 'if_required', // Don't redirect, handle in component
      });

      if (error) {
        // Payment failed
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent.id);
      } else {
        // Payment is processing
        setErrorMessage('Payment is processing. Please wait...');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred. Please try again.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <Lock className="text-primary-600" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
          <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stripe Payment Element */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Payment Amount Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <CreditCard className="text-gray-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
          </div>
          <span className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Lock size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            Your payment is secured by Stripe. We never store your card details. 
            All transactions are encrypted and processed securely.
          </p>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;

