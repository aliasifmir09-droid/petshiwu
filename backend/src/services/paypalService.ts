interface PayPalAccessTokenResponse {
  access_token: string;
}

interface PayPalMoney {
  currency_code?: string;
  currency?: string;
  value?: string;
}

interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: PayPalMoney;
  seller_receivable_breakdown?: {
    gross_amount?: PayPalMoney;
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  amount?: PayPalMoney;
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    amount?: PayPalMoney;
    payments?: {
      captures?: PayPalCapture[];
    };
  }>;
}

const SUCCESSFUL_CAPTURE_STATUSES = new Set(['COMPLETED', 'PENDING']);

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
    throw new Error(`PayPal API request failed (${response.status}): ${errorBody.slice(0, 500)}`);
  }

  return await response.json() as T;
};

export const createPayPalOrder = async (amount: number, currency = 'USD', checkoutToken: string) => {
  if (!Number.isFinite(amount) || amount < 0.01) {
    throw new Error('PayPal order amount must be at least $0.01.');
  }

  return paypalRequest<PayPalOrderResponse>('/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': `petshiwu-create-${checkoutToken}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
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
    })
  });
};

export const capturePayPalOrder = async (orderId: string) => {
  if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) {
    throw new Error('Invalid PayPal order ID.');
  }

  return paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': `petshiwu-capture-${orderId}`,
      // Default is return=minimal (id + status only). Card Fields captures
      // otherwise look unpaid because currency_code never appears.
      Prefer: 'return=representation'
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

export const normalizePayPalCurrency = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

const moneyCurrency = (money?: PayPalMoney | null): string | null =>
  normalizePayPalCurrency(money?.currency_code || money?.currency);

const moneyValue = (money?: PayPalMoney | null): number | null => {
  if (!money?.value) return null;
  const amount = Number(money.value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
};

const captureStatus = (capture?: PayPalCapture): string =>
  (capture?.status || '').trim().toUpperCase();

const pickCapture = (order: PayPalOrderResponse): PayPalCapture | undefined => {
  const captures = order.purchase_units?.[0]?.payments?.captures || [];
  return (
    captures.find((item) => captureStatus(item) === 'COMPLETED')
    || captures.find((item) => SUCCESSFUL_CAPTURE_STATUSES.has(captureStatus(item)))
  );
};

export const getPayPalCapturedAmount = (order: PayPalOrderResponse): number | null => {
  const capture = pickCapture(order);
  return (
    moneyValue(capture?.amount)
    ?? moneyValue(capture?.seller_receivable_breakdown?.gross_amount)
    ?? moneyValue(order.purchase_units?.[0]?.amount)
    ?? moneyValue(order.amount)
  );
};

export const getPayPalCurrency = (order: PayPalOrderResponse): string | null => {
  const capture = pickCapture(order);
  return (
    moneyCurrency(capture?.amount)
    ?? moneyCurrency(capture?.seller_receivable_breakdown?.gross_amount)
    ?? moneyCurrency(order.purchase_units?.[0]?.amount)
    ?? moneyCurrency(order.amount)
  );
};

export const hasPayPalSettlement = (order: PayPalOrderResponse): boolean => (
  getPayPalCurrency(order) != null && getPayPalCapturedAmount(order) != null
);

export const payPalCurrenciesMatch = (expected?: string | null, received?: string | null): boolean => {
  const left = normalizePayPalCurrency(expected);
  const right = normalizePayPalCurrency(received);
  return Boolean(left && right && left === right);
};

export const getPayPalCheckoutToken = (order: PayPalOrderResponse): string | null => {
  const unit = order.purchase_units?.[0];
  return unit?.custom_id || unit?.invoice_id || null;
};
