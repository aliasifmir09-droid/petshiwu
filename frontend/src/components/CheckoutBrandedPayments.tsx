import { Suspense, lazy } from 'react';
import { PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { paypalCheckoutScriptOptions, paypalClientId } from '@/config/paypal';
import type { PayPalButtonProps } from '@/components/PayPalButton';
import type { PayPalApplePayProps } from '@/components/PayPalApplePay';
import type { PayPalGooglePayProps } from '@/components/PayPalGooglePay';

const PayPalButton = lazy(() => import('@/components/PayPalButton'));
const PayPalApplePay = lazy(() => import('@/components/PayPalApplePay'));
const PayPalGooglePay = lazy(() => import('@/components/PayPalGooglePay'));

type CheckoutBrandedPaymentsProps = PayPalButtonProps &
  Pick<PayPalApplePayProps, 'total'> &
  Pick<PayPalGooglePayProps, 'total'>;

const BrandedPaymentButtons = (props: CheckoutBrandedPaymentsProps) => {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Loading secure payment...</span>
      </div>
    );
  }

  const walletProps = {
    items: props.items,
    shippingAddress: props.shippingAddress,
    guestEmail: props.guestEmail,
    notes: props.notes,
    couponCode: props.couponCode,
    donationAmount: props.donationAmount,
    onSuccess: props.onSuccess,
    onError: props.onError,
    onGuestEmailInvalid: props.onGuestEmailInvalid,
  };

  return (
    <div className="space-y-3">
      <Suspense fallback={null}>
        <PayPalApplePay {...walletProps} total={props.total} />
      </Suspense>
      <Suspense fallback={null}>
        <PayPalGooglePay {...walletProps} total={props.total} />
      </Suspense>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-600">Loading PayPal...</span>
          </div>
        }
      >
        <PayPalButton {...walletProps} onCancel={props.onCancel} skipProvider />
      </Suspense>
    </div>
  );
};

const CheckoutBrandedPayments = (props: CheckoutBrandedPaymentsProps) => {
  if (!paypalClientId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">PayPal is temporarily unavailable.</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalCheckoutScriptOptions(props.currency || 'USD')}>
      <BrandedPaymentButtons {...props} />
    </PayPalScriptProvider>
  );
};

export default CheckoutBrandedPayments;
