import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviews';
import { ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ReviewHelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
}

const ReviewHelpfulButton = ({ reviewId, helpfulCount }: ReviewHelpfulButtonProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const voteMutation = useMutation({
    mutationFn: () => reviewService.voteReviewHelpful(reviewId),
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to vote', 'error');
    }
  });

  const handleVote = () => {
    if (hasVoted) {
      showToast('You have already voted on this review', 'info');
      return;
    }
    voteMutation.mutate();
  };

  return (
    <button
      onClick={handleVote}
      disabled={hasVoted || voteMutation.isPending}
      className={`text-sm flex items-center gap-1 transition-colors ${
        hasVoted
          ? 'text-primary-600 font-semibold'
          : 'text-gray-600 hover:text-primary-600'
      } disabled:opacity-50`}
    >
      <ThumbsUp size={16} className={hasVoted ? 'fill-current' : ''} />
      Helpful ({helpfulCount + (hasVoted ? 1 : 0)})
    </button>
  );
};

export default ReviewHelpfulButton;

