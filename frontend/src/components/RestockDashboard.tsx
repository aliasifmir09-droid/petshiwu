import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { buyAgainService, type BuyAgainRegular } from '@/services/buyAgain';
import { productService } from '@/services/products';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { productsForReorder } from '@/utils/reorderFromOrder';
import { availableCartStock } from '@/utils/cartStock';
import {
  ASK_COUPON,
  ASK_DISCOUNT_COPY,
  AUTOSHIP_COUPON,
  AUTOSHIP_DISCOUNT_COPY,
  DEFAULT_INTERVAL_DAYS,
  RESTOCK_CADENCE,
  cadenceLabel,
  defaultRemindParts,
  isRestockConsumable,
  isValidIntervalDays,
  localDateStr,
  localTimeStr,
  pickKey,
  rememberRestockCoupon,
  remindAtIso,
  restockDiscountCopy,
  type RestockIntervalDays,
  type RestockMode,
  type RestockPick,
} from '@/utils/restock';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { ArrowRight, Check, Minus, Plus, Search, ShoppingCart, Sparkles, X } from 'lucide-react';
import { areOrdersOpen } from '@/config/launch';
import type { Product } from '@/types';

const categoryHaystack = (product: Product): string => {
  const category = product.category;
  if (!category || typeof category === 'string') return `${product.name} ${category || ''}`;
  return `${product.name} ${category.name || ''} ${category.slug || ''}`;
};

const RestockDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();
  const [intervalDays, setIntervalDays] = useState<RestockIntervalDays>(DEFAULT_INTERVAL_DAYS);
  const [remindDate, setRemindDate] = useState(() => defaultRemindParts(DEFAULT_INTERVAL_DAYS).date);
  const [remindTime, setRemindTime] = useState(() => defaultRemindParts(DEFAULT_INTERVAL_DAYS).time);
  const [restocking, setRestocking] = useState(false);
  const [selected, setSelected] = useState<RestockPick[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['buy-again'],
    queryFn: buyAgainService.getBuyAgain,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!data || hydrated) return;
    setSelected(data.usual || []);
    setAddOpen(!(data.usual && data.usual.length));
    const days = Number(data.reminder?.intervalDays) || (data.reminder?.weeks ? data.reminder.weeks * 7 : DEFAULT_INTERVAL_DAYS);
    const cadence = isValidIntervalDays(days) ? days : DEFAULT_INTERVAL_DAYS;
    setIntervalDays(cadence);
    if (data.reminder?.remindAt) {
      const at = new Date(data.reminder.remindAt);
      setRemindDate(localDateStr(at));
      setRemindTime(localTimeStr(at));
    } else {
      const parts = defaultRemindParts(cadence);
      setRemindDate(parts.date);
      setRemindTime(parts.time);
    }
    setHydrated(true);
  }, [data, hydrated]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await productService.search(term, { limit: 8, inStock: true });
        if (cancelled) return;
        const products = (response.data || []).filter((product) => isRestockConsumable(categoryHaystack(product)));
        setHits(products);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const reminderMutation = useMutation({
    mutationFn: ({
      orderId,
      intervalDays,
      remindAt,
      mode,
      items,
    }: {
      orderId: string;
      intervalDays: number;
      remindAt: string;
      mode: RestockMode;
      items: RestockPick[];
    }) => buyAgainService.createReminder(orderId, { intervalDays, remindAt, mode, items }),
    onSuccess: (_reminder, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buy-again'] });
      const every = cadenceLabel(variables.intervalDays);
      const when = new Date(variables.remindAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      showToast(
        variables.mode === 'ask'
          ? `Ask first is on. ${every}. Next email ${when}. Confirm then for ${ASK_DISCOUNT_COPY}. We never charge unless you pay.`
          : `Autoship is on. ${every}. Next email ${when}. Ship then for ${AUTOSHIP_DISCOUNT_COPY}. We still never charge unless you pay.`,
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
  const heroItems = selected.slice(0, 4);
  const usualLabel = petName ? `${petName}'s usual` : 'Your usual';
  const reminderMode = data?.reminder?.mode === 'autoship' ? 'autoship' : data?.reminder ? 'ask' : null;
  const lastWasMostlyToys = Boolean(lastOrder?.items?.length) && selected.length === 0;
  const minDate = localDateStr(new Date());

  const extraFromOrders = useMemo(() => {
    const keys = new Set(selected.map(pickKey));
    return (data?.regulars || []).filter((item) => {
      if (item.restockable === false) return false;
      if (!isRestockConsumable(item.name)) return false;
      return !keys.has(`${item.productId}::${item.sku || ''}`);
    });
  }, [data?.regulars, selected]);

  const openCart = () => {
    setAddOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('restock-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const changeCadence = (days: RestockIntervalDays) => {
    setIntervalDays(days);
    const parts = defaultRemindParts(days);
    setRemindDate(parts.date);
    setRemindTime(parts.time);
  };

  const addPick = (pick: RestockPick) => {
    setSelected((current) => {
      const key = pickKey(pick);
      const existing = current.find((item) => pickKey(item) === key);
      if (existing) {
        return current.map((item) =>
          pickKey(item) === key ? { ...item, quantity: Math.min(12, item.quantity + pick.quantity) } : item
        );
      }
      if (current.length >= 12) return current;
      return [...current, pick];
    });
    setQuery('');
    setHits([]);
    showToast('Added to your restock cart. Add or remove anything else.', 'success');
  };

  const addRegular = (item: BuyAgainRegular) => {
    addPick({
      product: item.productId,
      name: item.name,
      image: item.image,
      quantity: Math.max(1, item.lastQuantity || 1),
      sku: item.sku,
    });
  };

  const addProduct = (product: Product) => {
    const variant =
      (product.variants || []).find((row) => availableCartStock(product, row) > 0) || product.variants?.[0];
    addPick({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      quantity: 1,
      sku: variant?.sku,
    });
  };

  const setQty = (key: string, quantity: number) => {
    setSelected((current) =>
      current
        .map((item) => (pickKey(item) === key ? { ...item, quantity } : item))
        .filter((item) => item.quantity >= 1)
    );
  };

  const removePick = (key: string) => {
    setSelected((current) => current.filter((item) => pickKey(item) !== key));
  };

  const handleConfirmNow = async () => {
    if (!selected.length) {
      openCart();
      showToast('Add food or treats to your restock cart first. Toys skip restock.', 'error');
      return;
    }
    setRestocking(true);
    try {
      const ready = await productsForReorder(
        selected.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          variant: item.sku ? { sku: item.sku } : undefined,
        }))
      );
      let added = 0;
      ready.forEach(({ product, variant, quantity }) => {
        if (addToCart(product, variant, quantity)) added += 1;
      });
      if (added === 0) {
        openCart();
        showToast('Could not add those items. Add a replacement in your restock cart.', 'error');
        return;
      }
      rememberRestockCoupon(ASK_COUPON);
      showToast(`Reorder — ${ASK_COUPON} is ${ASK_DISCOUNT_COPY}. We charge only when you pay.`, 'success');
      navigate(`/checkout?coupon=${ASK_COUPON}`);
    } catch {
      showToast('Could not add those items. Try again from your orders.', 'error');
    } finally {
      setRestocking(false);
    }
  };

  const pickPlan = (mode: RestockMode) => {
    if (!lastOrder?._id) return;
    if (!selected.length) {
      openCart();
      showToast('Add food or treats to your restock cart. Toys and costumes skip this list.', 'error');
      return;
    }
    reminderMutation.mutate({
      orderId: lastOrder._id,
      intervalDays,
      remindAt: remindAtIso(remindDate, remindTime),
      mode,
      items: selected,
    });
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
              {lastWasMostlyToys
                ? `Latest order ${lastOrder?.orderNumber} looks like toys or gear. Restock is for food and treats — add what ${petName || 'they'} actually run out of.`
                : lastOrder
                  ? `Latest order ${lastOrder.orderNumber}. Build the restock cart, pick how often, then Ask first (${ASK_DISCOUNT_COPY}) or Autoship (${AUTOSHIP_DISCOUNT_COPY}). We never charge unless you pay.`
                  : 'Same-day NYC when you order by cutoff. After your first order you can pick Ask first or Autoship.'}
            </p>

            {lastOrder ? (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize">
                  Latest · {lastOrder.orderStatus || 'order'}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-black">
                  Reorder · {ASK_COUPON} · {ASK_DISCOUNT_COPY}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-400 text-[#0B1B4A] px-3 py-1 text-sm font-black">
                  Autoship · {AUTOSHIP_COUPON} · {AUTOSHIP_DISCOUNT_COPY}
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
                {restocking ? 'Adding…' : lastOrder ? `Confirm now — 5% off` : 'Start shopping'}
                <ArrowRight size={18} />
              </button>
              {lastOrder ? (
                <button
                  type="button"
                  onClick={openCart}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 font-bold hover:bg-white/15"
                >
                  <ShoppingCart size={18} />
                  {selected.length ? 'Edit restock cart' : 'Add food or treats'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="lg:w-[46%] grid grid-cols-2 gap-3">
            {heroItems.length > 0 ? (
              heroItems.map((item, index) => (
                <button
                  type="button"
                  key={pickKey(item)}
                  onClick={openCart}
                  className={`relative overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 text-left ${index === 0 ? 'col-span-2 min-h-[240px] md:min-h-[320px]' : 'min-h-[140px]'}`}
                >
                  <img
                    src={normalizeImageUrl(item.image, { size: index === 0 ? 'xlarge' : 'large', format: 'auto' })}
                    alt={item.name || 'Your usual'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="font-bold text-sm md:text-base leading-snug">{item.name}</p>
                    <p className="text-xs text-white/80">Qty {item.quantity} · tap to add or remove</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-2 rounded-3xl min-h-[280px] bg-gradient-to-br from-blue-500/30 to-indigo-700/40 ring-1 ring-white/10 flex items-center justify-center p-8 text-center">
                <div>
                  <Sparkles className="mx-auto mb-3 text-blue-200" />
                  <p className="text-xl font-black mb-2">Add food or treats</p>
                  <p className="text-sm text-blue-100 mb-3">Toys skip restock. Pick what they run out of.</p>
                  <button type="button" className="underline font-semibold" onClick={openCart}>
                    Open restock cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {lastOrder?._id ? (
          <div className="mt-10 space-y-6">
            <div id="restock-cart" className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-5 md:p-6 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-1">Your restock cart</p>
                  <h3 className="text-xl md:text-2xl font-black">Add or remove anything</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Food and treats only. Change qty, remove a bag, or add another. This is the list we email. Toys stay off.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOpen((open) => !open)}
                  className="rounded-xl bg-white text-[#0B1B4A] px-4 py-2 text-sm font-black"
                >
                  {addOpen ? 'Hide search' : 'Add more items'}
                </button>
              </div>

              {selected.length ? (
                <ul className="space-y-3 mb-4">
                  {selected.map((item) => {
                    const key = pickKey(item);
                    return (
                      <li key={key} className="flex items-center gap-3 rounded-2xl bg-[#0B1B4A]/50 p-3">
                        <img
                          src={normalizeImageUrl(item.image, { size: 'small', format: 'auto' })}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover bg-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
                            <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => setQty(key, item.quantity - 1)}>
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                            <button type="button" aria-label={`Add one ${item.name}`} onClick={() => setQty(key, Math.min(12, item.quantity + 1))}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from cart`}
                          onClick={() => removePick(key)}
                          className="p-2 text-blue-100 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-blue-100 mb-4">Cart is empty. Add food or treats below.</p>
              )}

              {addOpen ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-blue-100">Search food or treats</span>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white text-[#0B1B4A] px-3 py-2">
                      <Search size={18} />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Hill's, salmon topper, litter…"
                        className="w-full bg-transparent outline-none font-semibold"
                      />
                    </div>
                  </label>
                  {searching ? <p className="text-sm text-blue-100">Searching…</p> : null}
                  {hits.length ? (
                    <ul className="space-y-2">
                      {hits.map((product) => (
                        <li key={product._id}>
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center gap-3 rounded-2xl bg-white/10 p-2 text-left hover:bg-white/20"
                          >
                            <img
                              src={normalizeImageUrl(product.images?.[0], { size: 'small', format: 'auto' })}
                              alt=""
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <span className="flex-1 font-semibold text-sm line-clamp-2">{product.name}</span>
                            <span className="text-xs font-black uppercase">Add</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.trim().length >= 2 && !searching ? (
                    <p className="text-sm text-blue-100">No food or treats matched. Try a brand or “treats”.</p>
                  ) : null}

                  {extraFromOrders.length ? (
                    <div>
                      <p className="text-sm font-semibold text-blue-100 mb-2">From your orders</p>
                      <div className="flex flex-wrap gap-2">
                        {extraFromOrders.slice(0, 8).map((item) => (
                          <button
                            key={`${item.productId}-${item.sku || ''}`}
                            type="button"
                            onClick={() => addRegular(item)}
                            className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20"
                          >
                            + {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-5 md:p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-1">When to email you</p>
              <h3 className="text-xl md:text-2xl font-black mb-2">You pick the cadence and the time</h3>
              <p className="text-blue-100 text-sm mb-4">
                Every day, every week, or every 2–8 weeks. Pick the next date and time. We still never charge unless you pay.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-sm text-blue-100">
                  How often
                  <select
                    aria-label="How often to restock"
                    value={intervalDays}
                    onChange={(event) => changeCadence(Number(event.target.value) as RestockIntervalDays)}
                    className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 font-semibold text-white outline-none"
                  >
                    {RESTOCK_CADENCE.map((option) => (
                      <option key={option.intervalDays} value={option.intervalDays} className="text-slate-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-blue-100">
                  Next date
                  <input
                    type="date"
                    aria-label="Next restock email date"
                    min={minDate}
                    value={remindDate}
                    onChange={(event) => setRemindDate(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 font-semibold text-white outline-none [color-scheme:dark]"
                  />
                </label>
                <label className="text-sm text-blue-100">
                  Time
                  <input
                    type="time"
                    aria-label="Next restock email time"
                    value={remindTime}
                    onChange={(event) => setRemindTime(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 font-semibold text-white outline-none [color-scheme:dark]"
                  />
                </label>
              </div>
            </div>

            {data?.reminder && reminderMode ? (
              <div className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-5 md:p-6">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-2">Your plan</p>
                <p className="text-xl md:text-2xl font-black mb-2">
                  {reminderMode === 'ask' ? 'Ask first' : 'Autoship'} · {data.reminder.cadenceLabel || cadenceLabel(intervalDays)} · {restockDiscountCopy(reminderMode)}
                </p>
                <p className="text-blue-100 max-w-2xl mb-4">
                  {reminderMode === 'ask'
                    ? `Better control: we email you, you confirm, ${ASK_DISCOUNT_COPY}. Next email ${new Date(data.reminder.remindAt).toLocaleString()}. Ignore it and nothing ships.`
                    : `Better price: we email you on your schedule. Tap Ship now for ${AUTOSHIP_DISCOUNT_COPY}. Next email ${new Date(data.reminder.remindAt).toLocaleString()}. Ignore it and we skip that cycle.`}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-white text-[#0B1B4A] px-4 py-2 text-sm font-black disabled:opacity-50"
                    onClick={() => pickPlan(reminderMode)}
                    disabled={reminderMutation.isPending || !selected.length}
                  >
                    Save cart and schedule
                  </button>
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
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-1">Choose one</p>
                  <h3 className="text-2xl md:text-3xl font-black">Which is better for you?</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => pickPlan('ask')}
                    disabled={reminderMutation.isPending}
                    className="text-left rounded-3xl bg-white/10 ring-1 ring-white/20 p-6 hover:bg-white/15 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide mb-3">
                      Better control · reorder 5%
                    </span>
                    <p className="text-2xl font-black mb-2">Ask first</p>
                    <ul className="space-y-2 text-sm text-blue-100 mb-4">
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> We email you on the cadence you pick. You confirm.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> Save {ASK_DISCOUNT_COPY} with {ASK_COUPON}.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-300 shrink-0" /> Ignore the email — we never charge.</li>
                    </ul>
                    <span className="inline-flex items-center font-black">
                      Choose Ask first <ArrowRight size={16} className="ml-1" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => pickPlan('autoship')}
                    disabled={reminderMutation.isPending}
                    className="text-left rounded-3xl bg-white text-[#0B1B4A] p-6 ring-4 ring-emerald-300 hover:bg-blue-50 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center rounded-full bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-wide mb-3">
                      Better price · 7% off
                    </span>
                    <p className="text-2xl font-black mb-2">Autoship</p>
                    <ul className="space-y-2 text-sm text-slate-700 mb-4">
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> We email you at the date and time you pick so you never forget.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> Tap Ship now for {AUTOSHIP_DISCOUNT_COPY} with {AUTOSHIP_COUPON}.</li>
                      <li className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600 shrink-0" /> Skip a cycle by ignoring the email — still no silent charge.</li>
                    </ul>
                    <span className="inline-flex items-center font-black text-[#0B1B4A]">
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
