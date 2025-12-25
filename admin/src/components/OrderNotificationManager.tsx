/**
 * Order Notification Manager
 * Manages real-time order notifications and displays popups
 */

import { useState } from 'react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import OrderNotification from './OrderNotification';

const OrderNotificationManager = () => {
  const [currentNotification, setCurrentNotification] = useState<any>(null);

  useOrderNotifications({
    enabled: true,
    onNewOrder: (notification) => {
      setCurrentNotification(notification);
    },
    onOrderUpdate: (notification) => {
      // Optionally show update notifications too
      // setCurrentNotification(notification);
    }
  });

  const handleClose = () => {
    setCurrentNotification(null);
  };

  return (
    <OrderNotification
      notification={currentNotification}
      onClose={handleClose}
    />
  );
};

export default OrderNotificationManager;

