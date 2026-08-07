import { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { AlertCircle, Loader2 } from 'lucide-react';
import { orderService } from '@/services/orders';

interface PayPalItemInput {
  product: string;
  quantity: number;
  variant?: { sku: string };
}

interface PayPalButtonProps {
  items: PayPalItemInput[];
  couponCode?: string;
  donationAmount?: number;
  onSuccess: (orderId: string, payerId?: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  currency?: string;
}

const PayPalButtonContent = ({ items, couponCode, donationAmount = 0, onSuccess, onError, onCancel, currency = 'USD' }: PayPalButtonProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = async () => {
    setError(null);
    try {
      const response = await orderService.createPayPalOrder({ items, couponCode, donationAmount });
      const paypalOrderId = response.data?.paypalOrderId;
      if (!response.success || !paypalOrderId) {
        throw new Error('PayPal could not initialize this payment.');
      }
      return paypalOrderId;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal could not initialize this payment.';
      setError(errorMsg);
      onError(errorMsg);
      throw err;
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

    setIsProcessing(true);
    setError(null);
    try {
      const response = await orderService.capturePayPalOrder({
        paypalOrderId,
        items,
        couponCode,
        donationAmount
      });
      const capturedOrderId = response.data?.paypalOrderId;
      if (!response.success || response.data?.paymentStatus !== 'paid' || !capturedOrderId) {
        throw new Error('PayPal payment was not completed. Please try again.');
      }
      onSuccess(capturedOrderId);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'PayPal payment processing failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsProcessing(false);
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
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        }}
      />
    </div>
  );
};

const PayPalButton = (props: PayPalButtonProps) => {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          PayPal is not configured. Please set VITE_PAYPAL_CLIENT_ID in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: props.currency || 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtonContent {...props} />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
