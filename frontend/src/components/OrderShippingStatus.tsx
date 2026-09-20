import { useState } from 'react';
import { CheckCircle2, Clock, Copy, Package, Phone, Truck } from 'lucide-react';
import { describeOrderTracking, formatNyDateTime, type TrackableOrder } from '@/utils/orderTracking';
import { TONIGHT } from '@/data/tonightDelivery';

const STEP_ICON = {
  received: Clock,
  packing: Package,
  out: Truck,
  delivered: CheckCircle2,
};

type OrderShippingStatusProps = {
  order: TrackableOrder;
  orderNumber?: string;
};

const OrderShippingStatus = ({ order, orderNumber }: OrderShippingStatusProps) => {
  const tracking = describeOrderTracking(order);
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail in older browsers; the number stays on screen.
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_16px_40px_-28px_rgba(30,58,138,0.45)]">
      <div className="bg-[#1E3A8A] px-6 py-6 text-white md:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Shipping status</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{tracking.headline}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">{tracking.detail}</p>
        {!tracking.cancelled && (
          <div className="mt-5 inline-flex flex-col gap-1 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">Expected</p>
            <p className="text-lg font-black text-white">{tracking.expectedLabel}</p>
            {tracking.expectedHint ? <p className="text-xs text-blue-100">{tracking.expectedHint}</p> : null}
          </div>
        )}
      </div>

      {orderNumber || order.createdAt ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-6 py-4 md:px-8">
          <div>
            {orderNumber ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Order number</p>
                <p className="font-mono text-sm font-bold text-stone-900 md:text-base">{orderNumber}</p>
              </>
            ) : null}
            {order.createdAt ? (
              <p className="mt-1 text-xs text-stone-500">Placed {formatNyDateTime(order.createdAt)}</p>
            ) : null}
          </div>
          {orderNumber ? (
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Copy size={16} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          ) : null}
        </div>
      ) : null}

      {order.trackingNumber ? (
        <div className="border-b border-stone-100 px-6 py-3 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Driver note</p>
          <p className="text-sm font-semibold text-stone-800">{order.trackingNumber}</p>
        </div>
      ) : null}

      {!tracking.cancelled && (
        <ol className="grid gap-0 px-6 py-6 md:grid-cols-4 md:px-8">
          {tracking.steps.map((step, index) => {
            const Icon = STEP_ICON[step.id];
            return (
              <li key={step.id} className="relative flex gap-3 py-3 md:flex-col md:items-center md:text-center md:py-0">
                {index < tracking.steps.length - 1 && (
                  <span
                    className={`absolute left-[1.15rem] top-12 hidden h-[calc(100%-1.5rem)] w-0.5 md:left-auto md:right-[-50%] md:top-5 md:block md:h-0.5 md:w-full ${
                      step.done && !step.current ? 'bg-[#1E3A8A]' : 'bg-stone-200'
                    }`}
                    aria-hidden
                  />
                )}
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    step.current
                      ? 'bg-[#1E3A8A] text-white ring-4 ring-blue-100'
                      : step.done
                        ? 'bg-[#1E3A8A] text-white'
                        : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold ${step.current || step.done ? 'text-stone-900' : 'text-stone-400'}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-stone-500">{step.hint}</p>
                  {step.current && step.at ? (
                    <p className="mt-1 text-xs font-semibold text-[#1E3A8A]">{formatNyDateTime(step.at)}</p>
                  ) : null}
                  {step.id === 'delivered' && step.done && step.at ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">{formatNyDateTime(step.at)}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="border-t border-stone-100 bg-[#FBF9F5] px-6 py-5 md:px-8">
        <p className="text-sm font-semibold text-stone-800">{tracking.nextStep}</p>
        <p className="mt-2 text-sm text-stone-600">
          This is Petshiwü delivery from Queens, not a carrier shipment. You will not get a UPS or FedEx tracking number.
        </p>
        <a
          href={`tel:${TONIGHT.phone.replace(/[^\d+]/g, '')}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#16307a]"
        >
          <Phone size={16} />
          Call {tracking.supportPhone} · 24/7
        </a>
      </div>
    </section>
  );
};

export default OrderShippingStatus;
