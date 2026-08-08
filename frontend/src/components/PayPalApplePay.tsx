import { useEffect, useRef, useState } from 'react';
import type { Order, ShippingAddress } from '@/types';
import { orderService } from '@/services/orders';

interface PayPalItemInput {
  product: string;
  quantity: number;
  variant?: { sku: string };
}

export interface PayPalApplePayProps {
  items: PayPalItemInput[];
  total: number;
  shippingAddress: ShippingAddress;
  guestEmail?: string;
  notes?: string;
  couponCode?: string;
  donationAmount?: number;
  onSuccess: (order: Order) => void;
  onError: (error: string) => void;
  onGuestEmailInvalid?: () => void;
}

interface ApplePayConfig {
  isEligible?: boolean;
  countryCode: string;
  merchantCapabilities: string[];
  supportedNetworks: string[];
}

interface ApplePayPaymentRequest {
  countryCode: string;
  merchantCapabilities: string[];
  supportedNetworks: string[];
  currencyCode: string;
  requiredShippingContactFields?: string[];
  requiredBillingContactFields?: string[];
  total: {
    label: string;
    type: 'final' | 'pending';
    amount: string;
  };
}

interface ApplePayPaymentToken {
  paymentData?: unknown;
  paymentMethod?: unknown;
  transactionIdentifier?: string;
}

interface ApplePayContact {
  [key: string]: unknown;
}

interface ApplePayPayment {
  token: ApplePayPaymentToken;
  billingContact?: ApplePayContact;
  shippingContact?: ApplePayContact;
}

interface ApplePayMerchantValidationEvent {
  validationURL: string;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: ApplePayPayment;
}

interface ApplePayMerchantSessionResult {
  merchantSession: unknown;
}

interface PayPalApplePayInstance {
  config: () => Promise<ApplePayConfig>;
  validateMerchant: (options: {
    validationUrl: string;
    displayName: string;
  }) => Promise<ApplePayMerchantSessionResult>;
  confirmOrder: (options: {
    orderId: string;
    token: ApplePayPaymentToken;
    billingContact?: ApplePayContact;
  }) => Promise<{ status?: string }>;
}

interface PayPalGlobalExtension {
  Applepay?: () => PayPalApplePayInstance;
}

type PayPalWithApplePay = PayPalGlobalExtension;

interface ApplePaySessionInstance {
  onvalidatemerchant: ((event: ApplePayMerchantValidationEvent) => void) | null;
  onpaymentauthorized: ((event: ApplePayPaymentAuthorizedEvent) => void) | null;
  oncancel: (() => void) | null;
  begin: () => void;
  abort: () => void;
  completeMerchantValidation: (merchantSession: unknown) => void;
  completePayment: (status: number) => void;
}

interface ApplePaySessionConstructor {
  new (version: number, paymentRequest: ApplePayPaymentRequest): ApplePaySessionInstance;
  canMakePayments: () => boolean;
  STATUS_SUCCESS: number;
  STATUS_FAILURE: number;
}

declare global {
  interface Window {
    ApplePaySession?: ApplePaySessionConstructor;
  }

  namespace JSX {
    interface IntrinsicElements {
      'apple-pay-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        buttonstyle?: string;
        type?: string;
        locale?: string;
      };
    }
  }
}

const getPayPalWithApplePay = (): PayPalWithApplePay | null =>
  (window as Window & { paypal?: PayPalWithApplePay | null }).paypal || null;

const APPLE_PAY_SDK_URL = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
const APPLE_PAY_SDK_ID = 'petshiwu-apple-pay-sdk';
const PAYPAL_SDK_ID = 'petshiwu-paypal-apple-pay-sdk';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const scriptPromises = new Map<string, Promise<void>>();

const loadScript = (src: string, id: string): Promise<void> => {
  const existingPromise = scriptPromises.get(src);
  if (existingPromise) return existingPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Unable to load ${id}.`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${id}.`));
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return candidate?.response?.data?.message || candidate?.message || fallback;
};

const unavailableMessage =
  "Apple Pay isn't available on this device or browser. Please use PayPal or card checkout instead.";

