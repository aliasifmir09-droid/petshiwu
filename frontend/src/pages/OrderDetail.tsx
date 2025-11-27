import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orders';
import ProductReviewForm from '@/components/ProductReviewForm';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import DonationModal from '@/components/DonationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Helper function to extract order ID as string
  const extractOrderId = (id: any): string => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null) {
      // Try toString() method
      if (typeof id.toString === 'function') {
        const str = id.toString();
        if (str && str !== '[object Object]') return str;
      }
      // Try _id property
      if (id._id) return String(id._id);
      // Try id property
      if (id.id) return String(id.id);
    }
    return String(id);
  };

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => {
      // Ensure ID is a string, handle [object Object] case
      const orderId = extractOrderId(id);
      
      if (!orderId || orderId === '[object Object]') {
        throw new Error('Invalid order ID');
      }
      return orderService.getOrder(orderId);
    },
    enabled: !!id && id !== '[object Object]',
    retry: false // Don't retry on error
  });

  // Check if this is a new order and show donation modal
  useEffect(() => {
    const isNewOrder = searchParams.get('newOrder') === 'true';
    if (isNewOrder && order && !isLoading) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowDonationModal(true);
        // Remove the query parameter from URL
        searchParams.delete('newOrder');
        setSearchParams(searchParams, { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [order, isLoading, searchParams, setSearchParams]);

  const cancelOrderMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('Order cancelled successfully', 'success');
      setShowCancelModal(false);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to cancel order', 'error');
      setShowCancelModal(false);
    }
  });

  const handleCancelOrder = () => {
    if (id) {
      cancelOrderMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={24} />;
      case 'processing':
        return <Package className="text-blue-600" size={24} />;
      case 'shipped':
        return <Truck className="text-purple-600" size={24} />;
      case 'delivered':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return <Clock className="text-gray-600" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load order';
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <Link to="/orders" className="text-primary-600 hover:text-primary-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order && !isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/orders" className="text-primary-600 hover:text-primary-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // TypeScript guard: if we reach here, order must be defined
  if (!order) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order {order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="font-bold text-lg capitalize">{order.orderStatus}</span>
              </div>
              
              {/* Cancel Order Button - Only show for pending orders */}
              {order.orderStatus === 'pending' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XCircle size={20} />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="relative">
            <div className="flex justify-between items-center">
              {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.orderStatus) >= index;
                const isCurrent = order.orderStatus === status;

                return (
                  <div key={status} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                        } ${isCurrent ? 'ring-4 ring-primary-200' : ''} z-10 relative`}
                      >
                        {status === 'pending' && <Clock size={20} />}
                        {status === 'processing' && <Package size={20} />}
                        {status === 'shipped' && <Truck size={20} />}
                        {status === 'delivered' && <CheckCircle size={20} />}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </p>
                    </div>
                    {index < 3 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-1 ${
                          isActive && ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.orderStatus) > index
                            ? 'bg-primary-600'
                            : 'bg-gray-300'
                        }`}
                        style={{ zIndex: 0 }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Number */}
          {order.trackingNumber && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tracking Number:</span> {order.trackingNumber}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-6">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="pb-6 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.size || item.variant.weight}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    
                    {/* Review Form for Delivered Orders */}
                    {order.orderStatus === 'delivered' && !item.isReviewed && (
                      <div className="mt-4">
                        <ProductReviewForm
                          productId={item.product}
                          productName={item.name}
                          orderId={order._id}
                        />
                      </div>
                    )}
                    
                    {/* Review Submitted Indicator */}
                    {item.isReviewed && (
                      <div className="mt-3 flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Review submitted</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.itemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.shippingPrice === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${order.shippingPrice.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${order.taxPrice.toFixed(2)}</span>
                </div>
                {order.donationAmount && order.donationAmount > 0 && (
                  <div className="flex justify-between text-pink-600">
                    <span className="flex items-center gap-1">
                      <span>💝 Donation</span>
                    </span>
                    <span className="font-medium">${order.donationAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Payment
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-medium">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
                {order.isPaid && order.paidAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Paid On</p>
                    <p className="font-medium">{new Date(order.paidAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Shipping Address
              </h2>
              <div className="text-sm space-y-1">
                <p className="font-semibold">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Support */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold mb-2">Need Help?</h3>
          <p className="text-sm text-gray-700">
            If you have any questions about your order, please contact our customer support team.
          </p>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />

      {/* Cancel Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone. The items will be returned to stock."
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        onConfirm={handleCancelOrder}
        onClose={() => setShowCancelModal(false)}
        isLoading={cancelOrderMutation.isPending}
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

export default OrderDetail;

