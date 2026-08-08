import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const HOSTED_BUTTON_ID = 'RBJMJ2FNL7296';
const SCRIPT_ID = 'paypal-hosted-buttons-sdk';
const CONTAINER_ID = 'paypal-hosted-button-container';

type HostedButtonsInstance = {
  render: (selector: string) => Promise<unknown> | unknown;
};

type PayPalNamespace = {
  HostedButtons?: (options: { hostedButtonId: string }) => HostedButtonsInstance;
};

const getPayPalClientId = () => import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const getPayPalNamespace = () => (window as unknown as { paypal?: PayPalNamespace }).paypal;

const loadHostedButtonsSdk = (clientId: string) => {
  if (getPayPalNamespace()?.HostedButtons) return Promise.resolve();

  const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      const checkReady = () => {
        if (getPayPalNamespace()?.HostedButtons) {
          resolve();
        } else {
          reject(new Error('PayPal loaded without Hosted Buttons support. Open /pay in a fresh browser tab.'));
        }
      };

      existingScript.addEventListener('load', checkReady, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('PayPal Hosted Buttons could not load.')), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=hosted-buttons&enable-funding=venmo&currency=USD`;
    script.onload = () => {
      if (getPayPalNamespace()?.HostedButtons) {
        resolve();
      } else {
        reject(new Error('PayPal loaded without Hosted Buttons support. Check the PayPal client ID and button configuration.'));
      }
    };
    script.onerror = () => reject(new Error('PayPal Hosted Buttons could not load.'));
    document.head.appendChild(script);
  });
};

const PayTest = () => {
  const mountedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

    const mountHostedButton = async () => {
      const clientId = getPayPalClientId();
      if (!clientId) {
        throw new Error('PayPal is not configured. Set VITE_PAYPAL_CLIENT_ID before testing this page.');
      }

      if (getPayPalNamespace() && !getPayPalNamespace()?.HostedButtons) {
        throw new Error('Another PayPal SDK is already loaded without Hosted Buttons. Open /pay directly in a fresh browser tab.');
      }

      await loadHostedButtonsSdk(clientId);
      if (cancelled || !mountedRef.current) return;

      const container = document.getElementById(CONTAINER_ID);
      const hostedButtons = getPayPalNamespace()?.HostedButtons;
      if (!container || !hostedButtons) {
        throw new Error('Hosted Button container is unavailable. Please refresh and try again.');
      }

      container.innerHTML = '';
      await hostedButtons({ hostedButtonId: HOSTED_BUTTON_ID }).render(`#${CONTAINER_ID}`);
      if (!cancelled) setStatus('ready');
    };

    mountHostedButton().catch((mountError: unknown) => {
      if (cancelled) return;
      setError(mountError instanceof Error ? mountError.message : 'PayPal Hosted Buttons could not load.');
      setStatus('error');
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      const container = document.getElementById(CONTAINER_ID);
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <SEO
        title="PayPal Payment Test | Petshiwu"
        description="Private PayPal Hosted Button testing page for Petshiwu."
        url="/pay"
        noindex
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-950 px-6 py-8 text-white sm:px-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Internal payment test</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">PayPal hosted button</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            This is a separate PayPal Hosted Button test path. It is not connected to the Petshiwu cart checkout.
          </p>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <p className="font-bold">Testing only. No Petshiwu order is created here.</p>
            <p className="mt-1">
              A successful payment through this hosted button does not reserve inventory, create an order, send fulfillment email, or appear in the Petshiwu order dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Hosted button</p>
                <p className="mt-1 font-mono text-sm text-slate-700">{HOSTED_BUTTON_ID}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">USD · Venmo enabled</span>
            </div>

            {status === 'loading' && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
                Loading PayPal Hosted Buttons…
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800">
                <p className="font-bold">Hosted button could not load</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <div id={CONTAINER_ID} className={status === 'ready' ? 'min-h-[96px]' : 'hidden'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
            <Link to="/checkout" className="font-semibold text-blue-700 hover:text-blue-900">
              Return to secure cart checkout →
            </Link>
            <span className="text-slate-500">Wallet + Card Fields remain the production checkout.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayTest;