const PayPalApplePay = ({
  items,
  total,
  shippingAddress,
  guestEmail,
  notes,
  couponCode,
  donationAmount = 0,
  onSuccess,
  onError,
  onGuestEmailInvalid,
}: PayPalApplePayProps) => {
  const [status, setStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applePay, setApplePay] = useState<PayPalApplePayInstance | null>(null);
  const [applePayConfig, setApplePayConfig] = useState<ApplePayConfig | null>(null);
  const sessionRef = useRef<ApplePaySessionInstance | null>(null);
  const captureInFlightRef = useRef(false);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!clientId || !Number.isFinite(total) || total <= 0) {
        if (!cancelled) setStatus('unavailable');
        return;
      }

      try {
        const paypalSdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
          clientId,
        )}&currency=USD&buyer-country=US&intent=capture&components=applepay`;

        await Promise.all([
          loadScript(APPLE_PAY_SDK_URL, APPLE_PAY_SDK_ID),
          getPayPalWithApplePay()?.Applepay
            ? Promise.resolve()
            : loadScript(paypalSdkUrl, PAYPAL_SDK_ID),
        ]);

        const ApplePaySessionCtor = window.ApplePaySession;
        const paypalGlobal = getPayPalWithApplePay();
        if (!ApplePaySessionCtor || !paypalGlobal?.Applepay || !ApplePaySessionCtor.canMakePayments()) {
          if (!cancelled) setStatus('unavailable');
          return;
        }

        const applePayInstance = paypalGlobal.Applepay();
        const config = await applePayInstance.config();
        if (cancelled) return;

        if (!config?.isEligible) {
          setStatus('unavailable');
          return;
        }

        setApplePay(applePayInstance);
        setApplePayConfig(config);
        setStatus('available');
      } catch (initializationError) {
        if (!cancelled) {
          setStatus('unavailable');
          setError(getErrorMessage(initializationError, unavailableMessage));
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      sessionRef.current = null;
    };
  }, [clientId, total]);

  const reportError = (message: string) => {
    setError(message);
    onError(message);
  };

  const validateGuestEmail = (): string | undefined => {
    const normalizedGuestEmail = guestEmail?.trim();
    if (
      guestEmail !== undefined &&
      (!normalizedGuestEmail || !EMAIL_PATTERN.test(normalizedGuestEmail))
    ) {
      const message = 'Please enter a valid email address to continue with Apple Pay.';
      setError(message);
      onGuestEmailInvalid?.();
      onError(message);
      return undefined;
    }
    return normalizedGuestEmail;
  };

  const handleApplePayClick = () => {
    if (!applePay || !applePayConfig || !window.ApplePaySession || isProcessing) return;

    const normalizedGuestEmail = validateGuestEmail();
    if (guestEmail !== undefined && !normalizedGuestEmail) return;

    if (!Number.isFinite(total) || total <= 0) {
      reportError('Apple Pay could not start because the order total is invalid.');
      return;
    }

    let session: ApplePaySessionInstance;
    try {
      const paymentRequest: ApplePayPaymentRequest = {
        countryCode: applePayConfig.countryCode || shippingAddress.country || 'US',
        merchantCapabilities: applePayConfig.merchantCapabilities,
        supportedNetworks: applePayConfig.supportedNetworks,
        currencyCode: 'USD',
        requiredShippingContactFields: ['name', 'phone', 'email', 'postalAddress'],
        requiredBillingContactFields: ['postalAddress'],
        total: {
          label: 'Petshiwu',
          type: 'final',
          amount: total.toFixed(2),
        },
      };

      // Apple requires the session to be constructed from the user's click handler.
      session = new window.ApplePaySession(4, paymentRequest);
    } catch (sessionError) {
      reportError(getErrorMessage(sessionError, unavailableMessage));
      return;
    }

    sessionRef.current = session;
    setError(null);

    session.onvalidatemerchant = (event) => {
      void applePay
        .validateMerchant({
          validationUrl: event.validationURL,
          displayName: 'Petshiwu',
        })
        .then((validationResult) => {
          session.completeMerchantValidation(validationResult.merchantSession);
        })
        .catch((validationError) => {
          session.abort();
          reportError(getErrorMessage(validationError, 'Apple Pay merchant validation failed.'));
        });
    };

    session.onpaymentauthorized = (event) => {
      if (captureInFlightRef.current) return;
      captureInFlightRef.current = true;
      setIsProcessing(true);

      void (async () => {
        try {
          const createResponse = await orderService.createPayPalOrder({
            items,
            shippingAddress,
            guestEmail: normalizedGuestEmail,
            notes,
            couponCode,
            donationAmount,
          });

          const paypalOrderId = createResponse.data?.paypalOrderId;
          const checkoutToken = createResponse.data?.checkoutToken;
          if (!createResponse.success || !paypalOrderId || !checkoutToken) {
            throw new Error('Apple Pay could not initialize this payment.');
          }

          const confirmation = await applePay.confirmOrder({
            orderId: paypalOrderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
          });
          if (confirmation?.status && !['APPROVED', 'COMPLETED'].includes(confirmation.status)) {
            throw new Error('Apple Pay authorization was not approved.');
          }

          const captureResponse = await orderService.capturePayPalOrder({
            paypalOrderId,
            checkoutToken,
          });
          const order = captureResponse.data?.order;
          if (!captureResponse.success || captureResponse.data?.paymentStatus !== 'paid' || !order?._id) {
            throw new Error('Apple Pay payment was not completed. Please try again.');
          }

          session.completePayment(window.ApplePaySession?.STATUS_SUCCESS ?? 1);
          onSuccess(order);
        } catch (paymentError) {
          session.completePayment(window.ApplePaySession?.STATUS_FAILURE ?? 0);
          reportError(
            getErrorMessage(paymentError, 'Apple Pay payment processing failed. Please try again.'),
          );
        } finally {
          setIsProcessing(false);
          captureInFlightRef.current = false;
          if (sessionRef.current === session) sessionRef.current = null;
        }
      })();
    };

    session.oncancel = () => {
      captureInFlightRef.current = false;
      sessionRef.current = null;
      setIsProcessing(false);
    };

    try {
      session.begin();
    } catch (beginError) {
      sessionRef.current = null;
      reportError(getErrorMessage(beginError, unavailableMessage));
    }
  };

  if (status === 'loading') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-700">
        Checking Apple Pay availability…
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-700">
        {error || unavailableMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      <apple-pay-button
        buttonstyle="black"
        type="buy"
        locale="en-US"
        onClick={handleApplePayClick}
        aria-label="Pay with Apple Pay"
        style={{ display: isProcessing ? 'none' : 'block', width: '100%', height: '48px' }}
      />
      {isProcessing && (
        <div className="flex min-h-[48px] items-center justify-center rounded-md bg-black px-5 py-3 text-base font-semibold text-white">
          Processing Apple Pay…
        </div>
      )}
    </div>
  );
};

export default PayPalApplePay;
