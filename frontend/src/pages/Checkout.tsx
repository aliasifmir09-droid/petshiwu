import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orders';
import { productService } from '@/services/products';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import CheckoutDonationModal from '@/components/CheckoutDonationModal';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

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

  const [paymentMethod] = useState<'cod'>('cod');
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Helper function to normalize product ID (same as in cartStore)
  const normalizeId = (id: any): string | null => {
    if (!id) return null;
    if (typeof id === 'string') {
      // Validate it's a MongoDB ObjectId format
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        return id;
      }
      return id; // Return anyway, backend will validate
    }
    if (id && typeof id === 'object') {
      // Try toString() method
      if (typeof id.toString === 'function') {
        const str = id.toString();
        if (str && str !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      // Try common ObjectId properties
      const possibleProps = ['id', '_id', '_str', '$oid', 'oid', 'value', 'hex'];
      for (const prop of possibleProps) {
        if (id[prop] && typeof id[prop] === 'string' && /^[0-9a-fA-F]{24}$/.test(id[prop])) {
          return id[prop];
        }
      }
      // Try valueOf()
      if (typeof id.valueOf === 'function') {
        const value = id.valueOf();
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
          return value;
        }
      }
      // Try JSON.stringify
      try {
        const jsonStr = JSON.stringify(id);
        const parsed = JSON.parse(jsonStr);
        if (parsed.$oid && /^[0-9a-fA-F]{24}$/.test(parsed.$oid)) {
          return parsed.$oid;
        }
        if (parsed.oid && /^[0-9a-fA-F]{24}$/.test(parsed.oid)) {
          return parsed.oid;
        }
        if (typeof parsed === 'string' && /^[0-9a-fA-F]{24}$/.test(parsed)) {
          return parsed;
        }
      } catch (e) {
        // JSON operations failed
      }
      // Check all string properties
      for (const key in id) {
        if (Object.prototype.hasOwnProperty.call(id, key)) {
          const value = id[key];
          if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            return value;
          }
        }
      }
    }
    return null;
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
            console.error('Failed to refresh product:', productId, error);
            return item; // Return original item if fetch fails
          }
        })
      );
      
      // Update cart with refreshed products
      const { setItems } = useCartStore.getState();
      setItems(updatedItems);
      
      // Products refreshed silently
    } catch (error) {
      console.error('Error refreshing cart products:', error);
      showToast('Failed to refresh cart products', 'error');
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 49 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax + donationAmount;

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (order) => {
      clearCart();
      // Ensure order ID is a string
      const orderId = String(order._id || order.id || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

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
      
      // If refresh worked, continue with refreshed items
      // The items will be re-validated in the map function below
    }

    // Prepare order data
    const orderData = {
      items: currentItems.map((item: any) => {
        // Use the normalizeId function which is more reliable
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
      itemsPrice: subtotal,
      shippingPrice: shipping,
      taxPrice: tax,
      donationAmount: donationAmount > 0 ? donationAmount : undefined,
      totalPrice: subtotal + shipping + tax + donationAmount
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
      const updatedOrderData = {
        ...pendingOrderData,
        donationAmount: amount > 0 ? amount : undefined,
        totalPrice: subtotal + shipping + tax + amount
      };
      console.log('Creating order with donation:', updatedOrderData);
      createOrderMutation.mutate(updatedOrderData);
      setPendingOrderData(null);
    }
  };

  const handleDonationSkip = () => {
    setShowDonationModal(false);
    // Submit order without donation
    if (pendingOrderData) {
      console.log('Creating order without donation:', pendingOrderData);
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

              <div className="grid grid-cols-2 gap-4">
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.street}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
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
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 border-2 border-primary-600 bg-primary-50 rounded-lg">
                  <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
                    <p className="text-sm text-gray-600 mt-1">Pay with cash when your order is delivered</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">💵 Cash on Delivery:</span> Please keep exact change ready. Our delivery partner will collect the payment when your order arrives.
                </p>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Online payment methods coming soon!
              </p>
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
                disabled={createOrderMutation.isPending}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
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



