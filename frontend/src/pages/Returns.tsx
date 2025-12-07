import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '@/services/orders';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import { Package, ArrowLeft, RotateCcw, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

const Returns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const { data: returns, isLoading, error } = useQuery({
    queryKey: ['myReturns'],
    queryFn: () => orderService.getMyReturns()
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
      case 'completed':
        return <Truck className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

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
          message="Failed to load returns"
          retry={() => queryClient.invalidateQueries({ queryKey: ['myReturns'] })}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">My Returns</h1>
      </div>

      {!returns || returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="w-16 h-16" />}
          title="No Returns Yet"
          description="You haven't requested any returns. Return requests will appear here."
          action={
            <Link
              to="/orders"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              View Orders
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem: any) => (
            <div key={returnItem._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(returnItem.status)}
                    <h3 className="text-lg font-semibold">
                      Return #{returnItem.returnNumber || returnItem.rmaNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(returnItem.status)}`}>
                      {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Order: <Link to={`/orders/${returnItem.order}`} className="text-primary-600 hover:underline">
                      #{returnItem.orderNumber || returnItem.order}
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    Requested: {new Date(returnItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {returnItem.refundStatus && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Refund Status</p>
                    <p className={`font-semibold ${
                      returnItem.refundStatus === 'refunded' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {returnItem.refundStatus.charAt(0).toUpperCase() + returnItem.refundStatus.slice(1)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Return Items:</h4>
                <div className="space-y-2">
                  {returnItem.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} | Reason: {item.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.refundAmount?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-600">Refund Amount</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {returnItem.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm"><strong>Notes:</strong> {returnItem.notes}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/orders/${returnItem.order}`}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                >
                  View Order Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default Returns;

