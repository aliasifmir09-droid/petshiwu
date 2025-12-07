import { useQuery } from '@tanstack/react-query';
import { returnService } from '@/services/returns';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Package, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { Link } from 'react-router-dom';

const Returns = () => {
  const { toast, hideToast } = useToast();

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => returnService.getMyReturns()
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <RotateCcw className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'refunded':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" ariaLabel="Loading returns" />
      </div>
    );
  }

  if (!returns || returns.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">My Returns</h1>
        <EmptyState
          icon={Package}
          title="No Returns Yet"
          description="You haven't requested any returns. Return requests will appear here once created."
        />
        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">My Returns</h1>

      <div className="space-y-6">
        {returns.map((returnItem) => (
          <div key={returnItem._id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(returnItem.status)}
                  <h2 className="text-xl font-semibold">
                    Return #{returnItem.returnNumber || returnItem.rmaNumber || returnItem._id.slice(-8)}
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Order: <Link to={`/orders/${returnItem.orderId}`} className="text-primary-600 hover:underline">
                    #{returnItem.orderId.slice(-8)}
                  </Link>
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(returnItem.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(returnItem.status)}`}>
                  {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                </span>
                {returnItem.refundStatus && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRefundStatusColor(returnItem.refundStatus)}`}>
                    Refund: {returnItem.refundStatus.charAt(0).toUpperCase() + returnItem.refundStatus.slice(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Return Items:</h3>
              <div className="space-y-3">
                {returnItem.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={typeof item.productId === 'object' ? item.productId.image : '/placeholder.png'}
                      alt={typeof item.productId === 'object' ? item.productId.name : 'Product'}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/products/${typeof item.productId === 'object' ? item.productId.slug : ''}`}
                        className="font-semibold text-primary-600 hover:underline"
                      >
                        {typeof item.productId === 'object' ? item.productId.name : 'Product'}
                      </Link>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Reason: {item.reason}</p>
                      {item.refundAmount && (
                        <p className="text-sm font-semibold text-green-600">
                          Refund: ${item.refundAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {returnItem.reason && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Return Reason:</strong> {returnItem.reason}
                </p>
              </div>
            )}

            {returnItem.returnAddress && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Return Address:</p>
                <p className="text-sm text-gray-700">
                  {returnItem.returnAddress.firstName} {returnItem.returnAddress.lastName}<br />
                  {returnItem.returnAddress.address}<br />
                  {returnItem.returnAddress.city}, {returnItem.returnAddress.state} {returnItem.returnAddress.zipCode}
                </p>
              </div>
            )}

            {returnItem.refundAmount > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-semibold text-green-800">
                  Total Refund Amount: ${returnItem.refundAmount.toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Refund Method: {returnItem.refundMethod === 'original' ? 'Original Payment Method' : 'Store Credit'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Returns;

