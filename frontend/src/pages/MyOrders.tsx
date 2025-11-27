import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderService } from '@/services/orders';
import { Package, Truck, CheckCircle, Clock, XCircle, Eye, ChevronRight } from 'lucide-react';

// Helper function to extract order ID as string
const extractOrderId = (id: any): string => {
  if (!id) {
    console.warn('extractOrderId: id is null or undefined');
    return '';
  }
  
  // If already a string, return it (trimmed)
  if (typeof id === 'string') {
    const trimmed = id.trim();
    if (trimmed && trimmed !== '[object Object]' && trimmed.length === 24) {
      return trimmed;
    }
  }
  
  // If it's an object
  if (typeof id === 'object' && id !== null) {
    // Try toString() method first (for ObjectId) - this should work for most cases
    if (typeof id.toString === 'function') {
      try {
        const str = id.toString();
        if (str && str !== '[object Object]' && str.length === 24) {
          // MongoDB ObjectId is 24 characters
          return str;
        }
      } catch (e) {
        console.warn('extractOrderId: toString() failed', e);
      }
    }
    
    // Handle MongoDB ObjectId with buffer property (browser-safe)
    if (id.buffer && typeof id.buffer === 'object') {
      // Try to get hex string from buffer.data array
      if (id.buffer.data && Array.isArray(id.buffer.data)) {
        try {
          const hexString = id.buffer.data
            .filter((b: any): b is number => typeof b === 'number')
            .map((b: number) => {
              const hex = b.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');
          if (hexString && hexString.length === 24) {
            return hexString;
          }
        } catch (e) {
          console.warn('extractOrderId: buffer.data conversion failed', e);
        }
      }
      
      // Try buffer as array-like object (check for length property)
      if (id.buffer.length !== undefined) {
        try {
          const bufferArray = Array.from(id.buffer as ArrayLike<number>);
          const hexString = bufferArray
            .filter((b: any): b is number => typeof b === 'number')
            .map((b: number) => {
              const hex = b.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');
          if (hexString && hexString.length === 24) {
            return hexString;
          }
        } catch (e) {
          console.warn('extractOrderId: buffer array conversion failed', e);
        }
      }
      
      // Try buffer as Uint8Array
      if (id.buffer instanceof Uint8Array) {
        try {
          const hexString = Array.from(id.buffer)
            .filter((b: any): b is number => typeof b === 'number')
            .map((b: number) => {
              const hex = b.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');
          if (hexString && hexString.length === 24) {
            return hexString;
          }
        } catch (e) {
          console.warn('extractOrderId: Uint8Array conversion failed', e);
        }
      }
      
      // Try to access buffer properties directly (for serialized ObjectId)
      if (id.buffer.type === 'Buffer' && Array.isArray(id.buffer.data)) {
        try {
          const hexString = id.buffer.data
            .filter((b: any): b is number => typeof b === 'number')
            .map((b: number) => {
              const hex = b.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');
          if (hexString && hexString.length === 24) {
            return hexString;
          }
        } catch (e) {
          console.warn('extractOrderId: Buffer type conversion failed', e);
        }
      }
    }
    
    // Try _id property (nested object)
    if (id._id) {
      const nestedId = extractOrderId(id._id);
      if (nestedId) return nestedId;
    }
    
    // Try id property
    if (id.id) {
      const nestedId = extractOrderId(id.id);
      if (nestedId) return nestedId;
    }
    
    // Try valueOf() method
    if (typeof id.valueOf === 'function') {
      try {
        const value = id.valueOf();
        if (typeof value === 'string' && value !== '[object Object]' && value.length === 24) {
          return value;
        }
      } catch (e) {
        console.warn('extractOrderId: valueOf() failed', e);
      }
    }
  }
  
  // Last resort: try String() conversion
  const str = String(id);
  if (str === '[object Object]' || str === 'null' || str === 'undefined') {
    console.error('extractOrderId: Failed to extract valid ID from:', id);
    return '';
  }
  
  // If string conversion worked but it's not 24 chars, still return it
  // (might be a different ID format)
  return str;
};

const MyOrders = () => {
  const [page, setPage] = useState(1);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['myOrders', page],
    queryFn: () => orderService.getMyOrders(page, 10)
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'processing':
        return <Package className="text-blue-600" size={20} />;
      case 'shipped':
        return <Truck className="text-purple-600" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return 25;
      case 'processing':
        return 50;
      case 'shipped':
        return 75;
      case 'delivered':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : ordersData?.data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <Link
              to="/products"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {ordersData?.data.map((order: any) => {
              // Ensure we have a valid order ID for the key
              const orderId = extractOrderId(order._id);
              if (!orderId) {
                console.error('MyOrders: Invalid order ID:', order._id);
                return null;
              }
              
              return (
              <div key={orderId} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Order Number</p>
                        <p className="font-bold">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-bold text-primary-600">${order.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <Link
                      to={`/orders/${orderId}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Eye size={18} />
                      View Details
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>

                {/* Order Status */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.orderStatus)}
                      <div>
                        <p className="font-semibold capitalize">{order.orderStatus}</p>
                        <p className="text-sm text-gray-600">
                          {order.orderStatus === 'delivered' && order.deliveredAt
                            ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}`
                            : order.orderStatus === 'shipped' && order.trackingNumber
                            ? `Tracking: ${order.trackingNumber}`
                            : 'Order is being processed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {order.orderStatus !== 'cancelled' && (
                    <div className="mb-6">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getStatusProgress(order.orderStatus)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span className={order.orderStatus === 'pending' ? 'font-semibold text-primary-600' : ''}>
                          Order Placed
                        </span>
                        <span className={order.orderStatus === 'processing' ? 'font-semibold text-primary-600' : ''}>
                          Processing
                        </span>
                        <span className={order.orderStatus === 'shipped' ? 'font-semibold text-primary-600' : ''}>
                          Shipped
                        </span>
                        <span className={order.orderStatus === 'delivered' ? 'font-semibold text-primary-600' : ''}>
                          Delivered
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items.slice(0, 2).map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-gray-500">
                              {item.variant.size || item.variant.weight}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-600 text-center py-2">
                        + {order.items.length - 2} more item(s)
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Pagination */}
            {ordersData && ordersData.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 flex items-center">
                  Page {page} of {ordersData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === ordersData.pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

