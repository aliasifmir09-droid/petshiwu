/**
 * Hook for real-time order notifications
 * Uses Server-Sent Events (SSE) for real-time updates
 */

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

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

interface UseOrderNotificationsOptions {
  enabled?: boolean;
  onNewOrder?: (notification: OrderNotification) => void;
  onOrderUpdate?: (notification: OrderNotification) => void;
}

export const useOrderNotifications = (options: UseOrderNotificationsOptions = {}) => {
  const { enabled = true, onNewOrder, onOrderUpdate } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds

    const connect = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Get API base URL - handle both relative and absolute URLs
        const apiUrl = api.defaults.baseURL || '/api';
        // Remove /api suffix if present, then add /notifications/orders
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const notificationsUrl = `${baseUrl}/api/notifications/orders`;

        eventSource = new EventSource(notificationsUrl, {
          withCredentials: true // Include cookies for authentication
        });

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          reconnectAttempts = 0; // Reset on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
              // Initial connection message
              return;
            }

            if (data.type === 'new_order') {
              // Invalidate orders query to refetch
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              queryClient.invalidateQueries({ queryKey: ['orderStats'] });
              
              // Call custom handler if provided
              if (onNewOrder) {
                onNewOrder(data as OrderNotification);
              }
            } else if (data.type === 'order_update') {
              // Invalidate orders query to refetch
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              queryClient.invalidateQueries({ queryKey: ['orderStats'] });
              
              // Call custom handler if provided
              if (onOrderUpdate) {
                onOrderUpdate(data as OrderNotification);
              }
            }
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        };

        eventSource.onerror = (error) => {
          setIsConnected(false);
          eventSource?.close();

          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay * reconnectAttempts); // Exponential backoff
          } else {
            console.warn('Max reconnection attempts reached for order notifications');
          }
        };
      } catch (error) {
        console.error('Error setting up SSE connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, queryClient, onNewOrder, onOrderUpdate]);

  return { isConnected };
};

