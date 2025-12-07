import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockAlertService } from '@/services/stockAlerts';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { Product } from '@/types';

const StockAlerts = () => {
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => stockAlertService.getMyStockAlerts()
  });

  const deleteMutation = useMutation({
    mutationFn: stockAlertService.deleteStockAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      showToast('Stock alert removed', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove alert', 'error');
    }
  });

  const handleRemoveAlert = (productId: string) => {
    deleteMutation.mutate(productId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Stock Alerts</h1>
        <EmptyState
          icon={Bell}
          title="No Stock Alerts"
          description="You haven't set up any stock alerts yet. Click 'Notify Me' on out-of-stock products to get notified when they're back in stock."
        />
        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Stock Alerts</h1>
      <p className="text-gray-600 mb-6">
        You'll be notified via email when these products are back in stock.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {alerts.map((alert) => {
          const product = typeof alert.productId === 'object' ? alert.productId : null;
          if (!product) return null;

          return (
            <div key={alert._id} className="bg-white rounded-lg shadow-lg overflow-hidden relative">
              <ProductCard product={product as Product} />
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Alert created: {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRemoveAlert(product._id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    <BellOff size={16} />
                    Remove Alert
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default StockAlerts;

