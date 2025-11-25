import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orders';
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

  const subtotal = getTotalPrice();
  const shipping = subtotal > 49 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax + donationAmount;

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (order) => {
      clearCart();
      navigate(`/orders/${order._id}?newOrder=true`);
    },
    onError: (error: any) => {
      console.error('Order creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error request data:', error.config?.data);
      
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    // Prepare order data
    const orderData = {
      items: items.map(item => {
        // Convert product._id to string if it's an ObjectId object
        let productId: string | null = null;
        const rawId = item.product._id;
        
        if (!rawId) {
          console.error('Product ID is missing:', item.product);
          throw new Error(`Product ID is missing for item: ${item.product.name}`);
        }
        
        // Handle different types of product IDs
        if (typeof rawId === 'string') {
          productId = rawId;
        } else if (typeof rawId === 'object' && rawId !== null) {
          // Handle ObjectId objects - check for toString method
          if ('toString' in rawId && typeof (rawId as any).toString === 'function') {
            productId = (rawId as any).toString();
          } else if ('_id' in rawId) {
            // Nested object with _id
            productId = String((rawId as any)._id);
          } else {
            // Try to stringify the object
            productId = String(rawId);
          }
        } else {
          productId = String(rawId);
        }
        
        // Validate the product ID is not empty or "[object Object]"
        if (!productId || productId === '[object Object]' || productId.trim() === '') {
          console.error('Invalid product ID conversion:', { 
            productId, 
            rawId, 
            rawIdType: typeof rawId,
            productName: item.product.name,
            product: item.product
          });
          throw new Error(`Invalid product ID for item: ${item.product.name}`);
        }
        
        console.log('Order item prepared:', { 
          productId, 
          productName: item.product.name, 
          originalId: rawId, 
          originalIdType: typeof rawId,
          isValid: productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId)
        });
        
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



