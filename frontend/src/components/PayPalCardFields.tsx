import { useEffect, useRef, useState } from 'react';
import {
  PayPalCardFieldsForm,
  PayPalCardFieldsProvider,
  PayPalScriptProvider,
  usePayPalCardFields,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { AlertCircle, CreditCard, Loader2, Lock } from 'lucide-react';
import { orderService } from '@/services/orders';
import type { ShippingAddress, Order } from '@/types';

interface PayPalItemInput {
  product: string;
  quantity: number;
  variant?: { sku: string };
}

interface PayPalCardFieldsProps {
  items: PayPalItemInput[];
  shippingAddress: import('@/types').ShippingAddress;
  guestEmail?: string;
  notes?: string;
  couponCode?: string;
  donationAmount?: number;
  onSuccess: (order: import('@/types').Order) => void;
  onError: (error: string) => void;
  onGuestEmailInvalid?: () => void;
  onCancel?: () => void;
  onSwitchToWallet?: () => void;
  currency?: string;
}

interface CardFieldsContentProps extends PayPalCardFieldsProps {
  error: string | null;
  isProcessing: boolean;
  isEligible: boolean | null;
  onSetError: (error: string | null) => void;
  onSetProcessing: (processing: boolean) => void;
}

const CardFieldsContent = ({
  error,
  isProcessing,
  isEligible,
  onSetError,
  onSetProcessing,
  onError,
  onCancel,
  onSwitchToWallet
}: CardFieldsContentProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const { cardFieldsForm } = usePayPalCardFields();

  useEffect(() => {
    if (!cardFieldsForm) return;
    // The provider initializes the hosted fields and exposes merchant eligibility.
    // The fields remain PayPal-hosted; card data never enters Petshiwu code.
  }, [cardFieldsForm]);

  const submitCardPayment = async () => {
    if (!cardFieldsForm) {
      const errorMsg = 'PayPal card fields are still loading. Please wait a moment and try again.';
      onSetError(errorMsg);
      onError(errorMsg);
      return;
    }

    onSetProcessing(true);
    onSetError(null);
    try {
      await cardFieldsForm.submit();
    } catch (err: any) {
      const errorMsg = err?.message || 'Please check your card details and try again.';
      onSetError(errorMsg);
      onError(errorMsg);
      onSetProcessing(false);
    }
  };

  if (isPending || isEligible === null) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="animate-spin text-primary-600 mr-3" size={24} />
        <span className="text-gray-700">Loading secure card fields...</span>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          PayPal card payments are not enabled for this account yet. Choose PayPal Wallet instead.
        </p>
        <div className="flex gap-3 mt-4">
          {onSwitchToWallet && (
            <button
              type="button"
              onClick={onSwitchToWallet}
              className="flex-1 px-4 py-3 bg-[#0070ba] text-white font-semibold rounded-lg hover:bg-[#005ea6] transition-colors"
            >
              Use PayPal Wallet
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Card Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <CreditCard className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Credit/Debit Card</h3>
          <p className="text-sm text-gray-600">Securely processed by PayPal</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
        <PayPalCardFieldsForm />
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Lock size={14} className="flex-shrink-0 mt-0.5" />
        <p>Your card details are entered into secure PayPal-hosted fields. Petshiwu never receives or stores your card number or security code.</p>
      </div>

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
          type="button"
          onClick={submitCardPayment}
          disabled={!cardFieldsForm || isProcessing}
          className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            <>
              <Lock size={18} />
              Pay securely with PayPal
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const PayPalCardFields = (props: PayPalCardFieldsProps) => {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const checkoutTokenRef = useRef<string>(crypto.randomUUID());
  const captureInFlightRef = useRef<string | null>(null);

  if (!paypalClientId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">PayPal card payments are not configured.</p>
      </div>
    );
  }

  const createOrder = async () => {
    setError(null);
    const normalizedGuestEmail = props.guestEmail?.trim();
    if (props.guestEmail !== undefined && (!normalizedGuestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedGuestEmail))) {
      const errorMsg = 'Please enter a valid email address to continue with PayPal.';
      setError(errorMsg);
      props.onGuestEmailInvalid?.();
      props.onError(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const response = await orderService.createPayPalOrder({
        items: props.items,
        shippingAddress: props.shippingAddress,
        guestEmail: normalizedGuestEmail,
        notes: props.notes,
        couponCode: props.couponCode,
        donationAmount: props.donationAmount,
        checkoutToken: checkoutTokenRef.current
      });
      const paypalOrderId = response.data?.paypalOrderId;
      const createdCheckoutToken = response.data?.checkoutToken;
      if (!response.success || !paypalOrderId || !createdCheckoutToken) {
        throw new Error('PayPal could not initialize this card payment.');
      }
      setCheckoutToken(createdCheckoutToken);
      return paypalOrderId;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal could not initialize this card payment.';
      setError(errorMsg);
      props.onError(errorMsg);
      throw err;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    if (captureInFlightRef.current === data.orderID) return;
    captureInFlightRef.current = data.orderID;

    if (!checkoutToken) {
      captureInFlightRef.current = null;
      const errorMsg = 'PayPal checkout session expired. Please try again.';
      setError(errorMsg);
      props.onError(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const response = await orderService.capturePayPalOrder({
        paypalOrderId: data.orderID,
        checkoutToken
      });
      const order = response.data?.order;
      if (!response.success || response.data?.paymentStatus !== 'paid' || !order?._id) {
        throw new Error('PayPal card payment was not completed. Please try again.');
      }
      props.onSuccess(order);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal card payment failed. Please try again.';
      setError(errorMsg);
      props.onError(errorMsg);
    } finally {
      setIsProcessing(false);
      if (captureInFlightRef.current === data.orderID) captureInFlightRef.current = null;
    }
  };

  const onError = (err: Record<string, unknown>) => {
    const errorMsg = typeof err?.message === 'string'
      ? err.message
      : 'PayPal card payment could not be initialized. Please try PayPal Wallet.';
    setError(errorMsg);
    setIsEligible(false);
    props.onError(errorMsg);
    setIsProcessing(false);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: props.currency || 'USD',
        intent: 'capture',
        components: 'card-fields'
      }}
    >
      <PayPalCardFieldsProvider createOrder={createOrder} onApprove={onApprove} onError={onError}>
        <CardFieldsContent
          {...props}
          error={error}
          isProcessing={isProcessing}
          isEligible={isEligible}
          onSetError={setError}
          onSetProcessing={setIsProcessing}
        />
        <EligibilityBridge onEligibilityChange={setIsEligible} />
      </PayPalCardFieldsProvider>
    </PayPalScriptProvider>
  );
};

const EligibilityBridge = ({ onEligibilityChange }: { onEligibilityChange: (eligible: boolean) => void }) => {
  const { cardFieldsForm } = usePayPalCardFields();

  useEffect(() => {
    if (cardFieldsForm) {
      onEligibilityChange(cardFieldsForm.isEligible());
    }
  }, [cardFieldsForm, onEligibilityChange]);

  return null;
};

export default PayPalCardFields;
