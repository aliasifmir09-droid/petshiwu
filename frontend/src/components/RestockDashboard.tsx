import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { buyAgainService } from '@/services/buyAgain';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { productsForReorder } from '@/utils/reorderFromOrder';
import {
  rememberRestockCoupon,
  RESTOCK_COUPON,
  RESTOCK_DISCOUNT_COPY,
  REMINDER_WEEK_OPTIONS,
  type RestockMode,
} from '@/utils/restock';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { areOrdersOpen } from '@/config/launch';

const RestockDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();
  const [weeks, setWeeks] = useState<(typeof REMINDER_WEEK_OPTIONS)[number]>(4);
  const [restocking, setRestocking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['buy-again'],
    queryFn: buyAgainService.getBuyAgain,
    staleTime: 30 * 1000,
  });

  const reminderMutation = useMutation({
    mutationFn: ({ orderId, weeks, mode }: { orderId: string; weeks: number; mode: RestockMode }) =>
      buyAgainService.createReminder(orderId, weeks, mode),
    onSuccess: (_reminder, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buy-again'] });
      showToast(
        variables.mode === 'ask'
          ? `Ask first is on. We'll email you in ${variables.weeks} weeks. Confirm then for ${RESTOCK_DISCOUNT_COPY}. We never charge unless you pay.`
          : `Autoship is on. We'll email you in ${variables.weeks} weeks so you never forget. Tap Ship now when it's due — we still never charge unless you pay.`,
        'success'
      );
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Could not save your restock plan.', 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: buyAgainService.cancelReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buy-again'] });
      showToast('Restock plan stopped. Pick Ask first or Autoship any time.', 'success');
    },
  });

  const petName = user?.pets?.[0]?.petName?.trim();
  const lastOrder = data?.lastOrder;
  const heroItems = (lastOrder?.items || []).slice(0, 4);
  const usualLabel = petName ? `${petName}'s usual` : 'Your usual';
  const reminderMode = data?.reminder?.mode === 'autoship' ? 'autoship' : data?.reminder ? 'ask' : null;

  const handleConfirmNow = async () => {
    if (!lastOrder?.items?.length) {
      navigate('/products');
      return;
    }
    setRestocking(true);
    try {
      const ready = await productsForReorder(lastOrder.items as any);
      if (ready.length === 0) {
        showToast('Those items are no longer in stock. Browse the catalog to replace them.', 'error');
        return;
      }
      ready.forEach(({ product, variant, quantity }) => addToCart(product, variant, quantity));
      rememberRestockCoupon();
      showToast(`Confirm now — ${RESTOCK_COUPON} is ${RESTOCK_DISCOUNT_COPY}. We charge only when you pay.`, 'success');
      navigate(`/checkout?coupon=${RESTOCK_COUPON}`);
    } catch {
      showToast('Could not add those items. Try again from your orders.', 'error');
    } finally {
      setRestocking(false);
    }
  };

  const pickPlan = (mode: RestockMode) => {
    if (!lastOrder?._id) return;
    reminderMutation.mutate({ orderId: lastOrder._id, weeks, mode });
  };

  if (isLoading) {
    return (
      <section id="restock" className="bg-[#0B1B4A] text-white">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <p className="text-white/70">Loading your dashboard…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="restock" className="relative overflow-hidden bg-[#0B1B4A] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.25),transparent_42%)]" />
      <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14 relative">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-200 mb-3">Your dashboard</p>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-3">
              Hi {user?.firstName || 'there'}. {lastOrder ? usualLabel : 'Welcome back.'}
            </h2>
            <p className="text-blue-100 text-base md:text-lg max-w-xl mb-6">
              {lastOrder
                ? `Latest order ${lastOrder.orderNumber}. Pick Ask first or Autoship below — we'll tell you which is better. We never charge unless you pay.`
                : 'Same-day NYC when you order by cutoff. After your first order you can pick Ask first or Autoship.'}
            </p>

            {lastOrder ? (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize">
                  Latest · {lastOrder.orderStatus || 'order'}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-400 text-[#0B1B4A] px-3 py-1 text-sm font-black">
                  Ask first · {RESTOCK_COUPON} · {RESTOCK_DISCOUNT_COPY}
                </span>
                {areOrdersOpen() && (
                  <span className="text-sm text-blue-100">Order by 3 PM weekdays for tonight</span>
                )}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleConfirmNow}
                disabled={restocking || !lastOrder}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#0B1B4A] px-6 py-3.5 font-black text-base hover:bg-blue-50 disabled:opacity-50"
              >
                {restocking ? 'Adding…' : lastOrder ? 'Confirm now — 7% off' : 'Start shopping'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="lg:w-[46%] grid grid-cols-2 gap-3">
            {heroItems.length > 0 ? (
              heroItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className={`relative overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 ${index === 0 ? 'col-span-2 min-h-[240px] md:min-h-[320px]' : 'min-h-[140px]'}`}
                >
                  <img
                    src={normalizeImageUrl(item.image, { size: index === 0 ? 'xlarge' : 'large', format: 'auto' })}
                    alt={item.name || 'Your usual'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="font-bold text-sm md:text-base leading-snug">{item.name}</p>
                    <p className="text-xs text-white/80">Qty {item.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 rounded-3xl min-h-[280px] bg-gradient-to-br from-blue-500/30 to-indigo-700/40 ring-1 ring-white/10 flex items-center justify-center p-8 text-center">
                <div>
                  <Sparkles className="mx-auto mb-3 text-blue-200" />
                  <p className="text-xl font-black mb-2">HD restock, when you say so</p>
                  <Link to="/products" className="underline font-semibold">Shop tonight</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {lastOrder?._id ? (
          <div className="mt-10">
            {data?.reminder && reminderMode ? (
              <div className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-5 md:p-6">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-2">Your plan</p>
                <p className="text-xl md:text-2xl font-black mb-2">
                  {reminderMode === 'ask' ? 'Ask first' : 'Autoship'} · every {data.reminder.weeks} weeks
                </p>
                <p className="text-blue-100 max-w-2xl mb-4">
                  {reminderMode === 'ask'
                    ? `Better for most people: we email you, you confirm, ${RESTOCK_DISCOUNT_COPY}. Next email ${new Date(data.reminder.remindAt).toLocaleDateString()}. Ignore it and nothing ships.`
                    : `Better if you never want to forget: we email you on schedule. Tap Ship now when it's due. Regular price. Next email ${new Date(data.reminder.remindAt).toLocaleDateString()}. Ignore it and we skip that cycle.`}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
                    onClick={() => cancelMutation.mutate(data.reminder!._id)}
                    disabled={cancelMutation.isPending}
                  >
                    Switch plan
                  </button>
                  <button
                    type="button"
                    className="underline font-semibold text-sm"
                    onClick={() => cancelMutation.mutate(data.reminder!._id)}
                    disabled={cancelMutation.isPending}
                  >
                    Stop emails
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-1">Choose one</p>
                    <h3 className="text-2xl md:text-3xl font-black">Which is better for you?</h3>
                  </div>
                  <label className="text-sm text-blue-100">
                    Every
                    <select
                      aria-label="Restock in how many weeks"
                      value={weeks}
                      onChange={(event) => setWeeks(Number(event.target.value) as (typeof REMINDER_WEEK_OPTIONS)[number])}
                      className="ml-2 rounded-xl bg-white/10 px-3 py-2 font-semibold text-white outline-none"
                    >
                      {REMINDER_WEEK_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-slate-900">
                          {option} weeks
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => pickPlan('ask')}
                    disabled={reminderMutation.isPending}
                    className="text-left rounded-3xl bg-white text-[#0B1B4A] p-6 ring-4 ring-emerald-300 hover:bg-blue-50 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center rounded-full bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-wide mb-3">
                      Better for most people
                    </span>
                    <p className="text-2xl font-black mb-2">Ask first</p>
                    <ul className="space-y-2 text-sm text-slate-700 mb-4">
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> We email you every cycle. You confirm.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> Save {RESTOCK_DISCOUNT_COPY} with {RESTOCK_COUPON}.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> Ignore the email — we never charge.</li>
                    </ul>
                    <span className="inline-flex items-center font-black text-[#0B1B4A]">
                      Choose Ask first <ArrowRight size={16} className="ml-1" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => pickPlan('autoship')}
                    disabled={reminderMutation.isPending}
                    className="text-left rounded-3xl bg-white/10 ring-1 ring-white/20 p-6 hover:bg-white/15 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide mb-3">
                      Better if you never want to forget
                    </span>
                    <p className="text-2xl font-black mb-2">Autoship</p>
                    <ul className="space-y-2 text-sm text-blue-100 mb-4">
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> We email you on this schedule.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> Tap Ship now when it's due. Regular price.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> Skip a cycle by ignoring the email — still no silent charge.</li>
                    </ul>
                    <span className="inline-flex items-center font-black">
                      Choose Autoship <ArrowRight size={16} className="ml-1" />
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </section>
  );
};

export default RestockDashboard;
