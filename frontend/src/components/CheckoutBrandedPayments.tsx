import { PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { paypalCheckoutScriptOptions, paypalClientId } from '@/config/paypal';
import PayPalButton from '@/components/PayPalButton';
import PayPalApplePay from '@/components/PayPalApplePay';
import PayPalGooglePay from '@/components/PayPalGooglePay';
import type { PayPalButtonProps } from '@/components/PayPalButton';
import type { PayPalApplePayProps } from '@/components/PayPalApplePay';
import type { PayPalGooglePayProps } from '@/components/PayPalGooglePay';

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
      <PayPalApplePay {...walletProps} total={props.total} />
      <PayPalGooglePay {...walletProps} total={props.total} />
      <PayPalButton {...walletProps} onCancel={props.onCancel} skipProvider />
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
