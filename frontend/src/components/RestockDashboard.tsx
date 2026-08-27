import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  RESTOCK_PAY_OPTIONS,
  cadenceLabel,
  defaultRemindParts,
  isRestockConsumable,
  isValidIntervalDays,
  localDateStr,
  localTimeStr,
  pickKey,
  rememberRestockCoupon,
  rememberRestockPay,
  remindAtIso,
  restockCouponForMode,
  restockDiscountCopy,
  restockPayLabel,
  type RestockIntervalDays,
  type RestockMode,
  type RestockPayMethod,
  type RestockPick,
} from '@/utils/restock';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import {
  Check,
  CreditCard,
  Lock,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { areOrdersOpen } from '@/config/launch';
import type { Product } from '@/types';

const categoryHaystack = (product: Product): string => {
  const category = product.category;
  if (!category || typeof category === 'string') return `${product.name} ${category || ''}`;
  return `${product.name} ${category.name || ''} ${category.slug || ''}`;
};

const RestockStep = ({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-32px_rgba(30,58,138,0.45)]">
    <header className="flex items-start gap-4 border-b border-stone-100 px-5 py-5 sm:px-6">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-sm font-black text-amber-300 ring-4 ring-amber-200/50">
        {step}
      </span>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{subtitle}</p> : null}
      </div>
    </header>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const payIcon = (id: RestockPayMethod) => {
  if (id === 'apple_pay' || id === 'google_pay') return <Smartphone size={18} />;
  if (id === 'credit_card') return <CreditCard size={18} />;
  return <Wallet size={18} />;
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
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [planMode, setPlanMode] = useState<RestockMode>('autoship');
  const [payMethod, setPayMethod] = useState<RestockPayMethod>('paypal');

  const { data, isLoading } = useQuery({
    queryKey: ['buy-again'],
    queryFn: buyAgainService.getBuyAgain,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!data || hydrated) return;
    setSelected(data.usual || []);
    const days = Number(data.reminder?.intervalDays) || (data.reminder?.weeks ? data.reminder.weeks * 7 : DEFAULT_INTERVAL_DAYS);
    const cadence = isValidIntervalDays(days) ? days : DEFAULT_INTERVAL_DAYS;
    setIntervalDays(cadence);
    if (data.reminder?.mode === 'ask' || data.reminder?.mode === 'autoship') {
      setPlanMode(data.reminder.mode);
    }
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
        `Saved. ${every}. Next email ${when}. Nothing ships until you pay.`,
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
      showToast('Plan stopped. You can still add items and ship now.', 'success');
    },
  });

  const petName = user?.pets?.[0]?.petName?.trim();
  const lastOrder = data?.lastOrder;
  const usualLabel = petName ? `${petName}'s usual` : 'Your usual';
  const reminderMode = data?.reminder?.mode === 'autoship' ? 'autoship' : data?.reminder ? 'ask' : null;
  const lastWasMostlyToys = Boolean(lastOrder?.items?.length) && selected.length === 0;
  const minDate = localDateStr(new Date());
  const coupon = restockCouponForMode(planMode);
  const discountCopy = restockDiscountCopy(planMode);

  const extraFromOrders = useMemo(() => {
    const keys = new Set(selected.map(pickKey));
    return (data?.regulars || []).filter((item) => {
      if (item.restockable === false) return false;
      if (!isRestockConsumable(item.name)) return false;
      return !keys.has(`${item.productId}::${item.sku || ''}`);
    });
  }, [data?.regulars, selected]);

  const unitPrice = (item: RestockPick): number => {
    if (typeof item.price === 'number' && item.price > 0) return item.price;
    const match = (lastOrder?.items || []).find((row) => {
      const id = typeof row.product === 'string' ? row.product : String((row.product as { _id?: string } | undefined)?._id || '');
      return id === item.product && (!item.sku || row.variant?.sku === item.sku);
    });
    return Number(match?.price) || 0;
  };

  const subtotal = selected.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const itemCount = selected.reduce((sum, item) => sum + item.quantity, 0);

  const openCart = () => {
    document.getElementById('restock-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('restock-add')?.focus();
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
    showToast('Added to your restock cart. Change qty or add another.', 'success');
  };

  const addRegular = (item: BuyAgainRegular) => {
    addPick({
      product: item.productId,
      name: item.name,
      image: item.image,
      quantity: Math.max(1, item.lastQuantity || 1),
      sku: item.sku,
      price: item.lastPrice,
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
      price: variant?.price || product.basePrice,
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
      showToast('Add food or treats first. Then pick how you pay and ship.', 'error');
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
        showToast('Could not add those items. Add a replacement below.', 'error');
        return;
      }
      rememberRestockCoupon(coupon);
      rememberRestockPay(payMethod);
      showToast(`Ready to ship. Choose ${restockPayLabel(payMethod)} on the next screen.`, 'success');
      navigate(`/checkout?coupon=${coupon}&pay=${payMethod}`);
    } catch {
      showToast('Could not add those items. Try again from your orders.', 'error');
    } finally {
      setRestocking(false);
    }
  };

  const savePlan = (mode: RestockMode = planMode) => {
    if (!lastOrder?._id) return;
    if (!selected.length) {
      openCart();
      showToast('Add food or treats first.', 'error');
      return;
    }
    setPlanMode(mode);
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
      <section id="restock" className="bg-[radial-gradient(circle_at_top,_#fff8e8,_#f4f0e8_42%,_#eef2f7_100%)]">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <p className="text-stone-500">Loading your restock checkout…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="restock" className="relative bg-[radial-gradient(circle_at_top,_#fff8e8,_#f4f0e8_42%,_#eef2f7_100%)]">
      <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E3A8A]">
              <Lock size={13} /> Restock checkout
            </p>
            <h2 className="font-black tracking-tight text-stone-900 text-3xl sm:text-5xl">
              Hi {user?.firstName || 'there'}. {lastOrder ? `${usualLabel} is ready.` : 'Welcome back.'}
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              {lastWasMostlyToys
                ? `Latest order ${lastOrder?.orderNumber} looks like toys or gear. Add food or treats, pick how you pay, then ship.`
                : lastOrder
                  ? 'Add or remove items, pick when, pick Apple Pay / Google Pay / PayPal / card, then Pay and ship now. We never charge unless you pay — unlike typical autoship.'
                  : 'Same-day NYC when you order by cutoff. After your first order, restock checkout lives here.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
              <Truck size={13} className="text-[#1E3A8A]" /> NYC same-day
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
              <ShieldCheck size={13} className="text-[#1E3A8A]" /> No silent charge
            </span>
            {areOrdersOpen() ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
                Order by 3 PM weekdays
              </span>
            ) : null}
          </div>
        </div>

        {!lastOrder?._id ? null : (
          <>
            <ol className="mb-6 hidden grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wide text-stone-500 sm:grid">
              <li className="rounded-full bg-white px-3 py-2 ring-1 ring-stone-200 text-[#1E3A8A]">1 · Add items</li>
              <li className="rounded-full bg-white px-3 py-2 ring-1 ring-stone-200">2 · When</li>
              <li className="rounded-full bg-white px-3 py-2 ring-1 ring-stone-200">3 · How you pay</li>
              <li className="rounded-full bg-white px-3 py-2 ring-1 ring-stone-200">4 · Ready to ship</li>
            </ol>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div id="restock-cart" className="scroll-mt-24">
                  <RestockStep
                    step="1"
                    title="Your restock cart"
                    subtitle="Search to add. Use + / − to change qty. Remove anything you do not want this time. Food and treats only."
                  >
                    {selected.length ? (
                      <ul className="space-y-3 mb-5">
                        {selected.map((item) => {
                          const key = pickKey(item);
                          const price = unitPrice(item);
                          return (
                            <li key={key} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#FBF9F5] p-3">
                              <img
                                src={normalizeImageUrl(item.image, { size: 'small', format: 'auto' })}
                                alt=""
                                className="h-16 w-16 rounded-xl object-cover bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm leading-snug text-stone-900 line-clamp-2">{item.name}</p>
                                {price > 0 ? (
                                  <p className="text-xs text-stone-500 mt-0.5">${price.toFixed(2)} each</p>
                                ) : null}
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-stone-200">
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
                                className="p-2 text-stone-400 hover:text-stone-900"
                              >
                                <X size={18} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-stone-600 mb-4 rounded-2xl border border-dashed border-stone-300 bg-[#FBF9F5] px-4 py-6 text-center">
                        Cart is empty. Search below to add food or treats, then you can ship.
                      </p>
                    )}

                    <label className="block">
                      <span className="text-sm font-semibold text-stone-800">Add food or treats</span>
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 focus-within:border-[#1E3A8A] focus-within:ring-4 focus-within:ring-[#1E3A8A]/10">
                        <Search size={18} className="text-stone-400" />
                        <input
                          id="restock-add"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Type a brand or treat — then tap Add"
                          className="w-full bg-transparent outline-none font-semibold text-stone-900 placeholder:text-stone-400"
                        />
                      </div>
                    </label>
                    {searching ? <p className="text-sm text-stone-500 mt-2">Searching…</p> : null}
                    {hits.length ? (
                      <ul className="mt-3 space-y-2">
                        {hits.map((product) => (
                          <li key={product._id}>
                            <button
                              type="button"
                              onClick={() => addProduct(product)}
                              className="w-full flex items-center gap-3 rounded-2xl border border-stone-200 p-2 text-left hover:border-[#1E3A8A] hover:bg-blue-50"
                            >
                              <img
                                src={normalizeImageUrl(product.images?.[0], { size: 'small', format: 'auto' })}
                                alt=""
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                              <span className="flex-1 font-semibold text-sm text-stone-900 line-clamp-2">{product.name}</span>
                              <span className="text-xs font-black uppercase text-[#1E3A8A]">Add</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : query.trim().length >= 2 && !searching ? (
                      <p className="text-sm text-stone-500 mt-2">No food or treats matched. Try a brand or “treats”.</p>
                    ) : null}

                    {extraFromOrders.length ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-stone-700 mb-2">From your orders — tap to add</p>
                        <div className="flex flex-wrap gap-2">
                          {extraFromOrders.slice(0, 8).map((item) => (
                            <button
                              key={`${item.productId}-${item.sku || ''}`}
                              type="button"
                              onClick={() => addRegular(item)}
                              className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-stone-200 hover:ring-[#1E3A8A]"
                            >
                              + {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </RestockStep>
                </div>

                <RestockStep
                  step="2"
                  title="When should this go out?"
                  subtitle="You pick how often, the next date, and the time. We email you then. Ignore the email and nothing ships."
                >
                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="text-sm font-medium text-stone-700">
                      How often
                      <select
                        aria-label="How often to restock"
                        value={intervalDays}
                        onChange={(event) => changeCadence(Number(event.target.value) as RestockIntervalDays)}
                        className="mt-2 w-full h-12 rounded-xl border border-stone-200 bg-[#FBF9F5] px-3 font-semibold text-stone-900 outline-none focus:border-[#1E3A8A] focus:bg-white"
                      >
                        {RESTOCK_CADENCE.map((option) => (
                          <option key={option.intervalDays} value={option.intervalDays}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-stone-700">
                      Next date
                      <input
                        type="date"
                        aria-label="Next restock email date"
                        min={minDate}
                        value={remindDate}
                        onChange={(event) => setRemindDate(event.target.value)}
                        className="mt-2 w-full h-12 rounded-xl border border-stone-200 bg-[#FBF9F5] px-3 font-semibold text-stone-900 outline-none focus:border-[#1E3A8A] focus:bg-white"
                      />
                    </label>
                    <label className="text-sm font-medium text-stone-700">
                      Time
                      <input
                        type="time"
                        aria-label="Next restock email time"
                        value={remindTime}
                        onChange={(event) => setRemindTime(event.target.value)}
                        className="mt-2 w-full h-12 rounded-xl border border-stone-200 bg-[#FBF9F5] px-3 font-semibold text-stone-900 outline-none focus:border-[#1E3A8A] focus:bg-white"
                      />
                    </label>
                  </div>
                </RestockStep>

                <RestockStep
                  step="3"
                  title="How do you want to pay?"
                  subtitle="Pick Apple Pay, Google Pay, PayPal, or card now. You still pay on the next screen — we never charge a saved card in the background."
                >
                  <div className="grid sm:grid-cols-2 gap-3">
                    {RESTOCK_PAY_OPTIONS.map((option) => {
                      const active = payMethod === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setPayMethod(option.id)}
                          className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
                            active ? 'border-[#1E3A8A] bg-blue-50' : 'border-stone-200 bg-white hover:border-stone-400'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                              active ? 'bg-[#1E3A8A]' : 'border-2 border-stone-300'
                            }`}
                          >
                            {active ? <Check className="h-3 w-3 text-white" /> : null}
                          </span>
                          <span>
                            <span className="flex items-center gap-2 font-bold text-stone-900">
                              {payIcon(option.id)}
                              {option.label}
                            </span>
                            <span className="mt-1 block text-sm text-stone-500">{option.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-sm text-stone-500">
                    Official checkout buttons appear after you tap <span className="font-semibold text-stone-700">Pay and ship now</span>.
                  </p>
                </RestockStep>
              </div>

              <aside className="lg:sticky lg:top-24 h-fit space-y-4">
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(30,58,138,0.45)]">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1E3A8A] mb-2">
                    <PackageCheck size={14} /> 4 · Ready to ship
                  </p>
                  <h3 className="text-2xl font-black text-stone-900 mb-1">This order</h3>
                  <p className="text-sm text-stone-500 mb-4">
                    {itemCount ? `${itemCount} item${itemCount === 1 ? '' : 's'} · ${cadenceLabel(intervalDays).toLowerCase()}` : 'Add items to enable shipping.'}
                  </p>
                  <ul className="space-y-2 mb-4 text-sm">
                    {selected.slice(0, 6).map((item) => (
                      <li key={pickKey(item)} className="flex justify-between gap-3 text-stone-700">
                        <span className="line-clamp-1">{item.quantity} × {item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2 text-sm border-t border-stone-100 pt-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Pay with</span>
                      <span className="font-semibold text-stone-900">{restockPayLabel(payMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Restock save</span>
                      <span className="font-semibold text-emerald-700">{coupon} · {discountCopy}</span>
                    </div>
                    {subtotal > 0 ? (
                      <div className="flex justify-between font-black text-stone-900">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-stone-800 mb-2">How this ships next time</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setPlanMode('ask')}
                      className={`rounded-xl px-3 py-2 text-left text-xs font-bold ring-2 ${
                        planMode === 'ask' ? 'ring-[#1E3A8A] bg-blue-50 text-[#1E3A8A]' : 'ring-stone-200 text-stone-600'
                      }`}
                    >
                      Ask first
                      <span className="block font-semibold text-[11px] text-stone-500">5% · you confirm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanMode('autoship')}
                      className={`rounded-xl px-3 py-2 text-left text-xs font-bold ring-2 ${
                        planMode === 'autoship' ? 'ring-emerald-500 bg-emerald-50 text-emerald-800' : 'ring-stone-200 text-stone-600'
                      }`}
                    >
                      Autoship email
                      <span className="block font-semibold text-[11px] text-stone-500">7% · still no auto-charge</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmNow}
                    disabled={restocking || !selected.length}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-4 py-3.5 font-black text-white shadow-lg shadow-blue-900/20 hover:bg-[#16307a] disabled:opacity-50"
                  >
                    {restocking ? 'Adding to checkout…' : 'Pay and ship now'}
                  </button>
                  <p className="mt-2 text-xs text-center text-stone-500">
                    Next: checkout. Tap {restockPayLabel(payMethod)} there. Nothing is charged until you do.
                  </p>
                  <button
                    type="button"
                    onClick={() => savePlan(planMode)}
                    disabled={reminderMutation.isPending || !selected.length}
                    className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {reminderMutation.isPending ? 'Saving…' : 'Save list — email me next time'}
                  </button>
                  {reminderMode && data?.reminder ? (
                    <button
                      type="button"
                      className="mt-2 w-full text-xs font-semibold text-stone-500 underline"
                      onClick={() => cancelMutation.mutate(data.reminder!._id)}
                      disabled={cancelMutation.isPending}
                    >
                      Stop reminder emails
                    </button>
                  ) : null}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </section>
  );
};

export default RestockDashboard;
