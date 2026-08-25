import { useRef, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { AlertCircle, Loader2 } from 'lucide-react';
import { paypalCheckoutScriptOptions, paypalClientId } from '@/config/paypal';
import { orderService } from '@/services/orders';

interface PayPalItemInput {
  product: string;
  quantity: number;
  variant?: { sku: string };
}

export interface PayPalButtonProps {
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
  currency?: string;
  skipProvider?: boolean;
}

const PayPalButtonContent = ({ items, shippingAddress, guestEmail, notes, couponCode, donationAmount = 0, onSuccess, onError, onGuestEmailInvalid, onCancel, currency = 'USD' }: PayPalButtonProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Keep the token in a ref. PayPal calls onApprove from the original
  // createOrder closure; React state set during createOrder is often still null.
  const checkoutTokenRef = useRef<string>(crypto.randomUUID());
  const captureInFlightRef = useRef<string | null>(null);
  const donationAmountRef = useRef(donationAmount);
  donationAmountRef.current = donationAmount;

  const createOrder = async () => {
    setError(null);
      const normalizedGuestEmail = guestEmail?.trim();
      if (guestEmail !== undefined && (!normalizedGuestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedGuestEmail))) {
        const errorMsg = 'Please enter a valid email address to continue with PayPal.';
        setError(errorMsg);
        onGuestEmailInvalid?.();
        onError(errorMsg);
        throw new Error(errorMsg);
      }
      try {
        const response = await orderService.createPayPalOrder({
        items,
        shippingAddress,
        guestEmail: normalizedGuestEmail,
        notes,
        couponCode,
        donationAmount: donationAmountRef.current,
        checkoutToken: checkoutTokenRef.current
      });
      const paypalOrderId = response.data?.paypalOrderId;
      const createdCheckoutToken = response.data?.checkoutToken;
      if (!response.success || !paypalOrderId || !createdCheckoutToken) {
        throw new Error('PayPal could not initialize this payment.');
      }
      checkoutTokenRef.current = createdCheckoutToken;
      return paypalOrderId;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal could not initialize this payment.';
      setError(errorMsg);
      onError(errorMsg);
      // PayPal invokes onError after createOrder rejects. Re-throw the
      // normalized message so the SDK does not replace the useful backend
      // error with Axios's generic "Request failed with status code 400".
      throw new Error(errorMsg);
    }
  };

  const onApprove = async (data: { orderID?: string }) => {
    const paypalOrderId = data.orderID;
    if (!paypalOrderId) {
      const errorMsg = 'PayPal returned no order ID. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
      return;
    }
    if (captureInFlightRef.current === paypalOrderId) return;
    captureInFlightRef.current = paypalOrderId;

    const checkoutToken = checkoutTokenRef.current;
    if (!checkoutToken) {
      captureInFlightRef.current = null;
      const errorMsg = 'PayPal checkout session expired. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const response = await orderService.capturePayPalOrder({ paypalOrderId, checkoutToken });
      const order = response.data?.order;
      if (!response.success || response.data?.paymentStatus !== 'paid' || !order?._id) {
        throw new Error('PayPal payment was not completed. Please try again.');
      }
      onSuccess(order);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal payment processing failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsProcessing(false);
      if (captureInFlightRef.current === paypalOrderId) captureInFlightRef.current = null;
    }
  };

  const onErrorHandler = (err: any) => {
    const errorMsg = err?.message || 'An error occurred with PayPal. Please try again.';
    setError(errorMsg);
    onError(errorMsg);
  };

  const onCancelHandler = () => {
    if (onCancel) onCancel();
  };

  if (isPending || isProcessing) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="animate-spin text-primary-600 mr-3" size={24} />
        <span className="text-gray-700">{isProcessing ? 'Confirming PayPal payment...' : 'Loading PayPal...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onErrorHandler}
        onCancel={onCancelHandler}
        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal', height: 48 }}
      />
    </div>
  );
};

const PayPalButton = ({ skipProvider = false, ...props }: PayPalButtonProps) => {
  if (!paypalClientId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          PayPal is not configured. Please set VITE_PAYPAL_CLIENT_ID in your environment variables.
        </p>
      </div>
    );
  }

  const content = <PayPalButtonContent {...props} />;
  if (skipProvider) return content;

  return (
    <PayPalScriptProvider options={paypalCheckoutScriptOptions(props.currency || 'USD')}>
      {content}
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
