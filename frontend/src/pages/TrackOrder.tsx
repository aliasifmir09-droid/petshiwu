import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orders';
import { Package, Truck, CheckCircle, Clock, XCircle, Search, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['trackOrder', searchOrderId],
    queryFn: () => orderService.trackOrder(searchOrderId),
    enabled: !!searchOrderId,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchOrderId(orderId.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={24} />;
      case 'processing':
        return <Package className="text-blue-600" size={24} />;
      case 'shipped':
        return <Truck className="text-indigo-600" size={24} />;
      case 'delivered':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return <Package className="text-gray-600" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order ID to check the status and tracking information
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="orderId" className="block text-sm font-semibold text-gray-700 mb-2">
                Order ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your order ID"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
            <p className="text-gray-600">Loading order information...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <XCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-4">
              {(error as any)?.response?.data?.message || 'Unable to find an order with that ID. Please check your order ID and try again.'}
            </p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        )}

        {/* Order Details */}
        {order && !isLoading && (
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Order Number</p>
                  <p className="text-2xl font-black">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-sm mb-1">Order Date</p>
                  <p className="text-lg font-semibold">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                {getStatusIcon(order.orderStatus)}
                <div>
                  <p className="text-blue-200 text-sm mb-1">Current Status</p>
                  <p className="text-2xl font-bold capitalize">{order.orderStatus}</p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-4 pt-4 border-t border-blue-400">
                  <p className="text-blue-200 text-sm mb-1">Tracking Number</p>
                  <p className="text-xl font-semibold">{order.trackingNumber}</p>
                </div>
              )}
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>
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
                              isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                            } ${isCurrent ? 'ring-4 ring-blue-200' : ''} z-10 relative`}
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
                                ? 'bg-blue-600'
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
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Items Total:</span>
                  <span className="font-semibold">${order.itemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping:</span>
                  <span className="font-semibold">${order.shippingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax:</span>
                  <span className="font-semibold">${order.taxPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-black text-blue-600">${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className={`rounded-2xl shadow-lg p-6 md:p-8 border-2 ${getStatusColor(order.paymentStatus)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-75 mb-1">Payment Status</p>
                  <p className="text-xl font-bold capitalize">{order.paymentStatus}</p>
                </div>
                {order.paymentStatus === 'paid' && (
                  <CheckCircle size={32} className="opacity-75" />
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-lg p-6 md:p-8 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  to="/orders"
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  View My Orders
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

