import { useEffect, useRef, useState } from 'react';
import type { Order, ShippingAddress } from '@/types';
import { orderService } from '@/services/orders';

interface PayPalItemInput {
  product: string;
  quantity: number;
  variant?: { sku: string };
}

export interface PayPalGooglePayProps {
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

interface GooglePayConfig {
  allowedPaymentMethods: Record<string, unknown>[];
  merchantInfo: Record<string, unknown>;
}

interface PayPalGooglePayInstance {
  config: () => Promise<GooglePayConfig>;
  confirmOrder: (options: {
    orderId: string;
    paymentMethodData: unknown;
    shippingAddress?: unknown;
    billingAddress?: unknown;
    email?: string;
  }) => Promise<{ id?: string; status?: string }>;
  initiatePayerAction?: (options: { orderId: string }) => Promise<unknown>;
}

interface GooglePaymentsClient {
  isReadyToPay: (request: Record<string, unknown>) => Promise<{ result?: boolean }>;
  createButton: (options: { onClick: () => void; buttonColor?: string; buttonType?: string }) => HTMLElement;
  loadPaymentData: (request: Record<string, unknown>) => Promise<GooglePaymentData>;
}

interface GooglePaymentData {
  paymentMethodData: unknown;
  shippingAddress?: unknown;
  billingAddress?: unknown;
  email?: string;
}

interface GooglePaymentAuthorizationResult {
  transactionState: 'SUCCESS' | 'ERROR';
  error?: {
    intent: 'PAYMENT_AUTHORIZATION';
    message: string;
    reason?: string;
  };
}

interface GoogleNamespace {
  payments?: {
    api?: {
      PaymentsClient: new (options: {
        environment: 'TEST' | 'PRODUCTION';
        paymentDataCallbacks?: { onPaymentAuthorized?: (data: GooglePaymentData) => Promise<GooglePaymentAuthorizationResult> };
      }) => GooglePaymentsClient;
    };
  };
}

interface PayPalGlobal {
  Googlepay?: () => PayPalGooglePayInstance;
}

declare global {
  interface Window {
    google?: GoogleNamespace;
    paypal?: PayPalGlobal;
  }
}

const GOOGLE_PAY_URL = 'https://pay.google.com/gp/p/js/pay.js';
const PAYPAL_SDK_ID = 'petshiwu-paypal-google-pay-sdk';
const GOOGLE_PAY_SCRIPT_ID = 'petshiwu-google-pay-sdk';
const PAYPAL_ENVIRONMENT = import.meta.env.VITE_PAYPAL_ENV === 'live' ? 'PRODUCTION' : 'TEST';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const scriptPromises = new Map<string, Promise<void>>();

const loadScript = (src: string, id: string) => {
  const existingPromise = scriptPromises.get(src);
  if (existingPromise) return existingPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
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

const getErrorMessage = (error: unknown, fallback: string) => {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate?.response?.data?.message || candidate?.message || fallback;
};

const unavailableMessage = 'Google Pay is not available on this device or merchant account. Please use PayPal or card checkout instead.';

const PayPalGooglePay = ({
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
}: PayPalGooglePayProps) => {
  const [status, setStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentsClientRef = useRef<GooglePaymentsClient | null>(null);
  const googlePayRef = useRef<PayPalGooglePayInstance | null>(null);
  const googleConfigRef = useRef<GooglePayConfig | null>(null);
  const captureInFlightRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!clientId || !Number.isFinite(total) || total <= 0) {
        setStatus('unavailable');
        return;
      }

      try {
        const paypalSdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&buyer-country=US&intent=capture&components=googlepay`;
        await Promise.all([
          loadScript(GOOGLE_PAY_URL, GOOGLE_PAY_SCRIPT_ID),
          window.paypal?.Googlepay
            ? Promise.resolve()
            : loadScript(paypalSdkUrl, PAYPAL_SDK_ID),
        ]);

        const googleApi = window.google?.payments?.api;
        const googlePay = window.paypal?.Googlepay?.();
        if (!googleApi?.PaymentsClient || !googlePay) {
          setStatus('unavailable');
          return;
        }

        const config = await googlePay.config();
        const paymentsClient = new googleApi.PaymentsClient({
          environment: PAYPAL_ENVIRONMENT,
          paymentDataCallbacks: {
            onPaymentAuthorized: async (paymentData) => {
              const normalizedEmail = paymentData.email?.trim() || guestEmail?.trim();
              return processPayment(paymentData, normalizedEmail);
            },
          },
        });
        const ready = await paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: config.allowedPaymentMethods,
        });

        if (cancelled || !ready?.result) {
          if (!cancelled) setStatus('unavailable');
          return;
        }

        paymentsClientRef.current = paymentsClient;
        googlePayRef.current = googlePay;
        googleConfigRef.current = config;
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
      paymentsClientRef.current = null;
      googlePayRef.current = null;
      googleConfigRef.current = null;
    };
  }, [clientId, total]);

  useEffect(() => {
    if (status !== 'available' || !containerRef.current || !paymentsClientRef.current) return;
    containerRef.current.replaceChildren();
    const button = paymentsClientRef.current.createButton({
      onClick: () => { void handleGooglePayClick(); },
      buttonColor: 'black',
      buttonType: 'buy',
    });
    button.style.width = '100%';
    button.style.minHeight = '48px';
    containerRef.current.appendChild(button);
  }, [status]);

  const reportError = (message: string) => {
    setError(message);
    onError(message);
  };

  const validateGuestEmail = () => {
    const normalized = guestEmail?.trim();
    if (guestEmail !== undefined && (!normalized || !EMAIL_PATTERN.test(normalized))) {
      const message = 'Please enter a valid email address to continue with Google Pay.';
      setError(message);
      onGuestEmailInvalid?.();
      onError(message);
      return null;
    }
    return normalized;
  };

  const handleGooglePayClick = async () => {
    if (isProcessing || !paymentsClientRef.current || !googlePayRef.current || !googleConfigRef.current) return;
    const normalizedGuestEmail = validateGuestEmail();
    if (guestEmail !== undefined && !normalizedGuestEmail) return;

    try {
      setError(null);
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: googleConfigRef.current.allowedPaymentMethods,
        merchantInfo: googleConfigRef.current.merchantInfo,
        transactionInfo: {
          currencyCode: 'USD',
          totalPriceStatus: 'FINAL',
          totalPrice: total.toFixed(2),
        },
        emailRequired: true,
        shippingAddressRequired: true,
        shippingAddressParameters: { allowedCountryCodes: ['US'] },
        callbackIntents: ['PAYMENT_AUTHORIZATION'],
      };

      await paymentsClientRef.current.loadPaymentData(paymentDataRequest);
    } catch (paymentError) {
      if (!captureInFlightRef.current) reportError(getErrorMessage(paymentError, 'Google Pay payment was cancelled or could not start.'));
    }
  };

  const processPayment = async (paymentData: GooglePaymentData, normalizedGuestEmail?: string): Promise<GooglePaymentAuthorizationResult> => {
    if (!googlePayRef.current || captureInFlightRef.current) {
      return {
        transactionState: 'ERROR',
        error: { intent: 'PAYMENT_AUTHORIZATION', message: 'Google Pay is already processing another payment.' }
      };
    }
    if (guestEmail !== undefined && (!normalizedGuestEmail || !EMAIL_PATTERN.test(normalizedGuestEmail))) {
      const message = 'Please enter a valid email address to continue with Google Pay.';
      setError(message);
      onGuestEmailInvalid?.();
      onError(message);
      return { transactionState: 'ERROR', error: { intent: 'PAYMENT_AUTHORIZATION', message } };
    }

    captureInFlightRef.current = true;
    setIsProcessing(true);

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
        throw new Error('Google Pay could not initialize this payment.');
      }

      const confirmation = await googlePayRef.current.confirmOrder({
        orderId: paypalOrderId,
        paymentMethodData: paymentData.paymentMethodData,
        shippingAddress: paymentData.shippingAddress,
        billingAddress: paymentData.billingAddress,
        email: paymentData.email || normalizedGuestEmail,
      });

      if (confirmation?.status === 'PAYER_ACTION_REQUIRED' && googlePayRef.current.initiatePayerAction) {
        await googlePayRef.current.initiatePayerAction({ orderId: paypalOrderId });
      } else if (confirmation?.status && confirmation.status !== 'APPROVED' && confirmation.status !== 'COMPLETED') {
        throw new Error('Google Pay authorization was not approved.');
      }

      const captureResponse = await orderService.capturePayPalOrder({ paypalOrderId, checkoutToken });
      const order = captureResponse.data?.order;
      if (!captureResponse.success || captureResponse.data?.paymentStatus !== 'paid' || !order?._id) {
        throw new Error('Google Pay payment was not completed. Please try again.');
      }
      onSuccess(order);
      return { transactionState: 'SUCCESS' };
    } catch (paymentError) {
      const message = getErrorMessage(paymentError, 'Google Pay payment processing failed. Please try again.');
      reportError(message);
      return { transactionState: 'ERROR', error: { intent: 'PAYMENT_AUTHORIZATION', message } };
    } finally {
      captureInFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-700">Checking Google Pay availability…</div>;
  }

  if (status === 'unavailable') {
    return <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-700">{error || unavailableMessage}</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
      <div ref={containerRef} aria-label="Pay with Google Pay" />
      {isProcessing && <div className="text-center text-sm text-gray-600">Processing Google Pay…</div>}
    </div>
  );
};

export default PayPalGooglePay;
