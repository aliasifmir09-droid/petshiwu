import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orders';
import { productService } from '@/services/products';
import { addressService } from '@/services/addresses';
import paymentMethodService from '@/services/paymentMethods';
import { Address, Order } from '@/types';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import CheckoutCharityCard from '@/components/CheckoutCharityCard';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
const getStripe = () => import('@/utils/stripe').then(m => m.getStripe());
import { normalizeId } from '@/utils/idNormalizer';
import { trackPurchase } from '@/utils/analytics';
import { rememberGoogleReviewOptIn } from '@/utils/googleCustomerReviews';
import SEO from '@/components/SEO';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrdersOpenBanner from '@/components/OrdersOpenBanner';
import { MapPin, Plus, Check, User, UserCheck, Banknote, ShieldCheck, RotateCcw, Headphones, Lock, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST, TAX_RATE } from '@/config/constants';
import { paypalClientId } from '@/config/paypal';
import { isNycDeliveryZip, isNewYorkState, normalizeShippingState } from '@/utils/deliveryZip';
import { clearRestockCoupon, clearRestockPay, readRestockCoupon, readRestockPay, isRestockPayMethod, ASK_COUPON, ASK_DISCOUNT_COPY, AUTOSHIP_COUPON, AUTOSHIP_DISCOUNT_COPY } from '@/utils/restock';
import {
  formatCardExpiry,
  isReusableSavedCard,
  pickDefaultSavedCard,
  savedCardLabel,
} from '@/utils/savedCheckout';

const PaymentForm = lazy(() => import('@/components/PaymentForm'));
const CheckoutBrandedPayments = lazy(() => import('@/components/CheckoutBrandedPayments'));

const fieldClass =
  'w-full h-12 rounded-xl border border-stone-200 bg-[#FBF9F5] px-4 text-[15px] text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10';

const CheckoutStep = ({
  step,
  title,
  subtitle,
  children
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-32px_rgba(30,58,138,0.45)]">
    <header className="flex items-start gap-4 border-b border-stone-100 px-6 py-5">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-sm font-black text-amber-300 ring-4 ring-amber-200/50">
        {step}
      </span>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{subtitle}</p> : null}
      </div>
    </header>
    <div className="p-6 sm:p-7">{children}</div>
  </section>
);

