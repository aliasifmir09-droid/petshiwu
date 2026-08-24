interface PayPalAccessTokenResponse {
  access_token: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    amount?: {
      currency_code?: string;
      value?: string;
    };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
}

export type PayPalCheckoutPaymentSource = 'card' | 'wallet';

export const isPayPalLive = () => process.env.PAYPAL_ENV === 'live';

export const getPayPalBaseUrl = () => (
  isPayPalLive()
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
);

const getPayPalCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  return { clientId, clientSecret };
};

const getAccessToken = async (): Promise<string> => {
  const { clientId, clientSecret } = getPayPalCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayPal authentication failed (${response.status}): ${errorBody.slice(0, 500)}`);
  }

  const data = await response.json() as PayPalAccessTokenResponse;
  if (!data.access_token) {
    throw new Error('PayPal authentication returned no access token.');
  }

  return data.access_token;
};

const paypalRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(formatPayPalApiError(response.status, errorBody));
  }

  return await response.json() as T;
};

export const formatPayPalApiError = (status: number, errorBody: string): string => {
  try {
    const parsed = JSON.parse(errorBody) as {
      name?: string;
      message?: string;
      details?: Array<{ issue?: string; description?: string }>;
    };
    const issue = parsed.details?.[0]?.issue || parsed.name;
    if (issue === 'INSTRUMENT_DECLINED') {
      return 'This payment method was declined. Please try a different card or PayPal Wallet.';
    }
    if (issue === 'PAYER_CANNOT_PAY' || issue === 'PAYER_ACCOUNT_RESTRICTED') {
      return 'PayPal could not complete this payment. Please try a different payment method.';
    }
    if (issue === 'CONTINGENCY' || /PAYER_ACTION_REQUIRED/i.test(parsed.name || '') || /PAYER_ACTION_REQUIRED/i.test(issue || '')) {
      return 'This card requires extra verification. Please complete 3-D Secure and try again.';
    }
  } catch {
    // Not JSON; fall through to the generic truncated body.
  }

  return `PayPal API request failed (${status}): ${errorBody.slice(0, 500)}`;
};

export const buildCreatePayPalOrderBody = (
  amount: number,
  currency: string,
  checkoutToken: string,
  paymentSource?: PayPalCheckoutPaymentSource
) => {
  const body: Record<string, unknown> = {
    intent: 'CAPTURE',
    purchase_units: [{
      ...(checkoutToken ? { custom_id: checkoutToken, invoice_id: checkoutToken.slice(0, 127) } : {}),
      amount: {
        currency_code: currency,
        value: amount.toFixed(2)
      }
    }],
    application_context: {
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING'
    }
  };

  // Card Fields only. Do not attach payment_source.card to wallet / Apple Pay / Google Pay orders.
  if (paymentSource === 'card') {
    body.payment_source = {
      card: {
        attributes: {
          verification: {
            method: 'SCA_WHEN_REQUIRED'
          }
        }
      }
    };
  }

  return body;
};

export const createPayPalOrder = async (
  amount: number,
  currency = 'USD',
  checkoutToken: string,
  paymentSource?: PayPalCheckoutPaymentSource
) => {
  if (!Number.isFinite(amount) || amount < 0.01) {
    throw new Error('PayPal order amount must be at least $0.01.');
  }

  return paypalRequest<PayPalOrderResponse>('/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': `petshiwu-create-${checkoutToken}`
    },
    body: JSON.stringify(buildCreatePayPalOrderBody(amount, currency, checkoutToken, paymentSource))
  });
};

export const capturePayPalOrder = async (orderId: string) => {
  if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) {
    throw new Error('Invalid PayPal order ID.');
  }

  return paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': `petshiwu-capture-${orderId}`
    },
    body: '{}'
  });
};

export const getPayPalOrder = async (orderId: string) => {
  if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) {
    throw new Error('Invalid PayPal order ID.');
  }

  return paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
};

export const getPayPalCapturedAmount = (order: PayPalOrderResponse): number | null => {
  const capture = order.purchase_units?.[0]?.payments?.captures?.find((item) => item.status === 'COMPLETED');
  const value = capture?.amount?.value || order.purchase_units?.[0]?.amount?.value;
  if (!value) return null;

  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
};

export const getPayPalCurrency = (order: PayPalOrderResponse): string | null => {
  const capture = order.purchase_units?.[0]?.payments?.captures?.find((item) => item.status === 'COMPLETED');
  return capture?.amount?.currency_code || order.purchase_units?.[0]?.amount?.currency_code || null;
};

export const getPayPalCheckoutToken = (order: PayPalOrderResponse): string | null => {
  const unit = order.purchase_units?.[0];
  return unit?.custom_id || unit?.invoice_id || null;
};
