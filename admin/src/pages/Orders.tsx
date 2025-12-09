import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Eye, Search, MapPin, X, AlertCircle, CheckCircle, Filter as FilterIcon, Download, RotateCcw } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/ConfirmationModal';
import Dropdown from '@/components/Dropdown';

const Orders = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; status: string } | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => adminService.getAllOrders({ 
      page, 
      limit: 20, 
      status: statusFilter || undefined 
    })
  });

  const getPaymentMethodLabel = (method: string) => {
    const labels: any = {
      cod: 'Cash on Delivery',
      credit_card: 'Credit Card',
      paypal: 'PayPal',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay'
    };
    return labels[method] || method;
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateOrderStatus(id, data),
    onSuccess: () => {
      // Invalidate and refetch all order-related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
      showToast('Order status updated successfully', 'success');
      setShowStatusConfirm(false);
      setPendingStatusChange(null);
    },
    onError: () => {
      showToast('Failed to update order status', 'error');
      setShowStatusConfirm(false);
      setPendingStatusChange(null);
    }
  });

  const handleStatusChange = (orderId: any, newStatus: string) => {
    // Extract order ID - handle both object and string formats
    let id: string = '';
    
    if (typeof orderId === 'string') {
      id = orderId.trim();
    } else if (orderId && typeof orderId === 'object') {
      // Handle ObjectId object
      if (orderId.toString && typeof orderId.toString === 'function') {
        id = orderId.toString().trim();
      } else if (orderId._id) {
        id = String(orderId._id).trim();
      } else if (orderId.id) {
        id = String(orderId.id).trim();
      } else {
        id = String(orderId).trim();
      }
    } else {
      id = String(orderId || '').trim();
    }
    
    // Validate the ID
    if (!id || id === 'undefined' || id === 'null' || id === '[object Object]' || id.length < 10) {
      // Use safe error logging
      import('@/utils/safeLogger').then(({ safeWarn }) => {
        safeWarn('Invalid order ID format', { orderId: orderId?.substring(0, 20) });
      });
      showToast('Invalid order ID', 'error');
      return;
    }
    
    setPendingStatusChange({ orderId: id, status: newStatus });
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      // Ensure orderId is a string before sending
      const orderId = String(pendingStatusChange.orderId || '').trim();
      if (!orderId || orderId === 'undefined' || orderId === 'null' || orderId === '[object Object]') {
        showToast('Invalid order ID', 'error');
        setShowStatusConfirm(false);
        setPendingStatusChange(null);
        return;
      }
      updateStatusMutation.mutate({
        id: orderId,
        data: { orderStatus: pendingStatusChange.status }
      });
    }
  };

  const handlePaymentUpdate = () => {
    // Ensure order ID is a string
    const orderId = String(selectedOrder._id || selectedOrder.id || '').trim();
    if (!orderId || orderId === 'undefined' || orderId === 'null' || orderId === '[object Object]') {
      showToast('Invalid order ID', 'error');
      setShowPaymentConfirm(false);
      return;
    }
    adminService.updatePaymentStatus(orderId, { paymentStatus: 'paid' })
      .then(() => {
        // Invalidate and refetch all order-related queries
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.refetchQueries({ queryKey: ['orders'] });
        setShowDetailsModal(false);
        setShowPaymentConfirm(false);
        showToast('Payment status updated successfully', 'success');
      })
      .catch(() => {
        setShowPaymentConfirm(false);
        showToast('Failed to update payment status', 'error');
      });
  };

  const refundMutation = useMutation({
    mutationFn: ({ orderId, amount, reason }: { orderId: string; amount: number; reason?: string }) =>
      adminService.processRefund(orderId, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
      setShowRefundModal(false);
      setShowDetailsModal(false);
      setRefundAmount('');
      setRefundReason('');
      showToast('Refund processed successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to process refund', 'error');
    }
  });

  const handleRefund = () => {
    if (!selectedOrder) return;
    
    const orderId = String(selectedOrder._id || selectedOrder.id || '').trim();
    if (!orderId || orderId === 'undefined' || orderId === 'null') {
      showToast('Invalid order ID', 'error');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid refund amount', 'error');
      return;
    }

    if (amount > selectedOrder.totalPrice) {
      showToast('Refund amount cannot exceed order total', 'error');
      return;
    }

    refundMutation.mutate({
      orderId,
      amount,
      reason: refundReason.trim() || undefined
    });
  };

  const handleOpenRefundModal = () => {
    if (selectedOrder) {
      setRefundAmount(selectedOrder.totalPrice.toFixed(2));
      setRefundReason('');
      setShowRefundModal(true);
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const exportOrdersMutation = useMutation({
    mutationFn: () => adminService.exportOrders({ status: statusFilter || undefined }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Orders exported successfully', 'success');
    },
    onError: () => {
      showToast('Failed to export orders', 'error');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl animate-fade-in-up">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Orders</h1>
            <p className="text-blue-100 text-lg">Manage customer orders</p>
          </div>
          <button
            onClick={() => exportOrdersMutation.mutate()}
            disabled={exportOrdersMutation.isPending}
            className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Dropdown
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending', description: 'Orders awaiting processing' },
              { value: 'processing', label: 'Processing', description: 'Orders being prepared' },
              { value: 'shipped', label: 'Shipped', description: 'Orders in transit' },
              { value: 'delivered', label: 'Delivered', description: 'Completed orders' },
              { value: 'cancelled', label: 'Cancelled', description: 'Cancelled orders' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            icon={<FilterIcon size={18} />}
            size="md"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : ordersData?.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                ordersData?.data.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.items.length} item(s)
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(String(order._id || order.id || ''), e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ordersData && ordersData.pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {ordersData.pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === ordersData.pagination.pages}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Order Details - {selectedOrder.orderNumber}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Shipping Address */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="text-blue-600" size={20} />
                  Shipping Address
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                    <p className="font-semibold">
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-semibold">{selectedOrder.shippingAddress.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-semibold">{selectedOrder.shippingAddress.street}</p>
                    <p className="font-semibold">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="font-semibold">{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.size || item.variant.weight}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${selectedOrder.itemsPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {selectedOrder.shippingPrice === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `$${selectedOrder.shippingPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${selectedOrder.taxPrice.toFixed(2)}</span>
                  </div>
                  {selectedOrder.donationAmount && selectedOrder.donationAmount > 0 && (
                    <div className="flex justify-between text-pink-600">
                      <span className="flex items-center gap-1">
                        <span>💝 Donation</span>
                      </span>
                      <span className="font-medium">${selectedOrder.donationAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">${selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Payment Method</p>
                      <p className="font-semibold text-sm">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payment Status</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedOrder.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </span>
                    </div>
                    {selectedOrder.paymentIntentId && (
                      <div>
                        <p className="text-xs text-gray-600">Stripe Payment Intent</p>
                        <p className="text-xs font-mono text-gray-800 break-all">{selectedOrder.paymentIntentId}</p>
                      </div>
                    )}
                    {selectedOrder.paypalOrderId && (
                      <div>
                        <p className="text-xs text-gray-600">PayPal Order ID</p>
                        <p className="text-xs font-mono text-gray-800 break-all">{selectedOrder.paypalOrderId}</p>
                      </div>
                    )}
                    {selectedOrder.paidAt && (
                      <div>
                        <p className="text-xs text-gray-600">Paid At</p>
                        <p className="text-xs text-gray-800">
                          {new Date(selectedOrder.paidAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Status</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        selectedOrder.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Order Placed</p>
                      <p className="text-xs text-gray-800">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <p className="text-xs text-gray-600">Tracking Number</p>
                        <p className="text-xs font-mono text-gray-800">{selectedOrder.trackingNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Update Payment Status & Refund */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-bold mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.paymentStatus !== 'paid' && (
                    <button
                      onClick={() => setShowPaymentConfirm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}
                  {selectedOrder.paymentStatus === 'paid' && selectedOrder.paymentMethod !== 'cod' && (
                    <button
                      onClick={handleOpenRefundModal}
                      disabled={refundMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Process Refund
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusConfirm}
        onClose={() => {
          setShowStatusConfirm(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        title="Update Order Status"
        message={`Are you sure you want to update the order status to "${pendingStatusChange?.status}"? This will notify the customer.`}
        confirmText="Update Status"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
        isLoading={updateStatusMutation.isPending}
        icon={
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-blue-600" size={32} />
          </div>
        }
      />

      {/* Payment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        onConfirm={handlePaymentUpdate}
        title="Mark Payment as Paid"
        message="Are you sure you want to mark this payment as paid? This action confirms that the payment has been received."
        confirmText="Mark as Paid"
        cancelText="Cancel"
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        icon={
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={32} />
          </div>
        }
      />

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold">Process Refund</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max={selectedOrder.totalPrice}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ${selectedOrder.totalPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter refund reason..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Refunds will be processed through the original payment method. 
                  Processing may take 5-7 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount('');
                  setRefundReason('');
                }}
                disabled={refundMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refundMutation.isPending || !refundAmount || parseFloat(refundAmount) <= 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refundMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Process Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default Orders;



