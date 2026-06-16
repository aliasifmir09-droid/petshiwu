import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orders';
import { productService } from '@/services/products';
import { addressService } from '@/services/addresses';
import paymentMethodService from '@/services/paymentMethods';
import { Address } from '@/types';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import CheckoutDonationModal from '@/components/CheckoutDonationModal';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
const getStripe = () => import('@/utils/stripe').then(m => m.getStripe());
import { normalizeId } from '@/utils/idNormalizer';
import { trackPurchase } from '@/utils/analytics';
import SEO from '@/components/SEO';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MapPin, Plus, Check, User, UserCheck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST, TAX_RATE } from '@/config/constants';

const PaymentForm = lazy(() => import('@/components/PaymentForm'));
const PayPalButton = lazy(() => import('@/components/PayPalButton'));

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
  paypalOrderId?: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  totalPrice: number;
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
  const [saveNewAddress, setSaveNewAddress] = useState(false);

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

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod'>('cod');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPayPalButton, setShowPayPalButton] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [pendingOrderData, setPendingOrderData] = useState<CreateOrderData | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedSavedPaymentMethod, setSelectedSavedPaymentMethod] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  const { data: savedPaymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await paymentMethodService.getPaymentMethods();
      return response.data || [];
    },
    enabled: isAuthenticated,
    retry: 1
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('quick') === 'true') {
      if (savedPaymentMethods.length > 0) {
        const defaultMethod = savedPaymentMethods.find((pm: any) => pm.isDefault) || savedPaymentMethods[0];
        if (defaultMethod) {
          setSelectedSavedPaymentMethod(defaultMethod._id);
          setPaymentMethod(defaultMethod.type);
        }
      }
    }
  }, [savedPaymentMethods]);

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
    if (saveNewAddress && isAuthenticated && showNewAddressForm) {
      if (!shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) return;
      try {
        await addressService.createAddress({
          street: shippingInfo.street,
          city: shippingInfo.city,
          state: shippingInfo.state,
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
  const total = Math.max(0, subtotal + shipping + tax + donationAmount - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/v1/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCode(couponInput.trim().toUpperCase());
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

  const handleRemoveCoupon = () => {
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
      const orderId = String(order._id || '');
      const purchaseItems = items.map((item: any) => ({
        item_id: normalizeId(item.product._id) || String(item.product._id),
        item_name: item.product.name,
        price: item.variant?.price || item.product.basePrice,
        quantity: item.quantity,
      }));
      trackPurchase(orderId, total, purchaseItems);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['order'] });
      // For guests, navigate to track order page instead of my orders
      if (!isAuthenticated) {
        navigate(`/track-order?order=${order.orderNumber || orderId}`);
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
    const createPaymentIntent = async () => {
      if (paymentMethod === 'paypal') {
        setShowPayPalButton(true);
        setShowPaymentForm(false);
        setClientSecret(null);
        setPaymentIntentId(null);
        return;
      }
      if (paymentMethod !== 'cod' && !clientSecret && !isProcessingPayment) {
        setIsProcessingPayment(true);
        try {
          const paymentIntentResponse = await orderService.createPaymentIntent({
            totalPrice: total,
            paymentMethod: paymentMethod
          });
          if (paymentIntentResponse.success && paymentIntentResponse.data?.clientSecret) {
            setClientSecret(paymentIntentResponse.data.clientSecret);
            setPaymentIntentId(paymentIntentResponse.data.paymentIntentId);
            setShowPaymentForm(true);
            setShowPayPalButton(false);
          } else {
            showToast('Failed to initialize payment. Please try again or use Cash on Delivery.', 'error');
            setPaymentMethod('cod');
          }
        } catch (error: any) {
          showToast(error.response?.data?.message || 'Payment initialization failed. Please use Cash on Delivery.', 'error');
          setPaymentMethod('cod');
        } finally {
          setIsProcessingPayment(false);
        }
      } else if (paymentMethod === 'cod') {
        setShowPaymentForm(false);
        setShowPayPalButton(false);
        setClientSecret(null);
        setPaymentIntentId(null);
        setPaypalOrderId(null);
      }
    };
    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

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

    // NYC-only delivery check
    const _zip = shippingInfo.zipCode.trim().replace(/[^0-9]/g, '').substring(0, 5);
    const _isNY = shippingInfo.state.trim().toUpperCase() === 'NY';
    const _isNYC =
      (_zip >= '10001' && _zip <= '10282') ||
      (_zip >= '10301' && _zip <= '10314') ||
      (_zip >= '10451' && _zip <= '10475') ||
      (_zip >= '11201' && _zip <= '11697');
    if (!_isNY || !_isNYC) {
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

    if (paymentMethod !== 'cod' && paymentMethod !== 'paypal' && !paymentIntentId) {
      showToast('Please complete the payment first.', 'error');
      return;
    }
    if (paymentMethod === 'paypal' && !paypalOrderId) {
      showToast('Please complete the PayPal payment first.', 'error');
      return;
    }

    if (paymentMethod === 'cod') {
      await prepareAndSubmitOrder();
    } else if (paymentMethod === 'paypal') {
      if (paypalOrderId) await prepareAndSubmitOrder(undefined, paypalOrderId);
    } else {
      if (paymentIntentId) {
        await prepareAndSubmitOrder(paymentIntentId);
      } else {
        if (!showPaymentForm && clientSecret) {
          setShowPaymentForm(true);
        } else if (!clientSecret) {
          showToast('Please wait for payment initialization...', 'info');
        }
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
    setPaymentMethod('cod');
  };

  const handlePayPalSuccess = async (orderId: string, _payerId?: string) => {
    setPaypalOrderId(orderId);
    setShowPayPalButton(false);
    await prepareAndSubmitOrder(undefined, orderId);
  };

  const handlePayPalError = (error: string) => {
    showToast(error, 'error');
    setIsProcessingPayment(false);
  };

  const handlePayPalCancel = () => {
    setShowPayPalButton(false);
    setPaypalOrderId(null);
    setPaymentMethod('cod');
  };

  const prepareAndSubmitOrder = async (confirmedPaymentIntentId?: string, paypalOrderIdParam?: string) => {
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
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
        phone: shippingInfo.phone
      },
      paymentMethod,
      paymentIntentId: confirmedPaymentIntentId || paymentIntentId || undefined,
      paypalOrderId: paypalOrderIdParam || paypalOrderId || undefined,
      itemsPrice: subtotal,
      shippingPrice: shipping,
      taxPrice: tax,
      donationAmount: donationAmount > 0 ? donationAmount : undefined,
      totalPrice: subtotal + shipping + tax + donationAmount,
      notes: orderNotes.trim() || undefined,
      // GUEST CHECKOUT: include guest email
      ...(!isAuthenticated && shippingInfo.email ? { guestEmail: shippingInfo.email } : {})
    };

    setPendingOrderData(orderData);
    setShowDonationModal(true);
  };

  const handleDonationConfirm = (amount: number) => {
    setDonationAmount(amount);
    setShowDonationModal(false);
    if (pendingOrderData) {
      createOrderMutation.mutate({
        ...pendingOrderData,
        donationAmount: amount > 0 ? amount : undefined,
        totalPrice: subtotal + shipping + tax + amount
      });
      setPendingOrderData(null);
    }
  };

  const handleDonationSkip = () => {
    setShowDonationModal(false);
    if (pendingOrderData) {
      createOrderMutation.mutate(pendingOrderData);
      setPendingOrderData(null);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <>
      <SEO title="Checkout | petshiwu" description="Complete your purchase at petshiwu" noindex={true} />
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* GUEST CHECKOUT BANNER — show only when not logged in */}
        {!isAuthenticated && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <User className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">Checking out as guest</p>
              <p className="text-sm text-blue-700 mt-1">
                Already have an account?{' '}
                <Link to="/login?redirect=/checkout" className="font-semibold underline hover:text-blue-900">
                  Sign in
                </Link>{' '}
                for faster checkout and order tracking. Or continue below as a guest.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${emailError ? 'border-red-500 ring-2 ring-red-300 bg-red-50' : 'border-gray-300'}`}
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input type="text" required value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                )}

                {/* Phone for logged-in users */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <input type="tel" required value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <input type="text" required value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State *</label>
                        <input type="text" required value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                        <input type="text" required value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Country *</label>
                        <input type="text" required value={shippingInfo.country}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>
                    {isAuthenticated && showNewAddressForm && (
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
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                {isAuthenticated && savedPaymentMethods.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">Saved Payment Methods</label>
                    <div className="space-y-3">
                      {savedPaymentMethods.map((pm: any) => (
                        <button key={pm._id} type="button"
                          onClick={() => { setSelectedSavedPaymentMethod(pm._id); setPaymentMethod(pm.type); }}
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
                                  {pm.expiryMonth && pm.expiryYear && ` • Expires ${pm.expiryMonth}/${pm.expiryYear}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600"><span>Or use a new payment method below</span></div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <button type="button" onClick={() => setPaymentMethod('cod')}
                    className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-primary-600' : 'border-2 border-gray-400'}`}>
                      {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
                      <p className="text-sm text-gray-600 mt-1">Pay with cash when your order is delivered</p>
                    </div>
                  </button>

                  {/* Credit Card */}
                  {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
                    <button type="button" onClick={() => setPaymentMethod('credit_card')}
                      className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${paymentMethod === 'credit_card' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${paymentMethod === 'credit_card' ? 'bg-primary-600' : 'border-2 border-gray-400'}`}>
                        {paymentMethod === 'credit_card' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-900">Credit/Debit Card</span>
                        <p className="text-sm text-gray-600 mt-1">Pay securely with your card</p>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-500">Credit/Debit Card</span>
                        <p className="text-sm text-gray-400 mt-1">Coming soon — use Cash on Delivery for now</p>
                      </div>
                    </div>
                  )}

                  {/* PayPal */}
                  {import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
                    <button type="button" onClick={() => setPaymentMethod('paypal')}
                      className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${paymentMethod === 'paypal' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${paymentMethod === 'paypal' ? 'bg-primary-600' : 'border-2 border-gray-400'}`}>
                        {paymentMethod === 'paypal' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-900">PayPal</span>
                        <p className="text-sm text-gray-600 mt-1">Pay with your PayPal account</p>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-500">PayPal</span>
                        <p className="text-sm text-gray-400 mt-1">Coming soon — use Cash on Delivery for now</p>
                      </div>
                    </div>
                  )}
                </div>

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

                {paymentMethod === 'cod' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">💵 Cash on Delivery:</span> Please keep exact change ready. Our delivery partner will collect payment when your order arrives.
                    </p>
                  </div>
                )}

                {paymentMethod !== 'cod' && isProcessingPayment && !clientSecret && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">⏳ Initializing payment...</span> Please wait while we set up your secure payment.
                    </p>
                  </div>
                )}
              </div>

              {/* Stripe Payment Form */}
              {showPaymentForm && clientSecret && paymentMethod !== 'cod' && paymentMethod !== 'paypal' && (
                <StripePaymentWrapper clientSecret={clientSecret} total={total}
                  onSuccess={handlePaymentSuccess} onError={handlePaymentError} onCancel={handlePaymentCancel} />
              )}

              {/* PayPal Button */}
              {showPayPalButton && paymentMethod === 'paypal' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">PP</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">PayPal Payment</h3>
                      <p className="text-sm text-gray-600">Pay securely with your PayPal account</p>
                    </div>
                  </div>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="md" />
                      <span className="ml-3 text-gray-600">Loading PayPal...</span>
                    </div>
                  }>
                    <PayPalButton amount={total} onSuccess={handlePayPalSuccess}
                      onError={handlePayPalError} onCancel={handlePayPalCancel} />
                  </Suspense>
                </div>
              )}

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Special Instructions (Optional)</h2>
                <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special delivery instructions or notes for your order..."
                  rows={4} maxLength={500}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-500 mt-2">{orderNotes.length}/500 characters</p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    const price = item.variant?.price || item.product.basePrice;
                    return (
                      <div key={`${item.product._id}-${item.variant?.sku}`} className="flex gap-3">
                        <img src={normalizeImageUrl(item.product.images?.[0])} alt={item.product.name}
                          onError={(e) => handleImageError(e, item.product.name)}
                          className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          {item.variant && <p className="text-xs text-gray-600">{item.variant.size || item.variant.weight}</p>}
                        </div>
                        <p className="font-medium">${(price * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-3 border-t pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? <span className="text-green-600">FREE</span> : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  {donationAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 flex items-center gap-1"><span>💝 Donation</span></span>
                      <span className="font-medium text-pink-600">${donationAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">🏷️ Coupon ({couponCode})</span>
                      <span className="font-medium">-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {/* Coupon Code Input */}
                  <div className="pt-2">
                    {!couponCode ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                          placeholder="Coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-green-700 text-sm font-medium">🏷️ {couponCode} applied</span>
                        <button type="button" onClick={handleRemoveCoupon} className="text-gray-400 hover:text-gray-600 text-xs ml-2">Remove</button>
                      </div>
                    )}
                    {couponMessage && (
                      <p className={`text-xs mt-1 ${couponValid ? 'text-green-600' : 'text-red-500'}`}>{couponMessage}</p>
                    )}
                  </div>
                </div>
                <button type="submit"
                  disabled={createOrderMutation.isPending || isProcessingPayment}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50">
                  {isProcessingPayment ? 'Initializing Payment...' : createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                </button>
                {/* Trust badges */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span>🔒 Secure Checkout</span>
                  <span>✅ SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <CheckoutDonationModal isOpen={showDonationModal} onClose={handleDonationSkip} onConfirm={handleDonationConfirm} />
        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </>
  );
};

export default Checkout;
