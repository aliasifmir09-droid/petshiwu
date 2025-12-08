import { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { AlertCircle, Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (orderId: string, payerId?: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  currency?: string;
}

const PayPalButtonContent = ({ amount, onSuccess, onError, onCancel, currency = 'USD' }: PayPalButtonProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount.toFixed(2),
            currency_code: currency,
          },
        },
      ],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      // Capture the payment
      const details = await actions.order.capture();
      
      if (details.status === 'COMPLETED') {
        // Payment successful
        onSuccess(details.id, details.payer?.payer_id);
      } else {
        const errorMsg = 'Payment was not completed. Please try again.';
        setError(errorMsg);
        onError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment processing failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
    }
  };

  const onErrorHandler = (err: any) => {
    const errorMsg = err.message || 'An error occurred with PayPal. Please try again.';
    setError(errorMsg);
    onError(errorMsg);
  };

  const onCancelHandler = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="animate-spin text-primary-600 mr-3" size={24} />
        <span className="text-gray-700">Loading PayPal...</span>
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