interface CreateOrderData {
  items: Array<{
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    variant?: { size?: string; weight?: string; sku: string };
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod';
  paymentIntentId?: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  totalPrice: number;
  couponCode?: string;
  notes?: string;
  guestEmail?: string;
}

const StripePaymentWrapper = ({
  clientSecret, total, onSuccess, onError, onCancel
}: {
  clientSecret: string;
  total: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) => {
  const [ElementsComponent, setElementsComponent] = useState<React.ComponentType<any> | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStripe = () => {
      Promise.all([import('@stripe/react-stripe-js'), getStripe()])
        .then(([stripeReactModule, stripe]) => {
          setElementsComponent(() => stripeReactModule.Elements);
          setStripeInstance(stripe);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load Stripe:', error);
          onError('Failed to load payment form. Please refresh the page and try again.');
          setIsLoading(false);
        });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadStripe, { timeout: 2000 });
    } else {
      setTimeout(loadStripe, 0);
    }
  }, [onError]);

  if (isLoading || !ElementsComponent || !stripeInstance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      </div>
    }>
      <ElementsComponent stripe={stripeInstance} options={{ clientSecret }}>
        <PaymentForm
          clientSecret={clientSecret}
          amount={total}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </ElementsComponent>
    </Suspense>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  const { inputRef: streetInputRef } = useGooglePlacesAutocomplete({
    onAddressSelect: (address) => {
      setShippingInfo(prev => ({
        ...prev,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'USA'
      }));
    }
  });

  const { data: savedAddresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressService.getAddresses,
    enabled: isAuthenticated,
    retry: 1
  });

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod'>('paypal');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPayPalButton, setShowPayPalButton] = useState(true);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [emailError, setEmailError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const paypalSuccessHandledRef = useRef(false);
  const restockCouponAttempted = useRef(false);
  const [pendingOrderData, setPendingOrderData] = useState<CreateOrderData | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedSavedPaymentMethod, setSelectedSavedPaymentMethod] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  const { data: savedPaymentMethods = [], isFetched: paymentMethodsFetched } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await paymentMethodService.getPaymentMethods();
      return response.data || [];
    },
    enabled: isAuthenticated,
    retry: 1
  });
  const selectedSaved = savedPaymentMethods.find((pm: any) => pm._id === selectedSavedPaymentMethod);
  const usingSavedCard = isReusableSavedCard(selectedSaved);
  const autoSelectedSavedCard = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restockPay = params.get('pay') || readRestockPay();
    if (!isAuthenticated) {
      if (isRestockPayMethod(restockPay)) setPaymentMethod(restockPay);
      return;
    }
    if (!paymentMethodsFetched || autoSelectedSavedCard.current) return;
    if (isRestockPayMethod(restockPay) && restockPay !== 'credit_card') {
      setPaymentMethod(restockPay);
      autoSelectedSavedCard.current = true;
      return;
    }
    const savedCard = pickDefaultSavedCard(savedPaymentMethods);
    if (savedCard) {
      setSelectedSavedPaymentMethod(savedCard._id);
      setPaymentMethod('credit_card');
      autoSelectedSavedCard.current = true;
      return;
    }
    if (isRestockPayMethod(restockPay)) setPaymentMethod(restockPay);
    autoSelectedSavedCard.current = true;
  }, [savedPaymentMethods, isAuthenticated, paymentMethodsFetched]);

  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault) || savedAddresses[0];
      if (defaultAddress) handleSelectAddress(defaultAddress);
    }
  }, [savedAddresses]);

  useEffect(() => {
    if (user && isAuthenticated) {
      setShippingInfo(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user, isAuthenticated]);

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address._id || null);
    setShowNewAddressForm(false);
    setShippingInfo(prev => ({
      ...prev,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || 'USA'
    }));
  };

  const saveAddressIfNeeded = async () => {
    if (saveNewAddress && isAuthenticated && !selectedAddressId && (showNewAddressForm || savedAddresses.length === 0)) {
      if (!shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) return;
      try {
        await addressService.createAddress({
          street: shippingInfo.street,
          city: shippingInfo.city,
          state: normalizeShippingState(shippingInfo.state),
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
          isDefault: savedAddresses.length === 0
        });
        refetchAddresses();
      } catch (error: any) {
        import('@/utils/safeLogger').then(({ safeError }) => safeError('Failed to save address', error));
      }
    }
  };

  const refreshCartProducts = async () => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          let productId = normalizeId(item.product._id);
          if (!productId) {
            const possibleIdFields = ['_id', 'id', '$oid', 'oid'];
            for (const field of possibleIdFields) {
              const value = (item.product as any)[field];
              if (value) {
                productId = normalizeId(value);
                if (productId) break;
              }
            }
          }
          if (!productId) return item;
          try {
            const freshProduct = await productService.getProduct(productId);
            return { ...item, product: freshProduct };
          } catch (error) {
            return item;
          }
        })
      );
      const { setItems } = useCartStore.getState();
      setItems(updatedItems);
    } catch (error) {
      showToast('Failed to refresh cart products', 'error');
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const onlineTotal = Math.max(0, subtotal + shipping + tax - couponDiscount);
  const total = Math.max(0, onlineTotal + donationAmount);

  const applyCoupon = async (codeToApply?: string) => {
    const raw = (codeToApply ?? couponInput).trim();
    if (!raw) return;
    if (!shippingInfo.email?.trim()) {
      setCouponValid(false);
      setCouponMessage('Please enter your email address above before applying a coupon.');
      return;
    }
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/v1/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: raw, subtotal, email: shippingInfo.email }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCode(raw.toUpperCase());
        setCouponInput(raw.toUpperCase());
        setCouponDiscount(data.discountAmount);
        setCouponValid(true);
        setCouponMessage(data.message);
      } else {
        setCouponValid(false);
        setCouponMessage(data.message);
        setCouponDiscount(0);
        setCouponCode('');
      }
    } catch {
      setCouponValid(false);
      setCouponMessage('Could not apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    await applyCoupon();
  };

  useEffect(() => {
    const pending = readRestockCoupon();
    if (!pending || couponCode || couponLoading || subtotal <= 0) return;
    if (!shippingInfo.email?.trim() || restockCouponAttempted.current) return;
    restockCouponAttempted.current = true;
    void applyCoupon(pending);
  }, [couponCode, couponLoading, shippingInfo.email, subtotal]);

  const handleRemoveCoupon = () => {
    restockCouponAttempted.current = true;
    clearRestockCoupon();
    setCouponCode('');
    setCouponInput('');
    setCouponDiscount(0);
    setCouponMessage('');
    setCouponValid(null);
  };

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async (order) => {
      clearCart();
      clearRestockCoupon();
      clearRestockPay();
      const orderId = String(order._id || '');
      // Record coupon usage so it can't be reused
      if (couponCode && shippingInfo.email) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '/api';
          await fetch(`${API_URL}/v1/coupons/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: couponCode, email: shippingInfo.email, orderId }),
          });
        } catch {
          // Non-critical — don't block order success flow
        }
      }
      const purchaseItems = items.map((item: any) => ({
        item_id: normalizeId(item.product._id) || String(item.product._id),
        item_name: item.product.name,
        price: item.variant?.price || item.product.basePrice,
        quantity: item.quantity,
      }));
      trackPurchase(orderId, total, purchaseItems);
      rememberGoogleReviewOptIn({
        email: shippingInfo.email,
        orderNumber: order.orderNumber,
        orderId,
      });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['order'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      // For guests, navigate to track order page instead of my orders
      if (!isAuthenticated) {
        navigate(`/track-order?order=${order.orderNumber || orderId}&newOrder=true`);
      } else {
        navigate(`/orders/${orderId}?newOrder=true`);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      const errorDetails = error.response?.data?.errors;
      if (errorDetails && Array.isArray(errorDetails)) {
        showToast(`${errorMessage}\n${errorDetails.map((e: any) => e.message || e).join('\n')}`, 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    }
  });

  useEffect(() => {
    if (usingSavedCard) {
      setShowPayPalButton(false);
      setShowPaymentForm(false);
      return;
    }

    if (paymentMethod === 'paypal' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay' || paymentMethod === 'cod') {
      setShowPayPalButton(paymentMethod !== 'cod');
      setShowPaymentForm(false);
      setClientSecret(null);
      setPaymentIntentId(null);
      return;
    }

    let cancelled = false;
    const createPaymentIntent = async () => {
      setIsProcessingPayment(true);
      setShowPaymentForm(false);
      setClientSecret(null);
      setPaymentIntentId(null);
      try {
        const paymentIntentResponse = await orderService.createPaymentIntent({
          totalPrice: total,
          paymentMethod,
          saveForReuse: Boolean(isAuthenticated && savePaymentMethod),
        });
        if (cancelled) return;
        if (paymentIntentResponse.success && paymentIntentResponse.data?.clientSecret) {
          setClientSecret(paymentIntentResponse.data.clientSecret);
          setPaymentIntentId(paymentIntentResponse.data.paymentIntentId);
          setShowPaymentForm(true);
          setShowPayPalButton(false);
        } else {
          showToast('Failed to initialize payment. Please try PayPal again.', 'error');
          setPaymentMethod('paypal');
        }
      } catch (error: any) {
        if (cancelled) return;
        showToast(error.response?.data?.message || 'Payment initialization failed. Please try PayPal again.', 'error');
        setPaymentMethod('paypal');
      } finally {
        if (!cancelled) setIsProcessingPayment(false);
      }
    };

    createPaymentIntent();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, total, selectedSavedPaymentMethod, savePaymentMethod, usingSavedCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // GUEST CHECKOUT: No longer redirect to login — guests can proceed
    // Validate required fields
    if (!shippingInfo.firstName?.trim()) { showToast('Please enter your first name', 'error'); return; }
    if (!shippingInfo.lastName?.trim()) { showToast('Please enter your last name', 'error'); return; }
    if (!shippingInfo.phone?.trim()) { showToast('Please enter a phone number for delivery', 'error'); return; }
    if (!shippingInfo.street?.trim() || !shippingInfo.city?.trim() || !shippingInfo.state?.trim() || !shippingInfo.zipCode?.trim()) {
      showToast('Please complete all required shipping address fields', 'error');
      return;
    }

    // NYC-only delivery check (includes Queens 111xx Astoria/LIC, which the old range skipped)
    const _isNY = isNewYorkState(shippingInfo.state);
    if (!_isNY || !isNycDeliveryZip(shippingInfo.zipCode)) {
      showToast('Sorry, we currently deliver only within New York City (all 5 boroughs).', 'error');
      return;
    }

    // Guest must provide email
    if (!isAuthenticated && !shippingInfo.email?.trim()) {
      setEmailError(true);
      emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emailInputRef.current?.focus();
      showToast('Please enter your email address to receive order confirmation', 'error');
      return;
    }

    // Validate email format for guests
    if (!isAuthenticated && shippingInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingInfo.email)) {
        setEmailError(true);
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailInputRef.current?.focus();
        showToast('Please enter a valid email address', 'error');
        return;
      }
    }
    setEmailError(false);

    if (paymentMethod === 'cod') {
      await prepareAndSubmitOrder();
      return;
    }

    if (usingSavedCard) {
      setIsProcessingPayment(true);
      try {
        let secret = clientSecret;
        if (!secret) {
          const paymentIntentResponse = await orderService.createPaymentIntent({
            totalPrice: total,
            paymentMethod: 'credit_card',
            saveForReuse: false,
            savedPaymentMethodId: selectedSavedPaymentMethod || undefined,
          });
          if (!paymentIntentResponse.success || !paymentIntentResponse.data?.clientSecret) {
            showToast(paymentIntentResponse.message || 'Could not start payment with your saved card.', 'error');
            return;
          }
          secret = paymentIntentResponse.data.clientSecret;
          setClientSecret(secret);
          setPaymentIntentId(paymentIntentResponse.data.paymentIntentId);
        }
        const stripeJs = await getStripe();
        if (!stripeJs) {
          showToast('Payment is not ready. Please try again.', 'error');
          return;
        }
        const result = await stripeJs.confirmCardPayment(secret);
        if (result.error) {
          showToast(result.error.message || 'Could not charge the saved card.', 'error');
          return;
        }
        if (result.paymentIntent?.status === 'succeeded') {
          await prepareAndSubmitOrder(result.paymentIntent.id);
        } else {
          showToast('Payment was not completed. Please try again.', 'error');
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || err?.message || 'Could not charge the saved card.', 'error');
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    if (paymentMethod !== 'paypal' && paymentMethod !== 'apple_pay' && paymentMethod !== 'google_pay' && !paymentIntentId) {
      showToast('Please complete the payment first.', 'error');
      return;
    }
    if (paymentMethod === 'paypal' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
      document.getElementById('paypal-payment')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Click Apple Pay, Google Pay, or a PayPal button to complete your payment.', 'info');
      return;
    }

    if (paymentIntentId) {
      await prepareAndSubmitOrder(paymentIntentId);
    } else {
      if (!showPaymentForm && clientSecret) {
        setShowPaymentForm(true);
      } else if (!clientSecret) {
        showToast('Please wait for payment initialization...', 'info');
      }
    }
  };

  const handlePaymentSuccess = async (confirmedPaymentIntentId: string) => {
    setPaymentIntentId(confirmedPaymentIntentId);
    setShowPaymentForm(false);
    if (pendingOrderData) {
      createOrderMutation.mutate({ ...pendingOrderData, paymentIntentId: confirmedPaymentIntentId });
      setPendingOrderData(null);
    } else {
      await prepareAndSubmitOrder(confirmedPaymentIntentId);
    }
  };

  const handlePaymentError = (error: string) => {
    showToast(error, 'error');
    setIsProcessingPayment(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
    setPaymentIntentId(null);
    setPaymentMethod('paypal');
  };

  const handlePayPalSuccess = async (order: Order) => {
    if (paypalSuccessHandledRef.current) return;
    paypalSuccessHandledRef.current = true;

    clearCart();
    const orderId = String(order._id || '');
    const purchaseItems = items.map((item: any) => ({
      item_id: normalizeId(item.product._id) || String(item.product._id),
      item_name: item.product.name,
      price: item.variant?.price || item.product.basePrice,
      quantity: item.quantity
    }));
    trackPurchase(orderId, order.totalPrice, purchaseItems);
    rememberGoogleReviewOptIn({
      email: shippingInfo.email,
      orderNumber: order.orderNumber,
      orderId,
    });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await queryClient.invalidateQueries({ queryKey: ['order'] });
    if (!isAuthenticated) {
      navigate(`/track-order?order=${order.orderNumber || orderId}&newOrder=true`);
    } else {
      navigate(`/orders/${orderId}?newOrder=true`);
    }
  };

  const handlePayPalError = (error: string) => {
    showToast(error, 'error');
    setIsProcessingPayment(false);
  };

  const handlePayPalCancel = () => {
    setShowPayPalButton(true);
    setPaymentMethod('paypal');
  };

  const prepareAndSubmitOrder = async (confirmedPaymentIntentId?: string) => {
    await saveAddressIfNeeded();
    let currentItems = items;

    const itemsWithoutIds = currentItems.filter((item: any) => {
      const id = normalizeId(item.product._id);
      return !id || !/^[0-9a-fA-F]{24}$/.test(id);
    });

    if (itemsWithoutIds.length > 0) {
      showToast('Refreshing cart items...', 'info');
      await refreshCartProducts();
      currentItems = useCartStore.getState().items;
      const stillInvalid = currentItems.filter((item: any) => {
        const id = normalizeId(item.product._id);
        return !id || !/^[0-9a-fA-F]{24}$/.test(id);
      });
      if (stillInvalid.length > 0) {
        showToast('Some products still have invalid IDs. Please remove them from cart and add again.', 'error');
        return;
      }
    }

    const outOfStockItems = currentItems.filter((item: any) => item.product?.inStock === false);
    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((item: any) => item.product.name).join(', ');
      showToast(`"${names}" is out of stock. Please remove it from your cart before ordering.`, 'error');
      return;
    }

    const orderData: CreateOrderData = {
      items: currentItems.map((item: any) => {
        const productId = normalizeId(item.product._id);
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
          throw new Error(`Invalid product ID for item: ${item.product.name}. Please remove this item from cart and add it again.`);
        }
        return {
          product: productId,
          name: item.product.name,
          image: normalizeImageUrl(item.product.images?.[0]) || '',
          price: item.variant?.price || item.product.basePrice,
          quantity: item.quantity,
          variant: item.variant ? { size: item.variant.size, weight: item.variant.weight, sku: item.variant.sku } : undefined
        };
      }),
      shippingAddress: {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        street: shippingInfo.street,
        city: shippingInfo.city,
        state: normalizeShippingState(shippingInfo.state),
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
        phone: shippingInfo.phone
      },
      paymentMethod,
      paymentIntentId: confirmedPaymentIntentId || paymentIntentId || undefined,
      itemsPrice: subtotal,
      shippingPrice: shipping,
      taxPrice: tax,
      donationAmount: donationAmount > 0 ? donationAmount : undefined,
      totalPrice: total,
      couponCode: couponCode || undefined,
      notes: orderNotes.trim() || undefined,
      // GUEST CHECKOUT: include guest email
      ...(!isAuthenticated && shippingInfo.email ? { guestEmail: shippingInfo.email } : {})
    };

    // Include any optional shelter donation in the charged total so PayPal/Stripe
    // capture matches the store order.
    createOrderMutation.mutate(orderData);
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <>
      <SEO title="Checkout | petshiwu" description="Complete your purchase at petshiwu" noindex={true} />
      <div className="-mt-2 min-h-screen bg-[radial-gradient(circle_at_top,_#fff8e8,_#f4f0e8_42%,_#eef2f7_100%)] pb-16">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E3A8A]">
              <Lock size={13} /> Secure checkout
            </p>
            <h1 className="font-black tracking-tight text-stone-900 text-4xl sm:text-5xl">Almost home.</h1>
            <p className="mt-2 max-w-xl text-stone-600">
              Same-day Queens delivery, PayPal-secured payment, and a 24/7 call center — the kind of checkout a pet parent should trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200"><Truck size={13} className="text-[#1E3A8A]" /> NYC same-day</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200"><ShieldCheck size={13} className="text-[#1E3A8A]" /> PayPal protected</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200"><RotateCcw size={13} className="text-[#1E3A8A]" /> 365-day returns</span>
          </div>
        </div>

                <div className="mb-6">
                  <OrdersOpenBanner compact />
                </div>

                {/* GUEST CHECKOUT BANNER — show only when not logged in */}
        {!isAuthenticated && (
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_16px_40px_-28px_rgba(30,58,138,0.4)] sm:flex-row sm:items-center">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-amber-300">
                <User size={20} />
              </div>
              <div>
                <p className="text-base font-bold text-stone-900">Guest checkout is open</p>
                <p className="text-sm text-stone-600 mt-1">
                  Sign in to save your card and address for next time, or continue below — no account required.
                </p>
              </div>
            </div>
            <Link
              to="/login?redirect=/checkout"
              className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-[#16307a] transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <CheckoutStep step="1" title="Delivery" subtitle="Where should this care package land tonight?">

                {/* Logged-in user info display */}
                {isAuthenticated && user && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                    <UserCheck className="text-green-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                    </div>
                  </div>
                )}

                {/* Guest fields: name + email + phone */}
                {!isAuthenticated && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address * <span className="text-xs text-gray-500">(for order confirmation)</span></label>
                      <input
                        ref={emailInputRef}
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) => { setShippingInfo({ ...shippingInfo, email: e.target.value }); setEmailError(false); }}
                        placeholder="you@example.com"
                        className={`${fieldClass} ${emailError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : ''}`}
                      />
                      {emailError && <p className="text-red-500 text-xs mt-1">Required — we'll send your order confirmation here</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                )}

                {/* Name fields for logged-in users missing first/last name */}
                {isAuthenticated && (!user?.firstName || !user?.lastName) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input type="text" required value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                        className={fieldClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input type="text" required value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                        className={fieldClass} />
                    </div>
                  </div>
                )}

                {/* Phone for logged-in users */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <input type="tel" required value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      className={fieldClass} />
                  </div>
                )}

                {/* Saved Addresses */}
                {isAuthenticated && savedAddresses.length > 0 && !showNewAddressForm && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">Select Address</label>
                    <div className="space-y-3">
                      {savedAddresses.map((address: any) => (
                        <button key={address._id} type="button" onClick={() => handleSelectAddress(address)}
                          className={`w-full text-left p-4 border-2 rounded-lg transition-all ${selectedAddressId === address._id ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selectedAddressId === address._id ? 'bg-primary-600' : 'border-2 border-gray-400'}`}>
                              {selectedAddressId === address._id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {address.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Default</span>}
                              </div>
                              <p className="font-medium text-gray-900">{address.street}</p>
                              <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                              <p className="text-sm text-gray-600">{address.country}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                      className="mt-3 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors">
                      <Plus className="w-5 h-5" />
                      <span>Add New Address</span>
                    </button>
                  </div>
                )}

                {/* Address Form */}
                {(showNewAddressForm || savedAddresses.length === 0 || !isAuthenticated) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Street Address *
                        <span className="ml-2 text-xs text-primary-600 font-normal">🔍 Start typing for autocomplete</span>
                      </label>
                      <input ref={streetInputRef} type="text" required value={shippingInfo.street}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                        placeholder="Start typing your address..." autoComplete="off"
                        className={fieldClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <input type="text" required value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State *</label>
                        <input type="text" required value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          onBlur={() => setShippingInfo((prev) => ({ ...prev, state: normalizeShippingState(prev.state) }))}
                          placeholder="NY"
                          autoComplete="address-level1"
                          className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                        <input type="text" required value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Country *</label>
                        <input type="text" required value={shippingInfo.country}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                          className={fieldClass} />
                      </div>
                    </div>
                    {isAuthenticated && (showNewAddressForm || savedAddresses.length === 0) && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="saveAddress" checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                        <label htmlFor="saveAddress" className="text-sm text-gray-700">Save this address to my account</label>
                      </div>
                    )}
                    {isAuthenticated && savedAddresses.length > 0 && showNewAddressForm && (
                      <button type="button"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault) || savedAddresses[0];
                          if (defaultAddress) handleSelectAddress(defaultAddress);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                    )}
                  </div>
                )}
              </CheckoutStep>

              {/* Payment Method */}
              <CheckoutStep step="2" title="Payment" subtitle="Apple Pay, Google Pay, PayPal, Venmo, or card — official buttons, the way a flagship store would do it.">

                {isAuthenticated && savedPaymentMethods.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">Saved Payment Methods</label>
                    <div className="space-y-3">
                      {savedPaymentMethods.filter((pm: any) => pm.type !== 'cod').map((pm: any) => (
                        <button key={pm._id} type="button"
                          onClick={() => {
                            setSelectedSavedPaymentMethod(pm._id);
                            setPaymentMethod(isReusableSavedCard(pm) ? 'credit_card' : pm.type);
                          }}
                          className={`w-full text-left p-4 border-2 rounded-lg transition-all ${selectedSavedPaymentMethod === pm._id ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selectedSavedPaymentMethod === pm._id ? 'bg-primary-600' : 'border-2 border-gray-400'}`}>
                              {selectedSavedPaymentMethod === pm._id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {pm.type === 'credit_card' ? 'Credit/Debit Card' : pm.type === 'paypal' ? 'PayPal' : pm.type === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                                </span>
                                {pm.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Default</span>}
                              </div>
                              {pm.last4 && (
                                <p className="text-sm text-gray-600">
                                  {pm.brand ? `${pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} ` : ''}•••• {pm.last4}
                                  {formatCardExpiry(pm) ? ` • Expires ${formatCardExpiry(pm)}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSavedPaymentMethod(null);
                        setPaymentMethod('paypal');
                        setShowPayPalButton(true);
                      }}
                      className="mt-3 text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      Use a different payment method
                    </button>
                    <div className="mt-3 text-sm text-gray-600"><span>Or use a branded payment button below</span></div>
                  </div>
                )}

                {showPayPalButton && paymentMethod !== 'cod' && paypalClientId && !usingSavedCard ? (
                  <div id="paypal-payment">
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="md" />
                        <span className="ml-3 text-gray-600">Loading secure payment...</span>
                      </div>
                    }>
                      <CheckoutBrandedPayments
                        items={items.map((item: any) => ({
                          product: normalizeId(item.product._id) || String(item.product._id),
                          quantity: item.quantity,
                          ...(item.variant?.sku ? { variant: { sku: item.variant.sku } } : {})
                        }))}
                        total={total}
                        shippingAddress={{
                          firstName: shippingInfo.firstName,
                          lastName: shippingInfo.lastName,
                          street: shippingInfo.street,
                          city: shippingInfo.city,
                          state: normalizeShippingState(shippingInfo.state),
                          zipCode: shippingInfo.zipCode,
                          country: shippingInfo.country,
                          phone: shippingInfo.phone
                        }}
                        guestEmail={!isAuthenticated ? shippingInfo.email.trim() : undefined}
                        onGuestEmailInvalid={() => {
                          setEmailError(true);
                          emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          emailInputRef.current?.focus();
                        }}
                        notes={orderNotes.trim() || undefined}
                        couponCode={couponCode || undefined}
                        donationAmount={donationAmount}
                        onSuccess={handlePayPalSuccess}
                        onError={handlePayPalError}
                        onCancel={handlePayPalCancel}
                      />
                    </Suspense>
                  </div>
                ) : !paypalClientId && paymentMethod !== 'cod' ? (
                  <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <p className="font-semibold text-gray-700">PayPal is temporarily unavailable</p>
                    <p className="text-sm text-gray-500 mt-1">You can still pay cash when your order arrives.</p>
                  </div>
                ) : null}

                {paymentMethod === 'cod' && (
                  <div className="mb-4 p-4 rounded-lg border-2 border-primary-600 bg-primary-50">
                    <p className="font-semibold text-gray-900">Cash on Delivery selected</p>
                    <p className="text-sm text-gray-600 mt-1">Pay cash when your order arrives. No card needed.</p>
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('paypal'); setSelectedSavedPaymentMethod(null); }}
                      className="mt-3 text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      Use Apple Pay, Google Pay, or PayPal instead
                    </button>
                  </div>
                )}

                {paymentMethod !== 'cod' && (
                  <>
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <button type="button" onClick={() => {
                      setPaymentMethod('cod');
                      setSelectedSavedPaymentMethod(null);
                      setSavePaymentMethod(false);
                    }}
                      className="w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all border-gray-300 bg-white hover:border-gray-400">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-900">Cash on Delivery</span>
                        <p className="text-sm text-gray-600 mt-1">Pay cash when your order arrives. No card needed.</p>
                      </div>
                    </button>
                  </>
                )}

                {usingSavedCard && selectedSaved ? (
                  <div className="mt-4 rounded-2xl border-2 border-[#1E3A8A] bg-blue-50 p-4">
                    <p className="font-semibold text-stone-900">Paying with {savedCardLabel(selectedSaved)}</p>
                    <p className="text-sm text-stone-600 mt-1">
                      We’ll use this saved card. You still confirm on this page — we never charge in the background.
                    </p>
                  </div>
                ) : null}

                {isAuthenticated && !selectedSavedPaymentMethod && paymentMethod !== 'cod' && (
                  <div className="mt-4 flex items-center gap-2">
                    <input type="checkbox" id="savePaymentMethod" checked={savePaymentMethod}
                      onChange={(e) => setSavePaymentMethod(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                    <label htmlFor="savePaymentMethod" className="text-sm text-gray-700">
                      Save this payment method for faster checkout next time
                    </label>
                  </div>
                )}

                {isProcessingPayment && !clientSecret && paymentMethod !== 'paypal' && paymentMethod !== 'apple_pay' && paymentMethod !== 'google_pay' && paymentMethod !== 'cod' && (

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">⏳ Initializing payment...</span> Please wait while we set up your secure payment.
                    </p>
                  </div>
                )}
              </CheckoutStep>

              {/* Stripe Payment Form */}
              {showPaymentForm && clientSecret && !usingSavedCard && paymentMethod !== 'paypal' && paymentMethod !== 'apple_pay' && paymentMethod !== 'google_pay' && paymentMethod !== 'cod' && (
                <StripePaymentWrapper clientSecret={clientSecret} total={total}
                  onSuccess={handlePaymentSuccess} onError={handlePaymentError} onCancel={handlePaymentCancel} />
              )}

              {/* Order Notes */}
              <CheckoutStep step="3" title="A note for the courier" subtitle="Gate codes, doorman, or “leave with the neighbor.” Optional.">
                <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special delivery instructions or notes for your order..."
                  rows={4} maxLength={500}
                  className={`${fieldClass} h-auto min-h-[7rem] py-3`} />
                <p className="text-xs text-stone-500 mt-2">{orderNotes.length}/500 characters</p>
              </CheckoutStep>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-24 overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-32px_rgba(30,58,138,0.5)]">
                <div className="bg-[#1E3A8A] px-6 py-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Your order</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">${total.toFixed(2)}</h2>
                  <p className="mt-1 text-sm text-blue-100">{items.length} {items.length === 1 ? 'item' : 'items'} · packed in Queens</p>
                </div>
                <div className="p-6">
                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    const price = item.variant?.price || item.product.basePrice;
                    return (
                      <div key={`${item.product._id}-${item.variant?.sku}`} className="flex gap-3">
                        <img src={normalizeImageUrl(item.product.images?.[0])} alt={item.product.name}
                          onError={(e) => handleImageError(e, item.product.name)}
                          className="h-[4.5rem] w-[4.5rem] rounded-2xl object-cover ring-1 ring-stone-200" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-stone-900 leading-snug">{item.product.name}</p>
                          <p className="text-xs text-stone-500 mt-1">Qty {item.quantity}</p>
                          {item.variant && <p className="text-xs text-stone-500">{item.variant.size || item.variant.weight}</p>}
                        </div>
                        <p className="font-bold text-stone-900">${(price * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-3 border-t border-stone-100 pt-4 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-semibold text-stone-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Shipping</span>
                    <span className="font-semibold text-stone-800">
                      {shipping === 0 ? <span className="text-emerald-600">FREE</span> : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Tax</span>
                    <span className="font-semibold text-stone-800">${tax.toFixed(2)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Coupon ({couponCode})</span>
                      <span className="font-semibold">-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-1">
                    {!couponCode ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                          placeholder="Promo code"
                          className="flex-1 rounded-xl border border-stone-200 bg-[#FBF9F5] px-3 py-2.5 text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                        <span className="text-emerald-700 text-sm font-semibold">{couponCode} applied</span>
                        <button type="button" onClick={handleRemoveCoupon} className="text-stone-400 hover:text-stone-700 text-xs ml-2">Remove</button>
                      </div>
                    )}
                    {!couponCode && !couponMessage && (
                      <p className="text-xs text-stone-500 mt-1.5">
                        First order: FREEDOM20 · 20% off, max $10. Reorder {ASK_COUPON} · {ASK_DISCOUNT_COPY}. Autoship {AUTOSHIP_COUPON} · {AUTOSHIP_DISCOUNT_COPY}.
                      </p>
                    )}
                    {couponMessage && (
                      <p className={`text-xs mt-1.5 ${couponValid ? 'text-emerald-600' : 'text-red-500'}`}>{couponMessage}</p>
                    )}
                  </div>
                  <CheckoutCharityCard amount={donationAmount} onChange={setDonationAmount} />
                  {donationAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-600 font-medium">Shelter donation</span>
                      <span className="font-bold text-rose-600">${donationAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-3 flex justify-between text-lg font-black text-stone-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit"
                  disabled={createOrderMutation.isPending || (isProcessingPayment && paymentMethod !== 'cod')}
                  className="w-full rounded-2xl bg-[#1E3A8A] py-4 text-lg font-black text-white shadow-lg shadow-blue-900/25 hover:bg-[#16307a] disabled:opacity-50">
                  {paymentMethod === 'cod'
                    ? (createOrderMutation.isPending ? 'Placing order...' : 'Place cash on delivery order')
                    : usingSavedCard && selectedSaved
                      ? (createOrderMutation.isPending || isProcessingPayment ? 'Paying…' : `Pay with ${savedCardLabel(selectedSaved)}`)
                    : paymentMethod === 'paypal' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay'
                      ? 'Continue to PayPal'
                    : isProcessingPayment ? 'Initializing Payment...' : createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                </button>
                <div className="mt-5 rounded-2xl bg-[#FBF9F5] p-4 ring-1 ring-stone-200">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">A promise worth the brand</p>
                      <p className="text-sm text-stone-600 mt-1">Same-day Queens, PayPal-secured, and a human on the phone 24/7.</p>
                      <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
                        <li className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-[#1E3A8A]" /> 365-day returns on unused items</li>
                        <li className="flex items-center gap-2"><Headphones className="w-4 h-4 text-[#1E3A8A]" /> Call 24/7 · (800) 259-2605</li>
                      </ul>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
      </div>
    </>
  );
};

export default Checkout;
