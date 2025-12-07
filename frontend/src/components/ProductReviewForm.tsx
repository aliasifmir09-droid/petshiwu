import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviews';
import { Star } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface ProductReviewFormProps {
  productId: string;
  productName: string;
  orderId: string;
  onSuccess?: () => void;
}

const ProductReviewForm = ({ productId, productName, orderId, onSuccess }: ProductReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: (data: any) => reviewService.createReview(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      await queryClient.invalidateQueries({ queryKey: ['product'] }); // Invalidate product queries to refresh ratings
      await queryClient.refetchQueries({ queryKey: ['reviews', productId] });
      setShowForm(false);
      setRating(0);
      setComment('');
      showToast('Thank you for your review!', 'success');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to submit review', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please select a rating', 'warning');
      return;
    }

    reviewMutation.mutate({
      product: productId,
      orderId,
      rating,
      comment: comment.trim() || undefined
    });

    // Track review submission
    trackReviewSubmit(productId, productName, rating);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
      >
        ⭐ Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3">Review: {productName}</h4>
      
      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating > 0 && (
              <>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Comment (Optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Share your experience with this product..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={reviewMutation.isPending || rating === 0}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setRating(0);
            setComment('');
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
        >
          Cancel
        </button>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </form>
  );
};

export default ProductReviewForm;
