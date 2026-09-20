import { useEffect, useRef, useState } from 'react';
import { FUNDING, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { paypalCheckoutScriptOptions, paypalClientId } from '@/config/paypal';
import PayPalButton from '@/components/PayPalButton';
import PayPalApplePay from '@/components/PayPalApplePay';
import PayPalGooglePay from '@/components/PayPalGooglePay';
import PayPalCardFields, { CardFieldSkeletons } from '@/components/PayPalCardFields';
import type { PayPalButtonProps } from '@/components/PayPalButton';
import type { PayPalApplePayProps } from '@/components/PayPalApplePay';
import type { PayPalGooglePayProps } from '@/components/PayPalGooglePay';

type CheckoutBrandedPaymentsProps = PayPalButtonProps &
  Pick<PayPalApplePayProps, 'total'> &
  Pick<PayPalGooglePayProps, 'total'> & {
    onSwitchToWallet?: () => void;
    hideCardFields?: boolean;
  };

const CardBrandMarks = () => (
  <div className="flex flex-wrap items-center gap-1.5" aria-label="Visa, Mastercard, American Express, Discover">
    {['Visa', 'Mastercard', 'Amex', 'Discover'].map((brand) => (
      <span
        key={brand}
        className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600"
      >
        {brand}
      </span>
    ))}
  </div>
);

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="h-px flex-1 bg-stone-200" />
    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
    <div className="h-px flex-1 bg-stone-200" />
  </div>
);

const CardPaymentSection = (props: CheckoutBrandedPaymentsProps) => {
  const [{ isResolved }] = usePayPalScriptReducer();
  const hostRef = useRef<HTMLDivElement>(null);
  const [useCardButton, setUseCardButton] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);

  useEffect(() => {
    if (!isResolved || fieldsReady) return;
    const timer = window.setTimeout(() => {
      const hasIframe = Boolean(hostRef.current?.querySelector('iframe'));
      if (!hasIframe) setUseCardButton(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isResolved, fieldsReady]);

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
    <section id="card-payment" className="overflow-visible rounded-2xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-bold text-stone-900">Credit or debit card</p>
        <CardBrandMarks />
      </div>
      {useCardButton ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">Pay with debit or credit card.</p>
          <PayPalButton
            {...walletProps}
            fundingSource={FUNDING.CARD}
            skipProvider
            onCancel={props.onCancel}
          />
        </div>
      ) : (
        <div ref={hostRef}>
          {isResolved ? (
            <PayPalCardFields
              {...walletProps}
              currency={props.currency || 'USD'}
              skipProvider
              total={props.total}
              onCancel={props.onCancel}
              onSwitchToWallet={props.onSwitchToWallet}
              onFieldsReady={() => setFieldsReady(true)}
            />
          ) : (
            <CardFieldSkeletons total={props.total} />
          )}
        </div>
      )}
    </section>
  );
};

const BrandedPaymentButtons = (props: CheckoutBrandedPaymentsProps) => {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-stone-600">Loading secure payment...</span>
        </div>
        {!props.hideCardFields && (
          <section id="card-payment" className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-bold text-stone-900">Credit or debit card</p>
              <CardBrandMarks />
            </div>
            <CardFieldSkeletons total={props.total} />
          </section>
        )}
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
      {!props.hideCardFields && (
        <>
          <Divider label="or pay with card" />
          <CardPaymentSection {...props} />
        </>
      )}
      <Divider label="or" />
      <PayPalButton {...walletProps} fundingSource={FUNDING.PAYPAL} onCancel={props.onCancel} skipProvider />
    </div>
  );
};

const CheckoutBrandedPayments = (props: CheckoutBrandedPaymentsProps) => {
  if (!paypalClientId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
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
