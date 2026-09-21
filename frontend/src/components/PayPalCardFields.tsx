import { useEffect, useRef, useState } from 'react';
import {
  PayPalCardFieldsProvider,
  PayPalCVVField,
  PayPalExpiryField,
  PayPalNameField,
  PayPalNumberField,
  PayPalScriptProvider,
  usePayPalCardFields,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { paypalClientId, paypalSdkEnvironment } from '@/config/paypal';
import { orderService } from '@/services/orders';
import { paypalCheckoutBlocker } from '@/utils/paypalCheckoutReady';

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
  skipProvider?: boolean;
  total?: number;
  onFieldsReady?: () => void;
}

interface CardFieldsContentProps extends PayPalCardFieldsProps {
  error: string | null;
  isProcessing: boolean;
  onSetError: (error: string | null) => void;
  onSetProcessing: (processing: boolean) => void;
}

const CARD_FIELD_STYLE = {
  input: {
    'font-size': '16px',
    'font-family': 'Nunito, ui-sans-serif, system-ui, sans-serif',
    'font-weight': '600',
    color: '#1c1917',
    padding: '0 14px',
  },
};

const fieldClass = 'petshiwu-card-field h-12 w-full overflow-hidden rounded-xl border border-stone-200 bg-white';

export const CardFieldSkeletons = ({ total }: { total?: number }) => (
  <div className="space-y-3" aria-hidden="true">
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">Card number</span>
      <div className={`${fieldClass} flex items-center px-3.5 text-sm font-medium text-stone-400`}>
        ACCT-000028
      </div>
    </label>
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">Name on card</span>
      <div className={`${fieldClass} flex items-center px-3.5 text-sm font-medium text-stone-400`}>
        Name on card
      </div>
    </label>
    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-stone-700">Expiration</span>
        <div className={`${fieldClass} flex items-center px-3.5 text-sm font-medium text-stone-400`}>
          MM / YY
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-stone-700">Security code</span>
        <div className={`${fieldClass} flex items-center px-3.5 text-sm font-medium text-stone-400`}>
          CVV
        </div>
      </label>
    </div>
    <div className="flex h-12 items-center justify-center rounded-xl bg-[#1E3A8A] text-base font-bold text-white">
      {typeof total === 'number' && Number.isFinite(total)
        ? `Pay $${total.toFixed(2)}`
        : 'Pay now'}
    </div>
  </div>
);

const CardFieldsContent = ({
  error,
  isProcessing,
  onSetError,
  onSetProcessing,
  onError,
  total,
  onFieldsReady,
}: CardFieldsContentProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const { cardFieldsForm } = usePayPalCardFields();

  useEffect(() => {
    if (cardFieldsForm) onFieldsReady?.();
  }, [cardFieldsForm, onFieldsReady]);

  const submitCardPayment = async () => {
    if (!cardFieldsForm) {
      const errorMsg = 'Card fields are still loading. Please wait a moment and try again.';
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

  if (isPending) {
    return <CardFieldSkeletons total={total} />;
  }

  const payLabel = typeof total === 'number' && Number.isFinite(total)
    ? `Pay $${total.toFixed(2)}`
    : 'Pay now';

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-stone-700">Card number</span>
        <PayPalNumberField className={fieldClass} placeholder="ACCT-000028" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-stone-700">Name on card</span>
        <PayPalNameField className={fieldClass} placeholder="Name on card" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-700">Expiration</span>
          <PayPalExpiryField className={fieldClass} placeholder="MM / YY" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-700">Security code</span>
          <PayPalCVVField className={fieldClass} placeholder="CVV" />
        </label>
      </div>

      <p className="flex items-start gap-2 text-xs text-stone-500">
        <Lock size={14} className="mt-0.5 flex-shrink-0" />
        <span>Secured checkout. We never store your full card number.</span>
      </p>

      <button
        type="button"
        onClick={submitCardPayment}
        disabled={!cardFieldsForm || isProcessing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] text-base font-bold text-white hover:bg-[#16307a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Processing...
          </>
        ) : (
          <>
            <Lock size={16} />
            {payLabel}
          </>
        )}
      </button>
    </div>
  );
};

const PayPalCardFields = ({ skipProvider = false, onFieldsReady, ...props }: PayPalCardFieldsProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldsLive, setFieldsLive] = useState(false);
  const checkoutTokenRef = useRef<string>(crypto.randomUUID());
  const captureInFlightRef = useRef<string | null>(null);
  const donationAmountRef = useRef(props.donationAmount);
  donationAmountRef.current = props.donationAmount;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const sync = () => {
      if (host.querySelector('iframe')) {
        setFieldsLive(true);
        onFieldsReady?.();
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [onFieldsReady]);

  if (!paypalClientId) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">Card payments are not configured.</p>
      </div>
    );
  }

  const createOrder = async () => {
    setError(null);
    const normalizedGuestEmail = props.guestEmail?.trim();
    const blocked = paypalCheckoutBlocker({
      shippingAddress: props.shippingAddress,
      guestEmail: props.guestEmail,
    });
    if (blocked) {
      setError(blocked);
      if (/email/i.test(blocked)) props.onGuestEmailInvalid?.();
      props.onError(blocked);
      throw new Error(blocked);
    }
    try {
      const response = await orderService.createPayPalOrder({
        items: props.items,
        shippingAddress: props.shippingAddress,
        guestEmail: normalizedGuestEmail,
        notes: props.notes,
        couponCode: props.couponCode,
        donationAmount: donationAmountRef.current,
        checkoutToken: checkoutTokenRef.current
      });
      const paypalOrderId = response.data?.paypalOrderId;
      const createdCheckoutToken = response.data?.checkoutToken;
      if (!response.success || !paypalOrderId || !createdCheckoutToken) {
        throw new Error('Card payment could not start. Please try again.');
      }
      checkoutTokenRef.current = createdCheckoutToken;
      return paypalOrderId;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Card payment could not start. Please try again.';
      setError(errorMsg);
      props.onError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    if (captureInFlightRef.current === data.orderID) return;
    captureInFlightRef.current = data.orderID;

    const checkoutToken = checkoutTokenRef.current;
    if (!checkoutToken) {
      captureInFlightRef.current = null;
      const errorMsg = 'Checkout session expired. Please try again.';
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
        throw new Error('Card payment was not completed. Please try again.');
      }
      props.onSuccess(order);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Card payment failed. Please try again.';
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
      : 'Card payment could not start. Please use Apple Pay, Google Pay, or PayPal.';
    setError(errorMsg);
    props.onError(errorMsg);
    setIsProcessing(false);
  };

  const fields = (
    <div ref={hostRef} className="relative min-h-[16rem]">
      {!fieldsLive && <CardFieldSkeletons total={props.total} />}
      <div className={fieldsLive ? 'relative' : 'pointer-events-none absolute inset-0 overflow-hidden opacity-0'}>
        <PayPalCardFieldsProvider
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          style={CARD_FIELD_STYLE}
        >
          <CardFieldsContent
            {...props}
            error={error}
            isProcessing={isProcessing}
            onSetError={setError}
            onSetProcessing={setIsProcessing}
            onFieldsReady={() => {
              setFieldsLive(true);
              onFieldsReady?.();
            }}
          />
        </PayPalCardFieldsProvider>
      </div>
    </div>
  );

  if (skipProvider) return fields;

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: props.currency || 'USD',
        intent: 'capture',
        environment: paypalSdkEnvironment,
        components: 'card-fields'
      }}
    >
      {fields}
    </PayPalScriptProvider>
  );
};

export default PayPalCardFields;
