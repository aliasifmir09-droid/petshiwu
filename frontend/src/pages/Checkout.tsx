import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orders';
import { productService } from '@/services/products';
import { addressService } from '@/services/addresses';
import { Address } from '@/types';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import CheckoutDonationModal from '@/components/CheckoutDonationModal';
import PaymentForm from '@/components/PaymentForm';
import PayPalButton from '@/components/PayPalButton';
import { getStripe } from '@/utils/stripe';
import { normalizeId } from '@/utils/idNormalizer';
import { trackPurchase } from '@/utils/analytics';
import { MapPin, Plus, Check } from 'lucide-react';

interface CreateOrderData {
  items: Array<{
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    variant?: {
      size?: string;
      weight?: string;
      sku: string;
    };
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
}

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

  // Fetch saved addresses if user is logged in
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
  const [pendingOrderData, setPendingOrderData] = useState<CreateOrderData | null>(null);
  const [orderNotes, setOrderNotes] = useState('');

  // Set default address when addresses are loaded
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
      if (defaultAddress) {
        handleSelectAddress(defaultAddress);
      }
    }
  }, [savedAddresses]);

  // Update shipping info when user changes
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

  // Handle address selection
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

  // Save address if requested (called before order submission)
  const saveAddressIfNeeded = async () => {
    if (saveNewAddress && isAuthenticated && showNewAddressForm) {
      if (!shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
        return; // Address validation will happen in form submission
      }

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
        console.error('Failed to save address:', error);
        // Don't block order submission if address save fails
      }
    }
  };

  // Function to refresh product data from API
  const refreshCartProducts = async () => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          // Try to get a valid product ID
          let productId = normalizeId(item.product._id);
          
          // If we can't normalize it, try to extract from product object
          if (!productId) {
            // Try to find the ID in the product object itself
            const possibleIdFields = ['_id', 'id', '$oid', 'oid'];
            for (const field of possibleIdFields) {
              const value = (item.product as any)[field];
              if (value) {
                productId = normalizeId(value);
                if (productId) break;
              }
            }
          }
          
          if (!productId) {
            console.error('Cannot extract product ID for:', item.product);
            return item; // Return original item if we can't get ID
          }
          
          // Fetch fresh product data from API
          try {
            const freshProduct = await productService.getProduct(productId);
            return {
              ...item,
              product: freshProduct
            };
          } catch (error) {
            // Don't log errors with product data - privacy concern
            if (import.meta.env.DEV) {
              console.error('Failed to refresh product:', productId);
            }
            return item; // Return original item if fetch fails
          }
        })
      );
      
      // Update cart with refreshed products
      const { setItems } = useCartStore.getState();
      setItems(updatedItems);
      
      // Products refreshed silently
    } catch (error) {
      // Don't log errors with cart data - privacy concern
      if (import.meta.env.DEV) {
        console.error('Error refreshing cart products');
      }
      showToast('Failed to refresh cart products', 'error');
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 49 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax + donationAmount;

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async (order) => {
      clearCart();
      // Ensure order ID is a string
      const orderId = String(order._id || '');
      
      // Track purchase
      const purchaseItems = items.map((item: any) => ({
        item_id: normalizeId(item.product._id) || String(item.product._id),
        item_name: item.product.name,
        price: item.variant?.price || item.product.basePrice,
        quantity: item.quantity,
      }));
      trackPurchase(orderId, total, purchaseItems);
      
      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['order'] });
      
      navigate(`/orders/${orderId}?newOrder=true`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      const errorDetails = error.response?.data?.errors;
      
      if (errorDetails && Array.isArray(errorDetails)) {
        const detailedMessage = `${errorMessage}\n${errorDetails.map((e: any) => e.message || e).join('\n')}`;
        showToast(detailedMessage, 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    }
  });

  // Create payment intent when payment method changes to non-COD (but not PayPal)
  useEffect(() => {
    const createPaymentIntent = async () => {
      // PayPal doesn't use Stripe payment intents - it has its own flow
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
            setPaymentMethod('cod'); // Fallback to COD
          }
        } catch (error: any) {
          console.error('Payment intent error:', error);
          showToast(
            error.response?.data?.message || 'Payment initialization failed. Please use Cash on Delivery.',
            'error'
          );
          setPaymentMethod('cod'); // Fallback to COD
        } finally {
          setIsProcessingPayment(false);
        }
      } else if (paymentMethod === 'cod') {
        // Reset payment form when switching to COD
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

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    // For online payments, payment must be completed first
    if (paymentMethod !== 'cod' && paymentMethod !== 'paypal' && !paymentIntentId) {
      showToast('Please complete the payment first.', 'error');
      return;
    }

    // For PayPal, order ID must be present
    if (paymentMethod === 'paypal' && !paypalOrderId) {
      showToast('Please complete the PayPal payment first.', 'error');
      return;
    }

    // For COD, proceed directly. For online payments, payment should already be completed
    if (paymentMethod === 'cod') {
      await prepareAndSubmitOrder();
    } else if (paymentMethod === 'paypal') {
      // PayPal payment already completed
      if (paypalOrderId) {
        await prepareAndSubmitOrder(undefined, paypalOrderId);
      }
    } else {
      // For Stripe payments, if payment is already completed, proceed
      if (paymentIntentId) {
        await prepareAndSubmitOrder(paymentIntentId);
      } else {
        // If payment not completed, show payment form
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
    
    // Proceed with order creation
    if (pendingOrderData) {
      const updatedOrderData: CreateOrderData = {
        ...pendingOrderData,
        paymentIntentId: confirmedPaymentIntentId
      };
      createOrderMutation.mutate(updatedOrderData);
      setPendingOrderData(null);
    } else {
      // If no pending order data, prepare it now
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
    
    // Proceed with order creation
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
    // Save address if user requested it
    await saveAddressIfNeeded();
    
    // Get current items (may be refreshed)
    let currentItems = items;
    
    // Validate all items have product IDs
    const itemsWithoutIds = currentItems.filter((item: any) => {
      const id = normalizeId(item.product._id);
      return !id || !/^[0-9a-fA-F]{24}$/.test(id);
    });
    
    if (itemsWithoutIds.length > 0) {
      // Try to auto-refresh products
      showToast('Refreshing cart items...', 'info');
      await refreshCartProducts();
      
      // Get refreshed items
      currentItems = useCartStore.getState().items;
      
      // Re-check after refresh
      const stillInvalid = currentItems.filter((item: any) => {
        const id = normalizeId(item.product._id);
        return !id || !/^[0-9a-fA-F]{24}$/.test(id);
      });
      
      if (stillInvalid.length > 0) {
        showToast('Some products still have invalid IDs. Please remove them from cart and add again.', 'error');
        return;
      }
    }

    // Prepare order data
    const orderData: CreateOrderData = {
      items: currentItems.map((item: any) => {
        const productId = normalizeId(item.product._id);
        
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
          throw new Error(`Invalid product ID for item: ${item.product.name}. Please remove this item from cart and add it again.`);
        }
        
        return {
          product: productId,
          name: item.product.name,
          image: normalizeImageUrl(item.product.images?.[0]),
          price: item.variant?.price || item.product.basePrice,
          quantity: item.quantity,
          variant: item.variant ? {
            size: item.variant.size,
            weight: item.variant.weight,
            sku: item.variant.sku
          } : undefined
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
      notes: orderNotes.trim() || undefined
    };

    // Show donation modal before submitting
    setPendingOrderData(orderData);
    setShowDonationModal(true);
  };

  const handleDonationConfirm = (amount: number) => {
    setDonationAmount(amount);
    setShowDonationModal(false);
    
    // Update order data with donation
    if (pendingOrderData) {
      const updatedOrderData: CreateOrderData = {
        ...pendingOrderData,
        donationAmount: amount > 0 ? amount : undefined,
        totalPrice: subtotal + shipping + tax + amount
      };
      createOrderMutation.mutate(updatedOrderData);
      setPendingOrderData(null);
    }
  };

  const handleDonationSkip = () => {
    setShowDonationModal(false);
    // Submit order without donation
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
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

              {/* User Info - Only show if logged in */}
              {isAuthenticated && user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Shipping to:</p>
                  <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                </div>
              )}

              {/* Name and Email - Only show if NOT logged in */}
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
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

              {/* Phone - Always show (even if logged in) */}
              {isAuthenticated && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Saved Addresses - Only show if logged in and has addresses */}
              {isAuthenticated && savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Select Address</label>
                  <div className="space-y-3">
                    {savedAddresses.map((address) => (
                      <button
                        key={address._id}
                        type="button"
                        onClick={() => handleSelectAddress(address)}
                        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                          selectedAddressId === address._id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            selectedAddressId === address._id
                              ? 'bg-primary-600'
                              : 'border-2 border-gray-400'
                          }`}>
                            {selectedAddressId === address._id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              {address.isDefault && (
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Default</span>
                              )}
                            </div>
                            <p className="font-medium text-gray-900">{address.street}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setSelectedAddressId(null);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Address</span>
                  </button>
                </div>
              )}

              {/* Address Form - Show if no saved addresses, or if "Add New" clicked, or if not logged in */}
              {(showNewAddressForm || savedAddresses.length === 0 || !isAuthenticated) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.street}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Country *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.country}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Save address checkbox - Only show if logged in and adding new address */}
                  {isAuthenticated && showNewAddressForm && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="saveAddress" className="text-sm text-gray-700">
                        Save this address to my account
                      </label>
                    </div>
                  )}

                  {/* Cancel button - Only show if logged in and has saved addresses */}
                  {isAuthenticated && savedAddresses.length > 0 && showNewAddressForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        if (savedAddresses.length > 0) {
                          const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
                          if (defaultAddress) {
                            handleSelectAddress(defaultAddress);
                          }
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    paymentMethod === 'cod' ? 'bg-primary-600' : 'border-2 border-gray-400'
                  }`}>
                    {paymentMethod === 'cod' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
                    <p className="text-sm text-gray-600 mt-1">Pay with cash when your order is delivered</p>
                  </div>
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    paymentMethod === 'credit_card' ? 'bg-primary-600' : 'border-2 border-gray-400'
                  }`}>
                    {paymentMethod === 'credit_card' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-gray-900">Credit/Debit Card</span>
                    <p className="text-sm text-gray-600 mt-1">Pay securely with your card</p>
                  </div>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    paymentMethod === 'paypal' ? 'bg-primary-600' : 'border-2 border-gray-400'
                  }`}>
                    {paymentMethod === 'paypal' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-gray-900">PayPal</span>
                    <p className="text-sm text-gray-600 mt-1">Pay with your PayPal account</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'cod' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💵 Cash on Delivery:</span> Please keep exact change ready. Our delivery partner will collect the payment when your order arrives.
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

            {/* Payment Form - Show when payment method is selected and client secret is ready */}
            {showPaymentForm && clientSecret && paymentMethod !== 'cod' && paymentMethod !== 'paypal' && (
              <Elements stripe={getStripe()} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={total}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )}

            {/* PayPal Button - Show when PayPal is selected */}
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
                <PayPalButton
                  amount={total}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                  onCancel={handlePayPalCancel}
                />
              </div>
            )}

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Special Instructions (Optional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any special delivery instructions or notes for your order..."
                rows={4}
                maxLength={500}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
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
                      <img
                        src={normalizeImageUrl(item.product.images?.[0])}
                        alt={item.product.name}
                        onError={(e) => handleImageError(e, item.product.name)}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-600">
                            {item.variant.size || item.variant.weight}
                          </p>
                        )}
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
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {donationAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <span>💝 Donation</span>
                    </span>
                    <span className="font-medium text-pink-600">${donationAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrderMutation.isPending || isProcessingPayment}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {isProcessingPayment ? 'Initializing Payment...' : createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Donation Modal */}
      <CheckoutDonationModal
        isOpen={showDonationModal}
        onClose={handleDonationSkip}
        onConfirm={handleDonationConfirm}
      />

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default Checkout;



