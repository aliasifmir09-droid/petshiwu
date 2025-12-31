import { useState, useEffect, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { donationService } from '@/services/donations';
import { getStripe } from '@/utils/stripe';
import PaymentForm from '@/components/PaymentForm';
import LoadingSpinner from '@/components/LoadingSpinner';

type PaymentMethod = 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';

// Wrapper component for lazy-loaded Stripe Elements
const StripePaymentWrapper = ({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError, 
  onCancel 
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) => {
  const [ElementsComponent, setElementsComponent] = useState<React.ComponentType<any> | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Defer Stripe loading to avoid blocking main thread
    const loadStripe = () => {
      Promise.all([
        import('@stripe/react-stripe-js'),
        getStripe()
      ]).then(([stripeReactModule, stripe]) => {
        setElementsComponent(() => stripeReactModule.Elements);
        setStripeInstance(stripe);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Failed to load Stripe:', error);
        onError('Failed to load payment form. Please refresh the page and try again.');
        setIsLoading(false);
      });
    };

    // Defer loading to next idle period to avoid blocking main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadStripe, { timeout: 2000 });
    } else {
      setTimeout(loadStripe, 0);
    }
  }, [onError]);

  if (isLoading || !ElementsComponent || !stripeInstance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      </div>
    }>
      <ElementsComponent stripe={stripeInstance} options={{ clientSecret }}>
        <PaymentForm
          clientSecret={clientSecret}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </ElementsComponent>
    </Suspense>
  );
};

const Donate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  // Get donation amount from URL or default to custom
  const presetAmount = searchParams.get('amount');
  const [donationAmount, setDonationAmount] = useState(presetAmount ? parseFloat(presetAmount) : 0);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Payment details for non-Stripe methods
  const [paymentDetails, setPaymentDetails] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  // Preset amounts
  const presetAmounts = [10, 20, 50, 100, 250, 500];

  const handleAmountSelect = (amount: number) => {
    setDonationAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDonationAmount(numValue);
    } else {
      setDonationAmount(0);
    }
  };

  // Create payment intent when payment method changes
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (donationAmount <= 0) return;

      // PayPal doesn't use Stripe payment intents - it has its own flow
      if (paymentMethod === 'paypal') {
        setShowPaymentForm(false);
        setClientSecret(null);
        return;
      }

      if (paymentMethod !== 'credit_card' && paymentMethod !== 'apple_pay' && paymentMethod !== 'google_pay') {
        return;
      }

      if (!clientSecret && !isProcessing && donationAmount > 0) {
        setIsProcessing(true);
        try {
          const intentResponse = await donationService.createDonationIntent({
            amount: donationAmount,
            paymentMethod: paymentMethod,
            email: paymentDetails.email,
            firstName: paymentDetails.firstName,
            lastName: paymentDetails.lastName
          });

          if (intentResponse.success && intentResponse.data?.clientSecret) {
            setClientSecret(intentResponse.data.clientSecret);
            setDonationId(intentResponse.data.donationId || null);
            setShowPaymentForm(true);
          } else {
            showToast('Failed to initialize payment. Please try again.', 'error');
          }
        } catch (error: any) {
          showToast(
            error.response?.data?.message || 'Payment initialization failed. Please try again.',
            'error'
          );
        } finally {
          setIsProcessing(false);
        }
      }
    };

    createPaymentIntent();
  }, [paymentMethod, donationAmount, paymentDetails.email, paymentDetails.firstName, paymentDetails.lastName]);

  const validateForm = () => {
    if (donationAmount <= 0) {
      showToast('Please select or enter a donation amount', 'error');
      return false;
    }

    if (!paymentDetails.email.trim()) {
      showToast('Please enter your email address', 'error');
      return false;
    }

    if (!paymentDetails.firstName.trim() || !paymentDetails.lastName.trim()) {
      showToast('Please enter your full name', 'error');
      return false;
    }

    return true;
  };

  const handlePaymentSuccess = async (_paymentIntentId: string) => {
    if (!donationId) {
      showToast('Donation ID not found. Please try again.', 'error');
      return;
    }

    try {
      const confirmResponse = await donationService.confirmDonation({
        donationId: donationId
      });

      if (confirmResponse.success) {
        showToast(
          `Thank you for your generous donation of $${donationAmount.toFixed(2)}! Your contribution makes a difference.`,
          'success'
        );
        
        // Redirect after success
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        showToast('Payment processing failed. Please try again.', 'error');
        setIsProcessing(false);
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'An error occurred. Please try again.',
        'error'
      );
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    showToast(error, 'error');
    setIsProcessing(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="text-white" size={32} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Make a Donation</h1>
              <p className="text-gray-600">Support our mission to help pets in need</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donation Amount */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Heart className="text-pink-500" size={24} />
                Select Donation Amount
              </h2>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleAmountSelect(amount)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      donationAmount === amount
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter a custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {donationAmount > 0 && (
                <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-pink-600">Your donation:</span>{' '}
                    <span className="text-2xl font-bold text-pink-600">${donationAmount.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" size={24} />
                Payment Method
              </h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'credit_card' ? 'border-blue-500' : 'border-gray-400'
                      }`}>
                        {paymentMethod === 'credit_card' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Credit / Debit Card</span>
                        <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">Visa</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">MC</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">Amex</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'paypal' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'paypal' && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">PayPal</span>
                      <p className="text-sm text-gray-600">Pay with your PayPal account</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    paymentMethod === 'apple_pay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'apple_pay' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'apple_pay' && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Apple Pay</span>
                      <p className="text-sm text-gray-600">Pay securely with Apple Pay</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('google_pay')}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    paymentMethod === 'google_pay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'google_pay' ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'google_pay' && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Google Pay</span>
                      <p className="text-sm text-gray-600">Pay securely with Google Pay</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Stripe Payment Form */}
            {showPaymentForm && clientSecret && paymentMethod !== 'paypal' && (
              <StripePaymentWrapper
                clientSecret={clientSecret}
                amount={donationAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            )}

            {/* Contact Information */}
            {!showPaymentForm && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.firstName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.lastName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={paymentDetails.email}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Shield className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">Secure Payment</p>
                <p className="text-xs text-green-700">
                  Your payment information is encrypted and secure. We use industry-standard SSL encryption and Stripe to protect your data.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Donation Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Donation Amount</span>
                  <span className="text-2xl font-bold text-pink-600">
                    ${donationAmount > 0 ? donationAmount.toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${donationAmount > 0 ? donationAmount.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    All donations are tax-deductible
                  </p>
                </div>
              </div>

              {!showPaymentForm && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      // Payment intent will be created automatically via useEffect
                      if (paymentMethod === 'paypal') {
                        showToast('PayPal integration coming soon. Please use credit card.', 'info');
                      }
                    }
                  }}
                  disabled={isProcessing || donationAmount <= 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Continue to Payment`
                  )}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                By donating, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default Donate;
