import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Share2, Copy, Check } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { wishlistService } from '@/services/wishlist';
import { productService } from '@/services/products';
import { wishlistShareService } from '@/services/wishlistShare';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';

const Favorites = () => {
  const { isAuthenticated } = useAuthStore();
  const { items, removeFromWishlist, cleanup } = useWishlistStore();
  const { toast, showToast, hideToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const { data: shareData } = useQuery({
    queryKey: ['wishlist-share'],
    queryFn: () => wishlistShareService.getShareLink(),
    enabled: isAuthenticated && showShareModal
  });

  useEffect(() => {
    if (shareData) {
      setShareLink(shareData.shareUrl);
    }
  }, [shareData]);

  const emailMutation = useMutation({
    mutationFn: (data: { recipientEmail: string; message?: string }) =>
      wishlistShareService.emailWishlist(data),
    onSuccess: () => {
      showToast('Wishlist sent successfully!', 'success');
      setShowShareModal(false);
      setEmail('');
      setEmailMessage('');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send wishlist', 'error');
    }
  });

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleEmailWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter recipient email', 'warning');
      return;
    }
    emailMutation.mutate({ recipientEmail: email, message: emailMessage });
  };
  
  // Clean up invalid items on mount
  useEffect(() => {
    cleanup();
  }, [cleanup]);

  // Fetch wishlist products
  const { data: wishlistProducts, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['wishlist-products', items, isAuthenticated],
    queryFn: async () => {
      if (isAuthenticated) {
        // Get from backend
        try {
          const products = await wishlistService.getWishlist();
          // Ensure all products have _id as string
          const normalizedProducts = (products || []).map((product: any) => ({
            ...product,
            _id: product._id ? String(product._id) : product._id
          }));
          return normalizedProducts;
        } catch (error: any) {
          // Don't log wishlist errors - privacy concern
          if (import.meta.env.DEV) {
            console.error('Failed to fetch wishlist from backend');
          }
          // If 404 or other error, fallback to local storage
          if (items.length === 0) return [];
          try {
            // Filter out null, undefined, or invalid IDs and convert to strings
            const validItems = items
              .map(id => String(id))
              .filter((id) => id && id.trim() !== '');
            if (validItems.length === 0) return [];
            
            const products = await Promise.all(
              validItems.map((id) => productService.getProduct(id).catch(() => null))
            );
            const validProducts = products.filter((p) => p !== null);
            // Normalize _id to strings
            return validProducts.map((product: any) => ({
              ...product,
              _id: product._id ? String(product._id) : product._id
            }));
          } catch {
            return [];
          }
        }
      } else {
        // Get from local storage (for guest users)
        if (items.length === 0) return [];
        try {
          // Filter out null, undefined, or invalid IDs and convert to strings
          const validItems = items
            .map(id => String(id))
            .filter((id) => id && id.trim() !== '');
          if (validItems.length === 0) return [];
          
          const products = await Promise.all(
            validItems.map((id) => productService.getProduct(id).catch(() => null))
          );
          const validProducts = products.filter((p) => p !== null);
          // Normalize _id to strings
          return validProducts.map((product: any) => ({
            ...product,
            _id: product._id ? String(product._id) : product._id
          }));
        } catch {
          return [];
        }
      }
    },
    enabled: true, // Always enabled so we can show empty state
    retry: 1,
    retryOnMount: false
  });

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      refetch();
    } catch (error) {
      // Don't log wishlist errors - privacy concern
      if (import.meta.env.DEV) {
        console.error('Failed to remove from wishlist');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const products = wishlistProducts || [];
  const isEmpty = products.length === 0;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center" aria-hidden="true">
            <Heart className="text-red-600" size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Favorites</h1>
            <p className="text-gray-600 mt-1">
              {isEmpty ? 'No favorite products yet' : `${products.length} favorite product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {queryError && (
        <div className="mb-8">
          <ErrorMessage
            title="Failed to load favorites"
            message="We couldn't load your favorite products. Please try again."
            onRetry={() => refetch()}
            details={queryError instanceof Error ? queryError.message : undefined}
          />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !queryError ? (
        <EmptyState
          icon={Heart}
          title="No Favorites Yet"
          description="Start adding products to your favorites by clicking the heart icon on any product."
          action={{
            label: "Browse Products",
            to: "/products"
          }}
        />
      ) : !isEmpty && (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products
              .filter((product: any) => {
                const productId = product._id ? String(product._id) : (product.id ? String(product.id) : null);
                return productId && !hasImageFailed(productId);
              })
              .map((product: any) => {
                const productId = product._id ? String(product._id) : (product.id ? String(product.id) : null);
                if (!productId) return null;
                return (
                <div key={productId} className="relative group">
                  <ProductCard product={product} />
                {/* Remove Button Overlay */}
                <button
                  onClick={() => handleRemoveFromWishlist(productId)}
                  className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
                  aria-label="Remove from favorites"
                >
                  <Trash2 className="text-red-600" size={18} />
                </button>
              </div>
            );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {isAuthenticated && (
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <Share2 size={20} />
                Share Wishlist
              </button>
            )}
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <ShoppingCart size={20} />
              Continue Shopping
            </Link>
          </div>
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Share Your Wishlist</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    {linkCopied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
              <form onSubmit={handleEmailWishlist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email to Friend</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Check out my wishlist!"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={emailMutation.isPending}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {emailMutation.isPending ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setEmail('');
                      setEmailMessage('');
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Favorites;

