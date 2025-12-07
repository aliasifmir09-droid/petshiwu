import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orders';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

const CreateReturn = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId
  });

  const [selectedItems, setSelectedItems] = useState<Record<number, { quantity: number; reason: string }>>({});

  const createReturnMutation = useMutation({
    mutationFn: (data: any) => orderService.createReturn(orderId!, data.items, data.returnAddress),
    onSuccess: () => {
      showToast('Return request submitted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['myReturns'] });
      navigate('/returns');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to submit return request', 'error');
    }
  });

  const handleItemToggle = (index: number) => {
    setSelectedItems(prev => {
      if (prev[index]) {
        const { [index]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [index]: { quantity: 1, reason: '' }
      };
    });
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const maxQuantity = order?.items[index]?.quantity || 0;
    if (quantity > maxQuantity) return;
    setSelectedItems(prev => ({
      ...prev,
      [index]: { ...prev[index], quantity: Math.max(1, quantity) }
    }));
  };

  const handleReasonChange = (index: number, reason: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: { ...prev[index], reason }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = Object.entries(selectedItems).map(([index, data]) => ({
      orderItemIndex: parseInt(index),
      quantity: data.quantity,
      reason: data.reason
    }));

    if (items.length === 0) {
      showToast('Please select at least one item to return', 'error');
      return;
    }

    if (items.some(item => !item.reason.trim())) {
      showToast('Please provide a reason for all selected items', 'error');
      return;
    }

    createReturnMutation.mutate({ items });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load order details"
          retry={() => queryClient.invalidateQueries({ queryKey: ['order', orderId] })}
        />
      </div>
    );
  }

  // Check if order is eligible for return (delivered within 30 days)
  const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const daysSinceDelivery = deliveryDate
    ? Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const canReturn = deliveryDate && daysSinceDelivery !== null && daysSinceDelivery <= 30;

  if (!canReturn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Return Window Expired</h2>
          <p className="text-gray-600 mb-6">
            Returns must be requested within 30 days of delivery.
            {deliveryDate && (
              <span className="block mt-2">
                This order was delivered on {deliveryDate.toLocaleDateString()} ({daysSinceDelivery} days ago).
              </span>
            )}
          </p>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            Back to Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Request Return</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Return Policy:</strong> You have {30 - (daysSinceDelivery || 0)} days remaining to return items from this order.
            Items must be in original condition with tags attached.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Select Items to Return</h2>
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => {
              const isSelected = !!selectedItems[index];
              const selectedData = selectedItems[index];

              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${
                    isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemToggle(index)}
                      className="mt-1 w-5 h-5"
                    />
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity ordered: {item.quantity} | Price: ${item.price.toFixed(2)} each
                      </p>
                      {isSelected && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Return Quantity (max: {item.quantity})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedData.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Reason for Return *</label>
                            <select
                              value={selectedData.reason}
                              onChange={(e) => handleReasonChange(index, e.target.value)}
                              required
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            >
                              <option value="">Select a reason</option>
                              <option value="defective">Defective/Damaged</option>
                              <option value="wrong_item">Wrong Item Received</option>
                              <option value="not_as_described">Not as Described</option>
                              <option value="changed_mind">Changed Mind</option>
                              <option value="too_large">Too Large</option>
                              <option value="too_small">Too Small</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      {isSelected && (
                        <p className="text-sm text-gray-600">
                          Refund: ${(item.price * selectedData.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={Object.keys(selectedItems).length === 0 || createReturnMutation.isPending}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createReturnMutation.isPending ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default CreateReturn;

