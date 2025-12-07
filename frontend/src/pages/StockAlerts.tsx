import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import { Bell, X, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { Link } from 'react-router-dom';
import ConfirmationModal from '@/components/ConfirmationModal';

const StockAlerts = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: () => userService.getStockAlerts()
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (productId: string) => userService.removeStockAlert(productId),
    onSuccess: () => {
      showToast('Stock alert removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
      setDeleteAlertId(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove alert', 'error');
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load stock alerts"
          retry={() => queryClient.invalidateQueries({ queryKey: ['stockAlerts'] })}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Bell className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold">Stock Alerts</h1>
      </div>

      <p className="text-gray-600 mb-6">
        You'll receive an email notification when these products are back in stock.
      </p>

      {!alerts || alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-16 h-16" />}
          title="No Stock Alerts"
          description="You haven't set up any stock alerts yet. Visit a product page and click 'Notify Me When Back in Stock' to get alerts."
          action={
            <Link
              to="/products"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => {
            const product = alert.product;
            return (
              <div
                key={alert._id}
                className="bg-white rounded-lg shadow p-6 flex items-center gap-4"
              >
                <img
                  src={product?.images?.[0] || '/placeholder.png'}
                  alt={product?.name || 'Product'}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {product?.name || 'Product'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Alert created: {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                  {product?.inStock ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      Now In Stock!
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {product && (
                    <Link
                      to={`/products/${product.slug}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 text-sm"
                    >
                      View Product
                    </Link>
                  )}
                  <button
                    onClick={() => setDeleteAlertId(product?._id || alert._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Remove alert"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteAlertId && (
        <ConfirmationModal
          isOpen={!!deleteAlertId}
          onClose={() => setDeleteAlertId(null)}
          onConfirm={() => {
            if (deleteAlertId) {
              deleteAlertMutation.mutate(deleteAlertId);
            }
          }}
          title="Remove Stock Alert"
          message="Are you sure you want to remove this stock alert? You won't receive notifications for this product anymore."
          confirmText="Remove Alert"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteAlertMutation.isPending}
        />
      )}

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default StockAlerts;

