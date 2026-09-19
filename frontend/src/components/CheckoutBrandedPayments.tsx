import { PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { paypalCheckoutScriptOptions, paypalClientId } from '@/config/paypal';
import PayPalButton from '@/components/PayPalButton';
import PayPalApplePay from '@/components/PayPalApplePay';
import PayPalGooglePay from '@/components/PayPalGooglePay';
import PayPalCardFields from '@/components/PayPalCardFields';
import type { PayPalButtonProps } from '@/components/PayPalButton';
import type { PayPalApplePayProps } from '@/components/PayPalApplePay';
import type { PayPalGooglePayProps } from '@/components/PayPalGooglePay';

type CheckoutBrandedPaymentsProps = PayPalButtonProps &
  Pick<PayPalApplePayProps, 'total'> &
  Pick<PayPalGooglePayProps, 'total'> & {
    onSwitchToWallet?: () => void;
  };

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
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div id="card-payment" className="relative min-h-[12rem] overflow-visible rounded-2xl border-2 border-[#1E3A8A] bg-blue-50/40 p-4">
        <p className="mb-3 text-base font-bold text-stone-900">Credit or debit card</p>
        <PayPalCardFields
          {...walletProps}
          currency={props.currency || 'USD'}
          skipProvider
          onCancel={props.onCancel}
          onSwitchToWallet={props.onSwitchToWallet}
        />
      </div>
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
