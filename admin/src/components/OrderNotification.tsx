/**
 * Order Notification Component
 * Displays popup notifications for new orders
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Bell } from 'lucide-react';

interface OrderNotification {
  type: 'new_order' | 'order_update';
  order: {
    _id: string;
    orderNumber: string;
    totalPrice: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    user?: any;
    shippingAddress?: any;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
  };
  timestamp: string;
}

interface OrderNotificationProps {
  notification: OrderNotification | null;
  onClose: () => void;
}

const OrderNotification = ({ notification, onClose }: OrderNotificationProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !isVisible) {
    return null;
  }

  const handleViewOrder = () => {
    navigate(`/orders`);
    onClose();
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'Cash on Delivery',
      credit_card: 'Credit Card',
      paypal: 'PayPal',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay'
    };
    return labels[method] || method;
  };

  const totalItems = notification.order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-2xl border-2 border-blue-500 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Bell className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {notification.type === 'new_order' ? 'New Order Received!' : 'Order Updated'}
              </h3>
              <p className="text-sm text-gray-600">Order #{notification.order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-semibold">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-bold text-green-600">${notification.order.totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium">{getPaymentMethodLabel(notification.order.paymentMethod)}</span>
          </div>
          {notification.order.shippingAddress && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Ship to:</span>{' '}
              {notification.order.shippingAddress.firstName} {notification.order.shippingAddress.lastName}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewOrder}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <ShoppingCart size={18} />
          View Order
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-blue-500 animate-shrink"
          style={{
            animation: 'shrink 10s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderNotification;

